"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import {
  Clock,
  FolderKanban,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";

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
  const { showToast } = useToast();
  const [updates, setUpdates] = useState<ClientUpdateItem[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getClientId = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("clientId") || localStorage.getItem("mdz_active_client_id") || "";
    }
    return "";
  };

  async function fetchUpdates() {
    try {
      setLoading(true);
      const cid = getClientId();
      const url = cid ? `/mdz-crm/api/client/projects?clientId=${cid}` : "/mdz-crm/api/client/projects";
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to load daily progress updates.");
      } else {
        const projs = data.projects || [];
        setProjects(projs);
        setError(null);
        if (projs.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projs[0].id);
        }

        const allUpdates: ClientUpdateItem[] = [];
        projs.forEach((p: ProjectData) => {
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

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      showToast("Please select a project to post an update for", "error");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`/mdz-crm/api/client/projects/${selectedProjectId}/daily-updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          visibility: "CLIENT_VISIBLE",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("✓ Daily development update published live!", "success");
        setIsModalOpen(false);
        setNewTitle("");
        setNewContent("");
        await fetchUpdates();
      } else {
        showToast(data.error || "Failed to publish daily update", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error publishing update", "error");
    } finally {
      setSubmitting(false);
    }
  };

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
      <ClientPortalNav currentTab="/client/updates" />

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
            Real-time milestones, release summaries, and daily progress logs posted by your engineering & management team.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post Daily Update</span>
            </button>
          )}
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
            {updates.length} Published
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Updates Stream */}
      {updates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            No development updates yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your engineering team will post daily milestones, sprint accomplishments, and release notes here.
          </p>
          {projects.length > 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Update</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <div
              key={update.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    {update.author.avatarUrl ? (
                      <img
                        src={update.author.avatarUrl}
                        alt={update.author.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      update.author.name[0]
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {update.author.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 block">
                      {update.author.designation}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {update.projectName && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {update.projectName}
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(update.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {update.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {update.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Daily Update BottomSheet Modal */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Post Daily Development Update"
        subtitle="Publish engineering sprint achievements and operational milestones for client visibility."
      >
        <form onSubmit={handleCreateUpdate} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {projects.length > 1 && (
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Target Project *</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-semibold cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Update Title *</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Completed festive carousel graphics & scheduled 4 reels"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500 font-semibold"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Update Content & Technical Summary *</label>
            <textarea
              rows={5}
              required
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Describe work completed today, pending review links, and planned deliverables for tomorrow..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Publishing..." : "✓ Publish Daily Progress Update"}</span>
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
