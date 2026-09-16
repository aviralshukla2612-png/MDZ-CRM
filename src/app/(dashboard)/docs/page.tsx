"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  BookOpen,
  Sparkles,
  Cloud,
  Plus,
  FolderGit2,
  Film,
  Image as ImageIcon,
  FileText,
  Building,
  HardDrive,
  FolderKanban,
  CheckCircle2,
} from "lucide-react";
import { MediaUploader } from "@/components/ui/MediaUploader";
import { MediaGallery } from "@/components/ui/MediaGallery";

export default function DriveStoragePage() {
  const { data: session } = useSession();
  const [showUploader, setShowUploader] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Upload destination state
  const [destinationType, setDestinationType] = useState<"GENERAL" | "PROJECT">("GENERAL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("GENERAL");
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Active gallery view filter
  const [galleryScope, setGalleryScope] = useState<"ALL" | "GENERAL" | "PROJECT">("ALL");
  const [filterProjectId, setFilterProjectId] = useState<string>("");

  useEffect(() => {
    fetchUserProjects();
  }, []);

  const fetchUserProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await fetch("/mdz-crm/api/projects");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProjects(json.data);
        if (json.data.length > 0) {
          setSelectedProjectId(json.data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load projects for drive upload selector:", e);
    } finally {
      setLoadingProjects(false);
    }
  };

  const uploadEntityType = destinationType === "PROJECT" && selectedProjectId ? "PROJECT" : "GENERAL";
  const uploadEntityId = destinationType === "PROJECT" && selectedProjectId ? selectedProjectId : "knowledge-base";

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Google Drive Storage & Files"
        description="Securely upload, stream, and manage videos, design assets, documents, and deliverables stored directly in Google Drive."
        badge="DIRECT DRIVE STORAGE"
        icon={<Cloud className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
      />

      {/* Cloud Storage Highlights Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-200/60 dark:border-indigo-800/40 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Google Drive Storage Active
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-[10px]">
                UP TO 1 GB / FILE
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Supports <strong className="text-slate-800 dark:text-slate-200">Videos (MP4, MOV)</strong>, <strong className="text-slate-800 dark:text-slate-200">Images (PNG, JPG, SVG)</strong>, and <strong className="text-slate-800 dark:text-slate-200">Documents</strong> streamed directly to your company Drive root folder.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowUploader(!showUploader)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{showUploader ? "Hide Uploader" : "Upload File / Video / Image"}</span>
        </button>
      </div>

      {/* Dedicated Upload Drawer / Form */}
      {showUploader && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-indigo-500" />
                <span>Upload to Google Drive</span>
              </h3>
              <p className="text-xs text-slate-500">
                Choose the storage destination folder and category before uploading.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">
                TARGET: {destinationType === "PROJECT" ? "PROJECT WORKSPACE" : "SHARED DRIVE"}
              </span>
            </div>
          </div>

          {/* Destination Selector & Category Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Target Destination Switcher */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Storage Destination
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setDestinationType("GENERAL")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    destinationType === "GENERAL"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  General / Shared
                </button>
                <button
                  type="button"
                  onClick={() => setDestinationType("PROJECT")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    destinationType === "PROJECT"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Project Folder
                </button>
              </div>
            </div>

            {/* If Project Destination: Select Project */}
            {destinationType === "PROJECT" ? (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Target Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full py-2 px-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  {projects.length === 0 ? (
                    <option value="">No projects found</option>
                  ) : (
                    projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.projectNumber || p.projectCode || "PRJ"})
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Google Drive Folder
                </label>
                <div className="py-2 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-400">
                  DriveRoot/General/{selectedCategory}
                </div>
              </div>
            )}

            {/* Category Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Asset Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2 px-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="GENERAL">General Assets & Files</option>
                <option value="VIDEO">Video / Screen Recording</option>
                <option value="IMAGE">Design / Screenshot / Image</option>
                <option value="SPECIFICATION">Technical Specification</option>
                <option value="ASSET">Deliverable Asset</option>
                <option value="CONTRACT">Contract & Handover</option>
              </select>
            </div>
          </div>

          {/* Actual Streaming Uploader */}
          <MediaUploader
            entityType={uploadEntityType}
            entityId={uploadEntityId}
            category={selectedCategory}
            onUploadSuccess={() => {
              setRefreshKey((k) => k + 1);
            }}
          />
        </div>
      )}

      {/* Main Drive Media Gallery Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Google Drive Media & Files Explorer</span>
            </h2>
            <p className="text-xs text-slate-500">
              Browse, search, stream videos, preview images, and download files directly from Google Drive.
            </p>
          </div>

          {/* Gallery Scope Filter */}
          <div className="flex items-center gap-2">
            <select
              value={galleryScope}
              onChange={(e) => setGalleryScope(e.target.value as any)}
              className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none"
            >
              <option value="ALL">All Accessible Files</option>
              <option value="GENERAL">Shared / General Only</option>
              <option value="PROJECT">Project Files Only</option>
            </select>

            {galleryScope === "PROJECT" && projects.length > 0 && (
              <select
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
                className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-none max-w-[180px]"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <MediaGallery
          key={`${refreshKey}_${galleryScope}_${filterProjectId}`}
          entityType={galleryScope === "ALL" ? "ALL" : galleryScope}
          entityId={galleryScope === "PROJECT" && filterProjectId ? filterProjectId : "ALL"}
          allowDelete={true}
        />
      </div>
    </div>
  );
}
