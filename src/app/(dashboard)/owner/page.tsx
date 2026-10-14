"use client";

import React, { useState } from "react";
import { CommandMetrics } from "@/components/owner/CommandMetrics";
import { NeedsAttentionQueue } from "@/components/owner/NeedsAttentionQueue";
import { AIOwnerAssistant } from "@/components/owner/AIOwnerAssistant";
import { RealtimeTeamView } from "@/components/owner/RealtimeTeamView";
import { OwnerWorkloadSection } from "@/components/owner/OwnerWorkloadSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { Plus, Download, Crown, Cloud, Loader2 } from "lucide-react";
import Link from "next/link";
import { generateAndDownloadExecutiveBriefPDF } from "@/lib/pdfGenerator";

import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";

export default function OwnerDashboardPage() {
  const { showToast } = useToast();
  const { data: session } = useSession();
  const [isExporting, setIsExporting] = useState(false);

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
          <div className="flex items-center gap-2">
            <Link
              href="/docs"
              className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Upload to Drive</span>
            </Link>
            <button
              onClick={handleExportExecutiveBrief}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
              <span>{isExporting ? "Exporting PDF..." : "Export Executive Brief"}</span>
            </button>
            <Link
              href="/leads"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead / Project</span>
            </Link>
          </div>
        }
      />

      {/* Open Section 1: Top 5 Key Metrics */}
      <section className="space-y-3">
        <CommandMetrics />
      </section>

      {/* Section 2: Developer Project Allocation & Workload (Live Overview) */}
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
