import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { syncIndianHolidays } from "@/lib/holidaySync";

function parseFlexibleDate(dateInput: string): Date | null {
  if (!dateInput) return null;

  let d = new Date(dateInput);
  if (!isNaN(d.getTime())) return d;

  const parts = dateInput.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else if (parts[2].length === 4) {
      d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export async function GET(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month"); // 1-12 or 0-11
    const state = searchParams.get("state");
    const type = searchParams.get("type");
    const active = searchParams.get("active"); // "true" or "false" or null

    const where: any = {};

    if (active !== "false" && active !== "all") {
      where.isActive = true;
    } else if (active === "false") {
      where.isActive = false;
    }

    if (type && type !== "ALL") {
      where.type = type.toUpperCase();
    }

    if (state && state !== "ALL") {
      where.OR = [{ state: null }, { state: "" }, { state: state }];
    }

    const y = year ? parseInt(year, 10) : new Date().getFullYear();

    if (month !== null && month !== undefined) {
      const m = parseInt(month, 10);
      // Normalize month (support both 0-indexed or 1-indexed)
      const monthIndex = m >= 1 && m <= 12 ? m - 1 : m;
      where.date = {
        gte: new Date(y, monthIndex, 1, 0, 0, 0),
        lte: new Date(y, monthIndex + 1, 0, 23, 59, 59),
      };
    } else {
      where.date = {
        gte: new Date(y, 0, 1, 0, 0, 0),
        lte: new Date(y, 11, 31, 23, 59, 59),
      };
    }

    let holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });

    // If no holidays found in DB for this year, automatically auto-seed from fallback / Google sync!
    if (holidays.length === 0 && y >= 2024 && y <= 2030) {
      try {
        await syncIndianHolidays(y);
        holidays = await prisma.holiday.findMany({
          where,
          orderBy: { date: "asc" },
        });
      } catch (err) {
        console.warn(`Auto-sync for year ${y} failed:`, err);
      }
    }

    return NextResponse.json({ success: true, data: holidays });
  } catch (error: any) {
    console.error("GET /api/holidays error:", error);
    return NextResponse.json({ success: false, data: [] });
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { title, date, endDate, type, state, description, isOptional } = body;

    if (!title || !date) {
      return NextResponse.json(
        { success: false, error: "Title and Date are required" },
        { status: 400 }
      );
    }

    const holidayDate = parseFlexibleDate(String(date));
    if (!holidayDate) {
      return NextResponse.json(
        { success: false, error: "Invalid date format. Please use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const holidayEndDate = endDate ? parseFlexibleDate(String(endDate)) : null;

    const holiday = await prisma.holiday.create({
      data: {
        title: title.trim(),
        date: holidayDate,
        endDate: holidayEndDate,
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

    // Log ActivityEvent
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
    console.error("POST /api/holidays error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create holiday" },
      { status: 500 }
    );
  }
}
