import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { formatToIST } from "@/lib/notifications";

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const employeeId = authRes.employeeId;
  if (!employeeId) {
    return NextResponse.json({ success: false, error: "Forbidden: No employee profile" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { attendanceId, workSummary, punchOutTime } = body;

    if (!workSummary || !workSummary.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: "Please provide a work summary or explanation of what you completed." 
      }, { status: 400 });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: employeeId },
          { employeeIdCode: employeeId }
        ]
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
    }

    let targetAttendance = null;
    if (attendanceId) {
      targetAttendance = await prisma.attendance.findFirst({
        where: {
          id: attendanceId,
          employeeId: employee.id,
          punchOut: null,
        }
      });
    } else {
      // Find latest unclosed attendance
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      targetAttendance = await prisma.attendance.findFirst({
        where: {
          employeeId: employee.id,
          punchOut: null,
        },
        orderBy: { punchIn: "desc" }
      });
    }

    if (!targetAttendance) {
      return NextResponse.json({ success: false, error: "No unclosed shift found to resolve." }, { status: 404 });
    }

    // Determine the resolved punch-out timestamp
    let resolvedPunchOut: Date;
    if (punchOutTime) {
      resolvedPunchOut = new Date(punchOutTime);
    } else {
      const now = new Date();
      const attendanceDate = new Date(targetAttendance.date);
      const isPastDay = attendanceDate.toDateString() !== now.toDateString();

      if (isPastDay) {
        // Default to 19:00 (7:00 PM) or end of typical workday of that date if punchIn was morning, or 23:59:59
        const shiftPunchIn = new Date(targetAttendance.punchIn);
        const auto7pm = new Date(targetAttendance.date);
        auto7pm.setHours(19, 0, 0, 0);

        if (auto7pm.getTime() > shiftPunchIn.getTime()) {
          resolvedPunchOut = auto7pm;
        } else {
          resolvedPunchOut = new Date(targetAttendance.date);
          resolvedPunchOut.setHours(23, 59, 59, 0);
        }
      } else {
        resolvedPunchOut = now;
      }
    }

    // Calculate breaks for this shift
    const breakEvents = await prisma.employeeStatusEvent.findMany({
      where: {
        employeeId: employee.id,
        startedAt: { gte: targetAttendance.punchIn, lte: resolvedPunchOut },
        statusType: { not: "WORKING" }
      }
    });

    let totalBreakMinutes = 0;
    for (const b of breakEvents) {
      const end = b.endedAt || resolvedPunchOut;
      const diffMs = Math.max(0, end.getTime() - b.startedAt.getTime());
      totalBreakMinutes += Math.floor(diffMs / 60000);
    }

    const elapsedMs = Math.max(0, resolvedPunchOut.getTime() - new Date(targetAttendance.punchIn).getTime());
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const workedMinutes = Math.max(0, elapsedMinutes - totalBreakMinutes);

    const fullReason = `Work Summary: ${workSummary.trim()}`;

    const [updatedAttendance] = await prisma.$transaction([
      prisma.attendance.update({
        where: { id: targetAttendance.id },
        data: {
          punchOut: resolvedPunchOut,
          totalMinutes: workedMinutes,
          status: "COMPLETED",
          punchOutReason: fullReason,
        }
      }),
      prisma.employeeStatusEvent.updateMany({
        where: {
          employeeId: employee.id,
          endedAt: null,
          startedAt: { lte: resolvedPunchOut }
        },
        data: { endedAt: resolvedPunchOut }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: updatedAttendance,
      message: `Shift resolved successfully for ${new Date(targetAttendance.date).toLocaleDateString()}.`
    });

  } catch (error) {
    console.error("Resolve Unclosed Shift Error:", error);
    return NextResponse.json({ success: false, error: "Failed to resolve shift" }, { status: 500 });
  }
}
