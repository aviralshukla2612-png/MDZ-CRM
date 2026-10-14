import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { verifyClientProjectAccess } from "@/lib/client-auth";
import { sendNotificationToUser } from "@/lib/notifications";

/**
 * POST /api/client/projects/[id]/milestones/[stageId]
 *
 * Client Milestone Approval / Sign-off
 * Body: { action: "APPROVE" | "REQUEST_CHANGES", notes?: string }
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string; stageId: string } }
) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const rawId = params.id;
  const stageId = params.stageId;

  const project = await prisma.project.findFirst({
    where: { OR: [{ id: rawId }, { projectNumber: rawId }] },
    include: { client: true },
  });

  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
  }

  // Authorization check
  const internalRoles = ["OWNER", "ADMIN", "SUB_ADMIN"];
  if (authRes.activeRole === "CLIENT") {
    const isAuthorized = await verifyClientProjectAccess(authRes.email, project.id);
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "Access denied or project not found." }, { status: 403 });
    }
  } else if (!internalRoles.includes(authRes.activeRole)) {
    return NextResponse.json({ success: false, error: "Forbidden: Access denied." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, notes } = body;

    if (!["APPROVE", "REQUEST_CHANGES"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Valid action ('APPROVE' or 'REQUEST_CHANGES') is required." },
        { status: 400 }
      );
    }

    const stage = await prisma.projectStage.findFirst({
      where: { id: stageId, projectId: project.id },
    });

    if (!stage) {
      return NextResponse.json({ success: false, error: "Project stage / milestone not found." }, { status: 404 });
    }

    const isApproval = action === "APPROVE";
    const nextStatus = isApproval ? "CLIENT_APPROVED" : "REVISION_REQUESTED";

    const updatedStage = await prisma.projectStage.update({
      where: { id: stageId },
      data: {
        status: nextStatus,
        progressPercentage: isApproval ? 100 : stage.progressPercentage,
      },
    });

    // Notify Project Admins & Team
    try {
      const admins = await prisma.user.findMany({
        where: { isActive: true, activeRole: { in: ["OWNER", "ADMIN", "SUB_ADMIN"] } },
        select: { id: true },
      });

      const clientName = project.client?.companyName || authRes.name || "Client";
      const notifTitle = isApproval
        ? `✓ Milestone Approved by Client: ${stage.name}`
        : `⚠️ Client Requested Changes on Milestone: ${stage.name}`;
      const notifMsg = isApproval
        ? `${clientName} has approved and signed off on the '${stage.name}' milestone for ${project.name}.`
        : `${clientName} requested adjustments on '${stage.name}' for ${project.name}.${notes ? ` Note: "${notes}"` : ""}`;

      for (const admin of admins) {
        await sendNotificationToUser({
          recipientId: admin.id,
          title: notifTitle,
          message: notifMsg,
          urgency: isApproval ? "MEDIUM" : "HIGH",
          linkUrl: `/projects/${project.id}`,
        });
      }
    } catch (notifErr) {
      console.warn("[MilestoneApproval] Notification error:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: isApproval
        ? `Milestone '${stage.name}' approved and signed off successfully.`
        : `Change request for milestone '${stage.name}' submitted to engineering.`,
      stage: updatedStage,
    });
  } catch (error) {
    console.error("Failed to process milestone client approval:", error);
    return NextResponse.json({ success: false, error: "Failed to process milestone approval." }, { status: 500 });
  }
}
