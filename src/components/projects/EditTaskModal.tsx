"use client";

import React, { useState, useEffect } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import { CheckCircle2, Save, Calendar, User, Star, AlertCircle, FileText } from "lucide-react";

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
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("PLANNING");
  const [priority, setPriority] = useState("HIGH");
  const [assignedToId, setAssignedToId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isMostImportant, setIsMostImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      
      let initialStatus = task.status || "PLANNING";
      if (initialStatus === "IN_PROGRESS") initialStatus = "CURRENT";
      if (initialStatus === "DONE") initialStatus = "COMPLETED";
      if (initialStatus === "ON_HOLD") initialStatus = "REVISION";
      setStatus(initialStatus);

      setPriority(task.priority || "HIGH");
      setAssignedToId(task.assignedToId || task.assignedTo?.id || "");
      
      if (task.deadline && !isNaN(new Date(task.deadline).getTime())) {
        setDeadline(new Date(task.deadline).toISOString().slice(0, 10));
      } else {
        setDeadline("");
      }

      setIsMostImportant(Boolean(task.isMostImportant));
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Task Title is required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const targetProjectId = projectId || task?.projectId;
      const res = await fetch(`/mdz-crm/api/projects/${targetProjectId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          assignedToId: assignedToId || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          isMostImportant,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || "Failed to update task", "error");
        return;
      }

      showToast("✓ Task updated successfully!", "success");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Edit Task Error:", err);
      showToast("Network error updating task.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Daily Task / Work Item"
      subtitle={`Modify task assignment, priority, and status for ${task?.title ? `"${task.title}"` : "Task"}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Task Code & Context */}
        <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
              Task ID: {task?.id?.slice(0, 8)}
            </span>
          </div>
          {isMostImportant && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
              ⭐ MOST IMPORTANT TASK
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

        {/* Assignee Dropdown */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-indigo-500" />
            <span>Assigned Team Member</span>
          </label>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
          >
            <option value="">-- Unassigned --</option>
            {employees.map((emp: any) => (
              <option key={emp.id} value={emp.id}>
                {emp.name || emp.user?.name || "Employee"} ({emp.designation || emp.role || "Developer"})
              </option>
            ))}
          </select>
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
            <span>Task Due Date / Deadline</span>
          </label>
          <input
            type="date"
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
        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 cursor-pointer">
          <input
            type="checkbox"
            checked={isMostImportant}
            onChange={(e) => setIsMostImportant(e.target.checked)}
            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
          />
          <div className="text-xs">
            <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
              <span>⭐ Mark as Most Important Task</span>
            </div>
            <div className="text-[10px] text-amber-700 dark:text-amber-400">
              Pins this task to the top of the developer's daily focus queue.
            </div>
          </div>
        </label>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{submitting ? "Saving..." : "Save Task Changes"}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
