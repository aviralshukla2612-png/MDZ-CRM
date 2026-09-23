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
  Calendar,
  ExternalLink,
  Edit3,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DailyProgressEntryModal from "@/components/projects/DailyProgressEntryModal";
import { EditProjectModal } from "@/components/projects/EditProjectModal";
import { EditTaskModal } from "@/components/projects/EditTaskModal";
import { MediaUploader } from "@/components/ui/MediaUploader";
import { MediaGallery } from "@/components/ui/MediaGallery";
import { ProjectChatTab } from "@/components/chat/ProjectChatTab";


export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const userRole = ((session?.user as any)?.role || "").toUpperCase();
  const isAdminOrSubAdmin = ["OWNER", "ADMIN", "SUB_ADMIN"].includes(userRole);
  const router = useRouter();
  const { showToast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Daily Progress Update Modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Member Assignment & Removal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const DEFAULT_ROLES = [
    "TM",
    "Graphic Designer",
    "Video editor",
    "sales person",
    "accounting",
    "Web devloper",
  ];

  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [availableRoles, setAvailableRoles] = useState<string[]>(DEFAULT_ROLES);
  const [selectedRoleInProject, setSelectedRoleInProject] = useState("TM");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [selectedCompensation, setSelectedCompensation] = useState("");
  const [assigningMember, setAssigningMember] = useState(false);

  // Deadline modal state
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [deadlineInputVal, setDeadlineInputVal] = useState("");
  const [updatingDeadline, setUpdatingDeadline] = useState(false);

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [removingMember, setRemovingMember] = useState(false);

  // Change Requests tab state
  const [changeReqsData, setChangeReqsData] = useState<any>({ changeRequests: [], quota: { includedCount: 3, usedCount: 0, remainingCount: 3 } });
  const [loadingChangeReqs, setLoadingChangeReqs] = useState<boolean>(false);

  // Staging / Live URLs state
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [stagingUrlInput, setStagingUrlInput] = useState("");
  const [liveUrlInput, setLiveUrlInput] = useState("");
  const [designUrlInput, setDesignUrlInput] = useState("");
  const [updatingUrls, setUpdatingUrls] = useState(false);

  const openUrlModal = () => {
    setStagingUrlInput(project?.stagingUrl || "");
    setLiveUrlInput(project?.liveUrl || "");
    setDesignUrlInput(project?.designUrl || "");
    setIsUrlModalOpen(true);
  };

  const handleSaveUrls = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingUrls(true);
      const res = await fetch(`/mdz-crm/api/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stagingUrl: stagingUrlInput.trim() || null,
          liveUrl: liveUrlInput.trim() || null,
          designUrl: designUrlInput.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Project preview & live URLs updated!", "success");
        setIsUrlModalOpen(false);
        fetchProject();
      } else {
        showToast(json.error || "Failed to update URLs", "error");
      }
    } catch (e) {
      showToast("Network error updating URLs", "error");
    } finally {
      setUpdatingUrls(false);
    }
  };

  React.useEffect(() => {
    fetchProject();
    fetchChangeRequests();
  }, []);

  const openAssignModal = async () => {
    setIsAssignModalOpen(true);
    setIsCustomRole(false);
    setCustomRoleInput("");
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

    try {
      const rolesRes = await fetch("/mdz-crm/api/project-roles");
      const rolesJson = await rolesRes.json();
      if (rolesJson.success && Array.isArray(rolesJson.roles)) {
        setAvailableRoles(rolesJson.roles);
      }
    } catch (e) {
      console.error("Failed to load project roles:", e);
    }
  };

  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      showToast("Please select a team member", "error");
      return;
    }

    const finalRole = isCustomRole ? customRoleInput.trim() : selectedRoleInProject;
    if (!finalRole) {
      showToast("Please enter custom role name", "error");
      return;
    }

    try {
      setAssigningMember(true);

      // If a custom role was entered, persist it to /api/project-roles
      if (isCustomRole && customRoleInput.trim()) {
        try {
          await fetch("/mdz-crm/api/project-roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: customRoleInput.trim() }),
          });
          if (!availableRoles.includes(customRoleInput.trim())) {
            setAvailableRoles((prev) => [...prev, customRoleInput.trim()]);
          }
        } catch (err) {
          console.error("Error saving custom role:", err);
        }
      }

      const res = await fetch(`/mdz-crm/api/projects/${params.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          roleInProject: finalRole,
          compensationAmount: selectedCompensation ? Number(selectedCompensation) : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Developer assigned successfully!", "success");
        setIsAssignModalOpen(false);
        setIsCustomRole(false);
        setCustomRoleInput("");
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

  const handleUpdateDeadline = async (dateVal: string | null) => {
    try {
      setUpdatingDeadline(true);
      const res = await fetch(`/mdz-crm/api/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: dateVal }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(dateVal ? `✓ Deadline set to ${new Date(dateVal).toLocaleDateString()}` : "✓ Deadline cleared", "success");
        setIsDeadlineModalOpen(false);
        fetchProject();
      } else {
        showToast(json.error || "Failed to update deadline", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating project deadline", "error");
    } finally {
      setUpdatingDeadline(false);
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
          targetDeadline: p.targetDeadline || null,
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
    "overview" | "workflow" | "tasks" | "chat" | "updates" | "team" | "docs" | "notes" | "calls" | "changes" | "payments" | "media"
  >("overview");

  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskStatus, setTaskStatus] = useState("PLANNING");
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
          status: taskStatus,
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

  const isEmployee = userRole === "EMPLOYEE";
  const isAdminOrOwner = isAdminOrSubAdmin || userRole === "SALES";
  const currentEmpId =
    (session?.user as any)?.employeeId ||
    project.memberships?.find(
      (m: any) =>
        m.employee?.userId === (session?.user as any)?.id ||
        m.employee?.user?.email === session?.user?.email
    )?.employee?.id;
  const currentEmpName = session?.user?.name;

  const visibleTasks = (project.tasks || []).filter((tsk: any) => {
    if (tsk.status === "ARCHIVED") return false;
    if (!isEmployee) return true;
    return (
      (currentEmpId && (tsk.assignedToId === currentEmpId || tsk.assignedTo?.id === currentEmpId)) ||
      (currentEmpName && (tsk.assignee === currentEmpName || tsk.assignedTo?.name === currentEmpName))
    );
  });

  const allTabs = [
    { id: "overview", label: "Overview & Scope" },
    { id: "workflow", label: "Workflow Playbook" },
    { id: "tasks", label: isEmployee ? `My Tasks (${visibleTasks.length})` : `Task Stack (${project.tasks?.length || 0})` },
    { id: "chat", label: "Team Chat 💬" },
    { id: "updates", label: `Daily Updates (${project.clientUpdates?.length || 0})` },
    { id: "team", label: isEmployee ? `Team Members (${project.teamMembers?.length || 0})` : `Team & Removal History (${project.teamMembers?.length || 0})` },
    { id: "docs", label: `Living Docs (${project.livingDocs?.length || 0})` },
    { id: "notes", label: "Work Notes" },
    { id: "calls", label: "Client Calls" },
    { id: "changes", label: `Change Requests (${project.changeRequests?.length || 0})`, adminOnly: true },
    { id: "payments", label: "Payment Milestones", adminOnly: true },
    { id: "media", label: "Drive Assets & Files" },
  ];

  const tabs = allTabs.filter((t) => !t.adminOnly || !isEmployee);

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
        <div className="flex items-center gap-2">
          {/* Distinct Role Badge for Admin vs Employee Layout */}
          {isEmployee ? (
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
              <span>👤</span>
              <span>EMPLOYEE WORKSPACE</span>
            </span>
          ) : (
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>ADMIN / MANAGER</span>
            </span>
          )}
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {project.projectCode}
          </span>
        </div>
      </div>

      {/* Project Hero Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Indicator */}
              {(session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "SUB_ADMIN" || (session?.user as any)?.role === "SALES" ? (
                <select
                  value={project.status || "IN_PROGRESS"}
                  onChange={(e) => handleUpdateProjectStatus(e.target.value)}
                  className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 outline-none cursor-pointer"
                >
                  <option value="PENDING_SUB_ADMIN_ALLOCATION">PENDING TEAM ALLOCATION</option>
                  <option value="PLANNING">PLANNING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="INCOMPLETE">INCOMPLETE</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {project.status === "PENDING_SUB_ADMIN_ALLOCATION" ? "PENDING TEAM ALLOCATION" : (project.status || "IN_PROGRESS")}
                </span>
              )}

              {/* Urgency Priority Indicator */}
              {(session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "SUB_ADMIN" || (session?.user as any)?.role === "SALES" ? (
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
                {((session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SUB_ADMIN" || (session?.user as any)?.role === "SALES") && (
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
              <span className="flex items-center gap-1.5">
                <span>Deadline: <strong className="text-slate-800 dark:text-slate-200">{project.deadline || "No Deadline"}</strong></span>
                {((session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SUB_ADMIN") && (
                  <button
                    onClick={() => {
                      setDeadlineInputVal(project.targetDeadline ? new Date(project.targetDeadline).toISOString().slice(0, 10) : "");
                      setIsDeadlineModalOpen(true);
                    }}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors"
                    title="Set or update deadline"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>{project.deadline && project.deadline !== "No Deadline" ? "Change Date" : "Add Date"}</span>
                  </button>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdminOrOwner && (
              <button
                onClick={() => setIsEditProjectOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs touch-target border border-slate-200 dark:border-slate-700"
                title="Edit project parameters, deadline, and details"
              >
                <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Edit Project</span>
              </button>
            )}
            {isAdminOrOwner && (
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
            {!isEmployee && (
              <Link
                href={`/portal/preview-${project.id}`}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
                title="Preview client portal for this specific project"
              >
                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Client Portal Preview</span>
              </Link>
            )}
          </div>
        </div>

        {/* Sub Admin Allocation Banner */}
        {project.status === "PENDING_SUB_ADMIN_ALLOCATION" && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-indigo-50 dark:from-amber-950/40 dark:to-indigo-950/40 border border-amber-300 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <strong className="text-slate-900 dark:text-slate-100 font-extrabold text-sm block">
                  Awaiting Sub Admin Team Allocation
                </strong>
                <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                  This sale was approved by Super Admin. Assign employees to activate the project and reflect it in their workspace.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("team")}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Assign Employees Now</span>
            </button>
          </div>
        )}

        {/* Progress Engine */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span>📊</span>
              <span>Project Completion Progress</span>
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm font-extrabold">{project.progress || 0}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(project.progress || 0, 2)}%` }}
            />
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
            {isAdminOrSubAdmin && project.contractValue !== undefined && (
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

            {/* Deployment & Previews Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Deployment & Previews</span>
                </h3>
                {isAdminOrOwner && (
                  <button
                    onClick={openUrlModal}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Edit URLs</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="min-w-0 pr-2">
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Staging Preview</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]" title={project.stagingUrl || "Not Configured"}>
                      {project.stagingUrl ? project.stagingUrl : "Not Configured"}
                    </div>
                  </div>
                  {project.stagingUrl ? (
                    <a
                      href={project.stagingUrl.startsWith("http") ? project.stagingUrl : `https://${project.stagingUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open</span>
                    </a>
                  ) : (
                    isAdminOrOwner && (
                      <button
                        onClick={openUrlModal}
                        className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-800 shrink-0"
                      >
                        + Add URL
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="min-w-0 pr-2">
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Production Site</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]" title={project.liveUrl || "Pending Launch"}>
                      {project.liveUrl ? project.liveUrl : "Pending Launch"}
                    </div>
                  </div>
                  {project.liveUrl ? (
                    <a
                      href={project.liveUrl.startsWith("http") ? project.liveUrl : `https://${project.liveUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Live</span>
                    </a>
                  ) : (
                    isAdminOrOwner && (
                      <button
                        onClick={openUrlModal}
                        className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800 shrink-0"
                      >
                        + Add Live
                      </button>
                    )
                  )}
                </div>
              </div>
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
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isEmployee ? `My Assigned Tasks (${visibleTasks.length})` : "Project Task Stack"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEmployee
                  ? "Tasks assigned specifically to you in this project workspace."
                  : "Tasks directly compute the single-source-of-truth project progress."}
              </p>
            </div>
            <button
              onClick={() => setIsTaskSheetOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs touch-target"
            >
              + Create Task
            </button>
          </div>
          <div className="space-y-3 text-xs">
            {visibleTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                {isEmployee
                  ? "No tasks currently assigned to you in this project workspace."
                  : "No active tasks. Click '+ Create Task' to add tasks."}
              </div>
            ) : (
              visibleTasks.map((tsk: any) => {
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
                          value={
                            tsk.status === "DONE" || tsk.status === "COMPLETED"
                              ? "COMPLETED"
                              : tsk.status === "REVISION" || tsk.status === "ON_HOLD"
                              ? "REVISION"
                              : tsk.status === "CURRENT" || tsk.status === "IN_PROGRESS"
                              ? "CURRENT"
                              : "PLANNING"
                          }
                          onChange={(e) => handleToggleTaskStatus(tsk.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer outline-none ${
                            isDone
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                              : tsk.status === "REVISION" || tsk.status === "ON_HOLD"
                              ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600 border-purple-200 dark:border-purple-800"
                              : isInProgress || tsk.status === "CURRENT"
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 border-amber-200 dark:border-amber-800"
                              : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 border-blue-200 dark:border-blue-800"
                          }`}
                        >
                          <option value="PLANNING">📋 Planning</option>
                          <option value="CURRENT">⚡ Current</option>
                          <option value="REVISION">🔄 Revision</option>
                          <option value="COMPLETED">✅ Complete</option>
                        </select>

                        {!isDone ? (
                          <button
                            onClick={() => handleToggleTaskStatus(tsk.id, "COMPLETED")}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Mark task complete"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Completed</span>
                          </span>
                        )}

                        {/* Edit Task Option for Admin/Owner/TM */}
                        <button
                          onClick={() => setEditingTask(tsk)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                          title="Edit Task Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleArchiveTask(tsk.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
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
                  {/* Number-wise Task Highlights */}
                  <div className="space-y-2">
                    {(() => {
                      const lines = (u.content || "").split("\n").map((l: string) => l.trim()).filter(Boolean);
                      const isNumbered = lines.some((l: string) => /^(\d+[.)]|[-•])/.test(l));

                      if (!isNumbered) {
                        return (
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {u.content}
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            Task Highlights:
                          </span>
                          <div className="grid grid-cols-1 gap-2">
                            {lines.map((line: string, idx: number) => {
                              const match = line.match(/^(\d+[.)]|[-•])\s*(.*)$/);
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
                                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 shadow-2xs"
                                >
                                  <span className="w-5 h-5 shrink-0 rounded-lg bg-indigo-600 text-white font-extrabold text-[11px] flex items-center justify-center font-mono shadow-xs mt-0.5">
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

      {/* Tab: Google Drive Media & Assets */}
      {activeTab === "media" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Project Drive Storage & Assets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload briefs, design mockups, deliverables, and contracts stored directly in Google Drive.
              </p>
            </div>

            <MediaUploader
              entityType="PROJECT"
              entityId={params.id}
              category="ASSET"
              onUploadSuccess={() => {
                showToast("File uploaded to Google Drive!", "success");
              }}
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <MediaGallery
              entityType="PROJECT"
              entityId={params.id}
              allowDelete={true}
            />
          </div>
        </div>
      )}

      {/* Team Chat Tab */}
      {activeTab === "chat" && (
        <div className="space-y-4">
          <ProjectChatTab projectId={params.id} projectName={project.name} />
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
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Status</label>
            <select
              value={taskStatus}
              onChange={(e) => setTaskStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="PLANNING">📋 Planning</option>
              <option value="CURRENT">⚡ Current</option>
              <option value="REVISION">🔄 Revision</option>
              <option value="COMPLETED">✅ Complete</option>
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
              value={isCustomRole ? "__CUSTOM__" : selectedRoleInProject}
              onChange={(e) => {
                if (e.target.value === "__CUSTOM__") {
                  setIsCustomRole(true);
                } else {
                  setIsCustomRole(false);
                  setSelectedRoleInProject(e.target.value);
                }
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {r === "TM" ? "TM (Tech Lead / Project Lead)" : r}
                </option>
              ))}
              <option value="__CUSTOM__">✨ + Create Custom Role...</option>
            </select>

            {isCustomRole && (
              <div className="mt-2 space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold block text-[11px]">
                  Enter Custom Role Name *
                </label>
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  placeholder="e.g. SEO Specialist, Consultant..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium text-xs"
                  autoFocus
                  required
                />
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                  This custom role will be created and saved for admin/sub-admin to use.
                </p>
              </div>
            )}

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

      {/* Admin & Sub Admin Deadline Management Modal */}
      <BottomSheet
        isOpen={isDeadlineModalOpen}
        onClose={() => setIsDeadlineModalOpen(false)}
        title="Manage Project Target Deadline"
        subtitle={`Set or update target deadline for ${project?.name || "Project"}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Target Deadline Date
            </label>
            <input
              type="date"
              value={deadlineInputVal}
              onChange={(e) => setDeadlineInputVal(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Select a date and click Save, or click Clear Deadline to remove the deadline.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={updatingDeadline || !deadlineInputVal}
              onClick={() => handleUpdateDeadline(deadlineInputVal)}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {updatingDeadline ? "Saving..." : "Save Deadline"}
            </button>
            {project?.deadline && project?.deadline !== "No Deadline" && (
              <button
                type="button"
                disabled={updatingDeadline}
                onClick={() => handleUpdateDeadline(null)}
                className="py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all disabled:opacity-50"
              >
                Clear Deadline
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDeadlineModalOpen(false)}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Admin & Sub Admin Staging / Live URLs Modal */}
      <BottomSheet
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        title="Manage Deployment & Preview Links"
        subtitle={`Configure live site and staging URLs for ${project?.name || "Project"}`}
      >
        <form onSubmit={handleSaveUrls} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Staging Preview URL (Test Deployment)
            </label>
            <input
              type="text"
              value={stagingUrlInput}
              onChange={(e) => setStagingUrlInput(e.target.value)}
              placeholder="e.g. https://staging.example.com or https://client-preview.vercel.app"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              This link is opened when clients or team members click &ldquo;Launch Staging Preview&rdquo;.
            </p>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Production / Live Site URL
            </label>
            <input
              type="text"
              value={liveUrlInput}
              onChange={(e) => setLiveUrlInput(e.target.value)}
              placeholder="e.g. https://example.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Design Files / Figma URL (Optional)
            </label>
            <input
              type="text"
              value={designUrlInput}
              onChange={(e) => setDesignUrlInput(e.target.value)}
              placeholder="e.g. https://figma.com/file/..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={updatingUrls}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {updatingUrls ? "Saving URLs..." : "Save URLs"}
            </button>
            <button
              type="button"
              onClick={() => setIsUrlModalOpen(false)}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Edit Project Modal */}
      {isEditProjectOpen && project && (
        <EditProjectModal
          isOpen={isEditProjectOpen}
          onClose={() => setIsEditProjectOpen(false)}
          project={project}
          onSuccess={() => {
            fetchProject();
          }}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && project && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          projectId={project.id}
          employees={project.teamMembers || []}
          onSuccess={() => {
            fetchProject();
          }}
        />
      )}
    </div>
  );
}
