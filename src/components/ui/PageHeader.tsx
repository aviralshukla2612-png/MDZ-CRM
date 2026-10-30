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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pb-2 border-b border-slate-200 dark:border-slate-800 mb-2.5 sm:mb-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon && <div className="text-indigo-600 dark:text-indigo-400 shrink-0">{icon}</div>}
          <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">
            {title}
          </h1>
          {badge && (
            <span className="text-[10px] sm:text-[11px] font-semibold font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-normal line-clamp-1 sm:line-clamp-none">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 sm:self-center shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
