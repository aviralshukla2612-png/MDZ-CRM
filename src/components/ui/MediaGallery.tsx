"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  File,
  Download,
  Trash2,
  Eye,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  X,
  Lock,
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
  entityType: string;
  entityId: string;
  initialCategory?: string;
  allowDelete?: boolean;
}

export function MediaGallery({
  entityType,
  entityId,
  initialCategory = "ALL",
  allowDelete = true,
}: MediaGalleryProps) {
  const { showToast } = useToast();
  const [files, setFiles] = useState<MediaFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [previewFile, setPreviewFile] = useState<MediaFileItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/mdz-crm/api/media?entityType=${encodeURIComponent(
        entityType
      )}&entityId=${encodeURIComponent(entityId)}${
        selectedCategory !== "ALL" ? `&category=${encodeURIComponent(selectedCategory)}` : ""
      }`;

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
  }, [entityType, entityId, selectedCategory]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = async (file: MediaFileItem) => {
    if (!confirm(`Are you sure you want to permanently delete "${file.originalName}"?`)) {
      return;
    }

    setDeletingId(file.id);
    try {
      const res = await fetch(`/mdz-crm/api/media/${file.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast("File deleted from Google Drive.", "success");
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
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

  const getFileIcon = (mimeType: string, name: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="w-6 h-6 text-emerald-500" />;
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

  const categories = ["ALL", "SPECIFICATION", "ASSET", "CONTRACT", "GENERAL"];

  return (
    <div className="space-y-6">
      {/* Category Tabs & Refresh Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={fetchFiles}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Files Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
          <p className="text-xs font-medium">Fetching media assets from Google Drive...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="py-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-3">
          <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No files found in Google Drive
          </p>
          <p className="text-xs text-slate-500">
            Files uploaded above will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-5 rounded-3xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                  {getFileIcon(file.mimeType, file.originalName)}
                </div>

                <div className="overflow-hidden">
                  <h4
                    title={file.originalName}
                    className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                  >
                    {file.originalName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {formatFileSize(file.fileSize)}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                      {file.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="text-[11px] truncate max-w-[120px]">
                  By: <strong className="text-slate-700 dark:text-slate-300">{file.uploadedBy?.name || "System"}</strong>
                </span>

                <div className="flex items-center gap-1">
                  {/* In-browser preview */}
                  <button
                    onClick={() => setPreviewFile(file)}
                    title="Preview file"
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </button>

                  {/* Proxied CRM download */}
                  <a
                    href={`/mdz-crm/api/media/${file.id}/download?download=true`}
                    title="Download file"
                    download={file.originalName}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </a>

                  {/* Delete file */}
                  {allowDelete && (
                    <button
                      onClick={() => handleDelete(file)}
                      disabled={deletingId === file.id}
                      title="Delete from Google Drive"
                      className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-Browser Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  {getFileIcon(previewFile.mimeType, previewFile.originalName)}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {previewFile.originalName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {formatFileSize(previewFile.fileSize)} • Category: {previewFile.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
            <div className="flex-1 overflow-auto p-4 bg-slate-100/50 dark:bg-slate-950/50 flex items-center justify-center min-h-[400px]">
              {previewFile.mimeType.startsWith("image/") ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/mdz-crm/api/media/${previewFile.id}/download`}
                  alt={previewFile.originalName}
                  className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-lg border border-slate-200 dark:border-slate-800"
                />
              ) : previewFile.mimeType === "application/pdf" ? (
                <iframe
                  src={`/mdz-crm/api/media/${previewFile.id}/download`}
                  className="w-full h-[70vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white"
                  title={previewFile.originalName}
                />
              ) : (
                <div className="text-center py-12 space-y-4">
                  <File className="w-16 h-16 text-indigo-500/60 mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      Direct browser preview unavailable
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      This file type ({previewFile.mimeType}) cannot be embedded directly in the browser.
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
