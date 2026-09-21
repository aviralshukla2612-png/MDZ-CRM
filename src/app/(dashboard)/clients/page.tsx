"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataImportModal } from "@/components/ui/DataImportModal";
import {
  Users,
  Plus,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Trash2,
  Edit3,
} from "lucide-react";
import { EditClientModal } from "@/components/clients/EditClientModal";

export default function ClientsPage() {
  const { showToast } = useToast();
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/clients");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setClientsList(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (val: string) => {
    let digits = val.replace(/\D/g, "");
    if (digits.length > 10 && digits.startsWith("91")) {
      digits = digits.slice(2);
    }
    setPhone(digits.slice(0, 10));
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      showToast("✕ Phone number must be exactly 10 digits. Words and extra numbers are not allowed.", "error");
      return;
    }

    try {
      const res = await fetch("/mdz-crm/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactPerson,
          email,
          phone: `+91 ${cleanPhone}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Client "${companyName || "New Client"}" created`, "success");
        fetchClients();
        setIsAddOpen(false);
        setCompanyName("");
        setContactPerson("");
        setEmail("");
        setPhone("");
      } else {
        showToast(`✕ Failed to create client: ${json.error || "Unknown error"}`, "error");
      }
    } catch (error) {
      showToast(`✕ Error creating client`, "error");
    }
  };

  const executeDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/mdz-crm/api/clients/${clientToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `✓ Client "${clientToDelete.name}" deleted successfully`, "success");
        setClientsList((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      } else {
        showToast(`✕ Failed to delete client: ${json.error || "Unknown error"}`, "error");
      }
    } catch (e) {
      showToast("✕ Network error deleting client", "error");
    } finally {
      setIsDeleting(false);
      setClientToDelete(null);
    }
  };

  const handleImportData = async (data: any[]) => {
    let successCount = 0;
    
    for (const row of data) {
      try {
        const company = row["Company Name"] || row["companyName"] || row["Company"] || row["clientName"];
        const contact = row["Contact Person"] || row["contactPerson"] || row["Contact"] || row["Name"];
        const rowEmail = row["Email"] || row["email"];
        const rowPhone = row["Phone"] || row["phone"] || row["Mobile"];
        const billing = row["Total Billing"] || row["totalBilling"] || row["Billing"] || 0;

        if (!company) continue;

        const res = await fetch("/mdz-crm/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: company,
            contactPerson: contact || "Unknown Contact",
            email: rowEmail || "client@company.com",
            phone: rowPhone || "+91 00000 00000",
            totalBilling: Number(billing) || 0,
          }),
        });
        
        if (res.ok) successCount++;
      } catch (e) {
        console.error("Import error on row:", row);
      }
    }
    
    showToast(`✓ Imported ${successCount} clients successfully`, "success");
    fetchClients();
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Clients Directory"
        description="Manage company accounts, financial ledgers, project links, and portal access."
        badge={`${clientsList.length} CLIENT ACCOUNTS`}
        icon={<Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <div className="flex items-center gap-3">

            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Client</span>
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading enterprise client directory...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clientsList.map((c) => (
            <div
              key={c.id}
              className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xs dark:shadow-2xl hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group space-y-4"
            >
              <Link href={`/clients/${c.id}`} className="space-y-3 block">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                    {c.clientCode || c.id}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    {c.status || "ACTIVE"}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    {c.companyName}
                  </h3>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{c.contactPerson || "Primary Contact"}</div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 font-mono pt-1">
                  <div>✉️ {c.email || "contact@client.com"}</div>
                  <div>📞 {c.phone || "+91 98000 00000"}</div>
                </div>
              </Link>

              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans uppercase font-semibold">Total Billing</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-slate-100">₹{(c.totalBilling || 0).toLocaleString("en-IN")}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingClient(c);
                    }}
                    title="Edit Client Information"
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/60 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setClientToDelete({ id: c.id, name: c.companyName });
                    }}
                    title="Delete Client Account"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    href={`/clients/${c.id}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all group-hover:translate-x-0.5"
                  >
                    <span>Client 360°</span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Bottom Sheet */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Client Account"
        subtitle="Provision client account and tokenized portal credentials."
      >
        <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Company Name</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Paramount Retail Group"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Primary Contact Person</label>
            <input
              type="text"
              required
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Vikram Patel (CEO)"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vikram@paramount.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">
                  Phone <span className="text-red-500">*</span>
                </label>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    phone.length === 10
                      ? "text-emerald-600 dark:text-emerald-400"
                      : phone.length > 0
                      ? "text-amber-500"
                      : "text-slate-400"
                  }`}
                >
                  {phone.length}/10 digits
                </span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-slate-400 dark:text-slate-500 font-mono select-none pointer-events-none">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="9822211000"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl p-3 pl-12 text-slate-900 dark:text-slate-100 outline-none transition-all font-mono tracking-wider text-xs ${
                    phone.length === 10
                      ? "border-emerald-500/60 focus:border-emerald-500"
                      : phone.length > 0
                      ? "border-amber-500/60 focus:border-amber-500"
                      : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                  }`}
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-2"
          >
            Create Client Account
          </button>
        </form>
      </BottomSheet>

      <DataImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportData}
        title="Import Client Directory"
      />

      <ConfirmModal
        isOpen={Boolean(clientToDelete)}
        onClose={() => setClientToDelete(null)}
        onConfirm={executeDeleteClient}
        title={`Delete Client "${clientToDelete?.name}"?`}
        message="Are you sure you want to permanently delete this client? All associated projects, invoices, contacts, and records will be removed."
        confirmText={isDeleting ? "Deleting..." : "Delete Client"}
        isDestructive={true}
      />

      {/* Edit Client Modal */}
      {editingClient && (
        <EditClientModal
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
          client={editingClient}
          onSuccess={() => {
            fetchClients();
            showToast("Client details updated successfully!", "success");
          }}
        />
      )}
    </div>
  );
}
