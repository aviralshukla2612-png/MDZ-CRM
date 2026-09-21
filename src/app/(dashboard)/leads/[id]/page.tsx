"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Plus,
  CheckCircle2,
  Building,
  User,
  IndianRupee,
  Clock,
  ArrowRight,
  FileText,
  Sparkles,
  ShieldCheck,
  Edit3,
} from "lucide-react";
import { EditLeadModal } from "@/components/sales/EditLeadModal";

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  React.useEffect(() => {
    fetchLead();
  }, []);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/mdz-crm/api/leads/${params.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        const l = json.data;
        const timelineArr =
          l.activities?.map((a: any) => ({
            id: a.id,
            type: a.action,
            text: a.detailsJson || a.action,
            time: new Date(a.createdAt).toLocaleString(),
            timestamp: new Date(a.createdAt).toLocaleString(),
          })) || [];

        const followupsArr =
          l.followups?.map((f: any) => ({
            id: f.id,
            date: new Date(f.scheduledAt).toLocaleString(),
            note: f.notes || "Followup",
            notes: f.notes || "Followup",
            callerName: l.assignedSalesperson?.name || "Sales Rep",
            outcome: f.result || "Scheduled",
            createdAt: new Date(f.createdAt || f.scheduledAt).toLocaleString(),
            completed: f.status === "COMPLETED",
          })) || [];

        const notesArr =
          l.activities
            ?.filter((a: any) => a.action === "NOTE_ADDED")
            .map((a: any) => ({
              id: a.id,
              content: a.detailsJson,
              text: a.detailsJson,
              authorName: "Internal Note",
              author: "System",
              createdAt: new Date(a.createdAt).toLocaleString(),
              timestamp: new Date(a.createdAt).toLocaleString(),
            })) || [];

        setLead({
          ...l,
          leadNumber: l.leadNumber,
          leadPriority: l.priority || "MEDIUM",
          stage: l.status || "NEW",
          clientName: l.companyName || l.contactPerson || "Prospective Client",
          contactPerson: l.contactPerson || "Contact",
          email: l.email || "No Email",
          phone: l.mobile || "No Phone",
          leadValue: Number(l.estimatedBudget) || 0,
          expectedRevenue: Number(l.expectedValue) || 0,
          projectScope: l.description || l.interestedService || "General Inquiry",
          assignedSales: l.assignedSalesperson?.name || "Unassigned",
          nextFollowupDate: l.nextFollowupAt ? new Date(l.nextFollowupAt).toLocaleDateString() : "Pending",
          timeline: timelineArr,
          activityHistory: timelineArr,
          scheduledFollowups: followupsArr,
          callHistory: followupsArr,
          calls: followupsArr,
          notes: notesArr,
          mediaFiles: l.mediaFiles || [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "calls" | "notes">("overview");
  const [isNoteSheetOpen, setIsNoteSheetOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isFollowupSheetOpen, setIsFollowupSheetOpen] = useState(false);
  const [followupDate, setFollowupDate] = useState("Tomorrow 11:00 AM");
  const [followupNote, setFollowupNote] = useState("");

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    // Mock local update since no POST /notes endpoint exists in Phase 2
    setLead((prev: any) => ({
      ...prev,
      notes: [...prev.notes, { id: Date.now().toString(), text: newNoteText, author: "You", timestamp: "Just now" }],
      timeline: [{ id: Date.now().toString(), type: "NOTE_ADDED", text: `Note added: "${newNoteText}"`, timestamp: "Just now" }, ...prev.timeline],
    }));
    showToast("✓ Note added to Lead activity log (local)", "success");
    setNewNoteText("");
    setIsNoteSheetOpen(false);
  };

  const handleAddFollowupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupNote.trim()) return;
    // Mock local update
    setLead((prev: any) => ({
      ...prev,
      scheduledFollowups: [...prev.scheduledFollowups, { id: Date.now().toString(), date: followupDate, note: followupNote, completed: false }],
      timeline: [{ id: Date.now().toString(), type: "FOLLOWUP_SCHEDULED", text: `Scheduled for ${followupDate}: ${followupNote}`, timestamp: "Just now" }, ...prev.timeline],
    }));
    showToast(`✓ Follow-up scheduled for ${followupDate} (local)`, "success");
    setFollowupNote("");
    setIsFollowupSheetOpen(false);
  };

  const handleConvertLead = async () => {
    try {
      const res = await fetch(`/mdz-crm/api/leads/${lead.id}/convert`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        showToast(`🎉 Converted to Client "${json.data.client.companyName}"`, "success");
        fetchLead();
      } else {
        showToast(json.error || "Failed to convert lead", "error");
      }
    } catch (e) {
      showToast("Network error converting lead", "error");
    }
  };

  const updateLeadStage = async (leadId: string, newStage: string) => {
    setLead((prev: any) => ({ ...prev, stage: newStage }));
    try {
      const res = await fetch(`/mdz-crm/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      const json = await res.json();
      if (!json.success) {
        showToast("Failed to update lead stage", "error");
        fetchLead();
      }
    } catch (e) {
      showToast("Network error", "error");
      fetchLead();
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 animate-pulse">Loading Lead...</div>;
  if (!lead) return <div className="p-12 text-center text-rose-400">Lead Not Found</div>;

  return (
    <div className="space-y-6 pb-16">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sales CRM & Leads</span>
        </Link>
        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {lead.leadNumber}
        </span>
      </div>

      {/* Lead Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-mono">
                {lead.leadPriority} PRIORITY
              </span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono uppercase">
                {lead.stage} STAGE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {lead.clientName}
            </h1>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
              <span>👤 <strong>{lead.contactPerson}</strong></span>
              <span>•</span>
              <span>✉️ {lead.email}</span>
              <span>•</span>
              <span>📞 {lead.phone}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 touch-target cursor-pointer shadow-xs"
              title="Edit Lead Details & Scope"
            >
              <Edit3 className="w-4 h-4 text-amber-500" />
              <span>Edit Lead</span>
            </button>

            {lead.stage !== "WON" ? (
              <button
                onClick={handleConvertLead}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 touch-target cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Convert to Client & Project</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Converted to Client</span>
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <a
            href={`tel:${lead.phone}`}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 touch-target"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Call</span>
          </a>
          <a
            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 touch-target"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp</span>
          </a>
          <a
            href={`mailto:${lead.email}`}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 touch-target"
          >
            <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Email</span>
          </a>

          <button
            onClick={() => setIsFollowupSheetOpen(true)}
            className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold flex items-center gap-1.5 touch-target"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Schedule Follow-up</span>
          </button>

          <button
            onClick={() => setIsNoteSheetOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 touch-target"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>+ Add Note</span>
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {[
          { id: "overview", label: "Overview & Scope" },
          { id: "timeline", label: `Activity Timeline (${lead.timeline?.length || 0})` },
          { id: "calls", label: `Call History (${lead.scheduledFollowups?.length || 0})` },
          { id: "notes", label: `Internal Notes (${lead.notes?.length || 0})` },
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
      {activeTab === "overview" && (() => {
        let parsedGoals: string[] = [];
        let parsedServices: string[] = [];
        try {
          if (lead.goalsJson) parsedGoals = JSON.parse(lead.goalsJson);
        } catch {}
        try {
          if (lead.servicesJson) parsedServices = JSON.parse(lead.servicesJson);
        } catch {}

        return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Public Inquiry / Client Requirements Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Client Inquiry Requirements
                </h3>
                {lead.source && (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Source: {lead.source}
                  </span>
                )}
              </div>

              {/* Grid of Profile */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Industry</span>
                  <strong className="text-slate-800 dark:text-slate-200">{lead.industry || "General"}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sub-Category</span>
                  <strong className="text-slate-800 dark:text-slate-200">{lead.subCategory || "N/A"}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Business Type</span>
                  <strong className="text-slate-800 dark:text-slate-200">{lead.businessType || "B2B"}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {lead.durationMonths ? `${lead.durationMonths} Months` : lead.durationType || "N/A"}
                  </strong>
                </div>
              </div>

              {/* Services Badges */}
              {parsedServices.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Requested Services</span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedServices.map((s: string) => (
                      <span key={s} className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 font-bold text-[11px] border border-amber-300 dark:border-amber-800">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals Badges */}
              {parsedGoals.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Business Objectives</span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedGoals.map((g: string) => (
                      <span key={g} className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 font-bold text-[11px] border border-emerald-300 dark:border-emerald-800">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Audience & Competitors */}
              {(lead.targetAudience || lead.competitors) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {lead.targetAudience && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Audience</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">{lead.targetAudience}</p>
                    </div>
                  )}
                  {lead.competitors && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Top Competitors</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">{lead.competitors}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Details */}
              {lead.additionalDetails && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Additional Brief / Notes</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{lead.additionalDetails}</p>
                </div>
              )}

              {/* Attached Media Files */}
              {lead.mediaFiles && lead.mediaFiles.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Inquiry Attachments ({lead.mediaFiles.length})
                  </span>
                  <div className="space-y-1.5">
                    {lead.mediaFiles.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{file.originalName || file.fileName}</span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            ({(file.fileSize / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <a
                          href={`/mdz-crm/api/media/${file.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scope Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Project Scope & Scope of Work</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                {lead.projectScope || lead.interestedService || "Full-Service Engagement"}
              </p>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pipeline Stage Transition</h4>
                <div className="flex flex-wrap gap-2">
                  {["NEW", "CONTACTED", "REQUIREMENTS", "PROPOSAL", "NEGOTIATION", "WON", "LOST"].map((stg) => (
                    <button
                      key={stg}
                      onClick={() => {
                        updateLeadStage(lead.id, stg as any);
                        showToast(`✓ Lead moved to ${stg} stage`, "success");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                        lead.stage === stg
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {stg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Financial Metrics</h3>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Estimated Deal Value:</span>
                <strong className="font-mono text-slate-900 dark:text-slate-100">₹{(Number(lead.leadValue) || 0).toLocaleString("en-IN")}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">
                <span>Weighted Expected Value:</span>
                <strong className="font-mono">₹{(Number(lead.expectedRevenue) || 0).toLocaleString("en-IN")}</strong>
              </div>
              <div className="flex justify-between py-1 text-slate-700 dark:text-slate-300">
                <span>Assigned Salesperson:</span>
                <strong>{lead.assignedSales || "Unassigned"}</strong>
              </div>
              <div className="flex justify-between py-1 text-amber-700 dark:text-amber-400 font-bold">
                <span>Next Follow-up:</span>
                <span>{lead.nextFollowupDate || "Pending"}</span>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Tab 2: Activity Timeline */}
      {activeTab === "timeline" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Audit & Change History Timeline</h3>
          <div className="space-y-3 text-xs">
            {lead.timeline?.map((act: any) => (
              <div key={act.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{act.text}</div>
                  <div className="text-[10px] font-mono text-slate-400">{act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Call History */}
      {activeTab === "calls" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Call & Meeting History Log</h3>
            <button
              onClick={() => setIsFollowupSheetOpen(true)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Log New Call
            </button>
          </div>
          <div className="space-y-3 text-xs">
            {lead.calls?.map((call: any) => (
              <div key={call.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span>Caller: {call.callerName}</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{call.outcome}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{call.notes}</p>
                <div className="text-[10px] font-mono text-slate-400">{call.createdAt}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Internal Notes */}
      {activeTab === "notes" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Internal Deal Notes</h3>
            <button
              onClick={() => setIsNoteSheetOpen(true)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Add Note
            </button>
          </div>
          <div className="space-y-3 text-xs">
            {lead.notes?.map((n: any) => (
              <div key={n.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-slate-900 dark:text-slate-100">{n.authorName}</div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{n.content}</p>
                <div className="text-[10px] font-mono text-slate-400">{n.createdAt}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Note Bottom Sheet */}
      <BottomSheet
        isOpen={isNoteSheetOpen}
        onClose={() => setIsNoteSheetOpen(false)}
        title="Add Deal Note"
        subtitle="Saved to lead activity log."
      >
        <form onSubmit={handleAddNoteSubmit} className="space-y-4 text-xs">
          <textarea
            required
            rows={4}
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Type your notes regarding deal terms or client feedback..."
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs touch-target"
          >
            Save Deal Note
          </button>
        </form>
      </BottomSheet>

      {/* Schedule Followup Bottom Sheet */}
      <BottomSheet
        isOpen={isFollowupSheetOpen}
        onClose={() => setIsFollowupSheetOpen(false)}
        title="Schedule Follow-up Call / Meeting"
        subtitle="Updates next follow-up date and adds call reminder."
      >
        <form onSubmit={handleAddFollowupSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Follow-up Date & Time</label>
            <input
              type="text"
              required
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              placeholder="e.g. Tomorrow 11:00 AM"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Call Purpose / Agenda</label>
            <textarea
              required
              rows={3}
              value={followupNote}
              onChange={(e) => setFollowupNote(e.target.value)}
              placeholder="e.g. Discuss revised scope milestone payments..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs touch-target mt-2"
          >
            Schedule & Save
          </button>
        </form>
      </BottomSheet>

      {/* Edit Lead Modal */}
      {isEditModalOpen && lead && (
        <EditLeadModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          lead={lead}
          onSuccess={() => {
            fetchLead();
            showToast("✓ Lead details updated successfully!", "success");
          }}
        />
      )}
    </div>
  );
}
