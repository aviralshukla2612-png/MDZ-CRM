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
  Edit3,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";

const DEFAULT_COMPETITORS = [
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

export default function CompetitorAnalysisPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [competitorsData, setCompetitorsData] = useState<any>(null);
  const [clientId, setClientId] = useState<string>("");

  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formHandle, setFormHandle] = useState("");
  const [formFollowers, setFormFollowers] = useState("");
  const [formAvgViews, setFormAvgViews] = useState("");
  const [formCadence, setFormCadence] = useState("");
  const [formHook, setFormHook] = useState("");
  const [formGaps, setFormGaps] = useState("");
  const [formAdvantage, setFormAdvantage] = useState("");
  const [formScore, setFormScore] = useState<number>(7.5);

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

  const competitors: any[] = competitorsData?.list || DEFAULT_COMPETITORS;

  const handleSave = async (updatedList?: any[]) => {
    try {
      setSaving(true);
      const cid = clientId || getClientId();
      const payload = {
        ...(competitorsData || {}),
        list: updatedList || competitors,
      };

      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: cid || undefined,
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

  const openAddModal = () => {
    setEditingIndex(null);
    setFormName("");
    setFormHandle("@");
    setFormFollowers("50K");
    setFormAvgViews("25K");
    setFormCadence("1 Reel/Day");
    setFormHook("Bold statement opening");
    setFormGaps("Lacks personal connection and client proof");
    setFormAdvantage("Better production quality and conversion funnels");
    setFormScore(7.0);
    setIsModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    const c = competitors[idx];
    if (!c) return;
    setEditingIndex(idx);
    setFormName(c.name || "");
    setFormHandle(c.handle || "");
    setFormFollowers(c.followers || "");
    setFormAvgViews(c.avgViews || "");
    setFormCadence(c.postingFrequency || "");
    setFormHook(c.primaryHook || "");
    setFormGaps(c.gaps || "");
    setFormAdvantage(c.advantageOverThem || "");
    setFormScore(Number(c.score) || 7.0);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rivalObj = {
      name: formName,
      handle: formHandle,
      followers: formFollowers,
      avgViews: formAvgViews,
      postingFrequency: formCadence,
      primaryHook: formHook,
      gaps: formGaps,
      advantageOverThem: formAdvantage,
      score: Number(formScore) || 7.0,
    };

    let updated: any[] = [];
    if (editingIndex !== null) {
      updated = competitors.map((c, i) => (i === editingIndex ? rivalObj : c));
    } else {
      updated = [...competitors, rivalObj];
    }

    setCompetitorsData({ ...(competitorsData || {}), list: updated });
    setIsModalOpen(false);
    handleSave(updated);
  };

  const handleDeleteCompetitor = (idx: number) => {
    const updated = competitors.filter((_, i) => i !== idx);
    setCompetitorsData({ ...(competitorsData || {}), list: updated });
    setIsModalOpen(false);
    handleSave(updated);
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

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <ClientPortalNav currentTab="/client/competitors" />

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">
              {competitors.length}-RIVAL COMPARATIVE MATRIX
            </span>
            <span className="text-[11px] font-mono text-stone-400">Market Intelligence & Moat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Swords className="w-7 h-7 text-red-400" />
            <span>Competitor Analysis & Market Moat Matrix</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            Admin & Sub-Admin live editing enabled: Add rivals, audit hooks, uncover competitor blindspots, and engineer market moats.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-stone-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rival</span>
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
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Analysis"}</span>
          </button>
        </div>
      </div>

      {/* Competitors Comparative Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competitors.map((comp: any, idx: number) => (
          <div
            key={idx}
            className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold">RIVAL 0{idx + 1}</span>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-stone-100">{comp.name}</h3>
                  <span className="text-xs font-mono text-slate-500">{comp.handle}</span>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <span className="text-xl font-black font-mono text-slate-900 dark:text-stone-100">{comp.score}/10</span>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Threat Level</span>
                  </div>
                  <button
                    onClick={() => openEditModal(idx)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-stone-800 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                    title="Edit Competitor"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-stone-800/60">
                    <span className="text-[10px] text-slate-400 block font-semibold">Followers</span>
                    <span className="font-bold text-slate-900 dark:text-stone-100 font-mono">{comp.followers}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-stone-800/60">
                    <span className="text-[10px] text-slate-400 block font-semibold">Average Views</span>
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
                  <p className="text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">{comp.gaps}</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-bold text-[10px] uppercase">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Our Strategic Moat & Advantage</span>
                  </div>
                  <p className="text-[11px] text-emerald-900 dark:text-emerald-300 leading-relaxed">{comp.advantageOverThem}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-stone-800 flex justify-end">
              <button
                onClick={() => openEditModal(idx)}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Rival</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Competitor BottomSheet Modal */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIndex !== null ? `Edit Rival 0${editingIndex + 1}` : "Add New Competitor Rival"}
        subtitle="Track competitor follower metrics, posting cadence, content blindspots, and competitive advantages."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Competitor Brand Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Aura Creative Studio"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-red-500 font-semibold"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Handle / URL</label>
              <input
                type="text"
                value={formHandle}
                onChange={(e) => setFormHandle(e.target.value)}
                placeholder="@handle"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Followers</label>
              <input
                type="text"
                value={formFollowers}
                onChange={(e) => setFormFollowers(e.target.value)}
                placeholder="e.g. 145K"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-red-500 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Average Views</label>
              <input
                type="text"
                value={formAvgViews}
                onChange={(e) => setFormAvgViews(e.target.value)}
                placeholder="e.g. 45K - 120K"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-red-500 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Threat Score (1-10)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={formScore}
                onChange={(e) => setFormScore(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-red-500 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Posting Frequency / Cadence</label>
            <input
              type="text"
              value={formCadence}
              onChange={(e) => setFormCadence(e.target.value)}
              placeholder="e.g. 2 Reels/Day, Daily Stories"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Primary Hook Formula</label>
            <textarea
              rows={2}
              value={formHook}
              onChange={(e) => setFormHook(e.target.value)}
              placeholder="e.g. Shock value opening & contrarian statements..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Their Critical Blindspot / Gaps</label>
            <textarea
              rows={2}
              value={formGaps}
              onChange={(e) => setFormGaps(e.target.value)}
              placeholder="e.g. Zero community engagement, poor carousel graphics, outdated offers..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Our Strategic Moat & Advantage Over Them</label>
            <textarea
              rows={2}
              value={formAdvantage}
              onChange={(e) => setFormAdvantage(e.target.value)}
              placeholder="e.g. Higher production value, personal branding connection, and faster lead follow-up..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            {editingIndex !== null && competitors.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteCompetitor(editingIndex)}
                className="px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Rival</span>
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              {editingIndex !== null ? "✓ Update Competitor Rival" : "✓ Add Competitor Rival"}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
