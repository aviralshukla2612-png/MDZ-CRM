"use client";

import React, { useState, useEffect } from "react";
import { X, Send, AlertCircle, CheckCircle2, Plus, Trash2, Layers } from "lucide-react";

export interface ProjectOption {
  id: string;
  name: string;
  projectNumber?: string;
  projectCode?: string;
  clientName?: string;
}

interface DailyProgressEntryModalProps {
  projectId?: string;
  projectName?: string;
  projects?: ProjectOption[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DailyProgressEntryModal({
  projectId: initialProjectId,
  projectName: initialProjectName,
  projects = [],
  isOpen,
  onClose,
  onSuccess,
}: DailyProgressEntryModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || "");
  const [title, setTitle] = useState("");
  // Number-wise task points instead of a single paragraph
  const [taskPoints, setTaskPoints] = useState<string[]>(["", "", ""]);
  const [additionalNote, setAdditionalNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    } else if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [initialProjectId, projects, selectedProjectId]);

  if (!isOpen) return null;

  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const displayProjectName =
    initialProjectName || currentProject?.name || "Selected Project";

  const handlePointChange = (index: number, val: string) => {
    setTaskPoints((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleAddPoint = () => {
    setTaskPoints((prev) => [...prev, ""]);
  };

  const handleRemovePoint = (index: number) => {
    if (taskPoints.length <= 1) return;
    setTaskPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetProjId = selectedProjectId || initialProjectId;
    if (!targetProjId) {
      setError("Please select a project for this update.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title for today's update.");
      return;
    }

    const validPoints = taskPoints
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (validPoints.length === 0) {
      setError("Please add at least 1 numbered task item.");
      return;
    }

    // Format number-wise items cleanly
    const formattedPoints = validPoints
      .map((pt, idx) => `${idx + 1}. ${pt}`)
      .join("\n");

    const fullContent = additionalNote.trim()
      ? `${formattedPoints}\n\nNote: ${additionalNote.trim()}`
      : formattedPoints;

    setLoading(true);

    try {
      const res = await fetch(`/mdz-crm/api/client/projects/${targetProjId}/daily-updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: fullContent,
          tasks: validPoints,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to post daily update.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTitle("");
        setTaskPoints(["", "", ""]);
        setAdditionalNote("");
        setLoading(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1100);
    } catch (err) {
      console.error(err);
      setError("An unexpected network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Post Daily Progress Update</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Structured number-wise work log visible to both <strong>Client</strong> & <strong>Admin</strong>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>✓ Daily update published to Client & Admin successfully!</span>
            </div>
          )}

          {/* Project Selection (Dropdown if multiple projects available) */}
          {projects.length > 0 && !initialProjectId && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Select Project *</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.projectCode || p.projectNumber ? `(${p.projectCode || p.projectNumber})` : ""} {p.clientName ? `— ${p.clientName}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If project is pre-selected */}
          {initialProjectId && (
            <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Target Project:</span>
              <span className="font-extrabold text-indigo-700 dark:text-indigo-300">{displayProjectName}</span>
            </div>
          )}

          {/* Update Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Update Title / Subject *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Day 14: Completed auth APIs & fixed mobile Kanban layout"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* NUMBER-WISE TASK UPDATES (NOT paragraph!) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>Number-Wise Task Items *</span>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-normal">
                  (Numbered list, not paragraph)
                </span>
              </label>
              <button
                type="button"
                onClick={handleAddPoint}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Point</span>
              </button>
            </div>

            <div className="space-y-2">
              {taskPoints.map((point, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-7 h-7 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800 font-mono">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handlePointChange(index, e.target.value)}
                    placeholder={`Point ${index + 1}: e.g. Finished user profile settings and password change form...`}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {taskPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(index)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Remove Point"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddPoint}
              className="w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Point {taskPoints.length + 1}</span>
            </button>
          </div>

          {/* Optional Additional Note */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Additional Staging Link or Note (Optional)
            </label>
            <input
              type="text"
              value={additionalNote}
              onChange={(e) => setAdditionalNote(e.target.value)}
              placeholder="e.g. Staging build updated at staging.millionairedizital.com"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 active:scale-95 touch-target"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Publishing..." : "Publish Daily Update"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
