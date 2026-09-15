"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Layers, Plus, Users, FolderKanban } from "lucide-react";
import Link from "next/link";
import { EmployeeProjectKanban } from "@/components/projects/EmployeeProjectKanban";
import { useToast } from "@/components/ui/Toast";

export default function WorkloadPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, projRes] = await Promise.all([
        fetch("/mdz-crm/api/employees"),
        fetch("/mdz-crm/api/projects"),
      ]);
      const empJson = await empRes.json();
      const projJson = await projRes.json();

      if (empJson.success && Array.isArray(empJson.data)) {
        setEmployees(empJson.data);
      }
      if (projJson.success && Array.isArray(projJson.data)) {
        setProjects(projJson.data);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load workload data", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Developer Workload & Allocation"
        description="Odoo-style master-detail view: inspect each developer's total assigned projects, roles, deadlines, and execution kanban."
        badge={`${employees.length} DEVELOPERS`}
        icon={<Layers className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/projects"
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <FolderKanban className="w-4 h-4" />
              <span>All Projects List</span>
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm animate-pulse space-y-2">
          <div className="text-base font-bold text-slate-600 dark:text-slate-300">Loading Developer Workloads...</div>
          <p className="text-xs">Fetching projects, assignments, and live progress.</p>
        </div>
      ) : (
        <EmployeeProjectKanban
          employees={employees}
          allProjects={projects}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}
