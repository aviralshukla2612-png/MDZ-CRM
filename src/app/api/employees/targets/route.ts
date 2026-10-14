import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

function getStartOfDay(dateInput?: string | Date): Date {
  const d = dateInput ? new Date(dateInput) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const monthParam = searchParams.get("month"); // 1-12 or 0-11
    const yearParam = searchParams.get("year"); // 2026
    const employeeId = searchParams.get("employeeId");

    const todayStart = getStartOfDay(dateStr || undefined);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const now = new Date();
    const targetMonth = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1; // 1-12
    const targetYear = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    const monthStart = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // Query employees
    const whereClause: any = {
      user: {
        activeRole: { not: "OWNER" },
      },
    };

    // If regular employee, only show their own unless Admin/Sub-Admin
    const isAdmin = ["OWNER", "ADMIN", "SUB_ADMIN"].includes(authRes.activeRole);
    if (!isAdmin) {
      whereClause.id = authRes.employeeId || "";
    } else if (employeeId) {
      whereClause.id = employeeId;
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            designation: true,
            department: true,
            activeRole: true,
            phone: true,
          },
        },
        attendances: {
          where: {
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        },
        dailyWorkLogs: {
          where: {
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          orderBy: { date: "asc" },
        },
      },
      orderBy: { employeeIdCode: "asc" },
    });

    const reportData = employees.map((emp) => {
      // Find today's log
      const todayLog = emp.dailyWorkLogs.find((l) => {
        const d = new Date(l.date);
        return (
          d.getDate() === todayStart.getDate() &&
          d.getMonth() === todayStart.getMonth() &&
          d.getFullYear() === todayStart.getFullYear()
        );
      });

      const todayTarget = todayLog?.targetCount ?? emp.dailyTargetCount ?? 0;
      const todayAchieved = todayLog?.achievedCount ?? 0;
      const todayUnit = todayLog?.unit || emp.dailyTargetUnit || "units";
      const todayTitle = todayLog?.targetTitle || emp.dailyTargetTitle || "Daily Target";
      const todayProgress = todayTarget > 0 ? Math.min(100, Math.round((todayAchieved / todayTarget) * 100)) : 0;
      const todayRemaining = Math.max(0, todayTarget - todayAchieved);
      const isTargetMetToday = todayTarget > 0 && todayAchieved >= todayTarget;

      // Monthly calculations
      const monthlyDaysWorked = emp.attendances.filter((a) => a.punchIn != null).length;
      
      // Calculate total monthly target expected and total achieved
      let monthlyExpectedTarget = 0;
      let monthlyAchievedTotal = 0;
      let daysWithTargetMet = 0;

      emp.dailyWorkLogs.forEach((l) => {
        monthlyAchievedTotal += l.achievedCount || 0;
        if (l.targetCount > 0 && l.achievedCount >= l.targetCount) {
          daysWithTargetMet++;
        }
      });

      // If logs are sparse, expected target is dailyTargetCount * daysWorked
      if (emp.dailyTargetCount > 0) {
        monthlyExpectedTarget = emp.dailyTargetCount * (monthlyDaysWorked > 0 ? monthlyDaysWorked : 1);
      }

      const monthlyCompletionRate =
        monthlyExpectedTarget > 0
          ? Math.round((monthlyAchievedTotal / monthlyExpectedTarget) * 100)
          : monthlyAchievedTotal > 0
          ? 100
          : 0;

      const avgDailyAchieved =
        monthlyDaysWorked > 0
          ? (monthlyAchievedTotal / monthlyDaysWorked).toFixed(1)
          : monthlyAchievedTotal.toFixed(1);

      let performanceStatus: "EXCEEDED" | "ON_TRACK" | "BEHIND" | "NO_TARGET" = "NO_TARGET";
      if (emp.dailyTargetCount > 0) {
        if (monthlyCompletionRate >= 100) performanceStatus = "EXCEEDED";
        else if (monthlyCompletionRate >= 75) performanceStatus = "ON_TRACK";
        else performanceStatus = "BEHIND";
      }

      return {
        id: emp.id,
        employeeIdCode: emp.employeeIdCode,
        userId: emp.userId,
        name: emp.user?.name || "Employee",
        email: emp.user?.email || "",
        avatarUrl: emp.user?.avatarUrl || null,
        designation: emp.user?.designation || "Team Member",
        department: emp.user?.department || "General",
        role: emp.user?.activeRole || "EMPLOYEE",
        phone: emp.user?.phone || emp.phone || "",
        
        // Target Config
        dailyTargetTitle: emp.dailyTargetTitle || "Tasks",
        dailyTargetCount: emp.dailyTargetCount || 0,
        dailyTargetUnit: emp.dailyTargetUnit || "units",
        dailyTargetNotes: emp.dailyTargetNotes || "",

        // Today's Status
        today: {
          date: todayStart.toISOString().split("T")[0],
          targetTitle: todayTitle,
          targetCount: todayTarget,
          achievedCount: todayAchieved,
          unit: todayUnit,
          progressPercentage: todayProgress,
          remaining: todayRemaining,
          isCompleted: isTargetMetToday,
          notes: todayLog?.notes || "",
          logId: todayLog?.id || null,
        },

        // Monthly Summary
        monthly: {
          month: targetMonth,
          year: targetYear,
          daysWorked: monthlyDaysWorked,
          expectedTarget: monthlyExpectedTarget,
          achievedTotal: monthlyAchievedTotal,
          completionRate: monthlyCompletionRate,
          daysWithTargetMet,
          avgDailyAchieved: Number(avgDailyAchieved),
          performanceStatus,
        },

        // Historical logs in this month
        monthLogs: emp.dailyWorkLogs.map((l) => ({
          id: l.id,
          date: l.date.toISOString().split("T")[0],
          targetTitle: l.targetTitle,
          targetCount: l.targetCount,
          achievedCount: l.achievedCount,
          unit: l.unit,
          notes: l.notes || "",
        })),
      };
    });

    const summary = {
      totalEmployees: reportData.length,
      employeesWithTarget: reportData.filter((e) => e.dailyTargetCount > 0).length,
      todayTotalTarget: reportData.reduce((acc, curr) => acc + curr.today.targetCount, 0),
      todayTotalAchieved: reportData.reduce((acc, curr) => acc + curr.today.achievedCount, 0),
      todayCompletedCount: reportData.filter((e) => e.today.isCompleted).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        date: todayStart.toISOString().split("T")[0],
        month: targetMonth,
        year: targetYear,
        summary,
        employees: reportData,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch targets:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch employee target data" }, { status: 500 });
  }
}

