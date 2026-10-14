"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FolderKanban,
  User,
  Users,
  Search,
  Plus,
  ArrowRight,
  ExternalLink,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Building,
  Phone,
  Mail,
  Filter,
  Layers,
  Sparkles,
  Shield,
  Briefcase,
  ChevronDown,
  GripVertical,
  Camera,
  Edit3,
  MessageSquare,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import { AvatarUploadModal } from "@/components/ui/AvatarUploadModal";
import { ProjectTaskCalendar } from "./ProjectTaskCalendar";
import { EditProjectModal } from "./EditProjectModal";
import { EditTaskModal } from "./EditTaskModal";

export interface ProjectCardItem {
  id: string;
  projectNumber: string;
  name: string;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "INCOMPLETE" | "COMPLETED" | string;
  priority: string;
  progress: number;
  progressPercentage: number;
  contractValue: number;
  targetDeadline: string;
  roleInProject: string;
  assignedAt?: string;
  compensationAmount?: number;
  clientName: string;
  totalTasks: number;
  completedTasks: number;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  teamMembers?: Array<{
    id: string;
    employeeId?: string;
    employeeIdCode?: string;
    userId?: string;
    name: string;
    role: string;
    email?: string;
    active?: boolean;
  }>;
  tasks?: Array<{ id: string; title: string; status: string; priority: string }>;
}

function normalizeProjectCard(p: any, fallbackEmployeeId?: string): ProjectCardItem {
  const isCompleted = (s: string) =>
    ["COMPLETED", "DONE", "COMPLETE", "DELIVERED", "RESOLVED", "WON"].includes(String(s || "").trim().toUpperCase());
  const totalTasks = p.tasks ? p.tasks.length : (p.totalTasks || 0);
  const completedTasks = p.tasks
    ? p.tasks.filter((t: any) => isCompleted(t.status)).length
    : (p.completedTasks || 0);
  const calcProgress =
    p.status === "COMPLETED"
      ? 100
      : totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : typeof p.progress === "number" && p.progress > 0
      ? p.progress
      : Number(p.progressPercentage) || 0;

  const rawMembers: any[] = Array.isArray(p.teamMembers) ? p.teamMembers : [];
  const activeMembers = rawMembers.filter((m: any) => m.active !== false);
  const primaryMember = activeMembers[0];

  const assignedEmpName =
    primaryMember?.name ||
    p.assignedEmployeeName ||
    p.employeeName ||
    (p.tmName && p.tmName !== "Unassigned" ? p.tmName.replace(" (Tech Lead)", "") : undefined);

  const assignedEmpId =
    primaryMember?.employeeId ||
    primaryMember?.id ||
    p.assignedEmployeeId ||
    (p.tmId && p.tmId !== "UNASSIGNED" ? p.tmId : undefined) ||
    fallbackEmployeeId;

  return {
    id: p.id,
    projectNumber: p.projectCode || p.projectNumber || p.id,
    name: p.name || "Untitled Project",
    status: p.status || p.currentStage || "PLANNING",
    priority: p.priority || "HIGH",
    progress: calcProgress,
    progressPercentage: calcProgress,
    contractValue: Number(p.contractValue) || 0,
    targetDeadline:
      p.deadline ||
      (p.targetDeadline ? new Date(p.targetDeadline).toLocaleDateString() : "") ||
      "No Deadline",
    roleInProject: primaryMember?.role || p.roleInProject || (p.tmName && p.tmName !== "Unassigned" ? "TM" : "DEVELOPER"),
    clientName: p.clientName || (p.client ? p.client.companyName : "Client"),
    totalTasks,
    completedTasks,
    assignedEmployeeId: assignedEmpId,
    assignedEmployeeName: assignedEmpName,
    teamMembers: rawMembers,
    tasks: p.tasks || [],
  };
}

export interface EmployeeWorkload {
  id: string;
  userId?: string;
  employeeId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  designation: string;
  department: string;
  phone: string;
  punchedIn: boolean;
  shiftCompleted: boolean;
  punchInTime: string;
  totalProjects: number;
  activeProjectsCount: number;
  planningProjectsCount: number;
  completedProjectsCount: number;
  onHoldProjectsCount: number;
  assignedProjects: ProjectCardItem[];
}

interface EmployeeProjectKanbanProps {
  employees: EmployeeWorkload[];
  allProjects: any[];
  onRefresh: () => void;
  initialSelectedEmployeeId?: string;
}

