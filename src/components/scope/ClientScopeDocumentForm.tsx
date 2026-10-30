"use client";

import React, { useState } from "react";
import {
  FileText,
  Briefcase,
  CheckCircle2,
  XCircle,
  Layers,
  Sparkles,
  Calendar,
  Users,
  FolderUp,
  Clock,
  RotateCcw,
  CreditCard,
  PlusCircle,
  DollarSign,
  MessageSquare,
  PhoneCall,
  ShieldAlert,
  Award,
  HardDrive,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Check,
} from "lucide-react";

export interface ClientScopeDocumentData {
  // 1. Client & Project Information
  clientName: string;
  brandName: string;
  projectStartDate: string;
  projectDuration: string;
  primaryContactPerson: string;
  email: string;
  phoneNumber: string;

  // 2. Scope of Work
  scopeOfWork: string;

  // 3 & 4. Services Included & Not Included
  servicesIncluded: string[];
  servicesNotIncluded: string[];

  // 5. Monthly Deliverables
  deliverablesReels: number;
  deliverablesStatics: number;
  deliverablesCarousels: number;
  deliverablesStories: number;
  deliverablesOther: string;

  // 6. Content & Strategy Support
  contentSupport: string[];
  contentSupportOther?: string;

  // 7. Posting & Scheduling
  postingResponsibility: "we_post" | "client_posts" | "shared";
  postingDetails?: string;

  // 8. Client Responsibilities
  clientResponsibilities: string[];
  clientResponsibilitiesOther?: string;

  // 9. Content / Asset Submission
  submissionFormat: string;
  submissionFrequency: string;
  submissionDeadline: string;

  // 10. Approval Process (4 standard steps)
  approvalProcessAcknowledged: boolean;

  // 11. Approval Timeline
  reviewTimeline: string;
  noResponseWithin: string;
  noResponseAction: string;

  // 12. Revision Policy
  revisionsIncluded: string;
  revisionsCovered: string;
  additionalRevisionCharge: string;

  // 13. Payment Terms
  paymentTerms: "advance_50" | "monthly" | "quarterly" | "other";
  paymentTermsOther?: string;

  // 14. Additional Work Charges
  hourlyRateOrTask: string;
  additionalWorkExamples: string;

  // 15. Ad Spend Responsibility
  adSpendResponsibility: "client_manages" | "we_manage_client_pays" | "shared" | "not_applicable";

  // 16. Communication Channel
  communicationChannels: string[];
  communicationOther?: string;

  // 17. Communication / Response Time
  expectedResponseTime: string;
  workingHours: string;
  emergencyContact: string;

  // 18. Content Deadlines
  monthlyCalendarShareDate: string;
  contentSubmissionDeadline: string;
  finalApprovalDeadline: string;

  // 19. Cancellation / Pause Policy
  noticePeriod: string;
  refundPolicy: string;
  pauseOption: string;
  otherCancellationTerms?: string;

  // 20. Ownership of Final Content
  ownershipOption: "transferred_after_payment" | "agency_showcase_portfolio" | "other";
  ownershipOther?: string;

  // 21. Raw / Editable File Policy
  rawFileOption: "not_included" | "available_on_request" | "specific_files_included" | "other";
  rawFilesSpecific?: string;

  // 22. Results / Performance Disclaimer
  disclaimerAcknowledged: boolean;
}

