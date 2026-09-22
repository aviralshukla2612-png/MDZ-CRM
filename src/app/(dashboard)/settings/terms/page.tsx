"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  ShieldCheck,
  FileText,
  Edit3,
  Eye,
  Send,
  History,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Users,
  Search,
  Building,
  User,
  Sparkles,
  RefreshCw,
  Clock,
  RotateCcw,
  BadgeCheck,
  FileSignature,
} from "lucide-react";

interface EmployeeTermsRecord {
  id: string;
  userId: string;
  employeeIdCode: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  salaryMonthly: number;
  phone: string;
  hasCustomTerms: boolean;
  customTermsTitle: string | null;
  customTermsContent: string | null;
  termsVersion: string;
  effectiveVersion: string;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  joiningDate: string;
}

export default function AdminTermsManagementPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Active Main View Tab: "individual" | "global"
  const [activeMainTab, setActiveMainTab] = useState<"individual" | "global">("individual");

  // Global Editor State
  const [selectedAudience, setSelectedAudience] = useState<"EMPLOYEE" | "CLIENT">("EMPLOYEE");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [version, setVersion] = useState("v1.1");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Global Preview & Confirm Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ─── Individual Employee Terms State ───
  const [employees, setEmployees] = useState<EmployeeTermsRecord[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CUSTOM" | "DEFAULT" | "PENDING">("ALL");

  // Individual Terms Editor State
  const [selectedEmp, setSelectedEmp] = useState<EmployeeTermsRecord | null>(null);
  const [isEmpEditorOpen, setIsEmpEditorOpen] = useState(false);
  const [empTermsTitle, setEmpTermsTitle] = useState("");
  const [empTermsContent, setEmpTermsContent] = useState("");
  const [empTermsVersion, setEmpTermsVersion] = useState("v1.0");
  const [requireReAcceptance, setRequireReAcceptance] = useState(true);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [savingEmpTerms, setSavingEmpTerms] = useState(false);

  useEffect(() => {
    fetchAdminTerms();
    fetchEmployeesTerms();
  }, []);

  const fetchAdminTerms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/admin/terms");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        showToast(json.error || "Failed to load terms data", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to connect to server", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesTerms = async () => {
    try {
      setEmpLoading(true);
      const res = await fetch("/mdz-crm/api/admin/terms/employees");
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load employees terms:", err);
    } finally {
      setEmpLoading(false);
    }
  };

  // ─── Global Terms Handlers ───
  const handleOpenEditor = (audience: "EMPLOYEE" | "CLIENT") => {
    setSelectedAudience(audience);
    const audienceData = audience === "EMPLOYEE" ? data?.employee : data?.client;
    const currentOrDraft = audienceData?.draft || audienceData?.current;

    const currentVer = currentOrDraft?.version || "v1.0";
    const verParts = currentVer.replace("v", "").split(".");
    const nextVer = verParts.length === 2 ? `v${verParts[0]}.${Number(verParts[1]) + 1}` : "v1.1";

    setVersion(currentOrDraft?.isDraft ? currentOrDraft.version : nextVer);
    setTitle(currentOrDraft?.title || `${audience === "EMPLOYEE" ? "Employee" : "Client"} Terms and Conditions of Service`);
    setContent(currentOrDraft?.content || "");
    setIsEditorOpen(true);
  };

  const handleSaveDraft = async () => {
    try {
      setSubmitting(true);
      const res = await fetch("/mdz-crm/api/admin/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAudience: selectedAudience,
          action: "save_draft",
          version,
          title,
          content,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Saved ${selectedAudience} terms draft (${version})`, "success");
        setIsEditorOpen(false);
        fetchAdminTerms();
      } else {
        showToast(json.error || "Failed to save draft", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving draft", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishTerms = async () => {
    setIsPublishModalOpen(false);
    try {
      setSubmitting(true);
      const res = await fetch("/mdz-crm/api/admin/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAudience: selectedAudience,
          action: "publish",
          version,
          title,
          content,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Published ${selectedAudience} terms ${version}. Re-acceptance active!`, "success");
        setIsEditorOpen(false);
        setIsPreviewOpen(false);
        fetchAdminTerms();
        fetchEmployeesTerms();
      } else {
        showToast(json.error || "Failed to publish terms", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error publishing terms", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Individual Terms Handlers ───
  const handleOpenEmpEditor = (emp: EmployeeTermsRecord) => {
    setSelectedEmp(emp);
    setEmpTermsTitle(
      emp.customTermsTitle || `Employment Agreement & Terms — ${emp.name}`
    );

    if (emp.customTermsContent) {
      setEmpTermsContent(emp.customTermsContent);
    } else {
      // Generate initial customized template for this employee
      const defaultTemplate = `
EMPLOYMENT AGREEMENT & INDIVIDUAL SERVICE TERMS

EMPLOYEE NAME: ${emp.name}
EMPLOYEE ID: ${emp.employeeIdCode}
DESIGNATION: ${emp.designation}
DEPARTMENT: ${emp.department}
JOINING DATE: ${new Date(emp.joiningDate).toLocaleDateString()}
MONTHLY COMPENSATION: ₹${emp.salaryMonthly?.toLocaleString() || "0"}

1. DUTIES AND SCOPE OF WORK
The Employee agrees to perform all professional responsibilities, coding tasks, project execution, and client deliverables associated with the role of ${emp.designation} in the ${emp.department} department.

2. CONFIDENTIALITY & NON-DISCLOSURE
The Employee shall maintain strict confidentiality regarding all proprietary source code, client records, billing data, trade secrets, and internal operations of Millionaire Dizital.

3. WORK HOURS, ATTENDANCE & REPORTING
The Employee must record daily work sessions, punch in/out on MDZ OS accurately, and submit daily updates before completing daily shifts.

4. INTELLECTUAL PROPERTY
All software deliverables, architectures, algorithms, and designs created during employment are the sole and exclusive property of Millionaire Dizital.

5. TERMINATION & NOTICE PERIOD
Either party may terminate this agreement in accordance with company standard notice guidelines.
`.trim();
      setEmpTermsContent(defaultTemplate);
    }

    setEmpTermsVersion(emp.termsVersion || "v1.0");
    setRequireReAcceptance(true);
    setIsEmpEditorOpen(true);
  };

  const insertPlaceholder = (placeholder: string) => {
    setEmpTermsContent((prev) => prev + " " + placeholder);
    showToast(`Inserted ${placeholder}`, "info");
  };

  const handleSaveIndividualTerms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    if (!empTermsContent.trim()) {
      showToast("Terms content cannot be empty", "error");
      return;
    }

    setSavingEmpTerms(true);
    try {
      const res = await fetch("/mdz-crm/api/admin/terms/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          customTermsTitle: empTermsTitle,
          customTermsContent: empTermsContent,
          termsVersion: empTermsVersion,
          requireReAcceptance,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`✓ Individual terms updated for ${selectedEmp.name}!`, "success");
        setIsEmpEditorOpen(false);
        fetchEmployeesTerms();
      } else {
        showToast(json.error || "Failed to update individual terms", "error");
      }
    } catch {
      showToast("Network error saving individual terms", "error");
    } finally {
      setSavingEmpTerms(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!selectedEmp) return;
    setIsResetConfirmOpen(false);

    setSavingEmpTerms(true);
    try {
      const res = await fetch("/mdz-crm/api/admin/terms/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          resetToDefault: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`✓ Reverted ${selectedEmp.name} to company default terms`, "success");
        setIsEmpEditorOpen(false);
        fetchEmployeesTerms();
      } else {
        showToast(json.error || "Failed to reset terms", "error");
      }
    } catch {
      showToast("Network error resetting terms", "error");
    } finally {
      setSavingEmpTerms(false);
    }
  };

  // Filtered employees list
  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean))
  );

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(empSearch.toLowerCase()) ||
      emp.email.toLowerCase().includes(empSearch.toLowerCase()) ||
      emp.employeeIdCode.toLowerCase().includes(empSearch.toLowerCase()) ||
      emp.designation.toLowerCase().includes(empSearch.toLowerCase());

    const matchesDept = deptFilter === "ALL" || emp.department === deptFilter;

    let matchesStatus = true;
    if (statusFilter === "CUSTOM") matchesStatus = emp.hasCustomTerms;
    if (statusFilter === "DEFAULT") matchesStatus = !emp.hasCustomTerms;
    if (statusFilter === "PENDING") matchesStatus = !emp.termsAccepted;

    return matchesSearch && matchesDept && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
        <span className="text-xs font-semibold">Loading Terms & Agreements Management...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Terms & Agreements Management"
        description="Authoritative controls for Individual Employee Terms, customized agreements, and global policies."
        badge="ADMIN & SUB-ADMIN CONTROL"
        icon={<FileSignature className="w-7 h-7 text-amber-600 dark:text-amber-400 animate-pulse" />}
      />

      {/* Main Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainTab("individual")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeMainTab === "individual"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Individual Employee Terms</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
              {employees.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab("global")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeMainTab === "global"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Company Global Policies</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">
            {employees.filter((e) => e.hasCustomTerms).length} of {employees.length} Employees with Custom Terms
          </span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: INDIVIDUAL EMPLOYEE TERMS MANAGEMENT                           */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeMainTab === "individual" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employee by name, ID, designation..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Department Filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold outline-none focus:border-amber-500"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 font-semibold outline-none focus:border-amber-500"
              >
                <option value="ALL">All Terms Types</option>
                <option value="CUSTOM">Custom Individual Only</option>
                <option value="DEFAULT">Company Standard Only</option>
                <option value="PENDING">Pending Acceptance</option>
              </select>

              <button
                onClick={fetchEmployeesTerms}
                disabled={empLoading}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Refresh List"
              >
                <RefreshCw className={`w-4 h-4 ${empLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Employees List Grid */}
          {empLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-2">Loading employees...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              No employees matched your filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl shadow-md hover:shadow-lg ${
                    emp.hasCustomTerms
                      ? "border-amber-300/80 dark:border-amber-500/40"
                      : "border-slate-200/80 dark:border-slate-800/80"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header with Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {emp.name}
                        </h4>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {emp.employeeIdCode} • {emp.email}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                          emp.hasCustomTerms
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {emp.hasCustomTerms ? "CUSTOM TERMS" : "DEFAULT TERMS"}
                      </span>
                    </div>

                    {/* Role & Department */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                        {emp.designation}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 font-semibold text-indigo-700 dark:text-indigo-300">
                        {emp.department}
                      </span>
                      {emp.phone && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {emp.phone}
                        </span>
                      )}
                    </div>

                    {/* Acceptance Status */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Version:</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200">
                          {emp.effectiveVersion}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Acceptance:</span>
                        {emp.termsAccepted ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accepted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending Review</span>
                          </span>
                        )}
                      </div>
                      {emp.termsAcceptedAt && (
                        <div className="text-[10px] text-slate-400 text-right font-mono">
                          {new Date(emp.termsAcceptedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleOpenEmpEditor(emp)}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{emp.hasCustomTerms ? "Edit Individual Terms" : "Set Individual Terms"}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: GLOBAL COMPANY TERMS MANAGEMENT                                 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeMainTab === "global" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Default Employee Terms */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Company Employee Terms
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      Standard Internal Team Operational Governance
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {data?.employee?.current?.version || "v1.0"} Current
                </span>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>Last Published:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {data?.employee?.current?.publishedAt
                      ? new Date(data.employee.current.publishedAt).toLocaleDateString()
                      : "Current"}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Accepted Count:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {data?.employee?.current?._count?.acceptances || 0} Employees
                  </strong>
                </div>

                {data?.employee?.draft && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-between font-semibold">
                    <span>Draft Version Available: {data.employee.draft.version}</span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60">
                      Unpublished
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditor("EMPLOYEE")}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs touch-target"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit / Publish Global Terms</span>
                </button>
              </div>
            </div>

            {/* Card 2: Client Terms */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Client Portal Terms
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      Client Portal & Project Agreement
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {data?.client?.current?.version || "v1.0"} Current
                </span>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>Last Published:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {data?.client?.current?.publishedAt
                      ? new Date(data.client.current.publishedAt).toLocaleDateString()
                      : "Current"}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Accepted Count:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {data?.client?.current?._count?.acceptances || 0} Contacts
                  </strong>
                </div>

                {data?.client?.draft && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-between font-semibold">
                    <span>Draft Version Available: {data.client.draft.version}</span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60">
                      Unpublished
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditor("CLIENT")}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs touch-target"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit / Publish Client Terms</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* INDIVIDUAL EMPLOYEE TERMS EDITOR BOTTOM SHEET                              */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={isEmpEditorOpen}
        onClose={() => setIsEmpEditorOpen(false)}
        title={`Individual Terms: ${selectedEmp?.name || "Employee"}`}
        subtitle={`Employee Code: ${selectedEmp?.employeeIdCode || ""} | Designation: ${selectedEmp?.designation || ""}`}
      >
        <form onSubmit={handleSaveIndividualTerms} className="space-y-4 text-xs">
          {/* Quick Info Box */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                {selectedEmp?.name} ({selectedEmp?.department} Dept)
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Monthly Salary: ₹{selectedEmp?.salaryMonthly?.toLocaleString() || "0"} • Phone: {selectedEmp?.phone || "N/A"}
              </div>
            </div>

            {selectedEmp?.hasCustomTerms && (
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold flex items-center gap-1 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revert to Default</span>
              </button>
            )}
          </div>

          {/* Quick Placeholder Insert Toolbar */}
          <div className="space-y-1.5">
            <label className="text-slate-600 dark:text-slate-400 font-semibold block text-[11px]">
              Quick Placeholder Tags:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                `{{EMPLOYEE_NAME}}`,
                `{{DESIGNATION}}`,
                `{{DEPARTMENT}}`,
                `{{JOINING_DATE}}`,
                `{{MONTHLY_SALARY}}`,
                `{{EMPLOYEE_EMAIL}}`,
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertPlaceholder(tag)}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 font-mono text-[10px] text-slate-700 dark:text-slate-300 font-bold transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={empTermsTitle}
                onChange={(e) => setEmpTermsTitle(e.target.value)}
                placeholder="Employment Terms & Agreement — Name"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none font-semibold focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                Agreement Version *
              </label>
              <input
                type="text"
                required
                value={empTermsVersion}
                onChange={(e) => setEmpTermsVersion(e.target.value)}
                placeholder="v1.0"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none font-mono font-bold focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1 flex items-center justify-between">
              <span>Individual Agreement Content & Clauses *</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {empTermsContent.length} chars
              </span>
            </label>
            <textarea
              required
              rows={12}
              value={empTermsContent}
              onChange={(e) => setEmpTermsContent(e.target.value)}
              placeholder="Paste or write the individual employee contract/terms clauses..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none font-mono text-xs leading-relaxed focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="requireReAcceptance"
              checked={requireReAcceptance}
              onChange={(e) => setRequireReAcceptance(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
            />
            <label
              htmlFor="requireReAcceptance"
              className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Require employee to review and re-accept on next login
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEmpEditorOpen(false)}
              className="w-1/3 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEmpTerms || !empTermsContent.trim()}
              className="w-2/3 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {savingEmpTerms ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Individual Terms...</span>
                </>
              ) : (
                <>
                  <BadgeCheck className="w-4 h-4" />
                  <span>Save & Publish Individual Terms</span>
                </>
              )}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Global Terms Editor Bottom Sheet */}
      <BottomSheet
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={`Edit ${selectedAudience} Global Terms`}
        subtitle="Saved changes remain in Draft until explicitly published."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Version Tag (e.g. v1.1, v2.0)
            </label>
            <input
              type="text"
              required
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="v1.1"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Document Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Terms and Conditions of Service"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Terms Content
            </label>
            <textarea
              required
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type or paste the full terms content..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none font-mono text-xs leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSaveDraft}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Save Draft</span>
            </button>

            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex-1 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>Preview & Publish</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Global Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Terms Preview ({selectedAudience} - {version})
              </h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 max-h-80 overflow-y-auto">
              {content}
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Publishing will set version {version} as current and immediately require re-acceptance for active {selectedAudience.toLowerCase()}s upon their next request.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Back to Edit
              </button>
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Publish Version {version}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Publish Confirm Modal */}
      <ConfirmModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onConfirm={handlePublishTerms}
        title={`Publish ${selectedAudience} Terms Version ${version}`}
        message={`Are you sure you want to publish version ${version}? This will become the authoritative production version and will require re-acceptance from all active ${selectedAudience.toLowerCase()} users.`}
        confirmText="Yes, Publish Now"
      />

      {/* Individual Revert Confirm Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetToDefault}
        title={`Revert ${selectedEmp?.name}'s Terms to Default`}
        message={`Are you sure you want to remove ${selectedEmp?.name}'s custom individual agreement and revert them to the standard company terms?`}
        confirmText="Yes, Revert to Default"
        isDestructive={true}
      />
    </div>
  );
}
