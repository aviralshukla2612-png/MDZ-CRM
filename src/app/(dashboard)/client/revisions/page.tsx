"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GitPullRequest,
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FolderKanban,
  Calendar,
  Send,
  X,
  ArrowRight,
  Edit3,
} from "lucide-react";

interface ChangeRequestItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
}

interface ChangeRequestRecord {
  id: string;
  requestNumber: string;
  originalRequirement: string;
  requestedChange: string;
  reason: string | null;
  status: string;
  isQuotaIncluded: boolean;
  requestSeqInt: number;
  costImpactAmount: number;
  createdAt: string;
  items: ChangeRequestItem[];
}

interface ProjectQuota {
  includedCount: number;
  usedCount: number;
  remainingCount: number;
}

interface ClientProject {
  id: string;
  projectNumber: string;
  name: string;
  changeRequests: ChangeRequestRecord[];
  quota: ProjectQuota;
}

export default function ClientRevisionsPage() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCr, setEditingCr] = useState<ChangeRequestRecord | null>(null);
  const [crTitle, setCrTitle] = useState("");
  const [crDescription, setCrDescription] = useState("");
  const [crItems, setCrItems] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCr(null);
    setCrTitle("");
    setCrDescription("");
    setCrItems([""]);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cr: ChangeRequestRecord) => {
    setEditingCr(cr);
    setCrTitle(cr.originalRequirement);
    setCrDescription(cr.requestedChange || "");
    setCrItems(cr.items && cr.items.length > 0 ? cr.items.map((i) => i.title) : [""]);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  async function fetchProjects() {
    try {
      const res = await fetch("/mdz-crm/api/client/projects");
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to load project revisions.");
      } else {
        const projs = data.projects || [];
        setProjects(projs);
        if (projs.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projs[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Network error occurred while fetching revisions data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleAddCrItem = () => {
    setCrItems([...crItems, ""]);
  };

  const handleCrItemChange = (index: number, val: string) => {
    const updated = [...crItems];
    updated[index] = val;
    setCrItems(updated);
  };

  const handleRemoveCrItem = (index: number) => {
    if (crItems.length === 1) return;
    setCrItems(crItems.filter((_, i) => i !== index));
  };

  const handleSubmitChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setSubmitError("Please select a project.");
      return;
    }

    if (!crTitle.trim()) {
      setSubmitError("Please provide a title for the requested change.");
      return;
    }

    const filteredItems = crItems.map((i) => i.trim()).filter(Boolean);
    if (filteredItems.length === 0) {
      setSubmitError("Please add at least one specific change item.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const method = editingCr ? "PATCH" : "POST";
      const payload = editingCr
        ? {
            changeRequestId: editingCr.id,
            title: crTitle.trim(),
            description: crDescription.trim() || crTitle.trim(),
            items: filteredItems.map((title) => ({ title })),
          }
        : {
            title: crTitle.trim(),
            description: crDescription.trim() || crTitle.trim(),
            items: filteredItems.map((title) => ({ title })),
          };

      const res = await fetch(
        `/mdz-crm/api/client/projects/${selectedProjectId}/change-requests`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || "Failed to submit change request.");
      } else {
        setSubmitSuccess(
          editingCr
            ? "Change request updated successfully!"
            : "Change request successfully submitted! Both assigned developers and administrators have been notified."
        );
        setCrTitle("");
        setCrDescription("");
        setCrItems([""]);
        setEditingCr(null);
        setIsModalOpen(false);
        await fetchProjects();
        setTimeout(() => setSubmitSuccess(null), 5000);
      }
    } catch (err) {
      setSubmitError("Network error while submitting change request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  const usedRevisions = activeProject?.quota?.usedCount || 0;
  const remainingRevisions =
    activeProject?.quota?.remainingCount ?? Math.max(0, 3 - usedRevisions);
  const changeRequestsList = activeProject?.changeRequests || [];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              CLIENT WORKSPACE
            </span>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              3 INCLUDED REVISIONS POLICY
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <GitPullRequest className="w-7 h-7 text-amber-500" />
            <span>Project Revisions & Change Requests</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit modifications and scope adjustments. Each submission instantly alerts your developer team and account director.
          </p>
        </div>

        {activeProject && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all shrink-0 touch-target cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {remainingRevisions > 0
                ? `Request Change (${usedRevisions + 1}/3)`
                : "Request Additional Change"}
            </span>
          </button>
        )}
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Project Selector (If multiple projects) */}
      {projects.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 shrink-0">Select Project:</span>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                p.id === activeProject?.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Revision Tracker Card */}
      {activeProject && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-400">
                {activeProject.projectNumber}
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {activeProject.name}
              </h2>
            </div>
            <Link
              href={`/client/projects/${activeProject.id}`}
              className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View Full Project Specs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 3-Segment Slot Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Revision Quota Tracker:{" "}
                <span className="text-amber-600 dark:text-amber-400 font-mono font-black">
                  {usedRevisions} of 3 Used
                </span>
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">
                {remainingRevisions > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {remainingRevisions} Included Change{remainingRevisions === 1 ? "" : "s"} Remaining
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    Quota Complete (Extra Revisions Require Budget Review)
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((slotNumber) => {
                const isUsed = slotNumber <= usedRevisions;
                return (
                  <div
                    key={slotNumber}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      isUsed
                        ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400"
                    }`}
                  >
                    <div className="text-[10px] font-mono font-black uppercase tracking-wider">
                      Revision {slotNumber}
                    </div>
                    <div className="text-xs font-bold mt-1">
                      {isUsed ? "✓ Submitted" : "Available Slot"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* History of Change Requests */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
              Change Request History ({changeRequestsList.length})
            </h3>

            {changeRequestsList.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-400 space-y-1">
                <p className="font-bold text-slate-600 dark:text-slate-300">
                  No revisions requested yet for this project.
                </p>
                <p>
                  You have 3 full scope revisions included in your active contract. Click &quot;Request Change&quot; above to submit modifications.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {changeRequestsList.map((cr) => (
                  <div
                    key={cr.id}
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {cr.requestNumber}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            cr.isQuotaIncluded
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {cr.isQuotaIncluded
                            ? `Included Change #${cr.requestSeqInt}`
                            : `Additional Change (#${cr.requestSeqInt})`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {(cr.status === "SUBMITTED" || cr.status === "PENDING_BUDGET_APPROVAL") && (
                          <button
                            onClick={() => openEditModal(cr)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="Edit submitted change request"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                            cr.status === "APPROVED" || cr.status === "COMPLETED"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : cr.status === "SUBMITTED"
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {cr.status}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(cr.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {cr.originalRequirement}
                      </h4>
                      {cr.requestedChange && cr.requestedChange !== cr.originalRequirement && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {cr.requestedChange}
                        </p>
                      )}
                    </div>

                    {cr.items && cr.items.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">
                          Requested Action Items:
                        </div>
                        <ul className="space-y-1">
                          {cr.items.map((it) => (
                            <li
                              key={it.id}
                              className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              <span>{it.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Submit Project Change Request */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {editingCr
                    ? `Edit Change Request (${editingCr.requestNumber})`
                    : "Submit Change Request to Developers & Admin"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {submitError}
              </div>
            )}

            {remainingRevisions <= 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Notice: All 3 included revisions have been utilized. Submitting this request will flag it for budget & timeline approval.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmitChangeRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Project
                </label>
                <input
                  type="text"
                  disabled
                  value={`${activeProject?.name} (${activeProject?.projectNumber})`}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Change Summary / Title *
                </label>
                <input
                  type="text"
                  required
                  value={crTitle}
                  onChange={(e) => setCrTitle(e.target.value)}
                  placeholder="e.g. Update Hero Section & Add Payment Gateway"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Detailed Explanation / Reason
                </label>
                <textarea
                  rows={3}
                  value={crDescription}
                  onChange={(e) => setCrDescription(e.target.value)}
                  placeholder="Describe the desired modification in detail..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Specific Change Items *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCrItem}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {crItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 w-5 text-right">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleCrItemChange(idx, e.target.value)}
                        placeholder={`Change item ${idx + 1}`}
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                      />
                      {crItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCrItem(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {submitting
                      ? "Saving..."
                      : editingCr
                      ? "Save Changes"
                      : "Submit to Developers & Admin"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
