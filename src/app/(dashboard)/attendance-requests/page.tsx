"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CheckCircle, Clock, Power, ShieldAlert, XCircle, Moon, Sparkles, AlertCircle, Camera, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function AttendanceRequestsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"time-modification" | "early-punch-out">("time-modification");

  // Early Punch Outs
  const [pendingPunchOuts, setPendingPunchOuts] = useState<any[]>([]);
  const [resolvedPunchOuts, setResolvedPunchOuts] = useState<any[]>([]);
  const [isLoadingPunchOuts, setIsLoadingPunchOuts] = useState(true);
  const [processingPunchOutIds, setProcessingPunchOutIds] = useState<Set<string>>(new Set());

  // Time Modification Appeals
  const [timeModRequests, setTimeModRequests] = useState<any[]>([]);
  const [isLoadingTimeMods, setIsLoadingTimeMods] = useState(true);
  const [processingTimeModIds, setProcessingTimeModIds] = useState<Set<string>>(new Set());
  const [reviewNotesMap, setReviewNotesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPendingPunchOuts();
    fetchTimeModRequests();
  }, []);

  const fetchPendingPunchOuts = async () => {
    setIsLoadingPunchOuts(true);
    try {
      const res = await fetch("/mdz-crm/api/attendance/pending-punch-outs");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPendingPunchOuts(json.data.filter((req: any) => req.punchOutRequestStatus === "PENDING"));
        setResolvedPunchOuts(json.data.filter((req: any) => req.punchOutRequestStatus !== "PENDING"));
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to fetch early punch out requests", "error");
    } finally {
      setIsLoadingPunchOuts(false);
    }
  };

  const fetchTimeModRequests = async () => {
    setIsLoadingTimeMods(true);
    try {
      const res = await fetch("/mdz-crm/api/attendance/time-modification-request");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTimeModRequests(json.data);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to fetch time modification requests", "error");
    } finally {
      setIsLoadingTimeMods(false);
    }
  };

  const handleApproveRejectPunchOut = async (attendanceId: string, action: "APPROVE" | "REJECT") => {
    setProcessingPunchOutIds((prev) => new Set(prev).add(attendanceId));
    try {
      const res = await fetch("/mdz-crm/api/attendance/admin/approve-punch-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId, action }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Early punch out request ${action.toLowerCase()}d.`, "success");
        fetchPendingPunchOuts();
      } else {
        showToast(json.error || "Action failed", "error");
      }
    } catch (e) {
      showToast("Error processing request", "error");
    } finally {
      setProcessingPunchOutIds((prev) => {
        const next = new Set(prev);
        next.delete(attendanceId);
        return next;
      });
    }
  };

  const handleReviewTimeMod = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setProcessingTimeModIds((prev) => new Set(prev).add(requestId));
    try {
      const res = await fetch("/mdz-crm/api/attendance/time-modification-request/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action,
          reviewNotes: reviewNotesMap[requestId] || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Time modification request ${action.toLowerCase()}d successfully.`, "success");
        fetchTimeModRequests();
      } else {
        showToast(json.error || "Action failed", "error");
      }
    } catch (e) {
      showToast("Error reviewing time modification request", "error");
    } finally {
      setProcessingTimeModIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const pendingTimeMods = timeModRequests.filter((r) => r.status === "PENDING");
  const resolvedTimeMods = timeModRequests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <PageHeader
        title="Attendance & Time Appeals"
        description="Review and approve time modifications, late-night video shoots, overtime, and early departures."
        badge="ADMIN & SUB-ADMIN"
        icon={<Moon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("time-modification")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === "time-modification"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <Moon className="w-4 h-4" />
          <span>Time Modification & Late Shoots</span>
          {pendingTimeMods.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-200 text-indigo-900 font-extrabold">
              {pendingTimeMods.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("early-punch-out")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === "early-punch-out"
              ? "bg-orange-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <Power className="w-4 h-4" />
          <span>Early Punch-Out Requests</span>
          {pendingPunchOuts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-200 text-orange-900 font-extrabold">
              {pendingPunchOuts.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: TIME MODIFICATION APPEALS */}
      {activeTab === "time-modification" && (
        <div className="space-y-6">
          {/* Pending Section */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    Pending Time Modification Appeals
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Employees requesting to adjust shift hours for late-night shoots, overtime, or 12:00 AM mispunches.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                {pendingTimeMods.length} PENDING
              </span>
            </div>

            {isLoadingTimeMods ? (
              <div className="text-center py-10 text-slate-500 text-sm font-semibold">Loading appeals...</div>
            ) : pendingTimeMods.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  No pending time modification appeals.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTimeMods.map((r) => {
                  const reqIn = new Date(r.requestedPunchIn);
                  const reqOut = new Date(r.requestedPunchOut);
                  const durationMs = reqOut.getTime() - reqIn.getTime();
                  const totalHrs = (durationMs / (1000 * 60 * 60)).toFixed(1);
                  const isCrossMidnight = reqOut.getDate() !== reqIn.getDate();

                  return (
                    <div
                      key={r.id}
                      className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-4 shadow-xs dark:shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                              {r.employee?.user?.designation || "TEAM MEMBER"}
                            </span>
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                              {r.employee?.user?.name || "Employee"} ({r.employee?.employeeIdCode})
                            </h3>
                            <span className="text-xs text-slate-500 font-mono">
                              📅 Shift: {new Date(r.targetDate).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Time Comparison Badges */}
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Requested Shift Hours</span>
                              <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                <span>{reqIn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                <span>→</span>
                                <span>{reqOut.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                <span className="text-[11px] font-normal text-slate-500">({totalHrs} hrs total)</span>
                              </div>
                            </div>

                            {isCrossMidnight && (
                              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 font-semibold text-[11px] flex items-center gap-1.5">
                                <span>🌙 Late night extension (past 12:00 AM)</span>
                              </div>
                            )}
                          </div>

                          <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Employee Reason:</span>
                            <p className="text-slate-800 dark:text-slate-200 italic">&quot;{r.reason}&quot;</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 shrink-0 sm:w-64">
                          <input
                            type="text"
                            placeholder="Optional review note..."
                            value={reviewNotesMap[r.id] || ""}
                            onChange={(e) =>
                              setReviewNotesMap((prev) => ({ ...prev, [r.id]: e.target.value }))
                            }
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 text-xs outline-none focus:border-indigo-500"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={processingTimeModIds.has(r.id)}
                              onClick={() => handleReviewTimeMod(r.id, "APPROVE")}
                              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              disabled={processingTimeModIds.has(r.id)}
                              onClick={() => handleReviewTimeMod(r.id, "REJECT")}
                              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resolved Section */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    Resolved Time Appeals
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Past time modification requests reviewed by management.</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {resolvedTimeMods.length} RESOLVED
              </span>
            </div>

            {resolvedTimeMods.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center space-y-3">
                <div className="text-slate-500 dark:text-slate-400 font-semibold text-sm">No resolved appeals yet.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {resolvedTimeMods.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs opacity-85"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                            r.status === "APPROVED"
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                              : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                          }`}
                        >
                          {r.status}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {r.employee?.user?.name || "Employee"}
                        </h3>
                        <span className="text-slate-400 font-mono">📅 {new Date(r.targetDate).toLocaleDateString()}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-mono">
                        Hours: {new Date(r.requestedPunchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} →{" "}
                        {new Date(r.requestedPunchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        <strong>Reason:</strong> {r.reason}
                      </p>
                      {r.reviewNotes && (
                        <p className="text-indigo-600 dark:text-indigo-400 text-[11px] font-medium">
                          Note: {r.reviewNotes} (by {r.reviewedBy?.name || "Management"})
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EARLY PUNCH OUT REQUESTS */}
      {activeTab === "early-punch-out" && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    Pending Approvals
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Employees requesting to end shift before required hours.</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                {pendingPunchOuts.length} PENDING
              </span>
            </div>

            {isLoadingPunchOuts ? (
              <div className="text-center py-10 text-slate-500 text-sm font-semibold">Loading requests...</div>
            ) : pendingPunchOuts.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  No pending early punch out requests at this time.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPunchOuts.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs dark:shadow-lg"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                          EARLY DEPARTURE
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {p.employee?.user?.name || "Employee"} ({p.employee?.employeeIdCode})
                        </h3>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                        <strong>Reason:</strong> {p.punchOutReason}
                      </p>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 pt-0.5">
                        <span>
                          Requested: {new Date(p.punchOutRequestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={processingPunchOutIds.has(p.id)}
                        onClick={() => handleApproveRejectPunchOut(p.id, "APPROVE")}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        disabled={processingPunchOutIds.has(p.id)}
                        onClick={() => handleApproveRejectPunchOut(p.id, "REJECT")}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolved Section */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                    Resolved Early Punch-Out Requests
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Past early punch-out requests you have addressed.</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {resolvedPunchOuts.length} RESOLVED
              </span>
            </div>

            {resolvedPunchOuts.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center space-y-3">
                <div className="text-slate-500 dark:text-slate-400 font-semibold text-sm">No resolved requests yet.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {resolvedPunchOuts.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs dark:shadow-lg opacity-80"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                            p.punchOutRequestStatus === "APPROVED"
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                              : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                          }`}
                        >
                          {p.punchOutRequestStatus}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.employee?.user?.name || "Employee"}</h3>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                        <strong>Reason:</strong> {p.punchOutReason}
                      </p>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 pt-0.5">
                        <span>Requested: {new Date(p.punchOutRequestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
