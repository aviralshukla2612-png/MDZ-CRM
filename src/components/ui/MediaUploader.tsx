"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  File,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Film,
  Image as ImageIcon,
  FileText,
  Zap,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface MediaUploaderProps {
  entityType: string;
  entityId: string;
  category?: string;
  onUploadSuccess?: (file: any) => void;
  allowedExtensions?: string[];
  maxSizeMb?: number;
}

export function MediaUploader({
  entityType,
  entityId,
  category = "GENERAL",
  onUploadSuccess,
  allowedExtensions,
  maxSizeMb = 10240, // Default 10GB (10240MB)
}: MediaUploaderProps) {
  const { showToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("");
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<"IDLE" | "UPLOADING" | "FINALIZING">("IDLE");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const uploadStartTimeRef = useRef<number>(0);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(i >= 2 ? 1 : 0)} ${sizes[i]}`;
  };

  const formatEta = (seconds: number | null): string => {
    if (seconds === null || isNaN(seconds) || seconds <= 0) return "";
    if (seconds < 60) return `${Math.round(seconds)}s remaining`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s remaining`;
  };

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (type.startsWith("video/") || ["mp4", "mov", "mkv", "avi", "webm"].includes(ext)) {
      return <Film className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />;
    }
    if (type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) {
      return <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    }
    return <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />;
  };

  const validateFile = (file: File): boolean => {
    const maxLimitBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxLimitBytes) {
      const maxDisplay = maxSizeMb >= 1024 ? `${(maxSizeMb / 1024).toFixed(1)} GB` : `${maxSizeMb} MB`;
      showToast(`File is too large! Maximum limit is ${maxDisplay}.`, "error");
      return false;
    }

    if (allowedExtensions && allowedExtensions.length > 0) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !allowedExtensions.includes(`.${ext}`)) {
        showToast(`Unsupported format. Allowed: ${allowedExtensions.join(", ")}`, "error");
        return false;
      }
    }
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setUploading(false);
    setUploadProgress(0);
    setUploadPhase("IDLE");
    setUploadSpeed("");
    setEtaSeconds(null);
    showToast("Upload cancelled.", "info");
  };

  const startUpload = () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(1);
    setUploadPhase("UPLOADING");
    setUploadedBytes(0);
    setTotalBytes(selectedFile.size);
    uploadStartTimeRef.current = Date.now();

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("entityType", entityType);
    formData.append("entityId", entityId);
    formData.append("category", category);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    // Accurate real-time byte-level upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        setUploadProgress(percent);
        setUploadedBytes(event.loaded);
        setTotalBytes(event.total);

        // Speed & ETA estimation
        const elapsedTimeSec = (Date.now() - uploadStartTimeRef.current) / 1000;
        if (elapsedTimeSec > 0.5) {
          const bytesPerSec = event.loaded / elapsedTimeSec;
          setUploadSpeed(`${formatBytes(bytesPerSec)}/s`);

          const remainingBytes = event.total - event.loaded;
          const remainingSec = remainingBytes / bytesPerSec;
          setEtaSeconds(remainingSec);
        }

        if (event.loaded >= event.total) {
          setUploadPhase("FINALIZING");
          setUploadProgress(100);
        }
      }
    };

    xhr.onload = () => {
      xhrRef.current = null;
      setUploading(false);
      setUploadPhase("IDLE");

      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          showToast(`Uploaded "${selectedFile.name}" to Google Drive successfully!`, "success");
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          if (onUploadSuccess) {
            onUploadSuccess(response.file);
          }
        } else {
          showToast(response.error || "Failed to upload file to Google Drive.", "error");
        }
      } catch (parseErr) {
        showToast("Error processing server response.", "error");
      }
    };

    xhr.onerror = () => {
      xhrRef.current = null;
      setUploading(false);
      setUploadPhase("IDLE");
      showToast("Network error during upload to Google Drive.", "error");
    };

    xhr.onabort = () => {
      xhrRef.current = null;
      setUploading(false);
      setUploadPhase("IDLE");
    };

    xhr.open("POST", "/mdz-crm/api/media/upload");
    xhr.send(formData);
  };

  const limitDisplay = maxSizeMb >= 1024 ? `${(maxSizeMb / 1024).toFixed(0)} GB` : `${maxSizeMb} MB`;

  return (
    <div className="w-full space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-6 md:p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 scale-[1.01]"
            : "border-slate-300 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 bg-slate-50/60 dark:bg-slate-900/40"
        } ${uploading ? "pointer-events-none opacity-90" : ""}`}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm border border-amber-500/30">
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            ) : (
              <UploadCloud className="w-7 h-7 animate-pulse text-amber-500" />
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {uploading
                ? uploadPhase === "FINALIZING"
                  ? "Finalizing & Saving to Google Drive..."
                  : "Streaming file directly to Google Drive..."
                : "Drag & Drop files or Browse from device"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports <span className="font-semibold text-slate-700 dark:text-slate-300">Images, Videos (MP4/MOV) & Docs</span> up to{" "}
              <span className="font-bold text-amber-600 dark:text-amber-400">{limitDisplay}</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Category:{" "}
              <span className="font-mono text-amber-600 dark:text-amber-400 uppercase font-bold">
                {category}
              </span>
            </p>
          </div>
        </div>

        {/* Real-time Dynamic Progress Bar & Live Telemetry */}
        {uploading && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-900/90 text-white shadow-xl border border-slate-700 backdrop-blur-md text-left space-y-3">
            {/* Header: Status & Percent */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                {uploadPhase === "FINALIZING" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span className="text-amber-300 font-bold">Saving file to Google Drive...</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <span className="text-slate-200">Uploading payload...</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-base font-extrabold text-amber-400 font-mono">
                  {uploadProgress}%
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelUpload();
                  }}
                  className="px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-[10px] font-bold border border-rose-500/30 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Glowing animated progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 transition-all duration-200 shadow-lg shadow-amber-500/50"
                style={{ width: `${Math.max(3, uploadProgress)}%` }}
              />
            </div>

            {/* Sub-telemetry: Bytes transferred, Speed & ETA */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold">{formatBytes(uploadedBytes)}</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400">{formatBytes(totalBytes)}</span>
              </div>

              <div className="flex items-center gap-3">
                {uploadSpeed && (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Zap className="w-3 h-3" />
                    {uploadSpeed}
                  </span>
                )}
                {etaSeconds !== null && etaSeconds > 0 && (
                  <span className="flex items-center gap-1 text-sky-400 font-semibold">
                    <Clock className="w-3 h-3" />
                    {formatEta(etaSeconds)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected File Card Ready for Upload */}
      {selectedFile && !uploading && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/40 dark:border-amber-800/60 shadow-sm transition-all">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
              {getFileIcon(selectedFile)}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-semibold">
                  {formatBytes(selectedFile.size)}
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                  Ready to stream
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              title="Remove selected file"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startUpload();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4 text-slate-950" />
              <span>Upload to Drive</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
