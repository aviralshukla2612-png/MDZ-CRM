import { prisma } from "./prisma";
import { broadcastWsNotification } from "./wsBroadcaster";
import { sendFcmPushToTokens } from "./firebaseAdmin";

export interface CreateNotificationParams {
  recipientId: string;
  title: string;
  message: string;
  urgency?: "LOW" | "MEDIUM" | "HIGH";
  linkUrl?: string;
}

/**
 * Unified notification dispatcher:
 * 1. Writes persistent notification to SQLite database (for in-app bell dropdown).
 * 2. Emits real-time live notification across active WebSocket connections (< 50ms delivery).
 * 3. Sends background push notification to all registered FCM client devices via Firebase Admin.
 */
export async function sendNotificationToUser({
  recipientId,
  title,
  message,
  urgency = "MEDIUM",
  linkUrl,
}: CreateNotificationParams) {
  try {
    // 1. Save to Database
    const notification = await prisma.notification.create({
      data: {
        recipientId,
        title,
        message,
        urgency,
        linkUrl,
        isRead: false,
      },
    });

    // 2. Broadcast via WebSocket for immediate in-tab reception
    try {
      broadcastWsNotification(recipientId, {
        id: notification.id,
        recipientId: notification.recipientId,
        title: notification.title,
        message: notification.message,
        urgency: notification.urgency,
        linkUrl: notification.linkUrl,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });
    } catch (wsErr) {
      console.warn("[Notifications] WebSocket broadcast failed:", wsErr);
    }

    // 3. Send Web Push via Firebase Cloud Messaging
    try {
      const pushTokens = await prisma.userPushToken.findMany({
        where: { userId: recipientId },
        select: { token: true },
      });

      if (pushTokens.length > 0) {
        const tokens = pushTokens.map((pt) => pt.token);
        await sendFcmPushToTokens(tokens, {
          title,
          body: message,
          linkUrl: linkUrl || "/mdz-crm",
        });
      }
    } catch (fcmErr) {
      console.warn("[Notifications] FCM push dispatch failed:", fcmErr);
    }

    return notification;
  } catch (error) {
    console.error("[Notifications] Failed to send notification to user:", error);
    throw error;
  }
}
