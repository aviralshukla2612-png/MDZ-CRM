"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, ShieldCheck, Calendar, ArrowRight, AlertCircle, FileText, CheckCircle2, TableProperties, Target, TrendingUp, Sparkles, BarChart3 } from "lucide-react";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import { MillionaireDeliverySpreadsheet } from "@/components/client/MillionaireDeliverySpreadsheet";
import { MillionaireKpiTracker } from "@/components/client/MillionaireKpiTracker";

interface ClientProject {
  id: string;
  projectNumber: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  targetDeadline: string | null;
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  zeroTaskMessage: string | null;
}

interface ClientInfo {
  id: string;
  companyName: string;
  gstNumber: string | null;
  email: string;
}

interface ContactInfo {
  id: string;
  name: string;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
}

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"delivery" | "kpi">("delivery");

  const totalTasksAll = projects.reduce((acc, p) => acc + (p.totalTasks || 0), 0);
  const completedTasksAll = projects.reduce((acc, p) => acc + (p.completedTasks || 0), 0);
  const overallCompletionRate = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + (p.progressPercentage || 0), 0) / projects.length)
    : 0;

  const getClientId = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("clientId") || localStorage.getItem("mdz_active_client_id") || "";
    }
    return "";
  };

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const cid = getClientId();
        const url = cid ? `/mdz-crm/api/client/projects?clientId=${cid}` : "/mdz-crm/api/client/projects";
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "Failed to load client projects.");
        } else {
          setProjects(data.projects || []);
          setClient(data.client || null);
          setContact(data.contact || null);
          setError(null);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Network error occurred while fetching dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 font-sans">
        <ClientPortalNav currentTab="/client" />
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              CLIENT PORTAL DASHBOARD
            </span>
            {client?.gstNumber && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                GSTIN: {client.gstNumber}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {client?.companyName || "My Client Projects"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track real-time progress, milestones, and daily updates for your active projects.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {contact?.termsAccepted ? (
            <Link
              href="/terms-and-conditions?from=/client"
              className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
              title="Click to review accepted terms"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Terms Accepted (v1.0)</span>
            </Link>
          ) : (
            <Link
              href="/terms-and-conditions?from=/client"
              className="text-xs font-mono px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Review Terms</span>
            </Link>
          )}
        </div>
      </div>

      {/* Operational Modules Navigation */}
      <ClientPortalNav currentTab="/client" />

      {/* Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-500" />
            <span>My Projects ({projects.length})</span>
          </h2>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No active projects found.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              When a project is created for your account, it will appear here with live progress metrics.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                      {p.projectNumber}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {p.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{p.name}</h3>
                  {p.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{p.description}</p>
                  )}
                </div>

                {/* Progress Bar & Tasks Status */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">
                      {p.totalTasks > 0
                        ? `${p.completedTasks} / ${p.totalTasks} Tasks Completed`
                        : p.status === "COMPLETED" || p.progressPercentage === 100
                          ? "Project Completed"
                          : p.progressPercentage > 0
                            ? `Progress: ${p.progressPercentage}%`
                            : "Task Completion Progress"}
                    </span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{p.progressPercentage}%</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${p.progressPercentage}%` }}
                    />
                  </div>

                  {p.zeroTaskMessage && (
                    <p className="text-[11px] italic text-slate-400 dark:text-slate-500">{p.zeroTaskMessage}</p>
                  )}

                  <div className="pt-3 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Deadline: {p.targetDeadline ? new Date(p.targetDeadline).toLocaleDateString() : "TBD"}</span>
                    </div>

                    <Link
                      href={`/client/projects/${p.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1 hover:opacity-90 transition-opacity"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-Time Project Completion & Milestone Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-indigo-900/60 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">
                PROJECT COMPLETION PULSE
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live Sync
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Overall Deliverable & Execution Progress</span>
            </h2>
            <p className="text-xs text-indigo-200/80">
              Aggregated completion rate across all active contracts, sprint tasks, and monthly content batches.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-indigo-300 font-mono">Completion Rate</div>
              <div className="text-2xl font-black font-mono text-emerald-400">{overallCompletionRate}%</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center font-mono font-black text-xs text-emerald-300">
              {overallCompletionRate}%
            </div>
          </div>
        </div>

        {/* Aggregate Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-indigo-200">
            <span>Milestone Completion Progress</span>
            <span className="font-mono text-emerald-400">{completedTasksAll} of {totalTasksAll} Tasks Delivered</span>
          </div>
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.max(5, overallCompletionRate)}%` }}
            />
          </div>
        </div>

        {/* 4 Mini Milestones Indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-indigo-300 block">1. Brief & Discovery</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Signed Off
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-indigo-300 block">2. Strategy & Pillars</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Complete
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-indigo-300 block">3. Monthly Production</span>
            <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
              <TrendingUp className="w-3.5 h-3.5" /> Active ({overallCompletionRate}%)
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-indigo-300 block">4. KPI Scaling</span>
            <span className="font-bold text-sky-400 flex items-center gap-1 text-[11px]">
              <BarChart3 className="w-3.5 h-3.5" /> In Optimization
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Delivery Control & KPI Tracker Tabs */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Operational Delivery & Growth Engine</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Switch between your Monthly Delivery Control Sheet and live KPI Growth Tracker.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setActiveWorkspaceTab("delivery")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeWorkspaceTab === "delivery"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <TableProperties className="w-4 h-4 text-emerald-600" />
              <span>Monthly Delivery Sheet</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab("kpi")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeWorkspaceTab === "kpi"
                  ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Target className="w-4 h-4 text-purple-600" />
              <span>KPI Growth Tracker</span>
            </button>
          </div>
        </div>

        {/* View 1: Monthly Delivery Control Spreadsheet */}
        {activeWorkspaceTab === "delivery" && (
          <MillionaireDeliverySpreadsheet
            clientName={client?.companyName || "My Client Account"}
            clientId={client?.id}
            isAdmin={false}
          />
        )}

        {/* View 2: KPI & Growth Tracker (Replicating User Screenshot) */}
        {activeWorkspaceTab === "kpi" && (
          <MillionaireKpiTracker
            clientName={client?.companyName || "My Client Account"}
            clientId={client?.id}
            isAdmin={false}
          />
        )}
      </div>
    </div>
  );
}
