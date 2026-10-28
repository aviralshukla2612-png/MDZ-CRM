import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { recalculateProjectProgress } from "@/lib/progressEngine";
import { syncTaskCompletionToEmployeeQuota } from "@/lib/quotaSync";
import { sendNotificationToUser } from "@/lib/notifications";

async function resolveAssigneeUserId(rawAssigneeId?: string | null): Promise<string | null> {
  if (!rawAssigneeId) return null;
  const cleaned = String(rawAssigneeId).trim();
  if (!cleaned || cleaned === "null" || cleaned === "undefined") return null;

  // 1. Direct User.id check
  const user = await prisma.user.findUnique({
    where: { id: cleaned },
    select: { id: true },
  });
  if (user) return user.id;

  // 2. Employee id or code
  const emp = await prisma.employee.findFirst({
    where: {
      OR: [
        { id: cleaned },
        { userId: cleaned },
        { employeeIdCode: cleaned },
      ],
    },
    select: { userId: true },
  });
  if (emp?.userId) return emp.userId;

  // 3. ProjectMembership.id
  const mem = await prisma.projectMembership.findUnique({
    where: { id: cleaned },
    include: { employee: { select: { userId: true } } },
  });
  if (mem?.employee?.userId) return mem.employee.userId;

  // 4. Fallback search by email or name
  const userByEmail = await prisma.user.findFirst({
    where: { OR: [{ email: cleaned }, { name: cleaned }] },
    select: { id: true },
  });
  return userByEmail?.id || null;
}

export async function GET(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const isEmployee = authRes.activeRole === "EMPLOYEE";

    const whereClause: any = {
      status: { not: "ARCHIVED" },
    };

    if (isEmployee) {
      const matchIds = [authRes.id];
      if (authRes.employeeId) matchIds.push(authRes.employeeId);
      whereClause.assignedToId = { in: matchIds };
    } else if (employeeId && employeeId !== "ALL") {
      const targetEmp = await prisma.employee.findFirst({
        where: {
          OR: [{ id: employeeId }, { userId: employeeId }, { employeeIdCode: employeeId }],
        },
        select: { id: true, userId: true },
      });
      const idsToMatch = [employeeId];
      if (targetEmp) {
        idsToMatch.push(targetEmp.id);
        if (targetEmp.userId) idsToMatch.push(targetEmp.userId);
      }
      whereClause.assignedToId = { in: Array.from(new Set(idsToMatch)) };
    }

    if (projectId && projectId !== "ALL") {
      whereClause.projectId = projectId;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: [
        { isMostImportant: "desc" },
        { deadline: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
            status: true,
            client: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            designation: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: tasks,
      tasks,
    });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { projectId, title } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Project is required" },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
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

    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id: projectId }, { projectNumber: projectId }],
      },
      select: { id: true, name: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const actualProjectId = project.id;
    const isAdminOrOwner = ["OWNER", "ADMIN", "SUB_ADMIN", "SALES"].includes(authRes.activeRole as string);

    // Role check: Only OWNER, ADMIN, SALES, or team members of this project can add tasks
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
          { success: false, error: "Forbidden: Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    if (body.isMostImportant === true && !isAdminOrOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Admin or Owner can set Most Important Task status" },
        { status: 403 }
      );
    }

    let resolvedAssignedToId: string | null = null;
    if (body.assignedToId) {
      resolvedAssignedToId = await resolveAssigneeUserId(body.assignedToId);
    } else if (authRes.activeRole === "EMPLOYEE") {
      resolvedAssignedToId = authRes.id;
    }

    const taskCount = await prisma.task.count({ where: { projectId: actualProjectId } });

    const newTask = await prisma.task.create({
      data: {
        projectId: actualProjectId,
        title: title.trim(),
        description: body.description ? String(body.description).trim() : null,
        priority: (body.deadline && new Date(body.deadline).getTime() < Date.now()) ? "URGENT" : (body.priority || "MEDIUM"),
        status: body.status || "TODO",
        assignedToId: resolvedAssignedToId,
        createdById: authRes.id,
        isMostImportant: isAdminOrOwner ? Boolean(body.isMostImportant) : false,
        deadline: body.deadline ? new Date(body.deadline) : null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        orderInt: typeof body.orderInt === "number" ? body.orderInt : taskCount + 1,
        completedAt: body.status === "COMPLETED" || body.status === "DONE" ? new Date() : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
            client: { select: { companyName: true } },
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            designation: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Auto-membership for assigned employee
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

      // Notify assigned user if different
      if (resolvedAssignedToId !== authRes.id) {
        try {
          await sendNotificationToUser({
            recipientId: resolvedAssignedToId,
            title: "📌 New Task Assigned to You",
            message: `${authRes.name || "A team member"} assigned task "${newTask.title}" in project "${project.name || 'Project'}" to you.`,
            urgency: newTask.priority === "URGENT" ? "HIGH" : "MEDIUM",
            linkUrl: `/projects/${actualProjectId}`,
          });
        } catch (notifErr) {
          console.warn("[TaskCreation] Failed to notify assignee:", notifErr);
        }
      }
    }

    await recalculateProjectProgress(actualProjectId);

    if (body.status === "COMPLETED" || body.status === "DONE") {
      if (resolvedAssignedToId) {
        await syncTaskCompletionToEmployeeQuota({
          userId: resolvedAssignedToId,
          taskTitle: title.trim(),
          increment: 1,
          loggedById: authRes.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      task: newTask,
      data: newTask,
    });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create task" },
      { status: 500 }
    );
  }
}
