import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const slots = await prisma.eventRunOfShow.findMany({
      where: { eventId: params.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ success: true, data: slots });
  } catch (error: any) {
    console.error("Fetch Run Of Show Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch run of show" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      timeSlot,
      activity,
      responsiblePerson = "",
      department = "Stage",
      stageLocation = "Main Stage",
      status = "UPCOMING",
      cueNotes = "",
      order = 0,
    } = body;

    if (!timeSlot || !activity) {
      return NextResponse.json({ success: false, error: "Time slot and activity are required" }, { status: 400 });
    }

    const slot = await prisma.eventRunOfShow.create({
      data: {
        eventId: params.id,
        timeSlot,
        activity,
        responsiblePerson,
        department,
        stageLocation,
        status,
        cueNotes,
        order: Number(order) || 0,
      },
    });

    return NextResponse.json({ success: true, data: slot }, { status: 201 });
  } catch (error: any) {
    console.error("Create Run Of Show Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create run of show slot" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { slotId, ...updateData } = body;

    if (!slotId) {
      return NextResponse.json({ success: false, error: "slotId is required" }, { status: 400 });
    }

    const updated = await prisma.eventRunOfShow.update({
      where: { id: slotId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update Run Of Show Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update run of show slot" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const slotId = searchParams.get("slotId");

    if (!slotId) {
      return NextResponse.json({ success: false, error: "slotId is required" }, { status: 400 });
    }

    await prisma.eventRunOfShow.delete({
      where: { id: slotId },
    });

    return NextResponse.json({ success: true, message: "Run of show slot deleted" });
  } catch (error: any) {
    console.error("Delete Run Of Show Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete slot" }, { status: 500 });
  }
}
