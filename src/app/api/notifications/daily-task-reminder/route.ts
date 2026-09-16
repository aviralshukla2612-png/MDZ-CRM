import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUser } from "@/lib/notifications";

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // If caller is an employee requesting their own reminder or triggering from shift countdown
    if (authRes.activeRole === "EMPLOYEE") {
      const notification = await sendNotificationToUser({
        recipientId: authRes.id,
        title: "📋 Time to Submit Daily Tasks",
        message: "Your shift is wrapping up soon! Please submit your daily task highlights before punching out.",
        urgency: "HIGH",
        linkUrl: "/employee/updates",
      });

      return NextResponse.json({
        success: true,
        message: "Daily task reminder sent to your notifications.",
        notification,
      });
    }

    // If caller is an Admin / Sub-Admin or cron triggering for all currently punched-in employees
    const targetUserId = body.userId;
    if (targetUserId) {
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true },
      });

      if (!user) {
        return NextResponse.json({ success: false, error: "Target user not found" }, { status: 404 });
      }

      await sendNotificationToUser({
        recipientId: user.id,
        title: "📋 Daily Task Update Reminder",
        message: "Admin has requested an update: Please submit your daily task highlights before punching out.",
        urgency: "HIGH",
        linkUrl: "/employee/updates",
      });

      return NextResponse.json({
        success: true,
        message: `Reminder sent to ${user.name}`,
      });
    }

    // Broadcast reminder to ALL employees currently punched in today
    const activeAttendances = await prisma.attendance.findMany({
      where: {
        punchOut: null,
        date: { gte: startOfDay },
      },
      include: {
        employee: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    const notifiedUsers: string[] = [];

    for (const att of activeAttendances) {
      const user = att.employee.user;
      if (user?.id) {
        await sendNotificationToUser({
          recipientId: user.id,
          title: "📋 Daily Task Update Reminder",
          message: "Please submit your daily task highlights before punching out so Admin and Clients stay updated.",
          urgency: "HIGH",
          linkUrl: "/employee/updates",
        });
        notifiedUsers.push(user.name);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Daily task reminder sent to ${notifiedUsers.length} active employee(s).`,
      notifiedUsers,
    });
  } catch (error) {
    console.error("Daily Task Reminder Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to dispatch daily task reminder" },
      { status: 500 }
    );
  }
}
