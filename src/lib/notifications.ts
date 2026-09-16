import { prisma } from "./prisma";
import { broadcastWsNotification } from "./wsBroadcaster";
import { sendFcmPushToTokens } from "./firebaseAdmin";

/**
 * Format any date into Indian Standard Time (IST - UTC + 5:30)
 * Uses explicit offset arithmetic so it is 100% fail-safe even on minimal UTC Linux/Docker servers.
 */
export function formatToIST(dateInput: Date | string | number = new Date()): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";

    // Indian Standard Time is strictly UTC + 5 hours 30 minutes
    const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
    const istTime = new Date(d.getTime() + istOffsetMs);

    let hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour should be 12
    const minStr = minutes < 10 ? "0" + minutes : String(minutes);

    return `${hours}:${minStr} ${ampm}`;
  } catch {
    return new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true });
  }
}

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
    const cleanLink = linkUrl ? (linkUrl.startsWith("/mdz-crm") ? linkUrl.replace(/^\/mdz-crm/, "") || "/" : linkUrl) : "/";

    // 1. Save to Database
    const notification = await prisma.notification.create({
      data: {
        recipientId,
        title,
        message,
        urgency,
        linkUrl: cleanLink,
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
          linkUrl: cleanLink,
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

export interface AdminNotificationParams {
  title: string;
  message: string;
  urgency?: "LOW" | "MEDIUM" | "HIGH";
  linkUrl?: string;
  excludeUserId?: string;
}

/**
 * Broadcasts an authoritative notification to all active Admins and Sub-Admins
 * (Users with activeRole "OWNER" or "SUB_ADMIN").
 */
export async function sendNotificationToAdmins({
  title,
  message,
  urgency = "MEDIUM",
  linkUrl = "/attendance",
  excludeUserId,
}: AdminNotificationParams) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        activeRole: { in: ["OWNER", "SUB_ADMIN"] },
        isActive: true,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true, name: true, activeRole: true },
    });

    if (!admins || admins.length === 0) {
      return [];
    }

    const notifications = await Promise.allSettled(
      admins.map((admin) =>
        sendNotificationToUser({
          recipientId: admin.id,
          title,
          message,
          urgency,
          linkUrl,
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error("[Notifications] Failed to broadcast to admins:", error);
    return [];
  }
}
