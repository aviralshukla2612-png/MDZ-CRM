import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authRes = await requireAuth();
    if (authRes instanceof NextResponse) return authRes;

    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authRes = await requireAuth();
    if (authRes instanceof NextResponse) return authRes;

    const allowedRoles = ["OWNER", "ADMIN", "SUB_ADMIN"];
    if (!allowedRoles.includes(authRes.activeRole)) {
      return NextResponse.json({ success: false, error: "Forbidden: Only Admin / Owner can update system settings" }, { status: 403 });
    }

    const body = await req.json();

    // Support bulk settings object
    if (body.settings && typeof body.settings === "object") {
      const results: any[] = [];
      for (const [key, value] of Object.entries(body.settings)) {
        const setting = await prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
        results.push(setting);
      }
      return NextResponse.json({ success: true, data: results });
    }

    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: "Missing key or value" }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });

    return NextResponse.json({ success: true, data: setting });
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
