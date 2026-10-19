"use client";

import React, { useState, useEffect } from "react";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import {
  Sparkles,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Volume2,
  Palette,
  FileText,
  Edit3,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";

const DEFAULT_VOICE = {
  personality: "Authoritative, Direct, High-Stakes, Data-Backed, Relentlessly Practical",
  tone: "Confident without arrogance, consultative, results-obsessed",
  dialectRule: "80% Professional English, 20% conversational Hinglish colloquialisms for natural relatability",
  alwaysUseWords: ["Execution", "Precision", "ROI", "Compounding", "Scalable", "Playbook", "Leverage"],
  neverUseWords: ["Guru", "Hustle 24/7", "Cheap", "Guaranteed overnight riches", "Synergy", "Hack"],
  captionTemplate: "1. Disruptive Hook -> 2. The Uncomfortable Truth -> 3. The Actionable 3-Point Framework -> 4. Proof of Concept -> 5. High-Intent CTA",
  hookDescription: "Bold statement, unexpected contrarian statistic, or clear transformation promise.",
  problemDescription: "Why current conventional methods fail and what most businesses get wrong.",
  frameworkDescription: "Step 1, Step 2, Step 3 with zero fluff. Immediately applicable value.",
  ctaDescription: "Single clear next step: Comment a keyword for the automated DM asset link.",
};

export default function BrandVoicePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandVoice, setBrandVoice] = useState<any>(null);
  const [clientId, setClientId] = useState<string>("");

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editPersonality, setEditPersonality] = useState("");
  const [editTone, setEditTone] = useState("");
  const [editDialect, setEditDialect] = useState("");
  const [editAlwaysWords, setEditAlwaysWords] = useState("");
  const [editNeverWords, setEditNeverWords] = useState("");
  const [editHookDesc, setEditHookDesc] = useState("");
  const [editProblemDesc, setEditProblemDesc] = useState("");
  const [editFrameworkDesc, setEditFrameworkDesc] = useState("");
  const [editCtaDesc, setEditCtaDesc] = useState("");

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
        setBrandVoice(json.data.brandVoice);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load brand voice guide", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const voice = { ...DEFAULT_VOICE, ...(brandVoice || {}) };

  const handleSave = async (updatedData?: any) => {
    try {
      setSaving(true);
      const cid = clientId || getClientId();
      const payload = updatedData || voice;
      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: cid || undefined,
          section: "brandVoice",
          sectionData: payload,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Brand voice & tone identity saved live", "success");
        if (json.data && json.data.brandVoice) {
          setBrandVoice(json.data.brandVoice);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving brand voice", "error");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    setEditPersonality(voice.personality || "");
    setEditTone(voice.tone || "");
    setEditDialect(voice.dialectRule || "");
    setEditAlwaysWords((voice.alwaysUseWords || []).join(", "));
    setEditNeverWords((voice.neverUseWords || []).join(", "));
    setEditHookDesc(voice.hookDescription || "");
    setEditProblemDesc(voice.problemDescription || "");
    setEditFrameworkDesc(voice.frameworkDescription || "");
    setEditCtaDesc(voice.ctaDescription || "");
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const alwaysArr = editAlwaysWords.split(",").map((s) => s.trim()).filter(Boolean);
    const neverArr = editNeverWords.split(",").map((s) => s.trim()).filter(Boolean);

    const updated = {
      ...voice,
      personality: editPersonality,
      tone: editTone,
      dialectRule: editDialect,
      alwaysUseWords: alwaysArr,
      neverUseWords: neverArr,
      hookDescription: editHookDesc,
      problemDescription: editProblemDesc,
      frameworkDescription: editFrameworkDesc,
      ctaDescription: editCtaDesc,
    };

    setBrandVoice(updated);
    setIsEditOpen(false);
    handleSave(updated);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-12 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-40 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-80 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
          <div className="h-80 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <ClientPortalNav currentTab="/client/brand-voice" />

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
              BRAND DNA & IDENTITY MATRIX
            </span>
            <span className="text-[11px] font-mono text-stone-400">Verbal & Visual Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-amber-400" />
            <span>Brand Voice & Tone Identity Guide</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            Admin & Sub-Admin live editing enabled: Codified copywriting formulas, vocabulary do's and don'ts, video pacing, and linguistic rules.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openEditModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Identity</span>
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
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Identity"}</span>
          </button>
        </div>
      </div>

      {/* Brand DNA Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Personality & Tone */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-500" />
                <span>Brand Persona & Archetype</span>
              </h3>
              <button
                onClick={openEditModal}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Personality Pillars</span>
                <p className="font-bold text-slate-900 dark:text-stone-100 leading-relaxed">{voice.personality}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tone of Voice</span>
                <p className="font-bold text-slate-900 dark:text-stone-100 leading-relaxed">{voice.tone}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dialect & Language Mix</span>
                <p className="font-bold text-slate-900 dark:text-stone-100 leading-relaxed">{voice.dialectRule}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Caption Formula */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              <span>4-Step High-Converting Caption Blueprint</span>
            </h3>
            <button
              onClick={openEditModal}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 text-xs space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-[10px] font-black">1</span>
                <span>The 3-Second Scroll-Stopping Hook</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 pl-7">{voice.hookDescription}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-[10px] font-black">2</span>
                <span>The Uncomfortable Truth (Problem Framing)</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 pl-7">{voice.problemDescription}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-[10px] font-black">3</span>
                <span>The Actionable Framework (The Meat)</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 pl-7">{voice.frameworkDescription}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-[10px] font-black">4</span>
                <span>Direct High-Intent Call-to-Action</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 pl-7">{voice.ctaDescription}</p>
            </div>
          </div>
        </div>

        {/* Vocabulary Rules: Always Use */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Vocabulary: Words We ALWAYS Use</span>
            </h3>
            <button
              onClick={openEditModal}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Words</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(voice.alwaysUseWords || []).map((w: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs">
                ✓ {w}
              </span>
            ))}
          </div>
        </div>

        {/* Vocabulary Rules: Never Use */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>Vocabulary: Banned Words We NEVER Use</span>
            </h3>
            <button
              onClick={openEditModal}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Banned</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(voice.neverUseWords || []).map((w: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs">
                ✗ {w}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Brand Voice BottomSheet Modal */}
      <BottomSheet
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Brand Voice & Tone Identity"
        subtitle="Modify personality archetypes, linguistic guidelines, vocabulary dos/don'ts, and caption frameworks."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Personality Pillars</label>
            <input
              type="text"
              required
              value={editPersonality}
              onChange={(e) => setEditPersonality(e.target.value)}
              placeholder="Authoritative, Direct, High-Stakes, Data-Backed"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-amber-500 font-semibold"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Tone of Voice</label>
            <input
              type="text"
              required
              value={editTone}
              onChange={(e) => setEditTone(e.target.value)}
              placeholder="Confident without arrogance, consultative, results-obsessed"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-amber-500 font-semibold"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Dialect & Language Mix</label>
            <input
              type="text"
              value={editDialect}
              onChange={(e) => setEditDialect(e.target.value)}
              placeholder="80% Professional English, 20% conversational Hinglish colloquialisms"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Vocabulary: Words We ALWAYS Use (comma separated)</label>
            <textarea
              rows={2}
              value={editAlwaysWords}
              onChange={(e) => setEditAlwaysWords(e.target.value)}
              placeholder="Execution, Precision, ROI, Compounding, Scalable, Playbook"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Vocabulary: Banned Words We NEVER Use (comma separated)</label>
            <textarea
              rows={2}
              value={editNeverWords}
              onChange={(e) => setEditNeverWords(e.target.value)}
              placeholder="Guru, Hustle 24/7, Cheap, Guaranteed overnight riches, Hack"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-3">
            <span className="font-bold text-amber-900 dark:text-amber-200 block text-xs">
              4-Step Caption Blueprint Descriptions
            </span>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Step 1: Hook</label>
              <input
                type="text"
                value={editHookDesc}
                onChange={(e) => setEditHookDesc(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs outline-none"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Step 2: Problem</label>
              <input
                type="text"
                value={editProblemDesc}
                onChange={(e) => setEditProblemDesc(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs outline-none"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Step 3: Framework</label>
              <input
                type="text"
                value={editFrameworkDesc}
                onChange={(e) => setEditFrameworkDesc(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs outline-none"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Step 4: CTA</label>
              <input
                type="text"
                value={editCtaDesc}
                onChange={(e) => setEditCtaDesc(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            ✓ Save & Update Brand Identity
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
