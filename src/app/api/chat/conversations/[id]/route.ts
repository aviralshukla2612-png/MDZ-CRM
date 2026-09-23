import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { canAccessConversation } from "@/lib/chat-auth";
import { isOwner, isSubAdmin } from "@/lib/rbac";
import { getOnlineUsersList } from "@/lib/chat-broadcaster";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/conversations/[id]
 * Retrieves conversation metadata and participants.
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
      return NextResponse.json({ success: false, error: "Access denied or conversation not found." }, { status: 403 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
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
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found." }, { status: 404 });
    }

    const onlineUserIds = new Set(getOnlineUsersList());
    const otherParticipant =
      conversation.type === "DIRECT"
        ? conversation.participants.find((p) => p.userId !== user.id)?.user || null
        : null;

    return NextResponse.json({
      success: true,
      data: {
        ...conversation,
        name:
          conversation.type === "DIRECT"
            ? otherParticipant?.name || "Direct Message"
            : conversation.name || (conversation.project ? `${conversation.project.name} Chat` : "Group Chat"),
        otherParticipant: otherParticipant
          ? {
              ...otherParticipant,
              isOnline: onlineUserIds.has(otherParticipant.id),
            }
          : null,
        participants: conversation.participants.map((p) => ({
          ...p,
          isOnline: onlineUserIds.has(p.userId),
        })),
      },
    });
  } catch (error: any) {
    console.error("[API /api/chat/conversations/[id] GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load conversation" }, { status: 500 });
  }
}

/**
 * PATCH /api/chat/conversations/[id]
 * Updates group name or manages participants (add/remove).
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

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found." }, { status: 404 });
    }

    const isMember = conversation.participants.some((p) => p.userId === user.id);
    const isAdmin = isOwner(user) || isSubAdmin(user);

    if (!isMember && !isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 403 });
    }

    const body = await req.json();
    const { name, addMemberIds = [], removeMemberIds = [] } = body;

    // 1. Rename Group
    if (name && typeof name === "string") {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { name: name.trim() },
      });
    }

    // 2. Add Members
    if (Array.isArray(addMemberIds) && addMemberIds.length > 0) {
      // Validate internal active users
      const validUsers = await prisma.user.findMany({
        where: {
          id: { in: addMemberIds },
          isActive: true,
          activeRole: { not: "CLIENT" },
        },
        select: { id: true },
      });

      for (const validUser of validUsers) {
        const alreadyIn = conversation.participants.some((p) => p.userId === validUser.id);
        if (!alreadyIn) {
          await prisma.conversationParticipant.create({
            data: {
              conversationId,
              userId: validUser.id,
            },
          });
        }
      }
    }

    // 3. Remove Members
    if (Array.isArray(removeMemberIds) && removeMemberIds.length > 0) {
      // Non-admins can only remove themselves (leave group)
      const allowedToRemove = isAdmin
        ? removeMemberIds
        : removeMemberIds.filter((id) => id === user.id);

      if (allowedToRemove.length > 0) {
        await prisma.conversationParticipant.deleteMany({
          where: {
            conversationId,
            userId: { in: allowedToRemove },
          },
        });
      }
    }

    const updated = await prisma.conversation.findUnique({
      where: { id: conversationId },
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

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[API /api/chat/conversations/[id] PATCH] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update conversation" }, { status: 500 });
  }
}
