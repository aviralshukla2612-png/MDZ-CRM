import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALL_SIDEBAR_ITEMS } from "@/lib/sidebarPermissions";

const GLOBAL_SETTING_KEY = "subadmin_sidebar_permissions_global";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    // 1. Fetch Global Setting
    const globalSetting = await prisma.systemSetting.findUnique({
      where: { key: GLOBAL_SETTING_KEY },
    });

    let globalAllowed: string[] = ALL_SIDEBAR_ITEMS.filter((i) => i.defaultSubAdmin).map((i) => i.href);
    if (globalSetting?.value) {
      try {
        const parsed = JSON.parse(globalSetting.value);
        if (Array.isArray(parsed)) globalAllowed = parsed;
      } catch (e) {
        console.error("Error parsing global subadmin permissions:", e);
      }
    }

    // 2. If a non-admin sub-admin user is fetching their own effective permissions
    if (user.activeRole === "SUB_ADMIN" && !["OWNER", "ADMIN"].includes(user.activeRole)) {
      const userSetting = await prisma.systemSetting.findUnique({
        where: { key: `subadmin_sidebar_permissions_${user.id}` },
      });

      let effectiveAllowed = globalAllowed;
      if (userSetting?.value) {
        try {
          const parsed = JSON.parse(userSetting.value);
          if (Array.isArray(parsed)) effectiveAllowed = parsed;
        } catch (e) {
          console.error("Error parsing user subadmin permissions:", e);
        }
      }

      return NextResponse.json({
        success: true,
        allowedHrefs: effectiveAllowed,
        isCustom: Boolean(userSetting?.value),
      });
    }

    // 3. For ADMIN / OWNER: Return full manager catalog, sub-admins list, and current user configs
    if (!["OWNER", "ADMIN"].includes(user.activeRole)) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // List of users who have SUB_ADMIN role or can be designated
    const subAdmins = await prisma.user.findMany({
      where: {
        OR: [
          { activeRole: "SUB_ADMIN" },
          { activeRole: "EMPLOYEE" },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        activeRole: true,
        designation: true,
        department: true,
        avatarUrl: true,
      },
      orderBy: [
        { activeRole: "asc" },
        { name: "asc" },
      ],
    });

    // Check if target user has custom settings
    let selectedUserAllowed: string[] | null = null;
    if (targetUserId) {
      const userSetting = await prisma.systemSetting.findUnique({
        where: { key: `subadmin_sidebar_permissions_${targetUserId}` },
      });
      if (userSetting?.value) {
        try {
          const parsed = JSON.parse(userSetting.value);
          if (Array.isArray(parsed)) selectedUserAllowed = parsed;
        } catch (e) {
          console.error(e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      catalog: ALL_SIDEBAR_ITEMS,
      globalAllowed,
      subAdmins,
      selectedUserAllowed,
    });
  } catch (error: any) {
    console.error("GET subadmin permissions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["OWNER", "ADMIN"].includes(user.activeRole)) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { targetType, targetUserId, allowedHrefs, promoteToSubAdmin } = body;

    if (!Array.isArray(allowedHrefs)) {
      return NextResponse.json({ success: false, error: "allowedHrefs must be an array of strings" }, { status: 400 });
    }

    if (targetType === "USER" && targetUserId) {
      const key = `subadmin_sidebar_permissions_${targetUserId}`;
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: JSON.stringify(allowedHrefs) },
        create: { key, value: JSON.stringify(allowedHrefs) },
      });

      // Optionally promote user to SUB_ADMIN if requested
      if (promoteToSubAdmin) {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { activeRole: "SUB_ADMIN" },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Updated sidebar permissions for user ${targetUserId}`,
        targetType: "USER",
        allowedHrefs,
      });
    }

    // Default: update GLOBAL template for all sub-admins
    await prisma.systemSetting.upsert({
      where: { key: GLOBAL_SETTING_KEY },
      update: { value: JSON.stringify(allowedHrefs) },
      create: { key: GLOBAL_SETTING_KEY, value: JSON.stringify(allowedHrefs) },
    });

    return NextResponse.json({
      success: true,
      message: "Updated default sidebar permissions for all Sub-Admins",
      targetType: "GLOBAL",
      allowedHrefs,
    });
  } catch (error: any) {
    console.error("POST subadmin permissions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["OWNER", "ADMIN"].includes(user.activeRole)) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "userId required to clear custom permissions" }, { status: 400 });
    }

    await prisma.systemSetting.deleteMany({
      where: { key: `subadmin_sidebar_permissions_${targetUserId}` },
    });

    return NextResponse.json({
      success: true,
      message: `Reset user ${targetUserId} to default global sub-admin permissions`,
    });
  } catch (error: any) {
    console.error("DELETE subadmin permissions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
