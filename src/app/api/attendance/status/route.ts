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
      },
      include: {
        user: {
          select: { id: true, name: true, designation: true, department: true, activeRole: true }
        }
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

    // Check for any unclosed shift from previous days
    const unclosedShift = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        punchOut: null,
        date: { lt: startOfDay },
      },
      orderBy: { punchIn: "desc" }
    });

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
      return NextResponse.json({ 
        success: true, 
        data: { 
          status: "NOT_PUNCHED_IN",
          unclosedShift: unclosedShift ? {
            id: unclosedShift.id,
            date: unclosedShift.date,
            punchIn: unclosedShift.punchIn,
          } : null
        } 
      });
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

    // Check the latest open event (if any)
    const openEvent = [...events].reverse().find((e) => !e.endedAt);
    let finalStatus: string;
    if (attendance.punchOut) {
      finalStatus = "DAY_COMPLETE";
    } else if (openEvent) {
      finalStatus = openEvent.statusType === "WORKING" ? "WORKING" : "ON_BREAK";
    } else {
      // Punched in and no active break event => employee is working
      finalStatus = "WORKING";
    }
    console.log("Returning status to client:", finalStatus);

    const designationLower = (employee.user?.designation || "").toLowerCase();
    const departmentLower = (employee.user?.department || "").toLowerCase();
    const isVideographer =
      designationLower.includes("videograph") ||
      designationLower.includes("video graph") ||
      designationLower.includes("cameraman") ||
      designationLower.includes("camera") ||
      designationLower.includes("shooter") ||
      departmentLower.includes("videograph");

    return NextResponse.json({ 
      success: true, 
      data: {
        status: finalStatus,
        isVideographer,
        designation: employee.user?.designation || "Employee",
        punchOutRequestStatus: attendance.punchOutRequestStatus, // PENDING, APPROVED, REJECTED, or null
        punchOut: attendance.punchOut,
        punchIn: attendance.punchIn,
        workSeconds: serverWorkSeconds,
        breakSeconds: serverBreakSeconds,
        unclosedShift: unclosedShift ? {
          id: unclosedShift.id,
          date: unclosedShift.date,
          punchIn: unclosedShift.punchIn,
        } : null
      } 
    });

  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
