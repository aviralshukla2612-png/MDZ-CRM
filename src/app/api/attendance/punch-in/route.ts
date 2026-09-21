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
    const userAgent = req.headers.get("user-agent") || "";
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
    
    if (isMobile) {
      return NextResponse.json({ 
        success: false, 
        error: "Punch In restricted: You must use a laptop or desktop computer to punch in." 
      }, { status: 403 });
    }

    const employeeId = authRes.employeeId;

    // Check if the employee already punched in today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Look up the real Employee by UUID or employeeIdCode
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

    // Run the check and creation inside a transaction to prevent race conditions (multiple rapid clicks)
    const attendance = await prisma.$transaction(async (tx) => {
      const existingAttendance = await tx.attendance.findFirst({
        where: {
          employeeId: employee.id,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          }
        }
      });

      if (existingAttendance) {
        throw new Error("Already punched in today.");
      }

      // ── Check for unclosed shifts from previous days ──────────────
      const unclosedRecord = await tx.attendance.findFirst({
        where: {
          employeeId: employee.id,
          punchOut: null,
          date: { lt: startOfDay }, // strictly before today
        },
        orderBy: { date: "desc" }
      });

      if (unclosedRecord) {
        const dateStr = new Date(unclosedRecord.date).toLocaleDateString();
        throw new Error(`UNCLOSED_PREVIOUS_SHIFT:${unclosedRecord.id}:${dateStr}`);
      }
      // ───────────────────────────────────────────────────────────────

      // Create new attendance and initial working status event
      const newAttendance = await tx.attendance.create({
        data: {
          employeeId: employee.id,
          punchIn: new Date(),
          date: new Date(),
        }
      });

      await tx.employeeStatusEvent.create({
        data: {
          employeeId: employee.id,
          statusType: "WORKING",
          startedAt: new Date(),
          notes: "Punched in for the day",
        }
      });

      return newAttendance;
    });

    // Notify Admins & Sub-Admins in real-time
    try {
      const empName = employee.user?.name || employee.employeeIdCode || "Employee";
      const timeStr = formatToIST(attendance.punchIn);
      await sendNotificationToAdmins({
        title: "🟢 Employee Punched In",
        message: `${empName} punched in for work at ${timeStr}.`,
        urgency: "MEDIUM",
        linkUrl: "/attendance",
        excludeUserId: employee.user?.id,
      });
    } catch (notifErr) {
      console.warn("[PunchIn] Failed to notify admins:", notifErr);
    }

    return NextResponse.json({ success: true, data: attendance });
  } catch (error: any) {
    console.error("Punch In Error:", error);
    if (error.message?.startsWith("UNCLOSED_PREVIOUS_SHIFT:")) {
      const parts = error.message.split(":");
      const unclosedId = parts[1];
      const dateStr = parts[2] || "previous shift";
      return NextResponse.json({ 
        success: false, 
        requireUnclosedResolution: true,
        unclosedShiftId: unclosedId,
        dateStr,
        error: `You did not punch out on ${dateStr}. Please submit your work summary before punching in today.` 
      }, { status: 400 });
    }
    if (error.message === "Already punched in today.") {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to punch in" }, { status: 500 });
  }
}
