"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FolderKanban,
  TableProperties,
  TrendingUp,
  CalendarDays,
  Columns3,
  Swords,
  Sparkles,
  ClipboardCheck,
  FileText,
  FileSignature,
  FileSpreadsheet,
  GitPullRequest,
  Clock,
  ShieldAlert,
  Building2,
  ChevronDown,
} from "lucide-react";

export const CLIENT_MODULES = [
  {
    name: "Overview",
    href: "/client",
    icon: FolderKanban,
    tag: "Core",
  },
  {
    name: "Delivery & Production Log",
    href: "/client/delivery",
    icon: TableProperties,
    tag: "Monthly",
  },
  {
    name: "KPI & Growth Tracker",
    href: "/client/kpi-tracker",
    icon: TrendingUp,
    tag: "Live",
  },
  {
    name: "Campaign Planner",
    href: "/client/campaigns",
    icon: CalendarDays,
    tag: "Strategy",
  },
  {
    name: "Content Pillars",
    href: "/client/content-pillars",
    icon: Columns3,
    tag: "Creative",
  },
  {
    name: "Competitor Analysis",
    href: "/client/competitors",
    icon: Swords,
    tag: "Market",
  },
  {
    name: "Brand Voice & Tone",
    href: "/client/brand-voice",
    icon: Sparkles,
    tag: "Identity",
  },
  {
    name: "Onboarding & Access",
    href: "/client/onboarding",
    icon: ClipboardCheck,
    tag: "Setup",
  },
  {
    name: "Strategic Brief",
    href: "/client/brief",
    icon: FileText,
    tag: "Foundation",
  },
  {
    name: "Scope SLA & Sign-Off",
    href: "/client/scope",
    icon: FileSignature,
    tag: "Contract",
  },
  {
    name: "Meeting Notes",
    href: "/client/meetings",
    icon: FileSpreadsheet,
    tag: "Syncs",
  },
  {
    name: "Change Requests",
    href: "/client/revisions",
    icon: GitPullRequest,
    tag: "Revisions",
  },
  {
    name: "Daily Updates",
    href: "/client/updates",
    icon: Clock,
    tag: "Log",
  },
];

interface Props {
  currentTab?: string;
  className?: string;
}

export function ClientPortalNav({ currentTab, className = "" }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [clients, setClients] = useState<Array<{ id: string; companyName: string }>>([]);
  const [activeClientId, setActiveClientId] = useState<string>("");

  const role = session?.user?.role || "";
  const isAdminOrStaff = ["OWNER", "ADMIN", "SUB_ADMIN", "SALES", "EMPLOYEE"].includes(role);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlClientId = params.get("clientId");
      const storedClientId = localStorage.getItem("mdz_active_client_id");
      if (urlClientId) {
        setActiveClientId(urlClientId);
        localStorage.setItem("mdz_active_client_id", urlClientId);
      } else if (storedClientId) {
        setActiveClientId(storedClientId);
      }
    }
  }, []);

  useEffect(() => {
    if (isAdminOrStaff) {
      async function fetchClients() {
        try {
          const res = await fetch("/mdz-crm/api/clients");
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setClients(json.data);
            if (!activeClientId && json.data.length > 0) {
              const firstId = json.data[0].id;
              setActiveClientId(firstId);
              if (typeof window !== "undefined") {
                localStorage.setItem("mdz_active_client_id", firstId);
              }
            }
          }
        } catch (e) {
          console.error("Failed to load clients in nav", e);
        }
      }
      fetchClients();
    }
  }, [isAdminOrStaff, activeClientId]);

  const handleClientChange = (newId: string) => {
    setActiveClientId(newId);
    if (typeof window !== "undefined") {
      localStorage.setItem("mdz_active_client_id", newId);
      const url = new URL(window.location.href);
      url.searchParams.set("clientId", newId);
      router.push(url.pathname + url.search);
    }
  };

  return (
    <div className={`w-full bg-white dark:bg-[#12100E] border border-slate-200 dark:border-stone-800 rounded-2xl p-2.5 shadow-xs space-y-2 ${className}`}>
      {/* Admin/Sub-Admin Client Brand Selector Bar */}
      {isAdminOrStaff && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 py-1.5 bg-slate-50 dark:bg-stone-900/80 rounded-xl border border-slate-200/60 dark:border-stone-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 border border-amber-500/30">
              <ShieldAlert className="w-3 h-3 text-amber-500" />
              {role === "SUB_ADMIN" ? "SUB ADMIN" : "ADMIN"} WORKSPACE • EDITING MODE
            </span>
            <span className="text-[11px] text-slate-500 dark:text-stone-400 hidden md:inline">
              All 10 modules editable & synced live for selected client
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-500" />
              Select Client Brand:
            </span>
            <div className="relative">
              <select
                value={activeClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="bg-white dark:bg-stone-950 border border-slate-300 dark:border-stone-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-stone-100 outline-none focus:border-indigo-500 shadow-2xs pr-7 cursor-pointer"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
                {clients.length === 0 && (
                  <option value="default-client">MDZ Enterprise Client</option>
                )}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Modules Scrollable Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-1">
        {CLIENT_MODULES.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.href ||
            pathname === item.href ||
            (item.href !== "/client" && pathname.startsWith(item.href));

          const targetHref = activeClientId ? `${item.href}?clientId=${activeClientId}` : item.href;

          return (
            <Link
              key={item.href}
              href={targetHref}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                isActive
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-bold"
                  : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-800/80"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400 dark:text-stone-400"}`} />
              <span>{item.name}</span>
              {item.tag && (
                <span
                  className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-stone-800 text-slate-500 dark:text-stone-400"
                  }`}
                >
                  {item.tag}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

