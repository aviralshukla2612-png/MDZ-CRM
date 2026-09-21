"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Clock, Trash2, RefreshCw, FileText } from "lucide-react";
import { CalendarDatePicker } from "@/components/ui/CalendarDatePicker";

export function OwnerAttendanceHistory({ inspectedEmployee = "ALL" }: { inspectedEmployee?: string }) {
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const d = new Date();
    d.setDate(1);
    setStartDate(d.toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
  }, []);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      let url = `/mdz-crm/api/attendance/history?employeeId=${inspectedEmployee}&t=${Date.now()}`;
      
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAttendanceRecords(json.data);
      }
    } catch (e) {
      console.error("OwnerAttendanceHistory fetch error:", e);
    } finally {
      if (!silent) setLoading(false);
      else setIsRefreshing(false);
    }
  }, [inspectedEmployee, startDate, endDate]);

  // Fetch on filter change
  useEffect(() => {
    fetchHistory(false);
  }, [fetchHistory]);

  // Real-time background sync every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHistory(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this attendance record?")) return;
    
    try {
      const res = await fetch(`/mdz-crm/api/attendance/history/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setAttendanceRecords(prev => prev.filter(record => record.id !== id));
      } else {
        alert("Failed to delete record: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting record");
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Global Attendance History
            </h3>
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">View real-time punch-in, punch-out, and active records for the entire team.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => fetchHistory(false)}
            disabled={loading || isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Attendance Logs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing || loading ? "animate-spin text-indigo-500" : ""}`} />
          </button>

          {/* Date Picker */}
          <CalendarDatePicker
            startDate={startDate}
            endDate={endDate}
            align="right"
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="p-3 font-semibold rounded-l-xl">Employee</th>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Punch In</th>
              <th className="p-3 font-semibold">Punch Out</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Break Time</th>
              <th className="p-3 font-semibold">Total Time</th>
              <th className="p-3 font-semibold rounded-r-xl text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-medium animate-pulse">
                  Loading attendance records in real-time...
                </td>
              </tr>
            ) : attendanceRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                  No attendance records found for this criteria.
                </td>
              </tr>
            ) : (
              attendanceRecords.map((record) => {
                const formatTime = (isoString: string) => {
                  if (!isoString) return "--";
                  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                };
                const formatDate = (isoString: string) => {
                  return new Date(isoString).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                };
                const formatMins = (mins: number) => {
                  if (!mins && mins !== 0) return "--";
                  const h = Math.floor(mins / 60);
                  const m = mins % 60;
                  return `${h}h ${m}m`;
                };

                const isOngoing = !record.punchOut && record.punchIn;

                return (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {record.employee?.user?.name || "Unknown"}
                      {record.punchOutReason && (
                        <span className="block text-[10px] text-slate-500 font-normal truncate max-w-[200px]" title={record.punchOutReason}>
                          📝 {record.punchOutReason}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(record.date)}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                      {formatTime(record.punchIn)}
                    </td>
                    <td className="p-3 font-mono">
                      {record.punchOut ? (
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">
                          {formatTime(record.punchOut)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active Now
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        isOngoing
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : record.status === "COMPLETED" || record.status === "PRESENT"
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                          : record.status === "LATE"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                        {isOngoing ? "IN PROGRESS" : record.status || "COMPLETED"}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-medium text-slate-600 dark:text-slate-400">
                      {formatMins(record.breakMinutes || 0)}
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {formatMins(record.totalMinutes)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
