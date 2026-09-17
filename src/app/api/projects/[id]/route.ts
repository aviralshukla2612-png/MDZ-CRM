import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  if (authRes.activeRole === "CLIENT") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const project = await prisma.project.findFirst({
      where: { OR: [{ id: params.id }, { projectNumber: params.id }] },
      include: {
        client: true,
        tasks: true,
        documents: true,
        changeRequests: true,
        clientUpdates: {
          include: { author: true },
          orderBy: { createdAt: "desc" },
        },
        memberships: {
          include: { employee: { include: { user: true } } },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    if (authRes.activeRole === "EMPLOYEE") {
      const isAssigned = project.memberships.some(
        (m) =>
          ((authRes.employeeId && m.employeeId === authRes.employeeId) ||
            m.employee?.userId === authRes.id) &&
          m.isActive
      );
      if (!isAssigned) {
        return NextResponse.json({ success: false, error: "Forbidden: You are not assigned to this project" }, { status: 403 });
      }
    }

    const activeTasks = project.tasks ? project.tasks.filter((t) => t.status !== "ARCHIVED") : [];
    const totalTasks = activeTasks.length;
    const completedTasks = activeTasks.filter(
      (t) => t.status === "COMPLETED" || t.status === "DONE"
    ).length;

    let calculatedProgress = 0;
    if (totalTasks > 0) {
      calculatedProgress = Math.round((completedTasks / totalTasks) * 100);
    } else if (project.status === "COMPLETED") {
      calculatedProgress = 100;
    } else if (project.clientUpdates && project.clientUpdates.length > 0) {
      calculatedProgress = Math.min(100, project.clientUpdates.length * 25);
    }

    const projectWithProgress: any = {
      ...project,
      progressPercentage: calculatedProgress,
    };

    // Strict privacy rule: employees cannot see client or project price, and can only see tasks assigned to them
    if (authRes.activeRole === "EMPLOYEE") {
      delete projectWithProgress.contractValue;
      delete projectWithProgress.paidValue;
      delete projectWithProgress.overdueValue;
      delete projectWithProgress.invoices;
      delete projectWithProgress.paymentMilestones;
      const targetEmpId = authRes.employeeId || project.memberships.find(m => m.employee?.userId === authRes.id)?.employeeId;
      if (targetEmpId) {
        projectWithProgress.tasks = (project.tasks || []).filter(
          (t: any) => t.assignedToId === targetEmpId || t.assignedTo?.id === targetEmpId
        );
      }
    }

    return NextResponse.json({ success: true, data: projectWithProgress });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN", "SALES", "EMPLOYEE"]);
  if (authRes instanceof NextResponse) return authRes;

  if (authRes.activeRole === "EMPLOYEE") {
    const isAssigned = await prisma.projectMembership.findFirst({
      where: {
        AND: [
          {
            OR: [
              { projectId: params.id },
              { project: { projectNumber: params.id } },
            ],
          },
          {
            OR: [
              ...(authRes.employeeId ? [{ employeeId: authRes.employeeId }] : []),
              { employee: { userId: authRes.id } },
            ],
          },
          { isActive: true },
        ],
      },
    });
    if (!isAssigned) {
      return NextResponse.json({ success: false, error: "Forbidden: You are not assigned to this project" }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.progressPercentage !== undefined) updateData.progressPercentage = body.progressPercentage;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.contractValue !== undefined) updateData.contractValue = body.contractValue;
    if (body.deadline !== undefined || body.targetDeadline !== undefined) {
      const deadlineVal = body.deadline !== undefined ? body.deadline : body.targetDeadline;
      updateData.targetDeadline = deadlineVal ? new Date(deadlineVal) : null;
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete project" }, { status: 500 });
  }
}
