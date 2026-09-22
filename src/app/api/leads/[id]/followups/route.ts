import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const session = authRes;
  const userId = session.id;

  try {
    const body = await req.json();
    const { scheduledAt, date, notes, communicationType, result, nextAction } = body;

    const lead = await prisma.lead.findFirst({
      where: { OR: [{ id: params.id }, { leadNumber: params.id }] },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    let parsedScheduledDate = scheduledAt || date ? new Date(scheduledAt || date) : new Date();
    if (isNaN(parsedScheduledDate.getTime())) {
      parsedScheduledDate = new Date();
    }

    const followup = await prisma.leadFollowup.create({
      data: {
        leadId: lead.id,
        salespersonId: userId,
        scheduledAt: parsedScheduledDate,
        communicationType: communicationType || "CALL",
        notes: notes || "Follow-up scheduled",
        result: result || "PENDING",
        nextAction: nextAction || null,
        status: "PENDING",
      },
    });

    // Update lead nextFollowupAt
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        nextFollowupAt: parsedScheduledDate,
      },
    });

    // Add activity log
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        actorId: userId,
        action: "FOLLOWUP_SCHEDULED",
        detailsJson: `Scheduled follow-up for ${parsedScheduledDate.toLocaleDateString()}: ${notes || "No notes"}`,
      },
    });

    return NextResponse.json({ success: true, data: followup });
  } catch (error) {
    console.error("POST /api/leads/[id]/followups error:", error);
    return NextResponse.json({ success: false, error: "Failed to schedule follow-up" }, { status: 500 });
  }
}
