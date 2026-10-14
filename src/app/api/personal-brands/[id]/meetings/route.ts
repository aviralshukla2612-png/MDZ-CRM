import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const meetings = await prisma.personalBrandMeeting.findMany({
      where: { profileId: params.id },
      orderBy: { meetingDate: "desc" },
    });

    return NextResponse.json({ success: true, data: meetings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch meetings" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { title, meetingDate, agenda, discussionNotes, actionItems, nextMeetingDate } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: "Meeting title is required" }, { status: 400 });
    }

    const meeting = await prisma.personalBrandMeeting.create({
      data: {
        profileId: params.id,
        title: title.trim(),
        meetingDate: meetingDate ? new Date(meetingDate) : new Date(),
        agenda: agenda || "",
        discussionNotes: discussionNotes || "",
        actionItems: actionItems || "",
        nextMeetingDate: nextMeetingDate ? new Date(nextMeetingDate) : null,
      },
    });

    return NextResponse.json({ success: true, data: meeting });
  } catch (error: any) {
    console.error("Meeting Save Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to save meeting notes" }, { status: 500 });
  }
}
