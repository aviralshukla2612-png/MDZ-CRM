"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  ArrowLeft,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
  IndianRupee,
  GitPullRequest,
  Eye,
  ShieldCheck,
  ArrowRight,
  Clock,
  User,
  Plus,
  History,
  Trash2,
  UserPlus,
  Send,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DailyProgressEntryModal from "@/components/projects/DailyProgressEntryModal";

export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Daily Progress Update Modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Member Assignment & Removal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedRoleInProject, setSelectedRoleInProject] = useState("DEVELOPER");
  const [selectedCompensation, setSelectedCompensation] = useState("");
  const [assigningMember, setAssigningMember] = useState(false);

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [removingMember, setRemovingMember] = useState(false);

  // Change Requests tab state
  const [changeReqsData, setChangeReqsData] = useState<any>({ changeRequests: [], quota: { includedCount: 3, usedCount: 0, remainingCount: 3 } });
  const [loadingChangeReqs, setLoadingChangeReqs] = useState<boolean>(false);

  React.useEffect(() => {
    fetchProject();
    fetchChangeRequests();
  }, []);

  const openAssignModal = async () => {
    setIsAssignModalOpen(true);
    try {
      const res = await fetch(`/mdz-crm/api/projects/${params.id}/members`);
      const json = await res.json();
      if (json.success && json.availableEmployees) {
        setAvailableEmployees(json.availableEmployees);
        if (json.availableEmployees.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(json.availableEmployees[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load employees for assignment:", e);
    }
  };

  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      showToast("Please select a team member", "error");
      return;
    }
    try {
      setAssigningMember(true);
      const res = await fetch(`/mdz-crm/api/projects/${params.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          roleInProject: selectedRoleInProject,
          compensationAmount: selectedCompensation ? Number(selectedCompensation) : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Developer assigned successfully!", "success");
        setIsAssignModalOpen(false);
        setSelectedCompensation("");
        fetchProject();
      } else {
        showToast(json.error || "Failed to assign developer", "error");
      }
    } catch (e) {
      showToast("Network error assigning developer", "error");
    } finally {
      setAssigningMember(false);
    }
  };

  const openRemoveModal = (member: any) => {
    setMemberToRemove(member);
    setRemovalReason("");
    setIsRemoveModalOpen(true);
  };

  const handleRemoveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberToRemove) return;
    try {
      setRemovingMember(true);
      const res = await fetch(
        `/mdz-crm/api/projects/${params.id}/members?membershipId=${memberToRemove.id}&reason=${encodeURIComponent(
          removalReason || "Reassigned by Admin"
        )}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Team member removed from project", "success");
        setIsRemoveModalOpen(false);
        setMemberToRemove(null);
        fetchProject();
      } else {
        showToast(json.error || "Failed to remove member", "error");
      }
    } catch (e) {
      showToast("Network error removing member", "error");
    } finally {
      setRemovingMember(false);
    }
  };

  const fetchChangeRequests = async () => {
    try {
      setLoadingChangeReqs(true);
      const res = await fetch(`/mdz-crm/api/client/projects/${params.id}/change-requests`);
      const json = await res.json();
      if (json.success) {
        setChangeReqsData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChangeReqs(false);
    }
  };

  const handleApproveBudget = async (requestId: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/admin/projects/${params.id}/change-requests/${requestId}/approve-budget`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Budget increase approved!", "success");
        fetchProject();
        fetchChangeRequests();
      } else {
        showToast(json.error || "Failed to approve budget", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/mdz-crm/api/projects/${params.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        const p = json.data;
        setProject({
          ...p,
          projectCode: p.projectNumber,
          clientName: p.client?.companyName || "Unknown Client",
          status: p.status,
          health: p.priority === "HIGH" ? "AT_RISK" : "ON_TRACK",
          progress: p.progressPercentage || 0,
          contractValue: p.contractValue || 0,
          paidValue: p.paymentMilestones?.reduce((s: number, m: any) => s + m.paidAmount, 0) || 0,
          overdueValue: p.paymentMilestones?.filter((m: any) => m.status === 'OVERDUE').reduce((s: number, m: any) => s + m.amount, 0) || 0,
          deadline: p.targetDeadline ? new Date(p.targetDeadline).toLocaleDateString() : "No Deadline",
          tmName: p.memberships?.find((m: any) => m.roleInProject === "TM" && m.isActive)?.employee?.user?.name || "Unassigned",
          teamMembers: p.memberships?.filter((m: any) => m.isActive).map((m: any) => ({
            id: m.id,
            employeeId: m.employeeId,
            name: m.employee?.user?.name || "Unknown",
            email: m.employee?.user?.email,
            phone: m.employee?.phone || "+91 98765 43210",
            role: m.roleInProject,
            active: m.isActive,
            compensationAmount: m.compensationAmount,
            assignedDate: m.assignedAt ? new Date(m.assignedAt).toLocaleDateString() : "Unknown",
          })) || [],
          removalHistory: p.memberships?.filter((m: any) => !m.isActive).map((m: any) => ({
            id: m.id,
            name: m.employee?.user?.name || "Unknown",
            role: m.roleInProject,
            removedDate: m.removedAt ? new Date(m.removedAt).toLocaleDateString() : "Unknown",
            reason: m.removalReason || "Reassigned"
          })) || [],
          tasks: p.tasks || [],
          livingDocs: p.documents || [],
          scopeItems: p.scopeText ? p.scopeText.split("\n") : [],
          changeRequests: p.changeRequests || [],
          clientUpdates: p.clientUpdates || [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<
    "overview" | "workflow" | "tasks" | "updates" | "team" | "docs" | "notes" | "calls" | "changes" | "payments"
  >("overview");

  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [submittingTask, setSubmittingTask] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      setSubmittingTask(true);
      const res = await fetch(`/mdz-crm/api/projects/${params.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          priority: taskPriority,
          assignedToId: taskAssigneeId || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Task created successfully`, "success");
        setTaskTitle("");
        setIsTaskSheetOpen(false);
        fetchProject();
      } else {
        showToast(json.error || "Failed to create task", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error creating task", "error");
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, targetStatus: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/projects/${params.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Task status updated to ${targetStatus}`, "success");
        fetchProject();
      } else {
        showToast(json.error || "Failed to update task", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating task status", "error");
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/projects/${params.id}/tasks/${taskId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Task archived successfully", "success");
        fetchProject();
      } else {
        showToast(json.error || "Failed to archive task", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error archiving task", "error");
    }
  };

  const handleSetMostImportant = async (taskId: string, isMostImportant: boolean) => {
    try {
      const res = await fetch(`/mdz-crm/api/projects/${params.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMostImportant }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          isMostImportant
            ? "⭐ Task marked as Most Important"
            : "Priority designation removed",
          "success"
        );
        fetchProject();
      } else {
        showToast(json.error || "Failed to set priority", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error setting task priority", "error");
    }
  };

  const handleUpdateProjectPriority = async (newPriority: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Project urgency updated to ${newPriority}`, "success");
        fetchProject();
      } else {
        showToast(json.error || "Failed to update project urgency", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating project urgency", "error");
    }
  };

  const handleUpdateProjectStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Project status updated to ${newStatus}`, "success");
        fetchProject();
      } else {
        showToast(json.error || "Failed to update project status", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating project status", "error");
    }
  };

  const executeDeleteProject = async () => {
    setIsDeleteModalOpen(false);
    
    try {
      setIsDeleting(true);
      const res = await fetch(`/mdz-crm/api/projects/${params.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("Project deleted successfully", "success");
        router.push("/projects");
      } else {
        showToast(json.error || "Failed to delete project", "error");
        setIsDeleting(false);
      }
    } catch (e) {
      console.error(e);
      showToast("An unexpected error occurred", "error");
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 animate-pulse">Loading Workspace...</div>;
  if (!project) return <div className="p-12 text-center text-rose-400">Project Not Found or Access Denied</div>;

  const tabs = [
    { id: "overview", label: "Overview & Scope" },
    { id: "workflow", label: "Workflow Playbook" },
    { id: "tasks", label: `Task Stack (${project.tasks?.length || 0})` },
    { id: "updates", label: `Daily Updates (${project.clientUpdates?.length || 0})` },
    { id: "team", label: `Team & Removal History (${project.teamMembers?.length || 0})` },
    { id: "docs", label: `Living Docs (${project.livingDocs?.length || 0})` },
    { id: "notes", label: "Work Notes" },
    { id: "calls", label: "Client Calls" },
    { id: "changes", label: `Change Requests (${project.changeRequests?.length || 0})` },
    { id: "payments", label: "Payment Milestones" },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects Workspace</span>
        </Link>
        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {project.projectCode}
        </span>
      </div>

      {/* Project Hero Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Indicator */}
              {(session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SALES" ? (
                <select
                  value={project.status || "IN_PROGRESS"}
                  onChange={(e) => handleUpdateProjectStatus(e.target.value)}
                  className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 outline-none cursor-pointer"
                >
                  <option value="PLANNING">PLANNING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {project.status || "IN_PROGRESS"}
                </span>
              )}

              {/* Urgency Priority Indicator */}
              {(session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SALES" ? (
                <select
                  value={project.priority || "HIGH"}
                  onChange={(e) => handleUpdateProjectPriority(e.target.value)}
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full outline-none cursor-pointer border ${
                    project.priority === "URGENT"
                      ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                      : project.priority === "HIGH"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : project.priority === "MEDIUM"
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <option value="URGENT">Q1: Fire Fighting (Urgent & Important)</option>
                  <option value="HIGH">Q2: Productive Time (Important & Not Urgent)</option>
                  <option value="MEDIUM">Q3: Distraction (Urgent & Not Important)</option>
                  <option value="LOW">Q4: Down Time (Not Urgent & Not Important)</option>
                </select>
              ) : (
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                    project.priority === "URGENT"
                      ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                      : project.priority === "HIGH"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : project.priority === "MEDIUM"
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {project.priority === "URGENT"
                    ? "Q1: Fire Fighting (Urgent & Important)"
                    : project.priority === "HIGH"
                    ? "Q2: Productive Time (Important & Not Urgent)"
                    : project.priority === "MEDIUM"
                    ? "Q3: Distraction (Urgent & Not Important)"
                    : "Q4: Down Time (Not Urgent & Not Important)"}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {project.name}
            </h1>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
              <span>🏢 <strong className="text-indigo-600 dark:text-indigo-400">{project.clientName}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span>TM: <strong className="text-slate-800 dark:text-slate-200">{project.tmName}</strong></span>
                {((session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SALES") && (
                  <button
                    onClick={openAssignModal}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors"
                    title="Assign Developer or Tech Lead"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>{project.tmName === "Unassigned" ? "Assign Developer / TM" : "Manage"}</span>
                  </button>
                )}
              </span>
              <span>•</span>
              <span>Deadline: <strong className="text-slate-800 dark:text-slate-200">{project.deadline}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {((session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SALES") && (
              <button
                onClick={openAssignModal}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs touch-target"
                title="Assign Developer to Project"
              >
                <UserPlus className="w-4 h-4" />
                <span>Assign Developer</span>
              </button>
            )}
            {(session?.user as any)?.role === "OWNER" && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "Deleting..." : "Delete Project"}</span>
              </button>
            )}
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs touch-target"
              title="Post daily progress update to Client & Admin"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post Daily Update</span>
            </button>
            <Link
              href="/portal/demo-token-abc"
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Client Portal Preview</span>
            </Link>
          </div>
        </div>

        {/* Progress Engine */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-400">WEIGHTED PLAYBOOK PROGRESS ∑(Stage × Weight)</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{project.progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === t.id
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Project Scope & Core Requirements</h3>
            <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {project.scopeItems?.map((item: any, idx: number) => (
                <li key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  {item}
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-4">
            {(session?.user as any)?.role !== "EMPLOYEE" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 text-xs">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Financial Contract Summary</h3>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Total Value:</span>
                  <strong className="font-mono text-slate-900 dark:text-slate-100">₹{(project.contractValue || 0).toLocaleString("en-IN")}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">
                  <span>Total Paid:</span>
                  <strong className="font-mono">₹{(project.paidValue || 0).toLocaleString("en-IN")}</strong>
                </div>
                <div className="flex justify-between py-1 text-rose-600 dark:text-rose-400 font-bold">
                  <span>Total Overdue:</span>
                  <strong className="font-mono">₹{(project.overdueValue || 0).toLocaleString("en-IN")}</strong>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Active Team Members</h3>
                {((session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SALES") && (
                  <button
                    onClick={openAssignModal}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign
                  </button>
                )}
              </div>
              {project.teamMembers?.length === 0 ? (
                <div className="py-4 text-center text-slate-400 space-y-2">
                  <p>No developers assigned yet.</p>
                  {((session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SALES") && (
                    <button
                      onClick={openAssignModal}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800"
                    >
                      + Assign Developer
                    </button>
                  )}
                </div>
              ) : (
                project.teamMembers?.slice(0, 4).map((m: any) => (
                  <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <Link href={`/employees/${m.employeeId || m.id}`} className="font-bold text-slate-900 dark:text-slate-100 hover:underline block">
                        {m.name}
                      </Link>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">{m.role}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono">
                        Active
                      </span>
                      {((session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SALES") && (
                        <button
                          onClick={() => openRemoveModal(m)}
                          className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                          title="Remove from project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Workflow Playbook */}
      {activeTab === "workflow" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Workflow Playbook</h3>
          <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400 text-center py-8">
            No playbook stages defined yet.
          </div>
        </div>
      )}

      {/* Tab 3: Tasks */}
      {activeTab === "tasks" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Project Task Stack</h3>
              <p className="text-xs text-slate-500">Tasks directly compute the single-source-of-truth project progress.</p>
            </div>
            <button
              onClick={() => setIsTaskSheetOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs touch-target"
            >
              + Create Task
            </button>
          </div>
          <div className="space-y-3 text-xs">
            {project.tasks?.filter((t: any) => t.status !== "ARCHIVED").length === 0 ? (
              <div className="p-8 text-center text-slate-400">No active tasks. Click "+ Create Task" to add tasks.</div>
            ) : (
              project.tasks
                ?.filter((t: any) => t.status !== "ARCHIVED")
                .map((tsk: any) => {
                  const isDone = tsk.status === "COMPLETED" || tsk.status === "DONE";
                  const isInProgress = tsk.status === "IN_PROGRESS";

                  return (
                    <div
                      key={tsk.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        tsk.isMostImportant
                          ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/80 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {tsk.isMostImportant && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
                              ⭐ MOST IMPORTANT
                            </span>
                          )}
                          <span className="font-mono font-bold text-slate-400">{tsk.id.slice(0, 8)}</span>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                            Assignee: {tsk.assignedTo?.name || tsk.assignee || "Unassigned"}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {tsk.priority}
                          </span>
                        </div>
                        <div className={`font-bold text-sm ${isDone ? "line-through text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
                          {tsk.title}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* OWNER / ADMIN Priority Toggle Control */}
                        {((session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SALES") && !isDone && (
                          <button
                            onClick={() => handleSetMostImportant(tsk.id, !tsk.isMostImportant)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-colors flex items-center gap-1 ${
                              tsk.isMostImportant
                                ? "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300"
                                : "bg-white dark:bg-slate-900 hover:bg-amber-50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            }`}
                            title={tsk.isMostImportant ? "Remove Most Important Priority" : "Mark as Most Important Priority for Employee Queue"}
                          >
                            <span>⭐ {tsk.isMostImportant ? "Remove Priority" : "Mark Most Important"}</span>
                          </button>
                        )}

                        <select
                          value={tsk.status}
                          onChange={(e) => handleToggleTaskStatus(tsk.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer outline-hidden ${
                            isDone
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                              : isInProgress
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 border-amber-200 dark:border-amber-800"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <option value="TODO">☐ TODO</option>
                          <option value="IN_PROGRESS">◐ IN PROGRESS</option>
                          <option value="COMPLETED">✓ COMPLETED</option>
                        </select>

                        <button
                          onClick={() => handleArchiveTask(tsk.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors"
                          title="Archive Task"
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Daily Updates (Visible to Client & Admin) */}
      {activeTab === "updates" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-500" />
                <span>Daily Progress Updates</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily progress logs visible to the Client in their portal and Admin in real-time.
              </p>
            </div>
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition-all touch-target"
            >
              <Plus className="w-4 h-4" />
              <span>+ Post Daily Update</span>
            </button>
          </div>

          {(!project.clientUpdates || project.clientUpdates.length === 0) ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <p className="text-xs">No daily progress updates posted yet.</p>
              <button
                onClick={() => setIsUpdateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <span>+ Post First Daily Update</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {project.clientUpdates.map((u: any) => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {u.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                        Client & Admin Visible
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(u.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {u.content}
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
                    <span>Posted by:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {u.author?.name || "Team Member"}
                    </span>
                    {u.author?.designation && (
                      <span className="text-slate-400 font-normal">({u.author.designation})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Team & Removal History (Requirement #12) */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Active Members */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Active Assigned Team Members</h3>
                <p className="text-xs text-slate-500">Developers and engineers actively assigned to this project workspace.</p>
              </div>
              {((session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SALES") && (
                <button
                  onClick={openAssignModal}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 touch-target shrink-0 self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Assign Developer</span>
                </button>
              )}
            </div>

            {project.teamMembers?.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Developers Assigned Yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Assign a Tech Lead (TM) or developers to this project so they can receive tasks, post updates, and appear in the client portal.
                </p>
                {((session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SALES") && (
                  <button
                    onClick={openAssignModal}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Assign Developer Now</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {project.teamMembers?.map((m: any) => (
                  <div key={m.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/employees/${m.employeeId || m.id}`} className="font-bold text-slate-900 dark:text-slate-100 hover:underline block text-sm">
                          {m.name}
                        </Link>
                        <div className="text-indigo-600 dark:text-indigo-400 font-semibold">{m.role}</div>
                      </div>
                      {((session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SALES") && (
                        <button
                          onClick={() => openRemoveModal(m)}
                          className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove from project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {m.email && <div className="text-[11px] text-slate-500 truncate">📧 {m.email}</div>}
                    {m.phone && <div className="text-[11px] text-slate-500">📞 {m.phone}</div>}
                    <div className="text-[10px] text-slate-400 font-mono">Assigned: {m.assignedDate}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Immutable Removal History Log (Requirement #12) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Immutable Team Removal History</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Historical work performed by past team members remains permanently preserved in the project execution record even after reassignment.
            </p>
            <div className="space-y-3 text-xs">
              {project.removalHistory?.map((rem: any) => (
                <div key={rem.id} className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span>{rem.name} ({rem.role})</span>
                    <span className="text-[10px] font-mono text-slate-500">Removed: {rem.removedDate}</span>
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300">Reason: {rem.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Living Docs */}
      {activeTab === "docs" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Living Technical Documentation (v2)</h3>
          <div className="space-y-3 text-xs">
            {project.livingDocs?.map((doc: any) => (
              <div key={doc.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span className="text-sm">{doc.title}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">{doc.version}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-mono p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  {doc.content}
                </p>
                <div className="text-[10px] text-slate-400 font-mono">Author: {doc.author} • Updated {doc.lastUpdated}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Change Requests & Budget Control */}
      {activeTab === "changes" && (
        <div className="space-y-5">
          {/* Quota Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800 shadow-xl">
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">CLIENT CHANGE REQUEST QUOTA</div>
              <div className="text-sm font-semibold text-slate-300">
                3 Included Requests per Project Scope · Additional Requests Require Budget Increase
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono font-bold">
              <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
                Included: <strong className="text-white">3</strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
                Used: <strong className="text-emerald-400">{changeReqsData.quota?.usedCount || 0}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
                Remaining: <strong className="text-indigo-400">{changeReqsData.quota?.remainingCount || 0}</strong>
              </div>
            </div>
          </div>

          {/* Change Requests List */}
          {changeReqsData.changeRequests?.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No change requests have been submitted for this project yet.
            </div>
          ) : (
            <div className="space-y-4">
              {changeReqsData.changeRequests?.map((cr: any) => (
                <div
                  key={cr.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {cr.requestNumber || `Request #${cr.requestSeqInt}`}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{cr.originalRequirement}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {cr.status === "PENDING_BUDGET_APPROVAL" ? (
                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                          ⚠️ PENDING BUDGET APPROVAL
                        </span>
                      ) : cr.status === "APPROVED" ? (
                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          ✓ APPROVED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {cr.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">{cr.requestedChange}</p>

                  {/* Multi-item breakdown */}
                  {cr.items && cr.items.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        REQUEST ITEMS ({cr.items.length} CHANGES IN 1 REQUEST)
                      </div>
                      <div className="space-y-1.5">
                        {cr.items.map((item: any, idx: number) => (
                          <div key={item.id || idx} className="flex items-start gap-2 font-medium text-slate-800 dark:text-slate-200">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                            <span>{item.description || item.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Budget Surcharge & Approval Action Banner */}
                  {cr.status === "PENDING_BUDGET_APPROVAL" && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-amber-900 dark:text-amber-300">
                          Additional Request Surcharge Required: ₹{(cr.costImpactAmount || 5000).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[11px] text-amber-700 dark:text-amber-400">
                          Request exceeds 3 included requests. Approving will update project contract value by ₹{(cr.costImpactAmount || 5000).toLocaleString("en-IN")}.
                        </div>
                      </div>

                      <button
                        onClick={() => handleApproveBudget(cr.id)}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs shadow-xs transition-all shrink-0"
                      >
                        Approve & Add Budget
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Remaining Tabs fallback */}
      {["notes", "calls", "payments"].includes(activeTab) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs text-xs text-slate-600 dark:text-slate-300">
          Viewing <strong>{activeTab.toUpperCase()}</strong> workspace record for {project.name}.
        </div>
      )}

      {/* Create Task Bottom Sheet */}
      <BottomSheet
        isOpen={isTaskSheetOpen}
        onClose={() => setIsTaskSheetOpen(false)}
        title="Create Project Task"
        subtitle="Assigns task to team member stack."
      >
        <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Task Title</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Implement webhook signature retry logic"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Assignee</label>
            <select
              value={taskAssigneeId}
              onChange={(e) => setTaskAssigneeId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="">-- Unassigned --</option>
              {project.memberships?.map((m: any) => (
                <option key={m.id} value={m.employee?.user?.id}>
                  {m.employee?.user?.name || "Member"} ({m.roleInProject})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs touch-target mt-2"
          >
            Assign Task
          </button>
        </form>
      </BottomSheet>

      {/* Assign Developer Modal */}
      <BottomSheet
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Developer / Member to Project"
        subtitle="Assign an engineer, tech lead, or designer to this project workspace."
      >
        <form onSubmit={handleAssignMember} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Select Team Member / Developer *
            </label>
            {availableEmployees.length === 0 ? (
              <div className="p-3 text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl">
                Loading team members...
              </div>
            ) : (
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
                required
              >
                <option value="">-- Choose Employee / Developer --</option>
                {availableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.designation || emp.role} ({emp.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Project Role *
            </label>
            <select
              value={selectedRoleInProject}
              onChange={(e) => setSelectedRoleInProject(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
            >
              <option value="TM">TM (Tech Lead / Project Lead)</option>
              <option value="DEVELOPER">DEVELOPER (Fullstack Developer)</option>
              <option value="FRONTEND">FRONTEND DEVELOPER</option>
              <option value="BACKEND">BACKEND DEVELOPER</option>
              <option value="UI_UX">UI / UX DESIGNER</option>
              <option value="QA">QA / TEST ENGINEER</option>
              <option value="MEMBER">TEAM MEMBER</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Selecting <strong>TM</strong> marks them as the Tech Lead shown in client & admin headers.
            </p>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Project Compensation (₹ INR, Optional)
            </label>
            <input
              type="number"
              value={selectedCompensation}
              onChange={(e) => setSelectedCompensation(e.target.value)}
              placeholder="e.g. 25000"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={assigningMember}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs touch-target mt-2 flex items-center justify-center gap-2"
          >
            {assigningMember ? "Assigning..." : "Confirm & Assign Developer"}
          </button>
        </form>
      </BottomSheet>

      {/* Remove Member Modal */}
      <BottomSheet
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        title={`Remove ${memberToRemove?.name || "Member"} from Project`}
        subtitle="Historical contributions will be preserved in removal history."
      >
        <form onSubmit={handleRemoveMember} className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Removing this developer will preserve their completed work and log an entry into the <strong>Immutable Team Removal History</strong>.
          </p>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Reason for Removal / Reassignment *
            </label>
            <input
              type="text"
              value={removalReason}
              onChange={(e) => setRemovalReason(e.target.value)}
              placeholder="e.g. Project phase completed, shifted to another client project"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={removingMember}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs touch-target mt-2"
          >
            {removingMember ? "Removing..." : "Confirm Removal"}
          </button>
        </form>
      </BottomSheet>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDeleteProject}
        title="Delete Project Workspace"
        message="Are you completely sure you want to permanently delete this project? This action will destroy all related tasks, documents, and payment histories. This cannot be undone."
        confirmText="Yes, delete project"
        isDestructive={true}
      />

      {/* Daily Progress Update Modal (Posts to Client & Admin) */}
      <DailyProgressEntryModal
        projectId={params.id}
        projectName={project.name}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={() => {
          showToast("✓ Daily update posted to Client & Admin successfully!", "success");
          fetchProject();
        }}
      />
    </div>
  );
}
