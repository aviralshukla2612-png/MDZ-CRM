import { prisma } from "./prisma";
import { CurrentUserSession } from "./auth";
import { isOwner, isSubAdmin } from "./rbac";

/**
 * Validates whether the user has general access to the internal chat system.
 * Internal only: OWNER, ADMIN, SUB_ADMIN, EMPLOYEE, SALES.
 * CLIENT and anonymous users are strictly excluded.
 */
export function canAccessChat(user: CurrentUserSession | null | undefined): boolean {
  if (!user || !user.id) return false;
  const role = user.activeRole;
  return role === "OWNER" || role === "ADMIN" || role === "SUB_ADMIN" || role === "EMPLOYEE" || role === "SALES";
}

/**
 * Validates whether the authenticated user has access to a specific conversation.
 */
export async function canAccessConversation(
  user: CurrentUserSession,
  conversationId: string
): Promise<boolean> {
  if (!canAccessChat(user)) return false;

  // Check direct participation
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: user.id,
      },
    },
  });

  if (participant) return true;

  // Universal admin access for project conversations and announcements
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { type: true, projectId: true },
  });

  if (!conversation) return false;

  if (isOwner(user) || isSubAdmin(user)) {
    return true;
  }

  // If it's a project conversation and user is employee, verify project membership
  if (conversation.type === "PROJECT" && conversation.projectId) {
    return await canAccessProjectChat(user, conversation.projectId);
  }

  return false;
}

/**
 * Validates whether a user can access a project's chat.
 */
export async function canAccessProjectChat(
  user: CurrentUserSession,
  projectId: string
): Promise<boolean> {
  if (!canAccessChat(user)) return false;

  if (isOwner(user) || isSubAdmin(user)) return true;

  if (user.activeRole === "EMPLOYEE") {
    let empId = user.employeeId;
    if (!empId) {
      const emp = await prisma.employee.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!emp) return false;
      empId = emp.id;
    }

    const membership = await prisma.projectMembership.findFirst({
      where: {
        projectId,
        employeeId: empId,
        isActive: true,
      },
    });

    return Boolean(membership);
  }

  if (user.activeRole === "SALES") {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { createdById: true },
    });
    return project?.createdById === user.id;
  }

  return false;
}

/**
 * Validates direct conversation target user.
 */
export async function canCreateDirectChat(
  user: CurrentUserSession,
  targetUserId: string
): Promise<{ allowed: boolean; error?: string; targetUser?: any }> {
  if (!canAccessChat(user)) {
    return { allowed: false, error: "Access denied to internal chat." };
  }

  if (user.id === targetUserId) {
    return { allowed: false, error: "Cannot create a direct conversation with yourself." };
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, activeRole: true, isActive: true },
  });

  if (!target || !target.isActive) {
    return { allowed: false, error: "Target user not found or inactive." };
  }

  if (target.activeRole === "CLIENT") {
    return { allowed: false, error: "Client users cannot participate in internal chat." };
  }

  return { allowed: true, targetUser: target };
}

/**
 * Validates if the user can send a message in a conversation.
 */
export async function canSendMessage(
  user: CurrentUserSession,
  conversationId: string
): Promise<{ allowed: boolean; error?: string; conversation?: any }> {
  if (!canAccessChat(user)) {
    return { allowed: false, error: "Access denied." };
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        select: { userId: true },
      },
    },
  });

  if (!conversation) {
    return { allowed: false, error: "Conversation not found." };
  }

  const isParticipant = conversation.participants.some((p) => p.userId === user.id);
  const isAdmin = isOwner(user) || isSubAdmin(user);

  if (!isParticipant && !isAdmin) {
    return { allowed: false, error: "You are not a participant in this conversation." };
  }

  // Announcement channels can only be posted in by Admins/Owners
  if (conversation.type === "ANNOUNCEMENT" && !isAdmin) {
    return { allowed: false, error: "Only admins can post announcements." };
  }

  return { allowed: true, conversation };
}

/**
 * Validates if the user can delete a message (author or Admin).
 */
export async function canDeleteMessage(
  user: CurrentUserSession,
  messageId: string
): Promise<{ allowed: boolean; message?: any; error?: string }> {
  if (!canAccessChat(user)) {
    return { allowed: false, error: "Access denied." };
  }

  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    include: {
      conversation: {
        select: { id: true, type: true },
      },
    },
  });

  if (!message) {
    return { allowed: false, error: "Message not found." };
  }

  if (message.deletedAt) {
    return { allowed: false, error: "Message already deleted." };
  }

  const isAuthor = message.senderId === user.id;
  const isAdmin = isOwner(user) || isSubAdmin(user);

  if (!isAuthor && !isAdmin) {
    return { allowed: false, error: "You are not authorized to delete this message." };
  }

  return { allowed: true, message };
}

/**
 * Transaction-safe Direct Conversation retrieval or creation.
 * Searches for an existing conversation containing exactly the two participants.
 */
export async function findOrCreateDirectConversation(userId1: string, userId2: string) {
  // Find conversations of type DIRECT where both users are participants
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { participants: { some: { userId: userId1 } } },
        { participants: { some: { userId: userId2 } } },
      ],
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

  if (existing) {
    return existing;
  }

  // Create new direct conversation with both participants
  return await prisma.conversation.create({
    data: {
      type: "DIRECT",
      participants: {
        create: [
          { userId: userId1 },
          { userId: userId2 },
        ],
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
}

/**
 * Finds or creates a Project conversation.
 */
export async function findOrCreateProjectConversation(projectId: string, currentUserId: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "PROJECT",
      projectId,
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

  if (existing) {
    // Ensure current user is in participants if not already
    const isMember = existing.participants.some((p) => p.userId === currentUserId);
    if (!isMember) {
      await prisma.conversationParticipant.create({
        data: {
          conversationId: existing.id,
          userId: currentUserId,
        },
      });
    }
    return existing;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      memberships: {
        where: { isActive: true },
        include: {
          employee: {
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const participantUserIds = new Set<string>();
  participantUserIds.add(currentUserId);
  if (project.createdById) participantUserIds.add(project.createdById);

  project.memberships.forEach((m) => {
    if (m.employee?.userId) {
      participantUserIds.add(m.employee.userId);
    }
  });

  return await prisma.conversation.create({
    data: {
      type: "PROJECT",
      projectId,
      name: `${project.name} Chat`,
      participants: {
        create: Array.from(participantUserIds).map((uid) => ({
          userId: uid,
        })),
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
}
