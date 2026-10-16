"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataImportModal } from "@/components/ui/DataImportModal";
import {
  UserCheck,
  Plus,
  ArrowRight,
  Sparkles,
  Trash2,
  FileSpreadsheet,
  Phone,
  Users,
  ShieldAlert,
  ShieldCheck,
  Target,
  BarChart2,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { ALL_SIDEBAR_ITEMS } from "@/lib/sidebarPermissions";

export default function EmployeesPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"directory" | "targets" | "monthly">("directory");

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Targets State
  const [targetsData, setTargetsData] = useState<any>(null);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Add Employee Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [empName, setEmpName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [subAdminPermissions, setSubAdminPermissions] = useState<string[]>(
    ALL_SIDEBAR_ITEMS.filter((i) => i.defaultSubAdmin).map((i) => i.href)
  );

  // Sub-Admin Permissions Modal for existing employees
  const [isPermOpen, setIsPermOpen] = useState(false);
  const [permEmpId, setPermEmpId] = useState("");
  const [permEmpName, setPermEmpName] = useState("");
  const [editSubAdminPerms, setEditSubAdminPerms] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  // Initial Target on Creation
  const [initialTargetTitle, setInitialTargetTitle] = useState("Shoot Reels");
  const [initialTargetCount, setInitialTargetCount] = useState<number>(4);
  const [initialTargetUnit, setInitialTargetUnit] = useState("reels");

  // Two Compulsory Emergency Relative Contacts
  const [rel1Name, setRel1Name] = useState("");
  const [rel1Relation, setRel1Relation] = useState("Father");
  const [rel1Phone, setRel1Phone] = useState("");
  const [rel2Name, setRel2Name] = useState("");
  const [rel2Relation, setRel2Relation] = useState("Mother");
  const [rel2Phone, setRel2Phone] = useState("");

  // Target Config BottomSheet (Admin & Sub-Admin Managed)
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configEmpId, setConfigEmpId] = useState("");
  const [configEmpName, setConfigEmpName] = useState("");
  const [configTitle, setConfigTitle] = useState("Shoot Reels");
  const [configCount, setConfigCount] = useState<number>(4);
  const [configUnit, setConfigUnit] = useState("reels");
  const [configNotes, setConfigNotes] = useState("");

  // Log Output BottomSheet
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logEmpId, setLogEmpId] = useState("");
  const [logEmpName, setLogEmpName] = useState("");
  const [logTargetTitle, setLogTargetTitle] = useState("");
  const [logTargetCount, setLogTargetCount] = useState<number>(4);
  const [logAchievedCount, setLogAchievedCount] = useState<number>(0);
  const [logUnit, setLogUnit] = useState("reels");
  const [logNotes, setLogNotes] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: "",
    name: "",
  });
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab");
      if (tab === "targets" || tab === "monthly" || tab === "directory") {
        setActiveTab(tab);
      }
    }
    fetchEmployees();
    fetchTargets();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/employees");
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTargets = async (date = targetDate, m = selectedMonth, y = selectedYear) => {
    try {
      setLoadingTargets(true);
      const res = await fetch(`/mdz-crm/api/employees/targets?date=${date}&month=${m}&year=${y}`);
      const json = await res.json();
      if (json.success && json.data) {
        setTargetsData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTargets(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rel1Phone.trim() || !rel2Phone.trim()) {
      showToast("Both Relative 1 and Relative 2 phone numbers are compulsory!", "error");
      return;
    }

    try {
      const res = await fetch("/mdz-crm/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: empName,
          email,
          phone,
          password,
          designation,
          role,
          allowedHrefs: role === "SUB_ADMIN" ? subAdminPermissions : undefined,
          dailyTargetTitle: initialTargetTitle.trim(),
          dailyTargetCount: initialTargetCount,
          dailyTargetUnit: initialTargetUnit.trim(),
          relative1Name: rel1Name.trim(),
          relative1Relation: rel1Relation.trim(),
          relative1Phone: rel1Phone.trim(),
          relative2Name: rel2Name.trim(),
          relative2Relation: rel2Relation.trim(),
          relative2Phone: rel2Phone.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Employee profile for "${empName || 'New Employee'}" created with 2 emergency relative contacts`, "success");
        fetchEmployees();
        fetchTargets();
        setIsAddOpen(false);
        setEmpName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setDesignation("");
        setRole("EMPLOYEE");
        setSubAdminPermissions(ALL_SIDEBAR_ITEMS.filter((i) => i.defaultSubAdmin).map((i) => i.href));
        setRel1Name("");
        setRel1Relation("Father");
        setRel1Phone("");
        setRel2Name("");
        setRel2Relation("Mother");
        setRel2Phone("");
      } else {
        if (res.status === 409) {
          showToast("Email already exists in the system", "error");
        } else {
          showToast(json.error || "Failed to create employee", "error");
        }
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const loadEmpPermissions = async (userId: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/admin/subadmin-permissions?userId=${userId}`);
      const json = await res.json();
      if (json.success) {
        setEditSubAdminPerms(json.selectedUserAllowed || json.globalAllowed || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEmpPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingPerms(true);
      const res = await fetch("/mdz-crm/api/admin/subadmin-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "USER",
          targetUserId: permEmpId,
          allowedHrefs: editSubAdminPerms,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Sidebar permissions updated for ${permEmpName}`, "success");
        setIsPermOpen(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mdz_subadmin_permissions_updated"));
        }
      } else {
        showToast(json.error || "Failed to save permissions", "error");
      }
    } catch {
      showToast("Network error saving permissions", "error");
    } finally {
      setSavingPerms(false);
    }
  };

  const handleQuickIncrement = async (employeeId: string, incrementBy: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch("/mdz-crm/api/employees/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          date: targetDate,
          incrementBy,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Target progress updated", "success");
        fetchTargets(targetDate, selectedMonth, selectedYear);
        fetchEmployees();
      } else {
        showToast(json.error || "Failed to update", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/mdz-crm/api/employees/${configEmpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyTargetTitle: configTitle,
          dailyTargetCount: configCount,
          dailyTargetUnit: configUnit,
          dailyTargetNotes: configNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Target quota set to ${configCount} ${configUnit}/day for ${configEmpName}`, "success");
        setIsConfigOpen(false);
        fetchTargets(targetDate, selectedMonth, selectedYear);
        fetchEmployees();
      } else {
        showToast(json.error || "Failed to update target config", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/mdz-crm/api/employees/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: logEmpId,
          date: targetDate,
          achievedCount: logAchievedCount,
          notes: logNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Work output saved for ${logEmpName}`, "success");
        setIsLogOpen(false);
        fetchTargets(targetDate, selectedMonth, selectedYear);
      } else {
        showToast(json.error || "Failed to save output", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  const handleExportCsv = () => {
    window.location.href = `/mdz-crm/api/employees/targets/export?month=${selectedMonth}&year=${selectedYear}`;
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/employees/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Employee ${name} deleted successfully`, "success");
        fetchEmployees();
        fetchTargets();
      } else {
        showToast(json.error || "Failed to delete employee", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const handleImportData = async (data: any[]) => {
    let successCount = 0;
    for (const row of data) {
      try {
        const rowName = row["Full Name"] || row["Name"] || row["name"];
        const rowEmail = row["Email"] || row["email"] || row["Email Address"];
        const rowDesignation = row["Designation"] || row["Role"] || "Employee";
        
        if (!rowName || !rowEmail) continue;

        const res = await fetch("/mdz-crm/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name: rowName, 
            email: rowEmail, 
            password: "Password123!", 
            designation: rowDesignation, 
            role: "EMPLOYEE",
            relative1Phone: "+91 99999 99991",
            relative2Phone: "+91 99999 99992",
          }),
        });
        
        if (res.ok) successCount++;
      } catch (e) {
        console.error("Import error on row:", row);
      }
    }
    
    showToast(`✓ Imported ${successCount} employees successfully`, "success");
    fetchEmployees();
  };

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Employees & Workforce Quotas"
        description="Daily output targets (reels, edits, designs), emergency relatives, and monthly work calculation."
        badge="WORKFORCE HUB"
        icon={<UserCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
              title="Download Monthly Performance CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Monthly CSV</span>
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "directory"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Team Directory & Relatives</span>
          <span className="px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[10px] font-mono">
            {employees.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("targets");
            fetchTargets(targetDate, selectedMonth, selectedYear);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "targets"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Daily Targets & Output Hub</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
            LIVE QUOTAS
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("monthly");
            fetchTargets(targetDate, selectedMonth, selectedYear);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "monthly"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Monthly Work Calculation & Export</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
            PAYROLL / METRICS
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DIRECTORY & RELATIVES (Original + Enhanced View)        */}
      {/* ============================================================== */}
      {activeTab === "directory" && (
        <>
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading employee directory...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xs dark:shadow-2xl hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-200 space-y-4 flex flex-col justify-between group"
                >
                  <Link href={`/employees/${emp.id}`} className="space-y-3 block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-extrabold text-base flex items-center justify-center shadow-lg shadow-indigo-600/25">
                          {emp.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {emp.name}
                            </h3>
                            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {emp.employeeId}
                            </span>
                            {emp.role === "SUB_ADMIN" && (
                              <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                SUB ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {emp.designation} • {emp.department}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                            {emp.email}
                          </div>
                        </div>
                      </div>

                      {emp.punchedIn ? (
                        <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>WORKING</span>
                        </span>
                      ) : emp.shiftCompleted ? (
                        <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                          COMPLETED
                        </span>
                      ) : emp.role === "SUB_ADMIN" ? null : (
                        <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                          OFFLINE
                        </span>
                      )}
                    </div>

                    {/* Daily Target Quota Pill */}
                    {emp.dailyTargetCount > 0 ? (
                      <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="font-bold text-indigo-950 dark:text-indigo-200">
                            Daily Quota: {emp.dailyTargetCount} {emp.dailyTargetUnit || "units"} / day ({emp.dailyTargetTitle || "Target"})
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          Target Set
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between text-slate-500">
                        <span className="text-[11px]">No specific quota set (e.g. 4 reels/day, 3 edits/day)</span>
                        <span className="text-[10px] font-bold text-indigo-600 hover:underline">Set in Targets Tab →</span>
                      </div>
                    )}

                    {/* Emergency Relatives Contacts (Compulsory 2 Numbers) */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/90 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>EMERGENCY RELATIVES (2 COMPULSORY)</span>
                        </span>
                        {emp.relative1Phone && emp.relative2Phone ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold border border-emerald-300 dark:border-emerald-800">
                            ✓ 2 NUMBERS VERIFIED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[9px] font-bold border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span>INCOMPLETE</span>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Relative 1 */}
                        <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl p-2.5 border border-amber-200/70 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs">
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-slate-500 uppercase truncate">
                              1. {emp.relative1Relation || "Relative 1"}
                              {emp.relative1Name ? ` (${emp.relative1Name})` : ""}
                            </div>
                            {emp.relative1Phone ? (
                              <a
                                href={`tel:${emp.relative1Phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px] mt-0.5"
                                title="Click to Call Relative 1"
                              >
                                <Phone className="w-3 h-3 shrink-0 text-emerald-600" />
                                <span className="truncate">{emp.relative1Phone}</span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-rose-500 font-mono italic">Not provided</span>
                            )}
                          </div>
                          {emp.relative1Phone && (
                            <a
                              href={`tel:${emp.relative1Phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition-colors shrink-0"
                              title="Direct Call Relative 1"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {/* Relative 2 */}
                        <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl p-2.5 border border-amber-200/70 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs">
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-slate-500 uppercase truncate">
                              2. {emp.relative2Relation || "Relative 2"}
                              {emp.relative2Name ? ` (${emp.relative2Name})` : ""}
                            </div>
                            {emp.relative2Phone ? (
                              <a
                                href={`tel:${emp.relative2Phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px] mt-0.5"
                                title="Click to Call Relative 2"
                              >
                                <Phone className="w-3 h-3 shrink-0 text-emerald-600" />
                                <span className="truncate">{emp.relative2Phone}</span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-rose-500 font-mono italic">Not provided</span>
                            )}
                          </div>
                          {emp.relative2Phone && (
                            <a
                              href={`tel:${emp.relative2Phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition-colors shrink-0"
                              title="Direct Call Relative 2"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Current Active Focus */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">CURRENT FOCUS</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{emp.currentTask}</div>
                    </div>
                  </Link>

                  <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <Link
                      href={`/projects?view=workload&employeeId=${emp.id}`}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                      title="View in Workload Kanban"
                    >
                      <span>Assigned: <strong>{emp.totalProjects !== undefined ? emp.totalProjects : emp.assignedProjects?.length || 0} Projects</strong></span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setConfigEmpId(emp.id);
                          setConfigEmpName(emp.name);
                          setConfigTitle(emp.dailyTargetTitle || "Shoot Reels");
                          setConfigCount(emp.dailyTargetCount || 4);
                          setConfigUnit(emp.dailyTargetUnit || "reels");
                          setConfigNotes(emp.dailyTargetNotes || "");
                          setIsConfigOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-bold text-[11px] transition-colors flex items-center gap-1"
                        title="Set Daily Quota (e.g. 4 Reels/day)"
                      >
                        <Target className="w-3 h-3" />
                        <span>Set Quota</span>
                      </button>

                      {emp.role === "SUB_ADMIN" && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setPermEmpId(emp.user?.id || emp.userId || emp.id);
                            setPermEmpName(emp.name);
                            loadEmpPermissions(emp.user?.id || emp.userId || emp.id);
                            setIsPermOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                          title="Configure Sidebar Access for this Sub-Admin"
                        >
                          <ShieldCheck className="w-3 h-3 text-indigo-600" />
                          <span>Sidebar Access</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setConfirmDelete({ isOpen: true, id: emp.id, name: emp.name });
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* TAB 2: DAILY WORK TARGETS & OUTPUT HUB (Live Tracking)         */}
      {/* ============================================================== */}
      {activeTab === "targets" && (
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Daily Employee Output Quotas (Admin & Sub-Admin Managed)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target example: 1 shooter shoots 4 reels/day, editor has 3-4 video edits/day.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Target Date:</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value);
                  fetchTargets(e.target.value, selectedMonth, selectedYear);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none"
              />
            </div>
          </div>

          {/* Quick Summary Cards */}
          {targetsData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                <div className="text-[11px] font-mono font-bold text-slate-400 uppercase">Total Staff</div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {targetsData.summary.totalEmployees}
                </div>
                <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                  {targetsData.summary.employeesWithTarget} with active quotas
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                <div className="text-[11px] font-mono font-bold text-slate-400 uppercase">Today Target Output</div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {targetsData.summary.todayTotalTarget} <span className="text-xs font-normal text-slate-500">units</span>
                </div>
                <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Expected today</div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                <div className="text-[11px] font-mono font-bold text-slate-400 uppercase">Today Achieved</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {targetsData.summary.todayTotalAchieved} <span className="text-xs font-normal text-slate-500">units</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Logged output</div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                <div className="text-[11px] font-mono font-bold text-slate-400 uppercase">Targets Hit Today</div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {targetsData.summary.todayCompletedCount} / {targetsData.summary.employeesWithTarget}
                </div>
                <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">Employees 100% done</div>
              </div>
            </div>
          )}

          {/* Employee Quota Cards Grid */}
          {loadingTargets ? (
            <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading live target progress...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(targetsData?.employees || []).map((emp: any) => {
                const isConfigured = emp.dailyTargetCount > 0;
                const progress = emp.today?.progressPercentage || 0;
                const isMet = emp.today?.isCompleted;

                return (
                  <div
                    key={emp.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs space-y-4 flex flex-col justify-between transition-all ${
                      isMet
                        ? "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20"
                        : isConfigured
                        ? "border-slate-200 dark:border-slate-800 hover:border-indigo-400"
                        : "border-dashed border-slate-300 dark:border-slate-800"
                    }`}
                  >
                    <div>
                      {/* Employee header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                              {emp.name}
                            </h4>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {emp.employeeIdCode}
                            </span>
                          </div>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            {emp.designation} • {emp.department}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setConfigEmpId(emp.id);
                            setConfigEmpName(emp.name);
                            setConfigTitle(emp.dailyTargetTitle || "Shoot Reels");
                            setConfigCount(emp.dailyTargetCount || 4);
                            setConfigUnit(emp.dailyTargetUnit || "reels");
                            setConfigNotes(emp.dailyTargetNotes || "");
                            setIsConfigOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                          title="Manage Quota Config (Admin & Sub-Admin)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quota Metric & Target */}
                      {isConfigured ? (
                        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{emp.today.targetTitle}</span>
                            </span>
                            <span className="text-[11px] font-mono font-black text-indigo-600 dark:text-indigo-400">
                              {emp.today.achievedCount} / {emp.today.targetCount} {emp.today.unit}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isMet
                                  ? "bg-emerald-500"
                                  : progress >= 50
                                  ? "bg-amber-500"
                                  : "bg-indigo-600"
                              }`}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className={`font-bold ${isMet ? "text-emerald-600" : "text-slate-500"}`}>
                              {isMet ? "✓ Daily Goal Achieved!" : `${emp.today.remaining} ${emp.today.unit} remaining`}
                            </span>
                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                              {progress}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                          <p className="text-xs text-slate-500">No daily target quota configured.</p>
                          <button
                            onClick={() => {
                              setConfigEmpId(emp.id);
                              setConfigEmpName(emp.name);
                              setConfigTitle("Shoot Reels");
                              setConfigCount(4);
                              setConfigUnit("reels");
                              setConfigNotes("");
                              setIsConfigOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Set Quota (e.g. 4 reels)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quick Output Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleQuickIncrement(emp.id, 1, e)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                          title={`+1 ${emp.today?.unit || "unit"}`}
                        >
                          <span>+1 {emp.today?.unit?.slice(0, 4) || "unit"}</span>
                        </button>
                        <button
                          onClick={(e) => handleQuickIncrement(emp.id, -1, e)}
                          className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors"
                          title="-1"
                        >
                          -1
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setLogEmpId(emp.id);
                          setLogEmpName(emp.name);
                          setLogTargetTitle(emp.today?.targetTitle || "Shoot Reels");
                          setLogTargetCount(emp.today?.targetCount || 4);
                          setLogAchievedCount(emp.today?.achievedCount || 0);
                          setLogUnit(emp.today?.unit || "reels");
                          setLogNotes(emp.today?.notes || "");
                          setIsLogOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-colors"
                      >
                        Custom Log
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MONTHLY WORK CALCULATION & EXPORT (CSV / EXCEL)         */}
      {/* ============================================================== */}
      {activeTab === "monthly" && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                <span>Monthly Workforce Work Calculation & Output Report</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Aggregate monthly work completed against expected targets for all employees to calculate payroll and bonuses.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={`${selectedYear}-${selectedMonth}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split("-").map(Number);
                    setSelectedYear(y);
                    setSelectedMonth(m);
                    fetchTargets(targetDate, m, y);
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
                >
                  {[0, 1, 2, 3, 4, 5].map((offset) => {
                    const d = new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
                    const year = d.getFullYear();
                    const month = d.getMonth() + 1;
                    const monthName = d.toLocaleString("default", { month: "long" });
                    const isCurrent = offset === 0;
                    return (
                      <option key={`${year}-${month}`} value={`${year}-${month}`}>
                        {monthName} {year} {isCurrent ? "(Current)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                onClick={handleExportCsv}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Report to CSV</span>
              </button>
            </div>
          </div>

          {/* Monthly Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider font-mono">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Daily Target Quota</th>
                    <th className="py-3.5 px-4 text-center">Days Worked</th>
                    <th className="py-3.5 px-4 text-center">Expected Target</th>
                    <th className="py-3.5 px-4 text-center">Achieved Output</th>
                    <th className="py-3.5 px-4 text-center">Target Completion %</th>
                    <th className="py-3.5 px-4 text-center">Avg / Day</th>
                    <th className="py-3.5 px-4 text-right">Performance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(targetsData?.employees || []).map((emp: any) => {
                    const m = emp.monthly;
                    const isExceeded = m.performanceStatus === "EXCEEDED";
                    const isOnTrack = m.performanceStatus === "ON_TRACK";

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link href={`/employees/${emp.id}`} className="block group">
                            <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                              {emp.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {emp.employeeIdCode} • {emp.designation}
                            </div>
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          {emp.dailyTargetCount > 0 ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {emp.dailyTargetCount} {emp.dailyTargetUnit} / day
                              <span className="block text-[10px] text-slate-400 font-mono">
                                ({emp.dailyTargetTitle})
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No quota set</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {m.daysWorked} days
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                          {m.expectedTarget > 0 ? `${m.expectedTarget} ${emp.dailyTargetUnit}` : "—"}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          {m.achievedTotal} {emp.dailyTargetUnit}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`font-mono font-black text-xs px-2.5 py-1 rounded-full ${
                              isExceeded
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : isOnTrack
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {m.completionRate}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {m.avgDailyAchieved} {emp.dailyTargetUnit}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isExceeded ? (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-200 dark:border-emerald-800">
                              ★ EXCEEDED
                            </span>
                          ) : isOnTrack ? (
                            <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold border border-amber-200 dark:border-amber-800">
                              ● ON TRACK
                            </span>
                          ) : emp.dailyTargetCount > 0 ? (
                            <span className="px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-bold border border-rose-200 dark:border-rose-800">
                              ▼ BEHIND
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">STANDARD</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ADD EMPLOYEE BOTTOM SHEET                             */}
      {/* ============================================================== */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Employee Profile"
        subtitle="Provision employee ID, credentials, daily work targets, and 2 compulsory relative contacts."
      >
        <form onSubmit={handleAddEmployee} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Full Name *</label>
            <input
              type="text"
              required
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              placeholder="e.g. Ankit Sharma"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@esscompany.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Employee Phone / Mobile</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Temporary Password *</label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Secure temporary password"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold block">Designation / Position *</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setDesignation("Videographer");
                    setInitialTargetTitle("Shoot Reels");
                    setInitialTargetCount(4);
                    setInitialTargetUnit("reels");
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all border ${
                    designation === "Videographer"
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-50"
                  }`}
                >
                  🎬 Videographer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDesignation("Video Editor");
                    setInitialTargetTitle("Edit Reels");
                    setInitialTargetCount(3);
                    setInitialTargetUnit("reels");
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all border ${
                    designation === "Video Editor"
                      ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50"
                  }`}
                >
                  🎞️ Video Editor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDesignation("Graphic Designer");
                    setInitialTargetTitle("Design Posts");
                    setInitialTargetCount(5);
                    setInitialTargetUnit("graphics");
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                >
                  🎨 Designer
                </button>
              </div>
            </div>
            <input
              type="text"
              required
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Videographer / Video Editor"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">System Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-semibold"
            >
              <option value="EMPLOYEE">Standard Employee</option>
              <option value="SALES">Sales Representative</option>
              <option value="SUB_ADMIN">Sub Admin (Management except Sales & Finance)</option>
            </select>
          </div>

          {/* SUB-ADMIN SIDEBAR ACCESS & PERMISSIONS (Visible when Sub Admin role is selected) */}
          {role === "SUB_ADMIN" && (
            <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-indigo-200/70 dark:border-indigo-800/70 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span className="font-extrabold text-indigo-950 dark:text-indigo-200 text-xs uppercase tracking-wide">
                    Sidebar Access &amp; Permissions
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">
                    {subAdminPermissions.length}/{ALL_SIDEBAR_ITEMS.length} Options
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSubAdminPermissions(ALL_SIDEBAR_ITEMS.map((i) => i.href))}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSubAdminPermissions([])}
                    className="text-slate-500 font-bold hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Choose which sidebar tools, sheets, KPIs, and modules this Sub-Admin can access:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                {ALL_SIDEBAR_ITEMS.map((item) => {
                  const isChecked = subAdminPermissions.includes(item.href);
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setSubAdminPermissions(subAdminPermissions.filter((h) => h !== item.href));
                        } else {
                          setSubAdminPermissions([...subAdminPermissions, item.href]);
                        }
                      }}
                      className={`p-2 rounded-xl text-left border text-[11px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        isChecked
                          ? "bg-white dark:bg-slate-900 border-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-500/20"
                          : "bg-slate-100/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] shrink-0 font-black ${
                          isChecked
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                        }`}
                      >
                        {isChecked && "✓"}
                      </span>
                      <span className="truncate">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* DAILY TARGET QUOTA SETTINGS */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h4 className="font-extrabold text-indigo-950 dark:text-indigo-200 text-xs uppercase">
                  Daily Work Target Quota (Configurable by Admin & Sub-Admin)
                </h4>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                  Set daily limit (e.g. 4 reels per day for shooter, 3 edits per day for editor).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Target Title</label>
                <input
                  type="text"
                  value={initialTargetTitle}
                  onChange={(e) => setInitialTargetTitle(e.target.value)}
                  placeholder="e.g. Shoot Reels"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Daily Limit / Count</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={initialTargetCount}
                  onChange={(e) => setInitialTargetCount(Number(e.target.value))}
                  placeholder="e.g. 4"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Unit</label>
                <input
                  type="text"
                  value={initialTargetUnit}
                  onChange={(e) => setInitialTargetUnit(e.target.value)}
                  placeholder="e.g. reels / edits"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* COMPULSORY 2 RELATIVES EMERGENCY PHONE NUMBERS */}
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300/80 dark:border-amber-700/60 space-y-3.5 mt-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <div>
                <h4 className="font-extrabold text-amber-950 dark:text-amber-200 text-xs uppercase tracking-wide">
                  Compulsory Relatives Emergency Contacts (2 Required)
                </h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
                  Both phone numbers are mandatory for all employees and visible to Admin and Sub-Admin.
                </p>
              </div>
            </div>

            {/* Relative 1 (Compulsory) */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-2.5">
              <div className="font-bold text-[11px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                Relative 1 (Mandatory *)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Relative 1 Name
                  </label>
                  <input
                    type="text"
                    value={rel1Name}
                    onChange={(e) => setRel1Name(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Relationship
                  </label>
                  <select
                    value={rel1Relation}
                    onChange={(e) => setRel1Relation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 text-xs font-medium"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other Relative">Other Relative</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block mb-1">
                  Relative 1 Phone Number * (Required)
                </label>
                <input
                  type="tel"
                  required
                  value={rel1Phone}
                  onChange={(e) => setRel1Phone(e.target.value)}
                  placeholder="e.g. +91 98765 11111"
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-rose-300 dark:border-rose-900/60 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-mono text-xs font-semibold"
                />
              </div>
            </div>

            {/* Relative 2 (Compulsory) */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-2.5">
              <div className="font-bold text-[11px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                Relative 2 (Mandatory *)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Relative 2 Name
                  </label>
                  <input
                    type="text"
                    value={rel2Name}
                    onChange={(e) => setRel2Name(e.target.value)}
                    placeholder="e.g. Sunita Sharma"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Relationship
                  </label>
                  <select
                    value={rel2Relation}
                    onChange={(e) => setRel2Relation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 text-xs font-medium"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other Relative">Other Relative</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block mb-1">
                  Relative 2 Phone Number * (Required)
                </label>
                <input
                  type="tel"
                  required
                  value={rel2Phone}
                  onChange={(e) => setRel2Phone(e.target.value)}
                  placeholder="e.g. +91 98765 22222"
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-rose-300 dark:border-rose-900/60 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-mono text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-3 cursor-pointer"
          >
            Create Employee Profile
          </button>
        </form>
      </BottomSheet>

      {/* ============================================================== */}
      {/* MODAL 2: MANAGE TARGET QUOTA (Admin & Sub-Admin)               */}
      {/* ============================================================== */}
      <BottomSheet
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Manage Daily Target Quota"
        subtitle={`Configure daily task quota & limit for ${configEmpName}`}
      >
        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1">
            <div className="font-extrabold text-indigo-900 dark:text-indigo-200">
              Admin & Sub-Admin Target Controls
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              Specify the daily expectation for {configEmpName} (e.g. 4 reels for shooter, 3 edits for video editor).
            </p>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Target Title / Description</label>
            <input
              type="text"
              required
              value={configTitle}
              onChange={(e) => setConfigTitle(e.target.value)}
              placeholder="e.g. Shoot Reels / Video Edits / Tasks"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Daily Quota Limit</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={configCount}
                onChange={(e) => setConfigCount(Number(e.target.value))}
                placeholder="4"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-mono font-bold text-base"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Target Unit</label>
              <input
                type="text"
                required
                value={configUnit}
                onChange={(e) => setConfigUnit(e.target.value)}
                placeholder="e.g. reels / edits / designs"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Special Instructions / Notes</label>
            <textarea
              rows={2}
              value={configNotes}
              onChange={(e) => setConfigNotes(e.target.value)}
              placeholder="e.g. Minimum 4 reels shot and uploaded to client Google Drive daily."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Save Target Quota
          </button>
        </form>
      </BottomSheet>

      {/* ============================================================== */}
      {/* MODAL 3: LOG DAILY WORK OUTPUT                                 */}
      {/* ============================================================== */}
      <BottomSheet
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        title="Log Work Output"
        subtitle={`Record completed ${logUnit} for ${logEmpName} on ${targetDate}`}
      >
        <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-200">
              Daily Target: {logTargetCount} {logUnit} ({logTargetTitle})
            </span>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Completed {logUnit} Today *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={logAchievedCount}
              onChange={(e) => setLogAchievedCount(Number(e.target.value))}
              placeholder="e.g. 4"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-mono font-bold text-lg"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Work Remarks / Links / Notes
            </label>
            <textarea
              rows={3}
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="e.g. Shot 4 reels for client project X. Uploaded to Drive folder."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Save Work Output
          </button>
        </form>
      </BottomSheet>

      {/* ============================================================== */}
      {/* MODAL 4: MANAGE SUB-ADMIN SIDEBAR PERMISSIONS                  */}
      {/* ============================================================== */}
      <BottomSheet
        isOpen={isPermOpen}
        onClose={() => setIsPermOpen(false)}
        title="Sub-Admin Sidebar Access & Permissions"
        subtitle={`Configure which modules & tools ${permEmpName} can access in the sidebar`}
      >
        <form onSubmit={handleSaveEmpPermissions} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
            <div>
              <span className="font-extrabold text-indigo-950 dark:text-indigo-200 text-xs">
                Active Permissions ({editSubAdminPerms.length} of {ALL_SIDEBAR_ITEMS.length} granted)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sub-Admin will only see checked items in their desktop sidebar &amp; mobile navigation.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => setEditSubAdminPerms(ALL_SIDEBAR_ITEMS.map((i) => i.href))}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setEditSubAdminPerms([])}
                className="text-slate-500 font-bold hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto pr-1">
            {ALL_SIDEBAR_ITEMS.map((item) => {
              const isChecked = editSubAdminPerms.includes(item.href);
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    if (isChecked) {
                      setEditSubAdminPerms(editSubAdminPerms.filter((h) => h !== item.href));
                    } else {
                      setEditSubAdminPerms([...editSubAdminPerms, item.href]);
                    }
                  }}
                  className={`p-2.5 rounded-xl text-left border text-[11px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isChecked
                      ? "bg-white dark:bg-slate-900 border-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-500/20"
                      : "bg-slate-100/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 opacity-70 hover:opacity-100"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-md flex items-center justify-center border text-[9px] shrink-0 font-black ${
                      isChecked
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    }`}
                  >
                    {isChecked && "✓"}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate">{item.title}</div>
                    <div className="text-[9px] font-mono text-slate-400 truncate">{item.category}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={savingPerms}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {savingPerms ? "Saving Permissions..." : `Save Permissions for ${permEmpName}`}
          </button>
        </form>
      </BottomSheet>

      {/* Confirmation & Import Modals */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: "", name: "" })}
        onConfirm={() => handleDeleteEmployee(confirmDelete.id, confirmDelete.name)}
        title="Fire Employee"
        message={`Are you sure you want to fire and permanently remove ${confirmDelete.name}? This action cannot be undone.`}
        confirmText="Yes, Fire Employee"
        isDestructive={true}
      />
      
      <DataImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportData}
        title="Import Employee Directory"
      />
    </div>
  );
}
