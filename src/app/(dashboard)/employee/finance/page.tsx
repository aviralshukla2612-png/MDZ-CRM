"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { IndianRupee, FolderKanban, ArrowRight, ShieldCheck } from "lucide-react";

export default function EmployeeFinancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinance();
  }, []);

  const fetchFinance = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/employee/finance");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 animate-pulse">Loading My Finance...</div>;
  }

  if (!data || !data.summary) {
    return <div className="p-12 text-center text-rose-500">Failed to load finance data.</div>;
  }

  const { summary, projects } = data;

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="My Finance & Delivery Overview"
        description="Private self-service view of your assigned project compensation amounts and delivery status."
        badge="CONFIDENTIAL EMPLOYEE VIEW"
        icon={<IndianRupee className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />}
      />

      {/* Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-2 border border-slate-800 flex flex-col justify-between">
          <div className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
            TOTAL ASSIGNED PROJECT COMPENSATION
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            ₹{summary.totalAssignedCompensation.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Sum of assigned project compensation across active memberships
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            ASSIGNED PROJECTS
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {summary.assignedProjectsCount} <span className="text-sm text-slate-500 font-normal">Active Projects</span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {summary.configuredCount} set · {summary.notSetConfiguredCount} pending setup
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 shadow-xs space-y-2 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>CONFIDENTIAL SECURITY BOUNDARY</span>
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            Your financial view is restricted strictly to your assigned project compensation. Company payroll and other employees' financial records are isolated.
          </div>
        </div>
      </div>

      {/* Projects Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Assigned Project Compensation & Delivery</h3>

        {projects.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
            No project compensation has been assigned yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {projects.map((p: any) => (
              <div
                key={p.membershipId}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xs space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{p.projectNumber}</span>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {p.roleInProject || "MEMBER"}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {p.projectName}
                  </h4>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">🏢 Client: {p.clientName}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 dark:text-slate-400">Assigned Compensation</span>
                    {p.compensationAmount !== null && p.compensationAmount !== undefined ? (
                      <span className="font-mono font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                        ₹{p.compensationAmount.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                        Not Set
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-slate-500 dark:text-slate-400">Delivery Status</span>
                    {p.delivery.color === "green" ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold font-mono">
                        🟢 {p.delivery.label}
                      </span>
                    ) : p.delivery.color === "red" ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold font-mono">
                        🔴 {p.delivery.label}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-bold font-mono">
                        ⚪ {p.delivery.label}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${p.progressPercentage}%` }} />
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono text-right">{p.progressPercentage}% Complete</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                  <Link
                    href={`/projects/${p.projectId}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all flex items-center gap-1.5"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
