import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOperationalExceptions } from "@/lib/escalationEngine";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    if (
      authResult.activeRole !== "OWNER" &&
      authResult.activeRole !== "ADMIN" &&
      authResult.activeRole !== "SUB_ADMIN" &&
      authResult.activeRole !== "SALES"
    ) {
      return NextResponse.json({ success: false, error: "Forbidden: Insufficient Permissions" }, { status: 403 });
    }

    const exceptions = await getOperationalExceptions();

    return NextResponse.json({ success: true, data: exceptions });
  } catch (error) {
    console.error("[ExceptionsRoute] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch operational exceptions" }, { status: 500 });
  }
}
