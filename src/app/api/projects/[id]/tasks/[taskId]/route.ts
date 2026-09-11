import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { recalculateProjectProgress } from "@/lib/progressEngine";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const { id: projectId, taskId } = params;

  // Authorization: OWNER or assigned EMPLOYEE
  if (authRes.activeRole === "EMPLOYEE") {
    if (!authRes.employeeId) {
      return NextResponse.json({ success: false, error: "Forbidden: Employee profile missing" }, { status: 403 });
    }

    const membership = await prisma.projectMembership.findFirst({
      where: {
        projectId,
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
  } else if (authRes.activeRole !== "OWNER") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask || existingTask.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: "Task not found on this project" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Strict Security Rule: Only OWNER can modify isMostImportant priority flag
    if (body.isMostImportant !== undefined && authRes.activeRole !== "OWNER") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only OWNER can set or modify Most Important Task status" },
        { status: 403 }
      );
    }

    const targetAssignedToId = body.assignedToId !== undefined ? (body.assignedToId || null) : existingTask.assignedToId;
    const isReassigned = body.assignedToId !== undefined && body.assignedToId !== existingTask.assignedToId;
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
      updateData.assignedToId = body.assignedToId || null;
    }
    if (typeof body.orderInt === "number") {
      updateData.orderInt = body.orderInt;
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

    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: {
          select: { id: true, name: true, designation: true, avatarUrl: true },
        },
      },
    });

    // Recalculate Progress Engine & Update Project Cache
    const progress = await recalculateProjectProgress(projectId);

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

  // Authorization: OWNER or assigned EMPLOYEE
  if (authRes.activeRole === "EMPLOYEE") {
    if (!authRes.employeeId) {
      return NextResponse.json({ success: false, error: "Forbidden: Employee profile missing" }, { status: 403 });
    }

    const membership = await prisma.projectMembership.findFirst({
      where: {
        projectId,
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
  } else if (authRes.activeRole !== "OWNER") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask || existingTask.projectId !== projectId) {
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
    const progress = await recalculateProjectProgress(projectId);

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
