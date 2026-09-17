"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Users,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building,
  Plus,
  Calendar,
} from "lucide-react";

export function OwnerWorkloadSection() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/employees");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEmployees(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              DEVELOPER PROJECT ALLOCATION & WORKLOAD
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live tracking of projects assigned to each team member and their execution stages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/projects?view=calendar"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors border border-slate-200/80 dark:border-slate-700/80"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Task Calendar</span>
          </Link>
          <Link
            href="/projects?view=kanban"
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Open Project Kanban</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
          Loading developer workload records...
        </div>
      ) : employees.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">No employees found in directory.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const projects = emp.assignedProjects || [];
            const hasProjects = projects.length > 0;

            return (
              <div
                key={emp.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3 flex flex-col justify-between hover:border-indigo-500/40 transition-all group"
              >
                {/* Employee Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                      {emp.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {emp.name}
                      </div>
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        {emp.designation || "Developer"}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      hasProjects
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    <Briefcase className="w-3 h-3" />
                    <span>{emp.totalProjects !== undefined ? emp.totalProjects : projects.length} Projects</span>
                  </span>
                </div>

                {/* Assigned Projects Preview List */}
                <div className="space-y-1.5 flex-1">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    ASSIGNED PROJECTS ({projects.length})
                  </div>
                  {projects.length === 0 ? (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-700 text-[11px] text-slate-400 text-center">
                      No active projects assigned
                    </div>
                  ) : (
                    projects.slice(0, 3).map((p: any) => (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500/50 block text-xs space-y-1 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {p.name}
                          </span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                            {p.roleInProject === "TM" ? "Tech Lead" : p.roleInProject || "Dev"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span className="truncate">{p.clientName}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {p.progress || p.progressPercentage || 0}%
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                  {projects.length > 3 && (
                    <div className="text-[10px] text-center text-slate-400 font-mono">
                      +{projects.length - 3} more projects
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-slate-500">
                    {emp.punchedIn ? "🟢 Working Now" : "⚪ Offline"}
                  </span>
                  <Link
                    href={`/projects?view=kanban&employeeId=${emp.id}`}
                    className="font-bold text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Kanban</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
