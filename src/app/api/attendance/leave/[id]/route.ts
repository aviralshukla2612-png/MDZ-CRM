import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { calculateEffectiveLeaveDays } from "@/lib/holidayHelpers";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== "OWNER" && session.user.role !== "ADMIN" && session.user.role !== "SUB_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { action, rejectionReason } = await req.json();

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          include: { user: true }
        }
      }
    });

    if (!leaveRequest) {
      return NextResponse.json({ success: false, error: "Leave request not found" }, { status: 404 });
    }

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json({ success: false, error: "Leave request is already processed" }, { status: 400 });
    }

    if (action === "APPROVE") {
      const employee = leaveRequest.employee;
      if (!employee) {
        return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
      }

      // Fetch active holidays overlapping with leave request
      const holidays = await prisma.holiday.findMany({
        where: {
          isActive: true,
          date: {
            gte: new Date(new Date(leaveRequest.startDate).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(leaveRequest.endDate).setHours(23, 59, 59, 999)),
          },
        },
      });

      // Calculate effective business leave days (holidays & Sundays do not deduct balance)
      const { effectiveLeaveDays } = calculateEffectiveLeaveDays(
        leaveRequest.startDate,
        leaveRequest.endDate,
        holidays,
        null
      );

      // Use effective days or fallback to requested days if single day
      const daysToDeduct = effectiveLeaveDays > 0 ? effectiveLeaveDays : leaveRequest.days;

      const updateData: any = {};
      if (leaveRequest.leaveType === "SICK") {
        updateData.sickLeaveUsed = employee.sickLeaveUsed + daysToDeduct;
      } else if (leaveRequest.leaveType === "CASUAL") {
        updateData.casualLeaveUsed = employee.casualLeaveUsed + daysToDeduct;
      } else if (leaveRequest.leaveType === "PAID") {
        updateData.paidLeaveUsed = employee.paidLeaveUsed + daysToDeduct;
      }

      await prisma.$transaction([
        prisma.leaveRequest.update({
          where: { id: params.id },
          data: {
            status: "APPROVED",
            days: daysToDeduct,
            approvedById: session.user.id,
            approvedAt: new Date(),
          },
        }),
        prisma.employee.update({
          where: { id: leaveRequest.employeeId },
          data: updateData,
        }),
      ]);
    } else if (action === "REJECT") {
      await prisma.leaveRequest.update({
        where: { id: params.id },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || null,
          approvedById: session.user.id,
          approvedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, message: `Leave request ${action.toLowerCase()}d` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
