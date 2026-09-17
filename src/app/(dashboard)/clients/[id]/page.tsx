"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  ArrowLeft,
  Building,
  User,
  Mail,
  Phone,
  IndianRupee,
  ExternalLink,
  FolderKanban,
  FileText,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
} from "lucide-react";

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [client, setClient] = useState<any>(null);
  const [linkedProjects, setLinkedProjects] = useState<any[]>([]);
  const [clientNotes, setClientNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "invoices" | "notes">("overview");
  const [isNoteSheetOpen, setIsNoteSheetOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  React.useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/mdz-crm/api/clients/${params.id}`);
      const json = await res.json();
      
      if (json.success && json.data) {
        const c = json.data;
        const formattedClient = {
          id: c.id,
          clientCode: c.clientNumber,
          companyName: c.companyName,
          contactPerson: c.contacts?.[0]?.name || "Primary Contact",
          email: c.email,
          phone: c.phone,
          industry: c.industry || "General Client",
          totalBilling: Number(c.totalBusiness) || 0,
          paidBilling: Math.max(0, (Number(c.totalBusiness) || 0) - (Number(c.outstandingBalance) || 0)),
          pendingBilling: Number(c.outstandingBalance) || 0,
          status: c.status || "ACTIVE",
          portalToken: c.portalTokens?.[0]?.token || c.id,
          invoices: Array.isArray(c.invoices) ? c.invoices : [],
          notes: c.notes ? [{ id: "n1", author: "Account Note", text: c.notes, time: "Initial Note" }] : [],
        };
        setClient(formattedClient);
        setLinkedProjects(c.projects || []);
        setClientNotes(formattedClient.notes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setClientNotes([
      { id: Date.now().toString(), author: "Rahul MDZ", text: noteText, time: "Just now" },
      ...clientNotes,
    ]);
    showToast("✓ Note added to Client 360° log", "success");
    setNoteText("");
    setIsNoteSheetOpen(false);
  };

  if (loading) return <div className="p-12 text-center text-slate-400 animate-pulse">Loading Client Data...</div>;
  if (!client) return <div className="p-12 text-center text-rose-400">Client Not Found</div>;

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/mdz-crm/api/clients/${params.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Client deleted successfully", "success");
        router.push("/clients");
      } else {
        showToast(json.error || "Failed to delete client", "error");
        setIsDeleting(false);
      }
    } catch (e) {
      showToast("Error deleting client", "error");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clients Directory</span>
        </Link>
        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {client.clientCode}
        </span>
      </div>

      {/* Client Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {client.status} ACCOUNT
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {client.industry}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {client.companyName}
            </h1>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
              <span>Primary Contact: <strong className="text-slate-800 dark:text-slate-200">{client.contactPerson}</strong></span>
              <span>•</span>
              <span>{client.email}</span>
              <span>•</span>
              <span>{client.phone}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsDeleteOpen(true)}
              disabled={isDeleting}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors flex items-center gap-1.5 border border-rose-200/60 dark:border-rose-800/60 disabled:opacity-50 touch-target"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? "Deleting..." : "Delete Client"}</span>
            </button>
            <Link
              href={`/portal/${client.portalToken}`}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 touch-target"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch Client Portal</span>
            </Link>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Contract Value</span>
            <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-slate-100">
              ₹{client.totalBilling.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-0.5">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase">Total Paid Revenue</span>
            <div className="text-lg font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
              ₹{client.paidBilling.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 space-y-0.5">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-400 uppercase">Pending Receivable</span>
            <div className="text-lg font-extrabold font-mono text-rose-700 dark:text-rose-300">
              ₹{client.pendingBilling.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {[
          { id: "overview", label: "Client 360° Overview" },
          { id: "projects", label: `Linked Projects (${linkedProjects.length})` },
          { id: "invoices", label: `Invoices & Billing (${client.invoices.length})` },
          { id: "notes", label: `Communication & Notes (${clientNotes.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Account Details & Contacts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Company Name</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{client.companyName}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Primary Contact</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{client.contactPerson}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Email Address</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{client.email}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Phone Number</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{client.phone}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Portal Security Token</h3>
              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300 font-mono text-xs flex items-center justify-between">
                <span>{client.portalToken}</span>
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Verified client portal token session link for external client viewing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Linked Projects */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          {linkedProjects.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
              <FolderKanban className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No linked projects found</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Projects created for this client will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {linkedProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{proj.projectNumber || proj.id}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {proj.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{proj.name}</h4>
                    <div className="text-xs text-slate-500 dark:text-slate-400">TM: <strong className="text-slate-800 dark:text-slate-200">{proj.tmName || "Unassigned"}</strong></div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-400">Weighted Progress</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono">{proj.progressPercentage || proj.progress || 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full" style={{ width: `${proj.progressPercentage || proj.progress || 0}%` }} />
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Link
                        href={`/projects/${proj.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs touch-target"
                      >
                        <span>Open Workspace</span>
                        <FolderKanban className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Invoices */}
      {activeTab === "invoices" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Issued Invoices Ledger</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {client.invoices?.length || 0} Invoices
            </span>
          </div>

          {(!client.invoices || client.invoices.length === 0) ? (
            <div className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No invoices issued yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invoices generated for this client will appear here with live payment statuses.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {client.invoices.map((inv: any) => {
                const status = (inv.status || "UNPAID").toUpperCase();
                const isPaid = status === "PAID";
                const isOverdue = status === "OVERDUE";
                const amount = Number(inv.grandTotal ?? inv.totalAmount ?? 0);
                const issueDate = inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : (inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "");
                const dueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "";

                return (
                  <div
                    key={inv.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {issueDate && <span>Issued: {issueDate}</span>}
                        {dueDate && <span> • Due: {dueDate}</span>}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        ₹{amount.toLocaleString("en-IN")}
                      </div>
                      <span
                        className={`text-[10px] font-bold ${
                          isPaid
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isOverdue
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Communication & Notes */}
      {activeTab === "notes" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Client Communication & Notes Log</h3>
            <button
              onClick={() => setIsNoteSheetOpen(true)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Add Client Note
            </button>
          </div>
          <div className="space-y-3 text-xs">
            {clientNotes.map((n) => (
              <div key={n.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-slate-900 dark:text-slate-100">{n.author}</div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{n.text}</p>
                <div className="text-[10px] font-mono text-slate-400">{n.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Client Note Bottom Sheet */}
      <BottomSheet
        isOpen={isNoteSheetOpen}
        onClose={() => setIsNoteSheetOpen(false)}
        title="Add Client Log Note"
        subtitle="Saved to Client 360° account log."
      >
        <form onSubmit={handleAddNote} className="space-y-4 text-xs">
          <textarea
            required
            rows={4}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type notes from client meeting, call, or billing agreement..."
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs touch-target"
          >
            Save Client Note
          </button>
        </form>
      </BottomSheet>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={executeDelete}
        title={`Delete Client "${client.companyName}"?`}
        message="Are you sure you want to permanently delete this client? All associated projects, invoices, contacts, and records will be permanently removed."
        confirmText={isDeleting ? "Deleting..." : "Delete Client"}
        isDestructive={true}
      />
    </div>
  );
}
