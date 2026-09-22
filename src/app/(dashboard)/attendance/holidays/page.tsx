"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PartyPopper,
  Info,
  Clock,
  ArrowLeft,
  RefreshCw,
  Edit3,
  MapPin,
  Building,
  Flag,
  Globe,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  Flame,
} from "lucide-react";

const INDIAN_STATES = [
  "All India (National)",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export default function CompanyHolidaysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const userRole = (session?.user as any)?.role || (session?.user as any)?.activeRole;
  const isOwnerOrAdmin = userRole === "OWNER" || userRole === "ADMIN" || userRole === "SUB_ADMIN";

  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Add / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [type, setType] = useState("COMPANY");
  const [state, setState] = useState("");
  const [description, setDescription] = useState("");
  const [isOptional, setIsOptional] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Details Modal
  const [detailHoliday, setDetailHoliday] = useState<any>(null);

  // Delete State
  const [deletingHoliday, setDeletingHoliday] = useState<any>(null);

  // Sync holidays for year
  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/mdz-crm/api/holidays?year=${selectedYear}&active=all`);
      const json = await res.json();
      if (json.success) {
        setHolidays(json.data || []);
      } else {
        showToast(json.error || "Failed to load holidays", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error fetching holidays", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncHolidays = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/mdz-crm/api/admin/holidays/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: selectedYear }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          `✓ ${json.message || `Synced ${json.fetched} Indian Holidays for ${selectedYear}!`} (${json.source})`,
          "success"
        );
        fetchHolidays();
      } else {
        showToast(json.error || "Failed to sync holidays", "error");
      }
    } catch {
      showToast("Network error during holiday sync", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenCreate = (prefillDate?: string) => {
    setEditingId(null);
    setTitle("");
    const mm = String(selectedMonth + 1).padStart(2, "0");
    setDateStr(prefillDate || `${selectedYear}-${mm}-01`);
    setEndDateStr("");
    setType("COMPANY");
    setState("");
    setDescription("");
    setIsOptional(false);
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (h: any) => {
    setEditingId(h.id);
    setTitle(h.title);

    const d = new Date(h.date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setDateStr(`${yyyy}-${mm}-${dd}`);

    if (h.endDate) {
      const ed = new Date(h.endDate);
      const eyyyy = ed.getFullYear();
      const emm = String(ed.getMonth() + 1).padStart(2, "0");
      const edd = String(ed.getDate()).padStart(2, "0");
      setEndDateStr(`${eyyyy}-${emm}-${edd}`);
    } else {
      setEndDateStr("");
    }

    setType(h.type || "COMPANY");
    setState(h.state || "");
    setDescription(h.description || "");
    setIsOptional(Boolean(h.isOptional));
    setIsActive(h.isActive !== false);
    setIsFormOpen(true);
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateStr) return;

    setSubmitting(true);
    try {
      const payload = {
        title,
        date: dateStr,
        endDate: endDateStr || undefined,
        type,
        state: state === "All India (National)" || !state ? undefined : state,
        description,
        isOptional,
        isActive,
      };

      let res;
      if (editingId) {
        res = await fetch(`/mdz-crm/api/admin/holidays/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/mdz-crm/api/admin/holidays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (json.success) {
        showToast(
          editingId ? "✓ Holiday updated successfully!" : "✓ Official holiday added successfully!",
          "success"
        );
        setIsFormOpen(false);
        fetchHolidays();
      } else {
        showToast(json.error || "Failed to save holiday", "error");
      }
    } catch {
      showToast("Network error saving holiday", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (h: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const newActive = !h.isActive;
      const res = await fetch(`/mdz-crm/api/admin/holidays/${h.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Holiday ${newActive ? "Enabled" : "Disabled"}`, "info");
        fetchHolidays();
      }
    } catch {
      showToast("Failed to toggle status", "error");
    }
  };

  const handleDeleteHoliday = async () => {
    if (!deletingHoliday) return;
    try {
      const res = await fetch(`/mdz-crm/api/admin/holidays/${deletingHoliday.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("Holiday removed successfully", "success");
        setDeletingHoliday(null);
        fetchHolidays();
      } else {
        showToast(json.error || "Failed to delete holiday", "error");
      }
    } catch {
      showToast("Network error deleting holiday", "error");
    }
  };

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Filtered Holidays List
  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      if (typeFilter !== "ALL" && h.type !== typeFilter) return false;
      if (stateFilter !== "ALL" && h.state !== stateFilter) return false;
      if (activeFilter === "ACTIVE" && !h.isActive) return false;
      if (activeFilter === "INACTIVE" && h.isActive) return false;
      return true;
    });
  }, [holidays, typeFilter, stateFilter, activeFilter]);

  // Calendar Grid Data
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    const cells: any[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ isEmpty: true, id: `empty-${i}` });
    }

    const currentMonthHolidays = filteredHolidays.filter((h: any) => {
      const d = new Date(h.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(selectedYear, selectedMonth, day);
      const dayOfWeek = cellDate.getDay();
      const isWeekend = dayOfWeek === 0; // Sunday
      const isToday =
        today.getDate() === day &&
        today.getMonth() === selectedMonth &&
        today.getFullYear() === selectedYear;

      const dayHolidays = currentMonthHolidays.filter((h: any) => {
        const d = new Date(h.date);
        return d.getDate() === day;
      });

      const mm = String(selectedMonth + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      const formattedDateStr = `${selectedYear}-${mm}-${dd}`;

      cells.push({
        isEmpty: false,
        id: `day-${day}`,
        day,
        isWeekend,
        isToday,
        holidays: dayHolidays,
        dateStr: formattedDateStr,
      });
    }

    return cells;
  }, [selectedMonth, selectedYear, filteredHolidays]);

  const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleString("default", {
    month: "long",
  });

  const getTypeBadgeStyle = (hType: string) => {
    switch (hType?.toUpperCase()) {
      case "COMPANY":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "STATE":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800";
      case "OPTIONAL":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "CUSTOM":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      default:
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    }
  };

  const stats = useMemo(() => {
    const totalCount = holidays.length;
    const publicCount = holidays.filter((h) => h.type === "PUBLIC" && h.isActive).length;
    const companyCount = holidays.filter((h) => (h.type === "COMPANY" || h.source === "ADMIN") && h.isActive).length;
    const optionalCount = holidays.filter((h) => (h.type === "OPTIONAL" || h.isOptional) && h.isActive).length;

    // Find next upcoming holiday from today
    const now = new Date();
    const upcoming = holidays
      .filter((h) => h.isActive && new Date(h.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null;

    let daysUntilUpcoming: number | null = null;
    if (upcoming) {
      const diffMs = new Date(upcoming.date).getTime() - now.getTime();
      daysUntilUpcoming = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const monthHolidaysCount = holidays.filter((h) => {
      const d = new Date(h.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && h.isActive;
    }).length;

    return {
      totalCount,
      publicCount,
      companyCount,
      optionalCount,
      upcoming,
      daysUntilUpcoming,
      monthHolidaysCount,
    };
  }, [holidays, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/attendance"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Attendance</span>
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <PartyPopper className="w-6 h-6 text-amber-500 animate-pulse" />
            <span>Indian & Company Holiday Calendar</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official Indian Public Holidays, State-Specific Observances, and Company-Custom Days Off.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isOwnerOrAdmin && (
            <button
              onClick={handleSyncHolidays}
              disabled={syncing}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Sync Indian Gazetted Holidays from Google Calendar"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing Indian Holidays..." : `Sync Indian Holidays (${selectedYear})`}</span>
            </button>
          )}

          {isOwnerOrAdmin && (
            <button
              onClick={() => handleOpenCreate()}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Holiday</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Annual Total */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {selectedYear} TOTAL HOLIDAYS
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
            {loading ? "--" : stats.totalCount}
          </div>
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            {stats.publicCount} Public / Gazetted Holidays
          </div>
        </div>

        {/* Card 2: Upcoming Holiday */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              UPCOMING HOLIDAY
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-black text-slate-900 dark:text-slate-100 truncate" title={stats.upcoming?.title || "No upcoming holidays"}>
            {stats.upcoming ? stats.upcoming.title : "No upcoming holidays"}
          </div>
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
            {stats.upcoming
              ? `${new Date(stats.upcoming.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • ${
                  stats.daysUntilUpcoming === 0
                    ? "Today!"
                    : stats.daysUntilUpcoming === 1
                    ? "Tomorrow"
                    : `In ${stats.daysUntilUpcoming} days`
                }`
              : "All year holidays passed"}
          </div>
        </div>

        {/* Card 3: Company Offs */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              COMPANY SPECIFIC OFFS
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
            {loading ? "--" : stats.companyCount}
          </div>
          <div className="text-xs font-semibold text-sky-600 dark:text-sky-400">
            Custom company holiday policy
          </div>
        </div>

        {/* Card 4: Month Active */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {monthName.toUpperCase()} {selectedYear}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
            {loading ? "--" : stats.monthHolidaysCount}
          </div>
          <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">
            Holiday(s) in active view
          </div>
        </div>
      </div>

      {/* Filter & Year Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Year & View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {[2025, 2026, 2027, 2028].map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedYear === y
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "calendar"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              List View ({filteredHolidays.length})
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300 font-semibold outline-none focus:border-amber-500"
          >
            <option value="ALL">All Types</option>
            <option value="PUBLIC">🟢 Public / Gazetted</option>
            <option value="COMPANY">🔵 Company Holidays</option>
            <option value="STATE">🟠 State Holidays</option>
            <option value="OPTIONAL">🟣 Optional / Restricted</option>
            <option value="CUSTOM">Custom</option>
          </select>

          {/* State Filter */}
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300 font-semibold outline-none focus:border-amber-500 max-w-[150px]"
          >
            <option value="ALL">All States</option>
            {INDIAN_STATES.filter((s) => s !== "All India (National)").map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Active Filter */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300 font-semibold outline-none focus:border-amber-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* VIEW MODE 1: CALENDAR GRID                                                 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {viewMode === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Calendar Grid */}
          <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xl space-y-6">
            {/* Controls: Month Navigation */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
                  {monthName} {selectedYear}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setSelectedMonth(today.getMonth());
                    setSelectedYear(today.getFullYear());
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Today
                </button>

                <button
                  onClick={nextMonth}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-2 text-center font-mono text-[11px] font-bold">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d, i) => (
                  <div
                    key={d}
                    className={i === 0 ? "text-rose-500 font-black" : "text-slate-500 dark:text-slate-400"}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarCells.map((cell) => {
                  if (cell.isEmpty) {
                    return (
                      <div
                        key={cell.id}
                        className="min-h-[95px] rounded-2xl bg-slate-50/40 dark:bg-slate-900/30 border border-transparent"
                      />
                    );
                  }

                  const hasHoliday = cell.holidays && cell.holidays.length > 0;

                  return (
                    <div
                      key={cell.id}
                      onClick={() => {
                        if (hasHoliday && cell.holidays.length === 1) {
                          setDetailHoliday(cell.holidays[0]);
                        } else if (isOwnerOrAdmin) {
                          handleOpenCreate(cell.dateStr);
                        }
                      }}
                      className={`min-h-[95px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        hasHoliday
                          ? "bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80 shadow-xs"
                          : cell.isToday
                          ? "bg-blue-50/40 dark:bg-blue-950/30 border-blue-500 ring-1 ring-blue-500"
                          : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span
                          className={
                            cell.isWeekend
                              ? "text-rose-500 dark:text-rose-400 font-black"
                              : "text-slate-800 dark:text-slate-200"
                          }
                        >
                          {cell.day}
                        </span>
                        {hasHoliday ? (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        ) : cell.isWeekend ? (
                          <span className="text-[10px] text-slate-400 font-normal">OFF</span>
                        ) : null}
                      </div>

                      <div className="space-y-1 mt-1">
                        {cell.holidays?.map((h: any) => {
                          const isCompany = h.type === "COMPANY";
                          return (
                            <div
                              key={h.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailHoliday(h);
                              }}
                              className={`p-1 rounded-lg text-[10px] font-bold truncate leading-tight shadow-xs ${
                                isCompany
                                  ? "bg-blue-600 text-white"
                                  : h.type === "STATE"
                                  ? "bg-orange-600 text-white"
                                  : h.type === "OPTIONAL"
                                  ? "bg-purple-600 text-white"
                                  : "bg-amber-600 text-white"
                              }`}
                              title={`${h.title} (${h.type}): ${h.description || ""}`}
                            >
                              🎉 {h.title}
                            </div>
                          );
                        })}
                      </div>

                      {!hasHoliday && isOwnerOrAdmin && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 font-semibold transition-opacity text-right">
                          + Add
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Month Holidays Summary */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-amber-500" />
                  <span>Holidays ({selectedYear})</span>
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  {filteredHolidays.length} Total
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                  Loading holidays...
                </div>
              ) : filteredHolidays.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Info className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    No holidays scheduled for {selectedYear} matching your criteria.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {filteredHolidays.map((h: any) => {
                    const d = new Date(h.date);
                    const dateStrFormatted = d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      weekday: "short",
                    });

                    return (
                      <div
                        key={h.id}
                        onClick={() => setDetailHoliday(h)}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border border-slate-200 dark:border-slate-700/80 flex items-start justify-between gap-3 group cursor-pointer transition-all"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                              {h.title}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold ${getTypeBadgeStyle(
                                h.type
                              )}`}
                            >
                              {h.type}
                            </span>
                            {h.state && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {h.state}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                            📅 {dateStrFormatted}
                          </div>
                          {h.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-1">
                              {h.description}
                            </p>
                          )}
                        </div>

                        {isOwnerOrAdmin && (
                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(h);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                              title="Edit Holiday"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingHoliday(h);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
                              title="Delete Holiday"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              💡 Official holidays are automatically published to all employee attendance analytics and excluded from working-day counts.
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* VIEW MODE 2: DETAILED LIST TABLE                                           */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="p-3.5">Date (IST)</th>
                  <th className="p-3.5">Holiday Name & Description</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Region / State</th>
                  <th className="p-3.5">Source</th>
                  <th className="p-3.5">Status</th>
                  {isOwnerOrAdmin && <th className="p-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredHolidays.map((h) => {
                  const d = new Date(h.date);
                  const dateStr = d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    weekday: "short",
                  });

                  return (
                    <tr
                      key={h.id}
                      onClick={() => setDetailHoliday(h)}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="p-3.5 max-w-sm">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                          {h.title}
                        </div>
                        {h.description && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {h.description}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getTypeBadgeStyle(
                            h.type
                          )}`}
                        >
                          {h.type}
                        </span>
                      </td>

                      <td className="p-3.5 font-medium text-slate-600 dark:text-slate-400">
                        {h.state || "All India (National)"}
                      </td>

                      <td className="p-3.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                          {h.source || "SYSTEM"}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {h.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Disabled</span>
                          </span>
                        )}
                      </td>

                      {isOwnerOrAdmin && (
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleToggleActive(h)}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold"
                            >
                              {h.isActive ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => handleOpenEdit(h)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingHoliday(h)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ADD / EDIT HOLIDAY BOTTOM SHEET                                            */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? "Edit Holiday" : "Add Official Holiday"}
        subtitle="Schedule official public, state, or company holidays across MDZ-CRM."
      >
        <form onSubmit={handleSaveHoliday} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
              Holiday Title / Festival Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Gandhi Jayanti, Diwali, Company Foundation Day"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
                Holiday Date *
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
                End Date (Optional for multi-day)
              </label>
              <input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
                Holiday Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:border-amber-500"
              >
                <option value="COMPANY">🔵 Company Holiday (All Staff)</option>
                <option value="PUBLIC">🟢 Public / Gazetted Holiday</option>
                <option value="STATE">🟠 State-Specific Holiday</option>
                <option value="OPTIONAL">🟣 Optional / Restricted Holiday</option>
                <option value="CUSTOM">Custom Holiday</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
                Applicable State / Region
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:border-amber-500"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s === "All India (National)" ? "" : s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background context or instructions..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isOptional}
                onChange={(e) => setIsOptional(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                Discretionary / Optional Holiday
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                Active & Applicable
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="w-1/3 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-2/3 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Holiday...</span>
                </>
              ) : (
                <>
                  <PartyPopper className="w-4 h-4" />
                  <span>{editingId ? "Update Holiday" : "Create Holiday"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* HOLIDAY DETAILS POPUP MODAL                                                */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {detailHoliday && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <PartyPopper className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    {detailHoliday.title}
                  </h3>
                  <div className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    📅 {new Date(detailHoliday.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDetailHoliday(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Type</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {detailHoliday.type}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Region</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {detailHoliday.state || "All India (National)"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Source</span>
                <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {detailHoliday.source || "SYSTEM"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Attendance</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  Not Required (Paid Off)
                </div>
              </div>
            </div>

            {detailHoliday.description && (
              <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {detailHoliday.description}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {isOwnerOrAdmin && (
                <button
                  onClick={() => {
                    const h = detailHoliday;
                    setDetailHoliday(null);
                    handleOpenEdit(h);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Holiday</span>
                </button>
              )}
              <button
                onClick={() => setDetailHoliday(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingHoliday && (
        <ConfirmModal
          isOpen={Boolean(deletingHoliday)}
          onClose={() => setDeletingHoliday(null)}
          onConfirm={handleDeleteHoliday}
          title="Delete Holiday"
          message={`Are you sure you want to delete "${deletingHoliday.title}" on ${new Date(
            deletingHoliday.date
          ).toLocaleDateString()}?`}
          confirmText="Yes, Delete"
          isDestructive={true}
        />
      )}
    </div>
  );
}
