import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const event = await prisma.eventProject.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: { id: true, companyName: true, email: true, phone: true },
        },
        timelineItems: {
          orderBy: [{ order: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
        },
        runOfShows: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        },
        crewMembers: {
          orderBy: [{ department: "asc" }, { name: "asc" }],
        },
        vendors: {
          orderBy: [{ category: "asc" }, { vendorName: "asc" }],
        },
        budgetItems: {
          orderBy: [{ category: "asc" }, { createdAt: "desc" }],
        },
        marketingItems: {
          orderBy: [{ scheduledDate: "asc" }, { createdAt: "desc" }],
        },
        guests: {
          orderBy: [{ category: "asc" }, { name: "asc" }],
        },
        incidents: {
          orderBy: [{ createdAt: "desc" }],
        },
        mediaItems: {
          orderBy: [{ prioritySameDay: "desc" }, { createdAt: "desc" }],
        },
        closure: true,
      },
    });

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error: any) {
    console.error("Get Event Detail Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch event detail" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();

    const updateData: any = { ...body };
    delete updateData.id;
    delete updateData.timelineItems;
    delete updateData.runOfShows;
    delete updateData.crewMembers;
    delete updateData.vendors;
    delete updateData.budgetItems;
    delete updateData.marketingItems;
    delete updateData.guests;
    delete updateData.incidents;
    delete updateData.mediaItems;
    delete updateData.closure;
    delete updateData.client;
    delete updateData._count;

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.estimatedBudget !== undefined) updateData.estimatedBudget = Number(updateData.estimatedBudget);
    if (updateData.approvedBudget !== undefined) updateData.approvedBudget = Number(updateData.approvedBudget);
    if (updateData.quotationAmount !== undefined) updateData.quotationAmount = Number(updateData.quotationAmount);
    if (updateData.actualCost !== undefined) updateData.actualCost = Number(updateData.actualCost);

    const updated = await prisma.eventProject.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update Event Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    await prisma.eventProject.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error: any) {
    console.error("Delete Event Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete event" }, { status: 500 });
  }
}
