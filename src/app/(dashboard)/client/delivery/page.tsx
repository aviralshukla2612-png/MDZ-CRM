"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import { MillionaireDeliverySpreadsheet } from "@/components/client/MillionaireDeliverySpreadsheet";
import { useToast } from "@/components/ui/Toast";

export default function DeliveryControlPage() {
  const { showToast } = useToast();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === "OWNER" || userRole === "ADMIN" || userRole === "SUB_ADMIN";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);

  const getClientId = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryCid = params.get("clientId");
      if (queryCid) return queryCid;
      if (!isAdmin) {
        return localStorage.getItem("mdz_active_client_id") || "";
      }
      return "";
    }
    return "";
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const cid = getClientId();
      const url = cid ? `/mdz-crm/api/client/portal-data?clientId=${cid}` : "/mdz-crm/api/client/portal-data";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data.delivery);
        setClientInfo(json.client || { id: json.clientId, companyName: json.clientName });
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load delivery control data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (updatedDelivery: any) => {
    try {
      const cid = getClientId() || clientInfo?.id;
      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: cid || undefined,
          section: "delivery",
          sectionData: updatedDelivery,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Delivery spreadsheet updated and synced live", "success");
        if (json.data && json.data.delivery) {
          setData(json.data.delivery);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving delivery log", "error");
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans pb-16">
      {/* Client Portal Navigation Tabs */}
      <ClientPortalNav currentTab="/client/delivery" />

      {/* Main Google Sheets Style Monthly Delivery Control */}
      <MillionaireDeliverySpreadsheet
        initialData={data}
        clientId={getClientId()}
        clientName={getClientId() ? (clientInfo?.companyName || "Client Account") : "Agency Master Sheet"}
        isAdmin={isAdmin}
        onSave={handleSave}
      />
    </div>
  );
}
