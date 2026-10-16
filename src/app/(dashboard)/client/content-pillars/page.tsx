"use client";

import React, { useState, useEffect } from "react";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import {
  Columns3,
  BookOpen,
  ShieldCheck,
  Zap,
  Smile,
  MessageCircle,
  Save,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ContentPillarsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pillarsData, setPillarsData] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/client/portal-data");
      const json = await res.json();
      if (json.success && json.data) {
        setPillarsData(json.data.contentPillars);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load content pillars", "error");
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
      const payload = updatedData || pillarsData;
      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "contentPillars",
          sectionData: payload,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Content pillars strategy saved", "success");
        if (json.data && json.data.contentPillars) {
          setPillarsData(json.data.contentPillars);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving content pillars", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-12 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-40 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const pillars = pillarsData?.pillars || [
    {
      pillarName: "Educational & Value-First",
      sharePercentage: 35,
      purpose: "Establish industry leadership, solve acute client pain points, and drive organic saves and bookmarks.",
      formats: ["Step-by-step Carousels", "Talking-head Explainer Reels", "Infographic Carousels"],
      exampleHooks: [
        "The exact 3-step playbook we used to double revenue in 60 days...",
        "Stop making this 1 costly marketing mistake right now.",
      ],
      sampleCtas: ["Comment 'GUIDE' for our full SOP sheet", "Save this post for your next campaign"],
    },
    {
      pillarName: "Authority & Social Proof",
      sharePercentage: 25,
      purpose: "De-risk purchasing decisions, highlight case studies, client ROI testimonials, and revenue transformations.",
      formats: ["Client Interview Reels", "Before / After Results Visuals", "Revenue Proof Screenshots"],
      exampleHooks: [
        "How this client scaled from ₹2L to ₹15L/month in 90 days...",
        "Behind the scenes of our biggest campaign launch ever.",
      ],
      sampleCtas: ["DM us 'SCALE' to book a private audit", "Link in bio to see the complete case study"],
    },
    {
      pillarName: "Promotional & Direct Offer",
      sharePercentage: 20,
      purpose: "Convert warm engaged followers into paying clients, announce offers, webinars, and consults.",
      formats: ["Offer Launch Reels", "Urgency Stories with DM links", "Product Feature Breakdowns"],
      exampleHooks: [
        "We are opening only 3 client slots for next month...",
        "Flash sale: Unlock our proven growth blueprint for 48 hours only.",
      ],
      sampleCtas: ["Click the link in bio to claim your slot", "DM 'OFFER' for priority onboarding"],
    },
    {
      pillarName: "Entertainment & Relatability",
      sharePercentage: 10,
      purpose: "Humanize the agency/brand, drive viral reach, trending audio engagement, and high shareability.",
      formats: ["Trending Audio Memes", "Day in the Life of the Founder", "Relatable Industry Struggles"],
      exampleHooks: [
        "When the client says 'make it viral' with 0 budget...",
        "POV: Managing 20 ad campaigns before your morning coffee.",
      ],
      sampleCtas: ["Tag a friend who needs to see this", "Share with someone in your team"],
    },
    {
      pillarName: "Community & Conversation",
      sharePercentage: 10,
      purpose: "Foster high DM and comment velocity, gather client feedback, run polls, and cultivate community loyalty.",
      formats: ["Interactive Poll Stories", "Controversial Industry Takes", "AMA Q&A Sessions"],
      exampleHooks: [
        "Be honest: Organic reach vs Paid ads in 2026?",
        "What is the single biggest bottleneck in your business right now?",
      ],
      sampleCtas: ["Drop your opinion below, let's debate", "Vote on our story right now"],
    },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <ClientPortalNav currentTab="/client/content-pillars" />

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30">
              5-PILLAR CONTENT ARCHITECTURE
            </span>
            <span className="text-[11px] font-mono text-stone-400">Weekly Quota Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Columns3 className="w-7 h-7 text-teal-400" />
            <span>Brand Content Pillars & Distribution Matrix</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            Strategic split across education, authority, conversion, entertainment, and community for sustained algorithmic growth.
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
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Pillars"}</span>
          </button>
        </div>
      </div>

      {/* Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pillars.map((pillar: any, index: number) => (
          <div
            key={index}
            className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  PILLAR 0{index + 1}
                </span>
                <span className="text-sm font-black font-mono text-teal-600 dark:text-teal-400">
                  {pillar.sharePercentage}% Share
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 dark:text-stone-100">{pillar.pillarName}</h3>
              <p className="text-xs text-slate-600 dark:text-stone-400">{pillar.purpose}</p>

              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Formats</span>
                <div className="flex flex-wrap gap-1.5">
                  {(pillar.formats || []).map((f: string, fi: number) => (
                    <span key={fi} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Example Hooks</span>
                <div className="space-y-1">
                  {(pillar.exampleHooks || []).map((h: string, hi: number) => (
                    <div key={hi} className="text-[11px] italic text-slate-700 dark:text-stone-300 bg-slate-50 dark:bg-stone-800/60 p-2 rounded-lg border border-slate-100 dark:border-stone-800">
                      "{h}"
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-stone-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Standard CTAs</span>
              <div className="space-y-1">
                {(pillar.sampleCtas || []).map((cta: string, ci: number) => (
                  <div key={ci} className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                    → {cta}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
