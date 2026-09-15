"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, FolderKanban, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

interface ClientUpdateItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  projectName?: string;
  projectNumber?: string;
  author: {
    name: string;
    designation: string;
    avatarUrl: string | null;
  };
}

interface ProjectData {
  id: string;
  name: string;
  projectNumber: string;
  clientUpdates: ClientUpdateItem[];
}

export default function ClientUpdatesPage() {
  const [updates, setUpdates] = useState<ClientUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const res = await fetch("/mdz-crm/api/client/projects");
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "Failed to load daily progress updates.");
        } else {
          const allUpdates: ClientUpdateItem[] = [];
          (data.projects || []).forEach((p: ProjectData) => {
            if (p.clientUpdates && p.clientUpdates.length > 0) {
              p.clientUpdates.forEach((u) => {
                allUpdates.push({
                  ...u,
                  projectName: p.name,
                  projectNumber: p.projectNumber,
                });
              });
            }
          });
          // Sort latest updates first
          allUpdates.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setUpdates(allUpdates);
        }
      } catch (err) {
        console.error(err);
        setError("Network error occurred while fetching updates.");
      } finally {
        setLoading(false);
      }
    }

    fetchUpdates();
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              CLIENT WORKSPACE
            </span>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              VERIFIED DEVELOPMENT LOGS
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-indigo-500" />
            <span>Daily Development Updates</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time milestones, release summaries, and daily progress logs posted by your engineering team.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
          {updates.length} Published Update{updates.length === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Updates Timeline List */}
      {updates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Daily Updates Posted Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            As developers complete development sprints and daily milestones on your projects, their verified progress reports will be published here.
          </p>
          <div className="pt-2">
            <Link
              href="/client"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <span>View Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <div
              key={update.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  {update.projectName && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold mb-1">
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>{update.projectName}</span>
                      <span className="text-slate-400">({update.projectNumber})</span>
                    </div>
                  )}
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {update.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    ✓ Verified Update
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(update.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Render Numbered Task Highlights */}
              <div className="space-y-2">
                {(() => {
                  const lines = (update.content || "").split("\n").map((l) => l.trim()).filter(Boolean);
                  const isNumbered = lines.some((l) => /^(\d+[\.\)]|\-|\•)/.test(l));

                  if (!isNumbered) {
                    return (
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {update.content}
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        Task Highlights:
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {lines.map((line, idx) => {
                          const match = line.match(/^(\d+[\.\)]|\-|\•)\s*(.*)$/);
                          const pointText = match ? match[2] : line;
                          const isNote = line.toLowerCase().startsWith("note:");

                          if (isNote) {
                            return (
                              <div
                                key={idx}
                                className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 text-xs text-amber-900 dark:text-amber-200 font-medium"
                              >
                                {line}
                              </div>
                            );
                          }

                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3"
                            >
                              <span className="w-6 h-6 shrink-0 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center font-mono shadow-xs mt-0.5">
                                {match && !isNaN(parseInt(match[1])) ? parseInt(match[1]) : idx + 1}
                              </span>
                              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed pt-0.5">
                                {pointText}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Author: {update.author.name} ({update.author.designation || "Engineer"})
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(update.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
