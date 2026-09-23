import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { canDeleteMessage } from "@/lib/chat-auth";
import { broadcastMessageDeleted } from "@/lib/chat-broadcaster";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/chat/messages/[id]
 * Soft-deletes a message.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const messageId = params.id;

    const check = await canDeleteMessage(user, messageId);
    if (!check.allowed || !check.message) {
      return NextResponse.json({ success: false, error: check.error || "Cannot delete message." }, { status: 403 });
    }

    const message = check.message;

    // Soft delete
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Broadcast deletion via Socket.IO
    broadcastMessageDeleted(message.conversationId, messageId);

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully.",
    });
  } catch (error: any) {
    console.error("[API /api/chat/messages/[id] DELETE] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete message" }, { status: 500 });
  }
}
