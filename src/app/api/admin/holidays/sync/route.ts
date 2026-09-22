import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { syncIndianHolidays } from "@/lib/holidaySync";

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json().catch(() => ({}));
    const currentYear = new Date().getFullYear();
    const year = body.year ? parseInt(String(body.year), 10) : currentYear;

    if (isNaN(year) || year < 2020 || year > 2040) {
      return NextResponse.json(
        { success: false, error: "Invalid year specified. Please provide a valid year (e.g. 2026)." },
        { status: 400 }
      );
    }

    const result = await syncIndianHolidays(year, authRes.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/admin/holidays/sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to synchronize holidays",
        sourceUnavailable: true,
      },
      { status: 500 }
    );
  }
}
