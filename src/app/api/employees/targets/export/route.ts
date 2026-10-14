import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const now = new Date();
    const targetMonth = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const targetYear = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    const monthStart = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const monthName = monthStart.toLocaleString("default", { month: "long" });

    const employees = await prisma.employee.findMany({
      where: {
        user: { activeRole: { not: "OWNER" } },
      },
      include: {
        user: true,
        attendances: {
          where: {
            date: { gte: monthStart, lte: monthEnd },
          },
        },
        dailyWorkLogs: {
          where: {
            date: { gte: monthStart, lte: monthEnd },
          },
        },
      },
      orderBy: { employeeIdCode: "asc" },
    });

    const csvRows = [
      [
        "Employee Code",
        "Employee Name",
        "Email",
        "Role",
        "Department",
        "Designation",
        "Daily Target Metric",
        "Daily Quota Count",
        "Target Unit",
        "Days Worked (Attendance)",
        "Expected Monthly Target",
        "Total Achieved Output",
        "Target Completion Rate (%)",
        "Days Target Met",
        "Avg Daily Output",
        "Performance Status",
        "Relative 1 Phone",
        "Relative 2 Phone",
      ],
    ];

    employees.forEach((emp) => {
      const daysWorked = emp.attendances.filter((a) => a.punchIn != null).length;
      let achievedTotal = 0;
      let daysWithTargetMet = 0;

      emp.dailyWorkLogs.forEach((l) => {
        achievedTotal += l.achievedCount || 0;
        if (l.targetCount > 0 && l.achievedCount >= l.targetCount) {
          daysWithTargetMet++;
        }
      });

      const dailyTarget = emp.dailyTargetCount || 0;
      const expectedTarget = dailyTarget > 0 ? dailyTarget * (daysWorked > 0 ? daysWorked : 1) : 0;
      const completionRate =
        expectedTarget > 0
          ? Math.round((achievedTotal / expectedTarget) * 100)
          : achievedTotal > 0
          ? 100
          : 0;

      const avgDaily = daysWorked > 0 ? (achievedTotal / daysWorked).toFixed(1) : achievedTotal.toFixed(1);

      let status = "NO TARGET SET";
      if (dailyTarget > 0) {
        if (completionRate >= 100) status = "EXCEEDED TARGET";
        else if (completionRate >= 75) status = "ON TRACK";
        else status = "BEHIND TARGET";
      }

      csvRows.push([
        `"${emp.employeeIdCode}"`,
        `"${(emp.user?.name || "").replace(/"/g, '""')}"`,
        `"${(emp.user?.email || "").replace(/"/g, '""')}"`,
        `"${emp.user?.activeRole || "EMPLOYEE"}"`,
        `"${(emp.user?.department || "").replace(/"/g, '""')}"`,
        `"${(emp.user?.designation || "").replace(/"/g, '""')}"`,
        `"${(emp.dailyTargetTitle || "Tasks").replace(/"/g, '""')}"`,
        dailyTarget.toString(),
        `"${(emp.dailyTargetUnit || "units").replace(/"/g, '""')}"`,
        daysWorked.toString(),
        expectedTarget.toString(),
        achievedTotal.toString(),
        `${completionRate}%`,
        daysWithTargetMet.toString(),
        avgDaily.toString(),
        `"${status}"`,
        `"${emp.relative1Phone || ""}"`,
        `"${emp.relative2Phone || ""}"`,
      ]);
    });

    const csvContent = "\uFEFF" + csvRows.map((r) => r.join(",")).join("\r\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="employee-work-targets-${monthName}-${targetYear}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Export Error:", error);
    return NextResponse.json({ success: false, error: "Failed to export monthly work calculation" }, { status: 500 });
  }
}
