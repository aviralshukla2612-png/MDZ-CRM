import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

const BASE_PROJECT_ROLES = [
  "TM",
  "Graphic Designer",
  "Video editor",
  "sales person",
  "accounting",
  "Web devloper",
];

export async function GET(req: NextRequest) {
  try {
    const authRes = await requireAuth();
    if (authRes instanceof NextResponse) return authRes;

    const setting = await prisma.systemSetting.findUnique({
      where: { key: "CUSTOM_PROJECT_ROLES" },
    });

    let customRoles: string[] = [];
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed)) {
          customRoles = parsed.filter((r) => typeof r === "string" && r.trim().length > 0);
        }
      } catch (e) {
        console.error("Failed to parse CUSTOM_PROJECT_ROLES:", e);
      }
    }

    const allRoles = Array.from(new Set([...BASE_PROJECT_ROLES, ...customRoles]));

    return NextResponse.json({
      success: true,
      roles: allRoles,
      baseRoles: BASE_PROJECT_ROLES,
      customRoles,
    });
  } catch (error) {
    console.error("GET /api/project-roles error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
    if (authRes instanceof NextResponse) return authRes;

    const body = await req.json();
    const roleName = typeof body.role === "string" ? body.role.trim() : "";

    if (!roleName) {
      return NextResponse.json(
        { success: false, error: "Role name cannot be empty." },
        { status: 400 }
      );
    }

    if (roleName.length > 50) {
      return NextResponse.json(
        { success: false, error: "Role name cannot exceed 50 characters." },
        { status: 400 }
      );
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: "CUSTOM_PROJECT_ROLES" },
    });

    let customRoles: string[] = [];
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed)) {
          customRoles = parsed;
        }
      } catch (e) {}
    }

    if (!customRoles.includes(roleName) && !BASE_PROJECT_ROLES.includes(roleName)) {
      customRoles.push(roleName);
      await prisma.systemSetting.upsert({
        where: { key: "CUSTOM_PROJECT_ROLES" },
        update: { value: JSON.stringify(customRoles) },
        create: { key: "CUSTOM_PROJECT_ROLES", value: JSON.stringify(customRoles) },
      });
    }

    const allRoles = Array.from(new Set([...BASE_PROJECT_ROLES, ...customRoles]));

    return NextResponse.json({
      success: true,
      role: roleName,
      roles: allRoles,
      customRoles,
    });
  } catch (error) {
    console.error("POST /api/project-roles error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
