"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import { MillionaireKpiTracker } from "@/components/client/MillionaireKpiTracker";

export default function KpiTrackerPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isAdmin = ["OWNER", "ADMIN", "SUB_ADMIN"].includes(userRole);

  const [clientInfo, setClientInfo] = useState<any>(null);
  const [clientId, setClientId] = useState<string>("");

  const getClientId = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("clientId") || localStorage.getItem("mdz_active_client_id") || "";
    }
    return "";
  };

  useEffect(() => {
    async function loadClient() {
      try {
        const cid = getClientId();
        setClientId(cid);
        const url = cid ? `/mdz-crm/api/client/portal-data?clientId=${cid}` : "/mdz-crm/api/client/portal-data";
        const res = await fetch(url);
        const json = await res.json();
        if (json.success && json.data) {
          setClientInfo(json.client || { id: json.clientId, companyName: json.clientName });
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

      {/* Millionaire Dizital KPI Tracker */}
      <MillionaireKpiTracker
        clientId={clientId || clientInfo?.id}
        clientName={clientInfo?.companyName || "My Client Account"}
        isAdmin={isAdmin}
      />
    </div>
  );
}
