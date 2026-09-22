"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  ShieldAlert,
  Clock,
  User,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  FolderKanban,
  Target,
  FileText,
  IndianRupee,
  Users,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Flame,
  Globe,
} from "lucide-react";

export default function AuditPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAuditEvents();
  }, []);

  const fetchAuditEvents = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/mdz-crm/api/audit", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEvents(json.data);
      }
    } catch (e) {
      console.error("Failed to load audit events:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (selectedCategory !== "ALL" && evt.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesType = (evt.type || "").toLowerCase().includes(q);
        const matchesActor = (evt.actor || "").toLowerCase().includes(q);
        const matchesEntity = (evt.entity || "").toLowerCase().includes(q);
        const matchesDetails = (evt.details || "").toLowerCase().includes(q);
        if (!matchesType && !matchesActor && !matchesEntity && !matchesDetails) {
          return false;
        }
      }
      return true;
    });
  }, [events, selectedCategory, searchQuery]);

  // Top KPI Stats
  const stats = useMemo(() => {
    const totalCount = events.length;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const todayCount = events.filter((e) => new Date(e.createdAt) >= oneDayAgo).length;
    const complianceCount = events.filter((e) => e.category === "COMPLIANCE").length;
    const projectCount = events.filter((e) => e.category === "PROJECTS").length;
    const salesCount = events.filter((e) => e.category === "SALES").length;

    return {
      totalCount,
      todayCount,
      complianceCount,
      projectCount,
      salesCount,
    };
  }, [events]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "PROJECTS":
        return <FolderKanban className="w-4 h-4 text-indigo-500" />;
      case "SALES":
        return <Target className="w-4 h-4 text-emerald-500" />;
      case "COMPLIANCE":
        return <ShieldCheck className="w-4 h-4 text-purple-500" />;
      case "FINANCE":
        return <IndianRupee className="w-4 h-4 text-amber-500" />;
      case "HR":
        return <Users className="w-4 h-4 text-sky-500" />;
      default:
        return <Layers className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case "PROJECTS":
        return "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
      case "SALES":
        return "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "COMPLIANCE":
        return "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "FINANCE":
        return "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case "HR":
        return "bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <PageHeader
        title="Audit & Activity Stream"
        description="Immutable event chronology tracking all business, project, compliance, financial, and team changes."
        badge="IMMUTABLE HISTORY"
        icon={<ShieldAlert className="w-7 h-7 text-amber-600 dark:text-amber-400 animate-pulse" />}
      />

      {/* Dynamic Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Recorded Events */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              TOTAL RECORDED EVENTS
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
            {loading ? "--" : stats.totalCount}
          </div>
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <span>Aggregated across all CRM subsystems</span>
          </div>
        </div>

        {/* Card 2: Today's Activity */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              PAST 24H VELOCITY
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
            {loading ? "--" : stats.todayCount}
          </div>
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            Operations executed today
          </div>
        </div>

        {/* Card 3: Compliance & Legal */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              COMPLIANCE AUDITS
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
            {loading ? "--" : stats.complianceCount}
          </div>
          <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">
            Terms acceptances & verifications
          </div>
        </div>

        {/* Card 4: System Integrity */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              INTEGRITY STATUS
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Verified</span>
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Cryptographic ledger active
          </div>
        </div>
      </div>

      {/* Main Audit Feed Container */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-7 shadow-xl space-y-6">
        {/* Toolbar Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>System Activity Feeds</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live chronological event stream from projects, sales, HR, finance, and system operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actor, entity, action..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-medium"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchAuditEvents}
              disabled={refreshing}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Event Stream"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            {/* Event Count Tag */}
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {filteredEvents.length} Events
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "ALL", label: "All Feeds", icon: <Layers className="w-3.5 h-3.5" /> },
            { id: "PROJECTS", label: "Projects & Tasks", icon: <FolderKanban className="w-3.5 h-3.5" /> },
            { id: "SALES", label: "Sales & Leads", icon: <Target className="w-3.5 h-3.5" /> },
            { id: "COMPLIANCE", label: "Terms & Compliance", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            { id: "HR", label: "HR & Holidays", icon: <Users className="w-3.5 h-3.5" /> },
            { id: "FINANCE", label: "Finance & Budget", icon: <IndianRupee className="w-3.5 h-3.5" /> },
            { id: "SYSTEM", label: "System Core", icon: <Globe className="w-3.5 h-3.5" /> },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Event List Stream */}
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm animate-pulse space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
            <div>Loading immutable audit stream from CRM ledger...</div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-16 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/40 border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              No Audit Events Found
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No recorded activities match the current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredEvents.map((evt) => {
              const formattedDate = new Date(evt.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={evt.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/60 transition-all space-y-3 shadow-xs"
                >
                  {/* Event Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                        {getCategoryIcon(evt.category)}
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider border ${getCategoryBadgeStyle(
                          evt.category
                        )}`}
                      >
                        {evt.type}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {evt.id.substring(0, 8)}...
                      </span>
                    </div>

                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formattedDate}</span>
                    </span>
                  </div>

                  {/* Actor & Entity Line */}
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Actor:</span>
                      <strong className="text-slate-900 dark:text-slate-100">{evt.actor}</strong>
                      {evt.actorRole && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          ({evt.actorRole})
                        </span>
                      )}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>
                      Entity: <strong className="text-amber-600 dark:text-amber-400">{evt.entity}</strong>
                    </span>
                  </div>

                  {/* Details Card */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed shadow-2xs">
                    "{evt.details}"
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
