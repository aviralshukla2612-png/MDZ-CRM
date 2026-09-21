"use client";

import React, { useState, useEffect } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import { FolderKanban, Save, Sparkles, Building, Calendar, IndianRupee } from "lucide-react";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onSuccess: () => void;
}

export function EditProjectModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: EditProjectModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [priority, setPriority] = useState("HIGH");
  const [contractValue, setContractValue] = useState("");
  const [targetDeadline, setTargetDeadline] = useState("");
  const [stagingUrl, setStagingUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [designUrl, setDesignUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setStatus(project.status || "IN_PROGRESS");
      setPriority(project.priority || "HIGH");
      setContractValue(project.contractValue !== undefined && project.contractValue !== null ? String(project.contractValue) : "");
      
      const dl = project.targetDeadline || project.deadline;
      if (dl && !isNaN(new Date(dl).getTime())) {
        setTargetDeadline(new Date(dl).toISOString().slice(0, 10));
      } else {
        setTargetDeadline("");
      }

      setStagingUrl(project.stagingUrl || "");
      setLiveUrl(project.liveUrl || "");
      setDesignUrl(project.designUrl || "");
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Project Name is required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/mdz-crm/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          status,
          priority,
          contractValue: contractValue ? parseFloat(contractValue) : undefined,
          targetDeadline: targetDeadline ? new Date(targetDeadline).toISOString() : null,
          stagingUrl: stagingUrl.trim() || null,
          liveUrl: liveUrl.trim() || null,
          designUrl: designUrl.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || "Failed to update project", "error");
        return;
      }

      showToast("✓ Project details updated successfully!", "success");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Edit Project Error:", err);
      showToast("Network error updating project.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Project Workspace"
      subtitle={`Modify parameters, status, and deadlines for ${project?.name || "Project"}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Project Code & Client info badge */}
        <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
              {project?.projectCode || project?.projectNumber || project?.id}
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              🏢 {project?.clientName || project?.client?.companyName || "Client"}
            </span>
          </div>
        </div>

        {/* Project Name */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
            Project Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Website Redesign"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        {/* Status & Priority Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
              Project Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
            >
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_SUB_ADMIN_ALLOCATION">Pending Team Allocation</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="INCOMPLETE">Incomplete</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
              Quadrant Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
            >
              <option value="URGENT">Q1: Fire Fighting (Urgent & Important)</option>
              <option value="HIGH">Q2: Productive Time (Important & Not Urgent)</option>
              <option value="MEDIUM">Q3: Distraction (Urgent & Not Important)</option>
              <option value="LOW">Q4: Down Time (Not Urgent & Not Important)</option>
            </select>
          </div>
        </div>

        {/* Deadline & Budget Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Target Deadline</span>
            </label>
            <input
              type="date"
              value={targetDeadline}
              onChange={(e) => setTargetDeadline(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
              <span>Contract Value (₹)</span>
            </label>
            <input
              type="number"
              value={contractValue}
              onChange={(e) => setContractValue(e.target.value)}
              placeholder="e.g. 150000"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium font-mono"
            />
          </div>
        </div>

        {/* URLs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
              Staging / Preview URL
            </label>
            <input
              type="text"
              value={stagingUrl}
              onChange={(e) => setStagingUrl(e.target.value)}
              placeholder="https://staging.domain.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
              Production / Live URL
            </label>
            <input
              type="text"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://clientdomain.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Description / Scope */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
            Project Description / Scope Notes
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief scope summary or client deliverables..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 resize-none font-medium"
          />
        </div>

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
            <span>{submitting ? "Saving..." : "Save Project Changes"}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
