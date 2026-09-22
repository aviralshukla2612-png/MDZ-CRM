import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { title, date, endDate, type, state, description, isOptional } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Holiday title is required" }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ success: false, error: "Holiday date is required" }, { status: 400 });
    }

    const startDateObj = new Date(date);
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid holiday date" }, { status: 400 });
    }

    const endDateObj = endDate ? new Date(endDate) : null;

    const holiday = await prisma.holiday.create({
      data: {
        title: title.trim(),
        date: startDateObj,
        endDate: endDateObj,
        type: type || "COMPANY",
        country: "IN",
        state: state?.trim() || null,
        source: "ADMIN",
        description: description?.trim() || null,
        isOptional: Boolean(isOptional),
        isActive: true,
        createdById: authRes.id,
      },
    });

    try {
      await prisma.activityEvent.create({
        data: {
          eventType: "HOLIDAY_CREATED",
          actorId: authRes.id,
          entityType: "HOLIDAY",
          entityId: holiday.id,
          metadataJson: JSON.stringify({
            title: holiday.title,
            date: holiday.date,
            type: holiday.type,
            state: holiday.state,
          }),
        },
      });
    } catch {}

    return NextResponse.json({ success: true, data: holiday });
  } catch (error: any) {
    console.error("POST /api/admin/holidays error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create holiday" },
      { status: 500 }
    );
  }
}
