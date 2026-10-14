import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string; requestId: string } }
) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  const rawId = params.id;
  const requestId = params.requestId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findFirst({
        where: { OR: [{ id: rawId }, { projectNumber: rawId }] },
        select: { id: true, name: true, contractValue: true },
      });

      if (!project) {
        throw { status: 404, message: "Project not found." };
      }

      const changeRequest = await tx.changeRequest.findFirst({
        where: { id: requestId, projectId: project.id },
        include: { items: true },
      });

      if (!changeRequest) {
        throw { status: 404, message: "Change request not found for this project." };
      }

      // IDEMPOTENCY CHECK: If already approved, return without double-increasing budget!
      if (changeRequest.status === "APPROVED") {
        return {
          alreadyApproved: true,
          changeRequest,
          contractValue: project.contractValue,
        };
      }

      if (changeRequest.status !== "PENDING_BUDGET_APPROVAL") {
        throw {
          status: 400,
          message: `Cannot approve request with status '${changeRequest.status}'. Only PENDING_BUDGET_APPROVAL requests can be approved.`,
        };
      }

      const approvedFee = changeRequest.costImpactAmount || 5000;
      const oldContractValue = project.contractValue;
      const newContractValue = oldContractValue + approvedFee;

      // 1. Update ChangeRequest
      const updatedReq = await tx.changeRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          approvedById: authRes.id,
          approvedAt: new Date(),
        },
        include: { items: true, approvedBy: { select: { name: true } } },
      });

      // 2. Increase Project contractValue
      const updatedProject = await tx.project.update({
        where: { id: project.id },
        data: {
          contractValue: newContractValue,
        },
        select: { id: true, name: true, contractValue: true },
      });

      // 3. Record Audit Event
      await tx.activityEvent.create({
        data: {
          eventType: "CHANGE_REQUEST_BUDGET_APPROVED",
          actorId: authRes.id,
          entityType: "ChangeRequest",
          entityId: requestId,
          projectId: project.id,
          metadataJson: JSON.stringify({
            requestNumber: changeRequest.requestNumber,
            approvedFee,
            oldContractValue,
            newContractValue,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return {
        alreadyApproved: false,
        changeRequest: updatedReq,
        contractValue: updatedProject.contractValue,
      };
    });

    return NextResponse.json({
      success: true,
      alreadyApproved: result.alreadyApproved,
      data: result.changeRequest,
      contractValue: result.contractValue,
      message: result.alreadyApproved
        ? "Change request budget is already approved."
        : "Budget increase approved and project contract value updated.",
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error("Failed to approve change request budget:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
