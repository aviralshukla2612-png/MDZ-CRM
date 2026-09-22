"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Trash2,
  Users,
  LayoutGrid,
  Calendar,
  Edit3,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmployeeProjectKanban } from "@/components/projects/EmployeeProjectKanban";
import { ProjectTaskCalendar } from "@/components/projects/ProjectTaskCalendar";
import { EditProjectModal } from "@/components/projects/EditProjectModal";

export default function ProjectsDirectoryPage() {
  const { showToast } = useToast();
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("HIGH");
  const [contractValue, setContractValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [editingDeadlineProject, setEditingDeadlineProject] = useState<any | null>(null);
  const [newDeadlineVal, setNewDeadlineVal] = useState("");
  const [updatingDeadline, setUpdatingDeadline] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [existingClients, setExistingClients] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<"directory" | "kanban" | "calendar">("directory");
  const [initialEmployeeId, setInitialEmployeeId] = useState<string | undefined>(undefined);
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view");
      const empParam = params.get("employeeId");
      if (viewParam === "calendar") {
        setActiveView("calendar");
      } else if (viewParam === "kanban" || viewParam === "workload") {
        setActiveView("kanban");
      } else if (viewParam === "directory") {
        setActiveView("directory");
      } else if (empParam) {
        setInitialEmployeeId(empParam);
        setActiveView("kanban");
      } else {
        // By default in admin view, all company projects will come
        setActiveView("directory");
      }
    }
    fetchProjects();
    fetchEmployees();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/mdz-crm/api/clients");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setExistingClients(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/mdz-crm/api/employees");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEmployees(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/projects");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProjectsList(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePriority = async (projectId: string, newPriority: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Project urgency updated to ${newPriority}`, "success");
        fetchProjects();
      } else {
        showToast(json.error || "Failed to update project urgency", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating project urgency", "error");
    }
  };

  const executeDelete = async () => {
    if (!projectToDelete) return;
    try {
      const res = await fetch(`/mdz-crm/api/projects/${projectToDelete}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Project deleted successfully", "success");
        fetchProjects(); // Refresh the list
      } else {
        showToast(json.error || "Failed to delete project", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("An unexpected error occurred", "error");
    } finally {
      setProjectToDelete(null);
    }
  };

  const handleSaveDeadline = async (dateVal: string | null) => {
    if (!editingDeadlineProject) return;
    try {
      setUpdatingDeadline(true);
      const res = await fetch(`/mdz-crm/api/projects/${editingDeadlineProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: dateVal }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(dateVal ? `✓ Deadline set to ${new Date(dateVal).toLocaleDateString()}` : "✓ Deadline cleared", "success");
        setEditingDeadlineProject(null);
        fetchProjects();
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/mdz-crm/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          clientName: clientName.trim(),
          contractValue: contractValue ? Number(contractValue) : 0,
          priority,
          status: "PLANNING",
          assigneeId: assigneeId || undefined,
          deadline: deadline || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Project "${projectName || "New Project"}" created successfully`, "success");
        fetchProjects();
        fetchClients();
        setIsAddOpen(false);
        setProjectName("");
        setClientName("");
        setContractValue("");
        setAssigneeId("");
        setDeadline("");
        setPriority("HIGH");
      } else {
        showToast(json.error || "Failed to create project", "error");
      }
    } catch (error) {
      console.error("Create project error:", error);
      showToast("An unexpected network error occurred", "error");
    }
  };

  const pendingAllocationProjects = projectsList.filter(
    (p) => p.status === "PENDING_SUB_ADMIN_ALLOCATION" || p.status === "PENDING_ALLOCATION"
  );
  const isAdminOrSubAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN" || session?.user?.role === "SUB_ADMIN";
  const isEmployee = (session?.user as any)?.role === "EMPLOYEE";

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Projects"
        description="Unified workspace for client project execution, team workloads, and project stages."
        badge={`${projectsList.length} ACTIVE PROJECTS`}
        icon={<FolderKanban className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        }
      />

      {/* SUB ADMIN / SUPER ADMIN ALLOCATION QUEUE */}
      {isAdminOrSubAdmin && pendingAllocationProjects.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30 dark:border-indigo-500/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                ⚡
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Sales Approved by Super Admin</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold">
                    {pendingAllocationProjects.length} Awaiting Sub Admin Allocation
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  These closed deals were approved by Super Admin. Assign employees to activate them and reflect on employee desks.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {pendingAllocationProjects.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {p.projectCode || p.projectNumber}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Needs Team Assignment
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs mt-1 truncate">
                    {p.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Client: <strong>{p.clientName}</strong>
                  </div>
                  {!isEmployee && p.contractValue !== undefined && (
                    <div className="text-[11px] font-mono font-bold text-emerald-600 mt-0.5">
                      ₹{Number(p.contractValue || 0).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>

                <Link
                  href={`/projects/${p.id}`}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Assign Employees & Activate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Switcher Tabs (Odoo Kanban vs Directory) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveView("directory")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === "directory"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>All Company Projects ({projectsList.length})</span>
          </button>

          <button
            onClick={() => setActiveView("kanban")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === "kanban"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Workload</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-extrabold">
              WORKSPACE
            </span>
          </button>

          <button
            onClick={() => setActiveView("calendar")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeView === "calendar"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Task Calendar</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-extrabold">
              PREMIUM
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          {activeView === "calendar" ? (
            <span>Interactive calendar grid showing dated tasks, execution deadlines, and daily agenda.</span>
          ) : activeView === "kanban" ? (
            <span>Select any team member on the left sidebar to inspect and manage their assigned projects.</span>
          ) : (
            <span>Showing all company project workspaces and live weighted execution progress.</span>
          )}
        </div>
      </div>

      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Project"
        subtitle="Provision a project workspace with weighted playbooks."
      >
        <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Project Name</label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Neo Banking Mobile App"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold block">
                Client Company *
              </label>
              {existingClients.length > 0 && (
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                  {existingClients.length} Existing Clients
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                required
                list="client-suggestions-list"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Select from client suggestions or type extra new client..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all pr-10 font-medium"
              />
              <datalist id="client-suggestions-list">
                {existingClients.map((c) => (
                  <option key={c.id} value={c.companyName}>
                    {c.companyName} {c.clientCode ? `(${c.clientCode})` : ""}
                  </option>
                ))}
              </datalist>
              {clientName && (
                <button
                  type="button"
                  onClick={() => setClientName("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                  title="Clear client name"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Existing Clients Suggestion Chips */}
            {existingClients.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <span>Suggestions:</span>
                  <span className="text-slate-500 font-normal lowercase">(click to select)</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {existingClients.map((c) => {
                    const isSelected = clientName.trim().toLowerCase() === c.companyName.toLowerCase();
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setClientName(c.companyName)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs scale-95"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-200/80"
                        }`}
                      >
                        <span className="text-xs">🏢</span>
                        <span>{c.companyName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extra Client Creation Indicator */}
            {clientName.trim() && (
              <div className="mt-2">
                {existingClients.some(
                  (c) => c.companyName.toLowerCase() === clientName.trim().toLowerCase()
                ) ? (
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                    <span>✓</span>
                    <span>
                      Existing Client: Linked to <strong>{clientName.trim()}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 font-medium">
                    <span>✨</span>
                    <span>
                      Extra / New Client: A new client record for &ldquo;<strong>{clientName.trim()}</strong>&rdquo; will be created automatically.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Productivity Matrix Quadrant</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-semibold"
            >
              <option value="URGENT">Q1: Fire Fighting (Urgent & Important)</option>
              <option value="HIGH">Q2: Productive Time (Important & Not Urgent)</option>
              <option value="MEDIUM">Q3: Distraction (Urgent & Not Important)</option>
              <option value="LOW">Q4: Down Time (Not Urgent & Not Important)</option>
            </select>
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5 flex items-center justify-between">
              <span>Target Deadline</span>
              <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">Optional (Admin / Sub Admin)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Leave blank if no deadline is set yet. Automatic deadlines will not be selected.
            </p>
          </div>
          {!isEmployee && (
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5 flex items-center justify-between">
                <span>Contract / Deal Value (₹)</span>
                <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">Optional (Defaults to ₹0)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 150000 (leave blank for ₹0)"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium text-sm"
              />
            </div>
          )}
          {(session?.user as any)?.role !== "EMPLOYEE" && (
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Assign To Developer</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
              >
                <option value="">-- Leave Unassigned --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || "Employee"} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-2"
          >
            Provision Project Workspace
          </button>
        </form>
      </BottomSheet>

      {/* Main Content: Either Calendar, Odoo Kanban Split View or Directory List */}
      {activeView === "calendar" ? (
        <ProjectTaskCalendar
          allProjects={projectsList}
          employees={employees}
          onRefresh={() => {
            fetchProjects();
            fetchEmployees();
          }}
          selectedEmployeeId={initialEmployeeId}
        />
      ) : activeView === "kanban" ? (
        <EmployeeProjectKanban
          employees={employees}
          allProjects={projectsList}
          onRefresh={() => {
            fetchProjects();
            fetchEmployees();
          }}
          initialSelectedEmployeeId={initialEmployeeId}
        />
      ) : loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading active project workspaces from database...</div>
      ) : (
        <div className="space-y-4">
          {projectsList.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-7 shadow-xs dark:shadow-2xl hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-200 space-y-4 group"
            >
              {/* Row 1: Title & Health Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                      {p.projectCode || p.id}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">🏢 {p.clientName}</span>
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {p.name}
                  </h3>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <span className="text-sm font-mono font-extrabold text-indigo-600 dark:text-indigo-400">{p.progress || 0}% Complete</span>
                  {(session?.user as any)?.role === "OWNER" || (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SALES" ? (
                    <select
                      value={p.priority || "HIGH"}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleUpdatePriority(p.id, e.target.value)}
                      className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider outline-none cursor-pointer border ${
                        p.priority === "URGENT"
                          ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                          : p.priority === "HIGH"
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                          : p.priority === "MEDIUM"
                          ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
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
                      className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                        p.priority === "URGENT"
                          ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                          : p.priority === "HIGH"
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                          : p.priority === "MEDIUM"
                          ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {p.priority === "URGENT"
                        ? "Q1: Fire Fighting"
                        : p.priority === "HIGH"
                        ? "Q2: Productive Time"
                        : p.priority === "MEDIUM"
                        ? "Q3: Distraction"
                        : "Q4: Down Time"}
                    </span>
                  )}
                  {/* Edit Project Button for Admins/Sub-Admins/Sales */}
                  {((session?.user as any)?.role === "OWNER" ||
                    (session?.user as any)?.role === "ADMIN" ||
                    (session?.user as any)?.role === "SUB_ADMIN" ||
                    (session?.user as any)?.role === "SALES") && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingProject(p);
                      }}
                      className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                      title="Edit Project Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {(session?.user as any)?.role === "OWNER" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProjectToDelete(p.id);
                      }}
                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${p.progress || 0}%` }}
                />
              </div>

              {/* Row 2: TM info, Deadline & Navigation Arrow */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 font-medium">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>TM: <strong className="text-slate-800 dark:text-slate-200">{p.tmName || "Unassigned"}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <span>Deadline:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{p.deadline || "No Deadline"}</strong>
                    {isAdminOrSubAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingDeadlineProject(p);
                          setNewDeadlineVal(p.targetDeadline ? p.targetDeadline.slice(0, 10) : "");
                        }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1"
                        title="Set or update deadline"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>{p.deadline ? "Edit" : "Add Date"}</span>
                      </button>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Open Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      <ConfirmModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={executeDelete}
        title="Delete Project Workspace"
        message="Are you completely sure you want to permanently delete this project? This action will destroy all related tasks, documents, and payment histories. This cannot be undone."
        confirmText="Yes, delete project"
        isDestructive={true}
      />

      {/* Admin & Sub Admin Quick Deadline Edit Modal */}
      <BottomSheet
        isOpen={!!editingDeadlineProject}
        onClose={() => setEditingDeadlineProject(null)}
        title="Manage Project Deadline"
        subtitle={`Set or update target deadline for ${editingDeadlineProject?.name || "Project"}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Target Deadline Date
            </label>
            <input
              type="date"
              value={newDeadlineVal}
              onChange={(e) => setNewDeadlineVal(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Select a date and click Save, or Clear to remove the deadline completely.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              disabled={updatingDeadline || !newDeadlineVal}
              onClick={() => handleSaveDeadline(newDeadlineVal)}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {updatingDeadline ? "Saving..." : "Save Deadline"}
            </button>
            {editingDeadlineProject?.deadline && (
              <button
                type="button"
                disabled={updatingDeadline}
                onClick={() => handleSaveDeadline(null)}
                className="py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all disabled:opacity-50"
              >
                Clear Deadline
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditingDeadlineProject(null)}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          project={editingProject}
          onSuccess={() => {
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}
