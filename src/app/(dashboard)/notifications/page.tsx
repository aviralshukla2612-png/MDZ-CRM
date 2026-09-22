"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  Bell,
  Send,
  Users,
  Building,
  User,
  ShieldAlert,
  Info,
  CheckCircle2,
  CheckCheck,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Radio,
  Sparkles,
  RefreshCw,
  Clock,
  ChevronRight,
  AlertTriangle,
  History,
  MessageSquare,
  Flame,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  activeRole: string;
}

const QUICK_TEMPLATES = [
  {
    label: "🚨 Urgent Meeting",
    title: "Urgent Team Meeting",
    message: "Please join the meeting room immediately for an urgent project briefing.",
    urgency: "HIGH",
    linkUrl: "/projects",
  },
  {
    label: "📢 Company Announcement",
    title: "Important Company Announcement",
    message: "Please check your daily updates and task priorities for the upcoming milestone.",
    urgency: "MEDIUM",
    linkUrl: "/employee/updates",
  },
  {
    label: "⏰ Daily Updates Reminder",
    title: "Daily Updates & Task Submission",
    message: "A friendly reminder to log your daily project updates and work accomplishments before shift end.",
    urgency: "MEDIUM",
    linkUrl: "/employee/updates",
  },
  {
    label: "⏱️ Attendance & Punch Reminder",
    title: "Attendance & Punch In/Out Reminder",
    message: "Please remember to mark your punch in/out and active work sessions accurately.",
    urgency: "LOW",
    linkUrl: "/attendance",
  },
  {
    label: "🎉 Milestone Achieved",
    title: "Project Milestone Completed!",
    message: "Kudos to the team! Our key delivery milestone was reached successfully.",
    urgency: "MEDIUM",
    linkUrl: "/projects",
  },
];

