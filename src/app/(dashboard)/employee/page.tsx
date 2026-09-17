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
  Cloud,
  HardDrive,
  Film,
  Sparkles,
  Camera,
} from "lucide-react";
import DailyProgressEntryModal from "@/components/projects/DailyProgressEntryModal";
import { MediaUploader } from "@/components/ui/MediaUploader";
import { MediaGallery } from "@/components/ui/MediaGallery";
import { AvatarUploadModal } from "@/components/ui/AvatarUploadModal";

export default function EmployeeDeskPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const userName = session?.user?.name ? session.user.name.split(" ")[0] : "Employee";

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setPhotoUrl((session.user as any)?.avatarUrl || null);
    }
  }, [session]);

  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [newTaskStatus, setNewTaskStatus] = useState("PLANNING");
  const [submittingTask, setSubmittingTask] = useState(false);

  // Daily Progress Update Modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateModalProject, setUpdateModalProject] = useState<any>(null);

  // Google Drive Quick Upload Modal state
  const [isDriveUploadModalOpen, setIsDriveUploadModalOpen] = useState(false);
  const [driveUploadDestination, setDriveUploadDestination] = useState<"GENERAL" | "PROJECT">("GENERAL");
  const [driveTargetProjectId, setDriveTargetProjectId] = useState<string>("");
  const [driveCategory, setDriveCategory] = useState<string>("GENERAL");
  const [driveRefreshKey, setDriveRefreshKey] = useState(0);

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

  // Derived Task Metrics across all assigned projects - strictly filtered to tasks assigned to this employee
  const currentEmpId = (session?.user as any)?.employeeId;
  const currentEmpName = session?.user?.name;

  const allTasks = projects.flatMap((p) =>
    (p.tasks || [])
      .filter((t: any) => {
        if (!currentEmpId && !currentEmpName) return true;
        return (
          (currentEmpId && (t.assignedToId === currentEmpId || t.assignedTo?.id === currentEmpId)) ||
          (currentEmpName && (t.assignee === currentEmpName || t.assignedTo?.name === currentEmpName))
        );
      })
      .map((t: any) => ({ ...t, projectId: p.id, projectName: p.name }))
  );
  const activeTasks = allTasks.filter((t) => t.status !== "ARCHIVED");
  const completedCount = activeTasks.filter((t) => t.status === "COMPLETED" || t.status === "DONE").length;
  const inProgressCount = activeTasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "CURRENT").length;
  const revisionCount = activeTasks.filter((t) => t.status === "REVISION" || t.status === "ON_HOLD").length;
  const planningCount = activeTasks.filter((t) => t.status === "PLANNING" || t.status === "TODO").length;
  const totalTasksCount = activeTasks.length;
  const overallPercentage = totalTasksCount === 0 ? 0 : Math.round((completedCount / totalTasksCount) * 100);

  const activeWorkTask = activeTasks.find((t) => t.status === "IN_PROGRESS" || t.status === "CURRENT") || activeTasks[0] || null;

  const handleToggleStatus = async (projectId: string, taskId: string, explicitStatusOrCurrent: string) => {
    let nextStatus = explicitStatusOrCurrent;
    const s = explicitStatusOrCurrent.toUpperCase();

    // If passed current status rather than target status, cycle forward
    if (s === "TODO" || s === "PLANNING") {
      nextStatus = "CURRENT";
    } else if (s === "CURRENT" || s === "IN_PROGRESS") {
      nextStatus = "REVISION";
    } else if (s === "REVISION" || s === "ON_HOLD") {
      nextStatus = "COMPLETED";
    } else if (s === "COMPLETED" || s === "DONE") {
      nextStatus = "PLANNING";
    } else {
      nextStatus = explicitStatusOrCurrent;
    }

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

  const handleSetTaskStatus = async (projectId: string, taskId: string, targetStatus: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Task moved to ${targetStatus}`, "success");
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
          status: newTaskStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Task added to project stack`, "success");
        setNewTaskTitle("");
        setNewTaskStatus("PLANNING");
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
              onClick={() => {
                if (projects.length > 0 && !driveTargetProjectId) {
                  setDriveTargetProjectId(projects[0].id);
                }
                setIsDriveUploadModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 touch-target"
              title="Upload video, image, or document directly to Google Drive"
            >
              <Cloud className="w-3.5 h-3.5 text-white" />
              <span>Upload to Drive</span>
            </button>
            {projects.length > 0 && (
              <button
                onClick={() => {
                  setUpdateModalProject(projects[0]);
                  setIsUpdateModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 touch-target"
                title="Post daily progress update to Client & Admin"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Post Daily Update</span>
              </button>
            )}
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

      {/* Employee Profile Quick Bar with Photo Upload */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={() => setIsPhotoModalOpen(true)}
            title="Click to change your profile photo"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-md flex items-center justify-center bg-gradient-to-tr from-indigo-600 to-purple-600 group-hover:scale-105 transition-transform">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={session?.user?.name || "Employee"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl sm:text-2xl font-black text-white">
                  {(session?.user?.name || "E")[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md border-2 border-white dark:border-slate-900 transition-transform active:scale-95"
              title="Change Photo"
            >
              <Camera className="w-3 h-3" />
            </div>
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">
                {session?.user?.name || "Employee Desk"}
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {(session?.user as any)?.employeeId || "ACTIVE"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              {session?.user?.email}
            </p>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
              <span>●</span>
              <span>Engineering Workspace Desk</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPhotoModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs transition-all flex items-center justify-center gap-2 self-start sm:self-auto shadow-xs active:scale-95 cursor-pointer"
        >
          <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{photoUrl ? "Change Photo" : "Add Profile Photo"}</span>
        </button>
      </div>

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

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUpdateModalProject(prj);
                      setIsUpdateModalOpen(true);
                    }}
                    className="py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-amber-200 dark:border-amber-800 shadow-2xs"
                    title="Post a daily progress update visible to Client & Admin"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Daily Update</span>
                  </button>

                  <Link
                    href={`/projects/${prj.id}`}
                    className="py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  >
                    <span>Tasks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
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
              const isInProgress = task.status === "IN_PROGRESS" || task.status === "CURRENT";
              const isRevision = task.status === "REVISION" || task.status === "ON_HOLD";
              const isPlanning = !isDone && !isInProgress && !isRevision;

              return (
                <div
                  key={task.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono">
                        {task.projectName}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        task.priority === "URGENT"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                          : task.priority === "HIGH"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                          : task.priority === "MEDIUM"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                          : "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                      }`}>
                        {task.priority === "URGENT"
                          ? "Q1: Fire Fighting"
                          : task.priority === "HIGH"
                          ? "Q2: Productive Time"
                          : task.priority === "MEDIUM"
                          ? "Q3: Distraction"
                          : "Q4: Down Time"}
                      </span>
                      {isPlanning && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono">
                          PLANNING
                        </span>
                      )}
                      {isInProgress && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono">
                          CURRENT
                        </span>
                      )}
                      {isRevision && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono">
                          REVISION
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
                    <select
                      value={
                        isDone
                          ? "COMPLETED"
                          : isRevision
                          ? "REVISION"
                          : isInProgress
                          ? "CURRENT"
                          : "PLANNING"
                      }
                      onChange={(e) => handleSetTaskStatus(task.projectId, task.id, e.target.value)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer outline-none ${
                        isDone
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 border-emerald-200 dark:border-emerald-800"
                          : isRevision
                          ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 border-purple-200 dark:border-purple-800"
                          : isInProgress
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 border-amber-200 dark:border-amber-800"
                          : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      <option value="PLANNING">📋 Planning</option>
                      <option value="CURRENT">⚡ Current</option>
                      <option value="REVISION">🔄 Revision</option>
                      <option value="COMPLETED">✅ Complete</option>
                    </select>

                    {!isDone ? (
                      <button
                        type="button"
                        onClick={() => handleSetTaskStatus(task.projectId, task.id, "COMPLETED")}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                        title="Mark task complete"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Google Drive Cloud Storage & Uploads Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Google Drive Files & Media Storage</span>
            </h2>
            <p className="text-xs text-slate-500">
              Upload videos, screenshots, documents, and project deliverables directly into Google Drive.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (projects.length > 0 && !driveTargetProjectId) {
                  setDriveTargetProjectId(projects[0].id);
                }
                setIsDriveUploadModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Upload to Drive</span>
            </button>
            <Link
              href="/docs"
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              Open Full Drive Hub →
            </Link>
          </div>
        </div>

        <MediaGallery
          key={driveRefreshKey}
          entityType="ALL"
          entityId="ALL"
          allowDelete={true}
        />
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
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Productivity Matrix Quadrant</label>
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

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Initial Stage</label>
            <select
              value={newTaskStatus}
              onChange={(e) => setNewTaskStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none font-semibold text-xs"
            >
              <option value="PLANNING">📋 Planning</option>
              <option value="CURRENT">⚡ Current</option>
              <option value="REVISION">🔄 Revision</option>
              <option value="COMPLETED">✅ Complete</option>
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

      {/* Google Drive Upload Modal Bottom Sheet */}
      <BottomSheet
        isOpen={isDriveUploadModalOpen}
        onClose={() => setIsDriveUploadModalOpen(false)}
        title="Upload to Google Drive"
        subtitle="Stream videos, images, and files directly to company Google Drive storage."
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Storage Destination</label>
              <select
                value={driveUploadDestination}
                onChange={(e) => setDriveUploadDestination(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none font-semibold"
              >
                <option value="GENERAL">General / Shared Storage</option>
                <option value="PROJECT">Project Folder</option>
              </select>
            </div>

            {driveUploadDestination === "PROJECT" ? (
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Select Project</label>
                <select
                  value={driveTargetProjectId}
                  onChange={(e) => setDriveTargetProjectId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none font-semibold"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Category</label>
                <select
                  value={driveCategory}
                  onChange={(e) => setDriveCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none font-semibold"
                >
                  <option value="GENERAL">General Assets & Files</option>
                  <option value="VIDEO">Video / Screen Recording</option>
                  <option value="IMAGE">Design / Screenshot</option>
                  <option value="SPECIFICATION">Specification</option>
                </select>
              </div>
            )}
          </div>

          <MediaUploader
            entityType={driveUploadDestination === "PROJECT" && driveTargetProjectId ? "PROJECT" : "GENERAL"}
            entityId={driveUploadDestination === "PROJECT" && driveTargetProjectId ? driveTargetProjectId : "knowledge-base"}
            category={driveCategory}
            onUploadSuccess={() => {
              setDriveRefreshKey((k) => k + 1);
              setIsDriveUploadModalOpen(false);
              showToast("✓ File uploaded to Google Drive successfully!", "success");
            }}
          />
        </div>
      </BottomSheet>

      {updateModalProject && (
        <DailyProgressEntryModal
          projectId={updateModalProject.id}
          projectName={updateModalProject.name}
          isOpen={isUpdateModalOpen}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setUpdateModalProject(null);
          }}
          onSuccess={() => {
            showToast("✓ Daily update posted to Client & Admin successfully!", "success");
            fetchEmployeeProjects();
          }}
        />
      )}

      <AvatarUploadModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentAvatarUrl={photoUrl}
        userName={session?.user?.name || "Employee"}
        onSuccess={(newUrl) => setPhotoUrl(newUrl)}
        title="Update Your Profile Photo"
      />
    </div>
  );
}
