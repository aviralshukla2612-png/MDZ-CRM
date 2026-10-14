"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  Sparkles,
  Users,
  Target,
  FileText,
  Calendar,
  BarChart3,
  MessageSquare,
  Plus,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Globe,
  Video,
  Palette,
  PenTool,
  TrendingUp,
  Share2,
  Sliders,
  ChevronRight,
  FolderKanban,
  Edit3,
  Trash2,
  Award,
  Layers,
  Search,
} from "lucide-react";

export default function PersonalBrandsPage() {
  const { showToast } = useToast();

  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [employees, setEmployees] = useState<any[]>([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "profiles" | "strategy" | "pipeline" | "calendar" | "performance" | "approvals"
  >("profiles");

  // Create Profile Modal State
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [newNiche, setNewNiche] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newPositioning, setNewPositioning] = useState("");
  const [newAudience, setNewAudience] = useState("");
  const [newGeography, setNewGeography] = useState("");
  const [newTone, setNewTone] = useState("");
  const [newGuidelines, setNewGuidelines] = useState("");
  const [newMonthlyPackage, setNewMonthlyPackage] = useState("16 Reels + 8 LinkedIn Articles + 4 Carousels");
  const [newMonthlyCommitments, setNewMonthlyCommitments] = useState("Weekly 4 video shoots, daily content publishing");
  const [newBrandAudit, setNewBrandAudit] = useState("");
  const [newCompetitors, setNewCompetitors] = useState("");
  const [newKpis, setNewKpis] = useState("");
  const [newInstagram, setNewInstagram] = useState("");
  const [newLinkedin, setNewLinkedin] = useState("");
  const [newYoutube, setNewYoutube] = useState("");
  const [newTwitter, setNewTwitter] = useState("");

  // Create Content Item Modal State
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [contentTitle, setContentTitle] = useState("");
  const [contentHook, setContentHook] = useState("");
  const [contentTopic, setContentTopic] = useState("");
  const [contentPlatform, setContentPlatform] = useState("INSTAGRAM");
  const [contentType, setContentType] = useState("REEL");
  const [contentPriority, setContentPriority] = useState("MEDIUM");
  const [contentScript, setContentScript] = useState("");
  const [contentCaption, setContentCaption] = useState("");
  const [contentHashtags, setContentHashtags] = useState("");
  const [contentTrendingUrl, setContentTrendingUrl] = useState("");
  const [contentStage, setContentStage] = useState("IDEA");
  const [contentScriptwriterId, setContentScriptwriterId] = useState("");
  const [contentVideoEditorId, setContentVideoEditorId] = useState("");
  const [contentDesignerId, setContentDesignerId] = useState("");
  const [contentScheduledDate, setContentScheduledDate] = useState("");
  const [contentApprovalDeadline, setContentApprovalDeadline] = useState("");

  // Log Performance Modal State
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [metricMonth, setMetricMonth] = useState<number>(new Date().getMonth() + 1);
  const [metricYear, setMetricYear] = useState<number>(new Date().getFullYear());
  const [metricPlatform, setMetricPlatform] = useState("TOTAL");
  const [metricFollowers, setMetricFollowers] = useState<number>(0);
  const [metricGrowth, setMetricGrowth] = useState<number>(0);
  const [metricReach, setMetricReach] = useState<number>(0);
  const [metricImpressions, setMetricImpressions] = useState<number>(0);
  const [metricEngagement, setMetricEngagement] = useState<number>(0);
  const [metricVisits, setMetricVisits] = useState<number>(0);
  const [metricInquiries, setMetricInquiries] = useState<number>(0);
  const [metricTopContent, setMetricTopContent] = useState("");
  const [metricNotes, setMetricNotes] = useState("");
  const [metricGoalsVsResults, setMetricGoalsVsResults] = useState("");

  // Meeting Note Modal State
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split("T")[0]);
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingActionItems, setMeetingActionItems] = useState("");
  const [meetingNextDate, setMeetingNextDate] = useState("");

  // Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackRequestedBy, setFeedbackRequestedBy] = useState("Client");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackChangeRequested, setFeedbackChangeRequested] = useState("");
  const [feedbackDeadline, setFeedbackDeadline] = useState("");

  // Delete Confirm Modal State
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: "",
    name: "",
  });

  useEffect(() => {
    fetchProfiles();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedProfileId) {
      fetchProfileDetail(selectedProfileId);
    }
  }, [selectedProfileId]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/mdz-crm/api/employees");
      const json = await res.json();
      if (json.success) setEmployees(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/personal-brands");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProfiles(json.data);
        if (json.data.length > 0 && !selectedProfileId) {
          setSelectedProfileId(json.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`/mdz-crm/api/personal-brands/${id}`);
      const json = await res.json();
      if (json.success) {
        setSelectedProfile(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const socialLinksJson = JSON.stringify({
        instagram: newInstagram.trim(),
        linkedin: newLinkedin.trim(),
        youtube: newYoutube.trim(),
        twitter: newTwitter.trim(),
      });

      const res = await fetch("/mdz-crm/api/personal-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: newClientName,
          handle: newHandle,
          niche: newNiche,
          professionalBio: newBio,
          brandPositioning: newPositioning,
          targetAudience: newAudience,
          targetGeography: newGeography,
          toneOfVoice: newTone,
          brandGuidelines: newGuidelines,
          socialLinksJson,
          monthlyPackage: newMonthlyPackage,
          monthlyCommitments: newMonthlyCommitments,
          brandAuditSummary: newBrandAudit,
          competitorTracking: newCompetitors,
          monthlyGoalsKpis: newKpis,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`✓ Personal Brand Profile for "${newClientName}" created!`, "success");
        setIsAddProfileOpen(false);
        fetchProfiles();
        setSelectedProfileId(json.data.id);
        // Reset form
        setNewClientName("");
        setNewHandle("");
        setNewNiche("");
        setNewBio("");
        setNewPositioning("");
        setNewAudience("");
        setNewGeography("");
        setNewTone("");
        setNewGuidelines("");
        setNewBrandAudit("");
        setNewCompetitors("");
        setNewKpis("");
        setNewInstagram("");
        setNewLinkedin("");
        setNewYoutube("");
        setNewTwitter("");
      } else {
        showToast(json.error || "Failed to create profile", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) return;

    try {
      const res = await fetch(`/mdz-crm/api/personal-brands/${selectedProfileId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: contentTitle,
          hook: contentHook,
          topic: contentTopic,
          platform: contentPlatform,
          contentType,
          priority: contentPriority,
          scriptText: contentScript,
          caption: contentCaption,
          hashtags: contentHashtags,
          trendingReferenceUrl: contentTrendingUrl,
          productionStage: contentStage,
          scriptwriterId: contentScriptwriterId || null,
          videoEditorId: contentVideoEditorId || null,
          designerId: contentDesignerId || null,
          scheduledDate: contentScheduledDate || null,
          approvalDeadline: contentApprovalDeadline || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Content item added to pipeline & strategy hub", "success");
        setIsAddContentOpen(false);
        fetchProfileDetail(selectedProfileId);
        // Reset
        setContentTitle("");
        setContentHook("");
        setContentTopic("");
        setContentScript("");
        setContentCaption("");
        setContentHashtags("");
        setContentTrendingUrl("");
        setContentStage("IDEA");
      } else {
        showToast(json.error || "Failed to add content", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const handleUpdateContentStage = async (contentId: string, stage: string) => {
    if (!selectedProfileId) return;
    try {
      const res = await fetch(`/mdz-crm/api/personal-brands/${selectedProfileId}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, productionStage: stage }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Stage updated to ${stage.replace(/_/g, " ")}`, "success");
        fetchProfileDetail(selectedProfileId);
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const handleToggleClientApproval = async (contentId: string, currentVal: boolean) => {
    if (!selectedProfileId) return;
    try {
      const res = await fetch(`/mdz-crm/api/personal-brands/${selectedProfileId}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, clientApproved: !currentVal }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Approval status: ${!currentVal ? "APPROVED" : "PENDING"}`, "success");
        fetchProfileDetail(selectedProfileId);
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const handleSaveMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) return;

    try {
      const res = await fetch(`/mdz-crm/api/personal-brands/${selectedProfileId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: metricMonth,
          year: metricYear,
          platform: metricPlatform,
          totalFollowers: metricFollowers,
          followerGrowth: metricGrowth,
          totalReach: metricReach,
          totalImpressions: metricImpressions,
          engagementRate: metricEngagement,
          profileVisits: metricVisits,
          inquiriesGenerated: metricInquiries,
          topPerformingContent: metricTopContent,
          monthlyReportNotes: metricNotes,
          goalsVersusResults: metricGoalsVsResults,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Monthly performance logged!", "success");
        setIsMetricModalOpen(false);
        fetchProfileDetail(selectedProfileId);
      } else {
        showToast(json.error || "Failed to log metrics", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) return;

    try {
      const res = await fetch(`/mdz-crm/api/personal-brands/${selectedProfileId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meetingTitle,
          meetingDate,
          agenda: meetingAgenda,
          discussionNotes: meetingNotes,
          actionItems: meetingActionItems,
          nextMeetingDate: meetingNextDate || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Meeting notes saved!", "success");
        setIsMeetingModalOpen(false);
        fetchProfileDetail(selectedProfileId);
        setMeetingTitle("");
        setMeetingAgenda("");
        setMeetingNotes("");
        setMeetingActionItems("");
      } else {
        showToast(json.error || "Failed to save meeting notes", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) return;

    try {
      const res = await fetch(`/mdz-crm/api/personal-brands/${selectedProfileId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedBy: feedbackRequestedBy,
          feedbackText,
          changeRequested: feedbackChangeRequested,
          deadline: feedbackDeadline || null,
          status: "OPEN",
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Feedback logged and ticket created", "success");
        setIsFeedbackModalOpen(false);
        fetchProfileDetail(selectedProfileId);
        setFeedbackText("");
        setFeedbackChangeRequested("");
      } else {
        showToast(json.error || "Failed to log feedback", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const handleDeleteProfile = async (id: string, name: string) => {
    try {
      const res = await fetch(`/mdz-crm/api/personal-brands/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Personal brand ${name} removed`, "success");
        fetchProfiles();
        setSelectedProfileId("");
        setSelectedProfile(null);
      } else {
        showToast(json.error || "Failed to delete", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const parsedSocials = React.useMemo(() => {
    if (!selectedProfile?.socialLinksJson) return {};
    try {
      return JSON.parse(selectedProfile.socialLinksJson);
    } catch (e) {
      return {};
    }
  }, [selectedProfile]);

  const stagesList = [
    { key: "IDEA", label: "Ideas & Topics", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    { key: "SCRIPTING", label: "Scripting / Hooks", color: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
    { key: "SCRIPT_APPROVED", label: "Script Approved", color: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    { key: "SHOOTING", label: "Shooting Stage", color: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
    { key: "EDITING", label: "Video Editing", color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
    { key: "DRAFT_REVIEW", label: "Draft Review", color: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
    { key: "REVISION", label: "Client Revisions", color: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
    { key: "CLIENT_APPROVED", label: "Client Approved", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
    { key: "SCHEDULED", label: "Scheduled for Posting", color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
    { key: "PUBLISHED", label: "Live Published", color: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300" },
  ];

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Personal Brand Department"
        description="Comprehensive client profiles, topic libraries, creative production pipelines, PR calendar, performance analytics, and client communication."
        badge="DEPARTMENT SUITE"
        icon={<Sparkles className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddContentOpen(true)}
              disabled={!selectedProfileId}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Content Piece</span>
            </button>
            <button
              onClick={() => setIsAddProfileOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>+ Onboard Brand Client</span>
            </button>
          </div>
        }
      />

      {/* Client Quick Selector Strip */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3 shadow-xs flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pl-2">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            <span>SELECT CLIENT BRAND:</span>
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {profiles.map((p) => {
            const isSelected = p.id === selectedProfileId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProfileId(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                }`}
              >
                <span>{p.clientName}</span>
                {p.handle && (
                  <span className={`text-[10px] font-mono font-normal ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                    {p.handle}
                  </span>
                )}
              </button>
            );
          })}

          {profiles.length === 0 && !loading && (
            <span className="text-xs text-slate-400 italic">No personal brand clients onboarded yet. Click "+ Onboard Brand Client"</span>
          )}
        </div>
      </div>

      {/* Selected Client Brand Top Hero Card */}
      {selectedProfile && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-2xl text-white shadow-lg shrink-0">
              {selectedProfile.clientName[0]}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">{selectedProfile.clientName}</h2>
                {selectedProfile.handle && (
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-300 border border-white/10">
                    {selectedProfile.handle}
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedProfile.status}
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-medium line-clamp-1">
                {selectedProfile.niche} • {selectedProfile.brandPositioning || "Personal Branding Client"}
              </p>
              {selectedProfile.monthlyPackage && (
                <div className="text-[11px] font-mono text-amber-300 flex items-center gap-1.5 pt-0.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Package: {selectedProfile.monthlyPackage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Links Quick Badges */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {parsedSocials.instagram && (
              <a
                href={parsedSocials.instagram.startsWith("http") ? parsedSocials.instagram : `https://instagram.com/${parsedSocials.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-rose-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
                <span className="hidden sm:inline">Instagram</span>
              </a>
            )}
            {parsedSocials.linkedin && (
              <a
                href={parsedSocials.linkedin.startsWith("http") ? parsedSocials.linkedin : `https://linkedin.com/in/${parsedSocials.linkedin}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-sky-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
                <span className="hidden sm:inline">LinkedIn</span>
              </a>
            )}
            {parsedSocials.youtube && (
              <a
                href={parsedSocials.youtube.startsWith("http") ? parsedSocials.youtube : `https://youtube.com/${parsedSocials.youtube}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-red-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="YouTube"
              >
                <Youtube className="w-4 h-4" />
                <span className="hidden sm:inline">YouTube</span>
              </a>
            )}
            {parsedSocials.twitter && (
              <a
                href={parsedSocials.twitter.startsWith("http") ? parsedSocials.twitter : `https://x.com/${parsedSocials.twitter.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="X / Twitter"
              >
                <Twitter className="w-4 h-4" />
                <span className="hidden sm:inline">Twitter/X</span>
              </a>
            )}

            <button
              onClick={() => {
                setConfirmDelete({
                  isOpen: true,
                  id: selectedProfile.id,
                  name: selectedProfile.clientName,
                });
              }}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors ml-2"
              title="Delete Profile"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Department Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("profiles")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "profiles"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>1. Brand Profile & Dossier</span>
        </button>

        <button
          onClick={() => setActiveTab("strategy")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "strategy"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>2. Content & Strategy Hub</span>
        </button>

        <button
          onClick={() => setActiveTab("pipeline")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "pipeline"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. Creative Production Pipeline</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
            {selectedProfile?.contentItems?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "calendar"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>4. Social Media Calendar & PR</span>
        </button>

        <button
          onClick={() => setActiveTab("performance")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "performance"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>5. Brand Performance Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab("approvals")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "approvals"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>6. Client Approvals & Notes</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PERSONAL BRAND PROFILES & DOSSIER                        */}
      {/* ============================================================== */}
      {activeTab === "profiles" && selectedProfile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Brand Positioning & Unique Expertise */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <span>Brand Positioning & Unique Expertise</span>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {selectedProfile.brandPositioning || "No brand positioning statement defined yet."}
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <strong>Professional Bio:</strong> {selectedProfile.professionalBio || "N/A"}
            </div>
          </div>

          {/* Card 2: Audience Demographics & Target Geography */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-wide text-purple-600 dark:text-purple-400">
              <Globe className="w-4 h-4" />
              <span>Audience Demographics & Target Geography</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Target Audience Profile: </span>
                <span className="text-slate-600 dark:text-slate-400">{selectedProfile.targetAudience || "Tech founders, CXOs, investors"}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Target Geography: </span>
                <span className="text-slate-600 dark:text-slate-400">{selectedProfile.targetGeography || "India, Dubai, US West Coast"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 text-[11px] text-purple-900 dark:text-purple-300 font-medium">
                Focus on establishing thought leadership across these primary market hubs.
              </div>
            </div>
          </div>

          {/* Card 3: Tone of Voice & Brand Guidelines */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              <Sliders className="w-4 h-4" />
              <span>Tone of Voice & Brand Guidelines</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                <span className="font-bold text-amber-950 dark:text-amber-200 block mb-0.5">Tone of Voice:</span>
                <p className="text-slate-700 dark:text-slate-300">{selectedProfile.toneOfVoice || "Direct, insightful, storytelling-focused, authoritative."}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Visual & Content Guidelines:</span>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                  {selectedProfile.brandGuidelines || "Dark aesthetic, high-contrast captions, bold sans-serif fonts, crisp 4K vertical footage."}
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Monthly Package & Deliverable Commitments */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              <Target className="w-4 h-4" />
              <span>Goals, Monthly Package & Commitments</span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="font-bold text-emerald-950 dark:text-emerald-200">Package Tier:</span>
                <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">{selectedProfile.monthlyPackage || "Standard Retainer"}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Deliverable Commitments:</span>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">{selectedProfile.monthlyCommitments || "16 Reels, 8 Carousel Posts, 4 PR Articles per month."}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Monthly Goals & KPIs:</span>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">{selectedProfile.monthlyGoalsKpis || "+10K followers, 100K reach, 25 inbound DM leads."}</p>
              </div>
            </div>
          </div>

          {/* Card 5: Personal Brand Audit */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-wide text-sky-600 dark:text-sky-400">
              <BarChart3 className="w-4 h-4" />
              <span>Personal Brand Audit & Baseline</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {selectedProfile.brandAuditSummary || "Initial audit completed: Profile bio needs optimization, engagement rate 2.4%, lacks clear lead magnet CTA in profile link."}
            </p>
          </div>

          {/* Card 6: Competitor & Reference Tracking */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-wide text-rose-600 dark:text-rose-400">
              <TrendingUp className="w-4 h-4" />
              <span>Competitor & Benchmark Reference Tracking</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {selectedProfile.competitorTracking || "Benchmarks: @garyvee, @naval, @alexhormozi. Analyze high-retention 3-second visual hooks and short punchy sentences."}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: CONTENT & STRATEGY HUB (Hooks, Topics & Scripts)       */}
      {/* ============================================================== */}
      {activeTab === "strategy" && selectedProfile && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-indigo-600" />
                <span>Hook, Topic & Script Library</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Categorized by platform with viral hooks, script breakdowns, and talking points.
              </p>
            </div>
            <button
              onClick={() => setIsAddContentOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Hook / Script</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(selectedProfile.contentItems || []).map((item: any) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3.5 flex flex-col justify-between hover:border-indigo-400 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {item.platform} • {item.contentType}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        item.priority === "URGENT"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : item.priority === "HIGH"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {item.priority} PRIORITY
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                    {item.title}
                  </h4>

                  {item.hook && (
                    <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs">
                      <div className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide mb-1">
                        VIRAL 3-SEC HOOK:
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 italic">
                        "{item.hook}"
                      </p>
                    </div>
                  )}

                  {item.scriptText && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1">
                      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Script & Talking Points:</div>
                      <p className="whitespace-pre-line leading-relaxed">{item.scriptText}</p>
                    </div>
                  )}

                  {item.trendingReferenceUrl && (
                    <a
                      href={item.trendingReferenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 pt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Trending Reference Link</span>
                    </a>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-slate-500">
                    Stage: <strong>{item.productionStage.replace(/_/g, " ")}</strong>
                  </span>
                  <button
                    onClick={() => handleToggleClientApproval(item.id, item.clientApproved)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      item.clientApproved
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 hover:bg-emerald-50 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{item.clientApproved ? "Approved" : "Approve"}</span>
                  </button>
                </div>
              </div>
            ))}

            {(selectedProfile.contentItems || []).length === 0 && (
              <div className="col-span-full p-12 text-center text-slate-400 text-sm">
                No hooks or topics added yet for this client brand.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: CREATIVE PRODUCTION PIPELINE (Kanban Workflow)         */}
      {/* ============================================================== */}
      {activeTab === "pipeline" && selectedProfile && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Creative Production Pipeline (Scriptwriter, Editor & Designer Workflow)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track assets across Idea, Scripting, Shooting, Editing, Draft Review, and Client Approvals.
              </p>
            </div>
            <button
              onClick={() => setIsAddContentOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Pipeline Asset</span>
            </button>
          </div>

          {/* Horizontal Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {[
              { stage: "IDEA", label: "💡 1. Ideas & Topics" },
              { stage: "SCRIPTING", label: "✍️ 2. Scripting" },
              { stage: "SHOOTING", label: "🎬 3. Shooting" },
              { stage: "EDITING", label: "✂️ 4. Editing & Design" },
              { stage: "CLIENT_APPROVED", label: "🚀 5. Approved & Ready" },
            ].map((col) => {
              const itemsInCol = (selectedProfile.contentItems || []).filter(
                (item: any) =>
                  col.stage === "IDEA"
                    ? item.productionStage === "IDEA"
                    : col.stage === "SCRIPTING"
                    ? ["SCRIPTING", "SCRIPT_APPROVED"].includes(item.productionStage)
                    : col.stage === "SHOOTING"
                    ? item.productionStage === "SHOOTING"
                    : col.stage === "EDITING"
                    ? ["EDITING", "DRAFT_REVIEW", "REVISION"].includes(item.productionStage)
                    : ["CLIENT_APPROVED", "SCHEDULED", "PUBLISHED"].includes(item.productionStage)
              );

              return (
                <div
                  key={col.stage}
                  className="bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 flex flex-col justify-between min-h-[480px] space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {col.label}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {itemsInCol.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                    {itemsInCol.map((item: any) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2 hover:border-indigo-400 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {item.platform}
                          </span>
                          <span className="font-mono font-bold text-slate-400">
                            {item.contentType}
                          </span>
                        </div>

                        <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2">
                          {item.title}
                        </h5>

                        {item.hook && (
                          <p className="text-[11px] text-slate-500 italic line-clamp-2">
                            "{item.hook}"
                          </p>
                        )}

                        {/* Task Allocation Badges */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-1 text-[9px] font-mono">
                          {item.scriptwriterId && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                              ✍️ Scriptwriter
                            </span>
                          )}
                          {item.videoEditorId && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                              ✂️ Editor
                            </span>
                          )}
                          {item.designerId && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                              🎨 Designer
                            </span>
                          )}
                        </div>

                        {/* Move stage dropdown */}
                        <div className="pt-1 flex items-center justify-between">
                          <select
                            value={item.productionStage}
                            onChange={(e) => handleUpdateContentStage(item.id, e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
                          >
                            {stagesList.map((st) => (
                              <option key={st.key} value={st.key}>
                                {st.label}
                              </option>
                            ))}
                          </select>

                          {item.clientApproved && (
                            <span className="text-[10px] text-emerald-600 font-bold" title="Approved by Client">
                              ✓ Approved
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {itemsInCol.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs italic">
                        Empty stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: SOCIAL MEDIA CALENDAR & PR MANAGEMENT                  */}
      {/* ============================================================== */}
      {activeTab === "calendar" && selectedProfile && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Platform-Wise Social Media Content Calendar & Publishing Status</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled release dates, distribution platforms, and live published links.
              </p>
            </div>
            <button
              onClick={() => setIsAddContentOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all"
            >
              + Schedule Content
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] font-mono tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Scheduled Date</th>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Content Title & Hook</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4 text-center">Client Approved</th>
                    <th className="py-3 px-4 text-right">Published Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(selectedProfile.contentItems || []).map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.scheduledDate
                          ? new Date(item.scheduledDate).toLocaleDateString()
                          : "Not Scheduled"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                          {item.platform}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.title}</div>
                        {item.hook && <div className="text-[11px] text-slate-500 truncate max-w-xs italic">"{item.hook}"</div>}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">{item.contentType}</td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-indigo-600">
                        {item.productionStage.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.clientApproved ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                            ✓ Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px]">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.publishedUrl ? (
                          <a
                            href={item.publishedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
                          >
                            <span>View Live</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unpublished</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: BRAND PERFORMANCE DASHBOARD (Reach, KPIs & Reports)    */}
      {/* ============================================================== */}
      {activeTab === "performance" && selectedProfile && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Brand Reach, Engagement Reporting & Monthly Goals vs Results</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly performance metrics, inquiry generation, and KPI tracking.
              </p>
            </div>
            <button
              onClick={() => setIsMetricModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Log Monthly Performance</span>
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(() => {
              const latest = selectedProfile.brandMetrics?.[0] || {};
              return (
                <>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-1">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">Total Followers</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {latest.totalFollowers?.toLocaleString() || "0"}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-semibold">
                      +{latest.followerGrowth?.toLocaleString() || "0"} this month
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-1">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">Total Reach</span>
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {latest.totalReach?.toLocaleString() || "0"}
                    </div>
                    <div className="text-[11px] text-indigo-600 font-semibold">
                      {latest.totalImpressions?.toLocaleString() || "0"} impressions
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-1">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">Avg Engagement</span>
                    <div className="text-2xl font-black text-amber-500">
                      {latest.engagementRate || 0}%
                    </div>
                    <div className="text-[11px] text-amber-600 font-semibold">
                      {latest.profileVisits || 0} profile visits
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-1">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">Inquiries Generated</span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {latest.inquiriesGenerated || 0}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-semibold">High-intent client leads</div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Monthly Logs History */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Monthly Reports & Historical Performance
            </h4>

            <div className="space-y-3">
              {(selectedProfile.brandMetrics || []).map((m: any) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                      Month {m.month} / {m.year} • {m.platform}
                    </span>
                    <span className="text-slate-500">
                      Reach: <strong>{m.totalReach?.toLocaleString()}</strong> • Followers: <strong>{m.totalFollowers?.toLocaleString()}</strong>
                    </span>
                  </div>

                  {m.topPerformingContent && (
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Top Content: </span>
                      <span className="text-slate-600 dark:text-slate-400">{m.topPerformingContent}</span>
                    </div>
                  )}

                  {m.goalsVersusResults && (
                    <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 text-[11px] text-indigo-900 dark:text-indigo-300">
                      <strong>Goals vs Results:</strong> {m.goalsVersusResults}
                    </div>
                  )}

                  {m.monthlyReportNotes && (
                    <div className="text-[11px] text-slate-500 whitespace-pre-line">
                      <strong>Report Summary:</strong> {m.monthlyReportNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: CLIENT COMMUNICATION, APPROVALS & MEETING NOTES        */}
      {/* ============================================================== */}
      {activeTab === "approvals" && selectedProfile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left Column: Meeting Notes & Internal Project Discussions */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Meeting Notes & Internal Discussion
                </h3>
              </div>
              <button
                onClick={() => setIsMeetingModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Meeting</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {(selectedProfile.meetingNotes || []).map((m: any) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900 dark:text-slate-100">{m.title}</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(m.meetingDate).toLocaleDateString()}
                    </span>
                  </div>
                  {m.agenda && (
                    <div className="text-[11px] text-slate-500">
                      <strong>Agenda:</strong> {m.agenda}
                    </div>
                  )}
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {m.discussionNotes}
                  </p>
                  {m.actionItems && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200">
                      <strong>Action Items:</strong> {m.actionItems}
                    </div>
                  )}
                </div>
              ))}

              {(selectedProfile.meetingNotes || []).length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No meeting notes recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Client Feedback, Change Requests & Approval Deadlines */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Client Feedback & Change Requests
                </h3>
              </div>
              <button
                onClick={() => setIsFeedbackModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-500 transition-all flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Log Feedback</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {(selectedProfile.clientFeedbacks || []).map((fb: any) => (
                <div
                  key={fb.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px]">
                      From: {fb.requestedBy}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        fb.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : fb.status === "IN_PROGRESS"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {fb.status}
                    </span>
                  </div>

                  <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-line leading-relaxed">
                    {fb.feedbackText}
                  </p>

                  {fb.changeRequested && (
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-[11px]">
                      <strong>Change Requested:</strong> {fb.changeRequested}
                    </div>
                  )}

                  {fb.deadline && (
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Approval Deadline: {new Date(fb.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))}

              {(selectedProfile.clientFeedbacks || []).length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No feedback or change requests recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ONBOARD NEW PERSONAL BRAND CLIENT                     */}
      {/* ============================================================== */}
      <BottomSheet
        isOpen={isAddProfileOpen}
        onClose={() => setIsAddProfileOpen(false)}
        title="Onboard Personal Brand Client"
        subtitle="Complete branding profile, positioning, audience, guidelines, and monthly commitments."
      >
        <form onSubmit={handleCreateProfile} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Client Full Name *</label>
              <input
                type="text"
                required
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="e.g. Dr. Vivek Sharma"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Primary Handle / Username</label>
              <input
                type="text"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                placeholder="@drvivek_official"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Domain / Niche</label>
            <input
              type="text"
              value={newNiche}
              onChange={(e) => setNewNiche(e.target.value)}
              placeholder="e.g. Fintech Founder / Real Estate / Health & Wellness"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Brand Positioning & Unique Expertise</label>
            <textarea
              rows={2}
              value={newPositioning}
              onChange={(e) => setNewPositioning(e.target.value)}
              placeholder="What makes this personal brand uniquely credible and stand out?"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Audience Demographics</label>
              <input
                type="text"
                value={newAudience}
                onChange={(e) => setNewAudience(e.target.value)}
                placeholder="e.g. 25-45 Tech CXOs, Entrepreneurs"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Target Geography</label>
              <input
                type="text"
                value={newGeography}
                onChange={(e) => setNewGeography(e.target.value)}
                placeholder="e.g. India & US NRI diaspora"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Tone of Voice</label>
              <input
                type="text"
                value={newTone}
                onChange={(e) => setNewTone(e.target.value)}
                placeholder="e.g. Authoritative, Inspiring, High-energy"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Monthly Package Commitments</label>
              <input
                type="text"
                value={newMonthlyPackage}
                onChange={(e) => setNewMonthlyPackage(e.target.value)}
                placeholder="16 Reels + 8 LinkedIn Articles"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
            <span className="font-bold text-indigo-900 dark:text-indigo-200 block text-xs">
              Social Media Account Links
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newInstagram}
                onChange={(e) => setNewInstagram(e.target.value)}
                placeholder="Instagram handle/URL"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono"
              />
              <input
                type="text"
                value={newLinkedin}
                onChange={(e) => setNewLinkedin(e.target.value)}
                placeholder="LinkedIn URL"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono"
              />
              <input
                type="text"
                value={newYoutube}
                onChange={(e) => setNewYoutube(e.target.value)}
                placeholder="YouTube Channel URL"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono"
              />
              <input
                type="text"
                value={newTwitter}
                onChange={(e) => setNewTwitter(e.target.value)}
                placeholder="Twitter / X handle"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Brand Guidelines & Visual Dos/Don'ts</label>
            <textarea
              rows={2}
              value={newGuidelines}
              onChange={(e) => setNewGuidelines(e.target.value)}
              placeholder="e.g. Colors: Black & Gold. Clean typography. Avoid clickbait language."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
          >
            Create Brand Profile
          </button>
        </form>
      </BottomSheet>

      {/* ============================================================== */}
      {/* MODAL 2: ADD CONTENT PIECE (Hook, Script & Pipeline)           */}
      {/* ============================================================== */}
      <BottomSheet
        isOpen={isAddContentOpen}
        onClose={() => setIsAddContentOpen(false)}
        title="Add Content Asset"
        subtitle="Draft viral hooks, scripts, assign production staff, and schedule."
      >
        <form onSubmit={handleCreateContent} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="font-semibold block mb-1">Topic / Working Title *</label>
            <input
              type="text"
              required
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
              placeholder="e.g. How I closed a $50k deal with 1 LinkedIn post"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Platform</label>
              <select
                value={contentPlatform}
                onChange={(e) => setContentPlatform(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-semibold"
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="YOUTUBE_SHORTS">YouTube Shorts</option>
                <option value="TWITTER_X">Twitter / X</option>
                <option value="YOUTUBE_LONG">YouTube Long Form</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Content Format</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-semibold"
              >
                <option value="REEL">Vertical Reel</option>
                <option value="CAROUSEL">Carousel Slide</option>
                <option value="TEXT_POST">Text / Story</option>
                <option value="LONG_VIDEO">Long-form Video</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-amber-700 dark:text-amber-400">
              3-Second Viral Hook
            </label>
            <input
              type="text"
              value={contentHook}
              onChange={(e) => setContentHook(e.target.value)}
              placeholder="e.g. Stop doing this if you want to double your income in 2026..."
              className="w-full bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Full Script, Talking Points & Caption</label>
            <textarea
              rows={4}
              value={contentScript}
              onChange={(e) => setContentScript(e.target.value)}
              placeholder="Write the complete script or step-by-step talking points for shooting..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Trending Reference Link</label>
            <input
              type="text"
              value={contentTrendingUrl}
              onChange={(e) => setContentTrendingUrl(e.target.value)}
              placeholder="https://instagram.com/reel/..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-mono"
            />
          </div>

          {/* Creative Production Staff Allocation */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2.5">
            <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200 block">
              Creative Production Staff Allocation
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Scriptwriter</label>
                <select
                  value={contentScriptwriterId}
                  onChange={(e) => setContentScriptwriterId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Video Editor</label>
                <select
                  value={contentVideoEditorId}
                  onChange={(e) => setContentVideoEditorId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Graphic Designer</label>
                <select
                  value={contentDesignerId}
                  onChange={(e) => setContentDesignerId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Production Stage</label>
              <select
                value={contentStage}
                onChange={(e) => setContentStage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-semibold"
              >
                {stagesList.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Scheduled Publish Date</label>
              <input
                type="date"
                value={contentScheduledDate}
                onChange={(e) => setContentScheduledDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
          >
            Create Content Piece
          </button>
        </form>
      </BottomSheet>

      {/* ============================================================== */}
      {/* MODAL 3: LOG PERFORMANCE METRICS                               */}
      {/* ============================================================== */}
      <BottomSheet
        isOpen={isMetricModalOpen}
        onClose={() => setIsMetricModalOpen(false)}
        title="Log Brand Performance Metrics"
        subtitle="Track reach, impressions, followers, engagement rate, and inbound leads."
      >
        <form onSubmit={handleSaveMetric} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Month</label>
              <input
                type="number"
                min="1"
                max="12"
                value={metricMonth}
                onChange={(e) => setMetricMonth(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-mono"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Year</label>
              <input
                type="number"
                value={metricYear}
                onChange={(e) => setMetricYear(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Total Followers</label>
              <input
                type="number"
                value={metricFollowers}
                onChange={(e) => setMetricFollowers(Number(e.target.value))}
                placeholder="e.g. 50000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Follower Growth (New)</label>
              <input
                type="number"
                value={metricGrowth}
                onChange={(e) => setMetricGrowth(Number(e.target.value))}
                placeholder="e.g. 4500"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Total Reach</label>
              <input
                type="number"
                value={metricReach}
                onChange={(e) => setMetricReach(Number(e.target.value))}
                placeholder="e.g. 150000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Total Impressions</label>
              <input
                type="number"
                value={metricImpressions}
                onChange={(e) => setMetricImpressions(Number(e.target.value))}
                placeholder="e.g. 300000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Engagement Rate (%)</label>
              <input
                type="number"
                step="any"
                value={metricEngagement}
                onChange={(e) => setMetricEngagement(Number(e.target.value))}
                placeholder="3.8"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Inquiries Generated (Leads)</label>
              <input
                type="number"
                value={metricInquiries}
                onChange={(e) => setMetricInquiries(Number(e.target.value))}
                placeholder="e.g. 18"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Goals vs Results Analysis</label>
            <textarea
              rows={2}
              value={metricGoalsVsResults}
              onChange={(e) => setMetricGoalsVsResults(e.target.value)}
              placeholder="e.g. Target was 100k reach, exceeded to 150k reach via trending reel hook."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Monthly Report Summary Notes</label>
            <textarea
              rows={3}
              value={metricNotes}
              onChange={(e) => setMetricNotes(e.target.value)}
              placeholder="Key observations and strategic focus for next month..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
          >
            Save Performance Metrics
          </button>
        </form>
      </BottomSheet>

      {/* ============================================================== */}
      {/* MODAL 4: ADD MEETING NOTES                                     */}
      {/* ============================================================== */}
      <BottomSheet
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        title="Add Meeting Notes & Project Discussion"
        subtitle="Log discussion notes, strategy agendas, and action items."
      >
        <form onSubmit={handleSaveMeeting} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold block mb-1">Meeting Title *</label>
            <input
              type="text"
              required
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="e.g. Monthly Strategy & Shoot Planning"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Meeting Date</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Next Meeting Date</label>
              <input
                type="date"
                value={meetingNextDate}
                onChange={(e) => setMeetingNextDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Agenda</label>
            <input
              type="text"
              value={meetingAgenda}
              onChange={(e) => setMeetingAgenda(e.target.value)}
              placeholder="e.g. Review reel drafts, finalize podcast guest list"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Discussion Notes *</label>
            <textarea
              rows={4}
              required
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              placeholder="Key discussion points, decisions made, feedback from client..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Action Items</label>
            <textarea
              rows={2}
              value={meetingActionItems}
              onChange={(e) => setMeetingActionItems(e.target.value)}
              placeholder="1. Re-shoot hook for Reel #3, 2. Deliver revised thumbnail by Thursday..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
          >
            Save Meeting Notes
          </button>
        </form>
      </BottomSheet>

      {/* ============================================================== */}
      {/* MODAL 5: LOG CLIENT FEEDBACK & CHANGE REQUESTS                */}
      {/* ============================================================== */}
      <BottomSheet
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="Log Client Feedback & Change Request"
        subtitle="Record change requests, revision deadlines, and resolution status."
      >
        <form onSubmit={handleSaveFeedback} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold block mb-1">Source / Requested By</label>
            <select
              value={feedbackRequestedBy}
              onChange={(e) => setFeedbackRequestedBy(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none font-semibold"
            >
              <option value="Client">Client</option>
              <option value="Client Manager">Client Manager</option>
              <option value="Internal Review">Internal Creative Review</option>
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1">Feedback Summary *</label>
            <textarea
              rows={3}
              required
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Client's specific feedback or revision points..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Specific Change Requested</label>
            <input
              type="text"
              value={feedbackChangeRequested}
              onChange={(e) => setFeedbackChangeRequested(e.target.value)}
              placeholder="e.g. Change opening caption font, remove background music track"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Resolution Deadline</label>
            <input
              type="date"
              value={feedbackDeadline}
              onChange={(e) => setFeedbackDeadline(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all"
          >
            Create Feedback Ticket
          </button>
        </form>
      </BottomSheet>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: "", name: "" })}
        onConfirm={() => handleDeleteProfile(confirmDelete.id, confirmDelete.name)}
        title="Delete Brand Profile"
        message={`Are you sure you want to delete the personal brand profile for ${confirmDelete.name}? This will remove all associated content pieces, metrics, and meeting logs.`}
        confirmText="Yes, Delete Profile"
        isDestructive={true}
      />
    </div>
  );
}
