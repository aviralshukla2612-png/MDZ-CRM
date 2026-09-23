import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  canAccessChat,
  canCreateDirectChat,
  findOrCreateDirectConversation,
  findOrCreateProjectConversation,
} from "@/lib/chat-auth";
import { isOwner, isSubAdmin } from "@/lib/rbac";
import { getOnlineUsersList } from "@/lib/chat-broadcaster";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/conversations
 * Returns list of conversations for the authenticated internal user.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    if (!canAccessChat(user)) {
      return NextResponse.json({ success: false, error: "Access denied to internal chat." }, { status: 403 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        participants: {
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
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            messageType: true,
            createdAt: true,
            senderId: true,
            deletedAt: true,
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const onlineUserIds = new Set(getOnlineUsersList());

    // Compute unread counts and enrich response
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const myParticipant = conv.participants.find((p) => p.userId === user.id);
        const lastReadAt = myParticipant?.lastReadAt || new Date(0);

        const unreadCount = await prisma.chatMessage.count({
          where: {
            conversationId: conv.id,
            createdAt: { gt: lastReadAt },
            senderId: { not: user.id },
            deletedAt: null,
          },
        });

        // Other participant for DIRECT conversations
        const otherParticipant =
          conv.type === "DIRECT"
            ? conv.participants.find((p) => p.userId !== user.id)?.user || null
            : null;

        const isOnline = otherParticipant ? onlineUserIds.has(otherParticipant.id) : false;

        return {
          id: conv.id,
          type: conv.type,
          name:
            conv.type === "DIRECT"
              ? otherParticipant?.name || "Direct Message"
              : conv.name || (conv.project ? `${conv.project.name} Chat` : "Group Chat"),
          projectId: conv.projectId,
          project: conv.project,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          participants: conv.participants.map((p) => ({
            id: p.id,
            userId: p.userId,
            joinedAt: p.joinedAt,
            lastReadAt: p.lastReadAt,
            user: p.user,
            isOnline: onlineUserIds.has(p.userId),
          })),
          otherParticipant: otherParticipant
            ? {
                ...otherParticipant,
                isOnline,
              }
            : null,
          lastMessage: conv.messages[0] || null,
          unreadCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedConversations,
    });
  } catch (error: any) {
    console.error("[API /api/chat/conversations GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load conversations" }, { status: 500 });
  }
}

/**
 * POST /api/chat/conversations
 * Creates a new conversation (DIRECT, GROUP, PROJECT, or ANNOUNCEMENT).
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    if (!canAccessChat(user)) {
      return NextResponse.json({ success: false, error: "Access denied to internal chat." }, { status: 403 });
    }

    const body = await req.json();
    const { type = "DIRECT", targetUserId, name, memberIds = [], projectId } = body;

    // DIRECT CHAT
    if (type === "DIRECT") {
      if (!targetUserId) {
        return NextResponse.json({ success: false, error: "targetUserId is required for direct chat." }, { status: 400 });
      }

      const check = await canCreateDirectChat(user, targetUserId);
      if (!check.allowed) {
        return NextResponse.json({ success: false, error: check.error }, { status: 400 });
      }

      const conversation = await findOrCreateDirectConversation(user.id, targetUserId);
      return NextResponse.json({ success: true, data: conversation });
    }

    // PROJECT CHAT
    if (type === "PROJECT") {
      if (!projectId) {
        return NextResponse.json({ success: false, error: "projectId is required for project chat." }, { status: 400 });
      }

      const conversation = await findOrCreateProjectConversation(projectId, user.id);
      return NextResponse.json({ success: true, data: conversation });
    }

    // GROUP CHAT
    if (type === "GROUP") {
      const groupName = (name || "").trim();
      if (!groupName) {
        return NextResponse.json({ success: false, error: "Group name is required." }, { status: 400 });
      }

      const selectedIds = Array.isArray(memberIds) ? memberIds : [];
      const distinctMembers = Array.from(new Set([user.id, ...selectedIds]));

      if (distinctMembers.length < 2) {
        return NextResponse.json({ success: false, error: "Please select at least one other member." }, { status: 400 });
      }

      // Verify all members are valid internal users
      const validUsers = await prisma.user.findMany({
        where: {
          id: { in: distinctMembers },
          isActive: true,
          activeRole: { not: "CLIENT" },
        },
        select: { id: true },
      });

      if (validUsers.length !== distinctMembers.length) {
        return NextResponse.json({ success: false, error: "One or more selected members are invalid or clients." }, { status: 400 });
      }

      const conversation = await prisma.conversation.create({
        data: {
          type: "GROUP",
          name: groupName,
          participants: {
            create: distinctMembers.map((uid) => ({ userId: uid })),
          },
        },
        include: {
          participants: {
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
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ success: true, data: conversation });
    }

    // ANNOUNCEMENT CHANNEL (Admins / Owners only)
    if (type === "ANNOUNCEMENT") {
      if (!isOwner(user) && !isSubAdmin(user)) {
        return NextResponse.json({ success: false, error: "Only Admins can create company announcement channels." }, { status: 403 });
      }

      const channelName = (name || "Company Announcements").trim();

      // Add all active internal users
      const allInternalUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          activeRole: { not: "CLIENT" },
        },
        select: { id: true },
      });

      const conversation = await prisma.conversation.create({
        data: {
          type: "ANNOUNCEMENT",
          name: channelName,
          participants: {
            create: allInternalUsers.map((u) => ({ userId: u.id })),
          },
        },
        include: {
          participants: {
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
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ success: true, data: conversation });
    }

    return NextResponse.json({ success: false, error: "Invalid conversation type." }, { status: 400 });
  } catch (error: any) {
    console.error("[API /api/chat/conversations POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create conversation" }, { status: 500 });
  }
}
