import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { sendNotificationToUser } from "@/lib/notifications";

export async function GET(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const filter = searchParams.get("filter") || "all"; // all, unread, urgent
    const search = searchParams.get("search") || "";

    const whereClause: any = {
      recipientId: authRes.id,
    };

    if (filter === "unread") {
      whereClause.isRead = false;
    } else if (filter === "urgent") {
      whereClause.urgency = "HIGH";
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { message: { contains: search } },
      ];
    }

    const [notifications, unreadCount, urgentCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { recipientId: authRes.id, isRead: false },
      }),
      prisma.notification.count({
        where: { recipientId: authRes.id, urgency: "HIGH" },
      }),
      prisma.notification.count({
        where: { recipientId: authRes.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
      urgentCount,
      totalCount,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { target, targetDepartment, targetUserId, title, message, urgency, linkUrl } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Notification title is required" }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "Notification message is required" }, { status: 400 });
    }

    let recipients: { id: string; name: string; email: string; department: string }[] = [];

    if (target === "ALL") {
      recipients = await prisma.user.findMany({
        where: {
          isActive: true,
          activeRole: { not: "DEACTIVATED" },
        },
        select: { id: true, name: true, email: true, department: true },
      });
    } else if (target === "DEPARTMENT") {
      if (!targetDepartment) {
        return NextResponse.json({ success: false, error: "Target department is required" }, { status: 400 });
      }
      recipients = await prisma.user.findMany({
        where: {
          isActive: true,
          activeRole: { not: "DEACTIVATED" },
          department: targetDepartment,
        },
        select: { id: true, name: true, email: true, department: true },
      });
    } else if (target === "USER") {
      if (!targetUserId) {
        return NextResponse.json({ success: false, error: "Target employee/user is required" }, { status: 400 });
      }
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, email: true, department: true },
      });
      if (user) recipients = [user];
    } else {
      return NextResponse.json({ success: false, error: "Invalid target type. Use ALL, DEPARTMENT, or USER" }, { status: 400 });
    }

    if (recipients.length === 0) {
      return NextResponse.json({ success: false, error: "No active recipient found for the selected criteria" }, { status: 404 });
    }

    // Send notifications to all matched recipients concurrently
    const results = await Promise.allSettled(
      recipients.map((r) =>
        sendNotificationToUser({
          recipientId: r.id,
          title: title.trim(),
          message: message.trim(),
          urgency: urgency || "MEDIUM",
          linkUrl: linkUrl?.trim() || undefined,
        })
      )
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;

    return NextResponse.json({
      success: true,
      message: `Notification dispatched successfully to ${successCount} recipient${successCount === 1 ? "" : "s"}.`,
      count: successCount,
      recipients: recipients.map((r) => ({ id: r.id, name: r.name, email: r.email, department: r.department })),
    });
  } catch (error: any) {
    console.error("Failed to send broadcast notification:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("id");
    const clearAll = searchParams.get("all") === "true";

    if (clearAll) {
      await prisma.notification.deleteMany({
        where: { recipientId: authRes.id },
      });
      return NextResponse.json({ success: true, message: "All notifications cleared" });
    }

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "Notification ID is required" }, { status: 400 });
    }

    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        recipientId: authRes.id,
      },
    });

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
