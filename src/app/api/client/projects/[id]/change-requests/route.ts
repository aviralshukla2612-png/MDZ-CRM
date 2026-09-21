import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { verifyClientProjectAccess } from "@/lib/client-auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const projectId = params.id;

  const internalRoles = ["OWNER", "ADMIN", "SUB_ADMIN", "SALES", "EMPLOYEE"];
  if (authRes.activeRole === "CLIENT") {
    const isAuthorized = await verifyClientProjectAccess(authRes.email, projectId);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Access denied or project not found." },
        { status: 403 }
      );
    }
  } else if (!internalRoles.includes(authRes.activeRole)) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Access denied." },
      { status: 403 }
    );
  }

  try {
    const changeRequests = await prisma.changeRequest.findMany({
      where: { projectId },
      include: {
        items: true,
        approvedBy: { select: { name: true } },
      },
      orderBy: { requestSeqInt: "asc" },
    });

    const submittedRequests = changeRequests.filter(
      (cr) => cr.status !== "DRAFT" && cr.status !== "CANCELLED"
    );
    const usedCount = submittedRequests.length;
    const remainingCount = Math.max(0, 3 - usedCount);

    return NextResponse.json({
      success: true,
      changeRequests,
      quota: {
        includedCount: 3,
        usedCount,
        remainingCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch change requests:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
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

  const internalRoles = ["OWNER", "ADMIN", "SUB_ADMIN", "SALES", "EMPLOYEE"];
  if (authRes.activeRole === "CLIENT") {
    const isAuthorized = await verifyClientProjectAccess(authRes.email, projectId);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Access denied or project not found." },
        { status: 403 }
      );
    }
  } else if (!internalRoles.includes(authRes.activeRole)) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Access denied." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { title, description, items } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Request title is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one change item is required inside a request." },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectNumber: true, name: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 }
      );
    }

    // Fetch fee setting
    const feeSetting = await prisma.systemSetting.findUnique({
      where: { key: "additionalChangeRequestFee" },
    });
    const configuredFee = feeSetting ? Number(feeSetting.value) : 5000;

    // Transactional Request Creation with Sequence Uniqueness Guarantee
    const newChangeRequest = await prisma.$transaction(async (tx) => {
      const existingSubmitted = await tx.changeRequest.findMany({
        where: {
          projectId: project.id,
          status: { notIn: ["DRAFT", "CANCELLED"] },
        },
        orderBy: { requestSeqInt: "desc" },
      });

      const nextSeq = (existingSubmitted[0]?.requestSeqInt || 0) + 1;
      const isQuotaIncluded = nextSeq <= 3;
      const budgetIncreaseRequired = !isQuotaIncluded;
      const initialStatus = isQuotaIncluded ? "SUBMITTED" : "PENDING_BUDGET_APPROVAL";
      const feeAmount = isQuotaIncluded ? 0 : configuredFee;
      const reqNum = `CR-${project.projectNumber}-${nextSeq}`;

      const createdReq = await tx.changeRequest.create({
        data: {
          requestNumber: reqNum,
          projectId: project.id,
          requestedBy: authRes.name || authRes.email,
          source: "CLIENT",
          originalRequirement: title,
          requestedChange: description || title,
          reason: description,
          status: initialStatus,
          budgetIncreaseRequired,
          isQuotaIncluded,
          requestSeqInt: nextSeq,
          costImpactAmount: feeAmount,
          items: {
            create: items.map((item: any, idx: number) => ({
              title: item.title || `Change Item ${idx + 1}`,
              description: item.description || item.title || "",
              category: item.category || "GENERAL",
              status: "PENDING",
            })),
          },
        },
        include: { items: true },
      });

      await tx.activityEvent.create({
        data: {
          eventType: isQuotaIncluded ? "CHANGE_REQUEST_CREATED" : "CHANGE_REQUEST_BUDGET_REQUIRED",
          actorId: authRes.id,
          entityType: "ChangeRequest",
          entityId: createdReq.id,
          projectId: project.id,
          metadataJson: JSON.stringify({
            requestNumber: reqNum,
            seqInt: nextSeq,
            isQuotaIncluded,
            budgetIncreaseRequired,
            feeAmount,
          }),
        },
      });

      return createdReq;
    });

    // Notify Admin (Owner) and Assigned Developers
    try {
      const owners = await prisma.user.findMany({
        where: { activeRole: "OWNER", isActive: true },
        select: { id: true },
      });

      const memberships = await prisma.projectMembership.findMany({
        where: { projectId: project.id, isActive: true },
        include: { employee: { select: { userId: true } } },
      });

      const recipientIds = new Set<string>();
      owners.forEach((o) => recipientIds.add(o.id));
      memberships.forEach((m) => {
        if (m.employee?.userId) recipientIds.add(m.employee.userId);
      });
      recipientIds.delete(authRes.id);

      const seq = newChangeRequest.requestSeqInt || 1;
      const quotaLabel = seq <= 3 ? `Change ${seq}/3` : `Additional Change (#${seq})`;
      const notificationTitle = `Client Change Request: ${newChangeRequest.requestNumber}`;
      const notificationMessage = `${authRes.name || "Client"} requested changes for ${project.name}: "${title}" (${quotaLabel}).`;

      for (const recipientId of recipientIds) {
        await prisma.notification.create({
          data: {
            recipientId,
            title: notificationTitle,
            message: notificationMessage,
            urgency: "HIGH",
            linkUrl: `/projects/${project.id}`,
          },
        });
      }
    } catch (notifError) {
      console.error("Failed to send change request notifications:", notifError);
    }

    return NextResponse.json({
      success: true,
      changeRequest: newChangeRequest,
    });
  } catch (error) {
    console.error("Failed to create change request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const projectId = params.id;
  const internalRoles = ["OWNER", "ADMIN", "SUB_ADMIN", "SALES", "EMPLOYEE"];

  if (authRes.activeRole === "CLIENT") {
    const isAuthorized = await verifyClientProjectAccess(authRes.email, projectId);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Access denied or project not found." },
        { status: 403 }
      );
    }
  } else if (!internalRoles.includes(authRes.activeRole)) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Access denied." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { changeRequestId, title, description, reason, items } = body;

    if (!changeRequestId) {
      return NextResponse.json(
        { success: false, error: "Change Request ID is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.changeRequest.findFirst({
      where: { id: changeRequestId, projectId },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Change Request not found." },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedReq = await tx.changeRequest.update({
        where: { id: changeRequestId },
        data: {
          originalRequirement: title ? title.trim() : existing.originalRequirement,
          requestedChange: description ? description.trim() : existing.requestedChange,
          reason: reason !== undefined ? (reason ? reason.trim() : null) : existing.reason,
        },
      });

      if (Array.isArray(items) && items.length > 0) {
        await tx.changeRequestItem.deleteMany({
          where: { changeRequestId },
        });

        await tx.changeRequestItem.createMany({
          data: items
            .filter((item: any) => (typeof item === "string" ? item.trim() : item.title?.trim()))
            .map((item: any) => ({
              changeRequestId,
              title: typeof item === "string" ? item.trim() : item.title.trim(),
              category: "SCOPE",
              status: "PENDING",
            })),
        });
      }

      return updatedReq;
    });

    return NextResponse.json({
      success: true,
      changeRequest: updated,
    });
  } catch (error) {
    console.error("Failed to update change request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
