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
    const { note, text, content } = body;
    const noteText = (note || text || content || "").trim();

    if (!noteText) {
      return NextResponse.json({ success: false, error: "Note content is required" }, { status: 400 });
    }

    const lead = await prisma.lead.findFirst({
      where: { OR: [{ id: params.id }, { leadNumber: params.id }] },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        actorId: userId,
        action: "NOTE_ADDED",
        detailsJson: noteText,
      },
    });

    return NextResponse.json({ success: true, data: activity });
  } catch (error) {
    console.error("POST /api/leads/[id]/notes error:", error);
    return NextResponse.json({ success: false, error: "Failed to add note" }, { status: 500 });
  }
}
