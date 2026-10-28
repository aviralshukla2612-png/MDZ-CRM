import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { verifyClientProjectAccess } from "@/lib/client-auth";
import { recalculateProjectProgress } from "@/lib/progressEngine";
import { sendNotificationToAdmins, sendNotificationToUser } from "@/lib/notifications";
import { syncTaskCompletionToEmployeeQuota } from "@/lib/quotaSync";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const projectId = params.id;

  const project = await prisma.project.findFirst({
    where: {
      OR: [{ id: projectId }, { projectNumber: projectId }],
    },
    select: { id: true, name: true, clientId: true },
  });

  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  }

  const actualProjectId = project.id;

  // Authorization Checks
  if (authRes.activeRole === "CLIENT") {
    const isAuthorized = await verifyClientProjectAccess(authRes.email, actualProjectId);
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }
  } else if (authRes.activeRole === "EMPLOYEE") {
    if (!authRes.employeeId) {
      return NextResponse.json({ success: false, error: "Forbidden: Employee profile missing" }, { status: 403 });
    }

    const membership = await prisma.projectMembership.findFirst({
      where: {
        projectId: actualProjectId,
        employeeId: authRes.employeeId,
        isActive: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not an assigned member of this project" },
        { status: 403 }
      );
    }
  } else if (!["OWNER", "ADMIN", "SUB_ADMIN", "SALES"].includes(authRes.activeRole as string)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const tasks = await prisma.task.findMany({
      where: {
        projectId: actualProjectId,
        status: { not: "ARCHIVED" },
        ...(authRes.activeRole === "EMPLOYEE"
          ? {
              OR: [
                { assignedToId: authRes.id },
                ...(authRes.employeeId ? [{ assignedToId: authRes.employeeId }] : []),
              ],
            }
          : {}),
      },
      orderBy: [{ isMostImportant: "desc" }, { orderInt: "asc" }, { createdAt: "asc" }],
      include: {
        assignedTo: {
          select: { id: true, name: true, designation: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    const progress = await recalculateProjectProgress(actualProjectId);

    return NextResponse.json({
      success: true,
      tasks,
      progress,
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/tasks error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const projectId = params.id;

  const project = await prisma.project.findFirst({
    where: {
      OR: [{ id: projectId }, { projectNumber: projectId }],
    },
    select: { id: true, name: true },
  });

  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  }

  const actualProjectId = project.id;
  const isAdminOrOwner = ["OWNER", "ADMIN", "SUB_ADMIN", "SALES"].includes(authRes.activeRole as string);

  // Authorization: OWNER, ADMIN, SALES, or assigned EMPLOYEE
  if (!isAdminOrOwner) {
    if (authRes.activeRole === "EMPLOYEE") {
      const membership = await prisma.projectMembership.findFirst({
        where: {
          projectId: actualProjectId,
          OR: [
            ...(authRes.employeeId ? [{ employeeId: authRes.employeeId }] : []),
            { employee: { userId: authRes.id } },
          ],
          isActive: true,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You are not authorized to add tasks to this project" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only assigned team members or Admins can create tasks" },
        { status: 403 }
      );
    }
  }

  try {
    const body = await req.json();
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "Task title is required" },
        { status: 400 }
      );
    }

    const taskDeadlineVal = body.deadline || body.dueDate || body.targetDeadline;
    if (!taskDeadlineVal) {
      return NextResponse.json(
        { success: false, error: "Task deadline (due date) is compulsory and required." },
        { status: 400 }
      );
    }

    // Security check: Only OWNER or ADMIN can set isMostImportant on task creation
    if (body.isMostImportant === true && !isAdminOrOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Admin or Owner can set Most Important Task status" },
        { status: 403 }
      );
    }

    // Robust resolution of assignedToId
    let resolvedAssignedToId: string | null = null;
    const rawAssigneeId = body.assignedToId ? String(body.assignedToId).trim() : "";
    if (rawAssigneeId && rawAssigneeId !== "null" && rawAssigneeId !== "undefined") {
      const userById = await prisma.user.findUnique({
        where: { id: rawAssigneeId },
        select: { id: true },
      });
      if (userById) {
        resolvedAssignedToId = userById.id;
      } else {
        const emp = await prisma.employee.findFirst({
          where: {
            OR: [
              { id: rawAssigneeId },
              { userId: rawAssigneeId },
              { employeeIdCode: rawAssigneeId },
            ],
          },
          select: { userId: true },
        });
        if (emp?.userId) {
          resolvedAssignedToId = emp.userId;
        } else {
          const mem = await prisma.projectMembership.findUnique({
            where: { id: rawAssigneeId },
            include: { employee: { select: { userId: true } } },
          });
          if (mem?.employee?.userId) {
            resolvedAssignedToId = mem.employee.userId;
          } else {
            const userFallback = await prisma.user.findFirst({
              where: { OR: [{ email: rawAssigneeId }, { name: rawAssigneeId }] },
              select: { id: true },
            });
            resolvedAssignedToId = userFallback?.id || null;
          }
        }
      }
    } else if (authRes.activeRole === "EMPLOYEE") {
      resolvedAssignedToId = authRes.id;
    }

    // Determine initial task order
    const taskCount = await prisma.task.count({ where: { projectId: actualProjectId } });

    const newTask = await prisma.task.create({
      data: {
        projectId: actualProjectId,
        title: body.title.trim(),
        description: body.description ? String(body.description).trim() : null,
        priority: (body.deadline && new Date(body.deadline).getTime() < Date.now()) ? "URGENT" : (body.priority || "MEDIUM"),
        status: ["PLANNING", "CURRENT", "REVISION", "COMPLETED", "TODO", "IN_PROGRESS", "DONE"].includes(body.status)
          ? body.status
          : "PLANNING",
        assignedToId: resolvedAssignedToId,
        createdById: authRes.id,
        isMostImportant: isAdminOrOwner ? Boolean(body.isMostImportant) : false,
        orderInt: typeof body.orderInt === "number" ? body.orderInt : taskCount + 1,
        completedAt: body.status === "COMPLETED" || body.status === "DONE" ? new Date() : null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        startDate: body.startDate ? new Date(body.startDate) : null,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, designation: true, avatarUrl: true },
        },
      },
    });

    // If assigned to an employee user, ensure they have membership on the project
    if (resolvedAssignedToId) {
      try {
        let targetEmp = await prisma.employee.findUnique({
          where: { userId: resolvedAssignedToId },
          select: { id: true },
        });
        if (!targetEmp) {
          targetEmp = await prisma.employee.create({
            data: {
              userId: resolvedAssignedToId,
              employeeIdCode: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
              skillsJson: "[]",
            },
            select: { id: true },
          });
        }

        if (targetEmp) {
          const existingMem = await prisma.projectMembership.findFirst({
            where: { projectId: actualProjectId, employeeId: targetEmp.id },
          });
          if (!existingMem) {
            await prisma.projectMembership.create({
              data: {
                projectId: actualProjectId,
                employeeId: targetEmp.id,
                roleInProject: "MEMBER",
                isActive: true,
                assignedById: authRes.id,
              },
            });
          } else if (!existingMem.isActive) {
            await prisma.projectMembership.update({
              where: { id: existingMem.id },
              data: { isActive: true, removedAt: null, removalReason: null },
            });
          }
        }
      } catch (memErr) {
        console.warn("[TaskCreation] Auto membership creation failed:", memErr);
      }

      // Notify assigned employee if assigned to someone else
      if (resolvedAssignedToId !== authRes.id) {
        try {
          await sendNotificationToUser({
            recipientId: resolvedAssignedToId,
            title: "📌 New Task Assigned to You",
            message: `${authRes.name || "A team member"} assigned task "${newTask.title}" in project "${project.name}" to you.`,
            urgency: newTask.priority === "URGENT" ? "HIGH" : "MEDIUM",
            linkUrl: `/projects/${actualProjectId}`,
          });
        } catch (notifErr) {
          console.warn("[TaskCreation] Failed to notify assignee:", notifErr);
        }
      }
    }

    // Recalculate Progress Engine & Update Project Cache
    const progress = await recalculateProjectProgress(actualProjectId);

    if (body.status === "COMPLETED" || body.status === "DONE") {
      if (resolvedAssignedToId) {
        await syncTaskCompletionToEmployeeQuota({
          userId: resolvedAssignedToId,
          taskTitle: body.title.trim(),
          increment: 1,
          loggedById: authRes.id,
        });
      }
    }

    // If created by employee, notify Admins & Sub-Admins
    if (authRes.activeRole === "EMPLOYEE") {
      try {
        await sendNotificationToAdmins({
          title: "📌 New Task Added by Employee",
          message: `${authRes.name} added task "${newTask.title}" to project "${project?.name || 'Project'}".`,
          urgency: "LOW",
          linkUrl: `/projects/${actualProjectId}`,
          excludeUserId: authRes.id,
        });
      } catch (notifErr) {
        console.warn("[TaskCreation] Failed to notify admins:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      task: newTask,
      progress,
    });
  } catch (error) {
    console.error("POST /api/projects/[id]/tasks error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create task" },
      { status: 500 }
    );
  }
}
