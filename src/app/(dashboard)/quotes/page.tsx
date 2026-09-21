"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  FileText,
  Plus,
  Download,
  Send,
  CheckCircle2,
  Sparkles,
  IndianRupee,
  Printer,
  Trash2,
  Mail,
  MessageSquare,
  ExternalLink,
  Check,
  Edit3,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { generateAndDownloadProposalPDF, ProposalPDFData } from "@/lib/pdfGenerator";

interface QuoteItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
}

export default function QuotesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [quoteTitle, setQuoteTitle] = useState("");
  const [taxRate, setTaxRate] = useState(18);

  const [existingClients, setExistingClients] = useState<any[]>([]);

  // Edit Proposal state
  const [editingQuote, setEditingQuote] = useState<any | null>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editQuoteTitle, setEditQuoteTitle] = useState("");
  const [editStatus, setEditStatus] = useState("DRAFT");
  const [editValidUntil, setEditValidUntil] = useState("30 days from today");
  const [editTaxRate, setEditTaxRate] = useState(18);
  const [editItems, setEditItems] = useState<QuoteItem[]>([]);

  // Send Modal state
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [activeQuoteToSend, setActiveQuoteToSend] = useState<any>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [coverMessage, setCoverMessage] = useState("");

  useEffect(() => {
    if (session?.user?.role === "SUB_ADMIN") {
      showToast("Access restricted: Sub-Admin does not have access to Proposals / Quotes.", "error");
      router.replace("/projects");
    }
  }, [session, router, showToast]);

  useEffect(() => {
    fetch("/mdz-crm/api/clients")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setExistingClients(json.data);
        }
      })
      .catch((err) => console.error("Error fetching clients:", err));
  }, []);

  const [items, setItems] = useState<QuoteItem[]>([
    { id: "1", description: "", qty: 1, rate: 0 },
  ]);

  const [quotesList, setQuotesList] = useState<any[]>([]);

  const subtotal = items.reduce((sum, item) => sum + (item.qty || 0) * (item.rate || 0), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  const handleClientSelect = (cName: string) => {
    setClientName(cName);
    const found = existingClients.find(
      (c) => c.companyName?.toLowerCase().trim() === cName.toLowerCase().trim()
    );
    if (found) {
      if (found.email) setClientEmail(found.email);
      if (found.phone) setClientPhone(found.phone);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: "", qty: 1, rate: 0 },
    ]);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      return filtered.length === 0
        ? [{ id: Date.now().toString(), description: "", qty: 1, rate: 0 }]
        : filtered;
    });
  };

  const handleDeleteQuote = (quoteId: string) => {
    setQuotesList((prev) => prev.filter((q) => q.id !== quoteId));
    showToast("Proposal removed successfully", "info");
  };

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const newQuo = {
      id: `QUO-2026-00${quotesList.length + 1}`,
      client: clientName || "New Enterprise Client",
      clientEmail: clientEmail.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      title: quoteTitle || "Custom Software Development Proposal",
      subtotal,
      tax: taxAmount,
      total: grandTotal,
      status: "DRAFT",
      validUntil: "30 days from today",
      createdAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      items: items.filter((it) => it.description.trim() || it.rate > 0).map((it) => ({ ...it })),
    };
    setQuotesList([newQuo, ...quotesList]);
    showToast(`✓ Proposal ${newQuo.id} generated for ₹${grandTotal.toLocaleString("en-IN")}`, "success");
    setIsCreateOpen(false);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setQuoteTitle("");
    setItems([{ id: Date.now().toString(), description: "", qty: 1, rate: 0 }]);
  };

  const editSubtotal = editItems.reduce((sum, item) => sum + (item.qty || 0) * (item.rate || 0), 0);
  const editTaxAmount = (editSubtotal * editTaxRate) / 100;
  const editGrandTotal = editSubtotal + editTaxAmount;

  const handleOpenEdit = (q: any) => {
    setEditingQuote(q);
    setEditClientName(q.client || "");
    setEditClientEmail(q.clientEmail || "");
    setEditClientPhone(q.clientPhone || "");
    setEditQuoteTitle(q.title || "");
    setEditStatus(q.status || "DRAFT");
    setEditValidUntil(q.validUntil || "30 days from today");
    setEditTaxRate(18);
    setEditItems(
      Array.isArray(q.items) && q.items.length > 0
        ? q.items.map((it: any) => ({ ...it }))
        : [{ id: Date.now().toString(), description: q.title || "Custom Software Development", qty: 1, rate: q.subtotal || q.total || 0 }]
    );
  };

  const handleAddEditItem = () => {
    setEditItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: "", qty: 1, rate: 0 },
    ]);
  };

  const handleDeleteEditItem = (id: string) => {
    setEditItems((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      return filtered.length === 0
        ? [{ id: Date.now().toString(), description: "", qty: 1, rate: 0 }]
        : filtered;
    });
  };

  const handleSaveEditQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;

    const validItems = editItems.filter((it) => it.description.trim() || it.rate > 0);
    const calculatedSubtotal = validItems.reduce((sum, item) => sum + (item.qty || 0) * (item.rate || 0), 0);
    const calculatedTax = (calculatedSubtotal * editTaxRate) / 100;
    const calculatedTotal = calculatedSubtotal + calculatedTax;

    const updated = {
      ...editingQuote,
      client: editClientName || "Enterprise Client",
      clientEmail: editClientEmail.trim() || undefined,
      clientPhone: editClientPhone.trim() || undefined,
      title: editQuoteTitle || "Commercial Proposal",
      status: editStatus,
      validUntil: editValidUntil,
      items: validItems,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      total: calculatedTotal,
    };

    setQuotesList((prev) => prev.map((q) => (q.id === editingQuote.id ? updated : q)));
    showToast(`✓ Proposal ${editingQuote.id} updated successfully!`, "success");
    setEditingQuote(null);
  };

  // Download PDF Handler
  const handleDownloadPDF = (q: any) => {
    try {
      generateAndDownloadProposalPDF(q);
      showToast(`✓ Downloaded ${q.id} proposal PDF`, "success");
    } catch (e) {
      console.error("PDF generation error:", e);
      showToast("Failed to generate PDF", "error");
    }
  };

  // Send Proposal Handler
  const handleOpenSendModal = (q: any) => {
    setActiveQuoteToSend(q);
    setRecipientEmail(q.clientEmail || "");
    setRecipientPhone(q.clientPhone || "");
    setEmailSubject(`Commercial Proposal: ${q.title} (${q.id})`);
    setCoverMessage(
      `Dear ${q.client},\n\nWe are pleased to share our official commercial proposal for "${q.title}".\n\n• Proposal ID: ${q.id}\n• Total Amount: ₹${q.total.toLocaleString("en-IN")} (incl. 18% GST)\n• Valid Until: ${q.validUntil}\n\nPlease review the attached scope and deliverable specifications. Let us know if you have any questions or require adjustments.\n\nWarm regards,\nMDZ OS Commercial Architecture Team`
    );
    setIsSendOpen(true);
  };

  const handleDispatchEmail = () => {
    if (!activeQuoteToSend) return;
    if (!recipientEmail.trim()) {
      showToast("Please enter a recipient email address", "error");
      return;
    }

    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail.trim())}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(coverMessage)}`;

    window.open(mailtoUrl, "_blank");

    setQuotesList((prev) =>
      prev.map((q) =>
        q.id === activeQuoteToSend.id
          ? { ...q, status: "SENT", clientEmail: recipientEmail.trim(), clientPhone: recipientPhone.trim() }
          : q
      )
    );

    showToast(`✉️ Proposal ${activeQuoteToSend.id} marked as SENT and dispatched to ${recipientEmail}`, "success");
    setIsSendOpen(false);
  };

  const handleDispatchWhatsApp = () => {
    if (!activeQuoteToSend) return;
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const waText = `*Commercial Proposal - MDZ OS*\n\n*Client:* ${activeQuoteToSend.client}\n*Proposal Ref:* ${activeQuoteToSend.id}\n*Title:* ${activeQuoteToSend.title}\n*Total Value:* ₹${activeQuoteToSend.total.toLocaleString("en-IN")} (incl. 18% GST)\n*Validity:* ${activeQuoteToSend.validUntil}\n\nPlease review our proposal document. Let us know your availability to discuss next steps.`;

    const waUrl = waPhone
      ? `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(waText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;

    window.open(waUrl, "_blank");

    setQuotesList((prev) =>
      prev.map((q) =>
        q.id === activeQuoteToSend.id
          ? { ...q, status: "SENT", clientPhone: recipientPhone.trim() }
          : q
      )
    );

    showToast(`💬 Proposal ${activeQuoteToSend.id} opened in WhatsApp`, "success");
    setIsSendOpen(false);
  };

  const handleMarkAsSentDirectly = () => {
    if (!activeQuoteToSend) return;
    setQuotesList((prev) =>
      prev.map((q) => (q.id === activeQuoteToSend.id ? { ...q, status: "SENT" } : q))
    );
    showToast(`✓ Proposal ${activeQuoteToSend.id} marked as SENT`, "success");
    setIsSendOpen(false);
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Quotes & Proposals Builder"
        description="Generate itemized commercial proposals, tax breakdowns, PDF exports, and client sign-offs."
        badge="PROPOSAL SUITE"
        icon={<FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Commercial Proposal</span>
          </button>
        }
      />

      {/* Quote Registers */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Active Commercial Proposals
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Generated commercial quotes linked to CRM leads.</p>
          </div>
          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            {quotesList.length} Quotes
          </span>
        </div>

        <div className="space-y-4">
          {quotesList.length === 0 ? (
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No proposals created yet</p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm"
              >
                + Create First Proposal
              </button>
            </div>
          ) : (
            quotesList.map((q) => (
              <div
                key={q.id}
                className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 transition-all duration-200 space-y-4 shadow-xs dark:shadow-lg group"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                      {q.id}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">🏢 {q.client}</h3>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      q.status === "ACCEPTED"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                        : q.status === "SENT"
                        ? "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20"
                        : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                    }`}
                  >
                    {q.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{q.title}</h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex flex-wrap items-center gap-3">
                    <span>Subtotal: ₹{q.subtotal.toLocaleString("en-IN")}</span>
                    <span>GST (18%): ₹{q.tax.toLocaleString("en-IN")}</span>
                    <span>Valid Until: {q.validUntil}</span>
                    {q.clientEmail && <span className="text-indigo-600 dark:text-indigo-400">✉️ {q.clientEmail}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                  <div className="font-mono font-extrabold text-lg text-slate-900 dark:text-slate-100">
                    ₹{q.total.toLocaleString("en-IN")}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 font-semibold text-xs border border-amber-200 dark:border-amber-800 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
                      title="Edit / Modify Proposal"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDownloadPDF(q)}
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
                      title="Download PDF Proposal"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Download PDF</span>
                    </button>

                    <button
                      onClick={() => handleOpenSendModal(q)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Send Proposal to Client"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{q.status === "SENT" ? "Resend Proposal" : "Send Proposal"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuote(q.id)}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                      title="Delete proposal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Proposal Sheet */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Commercial Proposal / Quote"
        subtitle="Itemized rate calculation with automatic GST computation."
      >
        <form onSubmit={handleCreateQuote} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Client Company Name *</label>
            <input
              type="text"
              required
              list="existing-clients-datalist"
              value={clientName}
              onChange={(e) => handleClientSelect(e.target.value)}
              placeholder="e.g. Apex Global Tech"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
            />
            <datalist id="existing-clients-datalist">
              {existingClients.map((c) => (
                <option key={c.id} value={c.companyName}>
                  {c.companyName} {c.email ? `(${c.email})` : ""}
                </option>
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Client Email (For Dispatch)</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Client Phone / WhatsApp</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                maxLength={10}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Proposal Title *</label>
            <input
              type="text"
              required
              value={quoteTitle}
              onChange={(e) => setQuoteTitle(e.target.value)}
              placeholder="e.g. Custom Web Platform Development"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
              <span>Itemized Deliverables</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={item.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Item #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    title="Delete this deliverable"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Deliverable description (e.g. UI/UX Design, REST API...)"
                  value={item.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, description: val } : i)));
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium text-xs"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono font-semibold block mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={item.qty || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, qty: val } : i)));
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-slate-100 font-mono font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono font-semibold block mb-1">Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={item.rate || ""}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, rate: val } : i)));
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-slate-100 font-mono font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Calculation */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>GST (18%):</span>
              <span>₹{taxAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>Grand Total:</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-2 cursor-pointer"
          >
            Generate & Save Proposal
          </button>
        </form>
      </BottomSheet>

      {/* Send Proposal Sheet */}
      {activeQuoteToSend && (
        <BottomSheet
          isOpen={isSendOpen}
          onClose={() => setIsSendOpen(false)}
          title="Send Commercial Proposal to Client"
          subtitle={`Dispatch ${activeQuoteToSend.id} directly via Email or WhatsApp.`}
        >
          <div className="space-y-4 text-xs">
            {/* Proposal Summary Card */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {activeQuoteToSend.id}
                </span>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {activeQuoteToSend.client}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium line-clamp-1">
                  {activeQuoteToSend.title}
                </p>
              </div>
              <div className="text-right font-mono shrink-0 pl-3">
                <div className="text-[10px] text-slate-400">Total Quote</div>
                <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                  ₹{activeQuoteToSend.total.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Recipient Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Recipient Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-8 pr-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Recipient Phone / WhatsApp
                </label>
                <div className="relative">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-8 pr-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                Email Subject
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            {/* Cover Message */}
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                Cover Note / Message
              </label>
              <textarea
                rows={5}
                value={coverMessage}
                onChange={(e) => setCoverMessage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium resize-none leading-relaxed"
              />
            </div>

            {/* PDF Attachment Indicator & Download copy */}
            <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {activeQuoteToSend.id}_Proposal.pdf
                  </span>
                  <span className="text-[10px] text-slate-500 block">Ready to download & attach</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadPDF(activeQuoteToSend)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Download className="w-3 h-3 text-indigo-600" />
                <span>Save PDF</span>
              </button>
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDispatchEmail}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send via Email Client</span>
                </button>

                <button
                  type="button"
                  onClick={handleDispatchWhatsApp}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleMarkAsSentDirectly}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mark Proposal as SENT without dispatching</span>
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Edit Proposal Sheet */}
      {editingQuote && (
        <BottomSheet
          isOpen={!!editingQuote}
          onClose={() => setEditingQuote(null)}
          title={`Edit Proposal: ${editingQuote.id}`}
          subtitle="Modify client info, status, deliverables, quantities, and rates."
        >
          <form onSubmit={handleSaveEditQuote} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Client Company Name *</label>
                <input
                  type="text"
                  required
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  placeholder="e.g. Apex Global Tech"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Proposal Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-semibold"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SENT">SENT</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="REVISED">REVISED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Client Email</label>
                <input
                  type="email"
                  value={editClientEmail}
                  onChange={(e) => setEditClientEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Client Phone / WhatsApp</label>
                <input
                  type="tel"
                  value={editClientPhone}
                  onChange={(e) => setEditClientPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Proposal Title *</label>
                <input
                  type="text"
                  required
                  value={editQuoteTitle}
                  onChange={(e) => setEditQuoteTitle(e.target.value)}
                  placeholder="e.g. Custom Web Platform Development"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Valid Until</label>
                <input
                  type="text"
                  value={editValidUntil}
                  onChange={(e) => setEditValidUntil(e.target.value)}
                  placeholder="e.g. 30 days from today"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>Itemized Deliverables</span>
                <button
                  type="button"
                  onClick={handleAddEditItem}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>

              {editItems.map((item, idx) => (
                <div key={item.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Item #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteEditItem(item.id)}
                      className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                      title="Delete this deliverable"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Deliverable description"
                    value={item.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, description: val } : i)));
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono font-semibold block mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={item.qty || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setEditItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, qty: val } : i)));
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-slate-100 font-mono font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono font-semibold block mb-1">Rate (₹)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={item.rate || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setEditItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, rate: val } : i)));
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-slate-100 font-mono font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Calculation */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span>₹{editSubtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST (18%):</span>
                <span>₹{editTaxAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-800">
                <span>Updated Grand Total:</span>
                <span>₹{editGrandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingQuote(null)}
                className="w-1/3 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Save Proposal Changes
              </button>
            </div>
          </form>
        </BottomSheet>
      )}
    </div>
  );
}
