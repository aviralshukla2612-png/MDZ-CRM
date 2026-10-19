"use client";

import React, { useState, useEffect } from "react";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import {
  CalendarDays,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  IndianRupee,
  Layers,
  Save,
  RefreshCw,
  Plus,
  ChevronRight,
  TrendingUp,
  Edit3,
  Trash2,
  Calendar,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";

export default function CampaignPlannerPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [activeView, setActiveView] = useState<"calendar" | "roadmap">("calendar");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [clientId, setClientId] = useState<string>("");

  // Edit Campaign Modal State
  const [isEditCampaignOpen, setIsEditCampaignOpen] = useState(false);
  const [editCampName, setEditCampName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editTargetRev, setEditTargetRev] = useState("");
  const [editTargetLeads, setEditTargetLeads] = useState("");
  const [editDeliverables, setEditDeliverables] = useState("");

  // Add / Edit Schedule Item Modal State
  const [isScheduleItemOpen, setIsScheduleItemOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [itemDate, setItemDate] = useState("");
  const [itemDay, setItemDay] = useState("Monday");
  const [itemPlatform, setItemPlatform] = useState("Instagram");
  const [itemFormat, setItemFormat] = useState("Reel");
  const [itemHook, setItemHook] = useState("");
  const [itemStatus, setItemStatus] = useState("In Progress");

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
        const camps = json.data.campaigns || [];
        setCampaigns(camps);
        if (camps.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(camps[0].id);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load campaigns", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  const handleSave = async (updatedCampaigns?: any[]) => {
    try {
      setSaving(true);
      const cid = clientId || getClientId();
      const payload = updatedCampaigns || campaigns;
      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: cid || undefined,
          section: "campaigns",
          sectionData: payload,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Campaign blueprint updated live", "success");
        if (json.data && json.data.campaigns) {
          setCampaigns(json.data.campaigns);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving campaign", "error");
    } finally {
      setSaving(false);
    }
  };

  const openEditCampaignModal = () => {
    if (!selectedCampaign) return;
    setEditCampName(selectedCampaign.campaignName || "");
    setEditStartDate(selectedCampaign.startDate || "");
    setEditEndDate(selectedCampaign.targetEndDate || "");
    setEditBudget(selectedCampaign.adBudget || "");
    setEditTargetRev(selectedCampaign.targetRevenue || "");
    setEditTargetLeads(selectedCampaign.targetLeads || "");
    setEditDeliverables(selectedCampaign.deliverableSummary || "");
    setIsEditCampaignOpen(true);
  };

  const handleUpdateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    const updated = {
      ...selectedCampaign,
      campaignName: editCampName,
      startDate: editStartDate,
      targetEndDate: editEndDate,
      adBudget: editBudget,
      targetRevenue: editTargetRev,
      targetLeads: editTargetLeads,
      deliverableSummary: editDeliverables,
    };
    const updatedAll = campaigns.map((c) => (c.id === selectedCampaign.id ? updated : c));
    setCampaigns(updatedAll);
    setIsEditCampaignOpen(false);
    handleSave(updatedAll);
  };

  const openAddScheduleModal = () => {
    setEditingScheduleId(null);
    setItemDate(new Date().toISOString().split("T")[0]);
    setItemDay("Monday");
    setItemPlatform("Instagram");
    setItemFormat("Reel");
    setItemHook("");
    setItemStatus("In Progress");
    setIsScheduleItemOpen(true);
  };

  const openEditScheduleModal = (item: any) => {
    setEditingScheduleId(item.id);
    setItemDate(item.date || "");
    setItemDay(item.day || "Monday");
    setItemPlatform(item.platform || "Instagram");
    setItemFormat(item.format || "Reel");
    setItemHook(item.hook || "");
    setItemStatus(item.status || "In Progress");
    setIsScheduleItemOpen(true);
  };

  const handleSaveScheduleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    const currentSchedule: any[] = selectedCampaign.contentSchedule || [];

    let updatedSchedule: any[] = [];
    if (editingScheduleId !== null) {
      updatedSchedule = currentSchedule.map((item) =>
        item.id === editingScheduleId
          ? {
              ...item,
              date: itemDate,
              day: itemDay,
              platform: itemPlatform,
              format: itemFormat,
              hook: itemHook,
              status: itemStatus,
            }
          : item
      );
    } else {
      const newId = Date.now();
      updatedSchedule = [
        ...currentSchedule,
        {
          id: newId,
          date: itemDate,
          day: itemDay,
          platform: itemPlatform,
          format: itemFormat,
          hook: itemHook,
          status: itemStatus,
        },
      ];
    }

    const updatedCamp = {
      ...selectedCampaign,
      contentSchedule: updatedSchedule,
    };
    const updatedAll = campaigns.map((c) => (c.id === selectedCampaign.id ? updatedCamp : c));
    setCampaigns(updatedAll);
    setIsScheduleItemOpen(false);
    handleSave(updatedAll);
  };

  const handleDeleteScheduleItem = (itemId: number) => {
    if (!selectedCampaign) return;
    const currentSchedule: any[] = selectedCampaign.contentSchedule || [];
    const updatedSchedule = currentSchedule.filter((item) => item.id !== itemId);
    const updatedCamp = {
      ...selectedCampaign,
      contentSchedule: updatedSchedule,
    };
    const updatedAll = campaigns.map((c) => (c.id === selectedCampaign.id ? updatedCamp : c));
    setCampaigns(updatedAll);
    setIsScheduleItemOpen(false);
    handleSave(updatedAll);
  };

  const toggleStageStatus = (stageNumber: number) => {
    if (!selectedCampaign) return;
    const updatedStages = (selectedCampaign.stages || []).map((s: any) => {
      if (s.stageNumber === stageNumber) {
        const nextStatus = s.status === "COMPLETED" ? "IN_PROGRESS" : s.status === "IN_PROGRESS" ? "PENDING" : "COMPLETED";
        return { ...s, status: nextStatus };
      }
      return s;
    });

    const completedCount = updatedStages.filter((s: any) => s.status === "COMPLETED").length;
    const progressPct = Math.round((completedCount / updatedStages.length) * 100);

    const updatedCampaign = {
      ...selectedCampaign,
      stages: updatedStages,
      progressPct,
    };

    const updatedAll = campaigns.map((c) => (c.id === selectedCampaign.id ? updatedCampaign : c));
    setCampaigns(updatedAll);
    handleSave(updatedAll);
  };

  const toggleScheduleItemStatus = (itemId: number) => {
    if (!selectedCampaign) return;
    const schedule = selectedCampaign.contentSchedule || [];
    const updatedSchedule = schedule.map((item: any) => {
      if (item.id === itemId) {
        const nextStatus = item.status === "Published" ? "In Progress" : item.status === "In Progress" ? "Ready" : "Published";
        return { ...item, status: nextStatus };
      }
      return item;
    });

    const updatedCampaign = {
      ...selectedCampaign,
      contentSchedule: updatedSchedule,
    };

    const updatedAll = campaigns.map((c) => (c.id === selectedCampaign.id ? updatedCampaign : c));
    setCampaigns(updatedAll);
    handleSave(updatedAll);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-12 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-40 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-96 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
          <div className="h-96 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const rawSchedule = selectedCampaign?.contentSchedule || [];
  const filteredSchedule = statusFilter === "ALL"
    ? rawSchedule
    : rawSchedule.filter((item: any) => item.status?.toLowerCase() === statusFilter.toLowerCase());

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <ClientPortalNav currentTab="/client/campaigns" />

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
              CAMPAIGN PLANNER & CALENDAR
            </span>
            <span className="text-[11px] font-mono text-stone-400">
              {selectedCampaign?.startDate} to {selectedCampaign?.targetEndDate}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <CalendarDays className="w-7 h-7 text-purple-400" />
            <span>Strategic Campaign Execution Engine</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            {selectedCampaign?.campaignName || "Q4 Revenue & Festival Scale Blitz"} • Admin & Sub-Admin live editing enabled: Schedule daily pieces, track ad budget, and control 18 campaign stages.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openEditCampaignModal}
            className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-stone-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Campaign</span>
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
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save All"}</span>
          </button>
        </div>
      </div>

      {/* Campaign Meta Overview */}
      {selectedCampaign && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Campaign Progress</span>
            <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
              {selectedCampaign.progressPct || 65}%
            </div>
            <div className="w-full bg-slate-100 dark:bg-stone-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${selectedCampaign.progressPct || 65}%` }} />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Revenue</span>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-stone-100 flex items-center">
              <span>{selectedCampaign.targetRevenue || "₹25,00,000"}</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-bold block">Goal Target</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Inbound Leads</span>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-stone-100">
              {selectedCampaign.targetLeads || "120 Leads"}
            </div>
            <span className="text-[11px] text-slate-500 block">Qualified Prospects</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Allocated Ad Budget</span>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-stone-100 flex items-center">
              <span>{selectedCampaign.adBudget || "₹2,50,000"}</span>
            </div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold block">Meta & Google Ads</span>
          </div>
        </div>
      )}

      {/* View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-2.5 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveView("calendar")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === "calendar"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Content Publishing Schedule</span>
          </button>
          <button
            onClick={() => setActiveView("roadmap")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === "roadmap"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>18-Stage Execution Roadmap</span>
          </button>
        </div>

        {activeView === "calendar" && (
          <div className="flex items-center gap-2">
            <button
              onClick={openAddScheduleModal}
              className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Schedule Item</span>
            </button>
            <div className="flex items-center gap-1 text-xs">
              {["ALL", "Published", "In Progress", "Ready"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    statusFilter === s
                      ? "bg-slate-900 text-white dark:bg-stone-100 dark:text-stone-900"
                      : "text-slate-600 dark:text-stone-400 hover:bg-slate-100 dark:hover:bg-stone-800"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: DAILY CONTENT CALENDAR GRID */}
      {activeView === "calendar" && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-stone-100 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-purple-500" />
                <span>Campaign Daily Content Publishing Schedule</span>
              </h2>
              <p className="text-xs text-slate-500">
                Click status badge to toggle between Ready, In Progress, and Published. Use Edit to update hooks.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
              {filteredSchedule.length} Items Scheduled
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSchedule.map((item: any) => {
              const isPub = item.status === "Published";
              const isInProg = item.status === "In Progress";

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all space-y-2 flex flex-col justify-between ${
                    isPub
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"
                      : isInProg
                      ? "bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/50"
                      : "bg-slate-50/60 dark:bg-stone-800/40 border-slate-200 dark:border-stone-700"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-stone-400">
                        {item.date} • {item.day}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-stone-900 text-slate-700 dark:text-stone-300 border border-slate-200 dark:border-stone-700">
                        {item.format}
                      </span>
                    </div>

                    <div className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">
                      {item.platform}
                    </div>

                    <p className="text-xs font-medium text-slate-800 dark:text-stone-200 leading-snug">
                      "{item.hook}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-stone-700/60 flex items-center justify-between">
                    <button
                      onClick={() => toggleScheduleItemStatus(item.id)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        isPub
                          ? "bg-emerald-600 text-white"
                          : isInProg
                          ? "bg-purple-600 text-white"
                          : "bg-slate-200 dark:bg-stone-700 text-slate-700 dark:text-stone-300"
                      }`}
                      title="Click to toggle status"
                    >
                      {isPub ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      <span>{item.status}</span>
                    </button>

                    <button
                      onClick={() => openEditScheduleModal(item)}
                      className="text-[11px] text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: 18-STAGE EXECUTION ROADMAP */}
      {activeView === "roadmap" && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-stone-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-500" />
                <span>18-Stage Campaign Governance Roadmap</span>
              </h2>
              <p className="text-xs text-slate-500">
                Click any stage status to toggle between PENDING, IN PROGRESS, and COMPLETED.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(selectedCampaign?.stages || []).map((stage: any) => {
              const isDone = stage.status === "COMPLETED";
              const isInProg = stage.status === "IN_PROGRESS";

              return (
                <div
                  key={stage.stageNumber}
                  onClick={() => toggleStageStatus(stage.stageNumber)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none space-y-1.5 ${
                    isDone
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                      : isInProg
                      ? "bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60"
                      : "bg-slate-50/50 dark:bg-stone-800/40 border-slate-200 dark:border-stone-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      STAGE {stage.stageNumber < 10 ? `0${stage.stageNumber}` : stage.stageNumber}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isDone
                          ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                          : isInProg
                          ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300"
                          : "bg-slate-200 dark:bg-stone-700 text-slate-600 dark:text-stone-300"
                      }`}
                    >
                      {stage.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-stone-100">{stage.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-stone-400 leading-snug">{stage.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      <BottomSheet
        isOpen={isEditCampaignOpen}
        onClose={() => setIsEditCampaignOpen(false)}
        title="Edit Campaign Details"
        subtitle="Update campaign name, operational dates, allocated ad budgets, revenue targets, and leads."
      >
        <form onSubmit={handleUpdateCampaign} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Campaign Name *</label>
            <input
              type="text"
              required
              value={editCampName}
              onChange={(e) => setEditCampName(e.target.value)}
              placeholder="e.g. Diwali Mega Revenue Blitz"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-purple-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Start Date</label>
              <input
                type="text"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                placeholder="2026-10-01"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Target End Date</label>
              <input
                type="text"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                placeholder="2026-10-31"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Ad Budget</label>
              <input
                type="text"
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
                placeholder="₹2,50,000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Target Revenue</label>
              <input
                type="text"
                value={editTargetRev}
                onChange={(e) => setEditTargetRev(e.target.value)}
                placeholder="₹25,00,000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Target Leads</label>
              <input
                type="text"
                value={editTargetLeads}
                onChange={(e) => setEditTargetLeads(e.target.value)}
                placeholder="120 Leads"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            ✓ Save Campaign Details
          </button>
        </form>
      </BottomSheet>

      {/* Add / Edit Schedule Item Modal */}
      <BottomSheet
        isOpen={isScheduleItemOpen}
        onClose={() => setIsScheduleItemOpen(false)}
        title={editingScheduleId !== null ? "Edit Schedule Item" : "Add Content Schedule Item"}
        subtitle="Schedule deliverables, choose platform & format, and craft hooks."
      >
        <form onSubmit={handleSaveScheduleItem} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Publish Date *</label>
              <input
                type="date"
                required
                value={itemDate}
                onChange={(e) => setItemDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Day of Week</label>
              <input
                type="text"
                value={itemDay}
                onChange={(e) => setItemDay(e.target.value)}
                placeholder="e.g. Monday"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Platform</label>
              <select
                value={itemPlatform}
                onChange={(e) => setItemPlatform(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-semibold"
              >
                <option value="Instagram">Instagram</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="YouTube">YouTube</option>
                <option value="Facebook">Facebook</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Format</label>
              <select
                value={itemFormat}
                onChange={(e) => setItemFormat(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-semibold"
              >
                <option value="Reel">Reel / Video</option>
                <option value="Carousel">Carousel</option>
                <option value="Static Post">Static Post</option>
                <option value="Story Series">Story Series</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={itemStatus}
                onChange={(e) => setItemStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-semibold"
              >
                <option value="In Progress">In Progress</option>
                <option value="Ready">Ready</option>
                <option value="Published">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Hook / Working Title *</label>
            <textarea
              rows={2}
              required
              value={itemHook}
              onChange={(e) => setItemHook(e.target.value)}
              placeholder="e.g. 3 Costly Mistakes Founders Make in Festive Campaigns..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-purple-500 font-semibold"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            {editingScheduleId !== null && (
              <button
                type="button"
                onClick={() => handleDeleteScheduleItem(editingScheduleId)}
                className="px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Item</span>
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              {editingScheduleId !== null ? "✓ Update Schedule Item" : "✓ Add Schedule Item"}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
