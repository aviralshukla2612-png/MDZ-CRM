import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { recalculateProjectProgress } from "@/lib/progressEngine";
import { sendNotificationToUser } from "@/lib/notifications";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const { id: projectId, taskId } = params;

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

  // Authorization: OWNER, ADMIN, SALES or assigned EMPLOYEE / task assignee
  if (!isAdminOrOwner) {
    if (authRes.activeRole === "EMPLOYEE") {
      const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
      const isTaskAssignee =
        existingTask?.assignedToId === authRes.id ||
        (authRes.employeeId && existingTask?.assignedToId === authRes.employeeId);

      const membership = authRes.employeeId
        ? await prisma.projectMembership.findFirst({
            where: {
              projectId: actualProjectId,
              employeeId: authRes.employeeId,
              isActive: true,
            },
          })
        : null;

      if (!membership && !isTaskAssignee) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You are not authorized to edit this task" },
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

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask || existingTask.projectId !== actualProjectId) {
      return NextResponse.json(
        { success: false, error: "Task not found on this project" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Security Rule: Only OWNER or ADMIN can modify isMostImportant priority flag
    if (body.isMostImportant !== undefined && !isAdminOrOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Admin or Owner can set or modify Most Important Task status" },
        { status: 403 }
      );
    }

    // Robust resolution of assignedToId: supports User.id, Employee.id, Employee.userId, or ProjectMembership.id
    let resolvedAssignedToId: string | null = existingTask.assignedToId;
    let isReassigned = false;

    if (body.assignedToId !== undefined) {
      const rawAssigneeId = body.assignedToId ? String(body.assignedToId).trim() : "";
      if (!rawAssigneeId || rawAssigneeId === "null" || rawAssigneeId === "undefined") {
        resolvedAssignedToId = null;
      } else {
        // 1. Check if rawAssigneeId is already a valid User.id
        const userById = await prisma.user.findUnique({
          where: { id: rawAssigneeId },
          select: { id: true },
        });

        if (userById) {
          resolvedAssignedToId = userById.id;
        } else {
          // 2. Check if it is an Employee id or code
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
            // 3. Check if it is a ProjectMembership id
            const mem = await prisma.projectMembership.findUnique({
              where: { id: rawAssigneeId },
              include: { employee: { select: { userId: true } } },
            });

            if (mem?.employee?.userId) {
              resolvedAssignedToId = mem.employee.userId;
            } else {
              // 4. Fallback search by email or name
              const userFallback = await prisma.user.findFirst({
                where: { OR: [{ email: rawAssigneeId }, { name: rawAssigneeId }] },
                select: { id: true },
              });
              resolvedAssignedToId = userFallback?.id || null;
            }
          }
        }
      }
      isReassigned = resolvedAssignedToId !== existingTask.assignedToId;
    }

    const targetAssignedToId = resolvedAssignedToId;
    const targetStatus = body.status !== undefined ? body.status : existingTask.status;
    const isInactive = targetStatus === "COMPLETED" || targetStatus === "DONE" || targetStatus === "ARCHIVED";

    if (body.isMostImportant === true) {
      if (!targetAssignedToId) {
        return NextResponse.json(
          { success: false, error: "Task must be assigned to an employee before it can be marked as Most Important" },
          { status: 400 }
        );
      }
      if (isInactive) {
        return NextResponse.json(
          { success: false, error: "Completed or archived tasks cannot be marked as Most Important" },
          { status: 400 }
        );
      }
    }

    let finalIsMostImportant = existingTask.isMostImportant;
    if (body.isMostImportant !== undefined) {
      finalIsMostImportant = Boolean(body.isMostImportant);
    }

    // Auto-clear priority if reassigned or completed/archived
    if (isReassigned || isInactive) {
      finalIsMostImportant = false;
    }

    const updateData: any = {};
    if (typeof body.title === "string" && body.title.trim()) {
      updateData.title = body.title.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description ? String(body.description).trim() : null;
    }
    if (body.priority !== undefined) {
      updateData.priority = body.priority;
    }
    if (body.assignedToId !== undefined) {
      updateData.assignedToId = resolvedAssignedToId;
    }
    if (typeof body.orderInt === "number") {
      updateData.orderInt = body.orderInt;
    }
    if (body.deadline !== undefined) {
      updateData.deadline = body.deadline ? new Date(body.deadline) : null;
      if (updateData.deadline && new Date(updateData.deadline).getTime() < Date.now()) {
        const nextStatus = body.status || existingTask.status;
        if (nextStatus !== "COMPLETED" && nextStatus !== "DONE") {
          updateData.priority = "URGENT";
        }
      }
    }
    if (body.startDate !== undefined) {
      updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    }

    updateData.isMostImportant = finalIsMostImportant;

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "COMPLETED" || body.status === "DONE") {
        updateData.completedAt = existingTask.completedAt || new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    // Single Most Important Task Per Employee Rule: Clear any existing priority for this employee in transaction
    if (finalIsMostImportant && targetAssignedToId) {
      await prisma.$transaction([
        prisma.task.updateMany({
          where: {
            assignedToId: targetAssignedToId,
            status: { notIn: ["COMPLETED", "DONE", "ARCHIVED"] },
            id: { not: taskId },
          },
          data: { isMostImportant: false },
        }),
        prisma.task.update({
          where: { id: taskId },
          data: updateData,
        }),
      ]);
    } else {
      await prisma.task.update({
        where: { id: taskId },
        data: updateData,
      });
    }

    // If reassigned to a user with an employee profile, ensure they are an active project member
    if (resolvedAssignedToId && isReassigned) {
      try {
        const targetEmployee = await prisma.employee.findUnique({
          where: { userId: resolvedAssignedToId },
          select: { id: true },
        });

        if (targetEmployee) {
          const existingMem = await prisma.projectMembership.findFirst({
            where: {
              projectId,
              employeeId: targetEmployee.id,
            },
          });

          if (!existingMem) {
            await prisma.projectMembership.create({
              data: {
                projectId,
                employeeId: targetEmployee.id,
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
        console.warn("[TaskReassign] Failed to auto-assign project membership:", memErr);
      }

      // Send Realtime & Push Notification to newly assigned employee
      if (resolvedAssignedToId !== authRes.id) {
        try {
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { name: true },
          });
          await sendNotificationToUser({
            recipientId: resolvedAssignedToId,
            title: "📌 Task Reassigned to You",
            message: `${authRes.name || "A team member"} assigned task "${updateData.title || existingTask.title}" in project "${project?.name || "Project"}" to you.`,
            urgency: "MEDIUM",
            linkUrl: `/projects/${projectId}`,
          });
        } catch (notifErr) {
          console.warn("[TaskReassign] Failed to dispatch notification:", notifErr);
        }
      }
    }

    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: {
          select: { id: true, name: true, designation: true, avatarUrl: true },
        },
      },
    });

    // Recalculate Progress Engine & Update Project Cache
    const progress = await recalculateProjectProgress(actualProjectId);

    return NextResponse.json({
      success: true,
      task: updatedTask,
      progress,
    });
  } catch (error) {
    console.error("PATCH /api/projects/[id]/tasks/[taskId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const { id: projectId, taskId } = params;

  const project = await prisma.project.findFirst({
    where: {
      OR: [{ id: projectId }, { projectNumber: projectId }],
    },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json(
      { success: false, error: "Project not found" },
      { status: 404 }
    );
  }

  const actualProjectId = project.id;

  // Authorization: OWNER or assigned EMPLOYEE
  if (authRes.activeRole === "EMPLOYEE") {
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
        { success: false, error: "Forbidden: You are not authorized to remove tasks from this project" },
        { status: 403 }
      );
    }
  } else if (!["OWNER", "ADMIN", "SUB_ADMIN"].includes(authRes.activeRole as string)) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask || existingTask.projectId !== actualProjectId) {
      return NextResponse.json(
        { success: false, error: "Task not found on this project" },
        { status: 404 }
      );
    }

    // Non-destructive archiving: set status to "ARCHIVED" and clear isMostImportant flag
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "ARCHIVED", isMostImportant: false },
    });

    // Recalculate Progress Engine & Update Project Cache
    const progress = await recalculateProjectProgress(actualProjectId);

    return NextResponse.json({
      success: true,
      message: "Task archived successfully",
      progress,
    });
  } catch (error) {
    console.error("DELETE /api/projects/[id]/tasks/[taskId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to archive task" },
      { status: 500 }
    );
  }
}
