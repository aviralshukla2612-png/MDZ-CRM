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
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function BrandVoicePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandVoice, setBrandVoice] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/client/portal-data");
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

  const handleSave = async (updatedData?: any) => {
    try {
      setSaving(true);
      const payload = updatedData || brandVoice;
      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "brandVoice",
          sectionData: payload,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Brand voice & tone identity saved", "success");
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

  const voice = brandVoice || {
    personality: "Authoritative, Direct, High-Stakes, Data-Backed, Relentlessly Practical",
    tone: "Confident without arrogance, consultative, results-obsessed",
    dialectRule: "80% Professional English, 20% conversational Hinglish colloquialisms for natural relatability",
    alwaysUseWords: ["Execution", "Precision", "ROI", "Compounding", "Scalable", "Playbook", "Leverage"],
    neverUseWords: ["Guru", "Hustle 24/7", "Cheap", "Guaranteed overnight riches", "Synergy", "Hack"],
    captionTemplate: "1. Disruptive Hook -> 2. The Uncomfortable Truth -> 3. The Actionable 3-Point Framework -> 4. Proof of Concept -> 5. High-Intent CTA",
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <ClientPortalNav currentTab="/client/brand-voice" />

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
              20-MODULE BRAND GUIDELINES
            </span>
            <span className="text-[11px] font-mono text-stone-400">Verbal & Visual DNA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-amber-400" />
            <span>Brand Voice & Tone Identity Guide</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            Codified copywriting formulas, vocabulary do's and don'ts, video pacing, and linguistic rules for unified brand positioning.
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
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Identity"}</span>
          </button>
        </div>
      </div>

      {/* Brand DNA Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Personality & Tone */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-500" />
            <span>Brand Persona & Archetype</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Personality Pillars</span>
              <p className="font-bold text-slate-900 dark:text-stone-100">{voice.personality}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tone of Voice</span>
              <p className="font-bold text-slate-900 dark:text-stone-100">{voice.tone}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dialect & Language Mix</span>
              <p className="font-bold text-slate-900 dark:text-stone-100">{voice.dialectRule}</p>
            </div>
          </div>
        </div>

        {/* Caption Formula */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span>5-Step High-Converting Caption Blueprint</span>
          </h3>

          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 text-xs space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-[10px]">1</span>
                <span>The 3-Second Scroll-Stopping Hook</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 pl-7">Bold statement, unexpected contrarian statistic, or clear transformation promise.</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-[10px]">2</span>
                <span>The Uncomfortable Truth (Problem Framing)</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 pl-7">Why current conventional methods fail and what most businesses get wrong.</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-[10px]">3</span>
                <span>The Actionable Framework (The Meat)</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 pl-7">Step 1, Step 2, Step 3 with zero fluff. Immediately applicable value.</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-[10px]">4</span>
                <span>Direct High-Intent Call-to-Action</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 pl-7">Single clear next step: Comment a keyword for the automated DM asset link.</p>
            </div>
          </div>
        </div>

        {/* Vocabulary Rules: Always Use vs Never Use */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Vocabulary: Words We ALWAYS Use</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {(voice.alwaysUseWords || []).map((w: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs">
                ✓ {w}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>Vocabulary: Banned Words We NEVER Use</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {(voice.neverUseWords || []).map((w: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs">
                ✗ {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
