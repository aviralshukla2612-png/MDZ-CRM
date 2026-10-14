"use client";

import React, { useState, useEffect } from "react";
import {
  Video,
  Camera,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  Film,
  Users,
  Send,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface VideographerUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  videographerName?: string;
  workedDurationStr?: string;
}

export function VideographerUploadModal({
  isOpen,
  onClose,
  videographerName = "Videographer",
  workedDurationStr,
}: VideographerUploadModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editors, setEditors] = useState<{ id: string; name: string; designation: string }[]>([]);

  const [shootTitle, setShootTitle] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [selectedEditorId, setSelectedEditorId] = useState("");
  const [videosCount, setVideosCount] = useState<number>(4);
  const [photosCount, setPhotosCount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Fetch editors
      fetch("/api/videographer/footage-upload")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.editors) {
            setEditors(json.editors);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shootTitle.trim() || !driveUrl.trim()) {
      showToast("Shoot title and Google Drive/Footage URL are required!", "error");
      return;
    }

    try {
      setLoading(true);
      const selectedEditor = editors.find((ed) => ed.id === selectedEditorId);

      const res = await fetch("/api/videographer/footage-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shootTitle: shootTitle.trim(),
          driveUrl: driveUrl.trim(),
          editorId: selectedEditorId || null,
          editorName: selectedEditor?.name || "All Video Editors",
          videosCount,
          photosCount,
          notes: notes.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("🎬 Footage link uploaded! Editors & Admins have been notified.", "success");
        onClose();
        // Reset form
        setShootTitle("");
        setDriveUrl("");
        setNotes("");
      } else {
        showToast(json.error || "Failed to submit footage link", "error");
      }
    } catch (err) {
      showToast("Network error submitting footage", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-[#111622] rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-orange-500/30 dark:border-orange-500/20 shadow-2xl shadow-orange-500/10 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                  Shoot Complete
                </span>
                {workedDurationStr && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    ⏱️ {workedDurationStr}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                Upload Raw Footage for Editors
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 relative z-10 leading-relaxed">
          Great job wrapping up the shoot, <strong>{videographerName}</strong>! Please share the Google Drive / Cloud footage link so video editors can immediately access and edit the videos.
        </p>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs relative z-10">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Shoot / Project Name *
            </label>
            <input
              type="text"
              required
              value={shootTitle}
              onChange={(e) => setShootTitle(e.target.value)}
              placeholder="e.g. Luxury Brand Shoot - 4 Reels & Raw B-Roll"
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-white font-medium outline-none focus:border-orange-500 transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Google Drive / Cloud Folder Link *
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full p-3 pl-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-white font-mono text-[11px] outline-none focus:border-orange-500 transition-all"
              />
              <UploadCloud className="w-4 h-4 text-orange-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assign to Video Editor
              </label>
              <select
                value={selectedEditorId}
                onChange={(e) => setSelectedEditorId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 font-semibold outline-none focus:border-orange-500"
              >
                <option value="">All Video Editors (Broadcast)</option>
                {editors.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.name} ({ed.designation || "Editor"})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Videos</label>
                <input
                  type="number"
                  min="0"
                  value={videosCount}
                  onChange={(e) => setVideosCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-center font-bold text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Photos</label>
                <input
                  type="number"
                  min="0"
                  value={photosCount}
                  onChange={(e) => setPhotosCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-center font-bold text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Editor Instructions / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Clip 03 is the hero take, please add captions and warm color grade..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold transition-all text-xs"
            >
              I&apos;ll Upload Later
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold shadow-lg shadow-orange-600/30 transition-all text-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Notifying Team...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Notify Editors & Management 🚀
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
