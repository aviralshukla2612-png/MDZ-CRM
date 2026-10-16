"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Instagram,
  BarChart2,
  PieChart,
  Target,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Save,
  RefreshCw,
  Lightbulb,
  CheckSquare,
  Play,
  Share2,
  Bookmark,
  MessageCircle,
  Heart,
  Eye,
  ExternalLink,
  Check,
  Award,
  Flame,
  Layers,
  ChevronDown,
  Edit3,
  Trash2,
  X,
  Filter,
  Users,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export interface KpiTrackerProps {
  clientId?: string;
  clientName?: string;
  isAdmin?: boolean;
}

export function MillionaireKpiTracker({
  clientId,
  clientName = "Client Brand",
  isAdmin = false,
}: KpiTrackerProps) {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Admin Client Filter State
  const [clientsList, setClientsList] = useState<Array<{ id: string; companyName: string; clientCode?: string }>>([]);
  const [activeClientId, setActiveClientId] = useState<string>(clientId || "");

  // Client Details & Platforms
  const [clientDetails, setClientDetails] = useState({
    clientName: clientName || "Client Brand",
    industry: "Luxury Fashion & D2C Brands",
    reportingPeriod: "Oct 1 - Oct 31, 2026",
    overallGoal: "Increase brand reach, engagement & scale high-intent inbound inquiries",
    platformGoal: "Grow engaged followers by 15% and increase Reel watch-through rate",
    businessGoal: "Generate 50+ qualified sales leads at CPL < ₹350",
    topPerformingTitle: "Reel: 3 Mistakes Killing High-End Brand Conversions",
  });

  const [platforms, setPlatforms] = useState<string[]>([
    "Instagram",
    "Facebook",
    "YouTube",
    "LinkedIn",
  ]);

  // Instagram KPIs (16 rows from user screenshot)
  const [socialKpis, setSocialKpis] = useState<any[]>([
    { id: 1, kpi: "Followers", current: "18,450", previous: "16,200", target: "20,000", growth: "+13.8%", status: "On Track", observations: "Consistent growth from Reels series" },
    { id: 2, kpi: "Follower Growth", current: "+2,250", previous: "+1,400", target: "+2,000", growth: "+60.7%", status: "Above Target", observations: "Viral festive teaser spiked joins" },
    { id: 3, kpi: "Reach", current: "340,000", previous: "380,000", target: "400,000", growth: "-10.5%", status: "Below Target", observations: "Algorithm adjustment mid-month" },
    { id: 4, kpi: "Impressions", current: "520,000", previous: "480,000", target: "500,000", growth: "+8.3%", status: "On Track", observations: "High repeat views on carousels" },
    { id: 5, kpi: "Engagement (Total)", current: "24,800", previous: "19,200", target: "22,000", growth: "+29.2%", status: "Above Target", observations: "Strong community interactions" },
    { id: 6, kpi: "Engagement Rate (%)", current: "4.8%", previous: "4.2%", target: "4.5%", growth: "+0.6%", status: "On Track", observations: "Well above 3.2% industry average" },
    { id: 7, kpi: "Likes", current: "16,200", previous: "17,500", target: "18,000", growth: "-7.4%", status: "Below Target", observations: "Shifted focus towards saves & shares" },
    { id: 8, kpi: "Comments", current: "1,450", previous: "980", target: "1,200", growth: "+47.9%", status: "On Track", observations: "Interactive question stickers helped" },
    { id: 9, kpi: "Shares", current: "2,840", previous: "1,650", target: "2,000", growth: "+72.1%", status: "Above Target", observations: "Relatable industry quotes went viral" },
    { id: 10, kpi: "Saves", current: "4,310", previous: "3,120", target: "3,800", growth: "+38.1%", status: "On Track", observations: "Carousel frameworks saved heavily" },
    { id: 11, kpi: "Profile Visits", current: "14,800", previous: "16,200", target: "18,000", growth: "-8.6%", status: "Below Target", observations: "Need stronger bio CTA hooks in reels" },
    { id: 12, kpi: "Website Clicks", current: "1,850", previous: "1,420", target: "1,600", growth: "+30.3%", status: "On Track", observations: "Link in bio traffic increased" },
    { id: 13, kpi: "Link Clicks", current: "2,120", previous: "1,550", target: "1,800", growth: "+36.8%", status: "Above Target", observations: "Story sticker click-through rate high" },
    { id: 14, kpi: "DMs / Enquiries", current: "194", previous: "142", target: "160", growth: "+36.6%", status: "On Track", observations: "Direct lead conversations initiated" },
    { id: 15, kpi: "Leads", current: "48", previous: "55", target: "60", growth: "-12.7%", status: "Below Target", observations: "Form fills dipped during ad refresh" },
    { id: 16, kpi: "Conversions", current: "14", previous: "9", target: "12", growth: "+55.5%", status: "On Track", observations: "High-ticket sales closed from leads" },
  ]);

  // Content-Level Performance (Top 5 items)
  const [contentPerformance, setContentPerformance] = useState<any[]>([
    { id: 1, title: "Founder Reel #01: The Untold Agency Secret", format: "Reel", reach: "85,400", views: "98,200", likes: "4,210", comments: "310", saves: "1,840", shares: "1,420", engRate: "9.1%", profileVisits: "2,140", follows: "+480", ctaClicks: "142" },
    { id: 2, title: "Carousel: Complete Growth Roadmap 2026", format: "Carousel", reach: "48,200", views: "48,200", likes: "2,450", comments: "184", saves: "2,120", shares: "890", engRate: "11.7%", profileVisits: "1,250", follows: "+260", ctaClicks: "98" },
    { id: 3, title: "Reel #02: Client Result 10x ROI Case Study", format: "Reel", reach: "62,100", views: "71,500", likes: "3,120", comments: "215", saves: "1,240", shares: "950", engRate: "7.8%", profileVisits: "1,840", follows: "+310", ctaClicks: "185" },
    { id: 4, title: "Static: Luxury Branding Rules & Palette", format: "Static Post", reach: "24,800", views: "24,800", likes: "980", comments: "72", saves: "640", shares: "240", engRate: "7.8%", profileVisits: "420", follows: "+65", ctaClicks: "34" },
    { id: 5, title: "Festival Offer Teaser Ad Creative", format: "Ad Creative", reach: "94,500", views: "112,000", likes: "3,840", comments: "142", saves: "890", shares: "780", engRate: "5.9%", profileVisits: "3,450", follows: "+540", ctaClicks: "420" },
  ]);

  // Business KPIs (7 rows from screenshot)
  const [businessKpis, setBusinessKpis] = useState<any[]>([
    { id: 1, kpi: "Leads Generated", current: "48", previous: "38", target: "45", growth: "+26.3%", status: "On Track", observations: "Meta & organic DMs combined" },
    { id: 2, kpi: "Enquiries", current: "194", previous: "142", target: "150", growth: "+36.6%", status: "Above Target", observations: "Strong inbound inquiry flow" },
    { id: 3, kpi: "Sales / Conversions", current: "14", previous: "18", target: "20", growth: "-22.2%", status: "Below Target", observations: "Sales team pipeline follow-ups pending" },
    { id: 4, kpi: "Website Traffic", current: "12,450", previous: "9,800", target: "11,000", growth: "+27.0%", status: "On Track", observations: "Direct visitors from campaign links" },
    { id: 5, kpi: "Revenue (₹)", current: "₹8,45,000", previous: "₹6,20,000", target: "₹7,50,000", growth: "+36.3%", status: "On Track", observations: "Retainer & project contracts billed" },
    { id: 6, kpi: "Cost per Lead (₹)", current: "₹385", previous: "₹310", target: "₹320", growth: "+24.2%", status: "Below Target", observations: "Ad creative fatigue on festive set" },
    { id: 7, kpi: "Conversion Rate (%)", current: "7.2%", previous: "6.4%", target: "6.8%", growth: "+0.8%", status: "On Track", observations: "Landing page conversion stabilized" },
  ]);

  // Monthly Comparison (5 rows from screenshot)
  const [monthlyComparison, setMonthlyComparison] = useState<any[]>([
    { id: 1, kpi: "Followers", current: "18,450", previous: "16,200", change: "+2,250", pctChange: "+13.8%", reason: "Reels virality", action: "Continue 4x weekly reel schedule" },
    { id: 2, kpi: "Reach", current: "340,000", previous: "380,000", change: "-40,000", pctChange: "-10.5%", reason: "Explore placement drop", action: "Test broader audio hooks" },
    { id: 3, kpi: "Engagement Rate", current: "4.8%", previous: "4.2%", change: "+0.6%", pctChange: "+14.3%", reason: "More comments on carousels", action: "Include open-ended debate questions" },
    { id: 4, kpi: "Website Clicks", current: "1,850", previous: "1,420", change: "+430", pctChange: "+30.3%", reason: "Bio link restructuring", action: "Test seasonal offer landing page" },
    { id: 5, kpi: "Leads", current: "48", previous: "55", change: "-7", pctChange: "-12.7%", reason: "Ad creative fatigue", action: "Launch fresh festive ad creative batch" },
  ]);

  // Key Insights & Observations
  const [insights, setInsights] = useState(
    "Visual hook within the first 1.5 seconds increased 3-second retention from 35% to 62%. Carousels continue to generate the highest save rates (4,310 saves). Cost per lead increased slightly from ₹310 to ₹385 due to festive ad competition, which will be mitigated by launching our fresh UGC ad creative set."
  );

  // Action Items / Next Steps (5 rows from screenshot)
  const [actionItems, setActionItems] = useState<any[]>([
    { id: 1, item: "Scale daily posting of high-retention hook reels", owner: "Video Team", deadline: "Oct 22", status: "In Progress" },
    { id: 2, item: "Launch Meta ad creative A/B test with new hooks", owner: "Performance Lead", deadline: "Oct 24", status: "Not Started" },
    { id: 3, item: "Refresh client testimonial highlight reel", owner: "Creative Lead", deadline: "Oct 18", status: "Completed" },
    { id: 4, item: "Implement WhatsApp lead automation bot", owner: "Tech Team", deadline: "Oct 28", status: "Pending" },
    { id: 5, item: "Conduct quarterly brand voice audit & review", owner: "Strategy Head", deadline: "Oct 30", status: "Not Started" },
  ]);

  // Fetch from backend
  const fetchKpiData = async (targetId?: string) => {
    try {
      setLoading(true);
      const effectiveId = targetId !== undefined ? targetId : (activeClientId || clientId);
      const url = effectiveId
        ? `/mdz-crm/api/clients/${effectiveId}/portal-data`
        : `/mdz-crm/api/client/portal-data`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data?.kpiTracker) {
        const k = json.data.kpiTracker;
        if (k.clientDetails) {
          setClientDetails(k.clientDetails);
        } else if (json.clientName) {
          setClientDetails((prev) => ({ ...prev, clientName: json.clientName }));
        }
        if (k.platforms) setPlatforms(k.platforms);
        if (k.socialKpis) setSocialKpis(k.socialKpis);
        if (k.contentPerformance) setContentPerformance(k.contentPerformance);
        if (k.businessKpis) setBusinessKpis(k.businessKpis);
        if (k.monthlyComparison) setMonthlyComparison(k.monthlyComparison);
        if (k.insights) setInsights(k.insights);
        if (k.actionItems) setActionItems(k.actionItems);
      } else if (json.success && json.clientName) {
        setClientDetails((prev) => ({ ...prev, clientName: json.clientName }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Load clients for Admin Filter
  useEffect(() => {
    if (isAdmin) {
      async function loadClients() {
        try {
          const res = await fetch("/mdz-crm/api/clients");
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setClientsList(json.data);
            if (!activeClientId && !clientId) {
              const first = json.data[0];
              setActiveClientId(first.id);
              setClientDetails((prev) => ({ ...prev, clientName: first.companyName }));
              fetchKpiData(first.id);
            }
          }
        } catch (e) {
          console.error("Error loading clients for filter:", e);
        }
      }
      loadClients();
    }
  }, [isAdmin]);

  // Sync if prop clientId changes
  useEffect(() => {
    if (clientId) {
      setActiveClientId(clientId);
      fetchKpiData(clientId);
    } else if (!isAdmin) {
      fetchKpiData();
    }
  }, [clientId]);

  // Switch client handler for Admin
  const handleSwitchClient = (newId: string) => {
    setActiveClientId(newId);
    const chosen = clientsList.find((c) => c.id === newId);
    if (chosen) {
      setClientDetails((prev) => ({ ...prev, clientName: chosen.companyName }));
    }
    fetchKpiData(newId);
    showToast(`Switched view to ${chosen?.companyName || "client"}`, "info");
  };

  // Save to backend
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const payload = {
        clientDetails,
        platforms,
        socialKpis,
        contentPerformance,
        businessKpis,
        monthlyComparison,
        insights,
        actionItems,
      };

      const effectiveId = activeClientId || clientId;
      const url = effectiveId
        ? `/mdz-crm/api/clients/${effectiveId}/portal-data`
        : `/mdz-crm/api/client/portal-data`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "kpiTracker",
          sectionData: payload,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("✓ KPI Tracker saved and synchronized live!", "success");
      } else {
        showToast(json.error || "Failed to save KPIs", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Network error saving KPIs", "error");
    } finally {
      setSaving(false);
    }
  };

  // Edit Modal State
  const [editingKpi, setEditingKpi] = useState<{
    type: "social" | "business" | "content" | "monthly" | "action";
    data: any;
  } | null>(null);

  const handleOpenEditKpi = (
    type: "social" | "business" | "content" | "monthly" | "action",
    item: any
  ) => {
    setEditingKpi({
      type,
      data: { ...item },
    });
  };

  const handleSaveEditModal = () => {
    if (!editingKpi) return;
    const { type, data } = editingKpi;
    if (type === "social") {
      setSocialKpis((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      showToast("✓ Updated Social KPI metric", "success");
    } else if (type === "business") {
      setBusinessKpis((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      showToast("✓ Updated Business KPI metric", "success");
    } else if (type === "content") {
      setContentPerformance((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      showToast("✓ Updated Content Performance piece", "success");
    } else if (type === "monthly") {
      setMonthlyComparison((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      showToast("✓ Updated Monthly Comparison metric", "success");
    } else if (type === "action") {
      setActionItems((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      showToast("✓ Updated Action Item", "success");
    }
    setEditingKpi(null);
  };

  const handleAddMonthlyComparison = () => {
    const newId = monthlyComparison.length > 0 ? Math.max(...monthlyComparison.map((x) => x.id)) + 1 : 1;
    setMonthlyComparison([
      ...monthlyComparison,
      {
        id: newId,
        kpi: "New Metric",
        current: "0",
        previous: "0",
        change: "+0",
        pctChange: "+0%",
        reason: "Performance assessment",
        action: "Execute strategy",
      },
    ]);
    showToast("✓ Added new Monthly Comparison row", "success");
  };

  const handleDeleteMonthlyComparison = (id: number) => {
    setMonthlyComparison(monthlyComparison.filter((x) => x.id !== id));
    showToast("Removed monthly comparison metric", "info");
  };

  // Add & Delete Social KPI
  const handleAddSocialKpi = () => {
    const newId = socialKpis.length > 0 ? Math.max(...socialKpis.map((x) => x.id)) + 1 : 1;
    setSocialKpis([
      ...socialKpis,
      {
        id: newId,
        kpi: "New KPI Metric",
        current: "0",
        previous: "0",
        target: "100",
        growth: "+0%",
        status: "On Track",
        observations: "Tracking initialized",
      },
    ]);
    showToast("✓ Added new Social KPI metric row", "success");
  };

  const handleDeleteSocialKpi = (id: number) => {
    setSocialKpis(socialKpis.filter((x) => x.id !== id));
    showToast("Removed KPI metric", "info");
  };

  // Add & Delete Content Performance
  const handleAddContentPerformance = () => {
    const newId = contentPerformance.length > 0 ? Math.max(...contentPerformance.map((x) => x.id)) + 1 : 1;
    setContentPerformance([
      ...contentPerformance,
      {
        id: newId,
        title: "New Creative / Reel",
        format: "Reel",
        reach: "10,000",
        views: "12,500",
        likes: "500",
        comments: "45",
        saves: "120",
        shares: "85",
        engRate: "6.2%",
        profileVisits: "250",
        follows: "+40",
        ctaClicks: "25",
      },
    ]);
    showToast("✓ Added new Content Performance piece", "success");
  };

  const handleDeleteContentPerformance = (id: number) => {
    setContentPerformance(contentPerformance.filter((x) => x.id !== id));
    showToast("Removed content performance piece", "info");
  };

  // Add & Delete Business KPI
  const handleAddBusinessKpi = () => {
    const newId = businessKpis.length > 0 ? Math.max(...businessKpis.map((x) => x.id)) + 1 : 1;
    setBusinessKpis([
      ...businessKpis,
      {
        id: newId,
        kpi: "New Business KPI",
        current: "0",
        previous: "0",
        target: "50",
        growth: "+0%",
        status: "On Track",
        observations: "Target initialized",
      },
    ]);
    showToast("✓ Added new Business KPI row", "success");
  };

  const handleDeleteBusinessKpi = (id: number) => {
    setBusinessKpis(businessKpis.filter((x) => x.id !== id));
    showToast("Removed business KPI", "info");
  };

  // Add & Delete Action Item
  const handleAddActionItem = () => {
    const newId = actionItems.length > 0 ? Math.max(...actionItems.map((x) => x.id)) + 1 : 1;
    setActionItems([
      ...actionItems,
      {
        id: newId,
        item: "New Priority Action Step",
        owner: "Team Lead",
        deadline: "Nov 01",
        status: "In Progress",
      },
    ]);
    showToast("✓ Added new Action Item", "success");
  };

  const handleDeleteActionItem = (id: number) => {
    setActionItems(actionItems.filter((x) => x.id !== id));
    showToast("Removed action item", "info");
  };

  // Performance summary counts
  const totalKpisCount = socialKpis.length + businessKpis.length;
  const onTrackCount = [...socialKpis, ...businessKpis].filter((x) => x.status === "On Track").length;
  const aboveTargetCount = [...socialKpis, ...businessKpis].filter((x) => x.status === "Above Target").length;
  const belowTargetCount = [...socialKpis, ...businessKpis].filter((x) => x.status === "Below Target").length;
  const achievementRate = Math.round(((onTrackCount + aboveTargetCount) / Math.max(1, totalKpisCount)) * 100);

  // Status Badge Component
  const renderStatusBadge = (status: string, onSelect?: (newStatus: string) => void) => {
    const isInteractive = Boolean(onSelect);

    const config = {
      "Above Target": {
        bg: "bg-sky-50 dark:bg-sky-950/60",
        text: "text-sky-700 dark:text-sky-300",
        border: "border-sky-200/90 dark:border-sky-800",
        dot: "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]",
      },
      "Below Target": {
        bg: "bg-rose-50 dark:bg-rose-950/60",
        text: "text-rose-700 dark:text-rose-300",
        border: "border-rose-200/90 dark:border-rose-800",
        dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]",
      },
      "On Track": {
        bg: "bg-emerald-50 dark:bg-emerald-950/60",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200/90 dark:border-emerald-800",
        dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
      },
    }[status] || {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      dot: "bg-slate-400",
    };

    if (!isInteractive) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.bg} ${config.text} ${config.border} shadow-2xs`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          <span>{status}</span>
        </span>
      );
    }

    return (
      <div className="relative inline-block group">
        <select
          value={status}
          onChange={(e) => onSelect && onSelect(e.target.value)}
          aria-label="Performance Status"
          className={`appearance-none cursor-pointer pl-6 pr-6 py-1 rounded-full text-[11px] font-bold border transition-all ${config.bg} ${config.text} ${config.border} hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
        >
          <option value="On Track">On Track</option>
          <option value="Above Target">Above Target</option>
          <option value="Below Target">Below Target</option>
        </select>
        <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${config.dot} pointer-events-none`} />
        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
      </div>
    );
  };

  const getActionStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"><Check className="w-3 h-3" /> Completed</span>;
      case "In Progress":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"><Clock className="w-3 h-3" /> In Progress</span>;
      case "Pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"><AlertCircle className="w-3 h-3" /> Pending</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">Not Started</span>;
    }
  };

  const availablePlatforms = [
    { name: "Instagram", color: "hover:border-pink-400 active:bg-pink-50" },
    { name: "Facebook", color: "hover:border-blue-500 active:bg-blue-50" },
    { name: "YouTube", color: "hover:border-red-500 active:bg-red-50" },
    { name: "LinkedIn", color: "hover:border-sky-600 active:bg-sky-50" },
    { name: "TikTok", color: "hover:border-slate-800 active:bg-slate-50" },
    { name: "Pinterest", color: "hover:border-rose-600 active:bg-rose-50" },
    { name: "X (Twitter)", color: "hover:border-slate-900 active:bg-slate-50" },
  ];

  return (
    <div className="bg-gradient-to-b from-[#FAFBFD] via-white to-[#F4F6FB] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-9 shadow-2xl shadow-slate-200/40 dark:shadow-none space-y-7 font-sans text-slate-900 dark:text-slate-100">
      
      {/* 0. ADMIN CLIENT SELECTOR FILTER BAR */}
      {isAdmin && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-indigo-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border border-emerald-300/80 dark:border-emerald-800/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Admin Master Control
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  {clientsList.length > 0 ? `${clientsList.length} Active Clients` : "Master Account"}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Client Filter: Select any client to view &amp; customize their live KPI Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select Client:</span>
            </label>
            <select
              value={activeClientId}
              onChange={(e) => handleSwitchClient(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-emerald-500/50 text-xs font-black text-slate-900 dark:text-slate-100 shadow-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer min-w-[240px]"
            >
              {clientsList.length === 0 && (
                <option value="">{clientName || "Client Account"}</option>
              )}
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} {c.clientCode ? `(${c.clientCode})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 1. ULTRA-PREMIUM HEADER BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono font-black tracking-widest uppercase px-2.5 py-1 rounded-md bg-emerald-600/10 text-emerald-800 dark:text-emerald-400 border border-emerald-600/20">
              EXECUTIVE GROWTH ENGINE
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              • Oct 2026 Reporting
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#143E19] dark:text-emerald-400">
            KPI TRACKER
          </h1>
          <p className="text-xs font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
            TRACK &nbsp;•&nbsp; ANALYZE &nbsp;•&nbsp; IMPROVE &nbsp;•&nbsp; GROW
          </p>
        </div>

        {/* Purpose Card + Save Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="p-3.5 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl flex items-start gap-3 max-w-md shadow-xs backdrop-blur-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="font-extrabold text-xs text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                Purpose
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 leading-snug">
                Monitor performance indicators against targets, analyze trajectory trends, and accelerate revenue conversion.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 shrink-0">
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddActionItem}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-900/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Data</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#173F1C] to-[#0E2812] hover:from-[#1E5224] hover:to-[#173F1C] text-white font-extrabold text-xs shadow-lg shadow-emerald-950/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-emerald-700/40"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{saving ? "Syncing..." : "Save KPIs"}</span>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => fetchKpiData()}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-emerald-600" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP STATS PULSE ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Total KPIs</span>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">{totalKpisCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-600">On Track</span>
            <div className="text-2xl font-black font-mono text-emerald-600">{onTrackCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase text-sky-600">Above Target</span>
            <div className="text-2xl font-black font-mono text-sky-600">{aboveTargetCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Achievement</span>
            <div className="text-2xl font-black font-mono text-emerald-600">{achievementRate}%</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-mono font-black text-xs">
            🎯
          </div>
        </div>
      </div>

      {/* 2. SECTION 1 & 2 DUAL EXECUTIVE CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Section 1: Client & Reporting Details */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="w-7 h-7 rounded-lg bg-[#143E19] text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
              1
            </span>
            <Building className="w-4 h-4 text-[#143E19]" />
            <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100">
              Client &amp; Reporting Details
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="sm:w-36 font-bold text-slate-500 dark:text-slate-400">Client / Brand Name:</label>
              {isAdmin ? (
                <input
                  type="text"
                  value={clientDetails.clientName}
                  onChange={(e) => setClientDetails({ ...clientDetails, clientName: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
              ) : (
                <div className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  {clientDetails.clientName}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="sm:w-36 font-bold text-slate-500 dark:text-slate-400">Industry / Niche:</label>
              {isAdmin ? (
                <input
                  type="text"
                  value={clientDetails.industry}
                  onChange={(e) => setClientDetails({ ...clientDetails, industry: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
              ) : (
                <div className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 font-semibold text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  {clientDetails.industry}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="sm:w-36 font-bold text-slate-500 dark:text-slate-400">Reporting Period:</label>
              {isAdmin ? (
                <input
                  type="text"
                  value={clientDetails.reportingPeriod}
                  onChange={(e) => setClientDetails({ ...clientDetails, reportingPeriod: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
              ) : (
                <div className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 font-semibold text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                  {clientDetails.reportingPeriod}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="sm:w-36 font-bold text-slate-500 dark:text-slate-400">Overall Goal:</label>
              {isAdmin ? (
                <input
                  type="text"
                  value={clientDetails.overallGoal}
                  onChange={(e) => setClientDetails({ ...clientDetails, overallGoal: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
              ) : (
                <div className="flex-1 px-3.5 py-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 font-semibold text-emerald-950 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                  {clientDetails.overallGoal}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Platforms & Specific KPIs (Elevated Pill Tags) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="w-7 h-7 rounded-lg bg-[#DC2626] text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
              2
            </span>
            <Target className="w-4 h-4 text-[#DC2626]" />
            <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100">
              Platforms &amp; Specific KPIs
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="block font-bold text-slate-500 dark:text-slate-400 mb-2">
                Active Target Platforms:
              </span>
              <div className="flex flex-wrap gap-2">
                {availablePlatforms.map((p) => {
                  const isSelected = platforms.includes(p.name);
                  if (!isAdmin && !isSelected) return null;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => {
                        if (!isAdmin) return;
                        if (isSelected) setPlatforms(platforms.filter((x) => x !== p.name));
                        else setPlatforms([...platforms, p.name]);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                        isAdmin ? "cursor-pointer" : "cursor-default opacity-90"
                      } ${
                        isSelected
                          ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs scale-102"
                          : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-emerald-400" : "bg-slate-300"}`} />
                      <span>{p.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-1">
              <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Specific Goals for this period:
              </label>
              {isAdmin ? (
                <textarea
                  rows={2}
                  value={clientDetails.platformGoal}
                  onChange={(e) => setClientDetails({ ...clientDetails, platformGoal: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
                />
              ) : (
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100 text-xs leading-relaxed">
                  {clientDetails.platformGoal}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. INSTAGRAM KPIS OVERVIEW TABLE (16 Rows) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Table Banner */}
        <div className="bg-gradient-to-r from-purple-100/90 via-indigo-50/80 to-purple-50/60 dark:from-purple-950/60 dark:to-indigo-950/40 px-5 py-3 border-b border-purple-200/80 dark:border-purple-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Instagram className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100">
                Instagram KPIs Overview
              </h3>
              <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300">16 Core Engagement &amp; Growth Metrics</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-300 text-[11px]">Platform Goal:</span>
            {isAdmin ? (
              <input
                type="text"
                value={clientDetails.platformGoal}
                onChange={(e) => setClientDetails({ ...clientDetails, platformGoal: e.target.value })}
                className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-xs font-semibold text-slate-800 dark:text-slate-200 w-56 shadow-2xs focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            ) : (
              <span className="px-3 py-1 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 text-xs font-bold text-purple-900 dark:text-purple-200 border border-purple-200/60 dark:border-purple-800/60 shadow-2xs">
                {clientDetails.platformGoal}
              </span>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={handleAddSocialKpi}
                className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Metric</span>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider">
                <th className="py-2.5 px-3 text-center w-10">#</th>
                <th className="py-2.5 px-3">KPI Metric</th>
                <th className="py-2.5 px-3 text-center">Current Period (Oct 2026)</th>
                <th className="py-2.5 px-3 text-center">Previous Period (Sep 2026)</th>
                <th className="py-2.5 px-3 text-center">Target (Oct 2026)</th>
                <th className="py-2.5 px-3 text-center">Growth (%)</th>
                <th className="py-2.5 px-3 text-center">Performance Status</th>
                <th className="py-2.5 px-3">Key Observations</th>
                {isAdmin && <th className="py-2.5 px-2 text-center w-20">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
              {socialKpis.map((row, idx) => (
                <tr key={row.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-colors">
                  <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">{row.id}</td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{row.kpi}</td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                    {isAdmin ? (
                      <input
                        type="text"
                        value={row.current}
                        onChange={(e) => {
                          const copy = [...socialKpis];
                          copy[idx].current = e.target.value;
                          setSocialKpis(copy);
                        }}
                        className="w-24 text-center font-mono font-bold bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-md py-0.5 outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    ) : (
                      <span>{row.current}</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-400 font-medium">{row.previous}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-700 dark:text-slate-300 font-bold">{row.target}</td>
                  <td className="py-2 px-3 text-center font-mono font-bold">
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      row.growth.startsWith("+")
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60"
                        : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60"
                    }`}>
                      {row.growth.startsWith("+") ? "↑" : "↓"} {row.growth}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    {renderStatusBadge(
                      row.status,
                      isAdmin
                        ? (newStatus) => {
                            const copy = [...socialKpis];
                            copy[idx].status = newStatus;
                            setSocialKpis(copy);
                          }
                        : undefined
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                    {isAdmin ? (
                      <input
                        type="text"
                        value={row.observations}
                        onChange={(e) => {
                          const copy = [...socialKpis];
                          copy[idx].observations = e.target.value;
                          setSocialKpis(copy);
                        }}
                        className="w-full bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-md px-2 py-0.5 outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    ) : (
                      <span>{row.observations}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditKpi("social", row)}
                          title="Edit KPI Metric"
                          className="p-1.5 rounded-lg text-purple-600 hover:text-purple-800 hover:bg-purple-100/70 dark:hover:bg-purple-950/60 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSocialKpi(row.id)}
                          title="Delete KPI Metric"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CONTENT-LEVEL PERFORMANCE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-amber-100/90 via-yellow-50/80 to-amber-50/60 dark:from-amber-950/60 dark:to-yellow-950/40 px-5 py-3 border-b border-amber-200/80 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Play className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100">
                Content-Level Performance
              </h3>
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">Top 5 Content Pieces by Engagement</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-300 text-[11px]">Top Performing Content:</span>
            {isAdmin ? (
              <input
                type="text"
                value={clientDetails.topPerformingTitle}
                onChange={(e) => setClientDetails({ ...clientDetails, topPerformingTitle: e.target.value })}
                className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-slate-800 dark:text-slate-200 w-64 shadow-2xs focus:ring-2 focus:ring-amber-500/20 outline-none"
              />
            ) : (
              <span className="px-3 py-1 rounded-xl bg-white/90 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border border-amber-200/60 dark:border-amber-800/60 shadow-2xs">
                {clientDetails.topPerformingTitle}
              </span>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={handleAddContentPerformance}
                className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Content</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider">
                <th className="py-2.5 px-2 text-center w-8">#</th>
                <th className="py-2.5 px-3">Content / URL</th>
                <th className="py-2.5 px-3">Content Type</th>
                <th className="py-2.5 px-2 text-center">Reach</th>
                <th className="py-2.5 px-2 text-center">Views / Plays</th>
                <th className="py-2.5 px-2 text-center">Likes</th>
                <th className="py-2.5 px-2 text-center">Comments</th>
                <th className="py-2.5 px-2 text-center">Saves</th>
                <th className="py-2.5 px-2 text-center">Shares</th>
                <th className="py-2.5 px-2 text-center">Eng. Rate (%)</th>
                <th className="py-2.5 px-2 text-center">Profile Visits</th>
                <th className="py-2.5 px-2 text-center">Follows</th>
                <th className="py-2.5 px-2 text-center">CTA Clicks</th>
                {isAdmin && <th className="py-2.5 px-2 text-center w-20">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
              {contentPerformance.map((row) => (
                <tr key={row.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20">
                  <td className="py-2.5 px-2 text-center text-slate-400 font-bold">{row.id}</td>
                  <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{row.title}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {row.format}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400 font-medium">{row.reach}</td>
                  <td className="py-2.5 px-2 text-center font-black text-slate-900 dark:text-slate-100">{row.views}</td>
                  <td className="py-2.5 px-2 text-center text-slate-600">{row.likes}</td>
                  <td className="py-2.5 px-2 text-center text-slate-600">{row.comments}</td>
                  <td className="py-2.5 px-2 text-center text-emerald-600 font-black">{row.saves}</td>
                  <td className="py-2.5 px-2 text-center text-indigo-600 font-black">{row.shares}</td>
                  <td className="py-2.5 px-2 text-center font-black text-slate-900 dark:text-slate-100 bg-amber-50/50 dark:bg-amber-950/30 rounded">{row.engRate}</td>
                  <td className="py-2.5 px-2 text-center text-slate-600">{row.profileVisits}</td>
                  <td className="py-2.5 px-2 text-center text-emerald-600 font-black">{row.follows}</td>
                  <td className="py-2.5 px-2 text-center font-black text-indigo-600">{row.ctaClicks}</td>
                  {isAdmin && (
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditKpi("content", row)}
                          title="Edit Content Piece"
                          className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-100/70 dark:hover:bg-amber-950/60 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteContentPerformance(row.id)}
                          title="Delete Content Piece"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. BUSINESS KPIS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-blue-100/90 via-sky-50/80 to-blue-50/60 dark:from-blue-950/60 dark:to-sky-950/40 px-5 py-3 border-b border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100">
                Business KPIs
              </h3>
              <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">Revenue, Leads &amp; ROI Performance</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-300 text-[11px]">Business Goal:</span>
            {isAdmin ? (
              <input
                type="text"
                value={clientDetails.businessGoal}
                onChange={(e) => setClientDetails({ ...clientDetails, businessGoal: e.target.value })}
                className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-slate-800 dark:text-slate-200 w-56 shadow-2xs focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            ) : (
              <span className="px-3 py-1 rounded-xl bg-white/90 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
                {clientDetails.businessGoal}
              </span>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={handleAddBusinessKpi}
                className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add KPI</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider">
                <th className="py-2.5 px-3 text-center w-10">#</th>
                <th className="py-2.5 px-3">Business Metric</th>
                <th className="py-2.5 px-3 text-center">Current Period (Oct 2026)</th>
                <th className="py-2.5 px-3 text-center">Previous Period (Sep 2026)</th>
                <th className="py-2.5 px-3 text-center">Target (Oct 2026)</th>
                <th className="py-2.5 px-3 text-center">Growth (%)</th>
                <th className="py-2.5 px-3 text-center">Performance Status</th>
                <th className="py-2.5 px-3">Key Observations</th>
                {isAdmin && <th className="py-2.5 px-2 text-center w-20">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
              {businessKpis.map((row, idx) => (
                <tr key={row.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors">
                  <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">{row.id}</td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{row.kpi}</td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                    {isAdmin ? (
                      <input
                        type="text"
                        value={row.current}
                        onChange={(e) => {
                          const copy = [...businessKpis];
                          copy[idx].current = e.target.value;
                          setBusinessKpis(copy);
                        }}
                        className="w-24 text-center font-mono font-bold bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-md py-0.5 outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span>{row.current}</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-400 font-medium">{row.previous}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-700 dark:text-slate-300 font-bold">{row.target}</td>
                  <td className="py-2 px-3 text-center font-mono font-bold">
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      row.growth.startsWith("+")
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60"
                        : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60"
                    }`}>
                      {row.growth.startsWith("+") ? "↑" : "↓"} {row.growth}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    {renderStatusBadge(
                      row.status,
                      isAdmin
                        ? (newStatus) => {
                            const copy = [...businessKpis];
                            copy[idx].status = newStatus;
                            setBusinessKpis(copy);
                          }
                        : undefined
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                    {isAdmin ? (
                      <input
                        type="text"
                        value={row.observations}
                        onChange={(e) => {
                          const copy = [...businessKpis];
                          copy[idx].observations = e.target.value;
                          setBusinessKpis(copy);
                        }}
                        className="w-full bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-md px-2 py-0.5 outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span>{row.observations}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditKpi("business", row)}
                          title="Edit Business KPI"
                          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-100/70 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBusinessKpi(row.id)}
                          title="Delete Business KPI"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MONTHLY COMPARISON */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-rose-100/90 via-pink-50/80 to-rose-50/60 dark:from-rose-950/60 dark:to-pink-950/40 px-5 py-3 border-b border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100">
                Monthly Comparison (MoM Analysis)
              </h3>
              <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">Month-over-Month Delta &amp; Root Cause Analysis</span>
            </div>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={handleAddMonthlyComparison}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Metric</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider">
                <th className="py-2.5 px-3 text-center w-10">#</th>
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3 text-center">Current Month (Oct 2026)</th>
                <th className="py-2.5 px-3 text-center">Previous Month (Sep 2026)</th>
                <th className="py-2.5 px-3 text-center">Change (+/-)</th>
                <th className="py-2.5 px-3 text-center">% Change</th>
                <th className="py-2.5 px-3">Reason for Change</th>
                <th className="py-2.5 px-3">Action / Next Step</th>
                {isAdmin && <th className="py-2.5 px-2 text-center w-20">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {monthlyComparison.map((row) => (
                <tr key={row.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-colors">
                  <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">{row.id}</td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">{row.kpi}</td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 dark:text-slate-100">{row.current}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-400">{row.previous}</td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">{row.change}</td>
                  <td className="py-2 px-3 text-center font-mono font-bold">
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      row.pctChange.startsWith("+")
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : "bg-rose-50 text-rose-700 border border-rose-200/60"
                    }`}>
                      {row.pctChange}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{row.reason}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{row.action}</td>
                  {isAdmin && (
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditKpi("monthly", row)}
                          title="Edit Monthly Comparison"
                          className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-100/70 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMonthlyComparison(row.id)}
                          title="Delete Metric"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. BOTTOM 3-CARD COMMAND GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Column 1: Key Insights & Observations */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100">
                Key Insights &amp; Observations
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">Strategic Agency Takeaways</span>
            </div>
          </div>

          {isAdmin ? (
            <textarea
              rows={7}
              value={insights}
              onChange={(e) => setInsights(e.target.value)}
              placeholder="Write key takeaways, trends, and important observations here..."
              className="w-full flex-1 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-xs leading-relaxed resize-none font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
            />
          ) : (
            <div className="w-full flex-1 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-xs leading-relaxed font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
              {insights}
            </div>
          )}
        </div>

        {/* Column 2: Action Items / Next Steps */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100">
                  Action Items / Next Steps
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">Priority Deliverables &amp; Owners</span>
              </div>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={handleAddActionItem}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Item</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800 text-slate-400 uppercase font-black text-[9px] border-b border-slate-200/80">
                  <th className="py-2 px-1 text-center w-6">#</th>
                  <th className="py-2 px-2">Action Item</th>
                  <th className="py-2 px-2">Owner</th>
                  <th className="py-2 px-2">Deadline</th>
                  <th className="py-2 px-2 text-center">Status</th>
                  {isAdmin && <th className="py-2 px-1 text-center w-16">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {actionItems.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-1 text-center font-mono text-slate-400 font-bold">{a.id}</td>
                    <td className="py-2 px-2 font-bold text-slate-800 dark:text-slate-200">{a.item}</td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[10px]">
                        {a.owner}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-500 whitespace-nowrap text-[10px] font-bold">{a.deadline}</td>
                    <td className="py-2 px-2 text-center">{getActionStatusBadge(a.status)}</td>
                    {isAdmin && (
                      <td className="py-2 px-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditKpi("action", a)}
                            title="Edit Action Item"
                            className="p-1 rounded-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteActionItem(a.id)}
                            title="Delete Action Item"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 3: Overall Performance Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100">
                Overall Performance Summary
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">Consolidated Goal Achievement</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
            {/* Radial / Donut Ring */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 filter drop-shadow-sm" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                  strokeDasharray={`${achievementRate}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                  {achievementRate}%
                </span>
                <span className="text-[8px] uppercase font-black tracking-widest text-slate-400">
                  ACHIEVED
                </span>
              </div>
            </div>

            {/* Performance Legend */}
            <div className="space-y-2 text-xs font-mono w-full sm:w-auto">
              <div className="flex items-center justify-between gap-4 p-1.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="font-sans font-semibold text-xs">Total KPIs</span>
                </span>
                <strong className="text-slate-900 dark:text-slate-100">{totalKpisCount}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 p-1.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30">
                <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                  <span className="font-sans font-semibold text-xs">On Track</span>
                </span>
                <strong className="text-emerald-600">{onTrackCount}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 p-1.5 rounded-lg bg-sky-50/50 dark:bg-sky-950/30">
                <span className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.7)]" />
                  <span className="font-sans font-semibold text-xs">Above Target</span>
                </span>
                <strong className="text-sky-600">{aboveTargetCount}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 p-1.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/30">
                <span className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]" />
                  <span className="font-sans font-semibold text-xs">Below Target</span>
                </span>
                <strong className="text-rose-600">{belowTargetCount}</strong>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 8. EDIT KPI MODAL (ADMIN ONLY) */}
      {isAdmin && editingKpi && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Edit {
                      editingKpi.type === "social" ? "KPI Metric" :
                      editingKpi.type === "business" ? "Business KPI" :
                      editingKpi.type === "content" ? "Content Performance" :
                      editingKpi.type === "monthly" ? "Monthly Comparison" : "Action Item"
                    }
                  </h3>
                  <p className="text-xs text-slate-500">Update metric details, numbers, status and observations</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingKpi(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* For social & business KPIs */}
              {(editingKpi.type === "social" || editingKpi.type === "business") && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Metric Name
                    </label>
                    <input
                      type="text"
                      value={editingKpi.data.kpi || ""}
                      onChange={(e) =>
                        setEditingKpi({
                          ...editingKpi,
                          data: { ...editingKpi.data, kpi: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Current Period
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.current || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, current: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Previous Period
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.previous || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, previous: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Target Value
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.target || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, target: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Growth (%)
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.growth || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, growth: e.target.value },
                          })
                        }
                        placeholder="+15.2%"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Performance Status
                      </label>
                      <select
                        value={editingKpi.data.status || "On Track"}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, status: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                      >
                        <option value="On Track">On Track</option>
                        <option value="Above Target">Above Target</option>
                        <option value="Below Target">Below Target</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Key Observations
                    </label>
                    <textarea
                      rows={3}
                      value={editingKpi.data.observations || ""}
                      onChange={(e) =>
                        setEditingKpi({
                          ...editingKpi,
                          data: { ...editingKpi.data, observations: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                  </div>
                </>
              )}

              {/* For content performance */}
              {editingKpi.type === "content" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Content Title / URL
                    </label>
                    <input
                      type="text"
                      value={editingKpi.data.title || ""}
                      onChange={(e) =>
                        setEditingKpi({
                          ...editingKpi,
                          data: { ...editingKpi.data, title: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Format
                      </label>
                      <select
                        value={editingKpi.data.format || "Reel"}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, format: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                      >
                        <option value="Reel">Reel</option>
                        <option value="Carousel">Carousel</option>
                        <option value="Static Post">Static Post</option>
                        <option value="Story">Story</option>
                        <option value="Ad Creative">Ad Creative</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Reach
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.reach || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, reach: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Views / Plays
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.views || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, views: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Likes
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.likes || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, likes: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Comments
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.comments || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, comments: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Saves
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.saves || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, saves: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Shares
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.shares || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, shares: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Engagement Rate
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.engRate || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, engRate: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Follows
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.follows || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, follows: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        CTA Clicks
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.ctaClicks || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, ctaClicks: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* For monthly comparison */}
              {editingKpi.type === "monthly" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Metric Name
                    </label>
                    <input
                      type="text"
                      value={editingKpi.data.kpi || ""}
                      onChange={(e) =>
                        setEditingKpi({
                          ...editingKpi,
                          data: { ...editingKpi.data, kpi: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Current Month
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.current || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, current: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Previous Month
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.previous || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, previous: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Change (+/-)
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.change || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, change: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        % Change
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.pctChange || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, pctChange: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Reason for Change
                    </label>
                    <input
                      type="text"
                      value={editingKpi.data.reason || ""}
                      onChange={(e) =>
                        setEditingKpi({
                          ...editingKpi,
                          data: { ...editingKpi.data, reason: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Action / Next Step
                    </label>
                    <input
                      type="text"
                      value={editingKpi.data.action || ""}
                      onChange={(e) =>
                        setEditingKpi({
                          ...editingKpi,
                          data: { ...editingKpi.data, action: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </>
              )}

              {/* For action items */}
              {editingKpi.type === "action" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Action Item
                    </label>
                    <input
                      type="text"
                      value={editingKpi.data.item || ""}
                      onChange={(e) =>
                        setEditingKpi({
                          ...editingKpi,
                          data: { ...editingKpi.data, item: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Owner
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.owner || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, owner: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Deadline
                      </label>
                      <input
                        type="text"
                        value={editingKpi.data.deadline || ""}
                        onChange={(e) =>
                          setEditingKpi({
                            ...editingKpi,
                            data: { ...editingKpi.data, deadline: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={editingKpi.data.status || "In Progress"}
                      onChange={(e) =>
                        setEditingKpi({
                          ...editingKpi,
                          data: { ...editingKpi.data, status: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingKpi(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditModal}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
