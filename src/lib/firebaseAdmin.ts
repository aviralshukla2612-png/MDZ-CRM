import { getApps, getApp, initializeApp, cert, App } from "firebase-admin/app";
import { getMessaging, MulticastMessage } from "firebase-admin/messaging";
import fs from "fs";
import path from "path";
import { prisma } from "./prisma";

let isFirebaseAdminInitialized = false;

function initFirebaseAdmin(): App | null {
  if (isFirebaseAdminInitialized || getApps().length > 0) {
    return getApp();
  }

  try {
    // 1. Check for FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      const app = initializeApp({
        credential: cert(serviceAccount),
      });
      isFirebaseAdminInitialized = true;
      console.log("[Firebase Admin] Initialized from FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
      return app;
    }

    // 2. Check for serviceAccountKey.json in project root or cwd
    const keyPath = path.resolve(process.cwd(), "serviceAccountKey.json");
    if (fs.existsSync(keyPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
      const app = initializeApp({
        credential: cert(serviceAccount),
      });
      isFirebaseAdminInitialized = true;
      console.log("[Firebase Admin] Initialized from serviceAccountKey.json.");
      return app;
    }

    console.warn(
      "[Firebase Admin] No service account key found. Push notifications will be queued in DB & WebSocket only until serviceAccountKey.json is placed in the project root."
    );
    return null;
  } catch (error) {
    console.error("[Firebase Admin] Failed to initialize:", error);
    return null;
  }
}

export interface FcmPayload {
  title: string;
  body: string;
  linkUrl?: string;
  icon?: string;
}

/**
 * Sends an FCM push notification to multiple device tokens
 */
export async function sendFcmPushToTokens(tokens: string[], payload: FcmPayload): Promise<{
  successCount: number;
  failureCount: number;
}> {
  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  const app = initFirebaseAdmin();
  if (!app) {
    return { successCount: 0, failureCount: tokens.length };
  }

  try {
    const resolvedLink = payload.linkUrl
      ? payload.linkUrl.startsWith("/mdz-crm")
        ? payload.linkUrl
        : `/mdz-crm${payload.linkUrl.startsWith("/") ? "" : "/"}${payload.linkUrl}`
      : "/mdz-crm";

    const messaging = getMessaging(app);
    const message: MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        title: payload.title,
        message: payload.body,
        linkUrl: resolvedLink,
        icon: payload.icon || "/mdz-crm/mdz-logo.jpg",
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        fcmOptions: {
          link: resolvedLink,
        },
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || "/mdz-crm/mdz-logo.jpg",
          badge: "/mdz-crm/mdz-logo.jpg",
          requireInteraction: true,
          tag: `mdz-${Date.now()}`,
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);

    // Clean up expired or unregistered tokens from DB
    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errCode = resp.error?.code;
        if (
          errCode === "messaging/registration-token-not-registered" ||
          errCode === "messaging/invalid-registration-token"
        ) {
          failedTokens.push(tokens[idx]);
        }
      }
    });

    if (failedTokens.length > 0) {
      await prisma.userPushToken
        .deleteMany({
          where: { token: { in: failedTokens } },
        })
        .catch((err) => console.warn("Could not delete stale push tokens:", err));
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error("[Firebase Admin] Error sending multicast push notification:", error);
    return { successCount: 0, failureCount: tokens.length };
  }
}