export const SAMPLE_SCOPE_DOCUMENT: ClientScopeDocumentData = {
  clientName: "",
  brandName: "",
  projectStartDate: "",
  projectDuration: "Monthly Retainer",
  primaryContactPerson: "",
  email: "",
  phoneNumber: "",

  scopeOfWork:
    "End-to-end strategic creative production, social media management, daily reels editing, visual design, and performance analytics.",

  servicesIncluded: [
    "Monthly content calendar formulation & ideation",
    "Video editing for short-form reels (4K color grade, motion graphics, sound sync)",
    "High-converting carousel and static graphic design",
    "Caption copywriting with SEO keywords and hashtags",
    "Monthly performance analytics and delivery review sync",
  ],

  servicesNotIncluded: [
    "In-person physical video shoots (unless separately contracted)",
    "Direct advertising budget spend (paid directly to Meta/Google)",
    "Backend website development / custom code changes",
    "Third-party paid software licenses or influencer fees",
  ],

  deliverablesReels: 30,
  deliverablesStatics: 10,
  deliverablesCarousels: 15,
  deliverablesStories: 45,
  deliverablesOther: "Live Sessions, UGC curation as needed",

  contentSupport: [
    "Content Strategy & Planning",
    "Captions Writing",
    "Reel Scripts",
    "Hashtag Research",
    "Content Calendar",
    "Trend Research",
  ],
  contentSupportOther: "",

  postingResponsibility: "we_post",
  postingDetails: "Agency handles direct publishing, tagging, and caption formatting via Meta Business Suite.",

  clientResponsibilities: [
    "Provide timely content, assets and information",
    "Review and approve content within agreed SLA",
    "Share product/service updates and offers",
    "Provide access to required accounts and Google Drive",
  ],
  clientResponsibilitiesOther: "",

  submissionFormat: "Google Drive Assets Folder & WhatsApp Media Group",
  submissionFrequency: "Weekly / Prior to monthly production cycle",
  submissionDeadline: "Every Monday / By 5th of each month",

  approvalProcessAcknowledged: true,

  reviewTimeline: "24-48 Hours",
  noResponseWithin: "48 Hours",
  noResponseAction: "Assume approved & schedule for publishing",

  revisionsIncluded: "2 Rounds included per deliverable",
  revisionsCovered: "Pacing adjustments, music changes, caption revisions, text corrections, crop edits",
  additionalRevisionCharge: "₹1,500 per extra revision round",

  paymentTerms: "monthly",
  paymentTermsOther: "",

  hourlyRateOrTask: "₹2,500 / Hour or Flat Task Billing",
  additionalWorkExamples: "Ad-hoc extra reels, event coverage graphics, emergency pitch deck design",

  adSpendResponsibility: "we_manage_client_pays",

  communicationChannels: ["WhatsApp", "Email", "Slack"],
  communicationOther: "",

  expectedResponseTime: "Within 24 Hours (Business Days)",
  workingHours: "Monday - Friday, 10:00 AM - 6:30 PM IST",
  emergencyContact: "+91 98765 43210 (Urgent Campaign Blockers)",

  monthlyCalendarShareDate: "1st of every operating month",
  contentSubmissionDeadline: "3 days before scheduled posting date",
  finalApprovalDeadline: "24 hours before scheduled posting time",

  noticePeriod: "30 days written email notice",
  refundPolicy: "No refund for current active operating month",
  pauseOption: "Available with 14 days prior notice (max 30 days)",
  otherCancellationTerms: "All completed deliverables handed over upon final dues settlement.",

  ownershipOption: "transferred_after_payment",
  ownershipOther: "",

  rawFileOption: "available_on_request",
  rawFilesSpecific: "Final rendered 4K MP4 and high-res PNG/PDF included. Raw Premiere/AfterEffects projects on request.",

  disclaimerAcknowledged: true,
};

