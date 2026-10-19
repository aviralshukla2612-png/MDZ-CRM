import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { syncTaskCompletionToEmployeeQuota } from "@/lib/quotaSync";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");
    const stage = searchParams.get("stage");

    const where: any = { profileId: params.id };
    if (platform && platform !== "ALL") where.platform = platform;
    if (stage && stage !== "ALL") where.productionStage = stage;

    const items = await prisma.personalBrandContent.findMany({
      where,
      orderBy: [{ scheduledDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch content" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      title,
      hook,
      topic,
      platform,
      contentType,
      priority,
      scriptText,
      caption,
      hashtags,
      trendingReferenceUrl,
      productionStage,
      scriptwriterId,
      videoEditorId,
      designerId,
      scheduledDate,
      publishedUrl,
      clientApproved,
      clientFeedback,
      approvalDeadline,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Title or topic is required" }, { status: 400 });
    }

    const newItem = await prisma.personalBrandContent.create({
      data: {
        profileId: params.id,
        title: title.trim(),
        hook: hook || "",
        topic: topic || "",
        platform: platform || "INSTAGRAM",
        contentType: contentType || "REEL",
        priority: priority || "MEDIUM",
        scriptText: scriptText || "",
        caption: caption || "",
        hashtags: hashtags || "",
        trendingReferenceUrl: trendingReferenceUrl || "",
        productionStage: productionStage || "IDEA",
        scriptwriterId: scriptwriterId || null,
        videoEditorId: videoEditorId || null,
        designerId: designerId || null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        publishedUrl: publishedUrl || "",
        clientApproved: Boolean(clientApproved),
        clientFeedback: clientFeedback || "",
        approvalDeadline: approvalDeadline ? new Date(approvalDeadline) : null,
      },
    });

    return NextResponse.json({ success: true, data: newItem });
  } catch (error: any) {
    console.error("Create Content Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create content item" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { contentId, ...updates } = body;

    if (!contentId) {
      return NextResponse.json({ success: false, error: "contentId is required" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    const allowed = [
      "title",
      "hook",
      "topic",
      "platform",
      "contentType",
      "priority",
      "scriptText",
      "caption",
      "hashtags",
      "trendingReferenceUrl",
      "productionStage",
      "scriptwriterId",
      "videoEditorId",
      "designerId",
      "publishedUrl",
      "clientApproved",
      "clientFeedback",
    ];

    allowed.forEach((k) => {
      if (updates[k] !== undefined) dataToUpdate[k] = updates[k];
    });

    if (updates.scheduledDate !== undefined) {
      dataToUpdate.scheduledDate = updates.scheduledDate ? new Date(updates.scheduledDate) : null;
    }
    if (updates.approvalDeadline !== undefined) {
      dataToUpdate.approvalDeadline = updates.approvalDeadline ? new Date(updates.approvalDeadline) : null;
    }

    const updated = await prisma.personalBrandContent.update({
      where: { id: contentId },
      data: dataToUpdate,
    });

    // Auto-sync completed reel/content to employee daily quota
    if (updates.productionStage && ["PUBLISHED", "CLIENT_APPROVED"].includes(updates.productionStage)) {
      const assignee = updated.videoEditorId || updated.designerId || updated.scriptwriterId;
      if (assignee) {
        await syncTaskCompletionToEmployeeQuota({
          userId: assignee,
          taskTitle: updated.title,
          increment: 1,
          loggedById: authRes.id,
          unit: updated.contentType === "REEL" ? "reels" : "units",
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update Content Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update content item" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get("contentId");

    if (!contentId) {
      return NextResponse.json({ success: false, error: "contentId is required" }, { status: 400 });
    }

    await prisma.personalBrandContent.delete({
      where: { id: contentId },
    });

    return NextResponse.json({ success: true, message: "Content item deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to delete content item" }, { status: 500 });
  }
}
