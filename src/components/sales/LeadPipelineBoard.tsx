"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, PhoneCall, Calendar, ArrowRight, ArrowUpRight, CheckCircle2, User, Building, IndianRupee, Trash, ShieldCheck, Edit3 } from "lucide-react";
import { ConvertLeadModal } from "./ConvertLeadModal";
import { EditLeadModal } from "./EditLeadModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";

export interface Lead {
  id: string;
  leadNumber: string;
  clientName: string;
  contactPerson: string;
  email: string;
  phone: string;
  stage: string;
  leadValue: number;
  expectedRevenue: number;
  projectScope: string;
  assignedSales: string;
  nextFollowupDate: string;
  leadPriority: string;
  source?: string;
  gstNo?: string;
  description?: string;
  remarks?: string;
  updatedAt?: string;
}

export function LeadPipelineBoard({
  leads,
  updateLeadStageApi,
  convertLeadToClientApi,
  deleteLeadApi,
  onRefresh,
}: {
  leads: Lead[];
  updateLeadStageApi: any;
  convertLeadToClientApi: any;
  deleteLeadApi?: any;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedSource, setSelectedSource] = useState<string>("ALL");
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const STAGES = [
    { id: "NEW", title: "New Prospects" },
    { id: "CONTACTED", title: "Contacted" },
    { id: "REQUIREMENTS", title: "Requirements" },
    { id: "PROPOSAL", title: "Proposal Sent" },
    { id: "NEGOTIATION", title: "Negotiation" },
    { id: "WON", title: "Won / Closing" },
  ];

  const SOURCES = [
    { id: "ALL", label: "All Inbound", icon: "🌐" },
    { id: "INSTAGRAM", label: "Instagram", icon: "📸" },
    { id: "FACEBOOK", label: "Facebook", icon: "🔵" },
    { id: "LINKEDIN", label: "LinkedIn", icon: "💼" },
    { id: "WEBSITE", label: "Website", icon: "⚡" },
    { id: "WHATSAPP", label: "WhatsApp", icon: "💬" },
    { id: "GOOGLE_ADS", label: "Google Ads", icon: "🎯" },
    { id: "WEBHOOK", label: "Webhooks", icon: "🔌" },
  ];

  const getSourceBadge = (source?: string) => {
    const s = (source || "WEBSITE").toUpperCase();
    if (s.includes("INSTA")) {
      return {
        label: "Instagram",
        icon: "📸",
        className: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
      };
    }
    if (s.includes("FACEBOOK") || s.includes("FB")) {
      return {
        label: "Facebook",
        icon: "🔵",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      };
    }
    if (s.includes("LINKEDIN")) {
      return {
        label: "LinkedIn",
        icon: "💼",
        className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      };
    }
    if (s.includes("WHATSAPP")) {
      return {
        label: "WhatsApp",
        icon: "💬",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    }
    if (s.includes("GOOGLE")) {
      return {
        label: "Google Ads",
        icon: "🎯",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
    }
    if (s.includes("WEBHOOK") || s.includes("API")) {
      return {
        label: "Webhook",
        icon: "⚡",
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      };
    }
    return {
      label: s === "PUBLIC_INQUIRY" ? "Website Form" : s.replace("_", " "),
      icon: "🌐",
      className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    };
  };

  const filteredLeads = leads.filter((l) => {
    if (selectedSource === "ALL") return true;
    const s = (l.source || "WEBSITE").toUpperCase();
    return s.includes(selectedSource);
  });

  return (
    <div className="space-y-4">
      {/* Multi-Channel Source Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase font-mono mr-1 shrink-0">Source:</span>
        {SOURCES.map((src) => {
          const count = leads.filter((l) => {
            if (src.id === "ALL") return true;
            return (l.source || "WEBSITE").toUpperCase().includes(src.id);
          }).length;

          const isSelected = selectedSource === src.id;
          return (
            <button
              key={src.id}
              onClick={() => setSelectedSource(src.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                isSelected
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs"
                  : "bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>{src.icon}</span>
              <span>{src.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isSelected ? "bg-white/20 dark:bg-slate-900/20" : "bg-slate-100 dark:bg-slate-800"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter((l) => l.stage === stage.id);
          const totalVal = stageLeads.reduce((acc, curr) => acc + (curr.leadValue || 0), 0);

          return (
            <div
              key={stage.id}
              className="w-72 shrink-0 bg-slate-100/60 dark:bg-slate-950/40 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800/60 space-y-3 flex flex-col"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("border-indigo-500/50", "bg-indigo-50/50", "dark:bg-indigo-950/20");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("border-indigo-500/50", "bg-indigo-50/50", "dark:bg-indigo-950/20");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-indigo-500/50", "bg-indigo-50/50", "dark:bg-indigo-950/20");
                const leadId = e.dataTransfer.getData("leadId");
                if (leadId) {
                  updateLeadStageApi(leadId, stage.id);
                }
              }}
            >
              <div className="flex items-center justify-between px-1">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono uppercase">
                  {stage.title}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {stageLeads.map((lead) => {
                  const badge = getSourceBadge(lead.source);
                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("leadId", lead.id);
                      }}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (!target.closest("button")) {
                          router.push(`/leads/${lead.id}`);
                        }
                      }}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 shadow-xs hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/90 hover:scale-[1.01] hover:shadow-sm transition-all duration-200 space-y-2 group cursor-pointer active:cursor-grabbing"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-400">{lead.leadNumber}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono flex items-center gap-1 border ${badge.className}`}>
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                            lead.leadPriority === "HOT"
                              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              : lead.leadPriority === "HIGH"
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}>
                            {lead.leadPriority}
                          </span>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingLead(lead);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors ml-0.5 cursor-pointer"
                            title="Edit Lead Parameters"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />

                          {deleteLeadApi && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeleteLeadId(lead.id);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors ml-0.5 cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {lead.clientName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{lead.contactPerson}</p>
                      </div>

                      {lead.projectScope && (
                        <div className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-1 bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded-md border border-slate-200/50 dark:border-slate-800/50">
                          🎯 {lead.projectScope}
                        </div>
                      )}

                      {lead.phone && (
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          📞 {lead.phone}
                        </div>
                      )}

                      {(lead.stage === "WON" || lead.stage === "PENDING_SUPER_ADMIN_APPROVAL") && (
                        <div className="space-y-1.5 mt-2">
                          {lead.stage === "PENDING_SUPER_ADMIN_APPROVAL" && (
                            <div className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-1 text-center">
                              ⏳ Awaiting Super Admin Approval
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              convertLeadToClientApi(lead.id);
                            }}
                            className={`w-full py-2 rounded-xl text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-colors touch-target ${
                              session?.user?.role === "OWNER"
                                ? "bg-indigo-600 hover:bg-indigo-700"
                                : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                          >
                            {session?.user?.role === "OWNER" ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Approve Sale & Hand off to Sub Admin</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>Submit for Super Admin Approval</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      <ConfirmModal
        isOpen={!!deleteLeadId}
        onClose={() => setDeleteLeadId(null)}
        onConfirm={() => {
          if (deleteLeadId && deleteLeadApi) {
            deleteLeadApi(deleteLeadId);
          }
        }}
        title="Delete Lead"
        message="Are you sure you want to permanently delete this lead? This action cannot be undone and will remove all associated follow-ups and data."
        confirmText="Delete Lead"
        isDestructive={true}
      />

      {/* Edit Lead Modal */}
      {editingLead && (
        <EditLeadModal
          isOpen={!!editingLead}
          onClose={() => setEditingLead(null)}
          lead={editingLead}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
