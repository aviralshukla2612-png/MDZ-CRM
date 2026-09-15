"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";

export interface ProjectCardItem {
  id: string;
  projectNumber: string;
  name: string;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | string;
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
  tasks?: Array<{ id: string; title: string; status: string; priority: string }>;
}

export interface EmployeeWorkload {
  id: string;
  employeeId: string;
  name: string;
  email: string;
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
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    initialSelectedEmployeeId || (employees.length > 0 ? employees[0].id : "ALL")
  );

  // Drag and Drop state
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [optimisticProjects, setOptimisticProjects] = useState<ProjectCardItem[] | null>(null);

  // Modal to assign current employee to a project
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignProjectId, setAssignProjectId] = useState("");
  const [assignRole, setAssignRole] = useState("DEVELOPER");
  const [assignCompensation, setAssignCompensation] = useState("");
  const [assigning, setAssigning] = useState(false);

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

  // Active selected employee
  const selectedEmployee = useMemo(() => {
    if (selectedEmployeeId === "ALL") return null;
    return employees.find((e) => e.id === selectedEmployeeId) || employees[0] || null;
  }, [employees, selectedEmployeeId]);

  // Projects to display in the Kanban board
  const displayedProjects = useMemo(() => {
    let projs: ProjectCardItem[] = [];
    if (selectedEmployee) {
      projs = (selectedEmployee.assignedProjects || []).map((p) => ({
        ...p,
        assignedEmployeeId: selectedEmployee.id,
      }));
    } else {
      const map = new Map<string, ProjectCardItem>();
      employees.forEach((emp) => {
        emp.assignedProjects?.forEach((p) => {
          if (!map.has(p.id)) {
            map.set(p.id, { ...p, assignedEmployeeId: emp.id });
          }
        });
      });
      projs = Array.from(map.values());
    }
    return projs;
  }, [selectedEmployee, employees]);

  // Sync optimistic projects when displayedProjects changes
  useEffect(() => {
    setOptimisticProjects(null);
  }, [displayedProjects]);

  const projectsToRender = optimisticProjects || displayedProjects;

  // Handle Drag & Drop status change
  const handleDropProject = async (projectId: string, targetStage: string) => {
    const proj = projectsToRender.find((p) => p.id === projectId);
    if (!proj) return;

    const currentStage = (proj.status || "PLANNING").toUpperCase();
    if (currentStage === targetStage) return;

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

  // Handle reassigning developer directly from project card dropdown
  const handleReassignProject = async (projectId: string, newEmployeeId: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: newEmployeeId,
          roleInProject: "DEVELOPER",
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Assigned developer to project successfully!", "success");
        onRefresh();
      } else {
        showToast(json.error || "Failed to assign developer", "error");
      }
    } catch (e) {
      showToast("Network error assigning developer", "error");
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !assignProjectId) {
      showToast("Please select a project", "error");
      return;
    }

    try {
      setAssigning(true);
      const res = await fetch(`/mdz-crm/api/projects/${assignProjectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          roleInProject: assignRole,
          compensationAmount: assignCompensation ? Number(assignCompensation) : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Assigned employee to project successfully!", "success");
        setIsAssignModalOpen(false);
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
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      {/* LEFT SIDEBAR: Master Employee List (Odoo Style) */}
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
              ODOO KANBAN
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search developer, role..."
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
                    👤 {emp.name} ({emp.totalProjects !== undefined ? emp.totalProjects : emp.assignedProjects?.length || 0} Projects) — {emp.designation || "Developer"}
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

      {/* RIGHT MAIN AREA: Employee Details Header + Kanban Columns */}
      <div className="flex-1 w-full space-y-5 min-w-0">
        {/* Selected Employee Summary Card */}
        {selectedEmployee ? (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-600/25">
                  {selectedEmployee.name[0]?.toUpperCase()}
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
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {selectedEmployee.shiftCompleted ? "Shift Done" : "Offline"}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    {selectedEmployee.designation || "Developer"} • {selectedEmployee.department || "Engineering"}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3 mt-1 font-mono">
                    <span>📧 {selectedEmployee.email}</span>
                    <span>📞 {selectedEmployee.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
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
                Showing all active projects across all {employees.length} developers. Drag cards to update statuses.
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

        {/* DRAG AND DROP INSTRUCTION BANNER */}
        <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong>Drag & Drop Enabled:</strong> Drag any project card between stages (Planning, In Progress, On Hold, Won) to instantly update its status.
            </span>
          </div>
          <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0 hidden sm:inline">
            Drag card to column
          </span>
        </div>

        {/* KANBAN BOARD (Columns by Status with Drop Zones) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colProjects = projectsToRender.filter((p) => {
              const s = (p.status || "").toUpperCase();
              if (col.id === "PLANNING") return s === "PLANNING" || s === "DRAFT" || s === "";
              if (col.id === "IN_PROGRESS") return s === "IN_PROGRESS" || s === "ACTIVE";
              if (col.id === "ON_HOLD") return s === "ON_HOLD" || s === "PAUSED" || s === "BLOCKED";
              if (col.id === "COMPLETED") return s === "COMPLETED" || s === "DONE" || s === "DELIVERED" || s === "WON";
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
                  if (pId) {
                    handleDropProject(pId, col.id);
                  }
                }}
                className="bg-slate-100/70 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 space-y-3 flex flex-col min-h-[440px] transition-all"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      col.id === "IN_PROGRESS"
                        ? "bg-indigo-500 animate-pulse"
                        : col.id === "COMPLETED"
                        ? "bg-emerald-500"
                        : col.id === "ON_HOLD"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    }`} />
                    <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {col.title}
                    </h3>
                  </div>

                  <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${col.badgeBg}`}>
                    {colProjects.length}
                  </span>
                </div>

                {/* Total Value Summary for column */}
                {totalVal > 0 && (
                  <div className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 px-1">
                    Value: ₹{totalVal.toLocaleString("en-IN")}
                  </div>
                )}

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-1">
                  {colProjects.length === 0 ? (
                    <div className="h-40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs space-y-1">
                      <span>No projects in this stage</span>
                      <span className="text-[10px] text-slate-400/80">Drop cards here to change stage</span>
                    </div>
                  ) : (
                    colProjects.map((proj) => {
                      const priorityColor =
                        proj.priority === "URGENT"
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200"
                          : proj.priority === "HIGH"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200";

                      const isLeadRole = proj.roleInProject === "TM";
                      const isBeingDragged = draggedProjectId === proj.id;

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
                          className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs hover:shadow-md hover:border-indigo-500/50 transition-all space-y-3 group cursor-grab active:cursor-grabbing ${
                            isBeingDragged ? "opacity-30 scale-95 border-dashed border-indigo-500" : ""
                          }`}
                        >
                          {/* Top Badges & Drag Handle */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
                              <span
                                className={`text-[9px] font-extrabold font-mono px-2 py-0.5 rounded-md border ${priorityColor}`}
                              >
                                {proj.priority}
                              </span>
                            </div>

                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                                isLeadRole
                                  ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                  : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                              }`}
                            >
                              {isLeadRole ? "⭐ TECH LEAD (TM)" : proj.roleInProject || "DEVELOPER"}
                            </span>
                          </div>

                          {/* Project Name & Code */}
                          <div className="space-y-1">
                            <div className="text-[10px] font-mono text-slate-400 font-bold">
                              {proj.projectNumber || proj.id.slice(0, 8)}
                            </div>
                            <Link
                              href={`/projects/${proj.id}`}
                              className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block line-clamp-2"
                            >
                              {proj.name}
                            </Link>
                          </div>

                          {/* Client Company */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">
                            <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{proj.clientName}</span>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono font-bold">
                              <span className="text-slate-500">Progress</span>
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {proj.progress || proj.progressPercentage || 0}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all"
                                style={{
                                  width: `${proj.progress || proj.progressPercentage || 0}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Assignee Selection Dropdown on Project Card */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] gap-2">
                            <span className="text-slate-500 font-semibold text-[10px] flex items-center gap-1 shrink-0">
                              <User className="w-3 h-3 text-indigo-500" />
                              <span>Assign:</span>
                            </span>
                            <select
                              value={proj.assignedEmployeeId || selectedEmployee?.id || ""}
                              onChange={(e) => handleReassignProject(proj.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer max-w-[140px] truncate"
                              title="Reassign to developer"
                            >
                              <option value="" disabled>-- Developer --</option>
                              {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Tasks summary & Deadline */}
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>{proj.completedTasks}/{proj.totalTasks} Tasks</span>
                            </span>

                            <span>{proj.targetDeadline || "No Deadline"}</span>
                          </div>

                          {/* Action Footer */}
                          <div className="pt-1">
                            <Link
                              href={`/projects/${proj.id}`}
                              className="w-full py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5"
                            >
                              <span>Open Workspace</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
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

      {/* Assign Developer Modal */}
      {selectedEmployee && (
        <BottomSheet
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assign ${selectedEmployee.name} to Project`}
          subtitle="Link developer to project workspace with active membership."
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
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value)}
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
            </div>

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
    </div>
  );
}
