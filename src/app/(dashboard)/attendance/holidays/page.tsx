"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";

export default function CompanyHolidaysPage() {
  const { showToast } = useToast();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [description, setDescription] = useState("");
  const [isOptional, setIsOptional] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingHoliday, setDeletingHoliday] = useState<any>(null);

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/mdz-crm/api/holidays?year=${selectedYear}`);
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

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateStr) return;
    try {
      setSubmitting(true);
      const res = await fetch("/mdz-crm/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: dateStr,
          description,
          isOptional,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Official holiday added successfully!", "success");
        setIsAddOpen(false);
        setTitle("");
        setDateStr("");
        setDescription("");
        setIsOptional(false);
        fetchHolidays();
      } else {
        showToast(json.error || "Failed to create holiday", "error");
      }
    } catch (err) {
      showToast("Network error creating holiday", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHoliday = async () => {
    if (!deletingHoliday) return;
    try {
      const res = await fetch(`/mdz-crm/api/holidays/${deletingHoliday.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("Holiday deleted successfully", "success");
        setDeletingHoliday(null);
        fetchHolidays();
      } else {
        showToast(json.error || "Failed to delete holiday", "error");
      }
    } catch (err) {
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

  // Calendar Grid Data
  const calendarCells = React.useMemo(() => {
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    const cells: any[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ isEmpty: true, id: `empty-${i}` });
    }

    const currentYearHolidays = holidays.filter((h: any) => {
      const d = new Date(h.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(selectedYear, selectedMonth, day);
      const dayOfWeek = cellDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday =
        today.getDate() === day &&
        today.getMonth() === selectedMonth &&
        today.getFullYear() === selectedYear;

      const dayHolidays = currentYearHolidays.filter((h: any) => {
        const d = new Date(h.date);
        return d.getDate() === day;
      });

      // Format date for inputs YYYY-MM-DD
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
  }, [selectedMonth, selectedYear, holidays]);

  const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleString("default", {
    month: "long",
  });

  return (
    <div className="space-y-6 pb-16">
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
            <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Company Holidays Calendar</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage official company holidays, observances, and days off across all employee calendars.
          </p>
        </div>

        <button
          onClick={() => {
            const mm = String(selectedMonth + 1).padStart(2, "0");
            setDateStr(`${selectedYear}-${mm}-01`);
            setIsAddOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Official Holiday</span>
        </button>
      </div>

      {/* Main Grid: Calendar View + Sidebar list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Calendar Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
          {/* Controls: Month Navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
                {monthName} {selectedYear}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setSelectedMonth(today.getMonth());
                  setSelectedYear(today.getFullYear());
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
              >
                Today
              </button>

              <button
                onClick={nextMonth}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
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
                <div key={d} className={i === 0 || i === 6 ? "text-rose-500" : "text-slate-400"}>
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
                      className="min-h-[90px] rounded-xl bg-slate-50/40 dark:bg-slate-900/30 border border-transparent"
                    />
                  );
                }

                const hasHoliday = cell.holidays && cell.holidays.length > 0;

                return (
                  <div
                    key={cell.id}
                    onClick={() => {
                      setDateStr(cell.dateStr);
                      setIsAddOpen(true);
                    }}
                    className={`min-h-[90px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      hasHoliday
                        ? "bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800 ring-1 ring-indigo-400/40"
                        : cell.isToday
                        ? "bg-blue-50/40 dark:bg-blue-950/30 border-blue-500 ring-1 ring-blue-500"
                        : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span
                        className={
                          cell.isWeekend
                            ? "text-slate-400 dark:text-slate-500"
                            : "text-slate-800 dark:text-slate-200"
                        }
                      >
                        {cell.day}
                      </span>
                      {hasHoliday ? (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-extrabold flex items-center gap-0.5">
                          <PartyPopper className="w-2.5 h-2.5" />
                          <span>HOLIDAY</span>
                        </span>
                      ) : cell.isWeekend ? (
                        <span className="text-[10px] text-slate-400 font-normal">OFF</span>
                      ) : null}
                    </div>

                    <div className="space-y-1 mt-1">
                      {cell.holidays?.map((h: any) => (
                        <div
                          key={h.id}
                          className="p-1 rounded bg-indigo-600 text-white text-[10px] font-bold truncate leading-tight shadow-xs"
                          title={`${h.title}: ${h.description || ""}`}
                        >
                          🎉 {h.title}
                        </div>
                      ))}
                    </div>

                    {!hasHoliday && (
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 font-semibold transition-opacity text-right">
                        + Add
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Holidays List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PartyPopper className="w-4 h-4 text-indigo-500" />
                <span>Holidays ({selectedYear})</span>
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                {holidays.length} Total
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                Loading holidays...
              </div>
            ) : holidays.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Info className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No company holidays scheduled for {selectedYear}.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {holidays.map((h: any) => {
                  const d = new Date(h.date);
                  const dateStrFormatted = d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    weekday: "short",
                  });

                  return (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {h.title}
                          </span>
                          {h.isOptional && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold">
                              Optional
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                          📅 {dateStrFormatted}
                        </div>
                        {h.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {h.description}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => setDeletingHoliday(h)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all opacity-80 group-hover:opacity-100"
                        title="Delete Holiday"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            💡 Official holidays are automatically published to all employee attendance calendars and analytics.
          </div>
        </div>
      </div>

      {/* Add Holiday Bottom Sheet */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Company Holiday"
        subtitle="Schedule an official holiday across all employee calendars."
      >
        <form onSubmit={handleCreateHoliday} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Holiday Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Gandhi Jayanti, Diwali, New Year's Day"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Holiday Date *
            </label>
            <input
              type="date"
              required
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context or details about this holiday..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isOptionalCheck"
              checked={isOptional}
              onChange={(e) => setIsOptional(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="isOptionalCheck"
              className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Restricted / Optional Holiday (Discretionary)
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="w-1/2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-1/2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Add Holiday"}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Delete Confirmation Modal */}
      {deletingHoliday && (
        <ConfirmModal
          isOpen={Boolean(deletingHoliday)}
          onClose={() => setDeletingHoliday(null)}
          onConfirm={handleDeleteHoliday}
          title="Delete Holiday"
          message={`Are you sure you want to delete "${deletingHoliday.title}" on ${new Date(deletingHoliday.date).toLocaleDateString()}? This action will remove it from all employee calendars.`}
          confirmText="Yes, Delete"
          isDestructive={true}
        />
      )}
    </div>
  );
}
