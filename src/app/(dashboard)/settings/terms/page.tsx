"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  ShieldCheck,
  FileText,
  Edit3,
  Eye,
  Send,
  History,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function AdminTermsManagementPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Active Editor State
  const [selectedAudience, setSelectedAudience] = useState<"EMPLOYEE" | "CLIENT">("EMPLOYEE");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [version, setVersion] = useState("v1.1");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Preview & Confirm Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdminTerms();
  }, []);

  const fetchAdminTerms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-crm/api/admin/terms");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        showToast(json.error || "Failed to load terms data", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to connect to server", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditor = (audience: "EMPLOYEE" | "CLIENT") => {
    setSelectedAudience(audience);
    const audienceData = audience === "EMPLOYEE" ? data?.employee : data?.client;
    const currentOrDraft = audienceData?.draft || audienceData?.current;

    const currentVer = currentOrDraft?.version || "v1.0";
    // Auto increment version e.g. v1.0 -> v1.1
    const verParts = currentVer.replace("v", "").split(".");
    const nextVer = verParts.length === 2 ? `v${verParts[0]}.${Number(verParts[1]) + 1}` : "v1.1";

    setVersion(currentOrDraft?.isDraft ? currentOrDraft.version : nextVer);
    setTitle(currentOrDraft?.title || `${audience === "EMPLOYEE" ? "Employee" : "Client"} Terms and Conditions of Service`);
    setContent(currentOrDraft?.content || "");
    setIsEditorOpen(true);
  };

  const handleSaveDraft = async () => {
    try {
      setSubmitting(true);
      const res = await fetch("/mdz-crm/api/admin/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAudience: selectedAudience,
          action: "save_draft",
          version,
          title,
          content,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Saved ${selectedAudience} terms draft (${version})`, "success");
        setIsEditorOpen(false);
        fetchAdminTerms();
      } else {
        showToast(json.error || "Failed to save draft", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving draft", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishTerms = async () => {
    setIsPublishModalOpen(false);
    try {
      setSubmitting(true);
      const res = await fetch("/mdz-crm/api/admin/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAudience: selectedAudience,
          action: "publish",
          version,
          title,
          content,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Published ${selectedAudience} terms ${version}. Re-acceptance active!`, "success");
        setIsEditorOpen(false);
        setIsPreviewOpen(false);
        fetchAdminTerms();
      } else {
        showToast(json.error || "Failed to publish terms", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error publishing terms", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <span>Loading Admin Terms Management...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Terms & Conditions Management"
        description="Admin controls for Employee & Client Terms documents, draft editing, versioning, and publishing."
        badge="OWNER CONTROL"
      />

      {/* Grid of Terms Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Employee Terms */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Employee Terms</h2>
                <span className="text-[11px] text-slate-500">Internal Team Operational Governance</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {data?.employee?.current?.version || "v1.0"} Current
            </span>
          </div>

          <div className="text-xs space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Last Published:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {data?.employee?.current?.publishedAt
                  ? new Date(data.employee.current.publishedAt).toLocaleDateString()
                  : "September 2026"}
              </strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Accepted Count:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {data?.employee?.current?._count?.acceptances || 0} Employees
              </strong>
            </div>

            {data?.employee?.draft && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-between font-semibold">
                <span>Draft Version Available: {data.employee.draft.version}</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60">
                  Unpublished
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => handleOpenEditor("EMPLOYEE")}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs touch-target"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit / Publish Terms</span>
            </button>
          </div>
        </div>

        {/* Card 2: Client Terms */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Client Terms</h2>
                <span className="text-[11px] text-slate-500">Client Portal & Project Agreement</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {data?.client?.current?.version || "v1.0"} Current
            </span>
          </div>

          <div className="text-xs space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Last Published:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {data?.client?.current?.publishedAt
                  ? new Date(data.client.current.publishedAt).toLocaleDateString()
                  : "September 2026"}
              </strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Accepted Count:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {data?.client?.current?._count?.acceptances || 0} Contacts
              </strong>
            </div>

            {data?.client?.draft && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-between font-semibold">
                <span>Draft Version Available: {data.client.draft.version}</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60">
                  Unpublished
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => handleOpenEditor("CLIENT")}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs touch-target"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit / Publish Terms</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sheet Editor */}
      <BottomSheet
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={`Edit ${selectedAudience} Terms & Conditions`}
        subtitle="Saved changes remain in Draft until explicitly published."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Version Tag (e.g. v1.1, v2.0)
            </label>
            <input
              type="text"
              required
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="v1.1"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Document Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Terms and Conditions of Service"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Terms Content</label>
            <textarea
              required
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type or paste the full terms content..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none font-mono text-xs leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSaveDraft}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Save Draft</span>
            </button>

            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex-1 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>Preview & Publish</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Terms Preview ({selectedAudience} - {version})
              </h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 max-h-80 overflow-y-auto">
              {content}
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Publishing will set version {version} as current and immediately require re-acceptance for active {selectedAudience.toLowerCase()}s upon their next request.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Back to Edit
              </button>
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Publish Version {version}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onConfirm={handlePublishTerms}
        title={`Publish ${selectedAudience} Terms Version ${version}`}
        message={`Are you sure you want to publish version ${version}? This will become the authoritative production version and will require re-acceptance from all active ${selectedAudience.toLowerCase()} users.`}
        confirmText="Yes, Publish Now"
      />
    </div>
  );
}
