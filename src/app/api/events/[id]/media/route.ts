import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const media = await prisma.eventMediaItem.findMany({
      where: { eventId: params.id },
      orderBy: [{ prioritySameDay: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: media });
  } catch (error: any) {
    console.error("Fetch Media Plan Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch media plan" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      shotTitle,
      coverageType = "PHOTO",
      photographer = "",
      videographer = "",
      prioritySameDay = false,
      footageTransferred = false,
      status = "PLANNED",
      deliveryUrl = "",
    } = body;

    if (!shotTitle) {
      return NextResponse.json({ success: false, error: "Shot title is required" }, { status: 400 });
    }

    const item = await prisma.eventMediaItem.create({
      data: {
        eventId: params.id,
        shotTitle,
        coverageType,
        photographer,
        videographer,
        prioritySameDay: Boolean(prioritySameDay),
        footageTransferred: Boolean(footageTransferred),
        status,
        deliveryUrl,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    console.error("Create Media Item Error:", error);
    return NextResponse.json({ success: false, error: "Failed to add media shot item" }, { status: 500 });
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

    const updated = await prisma.eventMediaItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update Media Item Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update media item" }, { status: 500 });
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

    await prisma.eventMediaItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true, message: "Media item deleted" });
  } catch (error: any) {
    console.error("Delete Media Item Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete media item" }, { status: 500 });
  }
}
