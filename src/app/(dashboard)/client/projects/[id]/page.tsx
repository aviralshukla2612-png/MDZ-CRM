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
} from "lucide-react";

interface TeamMember {
  membershipId: string;
  roleInProject: string;
  name: string;
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
}

export default function ClientProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/client/projects/${projectId}`);
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

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || "Project not found or access denied."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 font-sans">
      {/* Navigation */}
      <Link
        href="/client"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Projects</span>
      </Link>

      {/* Hero Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                {project.projectNumber}
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {project.status}
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

          {project.zeroTaskMessage && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-mono">
              {project.zeroTaskMessage}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Development Team & Daily Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Development Team & Current Work */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <span>Assigned Development Team ({project.teamMembers.length})</span>
            </h2>
          </div>

          {project.teamMembers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No developers currently assigned to this project.
            </div>
          ) : (
            <div className="space-y-3">
              {project.teamMembers.map((member) => (
                <div
                  key={member.membershipId}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center font-mono">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{member.name}</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{member.designation}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {member.roleInProject}
                    </span>
                  </div>

                  {/* Current Work */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1 text-xs">
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Code2 className="w-3 h-3 text-indigo-500" />
                      <span>Currently Working On</span>
                    </div>
                    {member.currentTask ? (
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{member.currentTask.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                          {member.currentTask.status}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">No active task in progress.</span>
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
                      <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{update.title}</h3>
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
    </div>
  );
}
