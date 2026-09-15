/**
 * WebSocket broadcast helper for sending live notification payloads to connected client sockets.
 */

export interface WsNotificationPayload {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  urgency: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

/**
 * Broadcasts a live notification to a specific user's active WebSocket sessions
 */
export function broadcastWsNotification(userId: string, notification: WsNotificationPayload): boolean {
  if (typeof global !== "undefined" && typeof (global as any).broadcastWsNotification === "function") {
    try {
      (global as any).broadcastWsNotification(userId, notification);
      return true;
    } catch (err) {
      console.warn("[WebSocket] Error broadcasting to user", userId, err);
      return false;
    }
  }
  return false;
}
