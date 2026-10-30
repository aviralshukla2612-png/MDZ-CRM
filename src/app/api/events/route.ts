import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const userRole = authRes.activeRole;
  const userDesig = (authRes.designation || "").toLowerCase();
  const userDept = (authRes.department || "").toLowerCase();
  const isHeadOfEvents =
    (userDesig.includes("head") || userDesig.includes("lead") || userDesig.includes("manager") || userDesig.includes("producer")) &&
      userDesig.includes("event") ||
    userDept.includes("event");

  if (!["ADMIN", "OWNER", "SUB_ADMIN"].includes(userRole) && !isHeadOfEvents) {
    return NextResponse.json(
      { success: false, error: "Event Management section is restricted to Admin, Sub-Admin, and Head of Event Management." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const events = await prisma.eventProject.findMany({
      where,
      include: {
        client: {
          select: { id: true, companyName: true, email: true, phone: true },
        },
        _count: {
          select: {
            timelineItems: true,
            runOfShows: true,
            crewMembers: true,
            vendors: true,
            budgetItems: true,
            marketingItems: true,
            guests: true,
            incidents: true,
            mediaItems: true,
          },
        },
        closure: true,
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    console.error("Fetch Events Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch event projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      title,
      type = "CORPORATE",
      status = "PLANNING",
      startDate,
      endDate,
      venueName,
      venueAddress = "",
      clientId,
      clientName,
      eventOwner = "Lead Producer",
      productionManager = "",
      estimatedBudget = 0,
      approvedBudget = 0,
      quotationAmount = 0,
      priority = "MEDIUM",
      riskLevel = "LOW",
      riskOverview = "",
      blockersOverview = "",
      notes = "",
    } = body;

    if (!title || !startDate || !venueName) {
      return NextResponse.json(
        { success: false, error: "Event title, start date, and venue name are required" },
        { status: 400 }
      );
    }

    let finalClientName = clientName || "Private Client";
    if (clientId && !clientName) {
      const client = await prisma.client.findUnique({ where: { id: clientId } });
      if (client) finalClientName = client.companyName;
    }

    const newEvent = await prisma.eventProject.create({
      data: {
        title,
        type,
        status,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        venueName,
        venueAddress,
        clientId: clientId || null,
        clientName: finalClientName,
        eventOwner,
        productionManager,
        estimatedBudget: Number(estimatedBudget) || 0,
        approvedBudget: Number(approvedBudget) || 0,
        quotationAmount: Number(quotationAmount) || 0,
        priority,
        riskLevel,
        riskOverview,
        blockersOverview,
        notes,
        createdById: (authRes as any)?.user?.id || null,
      },
    });

    return NextResponse.json({ success: true, data: newEvent }, { status: 201 });
  } catch (error: any) {
    console.error("Create Event Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create event project" }, { status: 500 });
  }
}
