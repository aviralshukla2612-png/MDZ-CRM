import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function parseFlexibleDate(dateInput: string): Date | null {
  if (!dateInput) return null;

  // Try standard Date parsing
  let d = new Date(dateInput);
  if (!isNaN(d.getTime())) return d;

  // Handle DD-MM-YYYY or DD/MM/YYYY or YYYY-MM-DD
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

    let where: any = {};
    if (year) {
      const y = parseInt(year);
      where.date = {
        gte: new Date(y, 0, 1),
        lte: new Date(y, 11, 31, 23, 59, 59),
      };
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ success: true, data: holidays });
  } catch (error: any) {
    console.error("GET /api/holidays error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch holidays" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { title, date, description, isOptional } = body;

    if (!title || !date) {
      return NextResponse.json({ success: false, error: "Title and Date are required" }, { status: 400 });
    }

    const holidayDate = parseFlexibleDate(String(date));
    if (!holidayDate) {
      return NextResponse.json({ success: false, error: "Invalid date format. Please use YYYY-MM-DD or DD-MM-YYYY." }, { status: 400 });
    }

    const holiday = await prisma.holiday.create({
      data: {
        title,
        date: holidayDate,
        description: description || null,
        isOptional: Boolean(isOptional),
      },
    });

    return NextResponse.json({ success: true, data: holiday });
  } catch (error: any) {
    console.error("POST /api/holidays error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to create holiday" }, { status: 500 });
  }
}
