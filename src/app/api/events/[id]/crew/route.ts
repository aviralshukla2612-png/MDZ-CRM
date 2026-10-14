import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const crew = await prisma.eventCrewMember.findMany({
      where: { eventId: params.id },
      orderBy: [{ department: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, data: crew });
  } catch (error: any) {
    console.error("Fetch Crew Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch crew roster" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      name,
      role,
      department = "Production",
      shiftStartTime = "",
      shiftEndTime = "",
      isBackup = false,
      isFreelancer = false,
      phone = "",
      status = "SCHEDULED",
    } = body;

    if (!name || !role) {
      return NextResponse.json({ success: false, error: "Name and role are required" }, { status: 400 });
    }

    const member = await prisma.eventCrewMember.create({
      data: {
        eventId: params.id,
        name,
        role,
        department,
        shiftStartTime,
        shiftEndTime,
        isBackup: Boolean(isBackup),
        isFreelancer: Boolean(isFreelancer),
        phone,
        status,
      },
    });

    return NextResponse.json({ success: true, data: member }, { status: 201 });
  } catch (error: any) {
    console.error("Add Crew Member Error:", error);
    return NextResponse.json({ success: false, error: "Failed to add crew member" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { memberId, action, ...updateData } = body;

    if (!memberId) {
      return NextResponse.json({ success: false, error: "memberId is required" }, { status: 400 });
    }

    // Quick action handling for check-in / check-out
    if (action === "CHECK_IN") {
      updateData.status = "CHECKED_IN";
      updateData.checkInTime = new Date();
    } else if (action === "CHECK_OUT") {
      updateData.status = "CHECKED_OUT";
      updateData.checkOutTime = new Date();
    } else if (action === "HANDOVER") {
      updateData.status = "HANDED_OVER";
    }

    const updated = await prisma.eventCrewMember.update({
      where: { id: memberId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update Crew Member Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update crew member" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ success: false, error: "memberId is required" }, { status: 400 });
    }

    await prisma.eventCrewMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true, message: "Crew member removed" });
  } catch (error: any) {
    console.error("Delete Crew Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete crew member" }, { status: 500 });
  }
}
