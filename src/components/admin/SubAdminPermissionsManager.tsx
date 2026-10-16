"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  ShieldCheck,
  Check,
  Users,
  Sparkles,
  RefreshCw,
  Save,
  RotateCcw,
  Layers,
  CheckSquare,
  Square,
  ExternalLink,
  Info,
  Crown,
  Key,
  FolderKanban,
  TableProperties,
  Target,
  FileText,
  Calendar,
  Cloud,
  Send,
  Bell,
  UserCheck,
  Clock,
  IndianRupee,
  ShieldAlert,
  BookOpen,
  Settings,
} from "lucide-react";

interface SidebarItemCatalog {
  id: string;
  title: string;
  href: string;
  category: string;
  description: string;
  defaultSubAdmin: boolean;
}

interface SubAdminUser {
  id: string;
  name: string;
  email: string;
  activeRole: string;
  designation: string;
  department: string;
  avatarUrl?: string | null;
}

// Icon mapper for previewing sidebar items in manager
const ITEM_ICONS: Record<string, React.ReactNode> = {
  overview: <Layers className="w-4 h-4 text-slate-700 dark:text-slate-200" />,
  delivery: <TableProperties className="w-4 h-4 text-emerald-600" />,
  kpi_tracker: <Target className="w-4 h-4 text-purple-600" />,
  leads: <Target className="w-4 h-4 text-blue-600" />,
  quotes: <FileText className="w-4 h-4 text-indigo-600" />,
  clients: <Users className="w-4 h-4 text-sky-600" />,
  personal_brands: <Sparkles className="w-4 h-4 text-amber-500" />,
  events: <Calendar className="w-4 h-4 text-rose-500" />,
  projects: <FolderKanban className="w-4 h-4 text-blue-500" />,
  docs: <Cloud className="w-4 h-4 text-sky-500" />,
  updates: <Send className="w-4 h-4 text-emerald-500" />,
  notifications: <Bell className="w-4 h-4 text-amber-500" />,
  employees: <UserCheck className="w-4 h-4 text-indigo-500" />,
  targets: <Target className="w-4 h-4 text-emerald-600" />,
  attendance: <Clock className="w-4 h-4 text-teal-600" />,
  working_hours: <Clock className="w-4 h-4 text-cyan-600" />,
  holidays: <Calendar className="w-4 h-4 text-pink-600" />,
  attendance_requests: <Clock className="w-4 h-4 text-amber-600" />,
  leave_requests: <UserCheck className="w-4 h-4 text-rose-600" />,
  finance: <IndianRupee className="w-4 h-4 text-emerald-700" />,
  audit: <ShieldAlert className="w-4 h-4 text-rose-700" />,
  terms: <BookOpen className="w-4 h-4 text-indigo-600" />,
  settings: <Settings className="w-4 h-4 text-slate-600" />,
};

