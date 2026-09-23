import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { canAccessChat } from "@/lib/chat-auth";
import { getOnlineUsersList } from "@/lib/chat-broadcaster";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/users
 * Returns directory of internal users for chat creation (excluding CLIENT users).
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    if (!canAccessChat(user)) {
      return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        activeRole: { not: "CLIENT" },
        id: { not: user.id },
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { email: { contains: query } },
                { designation: { contains: query } },
                { department: { contains: query } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        designation: true,
        department: true,
        activeRole: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const onlineUserIds = new Set(getOnlineUsersList());

    const enrichedUsers = users.map((u) => ({
      ...u,
      isOnline: onlineUserIds.has(u.id),
    }));

    return NextResponse.json({
      success: true,
      data: enrichedUsers,
    });
  } catch (error: any) {
    console.error("[API /api/chat/users GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load chat users" }, { status: 500 });
  }
}
