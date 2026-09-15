"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/PageHeader";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import {
  Send,
  Plus,
  Clock,
  Layers,
  Search,
  CheckCircle2,
  FolderKanban,
  User,
  ArrowRight,
  Filter,
  Sparkles,
  Calendar,
  Building,
} from "lucide-react";
import DailyProgressEntryModal, { ProjectOption } from "@/components/projects/DailyProgressEntryModal";

interface ClientUpdateItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  projectId?: string;
  projectName?: string;
  projectNumber?: string;
  clientName?: string;
  author: {
    name: string;
    designation: string;
    avatarUrl: string | null;
  };
}

export default function EmployeeDailyUpdatesPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Post Daily Update Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Add Task Modal
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [taskProjectId, setTaskProjectId] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("HIGH");
  const [submittingTask, setSubmittingTask] = useState(false);

  useEffect(() => {
    fetchProjectsAndUpdates();
  }, []);

  const fetchProjectsAndUpdates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/projects");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProjects(json.data);
        if (json.data.length > 0 && !taskProjectId) {
          setTaskProjectId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch project updates", "error");
    } finally {
      setLoading(false);
    }
  };

  // Convert projects to ProjectOption format
  const projectOptions: ProjectOption[] = useMemo(() => {
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      projectCode: p.projectCode || p.projectNumber,
      projectNumber: p.projectNumber,
      clientName: p.clientName || p.client?.companyName,
    }));
  }, [projects]);

  // Extract all client updates across projects
  const allUpdates: ClientUpdateItem[] = useMemo(() => {
    const list: ClientUpdateItem[] = [];
    projects.forEach((p) => {
      if (Array.isArray(p.clientUpdates)) {
        p.clientUpdates.forEach((u: any) => {
          list.push({
            ...u,
            projectId: p.id,
            projectName: p.name,
            projectNumber: p.projectNumber || p.projectCode,
            clientName: p.clientName || p.client?.companyName || "Client",
          });
        });
      }
    });

    // Sort newest first
    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list;
  }, [projects]);

  // Filter updates based on selected project and search term
  const filteredUpdates = useMemo(() => {
    return allUpdates.filter((u) => {
      const matchesProject =
        selectedProjectId === "ALL" || u.projectId === selectedProjectId;

      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        u.title.toLowerCase().includes(term) ||
        u.content.toLowerCase().includes(term) ||
        (u.projectName && u.projectName.toLowerCase().includes(term)) ||
        (u.author?.name && u.author.name.toLowerCase().includes(term));

      return matchesProject && matchesSearch;
    });
  }, [allUpdates, selectedProjectId, searchTerm]);

  // Parse update content into numbered points
  const parseNumberedContent = (content: string) => {
    if (!content) return { points: [], note: "" };

    const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
    const points: string[] = [];
    const notes: string[] = [];

    lines.forEach((line) => {
      // Check if line starts with a number or bullet like "1.", "1)", "•", "-"
      const match = line.match(/^(\d+[.)]|[-•])\s*(.*)$/);
      if (match && match[2]) {
        points.push(match[2]);
      } else if (line.toLowerCase().startsWith("note:")) {
        notes.push(line.replace(/^note:\s*/i, ""));
      } else {
        // If not explicit numbered point, treat as item
        points.push(line);
      }
    });

    return {
      points,
      note: notes.join(" "),
    };
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !taskProjectId) {
      showToast("Please provide a task title and project", "error");
      return;
    }

    try {
      setSubmittingTask(true);
      const res = await fetch(`/mdz-crm/api/projects/${taskProjectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          priority: newTaskPriority,
          status: "TODO",
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("✓ Task added to project queue", "success");
        setNewTaskTitle("");
        setIsTaskSheetOpen(false);
        fetchProjectsAndUpdates();
      } else {
        showToast(json.error || "Failed to create task", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Network error creating task", "error");
    } finally {
      setSubmittingTask(false);
    }
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Page Header */}
      <PageHeader
        title="Daily Progress Updates"
        description="Structured, number-wise task updates shared directly with the Client in their portal and Admin in real-time."
        badge="DAILY LOGS"
        icon={<Clock className="w-7 h-7 text-amber-500" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTaskSheetOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5 touch-target"
            >
              <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>+ Add Task</span>
            </button>

            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 touch-target active:scale-95"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>+ Post Daily Update</span>
            </button>
          </div>
        }
      />

      {/* TOP CONTROL BAR: Project Dropdown Selector + Search Bar */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Project Dropdown Selector */}
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Filter Project:</span>
              </span>
            </div>

            <div className="relative flex-1 min-w-[260px] max-w-md">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl pl-3.5 pr-9 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none shadow-xs transition-all"
              >
                <option value="ALL">🌐 All Assigned Projects ({projects.length} Projects)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name} {p.projectCode || p.projectNumber ? `(${p.projectCode || p.projectNumber})` : ""} {p.clientName ? `— ${p.clientName}` : ""}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600 dark:text-indigo-400 text-xs">
                ▼
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search updates or points..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800 font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{filteredUpdates.length} Updates Logged</span>
            </span>
          </div>
        </div>

        {/* If a specific project is selected, show banner */}
        {activeProject && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                Viewing: {activeProject.name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {activeProject.projectCode || activeProject.projectNumber}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Client: <strong>{activeProject.clientName || activeProject.client?.companyName}</strong>
              </span>
            </div>

            <Link
              href={`/projects/${activeProject.id}`}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Open Project Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* UPDATES LIST: Number-Wise Tasks Rendering */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading daily updates...</div>
        ) : filteredUpdates.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
              <Send className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                No daily updates logged yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                Post number-wise task highlights to keep the Client and Admin updated with your daily milestones.
              </p>
            </div>
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all inline-flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post First Daily Update</span>
            </button>
          </div>
        ) : (
          filteredUpdates.map((update) => {
            const { points, note } = parseNumberedContent(update.content);

            return (
              <div
                key={update.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
              >
                {/* Header: Project & Author Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {update.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold">
                      {update.projectName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                      Client & Admin Visible
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(update.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* NUMBER-WISE TASK POINTS */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Completed Task Highlights:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {points.map((pt, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3"
                      >
                        <span className="w-6 h-6 shrink-0 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center font-mono shadow-xs mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed pt-0.5">
                          {pt}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Note */}
                {note && (
                  <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                    <strong>Note:</strong> {note}
                  </div>
                )}

                {/* Footer: Author & Client Attribution */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-[10px] flex items-center justify-center">
                      {update.author?.name ? update.author.name[0]?.toUpperCase() : "U"}
                    </div>
                    <span>
                      Logged by: <strong className="text-slate-700 dark:text-slate-300">{update.author?.name || "Developer"}</strong>
                      {update.author?.designation ? ` (${update.author.designation})` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span>Client: <strong className="text-slate-700 dark:text-slate-300">{update.clientName}</strong></span>
                    {update.projectId && (
                      <Link
                        href={`/projects/${update.projectId}`}
                        className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <span>View Project</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Post Daily Progress Modal (Number-Wise Inputs) */}
      <DailyProgressEntryModal
        projects={projectOptions}
        projectId={selectedProjectId !== "ALL" ? selectedProjectId : undefined}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={() => {
          showToast("✓ Daily update posted to Client & Admin successfully!", "success");
          fetchProjectsAndUpdates();
        }}
      />

      {/* Add Task Bottom Sheet */}
      <BottomSheet
        isOpen={isTaskSheetOpen}
        onClose={() => setIsTaskSheetOpen(false)}
        title="Add Project Task"
        subtitle="Propose or add a new task to your project execution queue."
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-bold block">
              Select Project *
            </label>
            <select
              value={taskProjectId}
              onChange={(e) => setTaskProjectId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 font-bold outline-none cursor-pointer"
              required
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.projectCode || p.projectNumber ? `(${p.projectCode || p.projectNumber})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-bold block">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Implement payment gateway webhook verification"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-bold block">
              Priority
            </label>
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none font-semibold text-xs"
            >
              <option value="URGENT">Q1: Fire Fighting (Urgent & Important)</option>
              <option value="HIGH">Q2: Productive Time (Important & Not Urgent)</option>
              <option value="MEDIUM">Q3: Distraction (Urgent & Not Important)</option>
              <option value="LOW">Q4: Down Time (Not Urgent & Not Important)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submittingTask}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs touch-target mt-2"
          >
            <span>{submittingTask ? "Saving..." : "Save Project Task"}</span>
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
