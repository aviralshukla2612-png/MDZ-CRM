"use client";

import React, { useState, useEffect } from "react";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import {
  Swords,
  ExternalLink,
  Save,
  RefreshCw,
  Plus,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function CompetitorAnalysisPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [competitorsData, setCompetitorsData] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/client/portal-data");
      const json = await res.json();
      if (json.success && json.data) {
        setCompetitorsData(json.data.competitors);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load competitor analysis", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (updatedData?: any) => {
    try {
      setSaving(true);
      const payload = updatedData || competitorsData;
      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "competitors",
          sectionData: payload,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Competitor intelligence matrix saved", "success");
        if (json.data && json.data.competitors) {
          setCompetitorsData(json.data.competitors);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving competitor data", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-12 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-40 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-96 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  const competitors = competitorsData?.list || [
    {
      name: "Competitor Alpha",
      handle: "@competitor_alpha",
      followers: "145K",
      avgViews: "45K - 120K",
      postingFrequency: "2 Reels/Day",
      primaryHook: "Shock value & contrarian statements",
      gaps: "Zero community engagement, poor carousel graphics, outdated offers",
      advantageOverThem: "Higher production value, personal branding connection, and faster lead follow-up",
      score: 7.5,
    },
    {
      name: "Competitor Beta",
      handle: "@competitor_beta",
      followers: "89K",
      avgViews: "20K - 60K",
      postingFrequency: "1 Post/Day",
      primaryHook: "Educational frameworks and breakdowns",
      gaps: "No paid ad scaling, low video dynamism, lack of founder storytelling",
      advantageOverThem: "Viral short-form storytelling, paid Meta ad funnel dominance",
      score: 6.8,
    },
    {
      name: "Competitor Gamma",
      handle: "@competitor_gamma",
      followers: "230K",
      avgViews: "80K - 250K",
      postingFrequency: "3 Posts/Day",
      primaryHook: "Humor, relatable skits and trending audio",
      gaps: "Low conversion to paying clients, high vanity metrics, no backend sales funnels",
      advantageOverThem: "High-ticket sales closing systems, qualified lead generation focus",
      score: 8.2,
    },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <ClientPortalNav currentTab="/client/competitors" />

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">
              25-POINT COMPARATIVE AUDIT
            </span>
            <span className="text-[11px] font-mono text-stone-400">Market Intelligence Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Swords className="w-7 h-7 text-red-400" />
            <span>Competitor Analysis & Market Moat Matrix</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            In-depth teardown of top 3 industry rivals across hooks, offers, distribution gaps, and our winning counter-strategies.
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
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Analysis"}</span>
          </button>
        </div>
      </div>

      {/* 3 Competitors Comparative Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {competitors.map((comp: any, idx: number) => (
          <div
            key={idx}
            className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold">RIVAL 0{idx + 1}</span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-stone-100">{comp.name}</h3>
                <span className="text-xs font-mono text-slate-500">{comp.handle}</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black font-mono text-slate-900 dark:text-stone-100">{comp.score}/10</span>
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Threat Level</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-stone-800/60">
                  <span className="text-[10px] text-slate-400 block font-semibold">Followers</span>
                  <span className="font-bold text-slate-900 dark:text-stone-100 font-mono">{comp.followers}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-stone-800/60">
                  <span className="text-[10px] text-slate-400 block font-semibold">Average Reel Views</span>
                  <span className="font-bold text-slate-900 dark:text-stone-100 font-mono">{comp.avgViews}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Posting Cadence</span>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-stone-800/60 font-semibold text-slate-800 dark:text-stone-200">
                  {comp.postingFrequency}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Primary Hook Formula</span>
                <p className="text-[11px] text-slate-600 dark:text-stone-400 italic">
                  "{comp.primaryHook}"
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-bold text-[10px] uppercase">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Their Critical Blindspot / Gap</span>
                </div>
                <p className="text-[11px] text-amber-900 dark:text-amber-300">{comp.gaps}</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-bold text-[10px] uppercase">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Our Strategic Moat & Advantage</span>
                </div>
                <p className="text-[11px] text-emerald-900 dark:text-emerald-300">{comp.advantageOverThem}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
