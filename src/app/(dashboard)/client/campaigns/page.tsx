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
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function CampaignPlannerPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/client/portal-data");
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
      const payload = updatedCampaigns || campaigns;
      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <ClientPortalNav currentTab="/client/campaigns" />

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
              18-STAGE STRATEGIC BLUEPRINT
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
            {selectedCampaign?.campaignName || "Q4 Revenue & Festival Scale Blitz"} • Complete 18-stage campaign governance from creative ideation to conversion scaling.
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
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Blueprint"}</span>
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
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Allocated Ad Budget</span>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-stone-100">
              {selectedCampaign.budget?.currency} {selectedCampaign.budget?.totalAllocated?.toLocaleString("en-IN")}
            </div>
            <span className="text-[11px] text-slate-400">Spent: ₹{selectedCampaign.budget?.spent?.toLocaleString("en-IN")}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Leads</span>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {selectedCampaign.targets?.actualLeads} / {selectedCampaign.targets?.targetLeads}
            </div>
            <span className="text-[11px] text-emerald-600">84% of Quota achieved</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Sales Closes</span>
            <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {selectedCampaign.targets?.actualSales} / {selectedCampaign.targets?.targetSales}
            </div>
            <span className="text-[11px] text-indigo-600">76% of Conversion goal</span>
          </div>
        </div>
      )}

      {/* 18-Stage Execution Roadmap */}
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
    </div>
  );
}
