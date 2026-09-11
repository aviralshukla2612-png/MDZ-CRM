import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

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
  } catch (error) {
    console.error("GET /api/holidays error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch holidays" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { title, date, description, isOptional } = body;

    if (!title || !date) {
      return NextResponse.json({ success: false, error: "Title and Date are required" }, { status: 400 });
    }

    const holidayDate = new Date(date);
    if (isNaN(holidayDate.getTime())) {
      return NextResponse.json({ success: false, error: "Invalid date format" }, { status: 400 });
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
  } catch (error) {
    console.error("POST /api/holidays error:", error);
    return NextResponse.json({ success: false, error: "Failed to create holiday" }, { status: 500 });
  }
}