export function SubAdminPermissionsManager() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<SidebarItemCatalog[]>([]);
  const [subAdmins, setSubAdmins] = useState<SubAdminUser[]>([]);
  const [globalAllowed, setGlobalAllowed] = useState<string[]>([]);
  
  // Selected scope: "GLOBAL" or a specific userId
  const [selectedScope, setSelectedScope] = useState<string>("GLOBAL");
  const [selectedAllowedHrefs, setSelectedAllowedHrefs] = useState<string[]>([]);
  const [hasCustomOverride, setHasCustomOverride] = useState(false);

  // Load permissions data
  const loadData = async (targetUser?: string) => {
    try {
      setLoading(true);
      const url = targetUser && targetUser !== "GLOBAL"
        ? `/mdz-crm/api/admin/subadmin-permissions?userId=${targetUser}`
        : `/mdz-crm/api/admin/subadmin-permissions`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setCatalog(json.catalog || []);
        setSubAdmins(json.subAdmins || []);
        setGlobalAllowed(json.globalAllowed || []);

        if (targetUser && targetUser !== "GLOBAL") {
          if (json.selectedUserAllowed) {
            setSelectedAllowedHrefs(json.selectedUserAllowed);
            setHasCustomOverride(true);
          } else {
            // Falls back to global default
            setSelectedAllowedHrefs(json.globalAllowed || []);
            setHasCustomOverride(false);
          }
        } else {
          setSelectedAllowedHrefs(json.globalAllowed || []);
          setHasCustomOverride(false);
        }
      } else {
        showToast(json.error || "Failed to load sub-admin permissions", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Network error fetching permissions", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScopeChange = (newScope: string) => {
    setSelectedScope(newScope);
    loadData(newScope);
  };

  const toggleItem = (href: string) => {
    if (selectedAllowedHrefs.includes(href)) {
      setSelectedAllowedHrefs(selectedAllowedHrefs.filter((h) => h !== href));
    } else {
      setSelectedAllowedHrefs([...selectedAllowedHrefs, href]);
    }
  };

  const handleSelectAll = () => {
    setSelectedAllowedHrefs(catalog.map((i) => i.href));
  };

  const handleDeselectAll = () => {
    setSelectedAllowedHrefs([]);
  };

  // Preset Configurations
  const applyPreset = (presetType: string) => {
    switch (presetType) {
      case "OPERATIONS":
        setSelectedAllowedHrefs([
          "/owner",
          "/client/delivery",
          "/client/kpi-tracker",
          "/projects",
          "/docs",
          "/employee/updates",
          "/notifications",
          "/events",
        ]);
        showToast("Applied Project & Delivery Operations preset", "info");
        break;
      case "HR":
        setSelectedAllowedHrefs([
          "/owner",
          "/employees",
          "/employees?tab=targets",
          "/attendance",
          "/attendance/working-hours",
          "/attendance/holidays",
          "/attendance-requests",
          "/leave-requests",
          "/employee/updates",
          "/notifications",
        ]);
        showToast("Applied Workforce & HR Lead preset", "info");
        break;
      case "SALES":
        setSelectedAllowedHrefs([
          "/owner",
          "/leads",
          "/quotes",
          "/clients",
          "/personal-brands",
          "/events",
          "/docs",
          "/notifications",
        ]);
        showToast("Applied Sales & Client Director preset", "info");
        break;
      case "ALL_EXCEPT_ADMIN":
        setSelectedAllowedHrefs(
          catalog
            .filter((i) => i.href !== "/settings" && i.href !== "/finance")
            .map((i) => i.href)
        );
        showToast("Applied Full Sub-Admin Power (All except Finance & Settings)", "info");
        break;
      default:
        break;
    }
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      const isUser = selectedScope !== "GLOBAL";
      const payload = {
        targetType: isUser ? "USER" : "GLOBAL",
        targetUserId: isUser ? selectedScope : undefined,
        allowedHrefs: selectedAllowedHrefs,
      };

      const res = await fetch("/mdz-crm/api/admin/subadmin-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast(
          isUser
            ? "✓ Custom permissions saved for selected Sub-Admin!"
            : "✓ Default Sub-Admin sidebar permissions saved globally!",
          "success"
        );
        if (isUser) setHasCustomOverride(true);

        // Notify active sidebar to immediately update
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mdz_subadmin_permissions_updated", { detail: payload }));
        }
      } else {
        showToast(json.error || "Failed to save permissions", "error");
      }
    } catch {
      showToast("Network error saving permissions", "error");
    } finally {
      setSaving(false);
    }
  };

  // Reset custom user override to global default
  const handleResetUserOverride = async () => {
    if (selectedScope === "GLOBAL") return;
    if (!window.confirm("Reset this Sub-Admin's access to inherit the default Global Sub-Admin template?")) return;

    try {
      setSaving(true);
      const res = await fetch(`/mdz-crm/api/admin/subadmin-permissions?userId=${selectedScope}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Reset to default global sub-admin permissions", "success");
        setHasCustomOverride(false);
        setSelectedAllowedHrefs(globalAllowed);

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mdz_subadmin_permissions_updated"));
        }
      } else {
        showToast(json.error || "Failed to reset override", "error");
      }
    } catch {
      showToast("Network error resetting override", "error");
    } finally {
      setSaving(false);
    }
  };

  // Group catalog by category
  const categories = Array.from(new Set(catalog.map((i) => i.category)));

  if (loading && catalog.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 font-sans">
        <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading Sub-Admin Access Matrix...</p>
      </div>
    );
  }

  const selectedUser = subAdmins.find((u) => u.id === selectedScope);

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-6 md:p-8 shadow-xl space-y-6 font-sans">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Sub-Admin Access & Sidebar Permissions</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                  ADMIN CONTROL
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grant or revoke granular access to any sidebar module, sheet, tracker, or tool for Sub-Admins.
              </p>
            </div>
          </div>
        </div>

        {/* Scope Selector: Global Template vs Individual Sub-Admin */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Key className="w-4 h-4 text-indigo-600 ml-1.5 shrink-0" />
            <select
              value={selectedScope}
              onChange={(e) => handleScopeChange(e.target.value)}
              className="bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-w-[220px]"
            >
              <option value="GLOBAL">Default Template (All Sub-Admins)</option>
              <optgroup label="Specific Sub-Admins & Staff">
                {subAdmins.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.activeRole === "SUB_ADMIN" ? "Sub-Admin" : u.designation || u.activeRole})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? "Saving..." : "Save Access"}</span>
          </button>
        </div>
      </div>

      {/* Scope Details Callout */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/60 via-slate-50/60 to-purple-50/40 dark:from-indigo-950/30 dark:via-slate-900/40 dark:to-purple-950/20 border border-indigo-200/70 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <div>
            <span className="font-extrabold text-slate-900 dark:text-slate-100">
              {selectedScope === "GLOBAL"
                ? "Editing Default Global Permissions for all Sub-Admins"
                : `Configuring custom permissions for: ${selectedUser?.name || "Selected Sub-Admin"}`}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
              {selectedAllowedHrefs.length} of {catalog.length} sidebar options granted.
              {hasCustomOverride && (
                <span className="ml-1.5 text-amber-600 font-bold dark:text-amber-400">
                  (Custom Override Active)
                </span>
              )}
            </span>
          </div>
        </div>

        {hasCustomOverride && selectedScope !== "GLOBAL" && (
          <button
            type="button"
            onClick={handleResetUserOverride}
            disabled={saving}
            className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset to Global Default</span>
          </button>
        )}
      </div>

      {/* 2. Quick Preset Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="text-[11px] font-mono font-bold text-slate-400 uppercase mr-1">
          Quick Presets:
        </span>
        <button
          type="button"
          onClick={handleSelectAll}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
        >
          <CheckSquare className="w-3 h-3 text-emerald-600" />
          <span>Select All</span>
        </button>
        <button
          type="button"
          onClick={handleDeselectAll}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
        >
          <Square className="w-3 h-3 text-slate-400" />
          <span>Clear All</span>
        </button>
        <button
          type="button"
          onClick={() => applyPreset("OPERATIONS")}
          className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-[11px] border border-purple-200/60 dark:border-purple-800/60 transition-all cursor-pointer"
        >
          <span>Delivery & Projects Lead</span>
        </button>
        <button
          type="button"
          onClick={() => applyPreset("HR")}
          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200/60 dark:border-emerald-800/60 transition-all cursor-pointer"
        >
          <span>Workforce & HR Lead</span>
        </button>
        <button
          type="button"
          onClick={() => applyPreset("SALES")}
          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200/60 dark:border-blue-800/60 transition-all cursor-pointer"
        >
          <span>Sales & Client Manager</span>
        </button>
        <button
          type="button"
          onClick={() => applyPreset("ALL_EXCEPT_ADMIN")}
          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200/60 dark:border-indigo-800/60 transition-all cursor-pointer"
        >
          <span>Full Sub-Admin Power</span>
        </button>
      </div>

      {/* 3. Category Grouped Permissions Grid */}
      <div className="space-y-6 pt-2">
        {categories.map((cat) => {
          const items = catalog.filter((i) => i.category === cat);
          const allCatSelected = items.every((i) => selectedAllowedHrefs.includes(i.href));

          return (
            <div
              key={cat}
              className="bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/70 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>{cat}</span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold lowercase">
                    ({items.filter((i) => selectedAllowedHrefs.includes(i.href)).length}/{items.length} enabled)
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    if (allCatSelected) {
                      // Remove all in this category
                      const catHrefs = items.map((i) => i.href);
                      setSelectedAllowedHrefs(selectedAllowedHrefs.filter((h) => !catHrefs.includes(h)));
                    } else {
                      // Add all in this category
                      const newHrefs = Array.from(new Set([...selectedAllowedHrefs, ...items.map((i) => i.href)]));
                      setSelectedAllowedHrefs(newHrefs);
                    }
                  }}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {allCatSelected ? "Deselect Category" : "Select Category"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => {
                  const isChecked = selectedAllowedHrefs.includes(item.href);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.href)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? "bg-white dark:bg-slate-900 border-indigo-400/80 dark:border-indigo-600/80 shadow-sm ring-1 ring-indigo-500/20"
                          : "bg-slate-100/60 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/60 opacity-60 hover:opacity-90"
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="shrink-0">{ITEM_ICONS[item.id] || <Layers className="w-3.5 h-3.5" />}</span>
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-1">
                          {item.description}
                        </p>
                        <div className="text-[10px] font-mono text-indigo-600/80 dark:text-indigo-400/80 truncate">
                          {item.href}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Save Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Saved permissions immediately update the Sub-Admin sidebar and navigation restrictions in real time.
        </span>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving Access Permissions...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Apply Access Changes</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
