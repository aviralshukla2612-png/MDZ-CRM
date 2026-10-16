"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ExternalLink,
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

  return (
    <div className={`w-full bg-white dark:bg-[#12100E] border border-slate-200 dark:border-stone-800 rounded-2xl p-2 shadow-xs ${className}`}>
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-1">
        {CLIENT_MODULES.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.href ||
            pathname === item.href ||
            (item.href !== "/client" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
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
