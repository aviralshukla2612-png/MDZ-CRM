"use client";

import React, { useState, useEffect } from "react";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import {
  FileSpreadsheet,
  Calendar,
  Clock,
  Video,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Save,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function MeetingNotesPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/client/portal-data");
      const json = await res.json();
      if (json.success && json.data) {
        const list = json.data.meetings || [];
        setMeetings(list);
        if (list.length > 0 && !selectedMeetingId) {
          setSelectedMeetingId(list[0].id);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load meeting notes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) || meetings[0];

  const handleSave = async (updatedMeetings?: any[]) => {
    try {
      setSaving(true);
      const payload = updatedMeetings || meetings;
      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "meetings",
          sectionData: payload,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Meeting notes & action items synced live", "success");
        if (json.data && json.data.meetings) {
          setMeetings(json.data.meetings);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving meeting notes", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActionItem = (itemIdx: number) => {
    if (!selectedMeeting) return;
    const currentActions = selectedMeeting.actionItems || [];
    const updatedActions = currentActions.map((item: any, idx: number) => {
      if (idx === itemIdx) {
        return {
          ...item,
          status: item.status === "DONE" ? "PENDING" : "DONE",
        };
      }
      return item;
    });

    const updatedMeeting = {
      ...selectedMeeting,
      actionItems: updatedActions,
    };

    const updatedAll = meetings.map((m) => (m.id === selectedMeeting.id ? updatedMeeting : m));
    setMeetings(updatedAll);
    handleSave(updatedAll);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-12 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-40 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-96 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
          <div className="md:col-span-2 h-96 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <ClientPortalNav currentTab="/client/meetings" />

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              15-SECTION EXECUTIVE MINUTES
            </span>
            <span className="text-[11px] font-mono text-stone-400">
              {meetings.length} Recorded Syncs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
            <span>Meeting & Strategic Call Notes System</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            Live minutes of all strategic syncs, key decisions finalized, client directives, and action item accountability matrix.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchData()}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors border border-stone-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Minutes"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Meeting List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100">Meeting History</h3>
          </div>

          <div className="space-y-2">
            {meetings.map((m) => {
              const isSelected = m.id === selectedMeeting?.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMeetingId(m.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer select-none space-y-1 ${
                    isSelected
                      ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-xs"
                      : "bg-white dark:bg-stone-900 border-slate-200 dark:border-stone-800 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{m.date}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-stone-800 font-bold">
                      {m.meetingType}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-stone-100">{m.title}</h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{m.duration}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Meeting Deep Dive */}
        {selectedMeeting && (
          <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 dark:border-stone-800 pb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedMeeting.meetingType} • {selectedMeeting.date}
                </span>
                <span className="text-xs font-mono text-slate-400">Platform: {selectedMeeting.platform || "Google Meet"}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-stone-100">{selectedMeeting.title}</h2>
              <div className="text-xs text-slate-500">
                Attendees: <strong className="text-slate-800 dark:text-stone-200">{(selectedMeeting.attendees || []).join(", ")}</strong>
              </div>
            </div>

            {/* Decisions Made */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Decisions Finalized</h4>
              <div className="space-y-1.5">
                {(selectedMeeting.keyDecisions || []).map((dec: string, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-700 text-xs font-semibold text-slate-800 dark:text-stone-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{dec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items Matrix */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Action Items Matrix</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-stone-800/80 text-slate-600 dark:text-stone-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-stone-800">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Action Item</th>
                      <th className="py-2.5 px-3">Assignee</th>
                      <th className="py-2.5 px-3">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-stone-800 text-slate-800 dark:text-stone-200">
                    {(selectedMeeting.actionItems || []).map((item: any, idx: number) => {
                      const isDone = item.status === "DONE";
                      return (
                        <tr
                          key={idx}
                          onClick={() => toggleActionItem(idx)}
                          className="hover:bg-slate-50 dark:hover:bg-stone-800/40 cursor-pointer"
                        >
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isDone
                                  ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                                  : "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 font-semibold ${isDone ? "line-through text-slate-400" : ""}`}>
                            {item.task}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-stone-300">{item.owner}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{item.dueDate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
