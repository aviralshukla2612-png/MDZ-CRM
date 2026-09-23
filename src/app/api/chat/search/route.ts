import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { canAccessChat } from "@/lib/chat-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/search
 * Server-side search across authorized user conversations.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    if (!canAccessChat(user)) {
      return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Find conversations user is part of
    const userConversations = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      select: { conversationId: true },
    });

    const conversationIds = userConversations.map((c) => c.conversationId);

    if (conversationIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId: { in: conversationIds },
        content: { contains: query },
        deletedAt: null,
      },
      take: 30,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            activeRole: true,
          },
        },
        conversation: {
          select: {
            id: true,
            type: true,
            name: true,
            project: {
              select: { name: true },
            },
          },
        },
      },
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      content: m.content,
      createdAt: m.createdAt,
      sender: m.sender,
      conversationName:
        m.conversation.type === "DIRECT"
          ? "Direct Message"
          : m.conversation.name || m.conversation.project?.name || "Chat",
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("[API /api/chat/search GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Search failed" }, { status: 500 });
  }
}
