"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  Calendar,
  AlertCircle,
  FileText,
  Code2,
  Phone,
  Mail,
  Plus,
  GitPullRequest,
  Send,
  X,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

interface TeamMember {
  membershipId: string;
  roleInProject: string;
  name: string;
  email?: string;
  phone?: string;
  designation: string;
  department: string;
  avatarUrl: string | null;
  currentTask: {
    id: string;
    title: string;
    status: string;
  } | null;
}

interface ClientUpdateItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
    designation: string;
    avatarUrl: string | null;
  };
}

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

interface ProjectDetail {
  id: string;
  projectNumber: string;
  name: string;
  description: string | null;
  scopeText: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  targetDeadline: string | null;
  liveUrl: string | null;
  stagingUrl: string | null;
  designUrl: string | null;
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  zeroTaskMessage: string | null;
  teamMembers: TeamMember[];
  clientUpdates: ClientUpdateItem[];
  changeRequests?: ChangeRequestRecord[];
  quota?: ProjectQuota;
}

export default function ClientProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Change Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [crTitle, setCrTitle] = useState("");
  const [crDescription, setCrDescription] = useState("");
  const [crItems, setCrItems] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  async function fetchProject() {
    try {
      const res = await fetch(`/mdz-crm/api/client/projects/${projectId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to load project details.");
      } else {
        setProject(data.project);
      }
    } catch (err) {
      console.error("Project fetch error:", err);
      setError("Network error occurred while fetching project details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

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
    if (!crTitle.trim()) {
      setSubmitError("Please provide a summary / title for the requested change.");
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
      const res = await fetch(`/mdz-crm/api/client/projects/${projectId}/change-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: crTitle.trim(),
          description: crDescription.trim() || crTitle.trim(),
          items: filteredItems.map((title) => ({ title })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || "Failed to submit change request.");
      } else {
        setSubmitSuccess("Change request successfully sent to assigned developers and administrators!");
        setCrTitle("");
        setCrDescription("");
        setCrItems([""]);
        setIsModalOpen(false);
        await fetchProject();
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
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 max-w-4xl mx-auto font-sans space-y-4">
        <Link
          href="/client"
          className="inline-flex items-center gap-1 text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || "Project could not be found or access is unauthorized."}</span>
        </div>
      </div>
    );
  }

  const usedRevisions = project.quota?.usedCount || 0;
  const remainingRevisions = project.quota?.remainingCount ?? Math.max(0, 3 - usedRevisions);
  const changeRequestsList = project.changeRequests || [];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 font-sans">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/client"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold">
          {project.projectNumber}
        </span>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* Project Overview Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {project.status}
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                PRIORITY: {project.priority}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {project.stagingUrl && (
              <a
                href={project.stagingUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Staging Preview</span>
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Live Site</span>
              </a>
            )}
          </div>
        </div>

        {/* Progress Engine Banner */}
        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-300">Overall Development Progress</span>
            <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400 font-black">
              {project.progressPercentage}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${project.progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>
              {project.totalTasks > 0
                ? `${project.completedTasks} / ${project.totalTasks} Tasks Completed`
                : "Progress: 0%"}
            </span>
            {project.targetDeadline && (
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Deadline: {new Date(project.targetDeadline).toLocaleDateString()}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Change Requests / Revisions Section (3 Included Revisions Limit) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-amber-500" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                Project Revisions & Change Requests
              </h2>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                3 INCLUDED REVISIONS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your contract includes up to 3 revisions. When you submit changes, both the assigned developer and project administrator are notified immediately.
            </p>
          </div>

          <button
            onClick={() => {
              setSubmitError(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all shrink-0 touch-target"
          >
            <Plus className="w-4 h-4" />
            <span>
              {remainingRevisions > 0
                ? `Request Change (${usedRevisions + 1}/3)`
                : "Request Additional Change"}
            </span>
          </button>
        </div>

        {/* 3-Slot Visual Quota Tracker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Revision Quota Tracker:{" "}
              <span className="text-amber-600 dark:text-amber-400 font-mono">
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
                  Quota Complete (Extra Revisions Require Budget Approval)
                </span>
              )}
            </span>
          </div>

          {/* 3 Segmented Slots */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[1, 2, 3].map((slotNumber) => {
              const isUsed = slotNumber <= usedRevisions;
              return (
                <div
                  key={slotNumber}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isUsed
                      ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-300"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400"
                  }`}
                >
                  <div className="text-[10px] font-mono font-black uppercase">
                    Revision {slotNumber}
                  </div>
                  <div className="text-xs font-bold mt-0.5">
                    {isUsed ? "✓ Submitted" : "Available"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Change Requests History List */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
            Submitted Revisions ({changeRequestsList.length})
          </h3>

          {changeRequestsList.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-400">
              No change requests submitted yet. Click &quot;Request Change&quot; above if you need any adjustments made by your developer.
            </div>
          ) : (
            <div className="space-y-3">
              {changeRequestsList.map((cr) => (
                <div
                  key={cr.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 space-y-3"
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
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {cr.originalRequirement}
                    </h4>
                    {cr.requestedChange && cr.requestedChange !== cr.originalRequirement && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {cr.requestedChange}
                      </p>
                    )}
                  </div>

                  {cr.items && cr.items.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1">
                        Action Items:
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

      {/* Main Grid: Development Team & Daily Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Assigned Development Team & Direct Contacts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <span>Assigned Developers ({project.teamMembers.length})</span>
            </h2>
          </div>

          {project.teamMembers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No developers currently assigned to this project.
            </div>
          ) : (
            <div className="space-y-4">
              {project.teamMembers.map((member) => (
                <div
                  key={member.membershipId}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all"
                >
                  {/* Developer Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-sm flex items-center justify-center font-mono shadow-md shadow-indigo-500/20">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {member.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {member.designation}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {member.roleInProject === "TM"
                        ? "Tech Lead"
                        : member.roleInProject || "Developer"}
                    </span>
                  </div>

                  {/* Direct Contact Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {member.phone ? (
                      <a
                        href={`tel:${member.phone.replace(/\s+/g, "")}`}
                        className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-xs font-mono font-bold group"
                        title="Click to call developer"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="truncate">{member.phone}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 text-xs">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Not available</span>
                      </div>
                    )}

                    {member.email ? (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-mono font-medium truncate"
                        title="Send email"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </a>
                    ) : null}
                  </div>

                  {/* Current Work in Progress */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1 text-xs">
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Code2 className="w-3 h-3 text-indigo-500" />
                      <span>Currently Working On</span>
                    </div>
                    {member.currentTask ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {member.currentTask.title}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                          {member.currentTask.status}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">
                        No active task in progress.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Daily Development Progress Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              <span>Daily Progress Timeline</span>
            </h2>
          </div>

          {project.clientUpdates.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No daily updates posted yet for this project.
            </div>
          ) : (
            <div className="space-y-4">
              {project.clientUpdates.map((update) => (
                <div
                  key={update.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        {update.title}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {new Date(update.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                      ✓ Published Update
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                    {update.content}
                  </p>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Author: {update.author.name} ({update.author.designation || "Developer"})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Submit Project Change Request */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Submit Change Request
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
                  Change Summary / Title *
                </label>
                <input
                  type="text"
                  required
                  value={crTitle}
                  onChange={(e) => setCrTitle(e.target.value)}
                  placeholder="e.g. Update Hero Section & Change Color Theme"
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
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Sending..." : "Submit to Developers & Admin"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