export const DEFAULT_SCOPE_DOCUMENT: ClientScopeDocumentData = {
  clientName: "",
  brandName: "",
  projectStartDate: "",
  projectDuration: "",
  primaryContactPerson: "",
  email: "",
  phoneNumber: "",

  scopeOfWork: "",
  servicesIncluded: [],
  servicesNotIncluded: [],

  deliverablesReels: 0,
  deliverablesStatics: 0,
  deliverablesCarousels: 0,
  deliverablesStories: 0,
  deliverablesOther: "",

  contentSupport: [],
  contentSupportOther: "",

  postingResponsibility: "client_posts",
  postingDetails: "",

  clientResponsibilities: [],
  clientResponsibilitiesOther: "",

  submissionFormat: "",
  submissionFrequency: "",
  submissionDeadline: "",

  approvalProcessAcknowledged: false,

  reviewTimeline: "",
  noResponseWithin: "",
  noResponseAction: "",

  revisionsIncluded: "",
  revisionsCovered: "",
  additionalRevisionCharge: "",

  paymentTerms: "monthly",
  paymentTermsOther: "",

  hourlyRateOrTask: "",
  additionalWorkExamples: "",

  adSpendResponsibility: "client_manages",

  communicationChannels: [],
  communicationOther: "",

  expectedResponseTime: "",
  workingHours: "",
  emergencyContact: "",

  monthlyCalendarShareDate: "",
  contentSubmissionDeadline: "",
  finalApprovalDeadline: "",

  noticePeriod: "",
  refundPolicy: "",
  pauseOption: "",
  otherCancellationTerms: "",

  ownershipOption: "transferred_after_payment",
  ownershipOther: "",

  rawFileOption: "available_on_request",
  rawFilesSpecific: "",

  disclaimerAcknowledged: false,
};

const CONTENT_SUPPORT_OPTIONS = [
  "Content Strategy & Planning",
  "Captions Writing",
  "Reel Scripts",
  "Hashtag Research",
  "Content Calendar",
  "Trend Research",
];

const CLIENT_RESPONSIBILITY_DEFAULTS = [
  "Provide timely content, assets and information",
  "Review and approve content",
  "Share product/service updates",
  "Provide access to required accounts",
];

interface Props {
  value: ClientScopeDocumentData;
  onChange: (data: ClientScopeDocumentData) => void;
  isCompact?: boolean;
}

