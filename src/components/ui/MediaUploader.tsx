"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
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
  maxSizeMb = 50,
}: MediaUploaderProps) {
  const { showToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (file.size > maxSizeMb * 1024 * 1024) {
      showToast(`File is too large! Maximum limit is ${maxSizeMb}MB.`, "error");
      return false;
    }

    if (allowedExtensions && allowedExtensions.length > 0) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !allowedExtensions.includes(`.${ext}`)) {
        showToast(`Unsupported file format. Allowed: ${allowedExtensions.join(", ")}`, "error");
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

  const startUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId);
      formData.append("category", category);

      setUploadProgress(50);

      const res = await fetch("/mdz-crm/api/media/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(85);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadProgress(100);
      showToast(`Uploaded "${selectedFile.name}" to Google Drive successfully!`, "success");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (onUploadSuccess) {
        onUploadSuccess(data.file);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      showToast(err?.message || "Failed to upload file to Google Drive.", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

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
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]"
            : "border-slate-300 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/60 dark:bg-slate-900/40"
        } ${uploading ? "pointer-events-none opacity-80" : ""}`}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-500/20">
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7 animate-pulse" />
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {uploading ? "Streaming to Google Drive..." : "Drag & Drop files or Browse"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Max file size: <span className="font-semibold">{maxSizeMb}MB</span> • Category:{" "}
              <span className="font-mono text-indigo-600 dark:text-indigo-400 uppercase font-bold">
                {category}
              </span>
            </p>
          </div>
        </div>

        {uploading && (
          <div className="mt-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {selectedFile && !uploading && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <File className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div className="overflow-hidden text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              title="Remove"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startUpload();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
            >
              Upload to Drive
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
