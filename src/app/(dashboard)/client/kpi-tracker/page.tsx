"use client";

import React, { useState, useEffect } from "react";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import { MillionaireKpiTracker } from "@/components/client/MillionaireKpiTracker";

export default function KpiTrackerPage() {
  const [clientInfo, setClientInfo] = useState<any>(null);

  useEffect(() => {
    async function loadClient() {
      try {
        const res = await fetch("/mdz-crm/api/client/portal-data");
        const json = await res.json();
        if (json.success && json.data) {
          setClientInfo(json.data.client || null);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadClient();
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans pb-16">
      {/* Client Portal Navigation Tabs */}
      <ClientPortalNav currentTab="/client/kpi-tracker" />

      {/* Millionaire Dizital KPI Tracker (Exact Match to Framework) */}
      <MillionaireKpiTracker
        clientName={clientInfo?.companyName || "My Client Account"}
        isAdmin={false}
      />
    </div>
  );
}
