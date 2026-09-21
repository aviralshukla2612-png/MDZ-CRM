"use client";

import React, { useState } from "react";
import { AlertCircle, Clock, CheckCircle2, FileText, Send, Sparkles, Moon } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface UnclosedShiftModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: () => void;
  unclosedRecord?: {
    id?: string;
    date?: string | Date;
    punchIn?: string | Date;
  } | null;
  mode?: "UNCLOSED_PREVIOUS_DAY" | "MIDNIGHT_WRAPUP";
}

export function UnclosedShiftModal({
  isOpen,
  onClose,
  onSuccess,
  unclosedRecord,
  mode = "UNCLOSED_PREVIOUS_DAY",
}: UnclosedShiftModalProps) {
  const [workSummary, setWorkSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const isMidnightMode = mode === "MIDNIGHT_WRAPUP";

  const shiftDateFormatted = unclosedRecord?.date
    ? new Date(unclosedRecord.date).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Previous Shift";

  const shiftPunchInFormatted = unclosedRecord?.punchIn
    ? new Date(unclosedRecord.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workSummary.trim()) {
      showToast("Please write a brief summary of what work you completed.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/mdz-crm/api/attendance/resolve-unclosed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: unclosedRecord?.id,
          workSummary: workSummary.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Failed to submit work summary.", "error");
        return;
      }

      showToast("✓ Shift resolved & completed successfully!", "success");
      setWorkSummary("");
      onSuccess();
    } catch (err) {
      console.error("Failed to submit shift summary:", err);
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-amber-300 dark:border-amber-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 dark:shadow-slate-950/80 space-y-6 overflow-hidden">
        
        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-amber-400/20 via-orange-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-indigo-500/20 via-violet-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className={`p-3.5 rounded-2xl shrink-0 ${
            isMidnightMode 
              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60"
              : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60"
          }`}>
            {isMidnightMode ? <Moon className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full ${
                isMidnightMode 
                  ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                  : "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300"
              }`}>
                {isMidnightMode ? "Daily Wrap-up" : "Action Required"}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {isMidnightMode ? "End of Day Shift Wrap-up" : "Complete Unclosed Shift"}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isMidnightMode
                ? "You are still punched in. Please enter your work summary to punch out for the day."
                : `You did not punch out on ${shiftDateFormatted}${
                    shiftPunchInFormatted ? ` (Punched in at ${shiftPunchInFormatted})` : ""
                  }. Please provide what tasks you worked on to complete yesterday's shift before punching in today.`}
            </p>
          </div>
        </div>

        {/* Shift Details Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold">Shift Date:</span>
            <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{shiftDateFormatted}</span>
          </div>
          {shiftPunchInFormatted && (
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              In: <span className="font-bold text-slate-700 dark:text-slate-200">{shiftPunchInFormatted}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>What did you work on? / Work Summary</span>
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              placeholder="e.g. Completed CRM frontend fixes, tested attendance APIs, attended client sync, worked on project deliverables until 7:00 PM."
              className="w-full p-3.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none shadow-xs"
            />
            <p className="text-[10px] text-slate-400 text-right">
              {workSummary.length} characters
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {onClose && isMidnightMode && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Remind Later
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !workSummary.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isMidnightMode ? "Submit & Punch Out" : "Submit & Complete Shift"}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
