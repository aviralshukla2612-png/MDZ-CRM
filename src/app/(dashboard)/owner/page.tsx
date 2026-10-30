"use client";

import React, { useState } from "react";
import { CommandMetrics } from "@/components/owner/CommandMetrics";
import { NeedsAttentionQueue } from "@/components/owner/NeedsAttentionQueue";
import { AIOwnerAssistant } from "@/components/owner/AIOwnerAssistant";
import { RealtimeTeamView } from "@/components/owner/RealtimeTeamView";
import { OwnerWorkloadSection } from "@/components/owner/OwnerWorkloadSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { Plus, Download, Crown, Cloud, Loader2, TableProperties, Target, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { generateAndDownloadExecutiveBriefPDF } from "@/lib/pdfGenerator";

import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";
import { MillionaireDeliverySpreadsheet } from "@/components/client/MillionaireDeliverySpreadsheet";
import { MillionaireKpiTracker } from "@/components/client/MillionaireKpiTracker";
import { SubAdminPermissionsManager } from "@/components/admin/SubAdminPermissionsManager";

export default function OwnerDashboardPage() {
  const { showToast } = useToast();
  const { data: session } = useSession();
  const [isExporting, setIsExporting] = useState(false);
  const [activeControlTab, setActiveControlTab] = useState<"delivery" | "kpi" | "subadmin">("delivery");

  const userName = session?.user?.name ? session.user.name.split(" ")[0] : "Vikram";

  const handleExportExecutiveBrief = async () => {
    if (isExporting) return;
    setIsExporting(true);
    showToast("Compiling real-time data for Executive Brief PDF...", "info");
    try {
      const res = await fetch("/mdz-crm/api/owner/executive-brief");
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "Failed to load executive brief data.");
      }
      generateAndDownloadExecutiveBriefPDF(json.data);
      showToast("Executive Brief PDF generated & downloaded successfully!", "success");
    } catch (err: any) {
      console.error("Export Executive Brief error:", err);
      showToast(err.message || "Failed to export Executive Brief PDF.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Executive Page Header */}
      <PageHeader
        title={`Good morning, ${userName}`}
        description="Here's what needs your attention across Millionaire Dizital CRM today."
        badge="EXECUTIVE MODE"
        icon={<Crown className="w-7 h-7 text-amber-500 dark:text-amber-400" />}
        actions={
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            <Link
              href="/docs"
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs flex items-center gap-1.5 touch-target shrink-0"
            >
              <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="hidden sm:inline">Upload to </span>
              <span>Drive</span>
            </Link>
            <button
              onClick={handleExportExecutiveBrief}
              disabled={isExporting}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer touch-target shrink-0"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
              ) : (
                <Download className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              )}
              <span className="hidden xs:inline">Export </span>
              <span>Brief</span>
            </button>
            <Link
              href="/leads"
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 touch-target shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Lead</span>
            </Link>
          </div>
        }
      />

      {/* Open Section 1: Top 5 Key Metrics */}
      <section className="space-y-3">
        <CommandMetrics />
      </section>

      {/* Open Section 2: Millionaire Dizital Operating System (Delivery Sheet & KPI Tracker) */}
      <section className="pt-2 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Agency Operating System & Client Deliverables Matrix</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Master control hub across all 10 active client accounts, planned deliverables, and live growth KPIs.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setActiveControlTab("delivery")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeControlTab === "delivery"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <TableProperties className="w-4 h-4 text-emerald-600" />
              <span>Monthly Delivery Sheet</span>
            </button>
            <button
              onClick={() => setActiveControlTab("kpi")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeControlTab === "kpi"
                  ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Target className="w-4 h-4 text-purple-600" />
              <span>KPI Growth Tracker</span>
            </button>
            <button
              onClick={() => setActiveControlTab("subadmin")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeControlTab === "subadmin"
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Sub-Admin Access Control</span>
            </button>
          </div>
        </div>

        {activeControlTab === "delivery" && (
          <MillionaireDeliverySpreadsheet
            clientName="Agency Master Sheet"
            isAdmin={true}
          />
        )}

        {activeControlTab === "kpi" && (
          <MillionaireKpiTracker
            clientName="Agency Master KPIs"
            isAdmin={true}
          />
        )}

        {activeControlTab === "subadmin" && (
          <SubAdminPermissionsManager />
        )}
      </section>

      {/* Section 3: Developer Project Allocation & Workload (Live Overview) */}
      <section className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <OwnerWorkloadSection />
      </section>

      {/* Open Section 3: Needs Attention Exception Queue */}
      <section className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <NeedsAttentionQueue />
      </section>

      {/* Open Section 4: AI Executive Brief & Realtime Team Status */}
      <section className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
        <AIOwnerAssistant />
        <RealtimeTeamView />
      </section>
    </div>
  );
}