const KANBAN_COLUMNS = [
  {
    id: "PLANNING",
    title: "Planning / Queue",
    color: "slate",
    borderHeader: "border-blue-500",
    badgeBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  {
    id: "IN_PROGRESS",
    title: "In Progress / Active",
    color: "indigo",
    borderHeader: "border-indigo-500",
    badgeBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
  {
    id: "ON_HOLD",
    title: "On Hold / Review",
    color: "amber",
    borderHeader: "border-amber-500",
    badgeBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  {
    id: "INCOMPLETE",
    title: "Incomplete",
    color: "rose",
    borderHeader: "border-rose-500",
    badgeBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  },
  {
    id: "COMPLETED",
    title: "Delivered / Won",
    color: "emerald",
    borderHeader: "border-emerald-500",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
];

export function EmployeeProjectKanban({
  employees,
  allProjects,
  onRefresh,
  initialSelectedEmployeeId,
}: EmployeeProjectKanbanProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = ((session?.user as any)?.role || "").toUpperCase();
  const isAdminOrSubAdmin = ["OWNER", "ADMIN", "SUB_ADMIN"].includes(userRole);
  const isEmployee = userRole === "EMPLOYEE" || !isAdminOrSubAdmin;
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    initialSelectedEmployeeId || "ALL"
  );
  // View mode: Kanban vs Calendar
  const [viewMode, setViewMode] = useState<"kanban" | "calendar">("kanban");
  // Hide left sidebar portion by default so Kanban columns take full 100% width
  const [showSidebar, setShowSidebar] = useState(false);
  // Option to hide completed projects from Kanban board
  const [hideCompletedProjects, setHideCompletedProjects] = useState(false);

  // Drag and Drop state
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [optimisticProjects, setOptimisticProjects] = useState<ProjectCardItem[] | null>(null);

  // Quick Task update from Kanban card
  const handleUpdateTaskFromKanban = async (
    projectId: string,
    taskId: string,
    nextStatus: string
  ) => {
    // Optimistic visual update
    setOptimisticProjects((prev) => {
      const base = prev ? [...prev] : [...displayedProjects];
      return base.map((p) => {
        if (p.id !== projectId) return p;
        const updatedTasks = (p.tasks || []).map((t: any) =>
          t.id === taskId
            ? {
                ...t,
                status: nextStatus,
                completedAt:
                  nextStatus === "COMPLETED" || nextStatus === "DONE"
                    ? t.completedAt || new Date().toISOString()
                    : null,
              }
            : t
        );
        const isTaskDone = (s: string) =>
          ["COMPLETED", "DONE", "COMPLETE", "DELIVERED", "RESOLVED", "WON"].includes(String(s || "").trim().toUpperCase());
        const completedTasks = updatedTasks.filter((t: any) => isTaskDone(t.status)).length;
        const totalTasks = updatedTasks.length;
        const progress =
          p.status === "COMPLETED"
            ? 100
            : totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : p.progress;
        return {
          ...p,
          tasks: updatedTasks,
          completedTasks,
          progress,
          progressPercentage: progress,
        };
      });
    });

    try {
      const res = await fetch(`/mdz-crm/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        if (nextStatus === "COMPLETED" || nextStatus === "DONE") {
          showToast("✓ Task completed & moved to Calendar view!", "success");
        } else {
          showToast(`✓ Task updated to ${nextStatus}`, "success");
        }
        onRefresh();
      } else {
        showToast(json.error || "Failed to update task", "error");
        setOptimisticProjects(null);
      }
    } catch (e) {
      showToast("Error updating task status", "error");
      setOptimisticProjects(null);
    }
  };

  // Modal to assign current employee to a project
  const DEFAULT_ROLES = [
    "TM",
    "Graphic Designer",
    "Video editor",
    "sales person",
    "accounting",
    "Web devloper",
  ];
  const [availableRoles, setAvailableRoles] = useState<string[]>(DEFAULT_ROLES);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignProjectId, setAssignProjectId] = useState("");
  const [assignRole, setAssignRole] = useState("TM");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [assignCompensation, setAssignCompensation] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarModalEmployee, setAvatarModalEmployee] = useState<EmployeeWorkload | null>(null);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editingTaskProjectId, setEditingTaskProjectId] = useState<string>("");
  const [editingTaskTeamMembers, setEditingTaskTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/mdz-crm/api/project-roles")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.roles)) {
          setAvailableRoles(data.roles);
        }
      })
      .catch((e) => console.error("Error loading project roles:", e));
  }, []);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const matchesSearch =
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.designation && e.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.employeeId && e.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDept = departmentFilter === "ALL" || e.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, departmentFilter]);

  // Auto-select logged-in employee if role is EMPLOYEE or if initialSelectedEmployeeId is provided
  useEffect(() => {
    if (initialSelectedEmployeeId) {
      setSelectedEmployeeId(initialSelectedEmployeeId);
    } else if (isEmployee && session?.user && employees.length > 0 && selectedEmployeeId === "ALL") {
      const myEmp = employees.find(
        (e) =>
          ((session.user as any)?.employeeId && (e.id === (session.user as any).employeeId || e.employeeId === (session.user as any).employeeId)) ||
          ((session.user as any)?.id && (e.id === (session.user as any).id || e.userId === (session.user as any).id)) ||
          (session.user?.email && e.email && e.email.toLowerCase() === session.user.email.toLowerCase()) ||
          (session.user?.name && e.name && e.name.toLowerCase().trim() === session.user.name.toLowerCase().trim())
      );
      if (myEmp) {
        setSelectedEmployeeId(myEmp.id);
      }
    }
  }, [initialSelectedEmployeeId, isEmployee, session, employees]);

  // Active selected employee
  const selectedEmployee = useMemo(() => {
    if (selectedEmployeeId === "ALL") return null;
    return (
      employees.find(
        (e) =>
          e.id === selectedEmployeeId ||
          e.employeeId === selectedEmployeeId ||
          e.userId === selectedEmployeeId
      ) || null
    );
  }, [employees, selectedEmployeeId]);

  // Projects to display in the Kanban board
  const displayedProjects = useMemo(() => {
    // Lookup map of all raw projects
    const allMap = new Map<string, any>();
    (allProjects || []).forEach((p) => {
      allMap.set(p.id, p);
    });

    if (selectedEmployee) {
      const matchedMap = new Map<string, ProjectCardItem>();

      // 1. Scan allProjects for any active membership or role matching selectedEmployee
      (allProjects || []).forEach((p) => {
        const isTm =
          p.tmId === selectedEmployee.id ||
          (selectedEmployee.userId && p.tmId === selectedEmployee.userId) ||
          (selectedEmployee.employeeId && p.tmId === selectedEmployee.employeeId);

        const isMember = (p.teamMembers || []).some((m: any) => {
          if (m.active === false) return false;
          const matchId = m.id === selectedEmployee.id || m.employeeId === selectedEmployee.id;
          const matchUser = selectedEmployee.userId && (m.userId === selectedEmployee.userId || m.id === selectedEmployee.userId);
          const matchCode = selectedEmployee.employeeId && (m.employeeIdCode === selectedEmployee.employeeId || m.employeeId === selectedEmployee.employeeId);
          const matchEmail = selectedEmployee.email && m.email && m.email.toLowerCase() === selectedEmployee.email.toLowerCase();
          const matchName = selectedEmployee.name && m.name && m.name.toLowerCase().trim() === selectedEmployee.name.toLowerCase().trim();
          return matchId || matchUser || matchCode || matchEmail || matchName;
        });

        const isAssignedDirectly =
          p.assignedEmployeeId === selectedEmployee.id ||
          (selectedEmployee.userId && p.assignedEmployeeId === selectedEmployee.userId);

        if (isTm || isMember || isAssignedDirectly) {
          matchedMap.set(p.id, normalizeProjectCard(p, selectedEmployee.id));
        }
      });

      // 2. Also check selectedEmployee.assignedProjects
      (selectedEmployee.assignedProjects || []).forEach((p: any) => {
        if (!matchedMap.has(p.id)) {
          const fullP = allMap.get(p.id);
          matchedMap.set(p.id, normalizeProjectCard(fullP || p, selectedEmployee.id));
        }
      });

      return Array.from(matchedMap.values());
    } else {
      const map = new Map<string, ProjectCardItem>();

      // 1. Add all projects from allProjects
      (allProjects || []).forEach((p) => {
        map.set(p.id, normalizeProjectCard(p));
      });

      // 2. Supplement or merge with any assignedProjects from employees
      (employees || []).forEach((emp) => {
        emp.assignedProjects?.forEach((p) => {
          if (!map.has(p.id)) {
            map.set(p.id, normalizeProjectCard(p, emp.id));
          }
        });
      });

      return Array.from(map.values());
    }
  }, [selectedEmployee, employees, allProjects]);

  // Sync optimistic projects when displayedProjects changes
  useEffect(() => {
    setOptimisticProjects(null);
  }, [displayedProjects]);

  // Global dragend listener to ensure draggedProjectId is always cleared (prevents card staying faded/translucent)
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggedProjectId(null);
    };
    window.addEventListener("dragend", handleGlobalDragEnd);
    window.addEventListener("drop", handleGlobalDragEnd);
    return () => {
      window.removeEventListener("dragend", handleGlobalDragEnd);
      window.removeEventListener("drop", handleGlobalDragEnd);
    };
  }, []);

  const rawProjects = optimisticProjects || displayedProjects;
  const projectsToRender = useMemo(() => {
    if (!searchTerm.trim()) return rawProjects;
    const term = searchTerm.toLowerCase();
    return rawProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.projectNumber && p.projectNumber.toLowerCase().includes(term)) ||
        (p.clientName && p.clientName.toLowerCase().includes(term))
    );
  }, [rawProjects, searchTerm]);

  // Handle Drag & Drop status change
  const handleDropProject = async (projectId: string, targetStage: string) => {
    // Immediately clear drag state so the card doesn't stay faded/dashed
    setDraggedProjectId(null);

    const proj = projectsToRender.find((p) => p.id === projectId);
    if (!proj) return;

    const currentStage = (proj.status || "PLANNING").toUpperCase();
    if (currentStage === targetStage && proj.status === targetStage) return;

    // Optimistic visual update (0ms lag)
    setOptimisticProjects((prev) => {
      const base = prev ? [...prev] : [...displayedProjects];
      return base.map((p) => (p.id === projectId ? { ...p, status: targetStage } : p));
    });

    try {
      const res = await fetch(`/mdz-crm/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStage }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Moved "${proj.name}" to ${targetStage.replace("_", " ")}`, "success");
        onRefresh();
      } else {
        showToast(json.error || "Failed to update project status", "error");
        setOptimisticProjects(null);
      }
    } catch (e) {
      showToast("Network error moving project", "error");
      setOptimisticProjects(null);
    }
  };

  // Quick Add / Assign member to project without removing existing members
  const handleQuickAddMemberToProject = async (projectId: string, newEmployeeId: string) => {
    const newEmp = employees.find((e) => e.id === newEmployeeId);
    if (!newEmp) return;

    const defaultRole = newEmp.designation || "Web devloper";

    // Optimistically update local project card
    setOptimisticProjects((prev) => {
      const current = prev || displayedProjects;
      return current.map((p) => {
        if (p.id === projectId) {
          const existingMembers = (p.teamMembers || []).filter((m) => m.id !== newEmployeeId && m.employeeId !== newEmployeeId);
          const updatedMembers = [
            ...existingMembers,
            {
              id: newEmployeeId,
              employeeId: newEmployeeId,
              name: newEmp.name,
              role: defaultRole,
              email: newEmp.email,
              active: true,
            },
          ];
          return {
            ...p,
            teamMembers: updatedMembers,
          };
        }
        return p;
      });
    });

    try {
      const res = await fetch(`/mdz-crm/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: newEmployeeId,
          roleInProject: defaultRole,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `✓ Assigned ${newEmp.name} to project`, "success");
        onRefresh();
      } else {
        showToast(json.error || "Failed to assign member", "error");
        onRefresh();
      }
    } catch (e) {
      showToast("Network error assigning developer", "error");
      onRefresh();
    }
  };

  // Handle reassigning developer directly from project card dropdown
  const handleReassignProject = async (projectId: string, newEmployeeId: string) => {
    handleQuickAddMemberToProject(projectId, newEmployeeId);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !assignProjectId) {
      showToast("Please select a project", "error");
      return;
    }

    const finalRole = isCustomRole ? customRoleInput.trim() : assignRole;
    if (!finalRole) {
      showToast("Please specify a project role", "error");
      return;
    }

    try {
      setAssigning(true);

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

      const res = await fetch(`/mdz-crm/api/projects/${assignProjectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          roleInProject: finalRole,
          compensationAmount: assignCompensation ? Number(assignCompensation) : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Assigned employee to project successfully!", "success");
        setIsAssignModalOpen(false);
        setIsCustomRole(false);
        setCustomRoleInput("");
        setAssignProjectId("");
        setAssignCompensation("");
        onRefresh();
      } else {
        showToast(json.error || "Failed to assign project", "error");
      }
    } catch (err) {
      showToast("Network error while assigning project", "error");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* TOP CONTROL BAR: Full Width Developer Dropdown + Quick Filters + Toggle Sidebar */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Quick Employee Selector Dropdown */}
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Select Team Member:</span>
              </span>
            </div>

            <div className="relative flex-1 min-w-[260px] max-w-lg">
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none shadow-xs transition-all"
              >
                <option value="ALL">🌐 All Company Projects ({allProjects.length} Projects)</option>
                {(departmentFilter === "ALL" ? employees : employees.filter((e) => e.department === departmentFilter)).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    👤 {emp.name} ({emp.totalProjects !== undefined ? emp.totalProjects : emp.assignedProjects?.length || 0} Projects) — {emp.designation || "Team Member"}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600 dark:text-indigo-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search project or role..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Right: Sidebar Toggle Button + Assign Button + Task Calendar Button */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center flex-wrap">
            {/* View Switcher: Projects Cards vs Task Calendar */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "kanban" ? "calendar" : "kanban")}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 ${
                viewMode === "calendar"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
              title="Toggle between Projects View and Interactive Dated Task Calendar"
            >
              <Calendar className={`w-4 h-4 ${viewMode === "calendar" ? "text-white" : "text-indigo-600 dark:text-indigo-400"}`} />
              <span>{viewMode === "calendar" ? "Projects View" : "Task Calendar"}</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-black ${
                  viewMode === "calendar"
                    ? "bg-white/20 text-white"
                    : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-2xs"
                }`}
              >
                PREMIUM
              </span>
            </button>

            {/* Toggle Hide Completed from Kanban */}
            {viewMode === "kanban" && (
              <button
                type="button"
                onClick={() => setHideCompletedProjects(!hideCompletedProjects)}
                className={`px-3 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
                  hideCompletedProjects
                    ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-xs"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
                title={hideCompletedProjects ? "Completed projects hidden from Kanban. Click to show." : "Hide completed projects from Kanban (track in Calendar)"}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${hideCompletedProjects ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                <span>{hideCompletedProjects ? "Completed Hidden" : "Hide Completed"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSidebar(!showSidebar)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 shadow-xs ${
                showSidebar
                  ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
              title={showSidebar ? "Hide employee list sidebar to expand Kanban to 100% width" : "Show employee list sidebar"}
            >
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{showSidebar ? "Hide Team List" : "Show Team List"}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                {employees.length}
              </span>
            </button>

            {selectedEmployee && (
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Project</span>
              </button>
            )}
          </div>
        </div>

        {/* Department Quick Filter Pills */}
        {departments.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 overflow-x-auto text-[11px] font-semibold scrollbar-none">
            <span className="text-slate-400 dark:text-slate-500 mr-1 text-[10px] uppercase font-mono tracking-wider">
              Department:
            </span>
            <button
              onClick={() => setDepartmentFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                departmentFilter === "ALL"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  departmentFilter === dept
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* LEFT SIDEBAR: Master Employee List (Odoo Style) */}
        {showSidebar && (
          <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Team Workload ({employees.length})
                  </h3>
                </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
              WORKSPACE
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search team member, role..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* All Employee Quick Dropdown Selector */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span>All Employees Dropdown</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">Quick Select</span>
            </div>
            <div className="relative">
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-bold outline-none focus:border-indigo-500 cursor-pointer appearance-none pr-8 transition-colors shadow-2xs"
              >
                <option value="ALL">🌐 All Company Projects ({allProjects.length} Projects)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    👤 {emp.name} ({emp.totalProjects !== undefined ? emp.totalProjects : emp.assignedProjects?.length || 0} Projects) — {emp.designation || "Team Member"}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Department Filter Pills */}
          {departments.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold scrollbar-none">
              <button
                onClick={() => setDepartmentFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  departmentFilter === "ALL"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(dept)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    departmentFilter === dept
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Employee Scroll List */}
        <div className="max-h-[620px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
          {/* ALL Option */}
          <button
            onClick={() => setSelectedEmployeeId("ALL")}
            className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between ${
              selectedEmployeeId === "ALL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                  selectedEmployeeId === "ALL"
                    ? "bg-white/20 text-white"
                    : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs">All Company Projects</div>
                <div
                  className={`text-[10px] ${
                    selectedEmployeeId === "ALL" ? "text-indigo-100" : "text-slate-400"
                  }`}
                >
                  Aggregated workload view
                </div>
              </div>
            </div>
            <span
              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                selectedEmployeeId === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {allProjects.length}
            </span>
          </button>

          {/* Individual Employees */}
          {filteredEmployees.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No employees match criteria</div>
          ) : (
            filteredEmployees.map((emp) => {
              const isSelected = selectedEmployeeId === emp.id;
              const hasProjects = emp.totalProjects > 0;

              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between group ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-sm ${
                          isSelected
                            ? "bg-white text-indigo-700"
                            : "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white"
                        }`}
                      >
                        {emp.name[0]?.toUpperCase()}
                      </div>
                      {/* Status Dot */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                          isSelected ? "border-indigo-600" : "border-white dark:border-slate-900"
                        } ${
                          emp.punchedIn
                            ? "bg-emerald-500"
                            : emp.shiftCompleted
                            ? "bg-indigo-400"
                            : "bg-slate-400"
                        }`}
                        title={emp.punchedIn ? "Working" : emp.shiftCompleted ? "Completed Shift" : "Offline"}
                      />
                    </div>

                    <div className="min-w-0 pr-1">
                      <div className="font-bold text-xs truncate flex items-center gap-1.5">
                        <span className="truncate">{emp.name}</span>
                      </div>
                      <div
                        className={`text-[11px] truncate ${
                          isSelected ? "text-indigo-100" : "text-indigo-600 dark:text-indigo-400 font-medium"
                        }`}
                      >
                        {emp.designation || "Developer"}
                      </div>
                      <div
                        className={`text-[10px] font-mono truncate ${
                          isSelected ? "text-indigo-200" : "text-slate-400"
                        }`}
                      >
                        {emp.email}
                      </div>
                    </div>
                  </div>

                  {/* Project Count Badge */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : hasProjects
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      }`}
                      title={`${emp.totalProjects} total assigned projects`}
                    >
                      <Briefcase className="w-3 h-3" />
                      <span>{emp.totalProjects}</span>
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    )}

      {/* RIGHT MAIN AREA: Employee Details Header + Kanban Columns */}
      <div className="flex-1 w-full space-y-5 min-w-0">
        {/* Selected Employee Summary Card */}
        {selectedEmployee ? (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="relative group cursor-pointer shrink-0"
                  onClick={() => {
                    setAvatarModalEmployee(selectedEmployee);
                    setIsAvatarModalOpen(true);
                  }}
                  title="Click to change member photo"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-md shadow-indigo-600/20 flex items-center justify-center bg-gradient-to-tr from-indigo-600 to-purple-600 group-hover:scale-105 transition-transform">
                    {selectedEmployee.avatarUrl ? (
                      <img
                        src={selectedEmployee.avatarUrl}
                        alt={selectedEmployee.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl sm:text-2xl font-black text-white">
                        {selectedEmployee.name[0]?.toUpperCase()}
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

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                      {selectedEmployee.name}
                    </h2>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {selectedEmployee.employeeId}
                    </span>
                    {selectedEmployee.punchedIn ? (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Working Now</span>
                      </span>
                    ) : selectedEmployee.role === "SUB_ADMIN" ? null : (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {selectedEmployee.shiftCompleted ? "Shift Done" : "Offline"}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    {selectedEmployee.designation || "Team Member"} • {selectedEmployee.department || "Engineering"}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3 mt-1 font-mono">
                    <span>📧 {selectedEmployee.email}</span>
                    <span>📞 {selectedEmployee.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* Header Employee Selector Dropdown */}
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="ALL">🌐 All Employees View</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.totalProjects} projs)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setAvatarModalEmployee(selectedEmployee);
                    setIsAvatarModalOpen(true);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  title="Add or update photo for this employee"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{selectedEmployee.avatarUrl ? "Photo" : "+ Add Photo"}</span>
                </button>

                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign to Project</span>
                </button>
                <Link
                  href={`/employees/${selectedEmployee.id}`}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="text-slate-500 text-[11px]">Total Projects</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                  {selectedEmployee.totalProjects}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60">
                <div className="text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold">In Progress</div>
                <div className="text-lg font-extrabold text-indigo-700 dark:text-indigo-300 font-mono mt-0.5">
                  {selectedEmployee.activeProjectsCount}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60">
                <div className="text-blue-600 dark:text-blue-400 text-[11px] font-semibold">In Planning</div>
                <div className="text-lg font-extrabold text-blue-700 dark:text-blue-300 font-mono mt-0.5">
                  {selectedEmployee.planningProjectsCount || selectedEmployee.assignedProjects?.filter(p => (p.status || '').toUpperCase() === 'PLANNING' || (p.status || '').toUpperCase() === 'DRAFT').length || 0}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60">
                <div className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold">Incomplete</div>
                <div className="text-lg font-extrabold text-rose-700 dark:text-rose-300 font-mono mt-0.5">
                  {selectedEmployee.assignedProjects?.filter(p => {
                    const s = (p.status || '').toUpperCase();
                    return s === 'INCOMPLETE' || s === 'DROPPED' || s === 'CANCELLED' || s.includes('INCOMPLETE');
                  }).length || 0}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
                <div className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">Completed</div>
                <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                  {selectedEmployee.completedProjectsCount}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                All Company Project Workloads
              </h2>
              <p className="text-xs text-slate-500">
                Showing all active projects across all {employees.length} team members. Drag cards to update statuses.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL">🌐 All Employees View</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    👤 {e.name} ({e.totalProjects} projs)
                  </option>
                ))}
              </select>
              <span className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold">
                Total: {allProjects.length}
              </span>
            </div>
          </div>
        )}

        {viewMode === "calendar" ? (
          <ProjectTaskCalendar
            allProjects={allProjects}
            employees={employees}
            onRefresh={onRefresh}
            selectedEmployeeId={selectedEmployeeId}
            onSelectEmployee={(empId) => setSelectedEmployeeId(empId)}
          />
        ) : (
          <>
            {/* DRAG AND DROP INSTRUCTION BANNER */}
            <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong>Drag & Drop Enabled:</strong> Drag any project card between stages (Planning, In Progress, On Hold, Incomplete, Won) to instantly update its status.
            </span>
          </div>
          <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0 hidden sm:inline">
            Drag card to column
          </span>
        </div>

        {/* KANBAN BOARD (Columns by Status with Drop Zones) */}
        {(() => {
          const completedProjectsCount = projectsToRender.filter((p) => {
            const s = (p.status || "").toUpperCase();
            return s === "COMPLETED" || s === "DONE" || s === "DELIVERED" || s === "WON";
          }).length;

          const columnsToRender = hideCompletedProjects
            ? KANBAN_COLUMNS.filter((col) => col.id !== "COMPLETED")
            : KANBAN_COLUMNS;

          return (
            <div className="space-y-3">
              {hideCompletedProjects && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      <strong>Completed items hidden from Kanban:</strong> {completedProjectsCount} completed project{completedProjectsCount === 1 ? "" : "s"} & tasks are tracked in the Calendar view.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewMode("calendar")}
                      className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>View in Calendar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHideCompletedProjects(false)}
                      className="text-[11px] underline text-emerald-700 dark:text-emerald-400 font-bold hover:text-emerald-900 cursor-pointer"
                    >
                      Show on Kanban
                    </button>
                  </div>
                </div>
              )}

              <div className="flex overflow-x-auto gap-4 items-start pb-6 pr-4 scrollbar-thin max-w-full">
                {columnsToRender.map((col) => {
                  const colProjects = projectsToRender.filter((p) => {
                    const s = (p.status || "").toUpperCase();
                    const isCompleted = s === "COMPLETED" || s === "DONE" || s === "DELIVERED" || s === "WON";

                    // 1. Completed column always displays completed projects
                    if (col.id === "COMPLETED") {
                      return isCompleted;
                    }

                    // Completed projects do not show in other stages
                    if (isCompleted) return false;

              // 2. Incomplete column displays explicitly incomplete / dropped / cancelled projects
              if (col.id === "INCOMPLETE") {
                return (
                  s === "INCOMPLETE" ||
                  s === "DROPPED" ||
                  s === "CANCELLED" ||
                  s.includes("INCOMPLETE")
                );
              }

              // 3. In Progress column
              if (col.id === "IN_PROGRESS") {
                return s === "IN_PROGRESS" || s === "ACTIVE" || s === "CURRENT" || s.includes("PROGRESS");
              }

              // 4. On Hold / Revision column
              if (col.id === "ON_HOLD") {
                return s === "ON_HOLD" || s === "PAUSED" || s === "BLOCKED" || s === "REVISION";
              }

              // 5. Planning column
              if (col.id === "PLANNING") {
                const isOther =
                  s === "IN_PROGRESS" ||
                  s === "ACTIVE" ||
                  s === "CURRENT" ||
                  s.includes("PROGRESS") ||
                  s === "ON_HOLD" ||
                  s === "PAUSED" ||
                  s === "BLOCKED" ||
                  s === "REVISION" ||
                  s === "INCOMPLETE" ||
                  s === "DROPPED" ||
                  s === "CANCELLED" ||
                  s.includes("INCOMPLETE");
                return (
                  s === "PLANNING" ||
                  s === "DRAFT" ||
                  s === "" ||
                  s === "PENDING_SUB_ADMIN_ALLOCATION" ||
                  s === "PENDING_ALLOCATION" ||
                  s.includes("PENDING") ||
                  s.includes("ALLOCATION") ||
                  !isOther
                );
              }

              return s === col.id;
            });
            const totalVal = colProjects.reduce((acc, curr) => acc + (curr.contractValue || 0), 0);

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  e.currentTarget.classList.add(
                    "ring-2",
                    "ring-indigo-500",
                    "bg-indigo-50/70",
                    "dark:bg-indigo-950/50"
                  );
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove(
                    "ring-2",
                    "ring-indigo-500",
                    "bg-indigo-50/70",
                    "dark:bg-indigo-950/50"
                  );
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove(
                    "ring-2",
                    "ring-indigo-500",
                    "bg-indigo-50/70",
                    "dark:bg-indigo-950/50"
                  );
                  const pId = e.dataTransfer.getData("projectId") || draggedProjectId;
                  setDraggedProjectId(null);
                  if (pId) {
                    handleDropProject(pId, col.id);
                  }
                }}
                className="bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3 flex flex-col min-h-[580px] max-h-[calc(100vh-210px)] transition-all w-[330px] shrink-0 shadow-xs"
              >
                {/* Sticky Column Header */}
                <div className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md pb-2.5 pt-0.5 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      col.id === "IN_PROGRESS"
                        ? "bg-indigo-500 animate-pulse ring-4 ring-indigo-500/20"
                        : col.id === "COMPLETED"
                        ? "bg-emerald-500 ring-4 ring-emerald-500/20"
                        : col.id === "ON_HOLD"
                        ? "bg-amber-500 ring-4 ring-amber-500/20"
                        : col.id === "INCOMPLETE"
                        ? "bg-rose-500 ring-4 ring-rose-500/20"
                        : "bg-blue-500 ring-4 ring-blue-500/20"
                    }`} />
                    <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {col.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAdminOrSubAdmin && totalVal > 0 && (
                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                        ₹{totalVal >= 100000 ? `${(totalVal / 100000).toFixed(1)}L` : totalVal.toLocaleString("en-IN")}
                      </span>
                    )}
                    <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${col.badgeBg}`}>
                      {colProjects.length}
                    </span>
                  </div>
                </div>

                {/* Cards Container with smooth scrolling and top padding so cards never clip */}
                <div className="space-y-2.5 flex-1 overflow-y-auto pt-2.5 pb-4 pr-1 scrollbar-thin scroll-smooth">
                  {colProjects.length === 0 ? (
                    <div className="h-40 rounded-xl border-2 border-dashed border-slate-300/70 dark:border-slate-700/70 flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-500 text-xs space-y-1">
                      <span className="font-medium">No projects in this stage</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">Drop cards here to change stage</span>
                    </div>
                  ) : (
                    colProjects.map((proj) => {
                      const priorityColor =
                        proj.priority === "URGENT"
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80"
                          : proj.priority === "HIGH"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80";

                      const isLeadRole = proj.roleInProject === "TM";
                      const isBeingDragged = draggedProjectId === proj.id;
                      const isProjComplete =
                        proj.status === "COMPLETED" ||
                        proj.status === "DONE" ||
                        proj.status === "DELIVERED" ||
                        proj.status === "WON";

                      const rawMembers = Array.isArray(proj.teamMembers) ? proj.teamMembers : [];
                      const activeTeamMembers = rawMembers.filter((m: any) => m.active !== false);

                      const assignedEmp = employees.find(
                        (e) =>
                          e.id === proj.assignedEmployeeId ||
                          e.employeeId === proj.assignedEmployeeId ||
                          e.userId === proj.assignedEmployeeId
                      );

                      const assignedDisplayName =
                        activeTeamMembers.length > 1
                          ? `👥 ${activeTeamMembers.length} Members: ${activeTeamMembers.slice(0, 2).map((m: any) => m.name).join(", ")}${activeTeamMembers.length > 2 ? ` +${activeTeamMembers.length - 2}` : ""}`
                          : activeTeamMembers.length === 1
                          ? `👤 ${activeTeamMembers[0].name}`
                          : proj.assignedEmployeeName ||
                            assignedEmp?.name ||
                            selectedEmployee?.name ||
                            (isEmployee && session?.user?.name ? session.user.name : null);

                      const teamTooltip =
                        activeTeamMembers.length > 0
                          ? activeTeamMembers.map((m: any) => `${m.name} (${m.role || "Developer"})`).join(" • ")
                          : assignedDisplayName || "No team members assigned";

                      return (
                        <div
                          key={proj.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedProjectId(proj.id);
                            e.dataTransfer.setData("projectId", proj.id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => setDraggedProjectId(null)}
                          onClick={() => router.push(`/projects/${proj.id}`)}
                          className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-400 dark:hover:border-indigo-500/80 p-3.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 space-y-2.5 group cursor-pointer relative ${
                            isBeingDragged ? "opacity-30 scale-95 border-dashed border-indigo-500" : ""
                          }`}
                        >
                          {/* Top Badges & Quick Stage Move */}
                          <div className="flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors shrink-0 cursor-grab active:cursor-grabbing" />
                              <span
                                className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border whitespace-nowrap shrink-0 ${priorityColor}`}
                              >
                                {proj.priority}
                              </span>
                              <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 truncate max-w-[90px]">
                                {proj.projectNumber || proj.id.slice(0, 8)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Quick Stage Dropdown */}
                              <select
                                value={
                                  proj.status === "IN_PROGRESS" || proj.status === "ACTIVE" || proj.status === "CURRENT"
                                    ? "IN_PROGRESS"
                                    : proj.status === "ON_HOLD" || proj.status === "PAUSED" || proj.status === "BLOCKED" || proj.status === "REVISION"
                                    ? "ON_HOLD"
                                    : proj.status === "INCOMPLETE" || proj.status === "DROPPED" || proj.status === "CANCELLED"
                                    ? "INCOMPLETE"
                                    : proj.status === "COMPLETED" || proj.status === "DONE" || proj.status === "WON" || proj.status === "DELIVERED"
                                    ? "COMPLETED"
                                    : "PLANNING"
                                }
                                onChange={(e) => handleDropProject(proj.id, e.target.value)}
                                className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/80 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer transition-colors shadow-2xs"
                                title="Move Stage"
                              >
                                <option value="PLANNING">Planning</option>
                                <option value="IN_PROGRESS">Active</option>
                                <option value="ON_HOLD">Review</option>
                                <option value="INCOMPLETE">Incomplete</option>
                                <option value="COMPLETED">Delivered</option>
                              </select>

                              {/* Edit Project Button for Admins */}
                              {isAdminOrSubAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rawProj = allProjects.find((p) => p.id === proj.id) || proj;
                                    setEditingProject(rawProj);
                                  }}
                                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
                                  title="Edit Project"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Project Name & Client */}
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                              {proj.name}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                              <div className="flex items-center gap-1.5 truncate">
                                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{proj.clientName}</span>
                              </div>
                              {isAdminOrSubAdmin && proj.contractValue > 0 && (
                                <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0 ml-1">
                                  ₹{proj.contractValue >= 100000 ? `${(proj.contractValue / 100000).toFixed(1)}L` : proj.contractValue.toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Slim Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                              <span>Progress</span>
                              <span className="text-slate-700 dark:text-slate-300 font-extrabold">
                                {proj.progress || proj.progressPercentage || 0}%
                              </span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500 rounded-full transition-all duration-300"
                                style={{
                                  width: `${proj.progress || proj.progressPercentage || 0}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Active / Completed Tasks (clean compact representation) */}
                          {(() => {
                            const currentEmpId = (session?.user as any)?.employeeId;
                            const currentEmpName = session?.user?.name;
                            const cardTasks = isEmployee
                              ? (proj.tasks || []).filter((tsk: any) => {
                                  return (
                                    (currentEmpId && (tsk.assignedToId === currentEmpId || tsk.assignedTo?.id === currentEmpId)) ||
                                    (currentEmpName && (tsk.assignee === currentEmpName || tsk.assignedTo?.name === currentEmpName))
                                  );
                                })
                              : (proj.tasks || []);

                            if (cardTasks.length === 0) return null;

                            const activeCardTasks = cardTasks.filter(
                              (tsk: any) => tsk.status !== "COMPLETED" && tsk.status !== "DONE"
                            );
                            const completedTasksCount = cardTasks.filter(
                              (tsk: any) => tsk.status === "COMPLETED" || tsk.status === "DONE"
                            ).length;

                            return (
                              <div className="space-y-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
                                {activeCardTasks.length > 0 && (
                                  <div className="space-y-1">
                                    {activeCardTasks.slice(0, 2).map((tsk: any) => (
                                      <div
                                        key={tsk.id}
                                        className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs group/task"
                                      >
                                        <span className="truncate font-medium text-slate-800 dark:text-slate-200 text-[11px] flex-1">
                                          {tsk.title}
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingTask(tsk);
                                              setEditingTaskProjectId(proj.id);
                                              setEditingTaskTeamMembers(
                                                employees && employees.length > 0
                                                  ? employees.map((emp) => ({
                                                      id: emp.userId || emp.id,
                                                      userId: emp.userId || emp.id,
                                                      employeeId: emp.employeeId || emp.id,
                                                      name: emp.name,
                                                      designation: emp.designation || emp.role || "Developer",
                                                      role: emp.role || emp.designation || "Developer",
                                                      email: emp.email,
                                                    }))
                                                  : proj.teamMembers || []
                                              );
                                            }}
                                            className="p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                            title="Edit or Reassign Task"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleUpdateTaskFromKanban(proj.id, tsk.id, "COMPLETED");
                                            }}
                                            className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                                            title="Complete task"
                                          >
                                            <CheckCircle2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    {activeCardTasks.length > 2 && (
                                      <div className="text-[10px] text-slate-400 font-medium text-right pr-0.5">
                                        +{activeCardTasks.length - 2} more tasks
                                      </div>
                                    )}
                                  </div>
                                )}

                                {completedTasksCount > 0 && (
                                  <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-md">
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      <span>{completedTasksCount} task{completedTasksCount > 1 ? "s" : ""} done</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewMode("calendar");
                                      }}
                                      className="underline hover:text-emerald-900 dark:hover:text-emerald-200 font-bold flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <span>Calendar</span>
                                      <ArrowRight className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Card Footer: Metadata (Tasks, Overdue/Deadline, Team Avatars, Subtle Arrow) */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                            {/* Left: Tasks count & Target Deadline */}
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 shrink-0"
                                title={`${proj.completedTasks} of ${proj.totalTasks} tasks completed`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{proj.completedTasks}/{proj.totalTasks}</span>
                              </span>

                              <Link
                                href={`/projects/${proj.id}?tab=chat`}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors shrink-0"
                                title="Project Team Chat & Discussion"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span>Chat</span>
                              </Link>

                              {(() => {
                                const s = (proj.status || "").toUpperCase();
                                const isCompleted = s === "COMPLETED" || s === "DONE" || s === "DELIVERED" || s === "WON";
                                const isOverdue = !isCompleted && proj.targetDeadline && proj.targetDeadline !== "No Deadline" && !isNaN(new Date(proj.targetDeadline).getTime()) && new Date(proj.targetDeadline).setHours(23, 59, 59, 999) < Date.now();

                                if (isOverdue) {
                                  return (
                                    <span
                                      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 shrink-0"
                                      title="Deadline Overdue"
                                    >
                                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                                      <span>{proj.targetDeadline}</span>
                                    </span>
                                  );
                                }
                                if (proj.targetDeadline && proj.targetDeadline !== "No Deadline") {
                                  return (
                                    <span
                                      className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0"
                                      title="Target Deadline"
                                    >
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      <span>{proj.targetDeadline}</span>
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            {/* Right: Assigned Team Avatars Stack & Sleek Arrow */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center -space-x-1.5 shrink-0" title={teamTooltip}>
                                {activeTeamMembers.slice(0, 3).map((m: any, idx: number) => (
                                  <div
                                    key={m.id || idx}
                                    className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-2xs shrink-0"
                                    title={`${m.name} (${m.role || "Developer"})`}
                                  >
                                    {m.name.charAt(0).toUpperCase()}
                                  </div>
                                ))}
                                {activeTeamMembers.length > 3 && (
                                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-2xs shrink-0">
                                    +{activeTeamMembers.length - 3}
                                  </div>
                                )}
                                {activeTeamMembers.length === 0 && (
                                  <span className="text-[10px] text-slate-400 italic">No team</span>
                                )}
                                {!isEmployee && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAssignProjectId(proj.id);
                                      setIsAssignModalOpen(true);
                                    }}
                                    className="w-5 h-5 rounded-full border border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center text-[10px] font-bold transition-colors shrink-0 ml-0.5 cursor-pointer bg-white dark:bg-slate-800"
                                    title="Assign Team Member"
                                  >
                                    +
                                  </button>
                                )}
                              </div>

                              <div className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all">
                                <ArrowRight className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
                );
              })}
            </div>
          </div>
        );
      })()}
          </>
        )}
      </div>

      {/* Assign Developer Modal */}
      {selectedEmployee && (
        <BottomSheet
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assign ${selectedEmployee.name} to Project`}
          subtitle="Link team member to project workspace with active membership."
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Select Project *
              </label>
              <select
                value={assignProjectId}
                onChange={(e) => setAssignProjectId(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
              >
                <option value="">-- Choose Project Workspace --</option>
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectCode || p.projectNumber || p.id.slice(0, 8)}) — {p.clientName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Role in Project *
              </label>
              <select
                value={isCustomRole ? "__CUSTOM__" : assignRole}
                onChange={(e) => {
                  if (e.target.value === "__CUSTOM__") {
                    setIsCustomRole(true);
                  } else {
                    setIsCustomRole(false);
                    setAssignRole(e.target.value);
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
            </div>

            {!isEmployee && (
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                  Compensation (₹ INR, Optional)
                </label>
                <input
                  type="number"
                  value={assignCompensation}
                  onChange={(e) => setAssignCompensation(e.target.value)}
                  placeholder="e.g. 20000"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={assigning}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs touch-target mt-2 flex items-center justify-center gap-2"
            >
              {assigning ? "Assigning..." : `Confirm & Assign to Project`}
            </button>
          </form>
        </BottomSheet>
      )}

      {avatarModalEmployee && (
        <AvatarUploadModal
          isOpen={isAvatarModalOpen}
          onClose={() => {
            setIsAvatarModalOpen(false);
            setAvatarModalEmployee(null);
          }}
          currentAvatarUrl={avatarModalEmployee.avatarUrl}
          userName={avatarModalEmployee.name}
          targetUserId={avatarModalEmployee.userId}
          targetEmployeeId={avatarModalEmployee.id}
          onSuccess={(newUrl) => {
            avatarModalEmployee.avatarUrl = newUrl;
            onRefresh();
          }}
          title={`Update Profile Photo for ${avatarModalEmployee.name}`}
        />
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          project={editingProject}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => {
            setEditingTask(null);
            setEditingTaskProjectId("");
            setEditingTaskTeamMembers([]);
          }}
          task={editingTask}
          projectId={editingTaskProjectId}
          employees={editingTaskTeamMembers}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}
    </div>
    </div>
  );
}
