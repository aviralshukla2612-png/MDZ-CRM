"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Info,
  Radio,
  Send,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotificationWs } from "@/lib/useNotificationWs";
import { requestPushNotificationPermission, onForegroundMessage } from "@/lib/firebase";
import { useToast } from "@/components/ui/Toast";

interface NotificationItem {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

interface Props {
  currentUserId?: string;
}

export function NotificationBell({ currentUserId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [pushStatus, setPushStatus] = useState<"default" | "granted" | "denied" | "unsupported">("default");
  const [isEnablingPush, setIsEnablingPush] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Check current browser notification permission
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("Notification" in window)) {
        setPushStatus("unsupported");
      } else {
        setPushStatus(Notification.permission as any);
      }
    }
  }, []);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/mdz-crm/api/notifications?limit=25");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data || []);
        setUnreadCount(json.unreadCount || 0);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Heartbeat poll every 30s as a fallback
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Helper to normalize link URLs and prevent double basePath (/mdz-crm/mdz-crm) 404s
  const getCleanHref = (url?: string | null) => {
    if (!url) return "/";
    let clean = url.replace(/^\/mdz-crm/, "");
    if (!clean.startsWith("/")) clean = "/" + clean;
    return clean || "/";
  };

  // Live incoming notification handler (from WebSocket or Firebase foreground)
  const handleLiveNotification = useCallback(
    (newNotif: any) => {
      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);

      // In-app toast banner
      showToast(`🔔 ${newNotif.title}: ${newNotif.message}`, "info");

      // Optional subtle audio chime
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"+Array(200).join("A"));
        audio.volume = 0.2;
        audio.play().catch(() => {});
      } catch {}

      // Native Desktop & Another Tab Notification (Triggers when on another tab or minimized)
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        const cleanLink = getCleanHref(newNotif.linkUrl);
        const fullUrl = `${window.location.origin}/mdz-crm${cleanLink}`;

        try {
          if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(newNotif.title || "Millionaire Digital CRM", {
                body: newNotif.message || "",
                icon: "/mdz-crm/mdz-logo.jpg",
                badge: "/mdz-crm/mdz-logo.jpg",
                tag: newNotif.id || `notif-${Date.now()}`,
                data: { url: fullUrl },
              });
            }).catch(() => {
              const n = new Notification(newNotif.title || "Millionaire Digital CRM", {
                body: newNotif.message || "",
                icon: "/mdz-crm/mdz-logo.jpg",
                data: { url: fullUrl },
              });
              n.onclick = (e) => {
                e.preventDefault();
                window.focus();
                window.location.href = fullUrl;
                n.close();
              };
            });
          } else {
            const n = new Notification(newNotif.title || "Millionaire Digital CRM", {
              body: newNotif.message || "",
              icon: "/mdz-crm/mdz-logo.jpg",
              data: { url: fullUrl },
            });
            n.onclick = (e) => {
              e.preventDefault();
              window.focus();
              window.location.href = fullUrl;
              n.close();
            };
          }
        } catch (e) {
          console.warn("Desktop notification trigger error:", e);
        }
      }
    },
    [showToast]
  );

  // 1. WebSocket live connection
  const { isConnected: isWsConnected } = useNotificationWs({
    userId: currentUserId,
    onNotification: handleLiveNotification,
    enabled: !!currentUserId,
  });

  // 2. Firebase foreground push listener
  useEffect(() => {
    const unsub = onForegroundMessage((payload) => {
      if (payload?.notification || payload?.data) {
        handleLiveNotification({
          id: String(Date.now()),
          recipientId: currentUserId || "",
          title: payload.notification?.title || payload.data?.title || "New Notification",
          message: payload.notification?.body || payload.data?.message || "",
          urgency: "MEDIUM",
          linkUrl: payload.data?.linkUrl,
          isRead: false,
          createdAt: new Date(),
        });
      }
    });
    return () => unsub();
  }, [currentUserId, handleLiveNotification]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await fetch("/mdz-crm/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch (err) {
      console.warn("Failed to mark all as read:", err);
      fetchNotifications();
    }
  };

  // Mark single as read
  const handleMarkSingleRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await fetch("/mdz-crm/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      });
    } catch (err) {
      console.warn("Failed to mark notification as read:", err);
    }
  };

  // Enable push notifications
  const handleEnablePush = async () => {
    setIsEnablingPush(true);
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        const perm = await Notification.requestPermission();
        setPushStatus(perm as any);
        if (perm === "granted") {
          showToast("✓ Desktop alerts enabled! You will now receive notifications on other tabs.", "success");
        }
      }
      const res = await requestPushNotificationPermission();
      if (res.success) {
        setPushStatus("granted");
      }
    } catch (err) {
      showToast("Error requesting push permission", "error");
    } finally {
      setIsEnablingPush(false);
    }
  };

  // Dispatch test notification
  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      const res = await fetch("/mdz-crm/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "⚡ Live Bell Notification",
          message: "Real-time WebSocket & Push notification verified successfully!",
          urgency: "HIGH",
          linkUrl: "/",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("✓ Live notification dispatched!", "success");
        fetchNotifications();
      } else {
        showToast(data.error || "Failed to trigger test notification", "error");
      }
    } catch (err) {
      showToast("Network error dispatching test notification", "error");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().then((perm) => setPushStatus(perm as any)).catch(() => {});
          }
        }}
        className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 touch-target flex items-center justify-center group"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 transition-transform group-hover:rotate-12" />

        {/* Live WebSocket Status Dot */}
        <span
          className={`absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
            isWsConnected ? "bg-emerald-500" : "bg-amber-400"
          }`}
          title={isWsConnected ? "Live WebSocket Connected" : "Connecting..."}
        />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md shadow-rose-500/30 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-[#12141c]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* WS Live Indicator Pill */}
              <div
                className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/60"
                title={isWsConnected ? "Connected to live stream" : "Reconnecting to live stream..."}
              >
                <Radio
                  className={`w-2.5 h-2.5 ${
                    isWsConnected ? "text-emerald-500 animate-pulse" : "text-amber-500"
                  }`}
                />
                <span className="hidden sm:inline">{isWsConnected ? "Live" : "Syncing"}</span>
              </div>

              {/* Mark All Read Button */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Web Push Banner (If not yet enabled) */}
          {pushStatus === "default" && (
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-amber-50 dark:from-indigo-950/40 dark:to-amber-950/30 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-[11px] font-semibold leading-tight">
                  Enable desktop push alerts for instant notifications.
                </span>
              </div>
              <button
                onClick={handleEnablePush}
                disabled={isEnablingPush}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shadow-xs active:scale-95 transition-all shrink-0 flex items-center gap-1"
              >
                {isEnablingPush ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enable"}
              </button>
            </div>
          )}

          {/* Notification Items List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 overscroll-contain">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="font-semibold text-slate-700 dark:text-slate-300">All caught up!</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  No notifications to display right now.
                </div>
              </div>
            ) : (
              notifications.map((n) => {
                const urgencyColor =
                  n.urgency === "HIGH"
                    ? "text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20"
                    : n.urgency === "LOW"
                    ? "text-slate-500 bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20"
                    : "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";

                const relativeTime = n.createdAt
                  ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
                  : "";

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) handleMarkSingleRead(n.id);
                    }}
                    className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3 cursor-pointer group ${
                      !n.isRead ? "bg-indigo-50/30 dark:bg-indigo-950/20" : ""
                    }`}
                  >
                    {/* Urgency Icon */}
                    <div
                      className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${urgencyColor}`}
                    >
                      {n.urgency === "HIGH" ? (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      ) : n.urgency === "LOW" ? (
                        <Info className="w-3.5 h-3.5" />
                      ) : (
                        <Bell className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate text-[11px] sm:text-xs">
                          {n.title}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {relativeTime}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                        {n.message}
                      </p>

                      {/* Direct Link if provided */}
                      {n.linkUrl && (
                        <div className="pt-1">
                          <Link
                            href={getCleanHref(n.linkUrl)}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!n.isRead) handleMarkSingleRead(n.id);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <span>Open details</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Actions & Unread Indicator */}
                    <div className="shrink-0 flex items-center gap-1 mt-0.5">
                      {!n.isRead ? (
                        <button
                          onClick={(e) => handleMarkSingleRead(n.id, e)}
                          className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 hover:bg-indigo-200 text-indigo-600 dark:text-indigo-300 flex items-center justify-center transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: Live Test Trigger */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 text-[10px]">MDZ Real-time Alerts</span>
            <button
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5 transition-all active:scale-95"
              title="Test real-time delivery via WebSocket and Push"
            >
              {isSendingTest ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3 text-indigo-500" />
              )}
              <span>Send Test Alert</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