export default function NotificationsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const userRole = session?.user?.role || "EMPLOYEE";
  const isAdmin = ["OWNER", "ADMIN", "SUB_ADMIN"].includes(userRole);

  // Active Main Tab: "inbox" | "broadcast" | "logs"
  const [activeTab, setActiveTab] = useState<"inbox" | "broadcast" | "logs">("inbox");

  // ─── Inbox State ───
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "urgent">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Broadcast State (Admin only) ───
  const [targetType, setTargetType] = useState<"ALL" | "DEPARTMENT" | "USER">("ALL");
  const [targetDepartment, setTargetDepartment] = useState("Engineering");
  const [targetUserId, setTargetUserId] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifUrgency, setNotifUrgency] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [notifLinkUrl, setNotifLinkUrl] = useState("");
  const [sending, setSending] = useState(false);

  // Employees & departments for target picker
  const [employeesList, setEmployeesList] = useState<EmployeeOption[]>([]);
  const [departmentsList, setDepartmentsList] = useState<string[]>([
    "Engineering",
    "Sales",
    "Design",
    "Marketing",
    "Operations",
    "Management",
    "General",
  ]);

  // ─── Broadcast Logs State (Admin only) ───
  const [broadcastLogs, setBroadcastLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Fetch inbox notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: "100",
        filter,
        ...(searchQuery ? { search: searchQuery } : {}),
      });

      const res = await fetch(`/mdz-crm/api/notifications?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data || []);
        setUnreadCount(json.unreadCount || 0);
        setUrgentCount(json.urgentCount || 0);
        setTotalCount(json.totalCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  // Fetch employees list for Admin recipient selector
  useEffect(() => {
    if (isAdmin) {
      fetch("/mdz-crm/api/employees")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            const mapped: EmployeeOption[] = json.data.map((e: any) => ({
              id: e.user?.id || e.userId,
              name: e.user?.name || e.name || "Employee",
              email: e.user?.email || e.email || "",
              department: e.user?.department || e.department || "General",
              designation: e.user?.designation || e.designation || "Staff",
              activeRole: e.user?.activeRole || "EMPLOYEE",
            }));
            setEmployeesList(mapped);

            const depts = Array.from(
              new Set(mapped.map((m) => m.department).filter(Boolean))
            );
            if (depts.length > 0) setDepartmentsList(depts);
          }
        })
        .catch((err) => console.error("Error fetching employees:", err));
    }
  }, [isAdmin]);

  // Fetch broadcast logs when logs tab is active
  const fetchBroadcastLogs = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLogsLoading(true);
      const res = await fetch("/mdz-crm/api/notifications/broadcast-history?limit=50");
      const json = await res.json();
      if (json.success) {
        setBroadcastLogs(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch broadcast logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchBroadcastLogs();
    }
  }, [activeTab, fetchBroadcastLogs]);

  // Mark all read
  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await fetch("/mdz-crm/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      showToast("✓ All notifications marked as read", "success");
    } catch {
      showToast("Failed to mark all as read", "error");
    }
  };

  // Mark single read
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
    } catch {
      console.error("Failed to mark notification as read");
    }
  };

  // Delete notification
  const handleDeleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await fetch(`/mdz-crm/api/notifications?id=${id}`, { method: "DELETE" });
      showToast("Notification deleted", "info");
      fetchNotifications();
    } catch {
      showToast("Failed to delete notification", "error");
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all your notifications?")) return;
    try {
      setNotifications([]);
      setUnreadCount(0);
      await fetch(`/mdz-crm/api/notifications?all=true`, { method: "DELETE" });
      showToast("All notifications cleared", "success");
      fetchNotifications();
    } catch {
      showToast("Failed to clear notifications", "error");
    }
  };

  // Apply template
  const applyTemplate = (t: typeof QUICK_TEMPLATES[0]) => {
    setNotifTitle(t.title);
    setNotifMessage(t.message);
    setNotifUrgency(t.urgency as any);
    setNotifLinkUrl(t.linkUrl);
    showToast(`Template "${t.label}" applied`, "info");
  };

  // Dispatch Broadcast / Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showToast("Please provide both title and message", "error");
      return;
    }
    if (targetType === "USER" && !targetUserId) {
      showToast("Please select an individual employee", "error");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/mdz-crm/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: targetType,
          targetDepartment: targetType === "DEPARTMENT" ? targetDepartment : undefined,
          targetUserId: targetType === "USER" ? targetUserId : undefined,
          title: notifTitle,
          message: notifMessage,
          urgency: notifUrgency,
          linkUrl: notifLinkUrl || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`✓ ${data.message || "Notification sent successfully!"}`, "success");
        setNotifTitle("");
        setNotifMessage("");
        setNotifLinkUrl("");
        fetchNotifications();
        if (activeTab === "logs") fetchBroadcastLogs();
      } else {
        showToast(data.error || "Failed to send notification", "error");
      }
    } catch {
      showToast("Network error while sending notification", "error");
    } finally {
      setSending(false);
    }
  };

  const getCleanHref = (url?: string | null) => {
    if (!url) return "/";
    let clean = url.replace(/^\/mdz-crm/, "");
    if (!clean.startsWith("/")) clean = "/" + clean;
    return clean || "/";
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Notifications Hub"
        description="Unified real-time communication center for announcements, priority alerts, and team broadcasts."
        badge="REAL-TIME BROADCAST"
        icon={<Bell className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
      />

      {/* Main Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === "inbox"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>My Notifications</span>
            {unreadCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === "inbox" ? "bg-white text-indigo-700" : "bg-rose-500 text-white"}`}>
                {unreadCount}
              </span>
            )}
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab("broadcast")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === "broadcast"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                  : "bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Broadcast & Send Alert</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200">
                ADMIN
              </span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === "logs"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
                  : "bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Broadcast History</span>
            </button>
          )}
        </div>

        {/* Live sync indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Real-time WebSocket & Push Enabled</span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: MY INBOX NOTIFICATIONS                                             */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "inbox" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === "all"
                    ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filter === "unread"
                    ? "bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
                <span>({unreadCount})</span>
              </button>
              <button
                onClick={() => setFilter("urgent")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filter === "urgent"
                    ? "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Urgent ({urgentCount})</span>
              </button>
            </div>

            {/* Search and Bulk Actions */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Notifications Feed */}
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Syncing notifications feed...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-8">
              <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-500/20">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No notifications found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || filter !== "all"
                  ? "Try clearing your filters or search terms to view all updates."
                  : "You're all caught up! New alerts and messages will appear here in real-time."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const isUrgent = n.urgency === "HIGH";
                const isLow = n.urgency === "LOW";

                const relativeTime = n.createdAt
                  ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
                  : "";
                const exactTime = n.createdAt
                  ? new Date(n.createdAt).toLocaleTimeString("en-US", {
                      timeZone: "Asia/Kolkata",
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })
                  : "";

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) handleMarkSingleRead(n.id);
                    }}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start justify-between gap-4 cursor-pointer group ${
                      !n.isRead
                        ? "bg-gradient-to-r from-indigo-50/70 via-white to-amber-50/30 dark:from-indigo-950/40 dark:via-slate-900 dark:to-amber-950/20 border-indigo-200/80 dark:border-indigo-500/40 shadow-md"
                        : "bg-white/80 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-slate-200/80 dark:border-slate-800/80 shadow-xs"
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                          isUrgent
                            ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
                            : isLow
                            ? "bg-slate-50 dark:bg-slate-500/10 text-slate-500 border-slate-200 dark:border-slate-500/30"
                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                        }`}
                      >
                        {isUrgent ? (
                          <ShieldAlert className="w-5 h-5" />
                        ) : isLow ? (
                          <Info className="w-5 h-5" />
                        ) : (
                          <Bell className="w-5 h-5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                            {n.title}
                          </h4>

                          {/* Urgency Badge */}
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase ${
                              isUrgent
                                ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300"
                                : isLow
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                : "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300"
                            }`}
                          >
                            {n.urgency} PRIORITY
                          </span>

                          {!n.isRead && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                          {n.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {relativeTime} • {exactTime}
                          </span>

                          {n.linkUrl && (
                            <Link
                              href={getCleanHref(n.linkUrl)}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!n.isRead) handleMarkSingleRead(n.id);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              <span>Open associated link</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {!n.isRead ? (
                        <button
                          onClick={(e) => handleMarkSingleRead(n.id, e)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1 transition-all"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Read</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Read</span>
                        </span>
                      )}

                      <button
                        onClick={(e) => handleDeleteNotification(n.id, e)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: BROADCAST & SEND ALERT (ADMIN CONSOLE)                              */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isAdmin && activeTab === "broadcast" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Send className="w-5 h-5 text-amber-500" />
                    <span>Create & Send Notification Message</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Send instantaneous announcements to the entire company, specific departments, or individual employees.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                  DISPATCH CONSOLE
                </span>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-5 text-xs">
                {/* 1. Recipient Target Switcher */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
                    Select Target Audience *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setTargetType("ALL")}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                        targetType === "ALL"
                          ? "bg-amber-50 dark:bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-300 font-bold ring-2 ring-amber-500/20"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <Users className="w-5 h-5" />
                      <span className="text-xs">All Employees</span>
                      <span className="text-[10px] opacity-75">Whole Organization</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetType("DEPARTMENT")}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                        targetType === "DEPARTMENT"
                          ? "bg-amber-50 dark:bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-300 font-bold ring-2 ring-amber-500/20"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <Building className="w-5 h-5" />
                      <span className="text-xs">Department</span>
                      <span className="text-[10px] opacity-75">Specific Team</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetType("USER")}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                        targetType === "USER"
                          ? "bg-amber-50 dark:bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-300 font-bold ring-2 ring-amber-500/20"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span className="text-xs">Individual Employee</span>
                      <span className="text-[10px] opacity-75">Direct Message</span>
                    </button>
                  </div>
                </div>

                {/* Sub-selectors depending on target */}
                {targetType === "DEPARTMENT" && (
                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2 animate-in fade-in duration-200">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">
                      Choose Department:
                    </label>
                    <select
                      value={targetDepartment}
                      onChange={(e) => setTargetDepartment(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:border-amber-500"
                    >
                      {departmentsList.map((d) => (
                        <option key={d} value={d}>
                          {d} Department
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType === "USER" && (
                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2 animate-in fade-in duration-200">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">
                      Select Individual Employee:
                    </label>
                    <select
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:border-amber-500"
                      required
                    >
                      <option value="">-- Choose Employee --</option>
                      {employeesList.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.designation} • {emp.department}) — {emp.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 2. Urgency Selection */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
                    Priority & Urgency Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setNotifUrgency("LOW")}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        notifUrgency === "LOW"
                          ? "bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-900 dark:text-slate-100 ring-2 ring-slate-400/20"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500"
                      }`}
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Low (Info)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotifUrgency("MEDIUM")}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        notifUrgency === "MEDIUM"
                          ? "bg-amber-100 dark:bg-amber-900/40 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500"
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      <span>Medium (Standard)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotifUrgency("HIGH")}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        notifUrgency === "HIGH"
                          ? "bg-rose-100 dark:bg-rose-900/40 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500"
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                      <span>High (Urgent)</span>
                    </button>
                  </div>
                </div>

                {/* 3. Title */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Critical Team Meeting / Policy Announcement"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 transition-all font-semibold"
                  />
                </div>

                {/* 4. Message Body */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">
                      Notification Message / Details *
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {notifMessage.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write your announcement or direct instructions here..."
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 transition-all font-normal leading-relaxed resize-none"
                  />
                </div>

                {/* 5. Optional Action Link */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                    <span>Direct Action Link URL (Optional)</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      e.g. /projects, /attendance, /employee/updates
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="/projects or /employee/updates"
                    value={notifLinkUrl}
                    onChange={(e) => setNotifLinkUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 transition-all font-mono"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={sending || !notifTitle || !notifMessage}
                  className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Broadcasting Notification…</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {targetType === "ALL"
                          ? "Broadcast to All Employees"
                          : targetType === "DEPARTMENT"
                          ? `Send to ${targetDepartment} Department`
                          : "Send to Individual Employee"}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Quick Templates & Live Preview Sidebar (1 col) */}
          <div className="space-y-6">
            {/* Quick Templates */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Quick Templates</span>
              </div>

              <div className="space-y-2">
                {QUICK_TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 text-left transition-all group"
                  >
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                      {t.label}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {t.message}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Card Preview */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide font-mono">
                Live Notification Preview
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 shadow-inner">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {notifTitle || "Notification Title Preview"}
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 uppercase">
                    {notifUrgency}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {notifMessage || "The notification message preview will display here in real-time."}
                </p>

                {notifLinkUrl && (
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 pt-1">
                    <span>Target link: {notifLinkUrl}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: BROADCAST HISTORY / LOGS (ADMIN ONLY)                               */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isAdmin && activeTab === "logs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Authoritative Dispatch History
              </h3>
              <p className="text-xs text-slate-400">
                Records of notifications received by users across the system.
              </p>
            </div>
            <button
              onClick={fetchBroadcastLogs}
              disabled={logsLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin" : ""}`} />
              <span>Refresh Logs</span>
            </button>
          </div>

          {logsLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-2">Loading broadcast logs...</p>
            </div>
          ) : broadcastLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No recent notification logs found.
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-slate-500 font-mono text-[10px] uppercase">
                      <th className="p-3.5">Recipient</th>
                      <th className="p-3.5">Notification Title & Content</th>
                      <th className="p-3.5">Priority</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Timestamp (IST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {broadcastLogs.map((log) => {
                      const logTime = log.createdAt
                        ? new Date(log.createdAt).toLocaleTimeString("en-US", {
                            timeZone: "Asia/Kolkata",
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "numeric",
                            month: "short",
                          })
                        : "";

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-3.5 align-top">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {log.recipient?.name || "User"}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {log.recipient?.email}
                            </div>
                            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                              {log.recipient?.department || "General"}
                            </div>
                          </td>

                          <td className="p-3.5 align-top max-w-md">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {log.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                              {log.message}
                            </div>
                            {log.linkUrl && (
                              <div className="text-[10px] text-indigo-500 font-mono mt-1">
                                Link: {log.linkUrl}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5 align-top">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                log.urgency === "HIGH"
                                  ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300"
                                  : log.urgency === "LOW"
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                              }`}
                            >
                              {log.urgency}
                            </span>
                          </td>

                          <td className="p-3.5 align-top">
                            {log.isRead ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Read</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Unread</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 align-top font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {logTime}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
