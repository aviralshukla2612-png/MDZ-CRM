"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Menu,
  ExternalLink,
  FolderOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Film,
  Briefcase,
  HelpCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Edit3,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export interface DeliverySpreadsheetProps {
  clientId?: string;
  clientName?: string;
  isAdmin?: boolean;
  initialData?: any;
  onSave?: (updated: any) => Promise<void>;
}

export function MillionaireDeliverySpreadsheet({
  clientId,
  clientName,
  isAdmin = false,
}: DeliverySpreadsheetProps) {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Active sheet tab
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "targets" | "production" | "team" | "extra" | "guide"
  >("dashboard");

  // Add & Edit deliverable modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newRow, setNewRow] = useState({
    deliverable: "",
    format: "Reel / Short Video",
    editor: "Sumit (Lead Editor)",
    rawLink: "",
    finalLink: "",
    reviewStatus: "Drafting",
    publishedStatus: "In Production",
  });

  // Admin Client Filter State
  const [clientsList, setClientsList] = useState<Array<{ id: string; companyName: string; clientCode?: string }>>([]);
  const [activeClientId, setActiveClientId] = useState<string>(clientId || "");

  // Fetch live dynamic data from backend API
  const fetchLiveDeliveryData = async (targetId?: string) => {
    try {
      setLoading(true);
      const effectiveId = targetId !== undefined ? targetId : (activeClientId || clientId);
      const url = effectiveId
        ? `/mdz-crm/api/delivery-control?clientId=${effectiveId}`
        : `/mdz-crm/api/delivery-control`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Failed to load delivery control", e);
      showToast("Error loading live delivery data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      async function loadClients() {
        try {
          const res = await fetch("/mdz-crm/api/clients");
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setClientsList(json.data);
            if (!activeClientId && !clientId) {
              const firstId = json.data[0].id;
              setActiveClientId(firstId);
              fetchLiveDeliveryData(firstId);
            }
          }
        } catch (e) {
          console.error("Error loading clients:", e);
        }
      }
      loadClients();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (clientId) {
      setActiveClientId(clientId);
      fetchLiveDeliveryData(clientId);
    } else if (!isAdmin) {
      fetchLiveDeliveryData();
    }
  }, [clientId]);

  // Dynamic live KPIs computed directly from production log and client status
  const liveKpis = useMemo(() => {
    if (!data) {
      return {
        planned: 292,
        completed: 0,
        remaining: 292,
        onHold: 0,
        overdue: 0,
        inProgress: 0,
        published: 0,
        completionPct: 0,
        missingLinks: 0,
        unassigned: 0,
      };
    }
    return data.kpis;
  }, [data]);

  const handleAddDeliverable = async () => {
    if (!newRow.deliverable.trim()) {
      showToast("Please enter a deliverable title", "info");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/mdz-crm/api/delivery-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || data?.clientStatusList?.[0]?.id,
          action: "ADD_DELIVERABLE",
          deliverable: newRow,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("✓ Deliverable added and synchronized live!", "success");
        setShowAddModal(false);
        setNewRow({
          deliverable: "",
          format: "Reel / Short Video",
          editor: "Sumit (Lead Editor)",
          rawLink: "",
          finalLink: "",
          reviewStatus: "Drafting",
          publishedStatus: "In Production",
        });
        await fetchLiveDeliveryData();
      } else {
        showToast(json.error || "Failed to add deliverable", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Network error adding deliverable", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, reviewStatus: string, publishedStatus: string) => {
    try {
      const res = await fetch("/mdz-crm/api/delivery-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || data?.clientStatusList?.[0]?.id,
          action: "UPDATE_STATUS",
          id,
          reviewStatus,
          publishedStatus,
          status: publishedStatus === "Published" ? "COMPLETED" : "IN_PROGRESS",
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("✓ Status updated and saved to DB", "success");
        await fetchLiveDeliveryData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem({
      id: item.id,
      deliverable: item.deliverable || item.deliverableTitle || "",
      format: item.format || "Reel / Short Video",
      editor: item.editor || item.assignee || "Sumit (Lead Editor)",
      rawLink: item.rawLink || "",
      finalLink: item.finalLink || item.driveLink || "",
      reviewStatus: item.reviewStatus || "Drafting",
      publishedStatus: item.publishedStatus || "In Production",
      clientId: item.clientId || clientId,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editingItem.deliverable.trim()) {
      showToast("Please enter a deliverable title", "info");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/mdz-crm/api/delivery-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: editingItem.clientId || clientId || data?.clientStatusList?.[0]?.id,
          action: "EDIT_DELIVERABLE",
          deliverable: editingItem,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("✓ Deliverable updated successfully", "success");
        setShowEditModal(false);
        setEditingItem(null);
        await fetchLiveDeliveryData();
      } else {
        showToast(json.error || "Failed to update deliverable", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Network error updating deliverable", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDeliverable = async (id: string, itemClientId?: string) => {
    if (!confirm("Are you sure you want to delete this deliverable?")) return;

    try {
      const res = await fetch("/mdz-crm/api/delivery-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: itemClientId || clientId || data?.clientStatusList?.[0]?.id,
          action: "DELETE_DELIVERABLE",
          id,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("✓ Deliverable deleted successfully", "success");
        await fetchLiveDeliveryData();
      } else {
        showToast(json.error || "Failed to delete deliverable", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Network error deleting deliverable", "error");
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 p-8 text-center space-y-3 font-mono text-xs">
        <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin mx-auto" />
        <p className="text-slate-600 dark:text-slate-400">Loading live Google Sheets delivery data from DB...</p>
      </div>
    );
  }

  const clientList = data?.clientStatusList || [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden font-sans text-slate-900 dark:text-slate-100 select-text">
      {/* 1. GOOGLE SHEETS FORMULA / CONTROL BAR */}
      <div className="bg-[#F8F9FA] dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-xs font-mono select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 font-bold text-[11px]">
            <span>A1:J2</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="italic font-bold text-slate-400">fx</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              MILLIONAIRE DIZITAL | MONTHLY DELIVERY CONTROL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && clientsList.length > 0 && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-[11px] font-sans font-bold text-slate-500">Client:</span>
              <select
                value={activeClientId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setActiveClientId(newId);
                  fetchLiveDeliveryData(newId);
                }}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-sans text-xs font-bold outline-none cursor-pointer"
              >
                {clientsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} {c.clientCode ? `(${c.clientCode})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => fetchLiveDeliveryData()}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={data?.howToUse?.driveFolder || "https://drive.google.com"}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans text-[11px] font-semibold flex items-center gap-1 border border-slate-300 dark:border-slate-700"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open Drive</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#13381B] hover:bg-[#1a4a24] text-white font-sans text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-950/20 active:scale-95 cursor-pointer border border-emerald-700/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Data</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SPREADSHEET CANVAS */}
      <div className="overflow-x-auto">
        {activeTab === "dashboard" && (
          <div className="min-w-[960px] border-collapse">
            {/* ROW 1 & 2: Forest Green Header Bar (Exact match to screenshot) */}
            <div className="bg-[#13381B] text-white px-5 py-3 border-b border-[#0f2e16] flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans">
                MILLIONAIRE DIZITAL <span className="font-light opacity-80">|</span> MONTHLY DELIVERY CONTROL
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-200 border border-emerald-800">
                Live Dynamic Sync
              </span>
            </div>

            {/* ROW 3: Subtitle Row */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 px-5 py-2 text-[11px] text-slate-600 dark:text-slate-400 font-sans">
              October 2026 working plan • counts update from Production Log • all task completion times and Google Drive links are manually entered
            </div>

            {/* ROW 4: Spacer Gridline */}
            <div className="h-2 bg-[#F8F9FA] dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800" />

            {/* ROW 5 & 6: 10 KPI Summary Grid (Exact Google Sheet cell grid) */}
            <table className="w-full border-collapse text-center">
              <thead>
                <tr className="bg-[#13381B] text-white text-[11px] font-mono font-bold uppercase tracking-wider">
                  <th className="py-2 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16]">PLANNED</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16]">COMPLETED</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16]">REMAINING</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16]">ON HOLD</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16]">OVERDUE</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16]">IN PROGRESS</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16]">PUBLISHED</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16]">COMPLETION %</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16]">MISSING LINKS</th>
                  <th className="py-2 px-3 border-b border-[#0f2e16]">UNASSIGNED</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#E6F4EA] dark:bg-emerald-950/40 text-[#13381B] dark:text-emerald-100 font-mono text-2xl font-bold">
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.planned}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.completed}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.remaining}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.onHold}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.overdue}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.inProgress}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.published}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.completionPct}%
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.missingLinks}
                  </td>
                  <td className="py-3 px-3 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.unassigned}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ROW 7: Spacer Row */}
            <div className="h-2 bg-[#F8F9FA] dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800" />

            {/* ROW 8: Mustard Gold Full-Width Bar (Exact match to screenshot) */}
            <div className="bg-[#B58A38] text-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border-b border-[#967129]">
              CLIENT-WISE DELIVERY STATUS
            </div>

            {/* ROW 9: Spacer Row */}
            <div className="h-1 bg-[#F8F9FA] dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800" />

            {/* ROW 10: Client Table Headers & Live Rows (Exact Google Sheets look) */}
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#13381B] text-white font-mono text-[11px] font-bold">
                  <th className="py-2.5 px-4 text-left border-r border-[#0f2e16] border-b border-[#0f2e16] w-64">
                    Client
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16]">
                    Target
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16]">
                    Done
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16]">
                    Pending
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16]">
                    In Progress
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16]">
                    On Hold
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16]">
                    Overdue
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16]">
                    Completion %
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16]">
                    Missing Links
                  </th>
                  <th className="py-2.5 px-3 text-center border-b border-[#0f2e16]">
                    Unassigned
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                {clientList.map((row: any, idx: number) => (
                  <tr
                    key={row.id || idx}
                    className="hover:bg-[#F1F8F5] dark:hover:bg-slate-800 font-mono transition-colors"
                  >
                    <td className="py-2.5 px-4 text-left border-r border-slate-300 dark:border-slate-800 font-sans font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          {row.clientCode}
                        </span>
                        <span className="truncate max-w-[200px]">{row.clientName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                      {row.target}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 font-bold">
                      {row.done}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      {row.pending}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      {row.inProgress}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      {row.onHold}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      {row.overdue}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                      {row.completionPct}%
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      {row.missingLinks}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400">
                      {row.unassigned}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB: PRODUCTION LOG ================= */}
        {activeTab === "production" && (
          <div className="p-4 space-y-3 min-w-[960px]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Production Log Sheet</span>
                <span className="text-[11px] font-mono text-slate-400">
                  ({(data?.productionLog || []).length} Deliverables Tracked in Database)
                </span>
              </h3>
              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#13381B] hover:bg-[#1a4a24] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Data</span>
                </button>
              )}
            </div>

            <table className="w-full text-left text-xs border border-slate-300 dark:border-slate-800 border-collapse">
              <thead>
                <tr className="bg-[#13381B] text-white font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Date</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Client</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Deliverable Title</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Format</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Editor / Creator</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Drive Link</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Review Status</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Publish Status</th>
                  {isAdmin && <th className="py-2 px-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 font-mono">
                {(data?.productionLog || []).map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap border-r border-slate-300 dark:border-slate-800">
                      {item.date}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200">
                      {item.clientCode || "MDZ"}
                    </td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-slate-100 border-r border-slate-300 dark:border-slate-800">
                      {item.deliverable || item.deliverableTitle}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 dark:border-slate-800">
                      {item.format}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300 border-r border-slate-300 dark:border-slate-800">
                      {item.editor || item.assignee}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 dark:border-slate-800">
                      {item.finalLink || item.driveLink ? (
                        <a
                          href={item.finalLink || item.driveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                        >
                          <FolderOpen className="w-3 h-3" />
                          <span>Drive Link</span>
                        </a>
                      ) : (
                        <span className="text-amber-600 italic">No link</span>
                      )}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 dark:border-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                        {item.reviewStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 dark:border-slate-800 font-sans">
                      {item.publishedStatus === "Published" ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Published</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400">{item.publishedStatus}</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Deliverable"
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-300 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDeliverable(item.id, item.clientId)}
                            title="Delete Deliverable"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 dark:text-rose-300 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {item.reviewStatus !== "Approved" && (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(item.id, "Approved", "Published")}
                              title="Approve Deliverable"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 dark:text-emerald-300 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB: CLIENT TARGETS ================= */}
        {activeTab === "targets" && (
          <div className="p-4 space-y-3 min-w-[960px]">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Client Quota Targets & Delivery Schedule
            </h3>
            <table className="w-full text-left text-xs border border-slate-300 dark:border-slate-800 border-collapse">
              <thead>
                <tr className="bg-[#13381B] text-white font-mono text-[11px]">
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Format Type</th>
                  <th className="py-2 px-3 text-center border-r border-[#0f2e16]">Target</th>
                  <th className="py-2 px-3 text-center border-r border-[#0f2e16]">Completed</th>
                  <th className="py-2 px-3 text-center border-r border-[#0f2e16]">In Progress</th>
                  <th className="py-2 px-3 text-center border-r border-[#0f2e16]">Remaining</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Delivery Cadence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {(data?.clientTargets || []).map((t: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="py-2.5 px-3 font-sans font-bold border-r border-slate-300 dark:border-slate-800">
                      {t.type}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 font-bold">
                      {t.target}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-emerald-700 font-bold">
                      {t.completed}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-700">
                      {t.inProgress}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-600">
                      {t.remaining}
                    </td>
                    <td className="py-2.5 px-3 font-sans border-r border-slate-300 dark:border-slate-800 text-slate-600">
                      {t.deadline}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB: TEAM SUMMARY ================= */}
        {activeTab === "team" && (
          <div className="p-4 space-y-3 min-w-[960px]">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Agency Execution Team & Workload
            </h3>
            <table className="w-full text-left text-xs border border-slate-300 dark:border-slate-800 border-collapse">
              <thead>
                <tr className="bg-[#13381B] text-white font-mono text-[11px]">
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Specialist Role</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Team Member</th>
                  <th className="py-2 px-3 text-center border-r border-[#0f2e16]">Assigned Tasks</th>
                  <th className="py-2 px-3 text-center border-r border-[#0f2e16]">Completed</th>
                  <th className="py-2 px-3 text-center border-r border-[#0f2e16]">Pending</th>
                  <th className="py-2 px-3 text-center">Turnaround SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {(data?.teamSummary || []).map((tm: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="py-2.5 px-3 font-sans font-bold border-r border-slate-300 dark:border-slate-800">
                      {tm.role}
                    </td>
                    <td className="py-2.5 px-3 font-sans border-r border-slate-300 dark:border-slate-800">
                      {tm.name}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 font-bold">
                      {tm.assigned}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-emerald-700 font-bold">
                      {tm.completed}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-600">
                      {tm.pending}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {tm.turnaround}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB: EXTRA WORK ================= */}
        {activeTab === "extra" && (
          <div className="p-4 space-y-3 min-w-[960px]">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Ad-Hoc / Out-Of-Scope Creative Requests
            </h3>
            <table className="w-full text-left text-xs border border-slate-300 dark:border-slate-800 border-collapse">
              <thead>
                <tr className="bg-[#13381B] text-white font-mono text-[11px]">
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Date</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Request Details</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Requested By</th>
                  <th className="py-2 px-3 border-r border-[#0f2e16]">Billing / SLA Coverage</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                {(data?.extraWork || []).map((ew: any) => (
                  <tr key={ew.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-800 text-slate-500">
                      {ew.date}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-bold border-r border-slate-300 dark:border-slate-800">
                      {ew.request}
                    </td>
                    <td className="py-2.5 px-3 font-sans border-r border-slate-300 dark:border-slate-800">
                      {ew.requestedBy}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 dark:border-slate-800 text-indigo-700 font-bold">
                      {ew.billable}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {ew.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= TAB: HOW TO USE ================= */}
        {activeTab === "guide" && (
          <div className="p-5 space-y-4 min-w-[700px]">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Agency Delivery Standard Operating Procedure (SOP)
            </h3>
            <div className="space-y-2 text-xs">
              {(data?.howToUse?.rules || []).map((rule: string, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#13381B] text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. GOOGLE SHEETS BOTTOM SHEET TABS (Exact match to screenshot) */}
      <div className="bg-[#EBF1F5] dark:bg-slate-950 border-t border-slate-300 dark:border-slate-800 px-3 py-1 flex items-center justify-between text-xs overflow-x-auto select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold transition-colors cursor-pointer"
            title="Add Deliverable"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            title="All Sheet Tabs"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Sheet tabs */}
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "targets", label: "Client Targets" },
            { id: "production", label: "Production Log" },
            { id: "team", label: "Team Summary" },
            { id: "extra", label: "Extra Work" },
            { id: "guide", label: "How To Use" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-t border-x ${
                  isActive
                    ? "bg-white dark:bg-slate-900 text-[#13381B] dark:text-emerald-400 font-bold border-slate-300 dark:border-slate-700 border-b-2 border-b-emerald-600 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200/80 dark:hover:bg-slate-800"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <button className="hover:text-slate-600"><ChevronLeft className="w-3.5 h-3.5" /></button>
          <button className="hover:text-slate-600"><ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Add Deliverable Modal */}
      {isAdmin && showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Log Deliverable into Production Sheet</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deliverable Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Founder Hook Reel #05 or Festival Offer Static"
                  value={newRow.deliverable}
                  onChange={(e) => setNewRow({ ...newRow, deliverable: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Format</label>
                  <select
                    value={newRow.format}
                    onChange={(e) => setNewRow({ ...newRow, format: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans"
                  >
                    <option value="Reel">Viral Reel</option>
                    <option value="Carousel">Carousel Post</option>
                    <option value="Static Post">Static Post</option>
                    <option value="Daily Story">Daily Story</option>
                    <option value="Ad Creative">Performance Ad</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Editor / Creator</label>
                  <select
                    value={newRow.editor}
                    onChange={(e) => setNewRow({ ...newRow, editor: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans"
                  >
                    <option value="Sumit (Lead Editor)">Sumit (Video Editor)</option>
                    <option value="Aryan (Design Lead)">Aryan (Graphic Lead)</option>
                    <option value="Pooja (Motion Design)">Pooja (Motion)</option>
                    <option value="Neha (Copywriter)">Neha (Copy)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Drive 4K Export Link
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={newRow.finalLink}
                  onChange={(e) => setNewRow({ ...newRow, finalLink: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDeliverable}
                disabled={submitting}
                className="px-4 py-1.5 rounded bg-[#13381B] hover:bg-[#1a4a24] text-white font-bold text-xs shadow-xs"
              >
                {submitting ? "Saving..." : "Save Deliverable"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Deliverable Modal */}
      {isAdmin && showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>Edit Deliverable Details</span>
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deliverable Name
                </label>
                <input
                  type="text"
                  value={editingItem.deliverable}
                  onChange={(e) => setEditingItem({ ...editingItem, deliverable: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Format</label>
                  <select
                    value={editingItem.format}
                    onChange={(e) => setEditingItem({ ...editingItem, format: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  >
                    <option value="Reel">Viral Reel</option>
                    <option value="Carousel">Carousel Post</option>
                    <option value="Static Post">Static Post</option>
                    <option value="Daily Story">Daily Story</option>
                    <option value="Ad Creative">Performance Ad</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Editor / Creator</label>
                  <select
                    value={editingItem.editor}
                    onChange={(e) => setEditingItem({ ...editingItem, editor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  >
                    <option value="Sumit (Lead Editor)">Sumit (Lead Editor)</option>
                    <option value="Aryan (Design Lead)">Aryan (Graphic Lead)</option>
                    <option value="Pooja (Motion Design)">Pooja (Motion Design)</option>
                    <option value="Neha (Copywriter)">Neha (Copywriter)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Review Status</label>
                  <select
                    value={editingItem.reviewStatus}
                    onChange={(e) => setEditingItem({ ...editingItem, reviewStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  >
                    <option value="Drafting">Drafting</option>
                    <option value="In Client Review">In Client Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Changes Requested">Changes Requested</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Publish Status</label>
                  <select
                    value={editingItem.publishedStatus}
                    onChange={(e) => setEditingItem({ ...editingItem, publishedStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  >
                    <option value="In Production">In Production</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Drive Link
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={editingItem.finalLink}
                  onChange={(e) => setEditingItem({ ...editingItem, finalLink: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={submitting}
                className="px-4 py-1.5 rounded-xl bg-[#13381B] hover:bg-[#1a4a24] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
