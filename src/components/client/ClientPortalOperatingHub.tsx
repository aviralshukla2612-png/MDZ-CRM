"use client";

import React, { useState } from "react";
import { TableProperties, Target } from "lucide-react";
import { MillionaireDeliverySpreadsheet } from "@/components/client/MillionaireDeliverySpreadsheet";
import { MillionaireKpiTracker } from "@/components/client/MillionaireKpiTracker";

interface Props {
  clientId?: string;
  clientName?: string;
  isAdmin?: boolean;
}

export function ClientPortalOperatingHub({ clientId, clientName = "Client Account", isAdmin = false }: Props) {
  const [activeTab, setActiveTab] = useState<"delivery" | "kpi">("delivery");

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Operating Matrix & Live Performance</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time delivery progress, content production pipeline, and verified KPI metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab("delivery")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "delivery"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <TableProperties className="w-4 h-4 text-emerald-600" />
            <span>Monthly Delivery Sheet</span>
          </button>
          <button
            onClick={() => setActiveTab("kpi")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "kpi"
                ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Target className="w-4 h-4 text-purple-600" />
            <span>KPI Growth Tracker</span>
          </button>
        </div>
      </div>

      {activeTab === "delivery" && (
        <MillionaireDeliverySpreadsheet
          clientName={clientName}
          clientId={clientId}
          isAdmin={isAdmin}
        />
      )}

      {activeTab === "kpi" && (
        <MillionaireKpiTracker
          clientName={clientName}
          clientId={clientId}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
