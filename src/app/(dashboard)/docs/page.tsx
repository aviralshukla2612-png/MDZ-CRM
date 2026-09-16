"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookOpen, Sparkles, Cloud, Plus, FolderGit2 } from "lucide-react";
import { MediaUploader } from "@/components/ui/MediaUploader";
import { MediaGallery } from "@/components/ui/MediaGallery";

export default function DocsPage() {
  const [showUploader, setShowUploader] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Project Living Knowledge Base"
        description="Centralized repository for technical specifications, architecture diagrams, contracts, and handovers stored securely in Google Drive."
        badge="GOOGLE DRIVE ASSETS"
        icon={<BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
      />

      {/* Cloud Storage Highlights Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/60 dark:border-indigo-800/40 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              Direct Google Drive Integration Active
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Files are streamed through secure CRM proxies with RBAC and multi-tenant isolation.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowUploader(!showUploader)}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{showUploader ? "Close Uploader" : "Upload Document"}</span>
        </button>
      </div>

      {/* Conditional Uploader */}
      {showUploader && (
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-indigo-200 dark:border-indigo-800/60 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-indigo-500" />
              <span>Upload Specification / Knowledge Asset</span>
            </h3>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">
              DRIVE ROOT
            </span>
          </div>

          <MediaUploader
            entityType="GENERAL"
            entityId="knowledge-base"
            category="SPECIFICATION"
            onUploadSuccess={() => {
              setShowUploader(false);
              setRefreshKey((k) => k + 1);
            }}
          />
        </div>
      )}

      {/* Main Drive Media Gallery */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Specifications & Project Assets Register</span>
          </h2>
        </div>

        <MediaGallery
          key={refreshKey}
          entityType="GENERAL"
          entityId="knowledge-base"
          allowDelete={true}
        />
      </div>
    </div>
  );
}
