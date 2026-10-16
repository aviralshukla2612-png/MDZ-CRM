"use client";

import React, { useState, useEffect } from "react";
import {
  TableProperties,
  TrendingUp,
  CalendarDays,
  Columns3,
  Swords,
  Sparkles,
  ClipboardCheck,
  FileText,
  FileSignature,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ExternalLink,
  Save,
  RefreshCw,
  FolderOpen,
  Eye,
  Users,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { MillionaireDeliverySpreadsheet } from "@/components/client/MillionaireDeliverySpreadsheet";
import { MillionaireKpiTracker } from "@/components/client/MillionaireKpiTracker";

interface Props {
  clientId: string;
  activeSection: string;
}

export function AdminClientPortalViews({ clientId, activeSection }: Props) {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/mdz-crm/api/clients/${clientId}/portal-data`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error(e);
      showToast("Error loading client portal data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchData();
    }
  }, [clientId]);

  const saveSection = async (sectionName: string, sectionPayload: any) => {
    try {
      setSaving(true);
      const res = await fetch(`/mdz-crm/api/clients/${clientId}/portal-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: sectionName,
          sectionData: sectionPayload,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ ${sectionName.toUpperCase()} data saved successfully`, "success");
        if (json.data) {
          setData(json.data);
        }
      } else {
        showToast("Error saving data", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Network error saving data", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400">
        No client operational data found. Click Refresh to initialize.
      </div>
    );
  }

  // View 1: Monthly Delivery Control
  if (activeSection === "delivery") {
    return (
      <div className="space-y-4">
        <MillionaireDeliverySpreadsheet
          initialData={data.delivery}
          clientId={clientId}
          clientName={data.companyName || "Client Account"}
          isAdmin={true}
          onSave={(updated: any) => saveSection("delivery", updated)}
        />
      </div>
    );
  }

  // View 2: KPI & Growth Tracker
  if (activeSection === "kpiTracker") {
    return (
      <div className="space-y-4">
        <MillionaireKpiTracker
          clientId={clientId}
          clientName={data.companyName || "Client Account"}
          isAdmin={true}
        />
      </div>
    );
  }

  // View 3: Campaign Planner
  if (activeSection === "campaigns") {
    const campaignList = data.campaigns || [];
    const camp = campaignList[0] || {};
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-500" />
              <span>{camp.campaignName || "Strategic Campaign Execution Engine"}</span>
            </h3>
            <p className="text-xs text-slate-500">18-Stage Execution Roadmap • {camp.progressPct || 65}% Complete</p>
          </div>
          <button
            onClick={() => saveSection("campaigns", campaignList)}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Campaigns"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(camp.stages || []).map((stage: any) => (
            <div key={stage.stageNumber} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 font-bold">STAGE {stage.stageNumber}</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  {stage.status}
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{stage.title}</h4>
              <p className="text-[11px] text-slate-500">{stage.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // View 4: Content Strategy & Pillars
  if (activeSection === "strategy") {
    const pillars = data.contentPillars?.pillars || [];
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Columns3 className="w-5 h-5 text-teal-500" />
              <span>5-Pillar Content Architecture</span>
            </h3>
            <p className="text-xs text-slate-500">Target weekly distribution and high-converting hooks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pillars.map((p: any, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-teal-600">PILLAR {i + 1}</span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">{p.sharePercentage}%</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.pillarName}</h4>
              <p className="text-xs text-slate-500">{p.purpose}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // View 5: Competitor Analysis
  if (activeSection === "competitors") {
    const comps = data.competitors?.list || [];
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Swords className="w-5 h-5 text-red-500" />
              <span>Competitor Benchmarking & Intelligence Matrix</span>
            </h3>
            <p className="text-xs text-slate-500">3-Competitor comparative audit</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comps.map((c: any, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{c.name}</h4>
                <span className="text-xs font-mono font-bold text-red-600">{c.score}/10 Threat</span>
              </div>
              <div className="text-xs text-slate-500 font-mono">{c.handle} • {c.followers} Followers</div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-900 dark:text-amber-300">
                <strong>Their Gap:</strong> {c.gaps}
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[11px] text-emerald-900 dark:text-emerald-300">
                <strong>Our Moat:</strong> {c.advantageOverThem}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // View 6: Brand Voice & Brief
  if (activeSection === "brandVoice") {
    const bv = data.brandVoice || {};
    const br = data.brief || {};
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Brand Voice & Tone Guidelines</span>
          </h4>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 block font-semibold">Personality</span>
              <p className="font-bold text-slate-900 dark:text-slate-100">{bv.personality}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 block font-semibold">Tone</span>
              <p className="font-bold text-slate-900 dark:text-slate-100">{bv.tone}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Strategic Marketing Brief</span>
          </h4>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 block font-semibold">Core Revenue Target</span>
              <p className="font-bold text-slate-900 dark:text-slate-100">{br.commercialGoals}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 block font-semibold">Unique Selling Proposition (USP)</span>
              <p className="font-bold text-slate-900 dark:text-slate-100">{br.uniqueSellingProposition}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View 7: Onboarding & Access
  if (activeSection === "onboarding") {
    const ob = data.onboarding || {};
    const contact = ob.primaryContact || {};
    const access = ob.accessChecklist || {};
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-500" />
            <span>Client Onboarding Records & POC</span>
          </h4>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 block">Primary Contact Person</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{contact.fullName} ({contact.role})</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 block">Direct Phone & WhatsApp</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">{contact.phone}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Platform Access Delegation Status</span>
          </h4>
          <div className="space-y-2 text-xs">
            {Object.entries(access).map(([key, val]: any) => (
              <div key={key} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${val ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                  {val ? "GRANTED" : "PENDING"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // View 8: Scope SLA
  if (activeSection === "scope") {
    const sc = data.scope || {};
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-emerald-500" />
              <span>Contractual Scope of Work & SLA Sign-off</span>
            </h4>
            <p className="text-xs text-slate-500">22-Clause master client agreement</p>
          </div>
          <span className="px-3 py-1 rounded-full font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
            {sc.status || "SIGNED"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-400 block font-semibold">Signer Name</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{sc.signedBy || "Client Principal"}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-400 block font-semibold">Title</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{sc.signerTitle || "Managing Director"}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-400 block font-semibold">Signed Timestamp</span>
            <span className="font-mono text-slate-900 dark:text-slate-100">{sc.signedAt ? new Date(sc.signedAt).toLocaleDateString() : "Active"}</span>
          </div>
        </div>
      </div>
    );
  }

  // View 9: Meeting Notes
  if (activeSection === "meetings") {
    const meetings = data.meetings || [];
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <span>Meeting & Strategic Call Notes</span>
            </h3>
            <p className="text-xs text-slate-500">{meetings.length} Recorded Meetings</p>
          </div>
        </div>

        <div className="space-y-3">
          {meetings.map((m: any) => (
            <div key={m.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-600">{m.meetingType} • {m.date}</span>
                <span className="text-xs font-mono text-slate-400">{m.duration}</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{m.title}</h4>
              <div className="text-xs text-slate-500">
                Attendees: <strong className="text-slate-800 dark:text-slate-200">{(m.attendees || []).join(", ")}</strong>
              </div>

              {m.actionItems && m.actionItems.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Action Items</span>
                  {m.actionItems.map((ai: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <span>{ai.task} (Owner: {ai.owner})</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ai.status === "DONE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {ai.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
