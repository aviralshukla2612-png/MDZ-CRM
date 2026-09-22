"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeadPipelineBoard } from "@/components/sales/LeadPipelineBoard";
import { Lead } from "@/components/sales/LeadPipelineBoard";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DataImportModal } from "@/components/ui/DataImportModal";
import {
  Target,
  Plus,
  Sparkles,
  FileSpreadsheet,
  Webhook,
  Copy,
  Check,
  Send,
  ExternalLink,
  Zap,
  Globe,
  MessageCircle,
} from "lucide-react";

export default function LeadsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [leadSource, setLeadSource] = useState("WEBSITE");
  const [leadValue, setLeadValue] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [projectScope, setProjectScope] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [simulatingChannel, setSimulatingChannel] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [session, router]);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/mdz-crm/api/leads");
      const json = await res.json();
      if (json.success) {
        setLeads(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateLeadStageApi = async (leadId: string, newStage: string) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
    try {
      const res = await fetch(`/mdz-crm/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      const json = await res.json();
      if (!json.success) {
        showToast("Failed to update lead stage", "error");
        fetchLeads();
      } else {
        showToast(`Moved lead to ${newStage}`, "success");
      }
    } catch (e) {
      showToast("Network error", "error");
      fetchLeads();
    }
  };

  const deleteLeadApi = async (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    try {
      const res = await fetch(`/mdz-crm/api/leads/${leadId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        showToast("Failed to delete lead", "error");
        fetchLeads();
      } else {
        showToast("Lead permanently deleted", "success");
      }
    } catch (e) {
      showToast("Network error while deleting", "error");
      fetchLeads();
    }
  };

  const convertLeadToClientApi = async (leadId: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/leads/${leadId}/convert`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        showToast(`🎉 Converted to Client "${json.data.client.companyName}"`, "success");
        fetchLeads();
      } else {
        showToast(json.error || "Failed to convert lead", "error");
      }
    } catch (e) {
      showToast("Network error converting lead", "error");
    }
  };

  const handlePhoneChange = (val: string) => {
    let digits = val.replace(/\D/g, "");
    if (digits.length > 10 && digits.startsWith("91")) {
      digits = digits.slice(2);
    }
    setPhone(digits.slice(0, 10));
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      showToast("Phone number must be exactly 10 digits. Words and extra numbers are not allowed.", "error");
      return;
    }

    try {
      const res = await fetch("/mdz-crm/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          contactPerson,
          phone: `+91 ${cleanPhone}`,
          email: email || "contact@prospect.com",
          source: leadSource,
          projectScope: projectScope || "General inquiry",
          leadValue: Number(leadValue) || 0,
          expectedRevenue: Number(leadValue) || 0,
          stage: "NEW",
          leadPriority: "HIGH",
          gstNo: gstNo ? gstNo.trim().toUpperCase() : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Lead "${clientName || 'New Prospect'}" created in CRM`, "success");
        setIsAddOpen(false);
        setClientName("");
        setContactPerson("");
        setEmail("");
        setPhone("");
        setLeadValue("");
        setGstNo("");
        setProjectScope("");
        setLeadSource("WEBSITE");
        fetchLeads();
      } else {
        showToast(json.error || "Failed to add lead", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const handleSimulateInboundLead = async (sourceType: string) => {
    try {
      setSimulatingChannel(sourceType);
      const names = ["Aarav Mehta", "Priya Sharma", "Rohan Verma", "Sneha Patel", "Vikram Malhotra"];
      const companies = ["Apex FinTech", "Nova Retail Labs", "Skyline Infra", "Urban Glow Cosmetics", "Vanguard Logistics"];
      const services = ["Full Stack Web Platform", "Digital Marketing & SEO", "E-Commerce App", "Cloud Infrastructure", "UI/UX & Brand Design"];
      
      const randomIdx = Math.floor(Math.random() * names.length);
      const randomPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

      const res = await fetch("/mdz-crm/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: names[randomIdx],
          company: companies[randomIdx],
          phone: `+91 ${randomPhone}`,
          email: `${names[randomIdx].toLowerCase().replace(" ", ".")}@${companies[randomIdx].toLowerCase().replace(/\s+/g, "")}.com`,
          source: sourceType,
          interestedService: services[randomIdx],
          estimatedBudget: (Math.floor(Math.random() * 8) + 2) * 50000,
          message: `Inbound inquiry captured live from ${sourceType} campaign form.`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`✓ Simulated lead from ${sourceType} received! Check notifications & kanban.`, "success");
        fetchLeads();
      } else {
        showToast(json.error || "Simulation failed", "error");
      }
    } catch {
      showToast("Network error simulating lead", "error");
    } finally {
      setSimulatingChannel(null);
    }
  };

  const handleImportData = async (data: any[]) => {
    let successCount = 0;
    
    for (const row of data) {
      try {
        const client = row["Company"] || row["clientName"] || row["Client"] || row["Company Name"];
        const contact = row["Contact Person"] || row["contactPerson"] || row["Contact"] || row["Name"];
        const rowEmail = row["Email"] || row["email"];
        const rowPhone = row["Phone"] || row["phone"] || row["Mobile"];
        const value = row["Value"] || row["Deal Value"] || row["leadValue"];
        const scope = row["Scope"] || row["projectScope"] || row["Project Details"];
        const rowSource = row["Source"] || row["source"] || "IMPORT";
        
        if (!client) continue;

        const res = await fetch("/mdz-crm/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName: client,
            contactPerson: contact || "Unknown",
            phone: rowPhone || "+91 00000 00000",
            email: rowEmail || "contact@prospect.com",
            source: String(rowSource).toUpperCase(),
            projectScope: scope || "Imported inquiry",
            leadValue: Number(value) || 250000,
            expectedRevenue: Number(value) || 250000,
            stage: "NEW",
            leadPriority: "HIGH",
          }),
        });
        
        if (res.ok) successCount++;
      } catch (e) {
        console.error("Import error on row:", row);
      }
    }
    
    showToast(`✓ Imported ${successCount} leads successfully`, "success");
    fetchLeads();
  };

  const publicLeadWebhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/mdz-crm/api/public/leads`
    : "https://your-crm-domain.com/mdz-crm/api/public/leads";

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Sales CRM & Leads"
        description="Multi-channel client ingestion from Instagram, Facebook, LinkedIn, Website, and Webhooks with real-time Admin & Sub-Admin alerting."
        badge="OMNI-CHANNEL CRM"
        icon={<Target className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsIntegrationsOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 active:scale-95 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 transition-all flex items-center gap-2"
            >
              <Webhook className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Multi-Channel Webhooks</span>
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Import CSV/XLS</span>
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </button>
          </div>
        }
      />

      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Omni-Channel Lead Pipeline
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live inbound prospects captured automatically from Instagram, Facebook, LinkedIn, WhatsApp & Website.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Ingestion Active
            </span>
          </div>
        </div>

        <LeadPipelineBoard
          leads={leads}
          updateLeadStageApi={updateLeadStageApi}
          convertLeadToClientApi={convertLeadToClientApi}
          deleteLeadApi={deleteLeadApi}
          onRefresh={fetchLeads}
        />
      </div>

      {/* Multi-Channel Webhook & Integrations Center Modal */}
      <BottomSheet
        isOpen={isIntegrationsOpen}
        onClose={() => setIsIntegrationsOpen(false)}
        title="Multi-Channel Lead Ingestion & Webhooks"
        subtitle="Connect Instagram, Facebook Ads, LinkedIn Forms, Website & Zapier to stream leads directly into CRM."
      >
        <div className="space-y-6 text-xs font-sans pb-6">
          {/* Universal Webhook Endpoint Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100">Universal Public Webhook URL</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                POST API
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicLeadWebhookUrl}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono text-xs text-slate-800 dark:text-slate-200 select-all"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicLeadWebhookUrl);
                  setCopiedUrl(true);
                  showToast("Copied Webhook URL to clipboard!", "success");
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all"
              >
                {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedUrl ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pass JSON with fields: <code className="text-indigo-600 dark:text-indigo-400 font-mono">name</code>, <code className="text-indigo-600 dark:text-indigo-400 font-mono">phone</code>, <code className="text-indigo-600 dark:text-indigo-400 font-mono">email</code>, <code className="text-indigo-600 dark:text-indigo-400 font-mono">source</code> (INSTAGRAM, FACEBOOK, LINKEDIN, WEBSITE, etc.), and <code className="text-indigo-600 dark:text-indigo-400 font-mono">message</code>.
            </p>
          </div>

          {/* 1-Click Simulation Tester for Admin & Sub-Admin */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              1-Click Live Channel Simulation Tester
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Click any button below to simulate an inbound lead. You will receive an instant notification alert on your screen, and the lead will appear in the pipeline:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                disabled={Boolean(simulatingChannel)}
                onClick={() => handleSimulateInboundLead("INSTAGRAM")}
                className="p-3 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 active:scale-95 text-pink-700 dark:text-pink-300 border border-pink-500/30 font-bold text-xs flex flex-col items-center gap-1 transition-all disabled:opacity-50"
              >
                <span className="text-base">📸</span>
                <span>Test Instagram</span>
              </button>
              <button
                disabled={Boolean(simulatingChannel)}
                onClick={() => handleSimulateInboundLead("FACEBOOK")}
                className="p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-bold text-xs flex flex-col items-center gap-1 transition-all disabled:opacity-50"
              >
                <span className="text-base">🔵</span>
                <span>Test Facebook</span>
              </button>
              <button
                disabled={Boolean(simulatingChannel)}
                onClick={() => handleSimulateInboundLead("LINKEDIN")}
                className="p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 active:scale-95 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-bold text-xs flex flex-col items-center gap-1 transition-all disabled:opacity-50"
              >
                <span className="text-base">💼</span>
                <span>Test LinkedIn</span>
              </button>
              <button
                disabled={Boolean(simulatingChannel)}
                onClick={() => handleSimulateInboundLead("WEBSITE")}
                className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-xs flex flex-col items-center gap-1 transition-all disabled:opacity-50"
              >
                <span className="text-base">🌐</span>
                <span>Test Website</span>
              </button>
            </div>
          </div>

          {/* Channel Setup Guides */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">Step-by-Step Integration Setup</h4>
            
            <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>📸 🔵</span> Meta Ads (Instagram & Facebook Lead Ads)
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                In Meta Business Suite or Zapier / Make / Pabbly: Connect your Facebook/Instagram Lead Form and set the Webhook destination to the Universal Webhook URL above with header <code className="font-mono text-purple-600 dark:text-purple-400">Content-Type: application/json</code>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>💼</span> LinkedIn Lead Gen Forms
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                In LinkedIn Campaign Manager / Zapier: Map LinkedIn Lead Form fields (<code className="font-mono text-purple-600 dark:text-purple-400">full_name</code>, <code className="font-mono text-purple-600 dark:text-purple-400">email</code>, <code className="font-mono text-purple-600 dark:text-purple-400">phone_number</code>) to forward directly into our endpoint with <code className="font-mono text-purple-600 dark:text-purple-400">source: "LINKEDIN"</code>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>🌐</span> Website Contact & Inquiry Forms
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                On your WordPress, Webflow, Shopify, or custom HTML website, point your contact form submission <code className="font-mono text-purple-600 dark:text-purple-400">action</code> or Javascript <code className="font-mono text-purple-600 dark:text-purple-400">fetch()</code> to the Webhook URL.
              </p>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Add New Lead Bottom Sheet */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Prospect Lead"
        subtitle="Saved to your active sales CRM pipeline."
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Company / Prospect Name</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Tech Corp"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Contact Person</label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Rajesh Shah"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@acme.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">
                  Phone Number <span className="text-red-500">*</span>
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
                  placeholder="9876543210"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl p-3 pl-12 text-slate-900 dark:text-slate-100 outline-none transition-all font-mono tracking-wider text-xs ${
                    phone.length === 10
                      ? "border-emerald-500/60 focus:border-emerald-500"
                      : phone.length > 0
                      ? "border-amber-500/60 focus:border-amber-500"
                      : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                  }`}
                />
              </div>
              {phone.length > 0 && phone.length < 10 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                  Enter {10 - phone.length} more digit{10 - phone.length > 1 ? "s" : ""} (only 10 digits allowed, no letters).
                </p>
              )}
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Lead Inbound Source</label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-semibold"
              >
                <option value="WEBSITE">🌐 Website Direct</option>
                <option value="INSTAGRAM">📸 Instagram / Meta</option>
                <option value="FACEBOOK">🔵 Facebook Ads / Page</option>
                <option value="LINKEDIN">💼 LinkedIn</option>
                <option value="WHATSAPP">💬 WhatsApp Inbound</option>
                <option value="GOOGLE_ADS">🎯 Google Ads</option>
                <option value="WEBHOOK">⚡ Webhook / API</option>
                <option value="REFERRAL">👥 Client Referral</option>
                <option value="COLD_CALL">📞 Cold Call / Outreach</option>
                <option value="OTHER">✨ Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Estimated Budget (₹)</label>
              <input
                type="number"
                value={leadValue}
                onChange={(e) => setLeadValue(e.target.value)}
                placeholder="e.g. 100000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none transition-all font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">GST Number (Optional)</label>
                {gstNo && (
                  <span className="text-[10px] font-mono text-slate-400 font-bold">{gstNo.length}/15</span>
                )}
              </div>
              <input
                type="text"
                maxLength={15}
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value.toUpperCase().slice(0, 15))}
                placeholder="27AADCB2230M1Z2"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none transition-all uppercase font-mono tracking-wider text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Project Details / Scope</label>
            <textarea
              value={projectScope}
              onChange={(e) => setProjectScope(e.target.value)}
              placeholder="e.g. E-Commerce website development..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none transition-all resize-none h-20"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-2"
          >
            Create Prospect Lead
          </button>
        </form>
      </BottomSheet>

      <DataImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportData}
        title="Import Sales Leads"
      />
    </div>
  );
}