export function ClientScopeDocumentForm({ value, onChange, isCompact = false }: Props) {
  const [isExpanded, setIsExpanded] = useState(!isCompact);

  const update = (patch: Partial<ClientScopeDocumentData>) => {
    onChange({ ...value, ...patch });
  };

  const toggleSupportItem = (item: string) => {
    const list = value.contentSupport || [];
    const exists = list.includes(item);
    update({ contentSupport: exists ? list.filter((i) => i !== item) : [...list, item] });
  };

  const toggleClientResp = (item: string) => {
    const list = value.clientResponsibilities || [];
    const exists = list.includes(item);
    update({ clientResponsibilities: exists ? list.filter((i) => i !== item) : [...list, item] });
  };

  const toggleChannel = (item: string) => {
    const list = value.communicationChannels || [];
    const exists = list.includes(item);
    update({ communicationChannels: exists ? list.filter((i) => i !== item) : [...list, item] });
  };

  // Helper for services included/excluded bullet lists
  const handleServicesChange = (key: "servicesIncluded" | "servicesNotIncluded", text: string) => {
    const items = text.split("\n").filter((l) => l.trim().length > 0);
    update({ [key]: items });
  };

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#14120E] shadow-sm overflow-hidden transition-all">
      {/* Header Banner */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-900 text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                Governance & Terms
              </span>
              <span className="text-xs text-stone-300 font-mono hidden sm:inline">
                CLEAR SCOPE • ALIGNED EXPECTATIONS • SMOOTHER COLLABORATION
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
              <span>CLIENT EXPECTATIONS & SCOPE DOCUMENT</span>
              <span className="text-xs font-normal text-emerald-300 opacity-90 hidden md:inline">
                (22-Section Operational SLA)
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-300 font-medium hidden sm:inline">
            {isExpanded ? "Collapse Scope" : "Expand Scope"}
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6 text-stone-900 dark:text-stone-100">
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            This document outlines the scope of work, deliverables, responsibilities, timelines, revision terms, and policies to ensure a seamless collaboration and clear expectations between both parties.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Client & Project Information */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  Client & Project Information
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={value.clientName}
                    onChange={(e) => update({ clientName: e.target.value })}
                    placeholder="e.g. Acme Corporation"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Business / Brand Name
                  </label>
                  <input
                    type="text"
                    value={value.brandName}
                    onChange={(e) => update({ brandName: e.target.value })}
                    placeholder="e.g. Acme Studios"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Project Start Date
                  </label>
                  <input
                    type="date"
                    value={value.projectStartDate}
                    onChange={(e) => update({ projectStartDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Project Duration
                  </label>
                  <input
                    type="text"
                    value={value.projectDuration}
                    onChange={(e) => update({ projectDuration: e.target.value })}
                    placeholder="e.g. Monthly Retainer, 6 Months"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Primary Contact Person
                  </label>
                  <input
                    type="text"
                    value={value.primaryContactPerson}
                    onChange={(e) => update({ primaryContactPerson: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Contact Email & Phone
                  </label>
                  <input
                    type="text"
                    value={value.email}
                    onChange={(e) => update({ email: e.target.value })}
                    placeholder="email@company.com"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Scope of Work */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Scope of Work (Overall Project Description)
                </span>
              </div>

              <div className="text-xs space-y-2">
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Briefly describe the overall scope of work for this engagement:
                </p>
                <textarea
                  rows={4}
                  value={value.scopeOfWork}
                  onChange={(e) => update({ scopeOfWork: e.target.value })}
                  placeholder="e.g. Social media management for Instagram and Facebook including content creation, video editing, scheduling, community engagement, and monthly analytics..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-medium leading-relaxed"
                />
              </div>
            </div>

            {/* 3 & 4. Services Included & Services Not Included */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  3
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Services Included in Package (One per line)
                </span>
              </div>

              <textarea
                rows={4}
                value={(value.servicesIncluded || []).join("\n")}
                onChange={(e) => handleServicesChange("servicesIncluded", e.target.value)}
                placeholder="• Monthly content calendar formulation&#10;• 4K Video editing for reels&#10;• Caption copywriting & hashtags"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono resize-none"
              />
            </div>

            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                  4
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  Services NOT Included (Out of Scope)
                </span>
              </div>

              <textarea
                rows={4}
                value={(value.servicesNotIncluded || []).join("\n")}
                onChange={(e) => handleServicesChange("servicesNotIncluded", e.target.value)}
                placeholder="• Physical video shoots / studio travel&#10;• Direct platform advertising spend&#10;• Core website code development"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-rose-500 text-xs font-mono resize-none"
              />
            </div>

            {/* 5. Monthly Deliverables */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  5
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Monthly Deliverables Quota
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1a] text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                    Reels / Short Videos
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={value.deliverablesReels}
                    onChange={(e) => update({ deliverablesReels: Number(e.target.value) || 0 })}
                    className="w-full text-center font-mono font-bold text-base py-0.5 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#191613] text-emerald-600"
                  />
                </div>

                <div className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1a] text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                    Static Posts
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={value.deliverablesStatics}
                    onChange={(e) => update({ deliverablesStatics: Number(e.target.value) || 0 })}
                    className="w-full text-center font-mono font-bold text-base py-0.5 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#191613] text-emerald-600"
                  />
                </div>

                <div className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1a] text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                    Carousels
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={value.deliverablesCarousels}
                    onChange={(e) => update({ deliverablesCarousels: Number(e.target.value) || 0 })}
                    className="w-full text-center font-mono font-bold text-base py-0.5 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#191613] text-emerald-600"
                  />
                </div>

                <div className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1a] text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                    Stories
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={value.deliverablesStories}
                    onChange={(e) => update({ deliverablesStories: Number(e.target.value) || 0 })}
                    className="w-full text-center font-mono font-bold text-base py-0.5 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#191613] text-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                  Other Deliverables (e.g. Live, UGC, Podcast clips):
                </label>
                <input
                  type="text"
                  value={value.deliverablesOther || ""}
                  onChange={(e) => update({ deliverablesOther: e.target.value })}
                  placeholder="e.g. 2 Live sessions, 4 UGC testimonials"
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>

            {/* 6. Content & Strategy Support */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  6
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Content & Strategy Support
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {CONTENT_SUPPORT_OPTIONS.map((item) => {
                  const isChecked = (value.contentSupport || []).includes(item);
                  return (
                    <label
                      key={item}
                      onClick={() => toggleSupportItem(item)}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                        isChecked
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold"
                          : "bg-white dark:bg-[#231f1a] border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="w-3.5 h-3.5 accent-emerald-600 rounded"
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>

              <div>
                <input
                  type="text"
                  value={value.contentSupportOther || ""}
                  onChange={(e) => update({ contentSupportOther: e.target.value })}
                  placeholder="Other support (e.g. Influencer Outreach)..."
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>

            {/* 7. Posting & Scheduling */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  7
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Posting & Scheduling Responsibility
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { id: "we_post", label: "We will post & schedule directly" },
                  { id: "client_posts", label: "Client will post (Drafts handed over)" },
                  { id: "shared", label: "Shared responsibility" },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="postingResponsibility"
                      checked={value.postingResponsibility === opt.id}
                      onChange={() => update({ postingResponsibility: opt.id as any })}
                      className="accent-emerald-600"
                    />
                    <span className="font-medium text-stone-700 dark:text-stone-300">{opt.label}</span>
                  </label>
                ))}

                <input
                  type="text"
                  value={value.postingDetails || ""}
                  onChange={(e) => update({ postingDetails: e.target.value })}
                  placeholder="Additional details (e.g. Client posts stories, agency posts reels)..."
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 text-xs mt-2"
                />
              </div>
            </div>

            {/* 8. Client Responsibilities */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  8
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  Client Responsibilities
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {CLIENT_RESPONSIBILITY_DEFAULTS.map((item) => {
                  const isChecked = (value.clientResponsibilities || []).includes(item);
                  return (
                    <label
                      key={item}
                      onClick={() => toggleClientResp(item)}
                      className="flex items-center gap-2 cursor-pointer select-none text-stone-600 dark:text-stone-300"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="w-3.5 h-3.5 accent-emerald-600 rounded"
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}

                <input
                  type="text"
                  value={value.clientResponsibilitiesOther || ""}
                  onChange={(e) => update({ clientResponsibilitiesOther: e.target.value })}
                  placeholder="Other client responsibility..."
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 text-xs mt-1"
                />
              </div>
            </div>

            {/* 9. Content / Asset Submission */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  9
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FolderUp className="w-3.5 h-3.5 text-emerald-600" />
                  Content / Asset Submission Format
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Submission Format
                  </label>
                  <input
                    type="text"
                    value={value.submissionFormat}
                    onChange={(e) => update({ submissionFormat: e.target.value })}
                    placeholder="e.g. Google Drive, WhatsApp"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={value.submissionFrequency}
                    onChange={(e) => update({ submissionFrequency: e.target.value })}
                    placeholder="e.g. Weekly, As Needed"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Deadline
                  </label>
                  <input
                    type="text"
                    value={value.submissionDeadline}
                    onChange={(e) => update({ submissionDeadline: e.target.value })}
                    placeholder="e.g. Every Monday"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 10. Approval Process */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  10
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Approval Process Workflow
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { step: "1", title: "Content Shared", desc: "Drafts shared for review" },
                  { step: "2", title: "Client Feedback", desc: "Consolidated comments" },
                  { step: "3", title: "Revisions", desc: "Iterated per policy" },
                  { step: "4", title: "Final Approval", desc: "Scheduled & published" },
                ].map((s) => (
                  <div
                    key={s.step}
                    className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#231f1a] text-center"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold mx-auto flex items-center justify-center text-[10px] mb-1">
                      {s.step}
                    </span>
                    <p className="font-bold text-[11px] text-stone-800 dark:text-stone-200">{s.title}</p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 11. Approval Timeline */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  11
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Approval Timeline SLAs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Review Timeline
                  </label>
                  <input
                    type="text"
                    value={value.reviewTimeline}
                    onChange={(e) => update({ reviewTimeline: e.target.value })}
                    placeholder="e.g. 24-48 hours"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    If no response within:
                  </label>
                  <input
                    type="text"
                    value={value.noResponseWithin}
                    onChange={(e) => update({ noResponseWithin: e.target.value })}
                    placeholder="e.g. 48 hours"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Action Taken:
                  </label>
                  <input
                    type="text"
                    value={value.noResponseAction}
                    onChange={(e) => update({ noResponseAction: e.target.value })}
                    placeholder="e.g. Assume approved / reschedule"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 12. Revision Policy */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  12
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                  Revision Policy
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Revisions Included
                  </label>
                  <input
                    type="text"
                    value={value.revisionsIncluded}
                    onChange={(e) => update({ revisionsIncluded: e.target.value })}
                    placeholder="e.g. 2 rounds per deliverable"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Covered in Revisions
                  </label>
                  <input
                    type="text"
                    value={value.revisionsCovered}
                    onChange={(e) => update({ revisionsCovered: e.target.value })}
                    placeholder="e.g. caption changes, minor design edits"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Additional Revision Charge
                  </label>
                  <input
                    type="text"
                    value={value.additionalRevisionCharge}
                    onChange={(e) => update({ additionalRevisionCharge: e.target.value })}
                    placeholder="e.g. ₹1,500 per extra round"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 13. Payment Terms */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  13
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  Payment Terms
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: "advance_50", label: "Advance Payment (e.g. 50%)" },
                  { id: "monthly", label: "Monthly Payment (Retainer)" },
                  { id: "quarterly", label: "Quarterly Advance Payment" },
                  { id: "other", label: "Other Term" },
                ].map((term) => (
                  <label key={term.id} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="paymentTerms"
                      checked={value.paymentTerms === term.id}
                      onChange={() => update({ paymentTerms: term.id as any })}
                      className="accent-emerald-600"
                    />
                    <span>{term.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 14. Additional Work Charges */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  14
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Additional Work Charges (Out of Scope)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Hourly Rate / Per Task:
                  </label>
                  <input
                    type="text"
                    value={value.hourlyRateOrTask}
                    onChange={(e) => update({ hourlyRateOrTask: e.target.value })}
                    placeholder="e.g. ₹2,500/hour or Flat Task Rate"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Examples:
                  </label>
                  <input
                    type="text"
                    value={value.additionalWorkExamples}
                    onChange={(e) => update({ additionalWorkExamples: e.target.value })}
                    placeholder="e.g. Extra reels, ad creatives, pitch deck"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 15. Ad Spend Responsibility */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  15
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Ad Spend Responsibility
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { id: "client_manages", label: "Client will manage & pay for ad spend directly" },
                  { id: "we_manage_client_pays", label: "We will manage (client card on file)" },
                  { id: "shared", label: "Shared management responsibility" },
                  { id: "not_applicable", label: "Not applicable (organic only)" },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="adSpendResponsibility"
                      checked={value.adSpendResponsibility === opt.id}
                      onChange={() => update({ adSpendResponsibility: opt.id as any })}
                      className="accent-emerald-600"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 16. Communication Channel */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  16
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Primary Communication Channels
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {["WhatsApp", "Email", "Slack"].map((ch) => {
                  const isChecked = (value.communicationChannels || []).includes(ch);
                  return (
                    <button
                      type="button"
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        isChecked
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white dark:bg-[#231f1a] border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      {ch}
                    </button>
                  );
                })}
                <input
                  type="text"
                  value={value.communicationOther || ""}
                  onChange={(e) => update({ communicationOther: e.target.value })}
                  placeholder="Other channel..."
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 text-xs"
                />
              </div>
            </div>

            {/* 17. Communication / Response Time */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  17
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  Response Time & Working Hours
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Response Time
                  </label>
                  <input
                    type="text"
                    value={value.expectedResponseTime}
                    onChange={(e) => update({ expectedResponseTime: e.target.value })}
                    placeholder="e.g. Within 24 hours"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Working Hours
                  </label>
                  <input
                    type="text"
                    value={value.workingHours}
                    onChange={(e) => update({ workingHours: e.target.value })}
                    placeholder="e.g. Mon-Fri 10AM-6PM"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={value.emergencyContact}
                    onChange={(e) => update({ emergencyContact: e.target.value })}
                    placeholder="Phone number"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 18. Content Deadlines */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  18
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Monthly Production Deadlines
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Calendar Share Date
                  </label>
                  <input
                    type="text"
                    value={value.monthlyCalendarShareDate}
                    onChange={(e) => update({ monthlyCalendarShareDate: e.target.value })}
                    placeholder="e.g. 1st of every month"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Submission Deadline
                  </label>
                  <input
                    type="text"
                    value={value.contentSubmissionDeadline}
                    onChange={(e) => update({ contentSubmissionDeadline: e.target.value })}
                    placeholder="e.g. 3 days prior"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Final Approval Deadline
                  </label>
                  <input
                    type="text"
                    value={value.finalApprovalDeadline}
                    onChange={(e) => update({ finalApprovalDeadline: e.target.value })}
                    placeholder="e.g. 24 hours prior"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 19. Cancellation / Pause Policy */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  19
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                  Cancellation & Pause Policy
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Notice Period
                  </label>
                  <input
                    type="text"
                    value={value.noticePeriod}
                    onChange={(e) => update({ noticePeriod: e.target.value })}
                    placeholder="e.g. 30 days written notice"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Refund Policy
                  </label>
                  <input
                    type="text"
                    value={value.refundPolicy}
                    onChange={(e) => update({ refundPolicy: e.target.value })}
                    placeholder="e.g. No refund for active month"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-stone-600 dark:text-stone-400">
                    Pause Option
                  </label>
                  <input
                    type="text"
                    value={value.pauseOption}
                    onChange={(e) => update({ pauseOption: e.target.value })}
                    placeholder="e.g. 14 days prior notice"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 20. Ownership of Final Content */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  20
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  Ownership of Final Content
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                {[
                  {
                    id: "transferred_after_payment",
                    label: "Content ownership transfers to client after final invoice settlement",
                  },
                  {
                    id: "agency_showcase_portfolio",
                    label: "Agency retains the non-exclusive right to showcase content in portfolio/case studies",
                  },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="ownershipOption"
                      checked={value.ownershipOption === opt.id}
                      onChange={() => update({ ownershipOption: opt.id as any })}
                      className="accent-emerald-600"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 21. Raw / Editable File Policy */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#1a1714] space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  21
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                  Raw / Editable Project File Policy
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { id: "not_included", label: "Editable project files not included" },
                  { id: "available_on_request", label: "Available on request (standard asset release fee)" },
                  { id: "specific_files_included", label: "Specific files included" },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="rawFileOption"
                      checked={value.rawFileOption === opt.id}
                      onChange={() => update({ rawFileOption: opt.id as any })}
                      className="accent-emerald-600"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}

                <input
                  type="text"
                  value={value.rawFilesSpecific || ""}
                  onChange={(e) => update({ rawFilesSpecific: e.target.value })}
                  placeholder="Specify formats (e.g. 4K MP4, PNG, PSD, Premiere project)..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#231f1a] border border-stone-200 dark:border-stone-700 outline-none text-xs"
                />
              </div>
            </div>

            {/* 22. Results / Performance Disclaimer */}
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/20 space-y-3 lg:col-span-2">
              <div className="flex items-center gap-2 border-b border-amber-200 dark:border-amber-900/60 pb-2">
                <span className="w-6 h-6 rounded-md bg-amber-600 text-white font-black text-xs flex items-center justify-center">
                  22
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Results & Performance Disclaimer
                </span>
              </div>

              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed italic">
                &ldquo;While we use proven creative frameworks, high-converting hooks, and industry best practices, we do not guarantee specific numerical results such as exact follower counts, viral engagement, leads or revenue, as these depend on multiple external market and platform algorithm factors.&rdquo;
              </p>

              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-bold text-amber-950 dark:text-amber-100 pt-1">
                <input
                  type="checkbox"
                  checked={value.disclaimerAcknowledged}
                  onChange={(e) => update({ disclaimerAcknowledged: e.target.checked })}
                  className="w-4 h-4 accent-amber-600 rounded"
                />
                <span>Client acknowledges and agrees to the performance disclaimer</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
