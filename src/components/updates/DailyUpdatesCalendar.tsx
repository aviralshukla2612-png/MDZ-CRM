"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  FolderKanban,
  User,
  Building,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
  Check,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";

export interface DailyUpdateCalendarEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  projectId?: string;
  projectName?: string;
  projectNumber?: string;
  clientName?: string;
  visibility?: string;
  author: {
    name: string;
    designation: string;
    avatarUrl?: string | null;
  };
}

interface DailyUpdatesCalendarProps {
  updates: DailyUpdateCalendarEntry[];
  projects: any[];
  isAdmin: boolean;
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onPostUpdate?: () => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function DailyUpdatesCalendar({
  updates,
  projects,
  isAdmin,
  selectedProjectId = "ALL",
  onSelectProject,
  onPostUpdate,
}: DailyUpdatesCalendarProps) {
  const today = useMemo(() => new Date(), []);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [holidays, setHolidays] = useState<any[]>([]);

  // Fetch holidays for current year
  React.useEffect(() => {
    fetch(`/mdz-crm/api/holidays?year=${currentYear}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setHolidays(json.data || []);
      })
      .catch((err) => console.error("Error loading calendar holidays:", err));
  }, [currentYear]);

  // Filters
  const [filterProject, setFilterProject] = useState<string>(selectedProjectId || "ALL");
  const [filterAuthor, setFilterAuthor] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync prop changes
  React.useEffect(() => {
    if (selectedProjectId) {
      setFilterProject(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Extract unique authors
  const uniqueAuthors = useMemo(() => {
    const map = new Map<string, string>();
    updates.forEach((u) => {
      if (u.author?.name) {
        map.set(u.author.name, u.author.designation || "Team Member");
      }
    });
    return Array.from(map.entries()).map(([name, role]) => ({ name, role }));
  }, [updates]);

  // Helper to extract YYYY-MM-DD
  const getDateKey = (dateInput: Date | string | null | undefined): string | null => {
    if (!dateInput) return null;
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return null;
    }
  };

  // Map holidays by date key (YYYY-MM-DD)
  const holidaysByDateMap = useMemo(() => {
    const map = new Map<string, any>();
    holidays.forEach((h) => {
      if (!h.date || h.isActive === false) return;
      const key = getDateKey(h.date);
      if (key) map.set(key, h);
    });
    return map;
  }, [holidays]);

  // Filter updates
  const filteredUpdates = useMemo(() => {
    return updates.filter((u) => {
      if (filterProject !== "ALL") {
        if (u.projectId !== filterProject) return false;
      }
      if (filterAuthor !== "ALL") {
        if (u.author?.name !== filterAuthor) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (u.title || "").toLowerCase().includes(q);
        const matchesContent = (u.content || "").toLowerCase().includes(q);
        const matchesProject = (u.projectName || "").toLowerCase().includes(q);
        const matchesAuthor = (u.author?.name || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesProject && !matchesAuthor) {
          return false;
        }
      }
      return true;
    });
  }, [updates, filterProject, filterAuthor, searchQuery]);

  // Map updates by date string (YYYY-MM-DD)
  const updatesByDateMap = useMemo(() => {
    const map = new Map<string, DailyUpdateCalendarEntry[]>();
    filteredUpdates.forEach((u) => {
      const key = getDateKey(u.createdAt);
      if (key) {
        const list = map.get(key) || [];
        list.push(u);
        map.set(key, list);
      }
    });
    return map;
  }, [filteredUpdates]);

  // Calendar cells
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{
      id: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      date: Date;
      dateKey: string;
      isToday: boolean;
      isSelected: boolean;
      updates: DailyUpdateCalendarEntry[];
      holiday: any | null;
    }> = [];

    // Prev month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const key = getDateKey(prevDate)!;
      cells.push({
        id: `prev-${dayNum}`,
        dayNumber: dayNum,
        isCurrentMonth: false,
        date: prevDate,
        dateKey: key,
        isToday:
          today.getFullYear() === prevDate.getFullYear() &&
          today.getMonth() === prevDate.getMonth() &&
          today.getDate() === prevDate.getDate(),
        isSelected:
          selectedDate.getFullYear() === prevDate.getFullYear() &&
          selectedDate.getMonth() === prevDate.getMonth() &&
          selectedDate.getDate() === prevDate.getDate(),
        updates: updatesByDateMap.get(key) || [],
        holiday: holidaysByDateMap.get(key) || null,
      });
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const thisDate = new Date(currentYear, currentMonth, day);
      const key = getDateKey(thisDate)!;
      cells.push({
        id: `curr-${day}`,
        dayNumber: day,
        isCurrentMonth: true,
        date: thisDate,
        dateKey: key,
        isToday:
          today.getFullYear() === currentYear &&
          today.getMonth() === currentMonth &&
          today.getDate() === day,
        isSelected:
          selectedDate.getFullYear() === currentYear &&
          selectedDate.getMonth() === currentMonth &&
          selectedDate.getDate() === day,
        updates: updatesByDateMap.get(key) || [],
        holiday: holidaysByDateMap.get(key) || null,
      });
    }

    // Trailing days
    const totalCells = cells.length;
    const remaining = 7 - (totalCells % 7);
    if (remaining < 7 && remaining > 0) {
      for (let nextDay = 1; nextDay <= remaining; nextDay++) {
        const nextDate = new Date(currentYear, currentMonth + 1, nextDay);
        const key = getDateKey(nextDate)!;
        cells.push({
          id: `next-${nextDay}`,
          dayNumber: nextDay,
          isCurrentMonth: false,
          date: nextDate,
          dateKey: key,
          isToday:
            today.getFullYear() === nextDate.getFullYear() &&
            today.getMonth() === nextDate.getMonth() &&
            today.getDate() === nextDate.getDate(),
          isSelected:
            selectedDate.getFullYear() === nextDate.getFullYear() &&
            selectedDate.getMonth() === nextDate.getMonth() &&
            selectedDate.getDate() === nextDate.getDate(),
          updates: updatesByDateMap.get(key) || [],
          holiday: holidaysByDateMap.get(key) || null,
        });
      }
    }

    return cells;
  }, [currentYear, currentMonth, selectedDate, today, updatesByDateMap, holidaysByDateMap]);

  // Selected date updates
  const selectedDateKey = useMemo(() => getDateKey(selectedDate), [selectedDate]);
  const selectedHoliday = useMemo(() => (selectedDateKey ? holidaysByDateMap.get(selectedDateKey) || null : null), [selectedDateKey, holidaysByDateMap]);
  const updatesForSelectedDate = useMemo(() => {
    if (!selectedDateKey) return [];
    return updatesByDateMap.get(selectedDateKey) || [];
  }, [selectedDateKey, updatesByDateMap]);

  // Format date display
  const formattedSelectedDate = useMemo(() => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  // Parse update content into numbered points
  const parseNumberedContent = (content: string) => {
    if (!content) return { points: [], note: "" };
    const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
    const points: string[] = [];
    const notes: string[] = [];

    lines.forEach((line) => {
      const match = line.match(/^(\d+[.)]|[-•])\s*(.*)$/);
      if (match && match[2]) {
        points.push(match[2]);
      } else if (line.toLowerCase().startsWith("note:")) {
        notes.push(line.replace(/^note:\s*/i, ""));
      } else {
        points.push(line);
      }
    });

    return { points, note: notes.join(" ") };
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Month Control Bar */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Month Title & Navigation */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {filteredUpdates.length} Logs
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Interactive date-wise daily progress & task monitoring
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1.5 ml-auto sm:ml-4 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGoToday}
                className="px-3 py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Project */}
            <div className="relative min-w-[200px]">
              <select
                value={filterProject}
                onChange={(e) => {
                  setFilterProject(e.target.value);
                  if (onSelectProject) onSelectProject(e.target.value);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">🌐 All Projects ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Team Member */}
            <div className="relative min-w-[180px]">
              <select
                value={filterAuthor}
                onChange={(e) => setFilterAuthor(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">👤 All Team Members ({uniqueAuthors.length})</option>
                {uniqueAuthors.map((a) => (
                  <option key={a.name} value={a.name}>
                    👤 {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search points..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT: Calendar Grid (8 cols) + Daily Progress Log Details (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CALENDAR GRID */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 shadow-sm space-y-4">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div
                key={day}
                className={`py-2 text-[11px] font-mono font-extrabold uppercase rounded-lg ${
                  idx === 0
                    ? "text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30"
                    : "text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarCells.map((cell) => {
              const hasUpdates = cell.updates.length > 0;
              const updateCount = cell.updates.length;
              const hol = cell.holiday;

              return (
                <div
                  key={cell.id}
                  onClick={() => setSelectedDate(cell.date)}
                  className={`min-h-[85px] sm:min-h-[105px] p-2 rounded-2xl border transition-all duration-150 flex flex-col justify-between cursor-pointer relative group ${
                    cell.isSelected
                      ? "ring-2 ring-amber-500 border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 shadow-md"
                      : cell.isToday
                      ? "border-amber-400 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-950/20"
                      : hol
                      ? hol.type === "COMPANY"
                        ? "bg-sky-50/50 dark:bg-sky-950/20 border-sky-300/80 dark:border-sky-800/60 hover:bg-sky-50/80"
                        : "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/60 hover:bg-emerald-50/70"
                      : cell.isCurrentMonth
                      ? "bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:border-amber-400/80 hover:bg-amber-50/20"
                      : "bg-slate-50/20 dark:bg-slate-900/30 border-slate-200/40 dark:border-slate-800/40 opacity-40 hover:opacity-75"
                  }`}
                >
                  {/* Day Number + Update Count / Holiday Pin */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-black font-mono ${
                        cell.isToday
                          ? "w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs text-xs"
                          : cell.isSelected
                          ? "text-amber-600 dark:text-amber-400 font-extrabold"
                          : hol
                          ? hol.type === "COMPANY"
                            ? "text-sky-700 dark:text-sky-300 font-extrabold"
                            : "text-emerald-700 dark:text-emerald-300 font-extrabold"
                          : cell.isCurrentMonth
                          ? "text-slate-800 dark:text-slate-200"
                          : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {hol ? (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${
                          hol.type === "COMPANY"
                            ? "bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-700"
                            : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700"
                        }`}
                        title={hol.title}
                      >
                        <span>{hol.type === "COMPANY" ? "🏢" : "🎉"}</span>
                      </span>
                    ) : hasUpdates ? (
                      <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-2xs">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                        <span>{updateCount}</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Holiday / Updates Mini Preview Chunks */}
                  <div className="space-y-1 overflow-hidden my-auto">
                    {hol && (
                      <div
                        className={`text-[9px] leading-tight px-1.5 py-0.5 rounded-md truncate font-bold flex items-center gap-1 ${
                          hol.type === "COMPANY"
                            ? "bg-sky-100/90 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-700"
                            : "bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                        }`}
                        title={hol.title}
                      >
                        <span className="truncate">{hol.title}</span>
                      </div>
                    )}

                    {cell.updates.slice(0, hol ? 1 : 2).map((u) => (
                      <div
                        key={u.id}
                        className="text-[10px] leading-tight px-1.5 py-1 rounded-md truncate font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1 shadow-2xs"
                        title={`${u.title} (${u.author?.name || "Employee"})`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="truncate">{u.projectName || u.title}</span>
                      </div>
                    ))}

                    {updateCount > (hol ? 1 : 2) && (
                      <div className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 px-1">
                        +{updateCount - (hol ? 1 : 2)} more logs...
                      </div>
                    )}
                  </div>

                  {/* Day Footer Status */}
                  <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate">
                    {hasUpdates
                      ? `${cell.updates[0]?.author?.name?.split(" ")[0] || "Logged"}`
                      : hol
                      ? hol.type
                      : ""}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Daily Update Logged</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Holiday / Celebration</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>Company Off</span>
              </span>
            </div>
            <div className="font-mono text-slate-400 text-[11px]">
              Click any date to inspect submitted progress highlights
            </div>
          </div>
        </div>

        {/* SELECTED DATE DETAIL DRAWER */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-4 sticky top-4">
          {/* Drawer Header */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-2">
            <div className="text-[11px] font-mono uppercase font-extrabold text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4" />
              <span>Daily Log Inspection</span>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              {formattedSelectedDate}
            </h3>

            {/* Holiday Notice if present */}
            {selectedHoliday && (
              <div
                className={`p-3 rounded-2xl border flex items-center gap-3 ${
                  selectedHoliday.type === "COMPANY"
                    ? "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200"
                    : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                }`}
              >
                <span className="text-xl">
                  {selectedHoliday.type === "COMPANY" ? "🏢" : "🎉"}
                </span>
                <div>
                  <div className="font-extrabold text-xs">{selectedHoliday.title}</div>
                  <div className="text-[11px] opacity-80">
                    {selectedHoliday.type} Holiday {selectedHoliday.state ? `• ${selectedHoliday.state}` : ""}
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500 dark:text-slate-400">
              {updatesForSelectedDate.length === 0
                ? "No progress logs submitted for this date"
                : `${updatesForSelectedDate.length} progress update(s) recorded`}
            </div>
          </div>

          {/* Updates List on Selected Date */}
          <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
            {updatesForSelectedDate.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    No Logs For This Date
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                    No team members logged daily updates on {selectedDate.toLocaleDateString()}.
                  </p>
                </div>
              </div>
            ) : (
              updatesForSelectedDate.map((u) => {
                const { points, note } = parseNumberedContent(u.content);

                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 hover:border-amber-400 dark:hover:border-amber-500 transition-all"
                  >
                    {/* Top Row: Title, Project Tag, Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                          {u.title}
                        </span>
                        {u.projectNumber && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {u.projectNumber}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(u.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Numbered Task Points */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Completed Task Highlights:
                      </div>

                      {points.length > 0 ? (
                        <div className="space-y-1.5">
                          {points.map((pt, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800"
                            >
                              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="flex-1 leading-snug">{pt}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          {u.content}
                        </div>
                      )}

                      {note && (
                        <div className="text-xs italic text-slate-600 dark:text-slate-400 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                          <strong>Note:</strong> {note}
                        </div>
                      )}
                    </div>

                    {/* Author & Project Footer */}
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {u.author?.name?.[0]?.toUpperCase() || "E"}
                        </div>
                        <span className="text-slate-700 dark:text-slate-300">
                          Logged by: <strong>{u.author?.name || "Team Member"}</strong>{" "}
                          <span className="text-[10px] text-slate-500">
                            ({u.author?.designation || "Dev"})
                          </span>
                        </span>
                      </div>

                      {u.projectId && (
                        <Link
                          href={`/projects/${u.projectId}`}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>View Project</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
