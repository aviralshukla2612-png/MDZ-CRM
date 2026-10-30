"use client";

import React, { useState, useEffect } from "react";
import { ClientPortalNav } from "@/components/client/ClientPortalNav";
import {
  ClipboardCheck,
  Building,
  User,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Save,
  RefreshCw,
  FolderOpen,
  Send,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function ClientOnboardingPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    businessInfo: {
      legalName: "",
      brandName: "",
      gstin: "",
      websiteUrl: "",
      registeredAddress: "",
    },
    primaryContact: {
      fullName: "",
      role: "",
      phone: "",
      whatsapp: "",
      email: "",
    },
    brandAssets: {
      brandGuideUrl: "",
      logoDriveUrl: "",
      rawFootageDriveUrl: "",
      fontFamilies: "",
      primaryColorHex: "",
    },
    accessChecklist: {
      metaBusinessPartnerGranted: false,
      instagramDirectAccessGranted: false,
      googleAnalyticsGranted: false,
      googleTagManagerGranted: false,
      youtubeManagerGranted: false,
      metaPixelGranted: false,
    },
    serviceAgreement: {
      packageTier: "",
      monthlyFee: "",
      reelsQuota: 0,
      carouselsQuota: 0,
      storiesQuota: 0,
      slaApprovalWindow: "",
      status: "PENDING",
    },
  });

  const [clientId, setClientId] = useState<string>("");

  const getClientId = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("clientId") || localStorage.getItem("mdz_active_client_id") || "";
    }
    return "";
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const cid = getClientId();
      setClientId(cid);
      const url = cid ? `/mdz-crm/api/client/portal-data?clientId=${cid}` : "/mdz-crm/api/client/portal-data";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data && json.data.onboarding) {
        setFormData(json.data.onboarding);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load onboarding info", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const cid = clientId || getClientId();
      const res = await fetch("/mdz-crm/api/client/portal-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: cid || undefined,
          section: "onboarding",
          sectionData: formData,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Onboarding & Access provisions saved", "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving onboarding details", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleAccess = (key: string) => {
    setFormData((prev: any) => ({
      ...prev,
      accessChecklist: {
        ...prev.accessChecklist,
        [key]: !prev.accessChecklist?.[key],
      },
    }));
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-12 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="h-40 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-72 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
          <div className="h-72 bg-slate-200 dark:bg-stone-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <ClientPortalNav currentTab="/client/onboarding" />

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              13-SECTION AGENCY ONBOARDING
            </span>
            <span className="text-[11px] font-mono text-stone-400">Account Access & Provisioning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <ClipboardCheck className="w-7 h-7 text-emerald-400" />
            <span>Client Onboarding & Access Control Center</span>
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl">
            Complete business info, Google Drive root folders, primary POC details, and social account access delegation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchData()}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors border border-stone-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Information"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Business Information */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-500" />
            <span>1. Legal Entity & Business Information</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Legal Company Name</label>
              <input
                type="text"
                value={formData.businessInfo?.legalName || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo, legalName: e.target.value },
                  })
                }
                placeholder="e.g. Acme Innovations Private Limited"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Brand / Trade Name</label>
                <input
                  type="text"
                  value={formData.businessInfo?.brandName || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessInfo: { ...formData.businessInfo, brandName: e.target.value },
                    })
                  }
                  placeholder="e.g. Acme Lifestyle"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={formData.businessInfo?.gstin || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessInfo: { ...formData.businessInfo, gstin: e.target.value },
                    })
                  }
                  placeholder="27AABCU9603R1ZM"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Official Website URL</label>
              <input
                type="url"
                value={formData.businessInfo?.websiteUrl || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo, websiteUrl: e.target.value },
                  })
                }
                placeholder="https://acme.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Primary POC */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            <span>2. Primary Point of Contact (Decision Maker)</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.primaryContact?.fullName || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryContact: { ...formData.primaryContact, fullName: e.target.value },
                    })
                  }
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Role / Designation</label>
                <input
                  type="text"
                  value={formData.primaryContact?.role || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryContact: { ...formData.primaryContact, role: e.target.value },
                    })
                  }
                  placeholder="e.g. Founder & CEO"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Direct Phone</label>
                <input
                  type="tel"
                  value={formData.primaryContact?.phone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryContact: { ...formData.primaryContact, phone: e.target.value },
                    })
                  }
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp Group Number</label>
                <input
                  type="tel"
                  value={formData.primaryContact?.whatsapp || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryContact: { ...formData.primaryContact, whatsapp: e.target.value },
                    })
                  }
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Official Notification Email</label>
              <input
                type="email"
                value={formData.primaryContact?.email || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    primaryContact: { ...formData.primaryContact, email: e.target.value },
                  })
                }
                placeholder="founder@acme.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Brand Asset Drive Links */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-emerald-500" />
            <span>3. Brand Identity & Google Drive Repositories</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Raw Footage & Shoot Assets Folder</label>
              <input
                type="url"
                value={formData.brandAssets?.rawFootageDriveUrl || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    brandAssets: { ...formData.brandAssets, rawFootageDriveUrl: e.target.value },
                  })
                }
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Logo Vectors & Fonts Folder</label>
              <input
                type="url"
                value={formData.brandAssets?.logoDriveUrl || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    brandAssets: { ...formData.brandAssets, logoDriveUrl: e.target.value },
                  })
                }
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Access Checklist */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>4. Platform Access Delegation Checklist</span>
          </h3>

          <div className="space-y-2 text-xs">
            {[
              { id: "metaBusinessPartnerGranted", label: "Meta Business Manager Partner Access (Partner ID: 94810293)" },
              { id: "instagramDirectAccessGranted", label: "Instagram Account Direct Credentials / 2FA Synced" },
              { id: "metaPixelGranted", label: "Meta Pixel & Conversions API (CAPI) Shared" },
              { id: "googleAnalyticsGranted", label: "Google Analytics 4 (GA4) Administrator Access" },
              { id: "googleTagManagerGranted", label: "Google Tag Manager (GTM) Container Edit Access" },
              { id: "youtubeManagerGranted", label: "YouTube Brand Channel Content Manager" },
            ].map((item) => {
              const checked = !!formData.accessChecklist?.[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleAccess(item.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer select-none transition-colors ${
                    checked
                      ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
                      : "bg-slate-50 dark:bg-stone-800/60 border-slate-200 dark:border-stone-700 text-slate-700 dark:text-stone-300"
                  }`}
                >
                  <span className="font-bold text-xs">{item.label}</span>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center ${
                      checked ? "bg-emerald-600 text-white" : "border border-slate-300 dark:border-stone-600"
                    }`}
                  >
                    {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
