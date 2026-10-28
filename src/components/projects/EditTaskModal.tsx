"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import { CheckCircle2, Save, Calendar, User, Star, AlertCircle, Sparkles } from "lucide-react";

export interface NormalizedEmployeeOption {
  value: string; // The User ID used for DB relation
  userId: string;
  name: string;
  designation: string;
  email?: string;
  isProjectMember?: boolean;
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  projectId: string;
  employees?: any[];
  onSuccess: () => void;
}

export function EditTaskModal({
  isOpen,
  onClose,
  task,
  projectId,
  employees = [],
  onSuccess,
}: EditTaskModalProps) {
  const { data: session } = useSession();
  const userRole = ((session?.user as any)?.role || (session?.user as any)?.activeRole || "").toUpperCase();
  const isAdminOrOwner = ["OWNER", "ADMIN", "SUB_ADMIN", "SALES"].includes(userRole);

  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("PLANNING");
  const [priority, setPriority] = useState("HIGH");
  const [assignedToId, setAssignedToId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isMostImportant, setIsMostImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [allCompanyEmployees, setAllCompanyEmployees] = useState<any[]>([]);

  // Fetch all company employees in background so reassignment can select ANY employee
  useEffect(() => {
    if (!isOpen) return;
    const targetProjectId = projectId || task?.projectId;
    if (targetProjectId) {
      fetch(`/mdz-crm/api/projects/${targetProjectId}/members`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.availableEmployees)) {
            setAllCompanyEmployees(data.availableEmployees);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, projectId, task?.projectId]);

  // Build unified, deduplicated list of selectable assignees
  const assigneeOptions = useMemo<NormalizedEmployeeOption[]>(() => {
    const map = new Map<string, NormalizedEmployeeOption>();

    // 1. Process passed employees prop (usually project members)
    (employees || []).forEach((emp: any) => {
      const uId = emp.userId || emp.user?.id || (emp.employee ? emp.employee.userId : null) || emp.id;
      if (!uId) return;
      const name = emp.name || emp.user?.name || "Team Member";
      const desig = emp.designation || emp.role || emp.user?.designation || "Developer";
      map.set(uId, {
        value: uId,
        userId: uId,
        name,
        designation: desig,
        email: emp.email || emp.user?.email,
        isProjectMember: true,
      });
    });

    // 2. Process all company employees
    (allCompanyEmployees || []).forEach((emp: any) => {
      const uId = emp.userId || emp.user?.id || (emp.employee ? emp.employee.userId : null) || emp.id;
      if (!uId) return;
      if (!map.has(uId)) {
        map.set(uId, {
          value: uId,
          userId: uId,
          name: emp.name || emp.user?.name || "Employee",
          designation: emp.designation || emp.role || "Developer",
          email: emp.email || emp.user?.email,
          isProjectMember: false,
        });
      }
    });

    // 3. Ensure current assignee from task is present in options
    if (task?.assignedTo?.id && !map.has(task.assignedTo.id)) {
      map.set(task.assignedTo.id, {
        value: task.assignedTo.id,
        userId: task.assignedTo.id,
        name: task.assignedTo.name || "Current Assignee",
        designation: task.assignedTo.designation || "Assignee",
        isProjectMember: true,
      });
    }

    return Array.from(map.values());
  }, [employees, allCompanyEmployees, task]);

  // Initialize form state when modal opens or task changes
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || "");
      setDescription(task.description || "");

      let initialStatus = task.status || "PLANNING";
      if (initialStatus === "IN_PROGRESS") initialStatus = "CURRENT";
      if (initialStatus === "DONE") initialStatus = "COMPLETED";
      if (initialStatus === "ON_HOLD") initialStatus = "REVISION";
      setStatus(initialStatus);

      setPriority(task.priority || "HIGH");

      // Robust assignee matching across userId, employeeId, and raw assignedToId
      const targetId = task.assignedToId || task.assignedTo?.id || "";
      if (targetId) {
        // Find if this targetId matches any known option
        const matched = assigneeOptions.find(
          (opt) =>
            opt.value === targetId ||
            opt.userId === targetId ||
            (employees || []).some(
              (e: any) =>
                (e.id === targetId || e.employeeId === targetId || e.userId === targetId) &&
                (e.userId === opt.value || e.id === opt.value)
            )
        );
        setAssignedToId(matched ? matched.value : targetId);
      } else {
        setAssignedToId("");
      }

      if (task.deadline && !isNaN(new Date(task.deadline).getTime())) {
        setDeadline(new Date(task.deadline).toISOString().slice(0, 10));
      } else {
        setDeadline("");
      }

      setIsMostImportant(Boolean(task.isMostImportant));
    }
  }, [task, isOpen, assigneeOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Task Title is required.", "error");
      return;
    }

    if (!deadline) {
      showToast("Task Due Date / Deadline is compulsory.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const targetProjectId = projectId || task?.projectId;
      const patchBody: any = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        assignedToId: assignedToId ? assignedToId.trim() : null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      };

      if (isAdminOrOwner) {
        patchBody.isMostImportant = isMostImportant;
      } else if (isMostImportant !== Boolean(task.isMostImportant)) {
        showToast("Only Admin or Owner can set or modify Most Important Task status", "error");
        setSubmitting(false);
        return;
      }

      const res = await fetch(`/mdz-crm/api/projects/${targetProjectId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || "Failed to update task", "error");
        return;
      }

      const assignedPersonName = assigneeOptions.find((o) => o.value === assignedToId)?.name;
      if (assignedToId && assignedPersonName) {
        showToast(`✓ Task reassigned to ${assignedPersonName}!`, "success");
      } else if (!assignedToId) {
        showToast("✓ Task unassigned & updated successfully!", "success");
      } else {
        showToast("✓ Task updated successfully!", "success");
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Edit Task Error:", err);
      showToast("Network error updating task.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const currentSelectedAssignee = assigneeOptions.find((o) => o.value === assignedToId);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Task & Reassign Member"
      subtitle={`Modify task assignment, priority, and schedule for ${task?.title ? `"${task.title}"` : "Task"}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Task Code & Context Banner */}
        <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
              Task ID: {task?.id?.slice(0, 8)}
            </span>
            {currentSelectedAssignee ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 flex items-center gap-1">
                <User className="w-2.5 h-2.5" />
                <span>{currentSelectedAssignee.name}</span>
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Unassigned
              </span>
            )}
          </div>
          {isMostImportant && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
              ⭐ MOST IMPORTANT
            </span>
          )}
        </div>

        {/* Task Title */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design Landing Page Hero Section"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        {/* Assignee / Reassignment Dropdown */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>Assigned Developer / Employee</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              Reassign to change active assignee
            </span>
          </label>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
          >
            <option value="">-- Unassigned --</option>
            {assigneeOptions.map((emp) => (
              <option key={emp.value} value={emp.value}>
                {emp.name} — {emp.designation} {emp.isProjectMember ? "★ (Project Team)" : ""}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            Selecting a team member immediately reassigns the task and sends them a notification.
          </p>
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
              Task Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
            >
              <option value="PLANNING">📋 Planning / Backlog</option>
              <option value="CURRENT">⚡ Current / In Progress</option>
              <option value="REVISION">🔄 Revision / On Hold</option>
              <option value="COMPLETED">✅ Completed</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
              Task Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
            >
              <option value="URGENT">🔥 Urgent</option>
              <option value="HIGH">⚡ High Priority</option>
              <option value="MEDIUM">📌 Medium Priority</option>
              <option value="LOW">☕ Low Priority</option>
            </select>
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Task Due Date / Deadline <span className="text-rose-500">*</span></span>
          </label>
          <input
            type="date"
            required
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        {/* Description / Task Notes */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
            Task Description & Details
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed instructions or specifications for the assigned employee..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 resize-none font-medium"
          />
        </div>

        {/* Priority Star Checkbox */}
        <label className={`flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 ${isAdminOrOwner ? "cursor-pointer" : "opacity-75 cursor-not-allowed"}`}>
          <input
            type="checkbox"
            checked={isMostImportant}
            disabled={!isAdminOrOwner}
            onChange={(e) => setIsMostImportant(e.target.checked)}
            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
          />
          <div className="text-xs">
            <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
              <span>⭐ Mark as Most Important Task</span>
              {!isAdminOrOwner && <span className="text-[10px] text-amber-600 font-normal">(Admin / Owner only)</span>}
            </div>
            <div className="text-[10px] text-amber-700 dark:text-amber-400">
              Pins this task to the top of the developer's daily focus queue.
            </div>
          </div>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{submitting ? "Saving..." : "Save & Reassign Task"}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
