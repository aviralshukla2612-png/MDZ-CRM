import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where: any = { eventId: params.id };
    if (type && type !== "ALL") where.type = type;

    const items = await prisma.eventTimelineItem.findMany({
      where,
      orderBy: [{ order: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error("Fetch Event Timeline Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch timeline items" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      title,
      type = "MILESTONE",
      startTime,
      endTime,
      status = "PENDING",
      dependencies = "",
      assignedTo = "",
      order = 0,
      notes = "",
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Timeline item title is required" }, { status: 400 });
    }

    const item = await prisma.eventTimelineItem.create({
      data: {
        eventId: params.id,
        title,
        type,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        status,
        dependencies,
        assignedTo,
        order: Number(order) || 0,
        notes,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    console.error("Create Timeline Item Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create timeline item" }, { status: 500 });
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

    if (updateData.startTime) updateData.startTime = new Date(updateData.startTime);
    if (updateData.endTime) updateData.endTime = new Date(updateData.endTime);

    const updated = await prisma.eventTimelineItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update Timeline Item Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update timeline item" }, { status: 500 });
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

    await prisma.eventTimelineItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true, message: "Timeline item deleted" });
  } catch (error: any) {
    console.error("Delete Timeline Item Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete timeline item" }, { status: 500 });
  }
}
