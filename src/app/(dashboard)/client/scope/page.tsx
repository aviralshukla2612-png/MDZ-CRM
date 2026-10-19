"use client";

import React, { useState, useEffect } from "react";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import {
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  Save,
  RefreshCw,
  AlertCircle,
  FileText,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";

const DEFAULT_CLAUSES = [
  { num: 1, title: "Scope of Retained Services", text: "Organic short-form video production, graphic design, social media scheduling, and Meta ad campaign performance management." },
  { num: 2, title: "Out-of-Scope Services", text: "Physical camera crew travel out of town, website core backend modifications, software licensing fees, and direct platform ad spends." },
  { num: 3, title: "Monthly Deliverables Quota", text: "30 Reels / Short Videos, 15 Multi-Slide Carousels, 10 Static Graphic Posts, and 45 Daily Story Sequences." },
  { num: 4, title: "24-48 Hours Client Approval SLA", text: "Client agrees to approve or provide consolidated revision feedback on drafts within 48 hours to prevent publishing bottlenecks." },
  { num: 5, title: "Revision Limit (3 Maximum)", text: "Up to three (3) consolidated revision rounds are included per deliverable. Beyond 3, revisions incur standard hourly studio billing." },
  { num: 6, title: "Client Asset Provisioning", text: "Client must supply raw footage, brand vector assets, and brand photography by the 5th calendar day of each operating month." },
  { num: 7, title: "Ad Spend & Payment Billing", text: "Platform advertising spend (Meta, Google) is billed directly to the Client's credit card on file within their respective ad manager." },
  { num: 8, title: "Retainer Payment Schedule", text: "Monthly agency retainer fees are due in full on the 1st of each calendar month via direct NEFT / RTGS transfer." },
  { num: 9, title: "Late Payment & Service Pause", text: "Invoices overdue by more than 5 business days result in an immediate automated freeze of campaign management and production." },
];

export default function ScopeSlaPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scopeData, setScopeData] = useState<any>({
    signedBy: "Authorized Client Signatory",
    signerTitle: "Founder & Managing Director",
    signedAt: "2026-10-01T10:30:00Z",
    status: "SIGNED",
    contractDuration: "6 Months Retainer",
    approvalWindow: "24 to 48 Hours SLA",
    revisionLimit: "Strict Maximum 3 Iterations / Deliverable",
    monthlyDeliverables: "30 Reels, 15 Carousels, 10 Graphics, 45 Stories",
    clauses: DEFAULT_CLAUSES,
  });
  const [clientId, setClientId] = useState<string>("");

  // Edit SLA Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSignedBy, setEditSignedBy] = useState("");
  const [editSignerTitle, setEditSignerTitle] = useState("");
  const [editStatus, setEditStatus] = useState("SIGNED");
  const [editDuration, setEditDuration] = useState("");
  const [editApprovalWindow, setEditApprovalWindow] = useState("");
  const [editRevisionLimit, setEditRevisionLimit] = useState("");
  const [editDeliverables, setEditDeliverables] = useState("");

  const getClientId = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("clientId") || localStorage.getItem("mdz_active_client_id") || "";
    }
    return "";
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const cid = getClientId();
      setClientId(cid);
      const url = cid ? `/mdz-crm/api/client/portal-data?clientId=${cid}` : "/mdz-crm/api/client/portal-data";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data && json.data.scope) {
        setScopeData((prev: any) => ({
          ...prev,
          ...json.data.scope,
          clauses: json.data.scope.clauses || DEFAULT_CLAUSES,
        }));
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load SLA document", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (updatedData?: any) => {
    try {
      setSaving(true);
      const cid = clientId || getClientId();
      const payload = updatedData || scopeData;
      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: cid || undefined,
          section: "scope",
          sectionData: payload,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ SLA Scope & Deliverables contract saved live", "success");
        if (json.data && json.data.scope) {
          setScopeData(json.data.scope);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating SLA scope", "error");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    setEditSignedBy(scopeData.signedBy || "");
    setEditSignerTitle(scopeData.signerTitle || "");
    setEditStatus(scopeData.status || "SIGNED");
    setEditDuration(scopeData.contractDuration || "6 Months Retainer");
    setEditApprovalWindow(scopeData.approvalWindow || "24 to 48 Hours SLA");
    setEditRevisionLimit(scopeData.revisionLimit || "Strict Maximum 3 Iterations");
    setEditDeliverables(scopeData.monthlyDeliverables || "30 Reels, 15 Carousels, 10 Graphics");
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...scopeData,
      signedBy: editSignedBy,
      signerTitle: editSignerTitle,
      status: editStatus,
      contractDuration: editDuration,
      approvalWindow: editApprovalWindow,
      revisionLimit: editRevisionLimit,
      monthlyDeliverables: editDeliverables,
      signedAt: editStatus === "SIGNED" && !scopeData.signedAt ? new Date().toISOString() : scopeData.signedAt,
    };
    setScopeData(updated);
    setIsEditOpen(false);
    handleSave(updated);
  };

  const clauses = scopeData.clauses || DEFAULT_CLAUSES;

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-12 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-40 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-96 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
      </div>
    );
  }

  const isSigned = scopeData.status === "SIGNED";

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <ClientPortalNav currentTab="/client/scope" />

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              LEGAL SERVICE LEVEL AGREEMENT (SLA)
            </span>
            <span className="text-[11px] font-mono text-stone-400">Governance & Clause Contract</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <FileSignature className="w-7 h-7 text-emerald-400" />
            <span>Scope SLA & Deliverable Sign-Off Matrix</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            Admin & Sub-Admin live editing enabled: Locked deliverable commitments, 48-hr feedback window, and digitally signed governance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openEditModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit SLA Terms</span>
          </button>
          <button
            onClick={() => fetchData()}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors border border-stone-700 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save SLA"}</span>
          </button>
        </div>
      </div>

      {/* Contract Sign-Off Hero Status Box */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isSigned ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
            <span className="font-mono text-xs font-bold text-slate-500 uppercase">Status:</span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
              isSigned ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
            }`}>
              {isSigned ? "LOCKED & DIGITALLY EXECUTED" : "PENDING SIGNATURE"}
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-stone-100">
            Signed by: {scopeData.signedBy} ({scopeData.signerTitle})
          </h2>
          <p className="text-xs text-slate-500 dark:text-stone-400">
            Duration: <strong className="text-slate-800 dark:text-stone-200">{scopeData.contractDuration}</strong> • SLA Review Window: <strong className="text-slate-800 dark:text-stone-200">{scopeData.approvalWindow}</strong> • Revision Limit: <strong className="text-slate-800 dark:text-stone-200">{scopeData.revisionLimit}</strong>
          </p>
        </div>

        <button
          onClick={openEditModal}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-stone-700 hover:bg-slate-50 dark:hover:bg-stone-800 text-slate-800 dark:text-stone-200 font-bold text-xs transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Edit3 className="w-4 h-4 text-emerald-600" />
          <span>Edit Signatory / Terms</span>
        </button>
      </div>

      {/* SLA Clauses List */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Master Service Agreement Clauses & Operational Standards</span>
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400">{clauses.length} Clauses Enforced</span>
        </div>

        <div className="space-y-3">
          {clauses.map((clause: any) => (
            <div
              key={clause.num}
              className="p-4 rounded-xl bg-slate-50 dark:bg-stone-800/60 border border-slate-100 dark:border-stone-700 space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  CLAUSE 0{clause.num}
                </span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-stone-100">{clause.title}</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-stone-300 leading-relaxed pl-1 pt-1">
                {clause.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit SLA Modal */}
      <BottomSheet
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit SLA & Contract Details"
        subtitle="Update signatory info, contract status, revision limits, and turnaround SLAs."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Signatory Full Name *</label>
              <input
                type="text"
                required
                value={editSignedBy}
                onChange={(e) => setEditSignedBy(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-emerald-500 font-semibold"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Signatory Designation</label>
              <input
                type="text"
                value={editSignerTitle}
                onChange={(e) => setEditSignerTitle(e.target.value)}
                placeholder="e.g. Managing Director"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Contract Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-semibold"
              >
                <option value="SIGNED">SIGNED (Digitally Executed)</option>
                <option value="PENDING_SIGNATURE">PENDING SIGNATURE</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Contract Duration</label>
              <input
                type="text"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                placeholder="e.g. 6 Months Retainer / Annual Agreement"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Client Approval SLA Window</label>
              <input
                type="text"
                value={editApprovalWindow}
                onChange={(e) => setEditApprovalWindow(e.target.value)}
                placeholder="e.g. 24 to 48 Hours SLA"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Revision Limit Policy</label>
              <input
                type="text"
                value={editRevisionLimit}
                onChange={(e) => setEditRevisionLimit(e.target.value)}
                placeholder="e.g. Strict Maximum 3 Iterations / Deliverable"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">Monthly Deliverables Quota Summary</label>
            <input
              type="text"
              value={editDeliverables}
              onChange={(e) => setEditDeliverables(e.target.value)}
              placeholder="e.g. 30 Reels, 15 Multi-Slide Carousels, 10 Static Graphics"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            ✓ Save & Update SLA Scope
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
