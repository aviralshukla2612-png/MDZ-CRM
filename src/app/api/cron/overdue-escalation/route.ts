import { NextRequest, NextResponse } from "next/server";
import { runOverdueEscalation } from "@/lib/escalationEngine";

/**
 * GET/POST /api/cron/overdue-escalation
 *
 * Scans all active tasks, projects, invoices, and sales follow-ups:
 * 1. Automatically transitions overdue invoices, payment milestones, and followups to 'OVERDUE'
 * 2. Automatically escalates overdue tasks and delayed projects to 'URGENT' priority
 * 3. Proactively dispatches real-time alerts to responsible assignees, project leads, and owners
 *
 * Security: Protected by CRON_SECRET if configured.
 * Call with: Authorization: Bearer <CRON_SECRET>
 */
async function handleEscalation(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const summary = await runOverdueEscalation({ sendNotifications: true });

    return NextResponse.json({
      success: true,
      message: "Overdue escalation scan completed successfully.",
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CronOverdueEscalation] Error:", error);
    return NextResponse.json(
      { success: false, error: "Overdue escalation failed to execute." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleEscalation(req);
}

export async function POST(req: NextRequest) {
  return handleEscalation(req);
}
