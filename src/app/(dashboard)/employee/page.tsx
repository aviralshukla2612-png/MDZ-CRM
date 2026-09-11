"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/PageHeader";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  FolderKanban,
  Send,
  Plus,
  Circle,
  Clock3,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function EmployeeDeskPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const userName = session?.user?.name ? session.user.name.split(" ")[0] : "Employee";

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [submittingTask, setSubmittingTask] = useState(false);

  useEffect(() => {
    fetchEmployeeProjects();
  }, []);

  const fetchEmployeeProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/projects");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProjects(json.data);
        if (json.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(json.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Derived Task Metrics across all assigned projects
  const allTasks = projects.flatMap((p) =>
    (p.tasks || []).map((t: any) => ({ ...t, projectId: p.id, projectName: p.name }))
  );
  const activeTasks = allTasks.filter((t) => t.status !== "ARCHIVED");
  const completedCount = activeTasks.filter((t) => t.status === "COMPLETED" || t.status === "DONE").length;
  const inProgressCount = activeTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const todoCount = activeTasks.filter((t) => t.status === "TODO").length;
  const totalTasksCount = activeTasks.length;
  const overallPercentage = totalTasksCount === 0 ? 0 : Math.round((completedCount / totalTasksCount) * 100);

  const activeWorkTask = activeTasks.find((t) => t.status === "IN_PROGRESS") || activeTasks[0] || null;

  const handleToggleStatus = async (projectId: string, taskId: string, currentStatus: string) => {
    let nextStatus = "IN_PROGRESS";
    if (currentStatus === "TODO") nextStatus = "IN_PROGRESS";
    else if (currentStatus === "IN_PROGRESS") nextStatus = "COMPLETED";
    else if (currentStatus === "COMPLETED" || currentStatus === "DONE") nextStatus = "TODO";

    try {
      const res = await fetch(`/mdz-crm/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Task updated to ${nextStatus}`, "success");
        fetchEmployeeProjects();
      } else {
        showToast(json.error || "Failed to update task", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating task status", "error");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProjectId) return;

    try {
      setSubmittingTask(true);
      const res = await fetch(`/mdz-crm/api/projects/${selectedProjectId}/tasks`, {
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
        showToast(`✓ Task added to project stack`, "success");
        setNewTaskTitle("");
        setIsTaskSheetOpen(false);
        fetchEmployeeProjects();
      } else {
        showToast(json.error || "Failed to create task", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error adding task", "error");
    } finally {
      setSubmittingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <span>Loading Employee Desk Workspace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Mobile-Optimized Executive Page Header */}
      <PageHeader
        title={`${getGreeting()}, ${userName}`}
        description="Your assigned project task stack & progress tracking engine workspace."
        badge={session?.user?.role || "EMPLOYEE"}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTaskSheetOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 touch-target"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Add Task</span>
            </button>
          </div>
        }
      />

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Projects</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{projects.length}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">In Progress</span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{inProgressCount}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Completed Tasks</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedCount}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">Overall Completion</span>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {overallPercentage}%
          </div>
        </div>
      </div>

      {/* Section 1: ⭐ MOST IMPORTANT TASK Card */}
      {(() => {
        const mostImportantTask = activeTasks.find(
          (t) => t.isMostImportant && t.status !== "COMPLETED" && t.status !== "ARCHIVED"
        );

        return (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-100 font-mono">
                  MOST IMPORTANT TASK
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-600/70 border border-amber-300/40">
                Admin Priority Signal
              </span>
            </div>

            {mostImportantTask ? (
              <div className="space-y-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight">{mostImportantTask.title}</h2>
                  <p className="text-xs text-amber-100 mt-0.5">
                    Project: <strong className="text-white">{mostImportantTask.projectName}</strong> • Status:{" "}
                    <strong className="text-white font-mono">{mostImportantTask.status}</strong>
                  </p>
                </div>
                <div className="pt-1 flex items-center gap-2">
                  <Link
                    href={`/projects/${mostImportantTask.projectId}`}
                    className="px-4 py-2 rounded-xl bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 transition-colors shadow-xs inline-flex items-center gap-1.5"
                  >
                    <span>Open Task Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-1 py-1">
                <h2 className="text-base font-bold text-amber-100">No most important task assigned.</h2>
                <p className="text-xs text-amber-200/90">
                  The Admin has not currently designated a high-priority task for your queue.
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Section 2: Assigned Projects Workspace List */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
          My Assigned Projects ({projects.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((prj) => {
            const prjTasks = (prj.tasks || []).filter((t: any) => t.status !== "ARCHIVED");
            const prjCompleted = prjTasks.filter((t: any) => t.status === "COMPLETED" || t.status === "DONE").length;
            const prjTotal = prjTasks.length;
            const prjProgress = prjTotal === 0 ? 0 : Math.round((prjCompleted / prjTotal) * 100);
            const activeTask = prjTasks.find((t: any) => t.status === "IN_PROGRESS") || prjTasks[0];

            return (
              <div
                key={prj.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {prj.projectCode}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {prj.status}
                    </span>
                  </div>

                  <Link href={`/projects/${prj.id}`} className="hover:underline block">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{prj.name}</h3>
                  </Link>

                  <div className="text-xs text-slate-500">Client: {prj.clientName}</div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">
                      {prjCompleted} / {prjTotal} Tasks Completed
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono">{prjProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${prjProgress}%` }}
                    />
                  </div>
                  {activeTask && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate pt-1">
                      Currently Working: <strong className="text-slate-800 dark:text-slate-200">{activeTask.title}</strong>
                    </div>
                  )}
                </div>

                <Link
                  href={`/projects/${prj.id}`}
                  className="w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <span>Open Task Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Today Task Stack Checklist */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            My Task Stack Checklist ({activeTasks.length})
          </h2>
          <button
            onClick={() => setIsTaskSheetOpen(true)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            + Add Task
          </button>
        </div>

        <div className="space-y-2.5">
          {activeTasks.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No active tasks found. Click "+ Add Task" to create project tasks.
            </div>
          ) : (
            activeTasks.map((task) => {
              const isDone = task.status === "COMPLETED" || task.status === "DONE";
              const isInProgress = task.status === "IN_PROGRESS";

              return (
                <div
                  key={task.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono">
                        {task.projectName}
                      </span>
                      {isInProgress && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono">
                          IN PROGRESS
                        </span>
                      )}
                      {isDone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm font-bold ${isDone ? "line-through text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
                      {task.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleStatus(task.projectId, task.id, task.status)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        isDone
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                          : isInProgress
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 border-amber-200 dark:border-amber-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>✓ COMPLETED</span>
                        </>
                      ) : isInProgress ? (
                        <>
                          <Clock3 className="w-4 h-4 text-amber-600 animate-spin" />
                          <span>IN PROGRESS</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-slate-400" />
                          <span>TODO</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Task Bottom Sheet */}
      <BottomSheet
        isOpen={isTaskSheetOpen}
        onClose={() => setIsTaskSheetOpen(false)}
        title="Add Project Task"
        subtitle="Tasks automatically drive single-source-of-truth project progress."
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Select Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Task Title</label>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Develop Payment Gateway Integration"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Priority</label>
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="URGENT">Urgent Priority</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submittingTask}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs touch-target"
          >
            {submittingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Save Project Task</span>
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
