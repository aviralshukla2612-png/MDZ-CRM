import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const feedbacks = await prisma.personalBrandFeedback.findMany({
      where: { profileId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: feedbacks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch feedbacks" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { contentId, requestedBy, feedbackText, changeRequested, deadline, status } = body;

    if (!feedbackText || !feedbackText.trim()) {
      return NextResponse.json({ success: false, error: "Feedback details are required" }, { status: 400 });
    }

    const item = await prisma.personalBrandFeedback.create({
      data: {
        profileId: params.id,
        contentId: contentId || null,
        requestedBy: requestedBy || "Client",
        feedbackText: feedbackText.trim(),
        changeRequested: changeRequested || "",
        deadline: deadline ? new Date(deadline) : null,
        status: status || "OPEN",
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error("Feedback Create Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to log feedback" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { feedbackId, status, changeRequested, deadline } = body;

    if (!feedbackId) {
      return NextResponse.json({ success: false, error: "feedbackId is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (changeRequested !== undefined) updateData.changeRequested = changeRequested;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;

    const updated = await prisma.personalBrandFeedback.update({
      where: { id: feedbackId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update feedback" }, { status: 500 });
  }
}
