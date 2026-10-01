"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  Clock,
  Save,
  Users,
  Search,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Sparkles,
  Zap,
  Building2,
  ShieldCheck,
} from "lucide-react";

interface EmployeeWorkingHours {
  id: string;
  userId: string;
  employeeIdCode: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  avatarUrl?: string;
  activeRole: string;
  status: string;
  targetWorkingHours: number;
}

export default function WorkingHoursPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingEmpId, setSavingEmpId] = useState<string | null>(null);

  const [defaultHours, setDefaultHours] = useState<number>(8.0);
  const [employees, setEmployees] = useState<EmployeeWorkingHours[]>([]);
  const [hoursMap, setHoursMap] = useState<Record<string, number>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/mdz-crm/api/attendance/working-hours");
      const json = await res.json();
      if (json.success) {
        setDefaultHours(json.defaultWorkingHours || 8.0);
        setEmployees(json.employees || []);
        
        const initialMap: Record<string, number> = {};
        (json.employees || []).forEach((emp: EmployeeWorkingHours) => {
          initialMap[emp.id] = emp.targetWorkingHours;
        });
        setHoursMap(initialMap);
      } else {
        showToast(json.error || "Failed to load working hours", "error");
      }
    } catch {
      showToast("Network error loading working hours", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save Global Default Working Hours
  const handleSaveGlobal = async (applyToAll: boolean = false) => {
    setSavingGlobal(true);
    try {
      const res = await fetch("/mdz-crm/api/attendance/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_GLOBAL_DEFAULT",
          defaultWorkingHours: defaultHours,
          applyToAll,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ ${json.message}`, "success");
        if (applyToAll) {
          // Update local state map for all employees
          const updated: Record<string, number> = {};
          employees.forEach((emp) => {
            updated[emp.id] = defaultHours;
          });
          setHoursMap(updated);
        }
      } else {
        showToast(json.error || "Failed to save default hours", "error");
      }
    } catch {
      showToast("Network error saving default hours", "error");
    } finally {
      setSavingGlobal(false);
    }
  };

  // Save Single Employee Hours
  const handleSaveEmployeeHours = async (employeeId: string) => {
    const hours = hoursMap[employeeId];
    if (hours === undefined || hours <= 0) {
      showToast("Please enter a valid working hours amount", "error");
      return;
    }

    setSavingEmpId(employeeId);
    try {
      const res = await fetch("/mdz-crm/api/attendance/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_EMPLOYEE",
          employeeId,
          hours,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ ${json.message}`, "success");
      } else {
        showToast(json.error || "Failed to update employee hours", "error");
      }
    } catch {
      showToast("Network error updating employee hours", "error");
    } finally {
      setSavingEmpId(null);
    }
  };

  // Quick Bulk Preset (e.g. Set all to 6h, 8h, 9h)
  const handleBulkPreset = async (presetHours: number) => {
    if (!window.confirm(`Are you sure you want to set target daily working hours for ALL employees to ${presetHours} hours?`)) {
      return;
    }

    setLoading(true);
    try {
      const updatedMap: Record<string, number> = {};
      employees.forEach((emp) => {
        updatedMap[emp.id] = presetHours;
      });

      const res = await fetch("/mdz-crm/api/attendance/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_ASSIGN",
          employeeHoursMap: updatedMap,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ All employees assigned ${presetHours} working hours/day!`, "success");
        setHoursMap(updatedMap);
      } else {
        showToast(json.error || "Failed bulk update", "error");
      }
    } catch {
      showToast("Network error during bulk update", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filtered employees list
  const departments = Array.from(new Set(employees.map((e) => e.department || "General"))).filter(Boolean);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeIdCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = departmentFilter === "ALL" || emp.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  const averageHours =
    employees.length > 0
      ? (Object.values(hoursMap).reduce((acc, curr) => acc + (curr || 8), 0) / employees.length).toFixed(1)
      : "8.0";

  const customOverridesCount = employees.filter((e) => hoursMap[e.id] !== defaultHours).length;

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Employee Working Hours"
        description="Manage daily required target working hours across your company. Assign custom shift targets (e.g. 6 Hours, 8 Hours) for individual employees."
        badge="WORKFORCE MANAGEMENT"
        icon={<Clock className="w-7 h-7 text-amber-500 animate-pulse" />}
      />

      {/* ── Summary & Global Default Bar ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Card 1: System Default Shift Hours */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-amber-200/80 dark:border-amber-900/40 p-6 shadow-xl dark:shadow-2xl space-y-4 md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-900/30 pb-3 mb-4">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>Company Standard Working Hours</span>
              </h2>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                GLOBAL DEFAULT
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Default daily work target for new hires and employees without custom overrides.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={defaultHours}
                  onChange={(e) => setDefaultHours(parseFloat(e.target.value) || 8)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-amber-200 dark:border-amber-900/50 rounded-2xl px-4 py-3 text-base text-slate-900 dark:text-slate-100 font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                  HOURS/DAY
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveGlobal(false)}
                  disabled={savingGlobal}
                  className="px-4 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {savingGlobal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Default</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveGlobal(true)}
                  disabled={savingGlobal}
                  className="px-4 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                  title="Save default hours and apply to ALL existing employees immediately"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Apply to All</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5 pt-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset targets: 6 Hours (Part-time/Flexible) • 8 Hours (Standard) • 9 Hours (Full Shift)</span>
          </div>
        </div>

        {/* Card 2: Employees Count */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xl dark:shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Employees
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {employees.length}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Active workforce team members
            </p>
          </div>
        </div>

        {/* Card 3: Avg Hours & Custom Overrides */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xl dark:shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Avg Shift / Custom
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {averageHours}h
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {customOverridesCount} employee(s) with custom hours
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick Bulk Assign Action Buttons ────────────────────────────────────────── */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>One-Click Mass Shift Assignment</span>
          </h3>
          <p className="text-xs text-slate-400">
            Instantly set target working hours for all employees across the entire company:
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => handleBulkPreset(6)}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Set All to 6 Hours</span>
          </button>

          <button
            type="button"
            onClick={() => handleBulkPreset(8)}
            className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Set All to 8 Hours</span>
          </button>

          <button
            type="button"
            onClick={() => handleBulkPreset(9)}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Set All to 9 Hours</span>
          </button>
        </div>
      </div>

      {/* ── Employee Working Hours Table & Search ──────────────────────────────────── */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <span>Employee Working Hours Assignment</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Assign total required daily working hours individually per employee.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search employee or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 w-48 sm:w-64"
              />
            </div>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Loading employee working hours...
            </p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No employees found matching query "{searchQuery}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                  <th className="pb-3 px-3">Employee</th>
                  <th className="pb-3 px-3">Department & Role</th>
                  <th className="pb-3 px-3 text-center">Current Target</th>
                  <th className="pb-3 px-3 text-center">Quick Presets</th>
                  <th className="pb-3 px-3 text-center">Assigned Daily Hours</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredEmployees.map((emp) => {
                  const currentVal = hoursMap[emp.id] ?? defaultHours;
                  const isSaving = savingEmpId === emp.id;
                  const isCustom = currentVal !== defaultHours;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-950/40 transition-colors"
                    >
                      {/* Employee Info */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shrink-0">
                            {emp.avatarUrl ? (
                              <img
                                src={emp.avatarUrl}
                                alt={emp.name}
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            ) : (
                              emp.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                              <span>{emp.name}</span>
                              {isCustom && (
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                                  CUSTOM
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              ID: {emp.employeeIdCode} • {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-4 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {emp.designation}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{emp.department}</span>
                        </div>
                      </td>

                      {/* Current Target Badge */}
                      <td className="py-4 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-mono font-bold text-xs border ${
                            currentVal === 6
                              ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                              : currentVal === 8
                              ? "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{currentVal} Hours/Day</span>
                        </span>
                      </td>

                      {/* Quick Presets */}
                      <td className="py-4 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {[6, 8, 9].map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() =>
                                setHoursMap((prev) => ({ ...prev, [emp.id]: h }))
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer ${
                                currentVal === h
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {h}h
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Input controls */}
                      <td className="py-4 px-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() =>
                              setHoursMap((prev) => ({
                                ...prev,
                                [emp.id]: Math.max(1, (prev[emp.id] || defaultHours) - 0.5),
                              }))
                            }
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer select-none"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            max="24"
                            value={currentVal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setHoursMap((prev) => ({ ...prev, [emp.id]: val }));
                            }}
                            className="w-14 bg-transparent text-center font-mono font-bold text-xs text-slate-900 dark:text-slate-100 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setHoursMap((prev) => ({
                                ...prev,
                                [emp.id]: Math.min(24, (prev[emp.id] || defaultHours) + 0.5),
                              }))
                            }
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer select-none"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Save Action */}
                      <td className="py-4 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSaveEmployeeHours(emp.id)}
                          disabled={isSaving}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 ml-auto disabled:opacity-50 cursor-pointer"
                        >
                          {isSaving ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          <span>{isSaving ? "Saving..." : "Save Hours"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
