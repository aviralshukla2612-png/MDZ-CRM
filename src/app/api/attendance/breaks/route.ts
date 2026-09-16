import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendNotificationToAdmins, formatToIST } from "@/lib/notifications";

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  if (!authRes.employeeId) {
    return NextResponse.json({ success: false, error: "Forbidden: No employee profile linked" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, statusType, notes } = body;
    const employeeId = authRes.employeeId;

    if (!action) {
      return NextResponse.json({ success: false, error: "Missing action parameter" }, { status: 400 });
    }

    if (action === "START") {
      // Look up real employee UUID
      const employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { id: employeeId },
            { employeeIdCode: employeeId }
          ]
        },
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      });
      
      if (!employee) {
        return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
      }

      // End any previously open events just in case
      await prisma.employeeStatusEvent.updateMany({
        where: { employeeId: employee.id, endedAt: null },
        data: { endedAt: new Date() }
      });

      // Start new break event
      const event = await prisma.employeeStatusEvent.create({
        data: {
          employeeId: employee.id,
          statusType: statusType || "BREAK",
          notes: notes || null,
        }
      });

      // Notify Admins & Sub-Admins of break / lunch start
      try {
        const empName = employee.user?.name || employee.employeeIdCode || "Employee";
        const timeStr = formatToIST(new Date());
        const isLunch = (statusType && statusType.toUpperCase().includes("LUNCH")) || (notes && notes.toLowerCase().includes("lunch"));
        const label = isLunch ? "lunch break" : "break";
        await sendNotificationToAdmins({
          title: isLunch ? "🍱 Employee on Lunch Break" : "☕ Employee on Break",
          message: `${empName} started ${label} at ${timeStr}${notes ? ` (${notes})` : ""}.`,
          urgency: "LOW",
          linkUrl: "/attendance",
          excludeUserId: employee.user?.id,
        });
      } catch (notifErr) {
        console.warn("[Breaks] Failed to notify admins of break start:", notifErr);
      }

      return NextResponse.json({ success: true, data: event });

    } else if (action === "END") {
      // Look up real employee UUID
      const employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { id: employeeId },
            { employeeIdCode: employeeId }
          ]
        },
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      });
      
      if (!employee) {
        return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
      }

      // Close ALL open events to clean up any duplicates
      const openEventsCount = await prisma.employeeStatusEvent.count({
        where: { employeeId: employee.id, endedAt: null }
      });

      if (openEventsCount > 0) {
        const [updated, newWorkEvent] = await prisma.$transaction([
          prisma.employeeStatusEvent.updateMany({
            where: { employeeId: employee.id, endedAt: null },
            data: { endedAt: new Date() }
          }),
          prisma.employeeStatusEvent.create({
            data: {
              employeeId: employee.id,
              statusType: "WORKING",
              startedAt: new Date(),
              notes: "Resumed work after break"
            }
          })
        ]);

        // Notify Admins & Sub-Admins of break end / back to work
        try {
          const empName = employee.user?.name || employee.employeeIdCode || "Employee";
          const timeStr = formatToIST(new Date());
          await sendNotificationToAdmins({
            title: "💻 Employee Resumed Work",
            message: `${empName} resumed work / back from break at ${timeStr}.`,
            urgency: "LOW",
            linkUrl: "/attendance",
            excludeUserId: employee.user?.id,
          });
        } catch (notifErr) {
          console.warn("[Breaks] Failed to notify admins of break end:", notifErr);
        }

        return NextResponse.json({ success: true, data: updated, newEvent: newWorkEvent });
      } else {
        return NextResponse.json({ success: true, message: "No open event found" });
      }
    } else {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Break Event API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process break event" }, { status: 500 });
  }
}
