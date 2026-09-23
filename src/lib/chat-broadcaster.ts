/**
 * Chat real-time event broadcaster wrapping the Socket.IO instance attached to the server.
 */

export interface ChatMessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
  sender?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    activeRole: string;
    designation?: string;
  };
  attachments?: Array<{
    id: string;
    mediaId: string;
    media: {
      id: string;
      fileName: string;
      originalName: string;
      mimeType: string;
      fileSize: number;
    };
  }>;
}

export function broadcastNewChatMessage(conversationId: string, message: ChatMessagePayload): boolean {
  if (typeof global !== "undefined" && typeof (global as any).broadcastChatMessage === "function") {
    try {
      (global as any).broadcastChatMessage(conversationId, message);
      return true;
    } catch (err) {
      console.warn("[ChatBroadcaster] Error broadcasting message to conversation", conversationId, err);
      return false;
    }
  }
  return false;
}

export function broadcastMessageDeleted(conversationId: string, messageId: string): boolean {
  if (typeof global !== "undefined" && typeof (global as any).broadcastMessageDeleted === "function") {
    try {
      (global as any).broadcastMessageDeleted(conversationId, messageId);
      return true;
    } catch (err) {
      console.warn("[ChatBroadcaster] Error broadcasting message deletion", messageId, err);
      return false;
    }
  }
  return false;
}

export function getOnlineUsersList(): string[] {
  if (typeof global !== "undefined" && typeof (global as any).getOnlineUserIds === "function") {
    try {
      return (global as any).getOnlineUserIds();
    } catch {
      return [];
    }
  }
  return [];
}
