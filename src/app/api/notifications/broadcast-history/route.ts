import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            activeRole: true,
            department: true,
            designation: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Failed to fetch broadcast history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notification history" },
      { status: 500 }
    );
  }
}
