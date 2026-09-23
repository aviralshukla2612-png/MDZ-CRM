import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/chat/conversations/[id]/read
 * Updates lastReadAt for the authenticated user to clear unread counts.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const conversationId = params.id;
    const now = new Date();

    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
    });

    if (!participant) {
      // If user has admin access but wasn't added as explicit participant yet, add them
      await prisma.conversationParticipant.create({
        data: {
          conversationId,
          userId: user.id,
          lastReadAt: now,
        },
      });
    } else {
      await prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: user.id,
          },
        },
        data: {
          lastReadAt: now,
        },
      });
    }

    return NextResponse.json({
      success: true,
      lastReadAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("[API /api/chat/conversations/[id]/read PATCH] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update read state" }, { status: 500 });
  }
}
