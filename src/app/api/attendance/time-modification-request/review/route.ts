import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

async function ensureTimeModificationTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TimeModificationRequest" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "employeeId" TEXT NOT NULL,
        "attendanceId" TEXT,
        "targetDate" DATETIME NOT NULL,
        "originalPunchIn" DATETIME,
        "originalPunchOut" DATETIME,
        "requestedPunchIn" DATETIME NOT NULL,
        "requestedPunchOut" DATETIME NOT NULL,
        "reason" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "reviewedById" TEXT,
        "reviewedAt" DATETIME,
        "reviewNotes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.warn("Table verification notice:", err);
  }
}

export async function POST(req: NextRequest) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    await ensureTimeModificationTable();
    const body = await req.json();
    const { requestId, action, reviewNotes } = body;

    if (!requestId || !action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "requestId and valid action (APPROVE/REJECT) are required" },
        { status: 400 }
      );
    }

    const request = await prisma.timeModificationRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        attendance: true,
      },
    });

    if (!request) {
      return NextResponse.json(
        { success: false, error: "Time modification request not found" },
        { status: 404 }
      );
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: `This request has already been ${request.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const now = new Date();

    if (action === "APPROVE") {
      // Calculate true worked minutes
      const punchInTime = new Date(request.requestedPunchIn);
      const punchOutTime = new Date(request.requestedPunchOut);
      const durationMs = punchOutTime.getTime() - punchInTime.getTime();
      const rawMinutes = Math.max(0, Math.floor(durationMs / 60000));

      // Calculate break time on that day
      const breakEvents = await prisma.employeeStatusEvent.findMany({
        where: {
          employeeId: request.employeeId,
          startedAt: { gte: punchInTime, lte: punchOutTime },
          statusType: { not: "WORKING" },
        },
      });

      let breakMinutes = 0;
      breakEvents.forEach((b) => {
        const end = b.endedAt || punchOutTime;
        const diff = end.getTime() - b.startedAt.getTime();
        breakMinutes += Math.max(0, Math.floor(diff / 60000));
      });

      const effectiveWorkMinutes = Math.max(0, rawMinutes - breakMinutes);

      await prisma.$transaction(async (tx) => {
        // 1. Update the request status
        await tx.timeModificationRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewedById: authRes.id,
            reviewedAt: now,
            reviewNotes: reviewNotes || "Approved by Management",
          },
        });

        // 2. Update or Create the attendance record
        if (request.attendanceId) {
          await tx.attendance.update({
            where: { id: request.attendanceId },
            data: {
              punchIn: punchInTime,
              punchOut: punchOutTime,
              totalMinutes: effectiveWorkMinutes,
              status: "PRESENT",
              punchOutReason: `Time modified & approved: "${request.reason}"`,
            },
          });
        } else {
          // Check if one exists by date
          const startOfDay = new Date(request.targetDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(request.targetDate);
          endOfDay.setHours(23, 59, 59, 999);

          const existingAtt = await tx.attendance.findFirst({
            where: {
              employeeId: request.employeeId,
              date: { gte: startOfDay, lte: endOfDay },
            },
          });

          if (existingAtt) {
            await tx.attendance.update({
              where: { id: existingAtt.id },
              data: {
                punchIn: punchInTime,
                punchOut: punchOutTime,
                totalMinutes: effectiveWorkMinutes,
                status: "PRESENT",
                punchOutReason: `Time modified & approved: "${request.reason}"`,
              },
            });
          } else {
            await tx.attendance.create({
              data: {
                employeeId: request.employeeId,
                date: request.targetDate,
                punchIn: punchInTime,
                punchOut: punchOutTime,
                totalMinutes: effectiveWorkMinutes,
                status: "PRESENT",
                punchOutReason: `Time modified & approved: "${request.reason}"`,
              },
            });
          }
        }
      });

      // Notify the employee
      if (request.employee.user?.id) {
        try {
          const dateStr = new Date(request.targetDate).toLocaleDateString();
          await prisma.notification.create({
            data: {
              recipientId: request.employee.user.id,
              title: "Time Modification Approved",
              message: `Your time modification request for ${dateStr} was approved by ${authRes.name || "Management"}. Logged hours have been updated.`,
              urgency: "NORMAL",
              linkUrl: "/attendance",
            },
          });
        } catch (notifErr) {
          console.error("Failed to notify employee:", notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Time modification request approved successfully and attendance updated.",
      });
    } else {
      // REJECT
      await prisma.timeModificationRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          reviewedById: authRes.id,
          reviewedAt: now,
          reviewNotes: reviewNotes || "Rejected by Management",
        },
      });

      // Notify employee
      if (request.employee.user?.id) {
        try {
          const dateStr = new Date(request.targetDate).toLocaleDateString();
          await prisma.notification.create({
            data: {
              recipientId: request.employee.user.id,
              title: "Time Modification Request Rejected",
              message: `Your time modification request for ${dateStr} was rejected. Note: ${reviewNotes || "No reason provided"}`,
              urgency: "NORMAL",
              linkUrl: "/attendance",
            },
          });
        } catch (notifErr) {
          console.error("Failed to notify employee:", notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Time modification request rejected.",
      });
    }
  } catch (error: any) {
    console.error("POST /api/attendance/time-modification-request/review error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process review" },
      { status: 500 }
    );
  }
}
