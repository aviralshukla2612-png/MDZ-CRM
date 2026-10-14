import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const unread = await prisma.notification.findMany({
      where: {
        recipientId: authRes.id,
        isRead: false,
      },
      orderBy: { createdAt: "desc" },
    });

    // Sanitize any notifications that previously had individual staff name instead of "Client"
    const sanitized = unread.map((n) => {
      if (
        n.title?.toLowerCase()?.includes("change request") ||
        n.title?.toLowerCase()?.includes("revision")
      ) {
        return {
          ...n,
          message: n.message.replace(/^[A-Za-z\s]+ requested changes for/, "Client requested changes for"),
        };
      }
      return n;
    });

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}
