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
  Edit3,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";

const DEFAULT_PILLARS = [
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

export default function ContentPillarsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pillarsData, setPillarsData] = useState<any>(null);
  const [clientId, setClientId] = useState<string>("");

  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formShare, setFormShare] = useState<number>(20);
  const [formPurpose, setFormPurpose] = useState("");
  const [formFormats, setFormFormats] = useState("");
  const [formHooks, setFormHooks] = useState("");
  const [formCtas, setFormCtas] = useState("");

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

  const currentPillars: any[] = pillarsData?.pillars || DEFAULT_PILLARS;

  const handleSave = async (updatedPillars?: any[]) => {
    try {
      setSaving(true);
      const cid = clientId || getClientId();
      const payload = {
        ...(pillarsData || {}),
        pillars: updatedPillars || currentPillars,
      };

      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: cid || undefined,
          section: "contentPillars",
          sectionData: payload,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Content pillars strategy saved live", "success");
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

  const openAddModal = () => {
    setEditingIndex(null);
    setFormName("");
    setFormShare(15);
    setFormPurpose("");
    setFormFormats("Reels, Carousels, Stories");
    setFormHooks("");
    setFormCtas("Follow for daily tips\nSave this post");
    setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
    const p = currentPillars[index];
    if (!p) return;
    setEditingIndex(index);
    setFormName(p.pillarName || "");
    setFormShare(p.sharePercentage || 20);
    setFormPurpose(p.purpose || "");
    setFormFormats((p.formats || []).join(", "));
    setFormHooks((p.exampleHooks || []).join("\n"));
    setFormCtas((p.sampleCtas || []).join("\n"));
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formatsArr = formFormats.split(",").map((s) => s.trim()).filter(Boolean);
    const hooksArr = formHooks.split("\n").map((s) => s.trim()).filter(Boolean);
    const ctasArr = formCtas.split("\n").map((s) => s.trim()).filter(Boolean);

    const pillarObj = {
      pillarName: formName,
      sharePercentage: Number(formShare) || 20,
      purpose: formPurpose,
      formats: formatsArr.length > 0 ? formatsArr : ["Reels", "Carousels"],
      exampleHooks: hooksArr.length > 0 ? hooksArr : ["Top 3 tips to scale..."],
      sampleCtas: ctasArr.length > 0 ? ctasArr : ["Save this post"],
    };

    let updated: any[] = [];
    if (editingIndex !== null) {
      updated = currentPillars.map((p, i) => (i === editingIndex ? pillarObj : p));
    } else {
      updated = [...currentPillars, pillarObj];
    }

    setPillarsData({ ...(pillarsData || {}), pillars: updated });
    setIsModalOpen(false);
    handleSave(updated);
  };

  const handleDeletePillar = (index: number) => {
    const updated = currentPillars.filter((_, i) => i !== index);
    setPillarsData({ ...(pillarsData || {}), pillars: updated });
    setIsModalOpen(false);
    handleSave(updated);
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

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <ClientPortalNav currentTab="/client/content-pillars" />

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30">
              {currentPillars.length}-PILLAR CONTENT ARCHITECTURE
            </span>
            <span className="text-[11px] font-mono text-stone-400">Governance & Distribution Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Columns3 className="w-7 h-7 text-teal-400" />
            <span>Brand Content Pillars & Distribution Matrix</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            Admin & Sub-Admin live editing enabled: Customize weekly share %, strategic purpose, hook formulas, and CTAs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-stone-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Pillar</span>
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
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save All"}</span>
          </button>
        </div>
      </div>

      {/* Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentPillars.map((pillar: any, index: number) => (
          <div
            key={index}
            className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  PILLAR 0{index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black font-mono text-teal-600 dark:text-teal-400">
                    {pillar.sharePercentage}% Share
                  </span>
                  <button
                    onClick={() => openEditModal(index)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-stone-800 text-slate-500 hover:text-teal-600 transition-colors cursor-pointer"
                    title="Edit Pillar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 dark:text-stone-100">{pillar.pillarName}</h3>
              <p className="text-xs text-slate-600 dark:text-stone-400 leading-relaxed">{pillar.purpose}</p>

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

            <div className="pt-3 border-t border-slate-100 dark:border-stone-800 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Standard CTAs</span>
                {(pillar.sampleCtas || []).map((cta: string, ci: number) => (
                  <div key={ci} className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                    → {cta}
                  </div>
                ))}
              </div>
              <button
                onClick={() => openEditModal(index)}
                className="text-[11px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Pillar BottomSheet Modal */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIndex !== null ? `Edit Pillar 0${editingIndex + 1}` : "Add New Content Pillar"}
        subtitle="Configure content strategy, distribution target percentage, hook formulas, and CTAs."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Pillar Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Educational & Value-First"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-teal-500 font-semibold"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Share % *</label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={formShare}
                onChange={(e) => setFormShare(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-teal-500 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Strategic Purpose & Outcome</label>
            <textarea
              rows={2}
              required
              value={formPurpose}
              onChange={(e) => setFormPurpose(e.target.value)}
              placeholder="e.g. Establish industry authority and solve acute pain points..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Recommended Formats (comma separated)</label>
            <input
              type="text"
              value={formFormats}
              onChange={(e) => setFormFormats(e.target.value)}
              placeholder="Step-by-step Carousels, Explainer Reels, Infographics"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Example Hooks (one per line)</label>
            <textarea
              rows={3}
              value={formHooks}
              onChange={(e) => setFormHooks(e.target.value)}
              placeholder="The exact 3-step playbook we used...&#10;Stop making this costly marketing mistake..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Sample CTAs (one per line)</label>
            <textarea
              rows={2}
              value={formCtas}
              onChange={(e) => setFormCtas(e.target.value)}
              placeholder="Comment 'GUIDE' for full SOP&#10;Save this post for later"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            {editingIndex !== null && currentPillars.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeletePillar(editingIndex)}
                className="px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Pillar</span>
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              {editingIndex !== null ? "✓ Update Content Pillar" : "✓ Add Content Pillar"}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
