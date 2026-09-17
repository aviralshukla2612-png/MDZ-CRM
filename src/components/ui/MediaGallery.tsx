"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  File,
  Film,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  FolderOpen,
  X,
  Search,
  Play,
  Layers,
  Sparkles,
  Cloud,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface MediaFileItem {
  id: string;
  driveFileId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
    activeRole: string;
  };
}

interface MediaGalleryProps {
  entityType?: string;
  entityId?: string;
  initialCategory?: string;
  allowDelete?: boolean;
  className?: string;
  onDeleteSuccess?: () => void;
}

export function MediaGallery({
  entityType = "ALL",
  entityId = "ALL",
  initialCategory = "ALL",
  allowDelete = true,
  className = "",
  onDeleteSuccess,
}: MediaGalleryProps) {
  const { showToast } = useToast();
  const [files, setFiles] = useState<MediaFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedMediaType, setSelectedMediaType] = useState<"ALL" | "video" | "image" | "document">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<MediaFileItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityType && entityType !== "ALL") params.append("entityType", entityType);
      if (entityId && entityId !== "ALL") params.append("entityId", entityId);
      if (selectedCategory && selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (selectedMediaType && selectedMediaType !== "ALL") params.append("type", selectedMediaType);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const url = `/mdz-crm/api/media?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setFiles(data.files || []);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error("Failed to load media files:", err);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, selectedCategory, selectedMediaType, searchQuery]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = async (file: MediaFileItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${file.originalName}" from Google Drive?`)) {
      return;
    }

    setDeletingId(file.id);
    try {
      const res = await fetch(`/mdz-crm/api/media/${file.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast("File permanently deleted from Google Drive.", "success");
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
        if (previewFile?.id === file.id) setPreviewFile(null);
        if (onDeleteSuccess) onDeleteSuccess();
      } else {
        throw new Error(data.error || "Failed to delete file.");
      }
    } catch (err: any) {
      showToast(err?.message || "Delete failed", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const isVideo = (mimeType: string, name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    return mimeType.startsWith("video/") || ["mp4", "mov", "mkv", "avi", "webm"].includes(ext);
  };

  const isImage = (mimeType: string, name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    return mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext);
  };

  const getFileIcon = (mimeType: string, name: string) => {
    if (isVideo(mimeType, name)) {
      return <Film className="w-6 h-6 text-purple-600 dark:text-purple-400" />;
    }
    if (isImage(mimeType, name)) {
      return <ImageIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
    }
    if (mimeType.includes("pdf")) {
      return <FileText className="w-6 h-6 text-rose-500" />;
    }
    if (mimeType.includes("spreadsheet") || name.endsWith(".xlsx") || name.endsWith(".csv")) {
      return <FileSpreadsheet className="w-6 h-6 text-teal-500" />;
    }
    if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("compressed")) {
      return <FileArchive className="w-6 h-6 text-amber-500" />;
    }
    return <File className="w-6 h-6 text-indigo-500" />;
  };

  const categories = ["ALL", "GENERAL", "ASSET", "SPECIFICATION", "CONTRACT", "INTERNAL"];

  const mediaTypeTabs: Array<{ id: "ALL" | "video" | "image" | "document"; label: string; icon: any }> = [
    { id: "ALL", label: "All Assets", icon: Layers },
    { id: "video", label: "Videos", icon: Film },
    { id: "image", label: "Images", icon: ImageIcon },
    { id: "document", label: "Docs & Files", icon: FileText },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Filter Bar */}
      <div className="space-y-4">
        {/* Search & Media Type Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Media Type Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            {mediaTypeTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedMediaType(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedMediaType === tab.id
                      ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input & Refresh Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drive files..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => fetchFiles()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Refresh Drive files"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold font-mono transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Media Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs font-medium">Fetching Google Drive assets & storage telemetry...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="py-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Cloud className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No files found in Google Drive
          </p>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchQuery
              ? `No files matched "${searchQuery}". Try a different search term or category.`
              : "Upload videos, images, or documents above to store them directly in Google Drive."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => {
            const hasVideo = isVideo(file.mimeType, file.originalName);
            const hasImage = isImage(file.mimeType, file.originalName);

            return (
              <div
                key={file.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3 group"
              >
                {/* Visual Thumbnail if Image or Video */}
                {hasImage ? (
                  <div
                    onClick={() => setPreviewFile(file)}
                    className="relative w-full h-36 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 cursor-pointer border border-slate-200/60 dark:border-slate-800 group-hover:opacity-95 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/mdz-crm/api/media/${file.id}/download`}
                      alt={file.originalName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-sm">
                        IMAGE
                      </span>
                    </div>
                  </div>
                ) : hasVideo ? (
                  <div
                    onClick={() => setPreviewFile(file)}
                    className="relative w-full h-36 rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center cursor-pointer border border-purple-900/40 group-hover:scale-[1.01] transition-transform"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 group-hover:bg-purple-500 transition-colors">
                      <Play className="w-5 h-5 ml-0.5 fill-white text-white" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end justify-between p-2.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-700/50 backdrop-blur-sm">
                        STREAMABLE VIDEO
                      </span>
                      <span className="text-[10px] font-mono text-slate-300">
                        {formatFileSize(file.fileSize)}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* File Header */}
                <div className="flex items-start gap-3">
                  {!hasImage && !hasVideo && (
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                      {getFileIcon(file.mimeType, file.originalName)}
                    </div>
                  )}

                  <div className="overflow-hidden flex-1">
                    <h4
                      title={file.originalName}
                      className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                    >
                      {file.originalName}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-semibold">
                        {formatFileSize(file.fileSize)}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                        {file.category}
                      </span>
                      {file.entityType === "PROJECT" && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          PROJECT
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* File Footer: Uploader info & action buttons */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="text-[11px] truncate max-w-[130px]" title={file.uploadedBy?.email || ""}>
                    By: <strong className="text-slate-800 dark:text-slate-200">{file.uploadedBy?.name || "Member"}</strong>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* In-browser preview */}
                    <button
                      onClick={() => setPreviewFile(file)}
                      title="Preview file"
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Proxied CRM download */}
                    <a
                      href={`/mdz-crm/api/media/${file.id}/download?download=true`}
                      title="Download file"
                      download={file.originalName}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    {/* Delete file */}
                    {allowDelete && (
                      <button
                        onClick={() => handleDelete(file)}
                        disabled={deletingId === file.id}
                        title="Delete from Google Drive"
                        className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-Browser Preview Modal with Video Player Support */}
      {previewFile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
                  {getFileIcon(previewFile.mimeType, previewFile.originalName)}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {previewFile.originalName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {formatFileSize(previewFile.fileSize)} • Category: {previewFile.category} • Uploaded by {previewFile.uploadedBy?.name || "Staff"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/mdz-crm/api/media/${previewFile.id}/download?download=true`}
                  download={previewFile.originalName}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100/60 dark:bg-slate-950 flex items-center justify-center min-h-[420px]">
              {isVideo(previewFile.mimeType, previewFile.originalName) ? (
                /* HTML5 Video Streaming Player directly from Google Drive */
                <div className="w-full max-w-3xl flex flex-col items-center gap-2">
                  <video
                    controls
                    autoPlay
                    playsInline
                    src={`/mdz-crm/api/media/${previewFile.id}/download`}
                    className="max-h-[70vh] w-full rounded-2xl shadow-2xl bg-black border border-slate-800"
                  >
                    Your browser does not support the video tag.
                  </video>
                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5" />
                    Direct Google Drive Stream
                  </span>
                </div>
              ) : isImage(previewFile.mimeType, previewFile.originalName) ? (
                /* High-Res Image Preview */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/mdz-crm/api/media/${previewFile.id}/download`}
                  alt={previewFile.originalName}
                  className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-200 dark:border-slate-800"
                />
              ) : previewFile.mimeType === "application/pdf" ? (
                /* PDF Viewer */
                <iframe
                  src={`/mdz-crm/api/media/${previewFile.id}/download`}
                  className="w-full h-[72vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white"
                  title={previewFile.originalName}
                />
              ) : (
                /* Generic Document Fallback */
                <div className="text-center py-12 space-y-4">
                  <File className="w-16 h-16 text-indigo-500/60 mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      Direct in-browser preview unavailable
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      File type ({previewFile.mimeType}) can be downloaded securely to view.
                    </p>
                  </div>
                  <a
                    href={`/mdz-crm/api/media/${previewFile.id}/download?download=true`}
                    download={previewFile.originalName}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {previewFile.originalName}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
