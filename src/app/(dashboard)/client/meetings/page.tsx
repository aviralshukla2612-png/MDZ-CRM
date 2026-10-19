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
  Edit3,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";

const DEFAULT_MEETINGS = [
  {
    id: "meet-01",
    title: "Diwali Campaign Strategy & Creative Direction Kickoff",
    date: "2026-10-08",
    duration: "45 mins",
    meetingType: "Strategy Sync",
    objective: "Lock campaign offer positioning, review first 10 reel scripts, and finalize festive promotion launch date.",
    discussionPoints: [
      "Reviewed September performance: Reels drove 60.7% follower growth surge.",
      "Finalized 25% festive promo offer messaging and hero reel scripts.",
      "Timeline agreement for influencer seeding packages.",
      "Configured Meta retargeting ads to capture incoming website visitors.",
    ],
    decisionsMade: [
      "Campaign launch date officially locked for October 18.",
      "Approved 25% festive promo discount code format.",
      "Audio track volume adjusted for maximum mobile phone speaker clarity.",
    ],
    actionItems: [
      { id: 1, task: "Deliver festive reel sound re-mix with enhanced audio", assignedTo: "Sumit Rathod", deadline: "2026-10-10", status: "DONE" },
      { id: 2, task: "Provide high-res photos of festive packaging box", assignedTo: "Client Team", deadline: "2026-10-12", status: "DONE" },
      { id: 3, task: "Configure Meta Conversion Catalog ads for festive launch", assignedTo: "MDZ Ads Team", deadline: "2026-10-16", status: "PENDING" },
    ],
  },
];