// POST: Log today's work output or increment output for an employee
export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { employeeId, date, achievedCount, incrementBy, notes, targetCount, targetTitle, unit } = body;

    const targetEmployeeId = employeeId || authRes.employeeId;
    if (!targetEmployeeId) {
      return NextResponse.json({ success: false, error: "Employee ID is required" }, { status: 400 });
    }

    const isAdmin = ["OWNER", "ADMIN", "SUB_ADMIN"].includes(authRes.activeRole);
    if (!isAdmin && authRes.employeeId !== targetEmployeeId) {
      return NextResponse.json({ success: false, error: "Forbidden: You cannot log targets for other employees" }, { status: 403 });
    }

    const emp = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      include: { user: true },
    });

    if (!emp) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const logDate = getStartOfDay(date || undefined);

    // Look for existing daily work log
    const existingLog = await prisma.employeeDailyWorkLog.findFirst({
      where: {
        employeeId: targetEmployeeId,
        date: logDate,
      },
    });

    let newAchieved = 0;
    if (incrementBy !== undefined) {
      newAchieved = Math.max(0, (existingLog?.achievedCount || 0) + Number(incrementBy));
    } else if (achievedCount !== undefined) {
      newAchieved = Math.max(0, Number(achievedCount));
    } else {
      newAchieved = existingLog?.achievedCount || 0;
    }

    const effectiveTargetCount = targetCount !== undefined ? Number(targetCount) : (existingLog?.targetCount ?? emp.dailyTargetCount ?? 0);
    const effectiveTitle = targetTitle || existingLog?.targetTitle || emp.dailyTargetTitle || "Daily Target";
    const effectiveUnit = unit || existingLog?.unit || emp.dailyTargetUnit || "units";
    const effectiveNotes = notes !== undefined ? String(notes).trim() : (existingLog?.notes || "");

    let savedLog;
    if (existingLog) {
      savedLog = await prisma.employeeDailyWorkLog.update({
        where: { id: existingLog.id },
        data: {
          achievedCount: newAchieved,
          targetCount: effectiveTargetCount,
          targetTitle: effectiveTitle,
          unit: effectiveUnit,
          notes: effectiveNotes,
          loggedById: authRes.id,
        },
      });
    } else {
      savedLog = await prisma.employeeDailyWorkLog.create({
        data: {
          employeeId: targetEmployeeId,
          date: logDate,
          achievedCount: newAchieved,
          targetCount: effectiveTargetCount,
          targetTitle: effectiveTitle,
          unit: effectiveUnit,
          notes: effectiveNotes,
          loggedById: authRes.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: savedLog,
      message: `Updated: ${newAchieved} / ${effectiveTargetCount} ${effectiveUnit}`,
    });
  } catch (error: any) {
    console.error("Log Target Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to log daily target progress" }, { status: 500 });
  }
}
