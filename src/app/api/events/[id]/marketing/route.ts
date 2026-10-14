import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const items = await prisma.eventMarketingItem.findMany({
      where: { eventId: params.id },
      orderBy: [{ scheduledDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error("Fetch Marketing Items Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch marketing items" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      title,
      type = "POSTER",
      platform = "INSTAGRAM",
      scheduledDate,
      assignee = "",
      approvalStatus = "DRAFT",
      publishingStatus = "PENDING",
      campaignPerformance = "",
      creativeUrl = "",
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    const item = await prisma.eventMarketingItem.create({
      data: {
        eventId: params.id,
        title,
        type,
        platform,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        assignee,
        approvalStatus,
        publishingStatus,
        campaignPerformance,
        creativeUrl,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    console.error("Create Marketing Item Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create marketing item" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { itemId, ...updateData } = body;

    if (!itemId) {
      return NextResponse.json({ success: false, error: "itemId is required" }, { status: 400 });
    }

    if (updateData.scheduledDate) updateData.scheduledDate = new Date(updateData.scheduledDate);

    const updated = await prisma.eventMarketingItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update Marketing Item Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update marketing item" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ success: false, error: "itemId is required" }, { status: 400 });
    }

    await prisma.eventMarketingItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true, message: "Marketing item deleted" });
  } catch (error: any) {
    console.error("Delete Marketing Item Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete marketing item" }, { status: 500 });
  }
}
