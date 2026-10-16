import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { calculateProgressFromProjectData, isTaskCompleted, isTaskActive } from "@/lib/progressEngine";

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
        changeRequests: {
          include: {
            items: true,
            approvedBy: { select: { name: true } },
          },
          orderBy: { requestSeqInt: "asc" },
        },
        clientUpdates: {
          include: { author: true },
          orderBy: { createdAt: "desc" },
        },
        memberships: {
          include: { employee: { include: { user: true } } },
        },
        chatConversations: {
          where: { type: "PROJECT" },
          take: 1,
          include: {
            messages: {
              take: 20,
              orderBy: { createdAt: "desc" },
              include: {
                sender: {
                  select: { id: true, name: true, avatarUrl: true, designation: true, activeRole: true },
                },
                attachments: {
                  include: {
                    media: {
                      select: { id: true, fileName: true, originalName: true, mimeType: true, fileSize: true },
                    },
                  },
                },
              },
            },
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, avatarUrl: true, designation: true },
                },
              },
            },
          },
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

    const activeTasks = project.tasks ? project.tasks.filter((t) => isTaskActive(t.status)) : [];
    const calculatedProgress = calculateProgressFromProjectData({
      status: project.status,
      progressPercentage: project.progressPercentage,
      tasks: activeTasks,
      clientUpdatesCount: project.clientUpdates?.length,
    });

    const projectWithProgress: any = {
      ...project,
      progressPercentage: calculatedProgress,
    };

    // Strict privacy rule: only OWNER, ADMIN, and SUB_ADMIN can see project price & financials
    const isAdminOrSubAdmin = ["OWNER", "ADMIN", "SUB_ADMIN"].includes(authRes.activeRole);
    if (!isAdminOrSubAdmin) {
      delete projectWithProgress.contractValue;
      delete projectWithProgress.paidValue;
      delete projectWithProgress.overdueValue;
      delete projectWithProgress.invoices;
      delete projectWithProgress.paymentMilestones;
    }

    if (authRes.activeRole === "EMPLOYEE") {
      const targetEmpId = authRes.employeeId || project.memberships.find(m => m.employee?.userId === authRes.id)?.employeeId;
      projectWithProgress.tasks = (project.tasks || []).filter(
        (t: any) =>
          t.assignedToId === authRes.id ||
          t.assignedTo?.id === authRes.id ||
          (targetEmpId && (t.assignedToId === targetEmpId || t.assignedTo?.id === targetEmpId))
      );
    }

    const conversation = project.chatConversations?.[0] || null;
    projectWithProgress.conversation = conversation
      ? {
          id: conversation.id,
          name: conversation.name,
          messageCount: conversation.messages?.length || 0,
          recentMessages: [...(conversation.messages || [])].reverse(),
          participants: conversation.participants?.map((p) => p.user) || [],
        }
      : null;
    projectWithProgress.messageCount = conversation?.messages?.length || 0;

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
    if (body.description !== undefined) updateData.description = body.description;
    if (body.scopeText !== undefined) updateData.scopeText = body.scopeText;
    if (body.scopeItems !== undefined) {
      if (Array.isArray(body.scopeItems)) {
        updateData.scopeText = body.scopeItems.filter((s: any) => typeof s === "string" && s.trim().length > 0).join("\n");
      } else if (typeof body.scopeItems === "string") {
        updateData.scopeText = body.scopeItems;
      }
    }
    if (body.contractValue !== undefined) {
      updateData.contractValue = body.contractValue !== null && body.contractValue !== "" ? parseFloat(body.contractValue) : 0;
    }
    if (body.progressPercentage !== undefined) {
      updateData.progressPercentage = body.progressPercentage;
      if (Number(body.progressPercentage) >= 100 && !body.status) {
        updateData.status = "COMPLETED";
      }
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
      const s = String(body.status).trim().toUpperCase();
      if (s === "COMPLETED" || s === "DONE" || s === "DELIVERED" || s === "WON" || s === "COMPLETE" || s === "RESOLVED" || s === "FINISHED") {
        updateData.progressPercentage = 100;
      }
    }
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.stagingUrl !== undefined) updateData.stagingUrl = body.stagingUrl;
    if (body.liveUrl !== undefined) updateData.liveUrl = body.liveUrl;
    if (body.designUrl !== undefined) updateData.designUrl = body.designUrl;
    if (body.deadline !== undefined || body.targetDeadline !== undefined) {
      const deadlineVal = body.deadline !== undefined ? body.deadline : body.targetDeadline;
      updateData.targetDeadline = deadlineVal ? new Date(deadlineVal) : null;
      if (updateData.targetDeadline && updateData.targetDeadline.getTime() < Date.now()) {
        const nextStatus = (body.status || "").toUpperCase();
        if (!["COMPLETED", "DONE", "DELIVERED", "WON", "CANCELLED"].includes(nextStatus)) {
          updateData.priority = "URGENT";
        }
      }
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
