import { prisma } from "@/lib/prisma";

interface SyncQuotaOptions {
  userId?: string | null;
  taskTitle: string;
  increment: number; // +1 or -1
  loggedById?: string | null;
  unit?: string;
}

/**
 * Automatically syncs completed tasks / deliverables to employee daily quota targets.
 */
export async function syncTaskCompletionToEmployeeQuota({
  userId,
  taskTitle,
  increment = 1,
  loggedById,
  unit,
}: SyncQuotaOptions) {
  if (!userId) return;

  try {
    // 1. Look for matching Employee record (by userId or direct employeeId)
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { userId: userId },
          { id: userId },
        ],
      },
    });

    if (!employee) return;

    // 2. Normalize to start of day (local day bounds)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 3. Find today's daily work log
    const existingLog = await prisma.employeeDailyWorkLog.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const targetCount = existingLog?.targetCount ?? employee.dailyTargetCount ?? 0;
    const targetTitle = existingLog?.targetTitle || employee.dailyTargetTitle || "Shoot Reels";
    const targetUnit = unit || existingLog?.unit || employee.dailyTargetUnit || "reels";

    if (existingLog) {
      const newAchieved = Math.max(0, (existingLog.achievedCount || 0) + increment);
      const actionText = increment > 0 ? `Completed: "${taskTitle}"` : `Reverted: "${taskTitle}"`;
      const currentNotes = existingLog.notes ? `${existingLog.notes}; ` : "";

      await prisma.employeeDailyWorkLog.update({
        where: { id: existingLog.id },
        data: {
          achievedCount: newAchieved,
          targetCount: targetCount,
          targetTitle: targetTitle,
          unit: targetUnit,
          notes: `${currentNotes}${actionText}`.slice(0, 500),
          loggedById: loggedById || existingLog.loggedById,
        },
      });
    } else if (increment > 0) {
      await prisma.employeeDailyWorkLog.create({
        data: {
          employeeId: employee.id,
          date: todayStart,
          achievedCount: increment,
          targetCount: targetCount,
          targetTitle: targetTitle,
          unit: targetUnit,
          notes: `Auto: Completed "${taskTitle}"`,
          loggedById: loggedById || null,
        },
      });
    }
  } catch (err) {
    console.error("[QuotaSync] Failed to sync task completion to employee quota:", err);
  }
}
