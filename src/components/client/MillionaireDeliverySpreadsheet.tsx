"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Search,
  Edit3,
  Trash2,
  X,
  Check,
  Save,
  Share2,
  FileSpreadsheet,
  CloudDownload,
  Copy,
  Zap,
  CheckCheck,
  Activity,
  ShieldCheck,
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
    editor: "",
    rawLink: "",
    finalLink: "",
    reviewStatus: "Drafting",
    publishedStatus: "In Production",
  });

  // Admin Client Filter State
  const [clientsList, setClientsList] = useState<Array<{ id: string; companyName: string; clientCode?: string }>>([]);
  const [activeClientId, setActiveClientId] = useState<string>(clientId || "");
  const [employeesList, setEmployeesList] = useState<Array<{ id: string; name: string; designation?: string }>>([]);

  const fetchEmployeesList = async () => {
    try {
      const res = await fetch("/mdz-crm/api/employees");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const list = json.data.map((emp: any) => ({
          id: emp.id,
          name: emp.name || emp.user?.name || "Employee",
          designation: emp.designation || emp.user?.designation || "",
        }));
        setEmployeesList(list);
        if (list.length > 0 && (!newRow.editor || newRow.editor === "Sumit (Lead Editor)")) {
          setNewRow((prev) => ({ ...prev, editor: list[0].name }));
        }
      }
    } catch (e) {
      console.error("Failed to load employees for delivery spreadsheet:", e);
    }
  };

  // Fetch live dynamic data from backend API
  const fetchLiveDeliveryData = async (targetId?: string, forceSync = false) => {
    try {
      setLoading(true);
      const effectiveId = targetId !== undefined ? targetId : (activeClientId || clientId);
      const params = new URLSearchParams();
      if (effectiveId && effectiveId !== "" && effectiveId !== "ALL") {
        params.set("clientId", effectiveId);
      }
      if (forceSync) {
        params.set("sync", "true");
      }
      const qs = params.toString();
      const url = qs ? `/mdz-crm/api/delivery-control?${qs}` : `/mdz-crm/api/delivery-control`;
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        if (Array.isArray(json.data.employees) && json.data.employees.length > 0) {
          setEmployeesList(json.data.employees);
        }
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
          }
        } catch (e) {
          console.error("Error loading clients:", e);
        }
      }
      loadClients();
    }
    fetchEmployeesList();
  }, [isAdmin]);

  useEffect(() => {
    setActiveClientId(clientId || "");
    fetchLiveDeliveryData(clientId || "");
  }, [clientId]);

  // Client Table State & Live Inline Editing
  const [clientRows, setClientRows] = useState<any[]>([]);
  const [hasUnsavedClientChanges, setHasUnsavedClientChanges] = useState(false);
  const [savingClients, setSavingClients] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ clientCode: "", clientName: "", target: 30 });
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveModalUrl, setDriveModalUrl] = useState("");
  const [appsScriptModalUrl, setAppsScriptModalUrl] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [syncModalTab, setSyncModalTab] = useState<"status" | "setup" | "code">("status");
  const [syncingSheet, setSyncingSheet] = useState(false);

  const DEFAULT_GOOGLE_SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1C8FCIE12Gz6cNQVmI-nxP5EmME-BJKFUWLwgIiTXMpU/edit?gid=1693502346#gid=1693502346";

  const handleSaveDriveUrl = async () => {
    try {
      const res = await fetch("/mdz-crm/api/delivery-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SYNC_CONFIG",
          driveUrl: driveModalUrl.trim() || DEFAULT_GOOGLE_SHEET_URL,
          appsScriptUrl: appsScriptModalUrl.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Two-way Google Sheet configuration saved successfully", "success");
        setShowDriveModal(false);
        await fetchLiveDeliveryData();
      } else {
        showToast(json.error || "Failed to save configuration", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving sync configuration", "error");
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      const res = await fetch("/mdz-crm/api/delivery-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TEST_SYNC_CONNECTION" }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTestResults(json.data);
        if (json.data.writeSuccess) {
          showToast(`✓ Two-Way Connection Verified! (${json.data.latencyMs}ms)`, "success");
        } else if (json.data.readSuccess) {
          showToast("✓ Live Read functional! Follow Setup to enable 2-Way Writeback.", "info");
        } else {
          showToast("Read failed: ensure Google Sheet link sharing is public.", "error");
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Error testing connection", "error");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncFromGoogleSheet = async () => {
    try {
      setSyncingSheet(true);
      const res = await fetch("/mdz-crm/api/delivery-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SYNC_FROM_GOOGLE_SHEET" }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "✓ Live Google Sheet synchronized successfully!", "success");
        await fetchLiveDeliveryData();
      } else {
        showToast(json.error || "Failed to sync from Google Sheet", "error");
      }
    } catch (e: any) {
      console.error(e);
      showToast("Network error syncing with Google Sheet", "error");
    } finally {
      setSyncingSheet(false);
    }
  };

  useEffect(() => {
    // Background polling every 25 seconds for real-time live sync with Google Sheet
    const interval = setInterval(() => {
      fetchLiveDeliveryData(undefined, false);
    }, 25000);
    return () => clearInterval(interval);
  }, [activeClientId]);

  // Track unsaved changes in refs so background polling doesn't overwrite active typing/edits
  const hasUnsavedClientChangesRef = useRef(false);
  hasUnsavedClientChangesRef.current = hasUnsavedClientChanges;

  // Sync clientRows whenever data loads, but NOT if user has unsaved edits
  useEffect(() => {
    if (data && Array.isArray(data.clientStatusList)) {
      if (!hasUnsavedClientChangesRef.current) {
        setClientRows(data.clientStatusList);
      }
    }
  }, [data]);

  // Client Target Commitments (Matching 16-column matrix in Google Sheet gid=1126021745)
  const [targetRows, setTargetRows] = useState<any[]>([]);
  const [hasUnsavedTargetChanges, setHasUnsavedTargetChanges] = useState(false);
  const [savingTargets, setSavingTargets] = useState(false);
  const [targetSearch, setTargetSearch] = useState("");
  const [editingTargetRowId, setEditingTargetRowId] = useState<string | null>(null);

  const hasUnsavedTargetChangesRef = useRef(false);
  hasUnsavedTargetChangesRef.current = hasUnsavedTargetChanges;

  useEffect(() => {
    if (data && Array.isArray(data.clientTargetCommitments)) {
      if (!hasUnsavedTargetChangesRef.current) {
        setTargetRows(data.clientTargetCommitments);
      }
    }
  }, [data]);

  const displayedTargetRows = useMemo(() => {
    const list = targetRows.length > 0 ? targetRows : (data?.clientTargetCommitments || []);
    if (!isAdmin) {
      if (activeClientId) {
        const match = list.filter((r: any) => r.id === `ct-${activeClientId}` || r.id === activeClientId || r.client?.toLowerCase() === activeClientId.toLowerCase());
        if (match.length > 0) return match;
      }
      if (clientName && clientName !== "Agency Master Sheet" && clientName !== "Client Account") {
        const byName = list.filter((r: any) => r.client?.toLowerCase() === clientName.toLowerCase() || clientName.toLowerCase().includes(r.client?.toLowerCase()));
        if (byName.length > 0) return byName;
      }
      if (list.length > 0) return [list[0]];
      return [];
    }
    return list.filter((r: any) =>
      !targetSearch ||
      r.client?.toLowerCase().includes(targetSearch.toLowerCase()) ||
      r.notes?.toLowerCase().includes(targetSearch.toLowerCase()) ||
      r.review?.toLowerCase().includes(targetSearch.toLowerCase())
    );
  }, [isAdmin, activeClientId, clientName, targetRows, data?.clientTargetCommitments, targetSearch]);

  const targetTotals = useMemo(() => {
    const list = !isAdmin ? displayedTargetRows : (targetRows.length > 0 ? targetRows : (data?.clientTargetCommitments || []));
    return list.reduce(
      (acc: any, row: any) => {
        acc.reels += Number(row.reels) || 0;
        acc.carousels += Number(row.carousels) || 0;
        acc.posts += Number(row.posts) || 0;
        acc.cpUnsplit += Number(row.cpUnsplit) || 0;
        acc.stories += Number(row.stories) || 0;
        acc.total += Number(row.total) || 0;
        return acc;
      },
      { reels: 0, carousels: 0, posts: 0, cpUnsplit: 0, stories: 0, total: 0 }
    );
  }, [isAdmin, displayedTargetRows, targetRows, data?.clientTargetCommitments]);

  const targetAutoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveTargetRowsToServer = async (commitmentsToSave: any[], showNotification: boolean = false) => {
    try {
      setSavingTargets(true);
      const res = await fetch("/mdz-crm/api/delivery-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ALL_TARGET_COMMITMENTS",
          commitments: commitmentsToSave,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setHasUnsavedTargetChanges(false);
        setEditingTargetRowId(null);
        if (showNotification) {
          showToast(json.message || "✓ Client target commitments saved and synced to Google Sheet", "success");
        }
      } else if (showNotification) {
        showToast(json.error || "Failed to save client targets", "error");
      }
    } catch (e) {
      console.error(e);
      if (showNotification) {
        showToast("Error saving client targets", "error");
      }
    } finally {
      setSavingTargets(false);
    }
  };

  const handleUpdateTargetField = (rowId: string, field: string, value: any) => {
    let nextTargets: any[] = [];
    setTargetRows((prev) => {
      nextTargets = prev.map((r) => {
        if (r.id === rowId) {
          const updated = { ...r, [field]: value };
          if (["reels", "carousels", "posts", "cpUnsplit", "stories"].includes(field)) {
            const reels = field === "reels" ? Number(value) || 0 : Number(updated.reels) || 0;
            const carousels = field === "carousels" ? Number(value) || 0 : Number(updated.carousels) || 0;
            const posts = field === "posts" ? Number(value) || 0 : Number(updated.posts) || 0;
            const cpUnsplit = field === "cpUnsplit" ? Number(value) || 0 : Number(updated.cpUnsplit) || 0;
            const stories = field === "stories" ? Number(value) || 0 : Number(updated.stories) || 0;
            updated.total = reels + carousels + posts + cpUnsplit + stories;
          }
          return updated;
        }
        return r;
      });
      return nextTargets;
    });
    setHasUnsavedTargetChanges(true);

    if (targetAutoSaveTimerRef.current) {
      clearTimeout(targetAutoSaveTimerRef.current);
    }
    targetAutoSaveTimerRef.current = setTimeout(() => {
      if (nextTargets.length > 0) {
        saveTargetRowsToServer(nextTargets, false);
      }
    }, 700);
  };

  const handleTargetCellBlur = () => {
    if (targetAutoSaveTimerRef.current) {
      clearTimeout(targetAutoSaveTimerRef.current);
    }
    if (targetRows.length > 0) {
      saveTargetRowsToServer(targetRows, false);
    }
  };

  const handleToggleTargetPlatform = (rowId: string, platformKey: string) => {
    let nextTargets: any[] = [];
    setTargetRows((prev) => {
      nextTargets = prev.map((r) => {
        if (r.id === rowId) {
          const platforms = { ...r.platforms, [platformKey]: !r.platforms?.[platformKey] };
          return { ...r, platforms };
        }
        return r;
      });
      return nextTargets;
    });
    setHasUnsavedTargetChanges(true);

    if (targetAutoSaveTimerRef.current) {
      clearTimeout(targetAutoSaveTimerRef.current);
    }
    targetAutoSaveTimerRef.current = setTimeout(() => {
      if (nextTargets.length > 0) {
        saveTargetRowsToServer(nextTargets, false);
      }
    }, 700);
  };

  const handleSaveAllTargetChanges = async () => {
    if (targetAutoSaveTimerRef.current) {
      clearTimeout(targetAutoSaveTimerRef.current);
    }
    await saveTargetRowsToServer(targetRows, true);
  };

  // Filtered rows to display on client dashboard table
  const displayedClientRows = useMemo(() => {
    if (!isAdmin) {
      if (activeClientId) {
        const match = clientRows.filter(
          (r: any) => r.id === activeClientId || r.clientCode === activeClientId
        );
        if (match.length > 0) return match;
      }
      if (clientName && clientName !== "Agency Master Sheet" && clientName !== "Client Account") {
        const byName = clientRows.filter(
          (r: any) => r.clientName?.toLowerCase() === clientName.toLowerCase()
        );
        if (byName.length > 0) return byName;
      }
      if (clientRows.length > 0) {
        return [clientRows[0]];
      }
      return [];
    }
    return clientRows;
  }, [isAdmin, activeClientId, clientName, clientRows]);

  // Smart Pagination helper for numbered button ranges with ellipsis
  const getPaginationRange = (currentPage: number, totalPages: number): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  // Client Table Pagination
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState<number>(10);

  const totalClientPages = clientPageSize > 0 ? Math.max(1, Math.ceil(displayedClientRows.length / clientPageSize)) : 1;
  const paginatedClientRows = useMemo(() => {
    if (clientPageSize <= 0) return displayedClientRows;
    const start = (clientPage - 1) * clientPageSize;
    return displayedClientRows.slice(start, start + clientPageSize);
  }, [displayedClientRows, clientPage, clientPageSize]);

  useEffect(() => {
    if (clientPage > totalClientPages && totalClientPages > 0) {
      setClientPage(totalClientPages);
    }
  }, [totalClientPages, clientPage]);

  // Production Log Filter & Pagination
  const [prodSearch, setProdSearch] = useState("");
  const [prodStatusFilter, setProdStatusFilter] = useState("ALL");
  const [prodPage, setProdPage] = useState(1);
  const [prodPageSize, setProdPageSize] = useState<number>(15);

  const filteredProdLog = useMemo(() => {
    let list = data?.productionLog || [];
    if (!isAdmin) {
      if (activeClientId) {
        list = list.filter((item: any) => item.clientId === activeClientId || item.clientCode === activeClientId);
      }
    }
    if (prodStatusFilter !== "ALL") {
      list = list.filter((item: any) =>
        item.publishedStatus?.toLowerCase() === prodStatusFilter.toLowerCase() ||
        item.reviewStatus?.toLowerCase() === prodStatusFilter.toLowerCase()
      );
    }
    if (prodSearch.trim()) {
      const q = prodSearch.toLowerCase();
      list = list.filter((item: any) =>
        (item.deliverable || item.deliverableTitle || "").toLowerCase().includes(q) ||
        (item.clientCode || "").toLowerCase().includes(q) ||
        (item.editor || item.assignee || "").toLowerCase().includes(q) ||
        (item.format || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [data?.productionLog, isAdmin, activeClientId, prodStatusFilter, prodSearch]);

  const totalProdPages = prodPageSize > 0 ? Math.max(1, Math.ceil(filteredProdLog.length / prodPageSize)) : 1;
  const paginatedProdLog = useMemo(() => {
    if (prodPageSize <= 0) return filteredProdLog;
    const start = (prodPage - 1) * prodPageSize;
    return filteredProdLog.slice(start, start + prodPageSize);
  }, [filteredProdLog, prodPage, prodPageSize]);

  useEffect(() => {
    if (prodPage > totalProdPages && totalProdPages > 0) {
      setProdPage(totalProdPages);
    }
  }, [totalProdPages, prodPage]);

  // Client Targets Pagination
  const [targetPage, setTargetPage] = useState(1);
  const [targetPageSize, setTargetPageSize] = useState<number>(15);

  const totalTargetPages = targetPageSize > 0 ? Math.max(1, Math.ceil(displayedTargetRows.length / targetPageSize)) : 1;
  const paginatedTargetRows = useMemo(() => {
    if (targetPageSize <= 0) return displayedTargetRows;
    const start = (targetPage - 1) * targetPageSize;
    return displayedTargetRows.slice(start, start + targetPageSize);
  }, [displayedTargetRows, targetPage, targetPageSize]);

  useEffect(() => {
    if (targetPage > totalTargetPages && totalTargetPages > 0) {
      setTargetPage(totalTargetPages);
    }
  }, [totalTargetPages, targetPage]);

  // Delivered & Published Deliverables Pagination (Overview Sub-panel)
  const [deliveredPage, setDeliveredPage] = useState(1);
  const [deliveredPageSize, setDeliveredPageSize] = useState<number>(8);

  const deliveredList = useMemo(() => {
    const list = data?.productionLog || [];
    return list.filter((item: any) => item.publishedStatus === "Published" || item.reviewStatus === "Approved");
  }, [data?.productionLog]);

  const totalDeliveredPages = deliveredPageSize > 0 ? Math.max(1, Math.ceil(deliveredList.length / deliveredPageSize)) : 1;
  const paginatedDeliveredList = useMemo(() => {
    if (deliveredPageSize <= 0) return deliveredList;
    const start = (deliveredPage - 1) * deliveredPageSize;
    return deliveredList.slice(start, start + deliveredPageSize);
  }, [deliveredList, deliveredPage, deliveredPageSize]);

  useEffect(() => {
    if (deliveredPage > totalDeliveredPages && totalDeliveredPages > 0) {
      setDeliveredPage(totalDeliveredPages);
    }
  }, [totalDeliveredPages, deliveredPage]);

  // Dynamic live KPIs computed directly from clientRows and production log
  const liveKpis = useMemo(() => {
    const rowsToCompute = !isAdmin ? displayedClientRows : clientRows;

    // If activeClientId is chosen or !isAdmin and exactly 1 row, calculate for that active client
    if ((activeClientId || !isAdmin) && rowsToCompute && rowsToCompute.length > 0) {
      const activeRow = activeClientId
        ? rowsToCompute.find((r: any) => r.id === activeClientId || r.clientCode === activeClientId) || rowsToCompute[0]
        : rowsToCompute[0];
      if (activeRow) {
        const target = Number(activeRow.target) || 0;
        const done = Number(activeRow.done) || 0;
        const inProgress = Number(activeRow.inProgress) || 0;
        const onHold = Number(activeRow.onHold) || 0;
        const overdue = Number(activeRow.overdue) || 0;
        const missingLinks = Number(activeRow.missingLinks) || 0;
        const unassigned = Number(activeRow.unassigned) || 0;
        const pending = Math.max(0, target - done);
        const completionPct = target > 0 ? Math.round((done / target) * 100) : 0;
        return {
          planned: target,
          completed: done,
          remaining: pending,
          onHold,
          overdue,
          inProgress,
          published: done,
          completionPct,
          missingLinks,
          unassigned,
        };
      }
    }

    if (!rowsToCompute || rowsToCompute.length === 0) {
      return (
        data?.kpis || {
          planned: 60,
          completed: 0,
          remaining: 60,
          onHold: 0,
          overdue: 0,
          inProgress: 0,
          published: 0,
          completionPct: 0,
          missingLinks: 0,
          unassigned: 60,
        }
      );
    }

    let planned = 0;
    let completed = 0;
    let remaining = 0;
    let onHold = 0;
    let overdue = 0;
    let inProgress = 0;
    let missingLinks = 0;
    let unassigned = 0;

    rowsToCompute.forEach((r: any) => {
      const t = Number(r.target) || 0;
      const d = Number(r.done) || 0;
      planned += t;
      completed += d;
      remaining += Math.max(0, t - d);
      inProgress += Number(r.inProgress) || 0;
      onHold += Number(r.onHold) || 0;
      overdue += Number(r.overdue) || 0;
      missingLinks += Number(r.missingLinks) || 0;
      unassigned += Number(r.unassigned) || 0;
    });

    const completionPct = planned > 0 ? Math.round((completed / planned) * 100) : 0;
    return {
      planned,
      completed,
      remaining,
      onHold,
      overdue,
      inProgress,
      published: completed,
      completionPct,
      missingLinks,
      unassigned,
    };
  }, [isAdmin, displayedClientRows, clientRows, activeClientId, data]);

  const clientAutoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveClientRowsToServer = async (rowsToSave: any[], showNotification: boolean = false) => {
    try {
      setSavingClients(true);
      const res = await fetch("/mdz-crm/api/delivery-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ALL_CLIENT_ROWS",
          rows: rowsToSave,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setHasUnsavedClientChanges(false);
        if (showNotification) {
          showToast(json.message || "✓ All client delivery targets & status saved and synced to Google Sheet", "success");
        }
      } else if (showNotification) {
        showToast(json.error || "Failed to save client targets", "error");
      }
    } catch (e) {
      console.error("Auto-save client error:", e);
      if (showNotification) {
        showToast("Network error saving client status", "error");
      }
    } finally {
      setSavingClients(false);
    }
  };

  const handleCellChange = (id: string, field: string, rawVal: any) => {
    const val = field === "clientCode" || field === "clientName"
      ? rawVal
      : (rawVal === "" ? 0 : Math.max(0, parseInt(rawVal, 10) || 0));

    let updatedRows: any[] = [];
    setClientRows((prev) => {
      updatedRows = prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: val };
          if (field === "target" || field === "done") {
            const t = Number(field === "target" ? val : row.target) || 0;
            const d = Number(field === "done" ? val : row.done) || 0;
            updated.pending = Math.max(0, t - d);
            updated.completionPct = t > 0 ? Math.round((d / t) * 100) : 0;
          }
          return updated;
        }
        return row;
      });
      return updatedRows;
    });
    setHasUnsavedClientChanges(true);

    if (clientAutoSaveTimerRef.current) {
      clearTimeout(clientAutoSaveTimerRef.current);
    }
    clientAutoSaveTimerRef.current = setTimeout(() => {
      if (updatedRows.length > 0) {
        saveClientRowsToServer(updatedRows, false);
      }
    }, 700);
  };

  const handleCellBlur = () => {
    if (clientAutoSaveTimerRef.current) {
      clearTimeout(clientAutoSaveTimerRef.current);
    }
    if (clientRows.length > 0) {
      saveClientRowsToServer(clientRows, false);
    }
  };

  const handleSaveAllClientRows = async () => {
    if (clientAutoSaveTimerRef.current) {
      clearTimeout(clientAutoSaveTimerRef.current);
    }
    await saveClientRowsToServer(clientRows, true);
  };

  const handleAddClientRow = async () => {
    if (!newClient.clientCode.trim() || !newClient.clientName.trim()) {
      showToast("Please enter client abbreviation code and name", "info");
      return;
    }
    try {
      setSavingClients(true);
      const res = await fetch("/mdz-crm/api/delivery-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_CLIENT_ROW",
          clientCode: newClient.clientCode.toUpperCase().trim(),
          clientName: newClient.clientName.trim(),
          target: Number(newClient.target) || 0,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ New client added to delivery matrix", "success");
        setShowAddClientModal(false);
        setNewClient({ clientCode: "", clientName: "", target: 30 });
        await fetchLiveDeliveryData();
      } else {
        showToast(json.error || "Failed to add client", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error adding client", "error");
    } finally {
      setSavingClients(false);
    }
  };

  const handleDeleteClientRow = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to remove client "${code}" from this delivery matrix?`)) return;
    try {
      const res = await fetch("/mdz-crm/api/delivery-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_CLIENT_ROW",
          id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Client ${code} removed`, "success");
        setClientRows((prev) => prev.filter((r) => r.id !== id));
      } else {
        showToast(json.error || "Failed to delete client", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error deleting client", "error");
    }
  };

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
          editor: employeesList.length > 0 ? employeesList[0].name : "",
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

  const handleShareLink = () => {
    if (typeof window !== "undefined") {
      let shareUrl = `${window.location.origin}/mdz-crm/client/delivery`;
      if (activeClientId) {
        shareUrl += `?clientId=${activeClientId}`;
      }
      navigator.clipboard.writeText(shareUrl);
      showToast(
        activeClientId
          ? `✓ Link for ${clientsList.find((c) => c.id === activeClientId)?.companyName || "Client"} copied to clipboard!`
          : "✓ Master Delivery Sheet link copied to clipboard!",
        "success"
      );
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
      {/* Top 2-Way Sync Status Bar */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${data?.syncConfig?.appsScriptUrl ? "text-emerald-600" : "text-amber-500 animate-pulse"}`} />
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Google Sheets 2-Way Live Sync:
          </span>
          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
            data?.syncConfig?.appsScriptUrl
              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700"
              : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700"
          }`}>
            {data?.syncConfig?.appsScriptUrl ? "🟢 Active & Synced" : "⚡ Click 'Connect 2-Way Sync' to activate Google Sheet writeback"}
          </span>
        </div>
        <button
          onClick={() => {
            setDriveModalUrl(data?.syncConfig?.sheetUrl || data?.howToUse?.driveFolder || DEFAULT_GOOGLE_SHEET_URL);
            setAppsScriptModalUrl(data?.syncConfig?.appsScriptUrl || "");
            setShowDriveModal(true);
          }}
          className="px-3 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>{data?.syncConfig?.appsScriptUrl ? "Configure Sync Webhook" : "⚡ Connect 2-Way Sync"}</span>
        </button>
      </div>

      {/* 1. GOOGLE SHEETS FORMULA / CONTROL BAR */}
      <div className="bg-[#F8F9FA] dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none">
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 font-bold text-[11px] shadow-2xs">
            <span>A1:J2</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="italic font-bold text-slate-400">fx</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase whitespace-nowrap">
              {isAdmin
                ? "MILLIONAIRE DIZITAL | MONTHLY DELIVERY CONTROL"
                : `${clientName || "MY BRAND"} | MONTHLY DELIVERY & PRODUCTION CONTROL`}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <div className="flex items-center gap-1.5 mr-1 shrink-0">
              <span className="text-[11px] font-sans font-bold text-slate-500 whitespace-nowrap">Client:</span>
              <select
                value={activeClientId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setActiveClientId(newId);
                  fetchLiveDeliveryData(newId);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-sans text-xs font-bold outline-none cursor-pointer shadow-2xs"
              >
                <option value="">🌐 All Clients (Master Sheet - 16+ Clients)</option>
                {clientsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} {c.clientCode ? `(${c.clientCode})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => fetchLiveDeliveryData(undefined, true)}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors shrink-0 border border-slate-300/60 dark:border-slate-700/60"
            title="Sync & Refresh from Google Sheet"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center shrink-0">
            <a
              href={data?.syncConfig?.sheetUrl || data?.howToUse?.driveFolder || DEFAULT_GOOGLE_SHEET_URL}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-l-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-sans text-[11px] font-bold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-700 whitespace-nowrap shadow-2xs transition-colors"
              title="Open Live Google Spreadsheet in Google Drive"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Google Sheet</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
            </a>
            <button
              onClick={() => {
                setDriveModalUrl(data?.syncConfig?.sheetUrl || data?.howToUse?.driveFolder || DEFAULT_GOOGLE_SHEET_URL);
                setShowDriveModal(true);
              }}
              className="px-2 py-1.5 rounded-r-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 hover:text-emerald-900 dark:hover:text-emerald-200 border-y border-r border-emerald-300 dark:border-emerald-700 cursor-pointer shrink-0 transition-colors"
              title="Edit Google Drive / Sheet URL"
            >
              <Edit3 className="w-3 h-3 text-emerald-700" />
            </button>
          </div>
          <button
            onClick={() => {
              setDriveModalUrl(data?.syncConfig?.sheetUrl || data?.howToUse?.driveFolder || DEFAULT_GOOGLE_SHEET_URL);
              setAppsScriptModalUrl(data?.syncConfig?.appsScriptUrl || "");
              setShowDriveModal(true);
            }}
            className={`px-2.5 py-1.5 rounded-lg font-sans text-[11px] font-bold flex items-center gap-1.5 border whitespace-nowrap shadow-2xs cursor-pointer shrink-0 transition-all ${
              data?.syncConfig?.appsScriptUrl
                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700"
            }`}
            title="Two-Way Real-Time Sync Configuration & Webhook"
          >
            <Zap className={`w-3.5 h-3.5 ${data?.syncConfig?.appsScriptUrl ? "text-emerald-600" : "text-amber-600 animate-pulse"}`} />
            <span>{data?.syncConfig?.appsScriptUrl ? "2-Way Live 🟢" : "⚡ Connect 2-Way Sync"}</span>
          </button>
          {isAdmin && (
            <button
              onClick={handleSyncFromGoogleSheet}
              disabled={syncingSheet}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-sans text-[11px] font-bold flex items-center gap-1.5 border border-emerald-800 whitespace-nowrap shadow-2xs cursor-pointer shrink-0 disabled:opacity-50 transition-colors"
              title="Sync latest rows and quotas directly from Google Sheet"
            >
              <CloudDownload className={`w-3.5 h-3.5 shrink-0 ${syncingSheet ? "animate-bounce" : ""}`} />
              <span>{syncingSheet ? "Syncing Sheet..." : "Sync from Sheet"}</span>
            </button>
          )}
          <button
            onClick={handleShareLink}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans text-[11px] font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 whitespace-nowrap shadow-2xs cursor-pointer shrink-0"
            title="Copy Direct Shareable Link to Clipboard"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Share Link</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-lg bg-[#13381B] hover:bg-[#1a4a24] text-white font-sans text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer border border-emerald-700/40"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Add Deliverable</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SPREADSHEET CANVAS */}
      <div className="overflow-x-auto w-full">
        {activeTab === "dashboard" && (
          <div className="min-w-[1080px] border-collapse">
            {/* ROW 1 & 2: Forest Green Header Bar */}
            <div className="bg-[#13381B] text-white px-5 py-3 border-b border-[#0f2e16] flex items-center justify-between gap-4">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans whitespace-nowrap">
                {isAdmin ? (
                  activeClientId ? (
                    <>
                      MILLIONAIRE DIZITAL <span className="font-light opacity-80">|</span> {clientsList.find(c => c.id === activeClientId)?.companyName || "CLIENT"} DELIVERY
                    </>
                  ) : (
                    <>MILLIONAIRE DIZITAL <span className="font-light opacity-80">|</span> MONTHLY DELIVERY CONTROL</>
                  )
                ) : (
                  <>{clientName || "MY BRAND"} <span className="font-light opacity-80">|</span> MONTHLY DELIVERY & PRODUCTION</>
                )}
              </h1>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-200 border border-emerald-800 shrink-0 whitespace-nowrap">
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
                  <th className="py-2.5 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[95px] whitespace-nowrap">PLANNED</th>
                  <th className="py-2.5 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[95px] whitespace-nowrap">COMPLETED</th>
                  <th className="py-2.5 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[95px] whitespace-nowrap">REMAINING</th>
                  <th className="py-2.5 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[85px] whitespace-nowrap">ON HOLD</th>
                  <th className="py-2.5 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[85px] whitespace-nowrap">OVERDUE</th>
                  <th className="py-2.5 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[100px] whitespace-nowrap">IN PROGRESS</th>
                  <th className="py-2.5 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[95px] whitespace-nowrap">PUBLISHED</th>
                  <th className="py-2.5 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[110px] whitespace-nowrap">COMPLETION %</th>
                  <th className="py-2.5 px-3 border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[110px] whitespace-nowrap">MISSING LINKS</th>
                  <th className="py-2.5 px-3 border-b border-[#0f2e16] min-w-[100px] whitespace-nowrap">UNASSIGNED</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#E6F4EA] dark:bg-emerald-950/40 text-[#13381B] dark:text-emerald-100 font-mono text-2xl font-bold">
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.planned}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800 text-emerald-700 dark:text-emerald-400">
                    {liveKpis.completed}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.remaining}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.onHold}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800 text-rose-600 dark:text-rose-400">
                    {liveKpis.overdue}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800">
                    {liveKpis.inProgress}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800 text-emerald-700 dark:text-emerald-400">
                    {liveKpis.published}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800 text-emerald-700 dark:text-emerald-400">
                    {liveKpis.completionPct}%
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 dark:border-slate-800 border-b border-slate-300 dark:border-slate-800 text-amber-600 dark:text-amber-400">
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

            {/* ROW 8: Mustard Gold Full-Width Bar with Actions */}
            <div className="bg-[#B58A38] text-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border-b border-[#967129] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>{isAdmin ? "CLIENT-WISE DELIVERY STATUS" : "MY BRAND DELIVERY STATUS & TARGET ALLOCATION"}</span>
                {isAdmin && (
                  <span className="text-[10px] font-sans font-normal lowercase bg-black/20 px-2 py-0.5 rounded text-amber-100">
                    (click any number to edit like Excel)
                  </span>
                )}
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  {savingClients ? (
                    <span className="text-[10px] bg-emerald-800 text-emerald-200 font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Saving...
                    </span>
                  ) : hasUnsavedClientChanges ? (
                    <span className="text-[10px] bg-amber-300 text-slate-900 font-bold px-2 py-0.5 rounded-full animate-pulse">
                      Unsaved Edits
                    </span>
                  ) : (
                    <span className="text-[10px] bg-black/25 text-emerald-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      ✓ Auto-saved
                    </span>
                  )}
                  <button
                    onClick={handleSaveAllClientRows}
                    disabled={savingClients}
                    className={`whitespace-nowrap px-3 py-1.5 rounded text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                      hasUnsavedClientChanges
                        ? "bg-[#13381B] hover:bg-[#1a4a24] text-white border border-emerald-400 scale-105"
                        : "bg-white/20 hover:bg-white/30 text-white"
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingClients ? "Saving..." : (hasUnsavedClientChanges ? "Save Changes" : "Saved ✓")}</span>
                  </button>
                  <button
                    onClick={() => setShowAddClientModal(true)}
                    className="whitespace-nowrap px-3 py-1.5 rounded bg-[#13381B] hover:bg-[#1a4a24] text-white text-xs font-sans font-bold flex items-center gap-1.5 shadow-sm border border-emerald-600/50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Client</span>
                  </button>
                </div>
              )}
            </div>

            {/* ROW 9: Spacer Row */}
            <div className="h-1 bg-[#F8F9FA] dark:bg-slate-950 border-b border-slate-300 dark:border-slate-800" />

            {/* ROW 10: Client Table Headers & Live Rows (Exact Google Sheets look) */}
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#13381B] text-white font-mono text-[11px] font-bold">
                  <th className="py-2.5 px-4 text-left border-r border-[#0f2e16] border-b border-[#0f2e16] w-64 min-w-[200px]">
                    Client
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[70px]">
                    Target
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[70px]">
                    Done
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[75px]">
                    Pending
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[85px]">
                    In Progress
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[75px]">
                    On Hold
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[75px]">
                    Overdue
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[95px]">
                    Completion %
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] border-b border-[#0f2e16] min-w-[95px]">
                    Missing Links
                  </th>
                  <th className="py-2.5 px-3 text-center border-b border-[#0f2e16] min-w-[85px]">
                    Unassigned
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                {paginatedClientRows.map((row: any, idx: number) => {
                  const isRowActive = activeClientId && (row.id === activeClientId || row.clientCode === activeClientId);
                  return (
                  <tr
                    key={row.id || idx}
                    className={`font-mono transition-colors group ${
                      isRowActive
                        ? "bg-emerald-50/90 dark:bg-emerald-950/50 font-bold border-y-2 border-emerald-500 shadow-2xs"
                        : "hover:bg-[#F1F8F5] dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <td className="py-2 px-3 text-left border-r border-slate-300 dark:border-slate-800 font-sans font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded border ${
                            isRowActive
                              ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                              : "bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                          }`}>
                            {row.clientCode}
                          </span>
                          <span className="truncate max-w-[170px]" title={row.clientName}>
                            {row.clientName}
                          </span>
                          {isRowActive && (
                            <span className="text-[9px] font-sans font-black bg-emerald-600 text-white px-1.5 py-0.2 rounded uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteClientRow(row.id, row.clientCode)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5 cursor-pointer"
                            title={`Delete client ${row.clientCode}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-1 px-1 text-center border-r border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                      {isAdmin ? (
                        <input
                          type="number"
                          min="0"
                          value={row.target}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleCellChange(row.id, "target", e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          }}
                          className="w-14 text-center font-bold bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-emerald-50 dark:focus:bg-emerald-950/50 border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none transition-all cursor-pointer focus:cursor-text"
                        />
                      ) : (
                        row.target
                      )}
                    </td>
                    <td className="py-1 px-1 text-center border-r border-slate-300 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 font-bold">
                      {isAdmin ? (
                        <input
                          type="number"
                          min="0"
                          value={row.done}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleCellChange(row.id, "done", e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          }}
                          className="w-14 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-emerald-50 dark:focus:bg-emerald-950/50 border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none transition-all cursor-pointer focus:cursor-text"
                        />
                      ) : (
                        row.done
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {row.pending}
                    </td>
                    <td className="py-1 px-1 text-center border-r border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      {isAdmin ? (
                        <input
                          type="number"
                          min="0"
                          value={row.inProgress || 0}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleCellChange(row.id, "inProgress", e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          }}
                          className="w-14 text-center bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-emerald-50 dark:focus:bg-emerald-950/50 border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none transition-all cursor-pointer focus:cursor-text"
                        />
                      ) : (
                        row.inProgress || 0
                      )}
                    </td>
                    <td className="py-1 px-1 text-center border-r border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      {isAdmin ? (
                        <input
                          type="number"
                          min="0"
                          value={row.onHold || 0}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleCellChange(row.id, "onHold", e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          }}
                          className="w-14 text-center bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-emerald-50 dark:focus:bg-emerald-950/50 border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none transition-all cursor-pointer focus:cursor-text"
                        />
                      ) : (
                        row.onHold || 0
                      )}
                    </td>
                    <td className="py-1 px-1 text-center border-r border-slate-300 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-bold">
                      {isAdmin ? (
                        <input
                          type="number"
                          min="0"
                          value={row.overdue || 0}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleCellChange(row.id, "overdue", e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          }}
                          className="w-14 text-center text-rose-600 dark:text-rose-400 font-bold bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-emerald-50 dark:focus:bg-emerald-950/50 border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none transition-all cursor-pointer focus:cursor-text"
                        />
                      ) : (
                        row.overdue || 0
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                      {row.completionPct}%
                    </td>
                    <td className="py-1 px-1 text-center border-r border-slate-300 dark:border-slate-800 text-amber-600 dark:text-amber-400 font-bold">
                      {isAdmin ? (
                        <input
                          type="number"
                          min="0"
                          value={row.missingLinks || 0}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleCellChange(row.id, "missingLinks", e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          }}
                          className="w-14 text-center text-amber-600 dark:text-amber-400 font-bold bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-emerald-50 dark:focus:bg-emerald-950/50 border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none transition-all cursor-pointer focus:cursor-text"
                        />
                      ) : (
                        row.missingLinks || 0
                      )}
                    </td>
                    <td className="py-1 px-1 text-center text-slate-700 dark:text-slate-300 font-bold">
                      {isAdmin ? (
                        <input
                          type="number"
                          min="0"
                          value={row.unassigned || 0}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleCellChange(row.id, "unassigned", e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          }}
                          className="w-14 text-center font-bold bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-emerald-50 dark:focus:bg-emerald-950/50 border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none transition-all cursor-pointer focus:cursor-text"
                        />
                      ) : (
                        row.unassigned || 0
                      )}
                    </td>
                  </tr>
                );})}

                {/* Total / Agency Master Summary Row */}
                {isAdmin && clientRows.length > 0 && (
                  <tr className="bg-slate-100 dark:bg-slate-800/90 font-mono font-black text-slate-900 dark:text-slate-100 border-t-2 border-slate-400 dark:border-slate-600">
                    <td className="py-2.5 px-4 text-left border-r border-slate-300 dark:border-slate-700 font-sans uppercase tracking-wider text-[11px] font-black">
                      Total Agency Master ({clientRows.length} Clients)
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 dark:border-slate-700">
                      {clientRows.reduce((acc: number, r: any) => acc + (Number(r.target) || 0), 0)}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400">
                      {clientRows.reduce((acc: number, r: any) => acc + (Number(r.done) || 0), 0)}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 dark:border-slate-700">
                      {clientRows.reduce((acc: number, r: any) => acc + Math.max(0, (Number(r.target) || 0) - (Number(r.done) || 0)), 0)}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 dark:border-slate-700">
                      {clientRows.reduce((acc: number, r: any) => acc + (Number(r.inProgress) || 0), 0)}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 dark:border-slate-700">
                      {clientRows.reduce((acc: number, r: any) => acc + (Number(r.onHold) || 0), 0)}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 dark:border-slate-700 text-rose-600 dark:text-rose-400">
                      {clientRows.reduce((acc: number, r: any) => acc + (Number(r.overdue) || 0), 0)}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400">
                      {(() => {
                        const totT = clientRows.reduce((acc: number, r: any) => acc + (Number(r.target) || 0), 0);
                        const totD = clientRows.reduce((acc: number, r: any) => acc + (Number(r.done) || 0), 0);
                        return totT > 0 ? `${Math.round((totD / totT) * 100)}%` : "0%";
                      })()}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 dark:border-slate-700 text-amber-600 dark:text-amber-400">
                      {clientRows.reduce((acc: number, r: any) => acc + (Number(r.missingLinks) || 0), 0)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {clientRows.reduce((acc: number, r: any) => acc + (Number(r.unassigned) || 0), 0)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Client Table Pagination Controls */}
            {displayedClientRows.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900/80 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono">
                  <span>Showing</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {clientPageSize <= 0
                      ? `1–${displayedClientRows.length}`
                      : `${Math.min((clientPage - 1) * clientPageSize + 1, displayedClientRows.length)}–${Math.min(clientPage * clientPageSize, displayedClientRows.length)}`}
                  </span>
                  <span>of</span>
                  <span className="font-bold text-slate-900 dark:text-white">{displayedClientRows.length}</span>
                  <span>clients</span>
                  <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                  <label className="flex items-center gap-1.5 text-slate-500">
                    <span>Rows per page:</span>
                    <select
                      value={clientPageSize}
                      onChange={(e) => {
                        setClientPageSize(Number(e.target.value));
                        setClientPage(1);
                      }}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={0}>All ({displayedClientRows.length})</option>
                    </select>
                  </label>
                </div>

                {clientPageSize > 0 && totalClientPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setClientPage(1)}
                      disabled={clientPage <= 1}
                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="First Page"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientPage((p) => Math.max(1, p - 1))}
                      disabled={clientPage <= 1}
                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {getPaginationRange(clientPage, totalClientPages).map((pageNum, idx) =>
                      pageNum === "..." ? (
                        <span key={`c-ellipsis-${idx}`} className="px-1 text-slate-400 font-mono">
                          ...
                        </span>
                      ) : (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setClientPage(Number(pageNum))}
                          className={`min-w-[28px] h-7 px-1.5 rounded font-mono font-bold text-xs transition-colors cursor-pointer ${
                            clientPage === pageNum
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => setClientPage((p) => Math.min(totalClientPages, p + 1))}
                      disabled={clientPage >= totalClientPages}
                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientPage(totalClientPages)}
                      disabled={clientPage >= totalClientPages}
                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Last Page"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* DEDICATED CLIENT VIEW: WHAT IS PENDING & WHAT WILL DELIVER */}
            {!isAdmin && (
              <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                        PRODUCTION RADAR
                      </span>
                      <span className="text-xs font-bold text-slate-400">Live Client Deliverables Schedule</span>
                    </div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>What is Pending & What Will Deliver</span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab("production")}
                      className="px-3 py-1.5 rounded-lg bg-[#13381B] hover:bg-[#1a4a24] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>View Production Log Sheet</span>
                    </button>
                    <a
                      href={data?.howToUse?.driveFolder || DEFAULT_GOOGLE_SHEET_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Brand Assets Folder</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>
                </div>

                {/* Sub-Panel 1: What Will Deliver Next (In Production / Drafting / Review) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>What Will Deliver Next (In Production & Active Review)</span>
                    </h3>
                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      {((data?.productionLog || []).filter((item: any) => item.publishedStatus !== "Published")).length} Active Items
                    </span>
                  </div>

                  {((data?.productionLog || []).filter((item: any) => item.publishedStatus !== "Published")).length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        All active deliverables for this batch have been delivered or published!
                      </p>
                      <p className="text-[11px] text-slate-400">
                        New deliverables will appear here as soon as raw footage is submitted and editing begins.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-[#13381B] text-white font-mono text-[11px]">
                            <th className="py-2 px-3 border-r border-[#0f2e16]">Target Date</th>
                            <th className="py-2 px-3 border-r border-[#0f2e16]">Deliverable Title</th>
                            <th className="py-2 px-3 border-r border-[#0f2e16]">Content Format</th>
                            <th className="py-2 px-3 border-r border-[#0f2e16]">Creator / Editor</th>
                            <th className="py-2 px-3 border-r border-[#0f2e16]">Review Status</th>
                            <th className="py-2 px-3 text-center">Drive Preview Link</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 font-sans">
                          {((data?.productionLog || []).filter((item: any) => item.publishedStatus !== "Published")).map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                                {item.date || "Scheduled"}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                                {item.deliverable || item.deliverableTitle}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  {item.format}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                                {item.editor || item.assignee}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  {item.reviewStatus}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                {item.finalLink || item.driveLink ? (
                                  <a
                                    href={item.finalLink || item.driveLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold hover:underline text-[11px]"
                                  >
                                    <FolderOpen className="w-3 h-3" />
                                    <span>Preview Draft</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                  </a>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">In progress</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Sub-Panel 2: What Has Delivered & Published */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Delivered & Published Deliverables</span>
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {((data?.productionLog || []).filter((item: any) => item.publishedStatus === "Published" || item.reviewStatus === "Approved")).length} Delivered
                    </span>
                  </div>

                  {((data?.productionLog || []).filter((item: any) => item.publishedStatus === "Published" || item.reviewStatus === "Approved")).length > 0 ? (
                    <div className="border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-[#13381B] text-white font-mono text-[11px]">
                            <th className="py-2 px-3 border-r border-[#0f2e16]">Delivered Date</th>
                            <th className="py-2 px-3 border-r border-[#0f2e16]">Deliverable Title</th>
                            <th className="py-2 px-3 border-r border-[#0f2e16]">Format</th>
                            <th className="py-2 px-3 border-r border-[#0f2e16]">Editor</th>
                            <th className="py-2 px-3 border-r border-[#0f2e16]">Status</th>
                            <th className="py-2 px-3 text-center">Final Asset</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 font-sans">
                          {((data?.productionLog || []).filter((item: any) => item.publishedStatus === "Published" || item.reviewStatus === "Approved")).map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap border-r border-slate-200 dark:border-slate-800">
                                {item.publishedDate || item.date}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                                {item.deliverable || item.deliverableTitle}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {item.format}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                                {item.editor || item.assignee}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                                  ✓ Delivered
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <a
                                  href={item.finalLink || item.driveLink || data?.howToUse?.driveFolder || DEFAULT_GOOGLE_SHEET_URL}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs"
                                >
                                  <FolderOpen className="w-3 h-3" />
                                  <span>Open File</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                      No published deliverables yet for this billing cycle.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: PRODUCTION LOG ================= */}
        {activeTab === "production" && (
          <div className="p-4 space-y-3 min-w-[960px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Production Log Sheet</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    ({filteredProdLog.length} {filteredProdLog.length === (data?.productionLog || []).length ? "Deliverables" : `of ${(data?.productionLog || []).length} Deliverables`})
                  </span>
                </h3>

                {/* Production Log Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search deliverable, editor, client..."
                    value={prodSearch}
                    onChange={(e) => {
                      setProdSearch(e.target.value);
                      setProdPage(1);
                    }}
                    className="pl-8 pr-7 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-56 sm:w-64"
                  />
                  {prodSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setProdSearch("");
                        setProdPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <select
                  value={prodStatusFilter}
                  onChange={(e) => {
                    setProdStatusFilter(e.target.value);
                    setProdPage(1);
                  }}
                  className="px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Published">Published</option>
                  <option value="Approved">Approved</option>
                  <option value="In Production">In Production</option>
                  <option value="In Review">In Review</option>
                  <option value="Drafting">Drafting</option>
                </select>
              </div>

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
                {paginatedProdLog.map((item: any) => (
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

            {/* Production Log Pagination Controls */}
            {filteredProdLog.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900/80 px-4 py-2.5 border border-slate-300 dark:border-slate-800 rounded-b-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono">
                  <span>Showing</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {prodPageSize <= 0
                      ? `1–${filteredProdLog.length}`
                      : `${Math.min((prodPage - 1) * prodPageSize + 1, filteredProdLog.length)}–${Math.min(prodPage * prodPageSize, filteredProdLog.length)}`}
                  </span>
                  <span>of</span>
                  <span className="font-bold text-slate-900 dark:text-white">{filteredProdLog.length}</span>
                  <span>deliverables</span>
                  <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                  <label className="flex items-center gap-1.5 text-slate-500">
                    <span>Rows per page:</span>
                    <select
                      value={prodPageSize}
                      onChange={(e) => {
                        setProdPageSize(Number(e.target.value));
                        setProdPage(1);
                      }}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
                    >
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={0}>All ({filteredProdLog.length})</option>
                    </select>
                  </label>
                </div>

                {prodPageSize > 0 && totalProdPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setProdPage(1)}
                      disabled={prodPage <= 1}
                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="First Page"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdPage((p) => Math.max(1, p - 1))}
                      disabled={prodPage <= 1}
                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {getPaginationRange(prodPage, totalProdPages).map((pageNum, idx) =>
                      pageNum === "..." ? (
                        <span key={`p-ellipsis-${idx}`} className="px-1 text-slate-400 font-mono">
                          ...
                        </span>
                      ) : (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setProdPage(Number(pageNum))}
                          className={`min-w-[28px] h-7 px-1.5 rounded font-mono font-bold text-xs transition-colors cursor-pointer ${
                            prodPage === pageNum
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => setProdPage((p) => Math.min(totalProdPages, p + 1))}
                      disabled={prodPage >= totalProdPages}
                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdPage(totalProdPages)}
                      disabled={prodPage >= totalProdPages}
                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Last Page"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: CLIENT TARGETS (MATCHING GOOGLE SHEET GID=1126021745) ================= */}
        {activeTab === "targets" && (
          <div className="space-y-4 min-w-[1100px] p-2 sm:p-4">
            {/* Top Sheet Banner */}
            <div className="bg-[#13381B] text-white px-4 py-3 font-mono text-sm font-bold flex flex-wrap items-center justify-between gap-3 shadow-sm rounded-t-sm border border-[#0f2e16]">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span className="tracking-wider uppercase text-sm sm:text-base font-bold">
                  CLIENT TARGETS | MONTHLY CONTENT COMMITMENTS
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {hasUnsavedTargetChanges && isAdmin && (
                  <button
                    onClick={handleSaveAllTargetChanges}
                    disabled={savingTargets}
                    className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingTargets ? "Saving..." : "Save All Edits"}</span>
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => setEditingTargetRowId(editingTargetRowId ? null : "ALL")}
                    className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      editingTargetRowId
                        ? "bg-amber-400 text-slate-950 border-amber-500 font-bold"
                        : "bg-[#0f2e16] hover:bg-[#184a24] text-emerald-200 border-[#1b4e26]"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{editingTargetRowId ? "Exit Edit Mode" : "Inline Edit"}</span>
                  </button>
                )}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-emerald-300/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search client..."
                    value={targetSearch}
                    onChange={(e) => setTargetSearch(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs rounded bg-[#0f2e16] border border-[#1b4e26] text-white placeholder-emerald-200/50 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <button
                  onClick={handleSyncFromGoogleSheet}
                  disabled={syncingSheet}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  title="Pull live numbers from Google Sheet"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingSheet ? "animate-spin" : ""}`} />
                  <span>{syncingSheet ? "Syncing..." : "Sync Sheet"}</span>
                </button>
                <a
                  href="https://docs.google.com/spreadsheets/d/1h3FUAY3HQljoerEgMCeBx-cUv-JxuAat/edit?gid=1126021745#gid=1126021745"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#0f2e16] hover:bg-[#184a24] text-emerald-300 border border-[#1b4e26] text-xs font-semibold transition-colors"
                  title="Open Google Sheet Tab Client Targets"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Sheet</span>
                </a>
              </div>
            </div>

            {/* Sub-header text matching Row 3 of Google Sheet */}
            <div className="bg-[#f8fafc] dark:bg-slate-900/80 px-4 py-2 border-x border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono italic flex flex-wrap items-center justify-between gap-2">
              <span>
                Source: handwritten client plan 12 Oct 2026 • slash values provisionally split Carousel/Post • single C/P totals remain UNSPLIT
              </span>
              <span className="not-italic font-sans text-slate-500 font-semibold text-[11px]">
                Showing {displayedTargetRows.length} {isAdmin ? "of 16 Clients" : "Brand Content Commitment"}
              </span>
            </div>

            {/* 16-Column Master Grid Table */}
            <div className="overflow-x-auto border border-slate-300 dark:border-slate-800 rounded-b-sm bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#13381B] text-white font-mono text-[11px]">
                    <th className="py-2.5 px-3 border-r border-[#0f2e16] min-w-[120px] font-bold">Client</th>
                    <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] min-w-[65px] font-bold">Reels</th>
                    <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] min-w-[70px] font-bold">Carousels</th>
                    <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] min-w-[65px] font-bold">Posts</th>
                    <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] min-w-[90px] font-bold bg-[#0e2a14] text-amber-200">
                      C/P Unsplit
                    </th>
                    <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] min-w-[65px] font-bold">Stories</th>
                    <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] min-w-[75px] font-bold bg-[#0e2a14] text-emerald-200">
                      TOTAL
                    </th>
                    <th className="py-2.5 px-1.5 text-center border-r border-[#0f2e16] w-[45px]">IG</th>
                    <th className="py-2.5 px-1.5 text-center border-r border-[#0f2e16] w-[45px]">FB</th>
                    <th className="py-2.5 px-1.5 text-center border-r border-[#0f2e16] w-[45px]">LI</th>
                    <th className="py-2.5 px-1.5 text-center border-r border-[#0f2e16] w-[45px]">GMB</th>
                    <th className="py-2.5 px-1.5 text-center border-r border-[#0f2e16] w-[70px]">WhatsApp</th>
                    <th className="py-2.5 px-1.5 text-center border-r border-[#0f2e16] w-[65px]">YouTube</th>
                    <th className="py-2.5 px-3 text-center border-r border-[#0f2e16] min-w-[85px]">Original C/P</th>
                    <th className="py-2.5 px-3 border-r border-[#0f2e16] min-w-[100px]">Review</th>
                    <th className="py-2.5 px-3 min-w-[220px]">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs">
                  {paginatedTargetRows.map((row: any, idx: number) => {
                    const isEditing = editingTargetRowId === "ALL" || editingTargetRowId === row.id;
                    const isReviewNeeded = row.review?.toLowerCase().includes("needs review");

                    return (
                      <tr
                        key={row.id || idx}
                        className={`transition-colors ${
                          idx % 2 === 0
                            ? "bg-white dark:bg-slate-900"
                            : "bg-[#fafafa] dark:bg-slate-900/40"
                        } hover:bg-slate-100/70 dark:hover:bg-slate-800/60`}
                      >
                        {/* Client Code */}
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{row.client}</span>
                            {isReviewNeeded && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Review Flagged" />
                            )}
                          </div>
                        </td>

                        {/* Reels */}
                        <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={row.reels ?? 0}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateTargetField(row.id, "reels", e.target.value)}
                              onBlur={handleTargetCellBlur}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                              className="w-12 text-center py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                            />
                          ) : (
                            <span className="font-bold text-slate-800 dark:text-slate-200">{row.reels}</span>
                          )}
                        </td>

                        {/* Carousels */}
                        <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={row.carousels ?? 0}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateTargetField(row.id, "carousels", e.target.value)}
                              onBlur={handleTargetCellBlur}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                              className="w-12 text-center py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                            />
                          ) : (
                            <span className="text-slate-700 dark:text-slate-300">{row.carousels}</span>
                          )}
                        </td>

                        {/* Posts */}
                        <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={row.posts ?? 0}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateTargetField(row.id, "posts", e.target.value)}
                              onBlur={handleTargetCellBlur}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                              className="w-12 text-center py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                            />
                          ) : (
                            <span className="text-slate-700 dark:text-slate-300">{row.posts}</span>
                          )}
                        </td>

                        {/* C/P Unsplit (Styled in light-amber background matching Google Sheet) */}
                        <td className="py-2 px-2 text-center border-r border-amber-200/80 dark:border-amber-950/60 bg-[#FEF3C7]/70 dark:bg-amber-950/30">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={row.cpUnsplit ?? 0}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateTargetField(row.id, "cpUnsplit", e.target.value)}
                              onBlur={handleTargetCellBlur}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                              className="w-12 text-center py-0.5 rounded border border-amber-400 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-amber-950 dark:text-amber-200"
                            />
                          ) : (
                            <span className="font-bold text-amber-950 dark:text-amber-200">{row.cpUnsplit}</span>
                          )}
                        </td>

                        {/* Stories */}
                        <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              value={row.stories ?? 0}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateTargetField(row.id, "stories", e.target.value)}
                              onBlur={handleTargetCellBlur}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              }}
                              className="w-12 text-center py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                            />
                          ) : (
                            <span className="text-slate-700 dark:text-slate-300">{row.stories}</span>
                          )}
                        </td>

                        {/* TOTAL (Styled in soft emerald green background matching Google Sheet) */}
                        <td className="py-2 px-2 text-center border-r border-emerald-200/80 dark:border-emerald-950/60 bg-[#DCFCE7]/70 dark:bg-emerald-950/40">
                          <span className="font-extrabold text-emerald-950 dark:text-emerald-300 text-xs sm:text-[13px]">
                            {row.total}
                          </span>
                        </td>

                        {/* Platform: IG */}
                        <td
                          onClick={() => isEditing && handleToggleTargetPlatform(row.id, "ig")}
                          className={`py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800 ${
                            isEditing ? "cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800" : ""
                          }`}
                        >
                          {row.platforms?.ig ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-sm leading-none">✓</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 text-[10px]">-</span>
                          )}
                        </td>

                        {/* Platform: FB */}
                        <td
                          onClick={() => isEditing && handleToggleTargetPlatform(row.id, "fb")}
                          className={`py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800 ${
                            isEditing ? "cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800" : ""
                          }`}
                        >
                          {row.platforms?.fb ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-sm leading-none">✓</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 text-[10px]">-</span>
                          )}
                        </td>

                        {/* Platform: LI */}
                        <td
                          onClick={() => isEditing && handleToggleTargetPlatform(row.id, "li")}
                          className={`py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800 ${
                            isEditing ? "cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800" : ""
                          }`}
                        >
                          {row.platforms?.li ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-sm leading-none">✓</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 text-[10px]">-</span>
                          )}
                        </td>

                        {/* Platform: GMB */}
                        <td
                          onClick={() => isEditing && handleToggleTargetPlatform(row.id, "gmb")}
                          className={`py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800 ${
                            isEditing ? "cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800" : ""
                          }`}
                        >
                          {row.platforms?.gmb ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-sm leading-none">✓</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 text-[10px]">-</span>
                          )}
                        </td>

                        {/* Platform: WhatsApp */}
                        <td
                          onClick={() => isEditing && handleToggleTargetPlatform(row.id, "whatsapp")}
                          className={`py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800 ${
                            isEditing ? "cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800" : ""
                          }`}
                        >
                          {row.platforms?.whatsapp ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-sm leading-none">✓</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 text-[10px]">-</span>
                          )}
                        </td>

                        {/* Platform: YouTube */}
                        <td
                          onClick={() => isEditing && handleToggleTargetPlatform(row.id, "youtube")}
                          className={`py-2 px-1 text-center border-r border-slate-200 dark:border-slate-800 ${
                            isEditing ? "cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800" : ""
                          }`}
                        >
                          {row.platforms?.youtube ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-sm leading-none">✓</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 text-[10px]">-</span>
                          )}
                        </td>

                        {/* Original C/P */}
                        <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.originalCp || ""}
                              onChange={(e) => handleUpdateTargetField(row.id, "originalCp", e.target.value)}
                              className="w-16 text-center py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                            />
                          ) : (
                            row.originalCp || "-"
                          )}
                        </td>

                        {/* Review Status */}
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 font-sans whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={row.review || "As noted"}
                              onChange={(e) => handleUpdateTargetField(row.id, "review", e.target.value)}
                              className="py-0.5 px-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                            >
                              <option value="As noted">As noted</option>
                              <option value="Needs review">Needs review</option>
                            </select>
                          ) : isReviewNeeded ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              Needs review
                            </span>
                          ) : (
                            <span className="text-slate-700 dark:text-slate-300 text-[11px]">As noted</span>
                          )}
                        </td>

                        {/* Notes */}
                        <td className="py-2 px-3 font-sans text-[11px] text-slate-600 dark:text-slate-400">
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.notes || ""}
                              onChange={(e) => handleUpdateTargetField(row.id, "notes", e.target.value)}
                              className="w-full py-0.5 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-sans"
                            />
                          ) : (
                            row.notes || <span className="text-slate-300 dark:text-slate-700 italic">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {/* TOTAL ROW MATCHING SCREENSHOT 1 */}
                  <tr className="bg-slate-100 dark:bg-slate-800 font-mono font-bold text-xs border-t-2 border-slate-300 dark:border-slate-700">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700">
                      TOTAL
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                      {targetTotals.reels}
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                      {targetTotals.carousels}
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                      {targetTotals.posts}
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-amber-300 dark:border-amber-900 bg-[#FEF3C7] dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 font-extrabold">
                      {targetTotals.cpUnsplit}
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                      {targetTotals.stories}
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-emerald-300 dark:border-emerald-900 bg-[#DCFCE7] dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-200 font-extrabold text-sm">
                      {targetTotals.total}
                    </td>
                    <td colSpan={9} className="py-2.5 px-4 text-slate-500 dark:text-slate-400 font-sans font-medium text-[11px] text-right">
                      Total commitments across 16 clients: <span className="font-bold text-slate-900 dark:text-white">{targetTotals.total} deliverables</span>
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Client Targets Pagination Controls */}
              {displayedTargetRows.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/80 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono">
                    <span>Showing</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {targetPageSize <= 0
                        ? `1–${displayedTargetRows.length}`
                        : `${Math.min((targetPage - 1) * targetPageSize + 1, displayedTargetRows.length)}–${Math.min(targetPage * targetPageSize, displayedTargetRows.length)}`}
                    </span>
                    <span>of</span>
                    <span className="font-bold text-slate-900 dark:text-white">{displayedTargetRows.length}</span>
                    <span>client targets</span>
                    <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                    <label className="flex items-center gap-1.5 text-slate-500">
                      <span>Rows per page:</span>
                      <select
                        value={targetPageSize}
                        onChange={(e) => {
                          setTargetPageSize(Number(e.target.value));
                          setTargetPage(1);
                        }}
                        className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={0}>All ({displayedTargetRows.length})</option>
                      </select>
                    </label>
                  </div>

                  {targetPageSize > 0 && totalTargetPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTargetPage(1)}
                        disabled={targetPage <= 1}
                        className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="First Page"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetPage((p) => Math.max(1, p - 1))}
                        disabled={targetPage <= 1}
                        className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {getPaginationRange(targetPage, totalTargetPages).map((pageNum, idx) =>
                        pageNum === "..." ? (
                          <span key={`t-ellipsis-${idx}`} className="px-1 text-slate-400 font-mono">
                            ...
                          </span>
                        ) : (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setTargetPage(Number(pageNum))}
                            className={`min-w-[28px] h-7 px-1.5 rounded font-mono font-bold text-xs transition-colors cursor-pointer ${
                              targetPage === pageNum
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => setTargetPage((p) => Math.min(totalTargetPages, p + 1))}
                        disabled={targetPage >= totalTargetPages}
                        className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Next Page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetPage(totalTargetPages)}
                        disabled={targetPage >= totalTargetPages}
                        className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Last Page"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Supplementary: Content Quota Cadence Reference */}
            <div className="pt-2">
              <details className="group border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50/60 dark:bg-slate-900/40">
                <summary className="font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-between list-none">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>View Format Quota & Delivery Cadence Schedule Breakdown</span>
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="mt-3 overflow-x-auto">
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
                          <td className="py-2 px-3 font-sans font-bold border-r border-slate-300 dark:border-slate-800">
                            {t.type}
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-300 dark:border-slate-800 font-bold">
                            {t.target}
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-emerald-700 font-bold">
                            {t.completed}
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-700">
                            {t.inProgress}
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-300 dark:border-slate-800 text-slate-600">
                            {t.remaining}
                          </td>
                          <td className="py-2 px-3 font-sans border-r border-slate-300 dark:border-slate-800 text-slate-600">
                            {t.deadline}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
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
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold transition-colors cursor-pointer"
              title="Add Deliverable"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
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
            ...(isAdmin
              ? [
                  { id: "team", label: "Team Summary" },
                  { id: "extra", label: "Extra Work" },
                ]
              : []),
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
                    {employeesList.length > 0 ? (
                      employeesList.map((emp) => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name} {emp.designation ? `(${emp.designation})` : ""}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Sumit (Lead Editor)">Sumit (Video Editor)</option>
                        <option value="Aryan (Design Lead)">Aryan (Graphic Lead)</option>
                        <option value="Pooja (Motion Design)">Pooja (Motion)</option>
                        <option value="Neha (Copywriter)">Neha (Copy)</option>
                      </>
                    )}
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
                    {employeesList.length > 0 ? (
                      employeesList.map((emp) => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name} {emp.designation ? `(${emp.designation})` : ""}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Sumit (Lead Editor)">Sumit (Lead Editor)</option>
                        <option value="Aryan (Design Lead)">Aryan (Graphic Lead)</option>
                        <option value="Pooja (Motion Design)">Pooja (Motion Design)</option>
                        <option value="Neha (Copywriter)">Neha (Copywriter)</option>
                      </>
                    )}
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

      {/* 5. ADD CLIENT MODAL */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Add Client to Delivery Matrix</span>
              </h3>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Client Code / Initials (2-4 letters)
                </label>
                <input
                  type="text"
                  placeholder="e.g. AM, MDZ, XS"
                  value={newClient.clientCode}
                  maxLength={6}
                  onChange={(e) => setNewClient({ ...newClient, clientCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Client / Brand Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zenith Tech Labs"
                  value={newClient.clientName}
                  onChange={(e) => setNewClient({ ...newClient, clientName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Deliverables Target
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 30"
                  value={newClient.target}
                  onChange={(e) => setNewClient({ ...newClient, target: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddClientModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddClientRow}
                disabled={savingClients}
                className="px-4 py-1.5 rounded-xl bg-[#13381B] hover:bg-[#1a4a24] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                {savingClients ? "Adding..." : "Add Client"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. GOOGLE SHEET TWO-WAY REAL-TIME SYNC MODAL */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Google Sheets Two-Way Synchronization Hub
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bidirectional sync: changes in CRM update Sheet, and edits in Sheet update CRM
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDriveModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
              <button
                onClick={() => setSyncModalTab("status")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  syncModalTab === "status"
                    ? "bg-[#13381B] text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                ⚡ Live Status & Configuration
              </button>
              <button
                onClick={() => setSyncModalTab("setup")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  syncModalTab === "setup"
                    ? "bg-[#13381B] text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                📖 60s Setup Guide
              </button>
              <button
                onClick={() => setSyncModalTab("code")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  syncModalTab === "code"
                    ? "bg-[#13381B] text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                📋 Apps Script Code
              </button>
            </div>

            {syncModalTab === "status" && (
              <div className="space-y-4 text-xs">
                {/* Live Connection Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sheet → CRM (Read & Webhook)</span>
                      </span>
                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                        ACTIVE 🟢
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Synchronizes Dashboard (292 deliverables), Targets, Production Log, Team Roster & Extra Work.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    data?.syncConfig?.appsScriptUrl || appsScriptModalUrl
                      ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20"
                      : "border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>CRM → Sheet (Live Writeback)</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        data?.syncConfig?.appsScriptUrl || appsScriptModalUrl
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}>
                        {data?.syncConfig?.appsScriptUrl || appsScriptModalUrl ? "CONNECTED 🟢" : "SETUP REQUIRED 🟡"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {data?.syncConfig?.appsScriptUrl || appsScriptModalUrl
                        ? "Edits made in CRM automatically update cells in your live Google Sheet."
                        : "Deploy Google Apps Script (in 60s) to write CRM changes back to your Sheet."}
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        1. Google Spreadsheet Link
                      </label>
                      <a
                        href={driveModalUrl || DEFAULT_GOOGLE_SHEET_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        <span>Open in Google Sheets</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <input
                      type="url"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={driveModalUrl}
                      onChange={(e) => setDriveModalUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      2. Google Apps Script Web App URL (for live writeback from CRM to Sheet)
                    </label>
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={appsScriptModalUrl}
                      onChange={(e) => setAppsScriptModalUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Generated from Extensions &gt; Apps Script &gt; Deploy as Web App ("Who has access: Anyone").
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      3. CRM Incoming Webhook URL (for real-time Google Sheet onEdit events)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={typeof window !== "undefined" ? `${window.location.origin}/mdz-crm/api/delivery-control/webhook` : "/mdz-crm/api/delivery-control/webhook"}
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] text-slate-600 dark:text-slate-400 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = typeof window !== "undefined" ? `${window.location.origin}/mdz-crm/api/delivery-control/webhook` : "/mdz-crm/api/delivery-control/webhook";
                          navigator.clipboard.writeText(url);
                          showToast("Copied webhook URL to clipboard", "success");
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold shrink-0 cursor-pointer"
                        title="Copy Webhook URL"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Diagnostic Test Output */}
                {testResults && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1 text-[11px]">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>Connection Test Results ({testResults.latencyMs}ms)</span>
                      {testResults.sheetTitle && (
                        <span className="text-emerald-600 font-semibold">{testResults.sheetTitle}</span>
                      )}
                    </div>
                    <div className={testResults.readSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}>
                      {testResults.readMessage}
                    </div>
                    <div className={testResults.writeSuccess ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                      {testResults.writeMessage}
                    </div>
                  </div>
                )}
              </div>
            )}

            {syncModalTab === "setup" && (
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                    Connect Both Directions in 4 Quick Steps:
                  </h4>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-emerald-800 dark:text-emerald-300">
                    <li>
                      Open your Google Sheet: <strong>MILLIONAIRE DIZITAL | MONTHLY DELIVERY CONTROL</strong>.
                    </li>
                    <li>
                      In the top menu bar, click <strong>Extensions &gt; Apps Script</strong>.
                    </li>
                    <li>
                      Go to the <strong>Apps Script Code</strong> tab above, click <strong>Copy Code</strong>, paste it into Apps Script (replace any placeholder code), and click the <strong>Save</strong> (disk) icon.
                    </li>
                    <li>
                      Click <strong>Deploy &gt; New deployment</strong>, select type <strong>Web app</strong>:
                      <ul className="list-disc pl-4 mt-1 font-semibold">
                        <li>Execute as: <strong>Me</strong></li>
                        <li>Who has access: <strong>Anyone</strong> (crucial!)</li>
                      </ul>
                      Click <strong>Deploy</strong>, copy the resulting Web App URL, paste it into step 2 in the <strong>Live Status</strong> tab, and click <strong>Save Settings</strong>!
                    </li>
                  </ol>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-[11px]">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200">How Real-Time Sync Works:</h5>
                  <p>
                    • <strong>CRM &rarr; Google Sheet:</strong> Whenever you edit numbers in the delivery table, update quotas, change task status, or add links, CRM immediately sends the change to the Google Apps Script Web App, which writes directly into your Sheet cells.
                  </p>
                  <p>
                    • <strong>Google Sheet &rarr; CRM:</strong> Whenever anyone edits any cell in Google Sheets, the script&apos;s <code>onEdit</code> trigger immediately notifies the CRM Webhook, keeping both in continuous real-time sync.
                  </p>
                </div>
              </div>
            )}

            {syncModalTab === "code" && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                    Complete Google Apps Script Bridge Code
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const code = data?.syncConfig?.readyAppsScriptCode || "";
                      navigator.clipboard.writeText(code);
                      setCopiedScript(true);
                      showToast("✓ Copied Apps Script code to clipboard!", "success");
                      setTimeout(() => setCopiedScript(false), 2500);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedScript ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[10px] max-h-64 overflow-y-auto border border-slate-800">
                  <pre className="whitespace-pre-wrap">
                    {data?.syncConfig?.readyAppsScriptCode || "// Loading Apps Script bridge code..."}
                  </pre>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                <Activity className={`w-3.5 h-3.5 ${testingConnection ? "animate-spin" : ""}`} />
                <span>{testingConnection ? "Testing..." : "Test 2-Way Connection"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDriveModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveDriveUrl}
                  className="px-4 py-1.5 rounded-xl bg-[#13381B] hover:bg-[#1a4a24] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
