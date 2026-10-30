"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export function PageHeader({ title, description, badge, actions, icon }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-200/80 dark:border-slate-800/80 mb-4 sm:mb-6 w-full min-w-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <div className="text-indigo-600 dark:text-indigo-400 shrink-0">{icon}</div>}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
              {title}
            </h1>
          </div>
          {badge && (
            <span className="text-[10px] sm:text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 flex items-center gap-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{badge}</span>
            </span>
          )}
        </div>
        {description && (
          <p className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase mt-1 line-clamp-2 sm:line-clamp-none">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5 sm:pt-0 shrink-0 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
