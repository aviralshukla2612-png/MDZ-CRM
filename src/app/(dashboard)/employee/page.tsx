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
  Target,
  Phone,
  Users,
  Edit3,
  ShieldAlert,
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
  const [newTaskDeadline, setNewTaskDeadline] = useState<string>(new Date().toISOString().slice(0, 10));
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

  // Daily Target Reminder State
  const [myTarget, setMyTarget] = useState<any>(null);
  const [loadingMyTarget, setLoadingMyTarget] = useState(true);

  const fetchMyTarget = async () => {
    try {
      setLoadingMyTarget(true);
      const res = await fetch("/mdz-crm/api/employees/targets");
      const json = await res.json();
      if (json.success && json.data?.employees?.length > 0) {
        setMyTarget(json.data.employees[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMyTarget(false);
    }
  };

  const handleIncrementMyTarget = async (incrementBy: number) => {
    if (!myTarget?.id) return;
    try {
      const res = await fetch("/mdz-crm/api/employees/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: myTarget.id,
          incrementBy,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Progress updated", "success");
        fetchMyTarget();
      } else {
        showToast(json.error || "Failed to update", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  // Employee profile & emergency relatives state
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isRelativeModalOpen, setIsRelativeModalOpen] = useState(false);
  const [savingRelatives, setSavingRelatives] = useState(false);

  const [rel1Name, setRel1Name] = useState("");
  const [rel1Relation, setRel1Relation] = useState("Father");
  const [rel1Phone, setRel1Phone] = useState("");
  const [rel2Name, setRel2Name] = useState("");
  const [rel2Relation, setRel2Relation] = useState("Mother");
  const [rel2Phone, setRel2Phone] = useState("");

  const fetchMyProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await fetch("/mdz-crm/api/employees/me");
      const json = await res.json();
      if (json.success && json.data) {
        setMyProfile(json.data);
        setRel1Name(json.data.relative1Name || "");
        setRel1Relation(json.data.relative1Relation || "Father");
        setRel1Phone(json.data.relative1Phone || "");
        setRel2Name(json.data.relative2Name || "");
        setRel2Relation(json.data.relative2Relation || "Mother");
        setRel2Phone(json.data.relative2Phone || "");

        const r1Digits = (json.data.relative1Phone || "").replace(/\D/g, "");
        const r2Digits = (json.data.relative2Phone || "").replace(/\D/g, "");
        if (r1Digits.length < 10 || r2Digits.length < 10) {
          setIsRelativeModalOpen(true);
        }
      }
    } catch (err) {
      console.error("Failed to load employee profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveRelatives = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean1 = rel1Phone.replace(/\D/g, "");
    const clean2 = rel2Phone.replace(/\D/g, "");

    if (!rel1Phone.trim() || clean1.length < 10) {
      showToast("Relative 1 phone number is compulsory and must contain at least 10 digits.", "error");
      return;
    }
    if (!rel2Phone.trim() || clean2.length < 10) {
      showToast("Relative 2 phone number is compulsory and must contain at least 10 digits.", "error");
      return;
    }
    if (clean1 === clean2) {
      showToast("Relative 1 and Relative 2 must be different contact numbers.", "error");
      return;
    }

    try {
      setSavingRelatives(true);
      const res = await fetch("/mdz-crm/api/employees/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relative1Name: rel1Name.trim(),
          relative1Relation: rel1Relation.trim(),
          relative1Phone: rel1Phone.trim(),
          relative2Name: rel2Name.trim(),
          relative2Relation: rel2Relation.trim(),
          relative2Phone: rel2Phone.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Emergency relative contacts updated successfully!", "success");
        setIsRelativeModalOpen(false);
        fetchMyProfile();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("employee_relatives_updated", { detail: json.data }));
        }
      } else {
        showToast(json.error || "Failed to update relative contacts", "error");
      }
    } catch {
      showToast("Network error updating relative contacts", "error");
    } finally {
      setSavingRelatives(false);
    }
  };

  useEffect(() => {
    fetchEmployeeProjects();
    fetchMyTarget();
    fetchMyProfile();

    const handleSync = () => {
      fetchMyProfile();
    };
    window.addEventListener("employee_relatives_updated", handleSync);
    return () => {
      window.removeEventListener("employee_relatives_updated", handleSync);
    };
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
  const currentUserId = (session?.user as any)?.id;
  const currentEmpName = session?.user?.name;

  const allTasks = projects.flatMap((p) =>
    (p.tasks || [])
      .filter((t: any) => {
        if (!currentEmpId && !currentUserId && !currentEmpName) return true;
        const matchUser = currentUserId && (t.assignedToId === currentUserId || t.assignedTo?.id === currentUserId);
        const matchEmp = currentEmpId && (t.assignedToId === currentEmpId || t.assignedTo?.id === currentEmpId || (t.assignedTo as any)?.employeeId === currentEmpId);
        const matchName = currentEmpName && (t.assignee?.toLowerCase().trim() === currentEmpName.toLowerCase().trim() || t.assignedTo?.name?.toLowerCase().trim() === currentEmpName.toLowerCase().trim());
        return matchUser || matchEmp || matchName;
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
    if (!newTaskDeadline) {
      showToast("Task Due Date / Deadline is compulsory.", "error");
      return;
    }

    try {
      setSubmittingTask(true);
      const res = await fetch(`/mdz-crm/api/projects/${selectedProjectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          priority: newTaskPriority,
          status: newTaskStatus,
          deadline: newTaskDeadline,
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
    <div className="space-y-3 sm:space-y-5 pb-8 sm:pb-12">
      {/* Mobile-Optimized Executive Page Header */}
      <PageHeader
        title={`${getGreeting()}, ${userName}`}
        description="Your assigned project task stack & progress tracking engine workspace."
        badge={session?.user?.role || "EMPLOYEE"}
        actions={
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                if (projects.length > 0 && !driveTargetProjectId) {
                  setDriveTargetProjectId(projects[0].id);
                }
                setIsDriveUploadModalOpen(true);
              }}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 touch-target"
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
                className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 touch-target"
                title="Post daily progress update to Client & Admin"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Post Daily Update</span>
              </button>
            )}
            <button
              onClick={() => setIsTaskSheetOpen(true)}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 touch-target"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Add Task</span>
            </button>
          </div>
        }
      />

      {/* Employee Profile Quick Bar with Photo Upload */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={() => setIsPhotoModalOpen(true)}
            title="Click to change your profile photo"
          >
            <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-md flex items-center justify-center bg-gradient-to-tr from-indigo-600 to-purple-600 group-hover:scale-105 transition-transform">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={session?.user?.name || "Employee"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-base sm:text-2xl font-black text-white">
                  {(session?.user?.name || "E")[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div
              className="absolute -bottom-1 -right-1 p-1 sm:p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md border-2 border-white dark:border-slate-900 transition-transform active:scale-95"
              title="Change Photo"
            >
              <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="text-sm sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">
                {session?.user?.name || "Employee Desk"}
              </h2>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {(session?.user as any)?.employeeId && String((session?.user as any)?.employeeId).length > 12
                  ? `EMP #${String((session?.user as any)?.employeeId).slice(0, 8)}`
                  : (session?.user as any)?.employeeId || "ACTIVE"}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              {session?.user?.email}
            </p>
            <div className="text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
              <span>●</span>
              <span>Engineering Workspace Desk</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPhotoModalOpen(true)}
          className="px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs active:scale-95 cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">{photoUrl ? "Change Photo" : "Add Profile Photo"}</span>
          <span className="sm:hidden text-[11px]">Photo</span>
        </button>
      </div>

      {/* Emergency Relative Contacts (2 Compulsory) Card */}
      <div className={`rounded-2xl sm:rounded-3xl border p-3 sm:p-5 shadow-xs space-y-2.5 sm:space-y-4 transition-all ${
        !myProfile?.relative1Phone || !myProfile?.relative2Phone
          ? "bg-gradient-to-r from-rose-50/90 via-amber-50/80 to-rose-50/90 dark:from-rose-950/40 dark:via-amber-950/30 dark:to-rose-950/40 border-rose-300 dark:border-rose-800 ring-1 sm:ring-2 ring-rose-400/40"
          : "bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 border-amber-200/90 dark:border-amber-900/50"
      }`}>
        <div className="flex items-center justify-between gap-2.5 border-b border-amber-200/60 dark:border-amber-900/40 pb-2 sm:pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-300/40 dark:border-amber-800/40">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[9px] sm:text-[10px] font-mono font-black tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/30">
                  EMERGENCY CONTACTS (2 REQUIRED)
                </span>
                {myProfile?.relative1Phone && myProfile?.relative2Phone ? (
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    ✓ 2 VERIFIED
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 animate-pulse">
                    <ShieldAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>ACTION REQUIRED</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5 hidden sm:block">
                Two verified emergency relative phone numbers linked to your company employee record.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRelativeModalOpen(true)}
            className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer"
          >
            <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="text-[11px] sm:text-xs">{myProfile?.relative1Phone && myProfile?.relative2Phone ? "Update" : "Add Relative Numbers"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {/* Relative 1 Card */}
          <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-amber-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5 shadow-2xs">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Relative 1: {myProfile?.relative1Relation || "Father"}
                </span>
                {myProfile?.relative1Name && (
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    {myProfile.relative1Name}
                  </span>
                )}
              </div>

              {myProfile?.relative1Phone ? (
                <a
                  href={`tel:${myProfile.relative1Phone}`}
                  className="font-mono font-bold text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 pt-0.5"
                  title="Click to Call Relative 1"
                >
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span className="truncate">{myProfile.relative1Phone}</span>
                </a>
              ) : (
                <div className="text-[11px] text-rose-500 font-mono italic pt-0.5 flex items-center gap-1">
                  <span>● Number not provided yet</span>
                </div>
              )}
            </div>

            {myProfile?.relative1Phone && (
              <a
                href={`tel:${myProfile.relative1Phone}`}
                className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition-colors shrink-0 border border-emerald-200 dark:border-emerald-800"
                title="Direct Call Relative 1"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
            )}
          </div>

          {/* Relative 2 Card */}
          <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-amber-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5 shadow-2xs">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Relative 2: {myProfile?.relative2Relation || "Mother"}
                </span>
                {myProfile?.relative2Name && (
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    {myProfile.relative2Name}
                  </span>
                )}
              </div>

              {myProfile?.relative2Phone ? (
                <a
                  href={`tel:${myProfile.relative2Phone}`}
                  className="font-mono font-bold text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 pt-0.5"
                  title="Click to Call Relative 2"
                >
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span className="truncate">{myProfile.relative2Phone}</span>
                </a>
              ) : (
                <div className="text-[11px] text-rose-500 font-mono italic pt-0.5 flex items-center gap-1">
                  <span>● Number not provided yet</span>
                </div>
              )}
            </div>

            {myProfile?.relative2Phone && (
              <a
                href={`tel:${myProfile.relative2Phone}`}
                className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition-colors shrink-0 border border-emerald-200 dark:border-emerald-800"
                title="Direct Call Relative 2"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Daily Work Target Reminder & Live Quota Progress */}
      {myTarget && myTarget.dailyTargetCount > 0 && (
        <div className="bg-gradient-to-r from-indigo-900/90 via-indigo-950/95 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xl border border-indigo-500/30 space-y-2.5 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[9px] sm:text-[10px] font-mono font-black tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    DAILY TARGET REMINDER
                  </span>
                  <span className="text-[11px] sm:text-xs text-indigo-200">
                    Goal: {myTarget.dailyTargetCount} {myTarget.dailyTargetUnit || "units"} / day
                  </span>
                </div>
                <h3 className="text-sm sm:text-lg font-black tracking-tight text-white mt-0.5">
                  {myTarget.today?.targetTitle || myTarget.dailyTargetTitle || "Daily Goal"}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => handleIncrementMyTarget(1)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1 {myTarget.today?.unit || "unit"}</span>
              </button>
              <button
                onClick={() => handleIncrementMyTarget(-1)}
                className="px-2.5 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs transition-all"
                title="Decrement"
              >
                -1
              </button>
            </div>
          </div>

          {/* Progress Bar & Metric */}
          <div className="space-y-1.5 sm:space-y-2 bg-white/5 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-200 font-medium text-[11px] sm:text-xs">
                Today's Completed Output
              </span>
              <span className="font-mono font-black text-amber-300 text-xs sm:text-sm">
                {myTarget.today?.achievedCount || 0} / {myTarget.dailyTargetCount} {myTarget.today?.unit} ({myTarget.today?.progressPercentage || 0}%)
              </span>
            </div>

            <div className="w-full bg-white/10 rounded-full h-2.5 sm:h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (myTarget.today?.progressPercentage || 0) >= 100
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : (myTarget.today?.progressPercentage || 0) >= 50
                    ? "bg-gradient-to-r from-amber-500 to-amber-300"
                    : "bg-gradient-to-r from-indigo-500 to-sky-400"
                }`}
                style={{ width: `${Math.min(100, myTarget.today?.progressPercentage || 0)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] sm:text-[11px] pt-0.5">
              <span className={`font-semibold line-clamp-1 sm:line-clamp-none ${(myTarget.today?.progressPercentage || 0) >= 100 ? "text-emerald-400" : "text-indigo-300"}`}>
                {(myTarget.today?.progressPercentage || 0) >= 100
                  ? "🎉 Daily target completed!"
                  : `🎯 ${myTarget.today?.remaining || 0} ${myTarget.today?.unit} remaining.`}
              </span>
              <span className="text-slate-400 font-mono text-[9px] sm:text-[10px] shrink-0">
                Midnight reset
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-0.5 sm:space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Projects</span>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100">{projects.length}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-0.5 sm:space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-500">In Progress</span>
          <div className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400">{inProgressCount}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-0.5 sm:space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-500">Completed Tasks</span>
          <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedCount}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-0.5 sm:space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-500">Completion</span>
          <div className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
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
          <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg">⭐</span>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-100 font-mono">
                  MOST IMPORTANT TASK
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-mono font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-600/70 border border-amber-300/40">
                Admin Priority Signal
              </span>
            </div>

            {mostImportantTask ? (
              <div className="space-y-1.5 sm:space-y-2">
                <div>
                  <h2 className="text-base sm:text-xl font-black tracking-tight">{mostImportantTask.title}</h2>
                  <p className="text-xs text-amber-100 mt-0.5">
                    Project: <strong className="text-white">{mostImportantTask.projectName}</strong> • Status:{" "}
                    <strong className="text-white font-mono">{mostImportantTask.status}</strong>
                  </p>
                </div>
                <div className="pt-0.5 sm:pt-1 flex items-center gap-2">
                  <Link
                    href={`/projects/${mostImportantTask.projectId}`}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 transition-colors shadow-xs inline-flex items-center gap-1.5"
                  >
                    <span>Open Task Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5 sm:space-y-1 py-0.5">
                <h2 className="text-sm sm:text-base font-bold text-amber-100">No most important task assigned.</h2>
                <p className="text-[11px] sm:text-xs text-amber-200/90">
                  The Admin has not currently designated a high-priority task for your queue.
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Section 2: Assigned Projects Workspace List */}
      <div className="space-y-2.5 sm:space-y-4">
        <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-1.5 sm:pb-2">
          My Assigned Projects ({projects.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
          {projects.map((prj) => {
            const prjTasks = (prj.tasks || []).filter((t: any) => t.status !== "ARCHIVED");
            const prjCompleted = prjTasks.filter((t: any) => t.status === "COMPLETED" || t.status === "DONE").length;
            const prjTotal = prjTasks.length;
            const prjProgress = prjTotal === 0 ? 0 : Math.round((prjCompleted / prjTotal) * 100);
            const activeTask = prjTasks.find((t: any) => t.status === "IN_PROGRESS") || prjTasks[0];

            return (
              <div
                key={prj.id}
                className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs space-y-2.5 sm:space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {prj.projectCode}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {prj.status}
                    </span>
                  </div>

                  <Link href={`/projects/${prj.id}`} className="hover:underline block">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">{prj.name}</h3>
                  </Link>

                  <div className="text-[11px] sm:text-xs text-slate-500">Client: {prj.clientName}</div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 sm:space-y-1.5 pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400 text-[11px] sm:text-xs">
                      {prjCompleted} / {prjTotal} Tasks Completed
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px] sm:text-xs">{prjProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${prjProgress}%` }}
                    />
                  </div>
                  {activeTask && (
                    <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate pt-0.5">
                      Working: <strong className="text-slate-800 dark:text-slate-200">{activeTask.title}</strong>
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
                    className="py-1.5 sm:py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-amber-200 dark:border-amber-800 shadow-2xs"
                    title="Post a daily progress update visible to Client & Admin"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Daily Update</span>
                  </button>

                  <Link
                    href={`/projects/${prj.id}`}
                    className="py-1.5 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700"
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
      <div className="space-y-2.5 sm:space-y-3 pt-2.5 sm:pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            My Task Stack Checklist ({activeTasks.length})
          </h2>
          <button
            onClick={() => setIsTaskSheetOpen(true)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            + Add Task
          </button>
        </div>

        <div className="space-y-2 sm:space-y-2.5">
          {activeTasks.length === 0 ? (
            <div className="p-6 sm:p-8 text-center bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
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
                  className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3"
                >
                  <div className="space-y-0.5 sm:space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono">
                        {task.projectName}
                      </span>
                      <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded font-mono ${
                        task.priority === "URGENT"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                          : task.priority === "HIGH"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                          : task.priority === "MEDIUM"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                          : "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                      }`}>
                        {task.priority === "URGENT"
                          ? "Q1: Urgent"
                          : task.priority === "HIGH"
                          ? "Q2: High"
                          : task.priority === "MEDIUM"
                          ? "Q3: Medium"
                          : "Q4: Low"}
                      </span>
                      {isPlanning && (
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono">
                          PLANNING
                        </span>
                      )}
                      {isInProgress && (
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono">
                          CURRENT
                        </span>
                      )}
                      {isRevision && (
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono">
                          REVISION
                        </span>
                      )}
                      {isDone && (
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <h3 className={`text-xs sm:text-sm font-bold truncate ${isDone ? "line-through text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
                      {task.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-end sm:self-auto">
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
                      className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer outline-none ${
                        isDone
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 border-emerald-200 dark:border-emerald-800"
                          : isRevision
                          ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 border-purple-200 dark:border-purple-800"
                          : isInProgress
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 border-amber-200 dark:border-amber-800"
                          : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      <option value="PLANNING">📋 Plan</option>
                      <option value="CURRENT">⚡ Current</option>
                      <option value="REVISION">🔄 Revision</option>
                      <option value="COMPLETED">✅ Done</option>
                    </select>

                    {!isDone ? (
                      <button
                        type="button"
                        onClick={() => handleSetTaskStatus(task.projectId, task.id, "COMPLETED")}
                        className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                        title="Mark task complete"
                      >
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>Complete</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                        <span>Done</span>
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
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-6 shadow-xs space-y-3 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100 dark:border-slate-800 pb-2.5 sm:pb-4">
          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Google Drive Files & Media Storage</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Upload videos, screenshots, documents, and project deliverables directly into Google Drive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                if (projects.length > 0 && !driveTargetProjectId) {
                  setDriveTargetProjectId(projects[0].id);
                }
                setIsDriveUploadModalOpen(true);
              }}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Upload to Drive</span>
            </button>
            <Link
              href="/docs"
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
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

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1 flex items-center justify-between">
              <span>Task Due Date / Deadline <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-rose-500 font-bold">Compulsory</span>
            </label>
            <input
              type="date"
              required
              value={newTaskDeadline}
              onChange={(e) => setNewTaskDeadline(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-semibold text-xs"
            />
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

      {/* Emergency Relatives Edit Bottom Sheet */}
      <BottomSheet
        isOpen={isRelativeModalOpen}
        onClose={() => setIsRelativeModalOpen(false)}
        title="Emergency Relative Contacts (2 Compulsory)"
        subtitle="Provide 2 emergency relative phone numbers linked to your employee record."
      >
        <form onSubmit={handleSaveRelatives} className="space-y-4 text-xs">
          {/* Relative 1 Section */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-3">
            <div className="font-bold text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Relative 1 Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Relationship <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rel1Relation}
                  onChange={(e) => setRel1Relation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium outline-none focus:border-amber-500"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Relative">Other Relative</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={rel1Name}
                  onChange={(e) => setRel1Name(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                Relative 1 Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={rel1Phone}
                  onChange={(e) => setRel1Phone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold outline-none focus:border-amber-500"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Relative 2 Section */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-3">
            <div className="font-bold text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Relative 2 Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Relationship <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rel2Relation}
                  onChange={(e) => setRel2Relation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium outline-none focus:border-amber-500"
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Relative">Other Relative</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={rel2Name}
                  onChange={(e) => setRel2Name(e.target.value)}
                  placeholder="e.g. Sunita Kumar"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                Relative 2 Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={rel2Phone}
                  onChange={(e) => setRel2Phone(e.target.value)}
                  placeholder="+91 98765 12340"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold outline-none focus:border-amber-500"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {(!myProfile?.relative1Phone || !myProfile?.relative2Phone) ? (
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>2 Numbers are compulsory for company records</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsRelativeModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={savingRelatives || !rel1Phone.trim() || !rel2Phone.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {savingRelatives ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Relative Numbers</span>
                </>
              )}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
