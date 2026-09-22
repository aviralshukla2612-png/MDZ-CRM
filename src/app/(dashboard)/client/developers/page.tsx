"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Phone,
  Mail,
  Code2,
  FolderKanban,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface TeamMember {
  membershipId: string;
  projectId: string;
  projectName: string;
  projectNumber: string;
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

interface ProjectData {
  id: string;
  name: string;
  projectNumber: string;
  teamMembers: TeamMember[];
}

export default function ClientDevelopersPage() {
  const [developers, setDevelopers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDevelopers() {
      try {
        const res = await fetch("/mdz-crm/api/client/projects");
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "Failed to load assigned developers.");
        } else {
          // Extract and flatten team members across all client projects
          const allDevs: TeamMember[] = [];
          (data.projects || []).forEach((p: ProjectData) => {
            if (p.teamMembers && p.teamMembers.length > 0) {
              p.teamMembers.forEach((m) => {
                allDevs.push({
                  ...m,
                  projectId: p.id,
                  projectName: p.name,
                  projectNumber: p.projectNumber,
                });
              });
            }
          });
          setDevelopers(allDevs);
        }
      } catch (err) {
        console.error(err);
        setError("Network error occurred while fetching developers.");
      } finally {
        setLoading(false);
      }
    }

    fetchDevelopers();
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-56 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              CLIENT WORKSPACE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              DIRECT TEAM ACCESS
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-500" />
            <span>Assigned Team Members</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Directly connect with the team members, project leads, and designers building your applications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
            {developers.length} Team Member{developers.length === 1 ? "" : "s"} Assigned
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Team Grid */}
      {developers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Team Members Assigned Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Once your project administrator assigns team members to your active milestones, their contact numbers, direct email, and live task status will appear here.
          </p>
          <div className="pt-2">
            <Link
              href="/client"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <span>View Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {developers.map((member, index) => (
            <div
              key={member.membershipId || index}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all flex flex-col justify-between"
            >
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 text-white font-black text-base flex items-center justify-center font-mono shadow-md shadow-indigo-500/20">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        {member.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {member.designation}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {member.roleInProject === "TM" ? "Tech Lead" : member.roleInProject || "Developer"}
                  </span>
                </div>

                {/* Project Badge */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <FolderKanban className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate font-medium">Project:</span>
                  <Link
                    href={`/client/projects/${member.projectId}`}
                    className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate"
                  >
                    {member.projectName} ({member.projectNumber})
                  </Link>
                </div>
              </div>

              {/* Contact Actions (Call & Email) */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase font-bold text-slate-400">
                  Direct Contact Options
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {member.phone ? (
                    <a
                      href={`tel:${member.phone.replace(/\s+/g, "")}`}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors text-xs font-mono font-bold group"
                      title="Click to call developer directly"
                    >
                      <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="truncate">{member.phone}</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 text-xs">
                      <Phone className="w-4 h-4" />
                      <span>Phone not set</span>
                    </div>
                  )}

                  {member.email ? (
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-mono font-medium truncate"
                      title="Send email"
                    >
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Live Task Working Status */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1 text-xs">
                <div className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Currently Developing</span>
                </div>
                {member.currentTask ? (
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {member.currentTask.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                      {member.currentTask.status}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic">
                    Task queue active. No blocking issues reported.
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
