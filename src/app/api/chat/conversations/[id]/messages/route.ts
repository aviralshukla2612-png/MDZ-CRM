import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { canAccessConversation, canSendMessage } from "@/lib/chat-auth";
import { broadcastNewChatMessage } from "@/lib/chat-broadcaster";
import { sendNotificationToUser } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/conversations/[id]/messages
 * Paginated message history ordered createdAt ASC.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const conversationId = params.id;

    const hasAccess = await canAccessConversation(user, conversationId);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const before = searchParams.get("before"); // cursor timestamp or messageId

    const whereClause: any = {
      conversationId,
    };

    if (before) {
      // Find the reference message timestamp
      const refMsg = await prisma.chatMessage.findUnique({
        where: { id: before },
        select: { createdAt: true },
      });
      if (refMsg) {
        whereClause.createdAt = { lt: refMsg.createdAt };
      }
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            designation: true,
            department: true,
            activeRole: true,
          },
        },
        attachments: {
          include: {
            media: {
              select: {
                id: true,
                fileName: true,
                originalName: true,
                mimeType: true,
                fileSize: true,
                driveFileId: true,
              },
            },
          },
        },
      },
    });

    // Reverse to chronological order (ASC)
    const chronological = messages.reverse().map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.deletedAt ? "This message was deleted." : m.content,
      messageType: m.messageType,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      deletedAt: m.deletedAt,
      sender: m.sender,
      attachments: m.deletedAt ? [] : m.attachments,
    }));

    return NextResponse.json({
      success: true,
      data: chronological,
      hasMore: messages.length === limit,
    });
  } catch (error: any) {
    console.error("[API /api/chat/conversations/[id]/messages GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load messages" }, { status: 500 });
  }
}

/**
 * POST /api/chat/conversations/[id]/messages
 * Creates a new chat message and dispatches real-time + notification events.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const conversationId = params.id;

    // Authorize sender
    const check = await canSendMessage(user, conversationId);
    if (!check.allowed) {
      return NextResponse.json({ success: false, error: check.error }, { status: 403 });
    }

    const body = await req.json();
    const { content = "", messageType = "TEXT", attachmentIds = [] } = body;

    const rawContent = (content || "").trim();

    if (!rawContent && (!Array.isArray(attachmentIds) || attachmentIds.length === 0)) {
      return NextResponse.json({ success: false, error: "Message content or attachment is required." }, { status: 400 });
    }

    // Length limit (5,000 characters)
    if (rawContent.length > 5000) {
      return NextResponse.json({ success: false, error: "Message exceeds maximum length of 5000 characters." }, { status: 400 });
    }

    // Basic HTML/script stripping for safety
    const sanitizedContent = rawContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");

    // Validate attachment IDs from MediaFile if provided
    let validMediaIds: string[] = [];
    if (Array.isArray(attachmentIds) && attachmentIds.length > 0) {
      const mediaFiles = await prisma.mediaFile.findMany({
        where: {
          id: { in: attachmentIds },
        },
        select: { id: true },
      });
      validMediaIds = mediaFiles.map((m) => m.id);
    }

    const determinedType =
      validMediaIds.length > 0 && !sanitizedContent ? "FILE" : messageType || "TEXT";

    // Persist message in Prisma (database is source of truth)
    const newMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: user.id,
        content: sanitizedContent || (validMediaIds.length > 0 ? "Sent an attachment" : ""),
        messageType: determinedType,
        attachments: {
          create: validMediaIds.map((mediaId) => ({ mediaId })),
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            designation: true,
            department: true,
            activeRole: true,
          },
        },
        attachments: {
          include: {
            media: {
              select: {
                id: true,
                fileName: true,
                originalName: true,
                mimeType: true,
                fileSize: true,
                driveFileId: true,
              },
            },
          },
        },
      },
    });

    // Update conversation updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Update sender's lastReadAt immediately
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: user.id,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // 1. Real-time broadcast via Socket.IO
    broadcastNewChatMessage(conversationId, newMessage);

    // 2. Dispatch notifications for offline/inactive participants
    const conversation = check.conversation;
    const otherParticipants = (conversation?.participants || []).filter(
      (p: any) => p.userId !== user.id
    );

    const convName =
      conversation?.type === "DIRECT"
        ? `${user.name}`
        : conversation?.name || "Chat Group";

    for (const participant of otherParticipants) {
      // Create persistent notification
      sendNotificationToUser({
        recipientId: participant.userId,
        title: `💬 New message from ${user.name}`,
        message:
          sanitizedContent.length > 60
            ? `${sanitizedContent.substring(0, 57)}...`
            : sanitizedContent || "Sent an attachment",
        urgency: "MEDIUM",
        linkUrl: `/chat?c=${conversationId}`,
      }).catch((err) => {
        console.warn("[Chat Notification] Failed to notify participant:", participant.userId, err);
      });
    }

    return NextResponse.json({
      success: true,
      data: newMessage,
    });
  } catch (error: any) {
    console.error("[API /api/chat/conversations/[id]/messages POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to send message" }, { status: 500 });
  }
}
