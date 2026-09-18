"use client";

import React, { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Clock, Calendar, AlertCircle, Sparkles, CheckCircle2, Moon, Camera } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface TimeModificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultDate?: string;
  attendanceId?: string;
  initialPunchIn?: string;
  initialPunchOut?: string;
}

export const TimeModificationModal: React.FC<TimeModificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
  attendanceId,
  initialPunchIn,
  initialPunchOut,
}) => {
  const { showToast } = useToast();
  const todayStr = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(defaultDate || todayStr);
  const [punchInTime, setPunchInTime] = useState(
    initialPunchIn ? initialPunchIn.slice(11, 16) : "09:00"
  );
  const [punchOutTime, setPunchOutTime] = useState(
    initialPunchOut ? initialPunchOut.slice(11, 16) : "18:00"
  );
  const [isPastMidnight, setIsPastMidnight] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common quick templates
  const reasonTemplates = [
    "Late night video shoot at client location",
    "Emergency client deployment & server migration",
    "Mispunch / auto-logged out at 12:00 AM while still working",
    "On-field client shoot & photography assignment",
    "Off-site technical support past midnight",
  ];

  // Calculate preview hours
  const calculateDurationPreview = () => {
    try {
      const startDateTime = new Date(`${date}T${punchInTime}:00`);
      let endDateTime = new Date(`${date}T${punchOutTime}:00`);
      if (isPastMidnight) {
        endDateTime = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000);
      }
      const diffMs = endDateTime.getTime() - startDateTime.getTime();
      if (diffMs <= 0) return "Invalid time range";
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m (${isPastMidnight ? "spans past midnight into next day" : "same day"})`;
    } catch {
      return "--";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast("Please provide a reason for the time modification", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const startDateTime = new Date(`${date}T${punchInTime}:00`);
      let endDateTime = new Date(`${date}T${punchOutTime}:00`);
      if (isPastMidnight) {
        endDateTime = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000);
      }

      if (endDateTime.getTime() <= startDateTime.getTime()) {
        showToast("Punch out time must be after punch in time", "error");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch("/mdz-crm/api/attendance/time-modification-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: attendanceId || undefined,
          targetDate: new Date(`${date}T00:00:00`).toISOString(),
          requestedPunchIn: startDateTime.toISOString(),
          requestedPunchOut: endDateTime.toISOString(),
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("✓ Time modification request sent for Sub/Admin approval", "success");
        setReason("");
        setIsPastMidnight(false);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        showToast(json.error || "Failed to submit request", "error");
      }
    } catch (err) {
      console.error("Submit time modification error:", err);
      showToast("Failed to submit request. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Time Modification Request"
      subtitle="Appeal late video shoot hours, overtime, or 12:00 AM mispunches for Sub/Admin approval"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs pb-4">
        {/* Info Banner */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
          <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-xs leading-tight">
              Default Auto-Logout at 12:00 AM (Midnight)
            </p>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-normal">
              If your video shoot or work continued past midnight, toggle <strong>&quot;Work extended past midnight&quot;</strong> to log hours into the next morning (e.g. 02:30 AM).
            </p>
          </div>
        </div>

        {/* Date Field */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Shift Date</span>
          </label>
          <input
            type="date"
            max={todayStr}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium text-sm"
          />
        </div>

        {/* Time Pickers Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Actual Punch In</span>
            </label>
            <input
              type="time"
              value={punchInTime}
              onChange={(e) => setPunchInTime(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium text-sm"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Actual Punch Out</span>
            </label>
            <input
              type="time"
              value={punchOutTime}
              onChange={(e) => setPunchOutTime(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium text-sm"
            />
          </div>
        </div>

        {/* Midnight Cross Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-500" />
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Work extended past midnight (12:00 AM)
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Check if punch-out was in the early morning of next day
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            id="pastMidnightToggle"
            checked={isPastMidnight}
            onChange={(e) => setIsPastMidnight(e.target.checked)}
            className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
          />
        </div>

        {/* Duration Preview Card */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-slate-500 font-medium">Calculated Duration:</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
            {calculateDurationPreview()}
          </span>
        </div>

        {/* Reason Field */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
            Reason / Justification (Required for Sub/Admin Approval)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={3}
            placeholder="e.g. Late night shoot for ABC Retailers until 2:30 AM, or overtime deployment..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium text-xs resize-none"
          />

          {/* Quick reason suggestions */}
          <div className="mt-2 space-y-1">
            <span className="text-[10px] text-slate-400 font-medium">Quick Suggestions:</span>
            <div className="flex flex-wrap gap-1.5">
              {reasonTemplates.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(t)}
                  className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors text-left"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Submitting Appeal...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit to Sub/Admin</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
