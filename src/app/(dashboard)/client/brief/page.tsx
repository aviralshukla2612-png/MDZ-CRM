"use client";

import React, { useState, useEffect } from "react";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import {
  FileText,
  Target,
  Users,
  Compass,
  Zap,
  Save,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const DEFAULT_BRIEF = {
  brandPurpose: "Transforming ambitious businesses into recognizable, category-leading market authorities.",
  commercialGoals: "Scale from ₹10L/month to ₹50L/month monthly recurring revenue by Q1 2027.",
  targetAvatar: "Founders, CXOs and high-growth SME owners aged 28-48 with high disposable income.",
  painPointsSolved: "Eliminating inconsistent lead generation, weak branding authority, and wasteful ad spend.",
  uniqueSellingProposition: "End-to-end proprietary Creative-Performance engine combining viral video storytelling with high-ROI ad funnels.",
  northStarMetric: "Cost Per Qualified Booked Call & Direct Return on Ad Spend (Target ROAS: 4.5x+)",
  heroOfferings: "Custom festive collections, tailored luxury goods, and bespoke consulting retainers.",
  marketDifferentiator: "Proprietary high-converting video frameworks + 24-48 hr fast turnaround delivery.",
};

export default function MarketingBriefPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brief, setBrief] = useState<any>(DEFAULT_BRIEF);
  const [clientId, setClientId] = useState<string>("");

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
      if (json.success && json.data && json.data.brief) {
        setBrief({ ...DEFAULT_BRIEF, ...json.data.brief });
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load marketing brief", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const cid = clientId || getClientId();
      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: cid || undefined,
          section: "brief",
          sectionData: brief,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Strategic Marketing Brief saved live", "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving brief", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-12 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-40 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
          <div className="h-64 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <ClientPortalNav currentTab="/client/brief" />

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
              STRATEGIC FOUNDATION BRIEF
            </span>
            <span className="text-[11px] font-mono text-stone-400">Marketing Core Blueprint</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-400" />
            <span>Client Strategic Marketing Brief</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            Admin & Sub-Admin live editing enabled: Core commercial goals, customer avatar, USP, pain points, and north-star metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchData()}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors border border-stone-700 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Marketing Brief"}</span>
          </button>
        </div>
      </div>

      {/* Brief Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Brand Mission & Commercial Objectives */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-500" />
            <span>Brand Mission & Commercial Objectives</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Brand Purpose</label>
              <textarea
                rows={3}
                value={brief.brandPurpose || ""}
                onChange={(e) => setBrief({ ...brief, brandPurpose: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Primary Revenue Target</label>
              <textarea
                rows={3}
                value={brief.commercialGoals || ""}
                onChange={(e) => setBrief({ ...brief, commercialGoals: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-bold outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Hero Products & Core Offerings</label>
              <textarea
                rows={2}
                value={brief.heroOfferings || ""}
                onChange={(e) => setBrief({ ...brief, heroOfferings: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Target Audience Avatar & Value Proposition */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span>Target Audience Avatar & Value Proposition</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Customer Demographics & Psychology</label>
              <textarea
                rows={3}
                value={brief.targetAvatar || ""}
                onChange={(e) => setBrief({ ...brief, targetAvatar: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Unique Selling Proposition (USP)</label>
              <textarea
                rows={3}
                value={brief.uniqueSellingProposition || ""}
                onChange={(e) => setBrief({ ...brief, uniqueSellingProposition: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-bold outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Critical Pain Points Solved</label>
              <textarea
                rows={2}
                value={brief.painPointsSolved || ""}
                onChange={(e) => setBrief({ ...brief, painPointsSolved: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* North Star Metric & Growth Levers */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4 md:col-span-2">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>North-Star Growth Metrics & Competitive Moat</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">North Star Metric & Target ROAS</label>
              <textarea
                rows={2}
                value={brief.northStarMetric || ""}
                onChange={(e) => setBrief({ ...brief, northStarMetric: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-mono font-bold outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Market Differentiator & Turnaround Advantage</label>
              <textarea
                rows={2}
                value={brief.marketDifferentiator || ""}
                onChange={(e) => setBrief({ ...brief, marketDifferentiator: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