export default function MeetingNotesPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meetings, setMeetings] = useState<any[]>(DEFAULT_MEETINGS);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");

  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formType, setFormType] = useState("Strategy Sync");
  const [formObjective, setFormObjective] = useState("");
  const [formPoints, setFormPoints] = useState("");
  const [formDecisions, setFormDecisions] = useState("");

  const getClientId = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("clientId") || localStorage.getItem("mdz_active_client_id") || "";
    }
    return "";
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const cid = getClientId();
      setClientId(cid);
      const url = cid ? `/mdz-crm/api/client/portal-data?clientId=${cid}` : "/mdz-crm/api/client/portal-data";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        const list = json.data.meetings || [];
        setMeetings(list.length > 0 ? list : DEFAULT_MEETINGS);
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
      const cid = clientId || getClientId();
      const payload = updatedMeetings || meetings;
      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: cid || undefined,
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

  const openAddModal = () => {
    setEditingMeetingId(null);
    setFormTitle("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDuration("45 mins");
    setFormType("Strategy Sync");
    setFormObjective("");
    setFormPoints("");
    setFormDecisions("");
    setIsModalOpen(true);
  };

  const openEditModal = (meeting: any) => {
    setEditingMeetingId(meeting.id);
    setFormTitle(meeting.title || "");
    setFormDate(meeting.date || "");
    setFormDuration(meeting.duration || "");
    setFormType(meeting.meetingType || "Strategy Sync");
    setFormObjective(meeting.objective || "");
    setFormPoints((meeting.discussionPoints || []).join("\n"));
    setFormDecisions((meeting.decisionsMade || []).join("\n"));
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pointsArr = formPoints.split("\n").map((s) => s.trim()).filter(Boolean);
    const decisionsArr = formDecisions.split("\n").map((s) => s.trim()).filter(Boolean);

    let updatedList: any[] = [];
    if (editingMeetingId) {
      updatedList = meetings.map((m) =>
        m.id === editingMeetingId
          ? {
              ...m,
              title: formTitle,
              date: formDate,
              duration: formDuration,
              meetingType: formType,
              objective: formObjective,
              discussionPoints: pointsArr,
              decisionsMade: decisionsArr,
            }
          : m
      );
    } else {
      const newMeet = {
        id: `meet-${Date.now()}`,
        title: formTitle,
        date: formDate,
        duration: formDuration,
        meetingType: formType,
        objective: formObjective,
        discussionPoints: pointsArr,
        decisionsMade: decisionsArr,
        actionItems: [
          { id: 1, task: "Execute discussed next steps", assignedTo: "Assigned Staff", deadline: formDate, status: "PENDING" },
        ],
      };
      updatedList = [newMeet, ...meetings];
      setSelectedMeetingId(newMeet.id);
    }

    setMeetings(updatedList);
    setIsModalOpen(false);
    handleSave(updatedList);
  };

  const handleDeleteMeeting = (meetingId: string) => {
    const updated = meetings.filter((m) => m.id !== meetingId);
    setMeetings(updated);
    if (updated.length > 0) {
      setSelectedMeetingId(updated[0].id);
    }
    setIsModalOpen(false);
    handleSave(updated);
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
              EXECUTIVE MINUTES & SYNCS
            </span>
            <span className="text-[11px] font-mono text-stone-400">
              {meetings.length} Recorded Sessions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
            <span>Meeting & Strategic Call Notes System</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            Admin & Sub-Admin live editing enabled: Log strategic minutes, record decisions, update discussion points, and assign action items.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Meeting</span>
          </button>
          <button
            onClick={() => fetchData()}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors border border-stone-700 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
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
            <button
              onClick={openAddModal}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
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
                  {selectedMeeting.date} • {selectedMeeting.duration}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                    {selectedMeeting.meetingType}
                  </span>
                  <button
                    onClick={() => openEditModal(selectedMeeting)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-stone-800 text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                    title="Edit Meeting Note"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-stone-100">{selectedMeeting.title}</h2>
              <p className="text-xs text-slate-600 dark:text-stone-300 leading-relaxed">
                <strong>Objective:</strong> {selectedMeeting.objective}
              </p>
            </div>

            {/* Discussion Points */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-stone-100 uppercase tracking-wider">
                Key Discussion Points
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-stone-300">
                {(selectedMeeting.discussionPoints || []).map((pt: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Decisions Made */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-stone-100 uppercase tracking-wider">
                Key Decisions Finalized
              </h4>
              <div className="space-y-1.5 text-xs">
                {(selectedMeeting.decisionsMade || []).map((dec: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-300 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{dec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-stone-800">
              <h4 className="font-bold text-xs text-slate-900 dark:text-stone-100 uppercase tracking-wider">
                Accountability & Action Items
              </h4>
              <div className="space-y-2">
                {(selectedMeeting.actionItems || []).map((item: any, idx: number) => {
                  const isDone = item.status === "DONE";
                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => toggleActionItem(idx)}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer select-none transition-all ${
                        isDone
                          ? "bg-slate-50 dark:bg-stone-800/40 border-slate-200 dark:border-stone-700 opacity-60"
                          : "bg-white dark:bg-stone-900 border-slate-200 dark:border-stone-700"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                            isDone ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 dark:border-stone-600"
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`font-semibold ${isDone ? "line-through text-slate-400" : "text-slate-900 dark:text-stone-100"}`}>
                          {item.task}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                        <span>{item.assignedTo}</span>
                        <span>•</span>
                        <span>{item.deadline}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => openEditModal(selectedMeeting)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-stone-700 hover:bg-slate-50 dark:hover:bg-stone-800 text-slate-700 dark:text-stone-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Edit Meeting Notes</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit / Add Meeting Modal */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMeetingId ? "Edit Meeting Notes" : "Log New Strategic Meeting"}
        subtitle="Record session minutes, objective, discussion points, and finalized client decisions."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Meeting Title *</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Diwali Campaign Strategy & Creative Direction Kickoff"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-emerald-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Meeting Date *</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Duration</label>
              <input
                type="text"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                placeholder="45 mins"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Meeting Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-semibold"
              >
                <option value="Strategy Sync">Strategy Sync</option>
                <option value="Review Call">Review Call</option>
                <option value="Onboarding Sync">Onboarding Sync</option>
                <option value="Monthly Delivery Review">Monthly Delivery Review</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Primary Meeting Objective</label>
            <textarea
              rows={2}
              required
              value={formObjective}
              onChange={(e) => setFormObjective(e.target.value)}
              placeholder="e.g. Lock campaign offer positioning, review first 10 reel scripts..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Key Discussion Points (one per line)</label>
            <textarea
              rows={3}
              value={formPoints}
              onChange={(e) => setFormPoints(e.target.value)}
              placeholder="Reviewed September performance...&#10;Finalized 25% festive promo offer..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Key Decisions Made (one per line)</label>
            <textarea
              rows={3}
              value={formDecisions}
              onChange={(e) => setFormDecisions(e.target.value)}
              placeholder="Campaign launch date officially locked for October 18...&#10;Approved 25% festive discount format..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            {editingMeetingId && meetings.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteMeeting(editingMeetingId)}
                className="px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              {editingMeetingId ? "✓ Update Meeting Notes" : "✓ Log Meeting Notes"}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
