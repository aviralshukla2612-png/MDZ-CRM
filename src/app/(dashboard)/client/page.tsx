"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, ShieldCheck, Calendar, ArrowRight, AlertCircle, FileText, CheckCircle2 } from "lucide-react";

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

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/client/projects");
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "Failed to load client projects.");
        } else {
          setProjects(data.projects || []);
          setClient(data.client || null);
          setContact(data.contact || null);
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
      <div className="p-8 max-w-4xl mx-auto font-sans">
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
            Track real-time progress, assigned developers, and daily updates for your active projects.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {contact?.termsAccepted ? (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Terms Accepted (v1.0)</span>
            </span>
          ) : (
            <Link
              href="/terms-and-conditions"
              className="text-xs font-mono px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Review Terms</span>
            </Link>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-500" />
            <span>Assigned Projects ({projects.length})</span>
          </h2>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No active projects assigned yet.</p>
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
    </div>
  );
}
