import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCjomUMPJkpsUTPS-EaettaqA5R5SPwA64",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mdz-crm-d22ee.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mdz-crm-d22ee",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mdz-crm-d22ee.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "52311674452",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:52311674452:web:1dc1124c06a93912ede7c1",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-1VYH0KMWKR",
};

export const VAPID_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
  "BKD6jHdw92bo3y3yFVK0gHeGO6cxFZ12p4OrjcpnuJBIvvoJZzSHnh6ea7Y0uK8GdMOi104Hor0vVLucomS6uqA";

// Initialize Firebase App client-side safely
export function getFirebaseApp() {
  if (typeof window === "undefined") return null;
  return !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

/**
 * Request notification permission from browser and register FCM device token
 */
export async function requestPushNotificationPermission(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { success: false, error: "Notifications are not supported by this browser." };
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      return { success: false, error: "Firebase Messaging is not supported in this browser." };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Notification permission was denied." };
    }

    const app = getFirebaseApp();
    if (!app) return { success: false, error: "Firebase app not initialized." };

    const messaging = getMessaging(app);

    // Register service worker with proper basePath scope and dynamic query params
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        swRegistration = registrations.find((r) =>
          r.active?.scriptURL?.includes("firebase-messaging-sw.js")
        );

        if (!swRegistration) {
          const swParams = new URLSearchParams({
            apiKey: firebaseConfig.apiKey,
            authDomain: firebaseConfig.authDomain,
            projectId: firebaseConfig.projectId,
            storageBucket: firebaseConfig.storageBucket,
            messagingSenderId: firebaseConfig.messagingSenderId,
            appId: firebaseConfig.appId,
            measurementId: firebaseConfig.measurementId,
          });

          swRegistration = await navigator.serviceWorker.register(
            `/mdz-crm/firebase-messaging-sw.js?${swParams.toString()}`,
            { scope: "/mdz-crm/" }
          );
        }
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn("Service worker registration warning:", swErr);
      }
    }

    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (!currentToken) {
      return { success: false, error: "No registration token available. Request permission to generate one." };
    }

    // Save token to backend
    const res = await fetch("/mdz-crm/api/notifications/save-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: currentToken, device: navigator.userAgent }),
    });

    const data = await res.json();
    if (!data.success) {
      console.warn("Could not save FCM token on server:", data.error);
    }

    return { success: true, token: currentToken };
  } catch (err: any) {
    console.error("Error retrieving FCM push token:", err);
    return { success: false, error: err?.message || "Failed to retrieve notification token." };
  }
}

/**
 * Foreground message listener when app is active in current tab
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  if (typeof window === "undefined") return () => {};

  let unsubscribe: (() => void) | undefined;

  isSupported()
    .then((supported) => {
      if (!supported) return;
      const app = getFirebaseApp();
      if (!app) return;
      const messaging = getMessaging(app);
      unsubscribe = onMessage(messaging, (payload) => {
        callback(payload);
      });
    })
    .catch((err) => {
      console.warn("Foreground messaging not supported:", err);
    });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}
