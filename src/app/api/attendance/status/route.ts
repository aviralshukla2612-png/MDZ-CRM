import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const employeeIdCode = req.nextUrl.searchParams.get("employeeId");
    
    console.log("authRes.employeeId:", authRes.employeeId, "query:", employeeIdCode, "authRes:", authRes);

    if (!employeeIdCode) {
      return NextResponse.json({ success: false, error: "Missing employeeId" }, { status: 400 });
    }

    // Look up the real Employee by UUID or employeeIdCode
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: employeeIdCode },
          { employeeIdCode: employeeIdCode }
        ]
      }
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const isManagement = ["OWNER", "ADMIN", "SUB_ADMIN"].includes(authRes.activeRole);
    if (!isManagement && authRes.employeeId !== employee.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You cannot view another employee's status" }, { status: 403 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Proactively clean up / auto-logout dangling open records from previous days at 12:00 AM
    try {
      const danglingPrevious = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          punchOut: null,
          date: { lt: startOfDay },
        },
      });

      for (const dangling of danglingPrevious) {
        const autoPunchOut = new Date(dangling.date);
        autoPunchOut.setHours(23, 59, 59, 0);
        const punchInMs = new Date(dangling.punchIn).getTime();
        const totalMinutes = Math.max(0, Math.floor((autoPunchOut.getTime() - punchInMs) / 60000));

        await prisma.$transaction([
          prisma.attendance.update({
            where: { id: dangling.id },
            data: {
              punchOut: autoPunchOut,
              totalMinutes,
              status: "PRESENT",
              punchOutReason: "Mispunch / Auto-logout at 12:00 AM",
            },
          }),
          prisma.employeeStatusEvent.updateMany({
            where: {
              employeeId: employee.id,
              endedAt: null,
              startedAt: { lte: autoPunchOut },
            },
            data: { endedAt: autoPunchOut },
          }),
        ]);
      }
    } catch (cleanErr) {
      console.error("Auto-cleanup previous day mispunch error:", cleanErr);
    }

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      orderBy: {
        punchIn: 'desc'
      }
    });

    if (!attendance) {
      return NextResponse.json({ success: true, data: { status: "NOT_PUNCHED_IN" } });
    }

    // Calculate exact work and break seconds for today
    let serverWorkSeconds = 0;
    let serverBreakSeconds = 0;

    const events = await prisma.employeeStatusEvent.findMany({
      where: {
        employeeId: employee.id,
        startedAt: { gte: startOfDay, lte: endOfDay }
      },
      orderBy: { startedAt: 'asc' }
    });

    const nowMs = Date.now();
    let lastWorkingEnd = 0;
    let lastBreakEnd = 0;

    events.forEach(ev => {
      const start = new Date(ev.startedAt).getTime();
      const end = ev.endedAt ? new Date(ev.endedAt).getTime() : nowMs;

      if (ev.statusType === "WORKING") {
        const effectiveStart = Math.max(start, lastWorkingEnd);
        if (end > effectiveStart) {
          serverWorkSeconds += Math.floor((end - effectiveStart) / 1000);
          lastWorkingEnd = end;
        }
      } else {
        const effectiveStart = Math.max(start, lastBreakEnd);
        if (end > effectiveStart) {
          serverBreakSeconds += Math.floor((end - effectiveStart) / 1000);
          lastBreakEnd = end;
        }
      }
    });

    const finalStatus = attendance.punchOut ? "DAY_COMPLETE" : (events.find(e => !e.endedAt)?.statusType === "WORKING" ? "WORKING" : "ON_BREAK");
    console.log("Returning status to client:", finalStatus);

    return NextResponse.json({ 
      success: true, 
      data: {
        status: finalStatus,
        punchOutRequestStatus: attendance.punchOutRequestStatus, // PENDING, APPROVED, REJECTED, or null
        punchOut: attendance.punchOut,
        punchIn: attendance.punchIn,
        workSeconds: serverWorkSeconds,
        breakSeconds: serverBreakSeconds,
      } 
    });

  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
