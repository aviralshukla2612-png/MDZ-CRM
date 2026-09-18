import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const isManagement = ["OWNER", "ADMIN", "SUB_ADMIN"].includes(authRes.activeRole);
    const statusParam = req.nextUrl.searchParams.get("status");
    const employeeIdParam = req.nextUrl.searchParams.get("employeeId");

    const whereClause: any = {};

    if (!isManagement) {
      if (!authRes.employeeId) {
        return NextResponse.json({ success: true, data: [] });
      }
      whereClause.employeeId = authRes.employeeId;
    } else if (employeeIdParam && employeeIdParam !== "ALL") {
      whereClause.employeeId = employeeIdParam;
    }

    if (statusParam && statusParam !== "ALL") {
      whereClause.status = statusParam;
    }

    const requests = await prisma.timeModificationRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                designation: true,
                department: true,
                avatarUrl: true,
              },
            },
          },
        },
        attendance: true,
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    console.error("GET /api/attendance/time-modification-request error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch time modification requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      attendanceId,
      targetDate,
      requestedPunchIn,
      requestedPunchOut,
      reason,
    } = body;

    // Resolve employee
    let employeeId = authRes.employeeId;
    if (!employeeId && authRes.activeRole === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({
        where: { userId: authRes.id },
      });
      employeeId = emp?.id;
    }

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Employee profile not found" },
        { status: 404 }
      );
    }

    if (!targetDate || !requestedPunchIn || !requestedPunchOut || !reason?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "targetDate, requestedPunchIn, requestedPunchOut, and reason are required",
        },
        { status: 400 }
      );
    }

    const parsedTargetDate = new Date(targetDate);
    const parsedReqPunchIn = new Date(requestedPunchIn);
    const parsedReqPunchOut = new Date(requestedPunchOut);

    if (isNaN(parsedReqPunchIn.getTime()) || isNaN(parsedReqPunchOut.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid punch in or punch out datetime format" },
        { status: 400 }
      );
    }

    if (parsedReqPunchOut.getTime() <= parsedReqPunchIn.getTime()) {
      return NextResponse.json(
        { success: false, error: "Requested punch out time must be after punch in time" },
        { status: 400 }
      );
    }

    // Check if there is an existing attendance record for this date or attendanceId
    let originalPunchIn: Date | null = null;
    let originalPunchOut: Date | null = null;
    let linkedAttendanceId = attendanceId || null;

    if (linkedAttendanceId) {
      const existingAtt = await prisma.attendance.findUnique({
        where: { id: linkedAttendanceId },
      });
      if (existingAtt) {
        originalPunchIn = existingAtt.punchIn;
        originalPunchOut = existingAtt.punchOut;
      }
    } else {
      const startOfDay = new Date(parsedTargetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(parsedTargetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingAtt = await prisma.attendance.findFirst({
        where: {
          employeeId,
          date: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { date: "desc" },
      });

      if (existingAtt) {
        linkedAttendanceId = existingAtt.id;
        originalPunchIn = existingAtt.punchIn;
        originalPunchOut = existingAtt.punchOut;
      }
    }

    const newRequest = await prisma.timeModificationRequest.create({
      data: {
        employeeId,
        attendanceId: linkedAttendanceId,
        targetDate: parsedTargetDate,
        originalPunchIn,
        originalPunchOut,
        requestedPunchIn: parsedReqPunchIn,
        requestedPunchOut: parsedReqPunchOut,
        reason: reason.trim(),
        status: "PENDING",
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    // Notify Sub-Admins and Admins/Owners
    try {
      const managers = await prisma.user.findMany({
        where: {
          activeRole: { in: ["OWNER", "ADMIN", "SUB_ADMIN"] },
          isActive: true,
        },
        select: { id: true },
      });

      const empName = newRequest.employee.user.name || "Employee";
      const dateFormatted = parsedTargetDate.toLocaleDateString();

      for (const mgr of managers) {
        if (mgr.id !== authRes.id) {
          await prisma.notification.create({
            data: {
              recipientId: mgr.id,
              title: "Time Modification Request",
              message: `${empName} submitted a time adjustment / late shoot appeal for ${dateFormatted}. Reason: "${reason.trim()}"`,
              urgency: "NORMAL",
              linkUrl: "/attendance-requests",
            },
          });
        }
      }
    } catch (notifErr) {
      console.error("Failed to notify managers of time modification request:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Time modification request submitted successfully for approval",
      data: newRequest,
    });
  } catch (error: any) {
    console.error("POST /api/attendance/time-modification-request error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit time modification request" },
      { status: 500 }
    );
  }
}
