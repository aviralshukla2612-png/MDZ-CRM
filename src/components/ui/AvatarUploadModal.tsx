"use client";

import React, { useState, useRef } from "react";
import { BottomSheet } from "./BottomSheet";
import { Camera, Upload, Trash2, Check, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "./Toast";
import { useSession } from "next-auth/react";

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  userName?: string;
  targetUserId?: string;
  targetEmployeeId?: string;
  onSuccess: (newAvatarUrl: string | null) => void;
  title?: string;
}

export function AvatarUploadModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  userName = "User",
  targetUserId,
  targetEmployeeId,
  onSuccess,
  title = "Update Profile Photo",
}: AvatarUploadModalProps) {
  const { showToast } = useToast();
  const { data: session, update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setPreviewUrl(null);
      setSelectedFile(null);
    }
  }, [isOpen]);

  // Compress & resize image client-side to ensure fast uploads & crisp rendering
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (PNG, JPG, WEBP).", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("File is too large. Please select an image under 10MB.", "error");
      return;
    }

    try {
      const compressedDataUrl = await processImageFile(file);
      setSelectedFile(file);
      setPreviewUrl(compressedDataUrl);
    } catch (err) {
      showToast("Error reading image file", "error");
    }
  };

  const handleSave = async () => {
    if (!previewUrl) return;

    try {
      setSaving(true);
      const res = await fetch("/mdz-crm/api/users/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarUrl: previewUrl,
          targetUserId,
          targetEmployeeId,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("✓ Profile photo updated successfully!", "success");
        // If this update was for the current logged-in user, update session live
        if (!targetUserId || targetUserId === (session?.user as any)?.id) {
          try {
            await updateSession({ avatarUrl: json.avatarUrl });
          } catch (e) {}
        }
        onSuccess(json.avatarUrl);
        onClose();
      } else {
        showToast(json.error || "Failed to update photo", "error");
      }
    } catch (e) {
      showToast("Network error uploading photo", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    try {
      setRemoving(true);
      const params = new URLSearchParams();
      if (targetUserId) params.set("userId", targetUserId);
      if (targetEmployeeId) params.set("employeeId", targetEmployeeId);

      const res = await fetch(`/mdz-crm/api/users/avatar?${params.toString()}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (json.success) {
        showToast("✓ Profile photo removed successfully", "success");
        if (!targetUserId || targetUserId === (session?.user as any)?.id) {
          try {
            await updateSession({ avatarUrl: null });
          } catch (e) {}
        }
        onSuccess(null);
        onClose();
      } else {
        showToast(json.error || "Failed to remove photo", "error");
      }
    } catch (e) {
      showToast("Network error removing photo", "error");
    } finally {
      setRemoving(false);
    }
  };

  const activeDisplayUrl = previewUrl || currentAvatarUrl;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} subtitle={`Profile picture for ${userName}`}>
      <div className="space-y-6 text-xs pb-2">
        {/* Avatar Preview Box */}
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl shadow-indigo-600/10 flex items-center justify-center bg-gradient-to-tr from-indigo-600 to-purple-600">
              {activeDisplayUrl ? (
                <img
                  src={activeDisplayUrl}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-white">
                  {userName[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95 transition-all border-2 border-white dark:border-slate-900 cursor-pointer"
              title="Select Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center space-y-1">
            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {userName}
            </div>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Upload a clear face photo or avatar. JPG, PNG, or WEBP (up to 10MB).
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Action Controls */}
        <div className="space-y-2">
          {previewUrl ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Photo...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Photo</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
                className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Photo</span>
              </button>

              {currentAvatarUrl && (
                <button
                  type="button"
                  disabled={removing}
                  onClick={handleRemove}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {removing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Remove Photo</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
