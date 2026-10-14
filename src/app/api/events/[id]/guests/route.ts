import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const rsvpStatus = searchParams.get("rsvpStatus");

    const where: any = { eventId: params.id };
    if (category && category !== "ALL") where.category = category;
    if (rsvpStatus && rsvpStatus !== "ALL") where.rsvpStatus = rsvpStatus;

    const guests = await prisma.eventGuest.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const totalCount = guests.length;
    const checkedInCount = guests.filter((g) => g.isCheckedIn).length;
    const attendingCount = guests.filter((g) => g.rsvpStatus === "ATTENDING").length;
    const vipCount = guests.filter((g) => g.category === "VIP").length;
    const compCount = guests.filter((g) => g.passType === "COMPLIMENTARY").length;

    return NextResponse.json({
      success: true,
      data: {
        guests,
        stats: {
          totalCount,
          checkedInCount,
          attendingCount,
          vipCount,
          compCount,
          checkInRate: totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0,
        },
      },
    });
  } catch (error: any) {
    console.error("Fetch Guests Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch event guests" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      name,
      email = "",
      phone = "",
      category = "GENERAL",
      accessRights = "ALL_ACCESS",
      rsvpStatus = "ATTENDING",
      ticketCode,
      passType = "REGULAR",
      complimentaryApproved = false,
      notes = "",
    } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Guest name is required" }, { status: 400 });
    }

    const generatedTicketCode = ticketCode || `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const guest = await prisma.eventGuest.create({
      data: {
        eventId: params.id,
        name,
        email,
        phone,
        category,
        accessRights,
        rsvpStatus,
        ticketCode: generatedTicketCode,
        passType,
        complimentaryApproved: Boolean(complimentaryApproved),
        notes,
      },
    });

    return NextResponse.json({ success: true, data: guest }, { status: 201 });
  } catch (error: any) {
    console.error("Register Guest Error:", error);
    return NextResponse.json({ success: false, error: "Failed to register guest" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { guestId, action, ...updateData } = body;

    if (!guestId) {
      return NextResponse.json({ success: false, error: "guestId is required" }, { status: 400 });
    }

    if (action === "TOGGLE_CHECK_IN") {
      const current = await prisma.eventGuest.findUnique({ where: { id: guestId } });
      const nextCheckedIn = !current?.isCheckedIn;
      updateData.isCheckedIn = nextCheckedIn;
      updateData.checkInTime = nextCheckedIn ? new Date() : null;
    }

    const updated = await prisma.eventGuest.update({
      where: { id: guestId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update Guest Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update guest" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get("guestId");

    if (!guestId) {
      return NextResponse.json({ success: false, error: "guestId is required" }, { status: 400 });
    }

    await prisma.eventGuest.delete({
      where: { id: guestId },
    });

    return NextResponse.json({ success: true, message: "Guest removed" });
  } catch (error: any) {
    console.error("Delete Guest Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete guest" }, { status: 500 });
  }
}
