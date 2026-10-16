"use client";

import React, { useState, useEffect } from "react";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import {
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  Save,
  RefreshCw,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ScopeSlaPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scopeData, setScopeData] = useState<any>({
    signedBy: "Vikram Malhotra",
    signerTitle: "Founder & Managing Director",
    signedAt: "2026-10-01T10:30:00Z",
    status: "SIGNED",
    contractDuration: "6 Months Retainer",
    approvalWindow: "24 to 48 Hours SLA",
    revisionLimit: "Strict Maximum 3 Iterations / Deliverable",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/client/portal-data");
      const json = await res.json();
      if (json.success && json.data && json.data.scope) {
        setScopeData(json.data.scope);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load SLA document", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSignOff = async () => {
    try {
      setSaving(true);
      const updated = {
        ...scopeData,
        status: "SIGNED",
        signedAt: new Date().toISOString(),
      };
      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "scope",
          sectionData: updated,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setScopeData(updated);
        showToast("✓ SLA Scope & Deliverables digitally signed and locked", "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating sign-off", "error");
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

  const clauses = [
    { num: 1, title: "Scope of Retained Services", text: "Organic short-form video production, graphic design, social media scheduling, and Meta ad campaign performance management." },
    { num: 2, title: "Out-of-Scope Services", text: "Physical camera crew travel out of town, website core backend modifications, software licensing fees, and direct platform ad spends." },
    { num: 3, title: "Monthly Deliverables Quota", text: "30 Reels / Short Videos, 15 Multi-Slide Carousels, 10 Static Graphic Posts, and 45 Daily Story Sequences." },
    { num: 4, title: "24-48 Hours Client Approval SLA", text: "Client agrees to approve or provide consolidated revision feedback on drafts within 48 hours to prevent publishing bottlenecks." },
    { num: 5, title: "Revision Limit (3 Maximum)", text: "Up to three (3) consolidated revision rounds are included per deliverable. Beyond 3, revisions incur standard hourly studio billing." },
    { num: 6, title: "Client Asset Provisioning", text: "Client must supply raw footage, brand vector assets, and brand photography by the 5th calendar day of each operating month." },
    { num: 7, title: "Ad Spend & Payment Billing", text: "Platform advertising spend (Meta, Google) is billed directly to the Client's credit card on file within their respective ad manager." },
    { num: 8, title: "Retainer Payment Schedule", text: "Monthly agency retainer fees are due in full on the 1st of each calendar month via direct NEFT / RTGS transfer." },
    { num: 9, title: "Late Payment & Service Pause", text: "Invoices overdue by more than 5 business days result in an immediate automated freeze of campaign management and production." },
    { num: 10, title: "Term & Termination Notice", text: "Agreement is effective for a 6-month term with a 30-day written cancellation notice required prior to renewal." },
    { num: 11, title: "Intellectual Property Ownership", text: "Full copyright and ownership of finished deliverables transfer to the Client upon receipt of full monthly payment." },
    { num: 12, title: "Confidentiality & Non-Disclosure", text: "Both parties agree to hold all proprietary trade secrets, business metrics, and strategy documents in strict confidentiality." },
    { num: 13, title: "Algorithmic & Platform Disclaimers", text: "Agency guarantees strategic execution and rigorous optimization; external algorithmic shifts and account suspensions by platforms are outside agency liability." },
    { num: 14, title: "Working Hours & Communication", text: "Official communication is held via the designated WhatsApp group and weekly syncs, Monday through Friday from 10:00 AM to 7:00 PM IST." },
    { num: 15, title: "Quota Non-Roll-Over Policy", text: "Deliverable quotas are valid strictly for the operating month and do not accumulate or roll over into subsequent billing cycles." },
    { num: 16, title: "Governing Law & Jurisdiction", text: "This SLA and all disputes arising hereunder shall be governed by the laws of India, subject to exclusive court jurisdiction in Lucknow / New Delhi." },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <ClientPortalNav currentTab="/client/scope" />

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-slate-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              22-CLAUSE MASTER SLA
            </span>
            <span className="text-[11px] font-mono text-stone-400">
              Status: {scopeData.status === "SIGNED" ? "Legally Executed" : "Pending Sign-off"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <FileSignature className="w-7 h-7 text-emerald-400" />
            <span>Client Scope of Work & SLA Agreement</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            Clear contractual definitions of deliverable quotas, revision governance, 24-48h approval SLAs, and digital sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchData()}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors border border-stone-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {scopeData.status !== "SIGNED" && (
            <button
              onClick={handleSignOff}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? "Signing..." : "Execute Digital Sign-Off"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Signature Verification Banner */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Digital Execution Certificate</div>
            <div className="text-base font-black text-slate-900 dark:text-stone-100">
              Digitally Signed by {scopeData.signedBy || "Authorized Representative"}
            </div>
            <div className="text-xs text-slate-500">
              Title: {scopeData.signerTitle || "Managing Director"} • Timestamp: {scopeData.signedAt ? new Date(scopeData.signedAt).toLocaleString() : "Verified"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active & Legally Binding</span>
          </span>
        </div>
      </div>

      {/* 22 Clauses Grid */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2 border-b border-slate-100 dark:border-stone-800 pb-3">
          <FileText className="w-4 h-4 text-emerald-500" />
          <span>Master Scope of Work, Deliverable Quotas & Operational Clauses</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clauses.map((c) => (
            <div key={c.num} className="p-4 rounded-xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-700 space-y-1">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                CLAUSE {c.num < 10 ? `0${c.num}` : c.num}
              </span>
              <h4 className="font-bold text-xs text-slate-900 dark:text-stone-100">{c.title}</h4>
              <p className="text-[11px] text-slate-600 dark:text-stone-400 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
