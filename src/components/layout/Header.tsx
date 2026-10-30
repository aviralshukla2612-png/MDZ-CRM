"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, LogOut, Coffee, Play, Power, Sparkles, Clock, ShieldCheck, Camera, MessageSquare, Loader2, Film } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { BottomSheet } from "../ui/BottomSheet";
import { useWorkClock } from "@/lib/workClockContext";
import { useToast } from "@/components/ui/Toast";
import { NotificationBell } from "./NotificationBell";
import { AvatarUploadModal } from "../ui/AvatarUploadModal";
import { UnclosedShiftModal } from "../attendance/UnclosedShiftModal";
import { VideographerUploadModal } from "../ui/VideographerUploadModal";
import { useBranding } from "@/components/providers/BrandingProvider";

interface Props {
  currentUser: {
    id?: string;
    name: string;
    email: string;
    role: string;
    designation?: string;
    employeeId?: string;
    avatarUrl?: string | null;
    icon?: any;
  };
  onOpenSearch: () => void;
  onOpenHelpDrawer?: () => void;
  onToggleMobileMenu?: () => void;
  onLogout?: () => void;
}

export function Header({ currentUser, onOpenSearch, onToggleMobileMenu, onLogout }: Props) {
  const { branding, themeStyle } = useBranding();
  const { status, workSeconds, breakSeconds, breakType, formatHMS, punchIn, startBreak, resumeWork, punchOut, confirmPunchOutAnyway, markPunchOutPending, unclosedShift, refreshStatus, isBreakActionLoading, isVideographer } = useWorkClock();
  const { showToast } = useToast();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isUnclosedModalOpen, setIsUnclosedModalOpen] = useState(false);
  const [activeUnclosedRecord, setActiveUnclosedRecord] = useState<any>(null);
  const [currentPhoto, setCurrentPhoto] = useState<string | null | undefined>(currentUser.avatarUrl);

  const [isBreakSheetOpen, setIsBreakSheetOpen] = useState(false);
  const [isPunchOutConfirmOpen, setIsPunchOutConfirmOpen] = useState(false);
  const [punchOutReason, setPunchOutReason] = useState("");
  const [isPunchingIn, setIsPunchingIn] = useState(false);

  // Videographer detection & Shoot footage modal state
  const designationLower = (currentUser.designation || "").toLowerCase();
  const isVideographerUser =
    Boolean(isVideographer) ||
    designationLower.includes("videograph") ||
    designationLower.includes("video graph") ||
    designationLower.includes("cameraman") ||
    designationLower.includes("camera") ||
    designationLower.includes("shooter");

  const [isVideographerUploadModalOpen, setIsVideographerUploadModalOpen] = useState(false);
  const [lastShootDurationStr, setLastShootDurationStr] = useState<string>("");

  // Track active breaks for owner notifications
  const knownBreakStarts = React.useRef<Set<string>>(new Set());
  const knownBreakEnds = React.useRef<Set<string>>(new Set());
  const initialFetchDone = React.useRef(false);

  React.useEffect(() => {
    if (currentUser.role !== "OWNER") return;
    const checkBreaks = async () => {
      try {
        const res = await fetch("/mdz-crm/api/attendance/breaks/today");
        const json = await res.json();
        if (json.success && json.data) {
          json.data.forEach((b: any) => {
            const name = b.employee?.user?.name || "An employee";
            
            // Notification for break start
            if (initialFetchDone.current && !knownBreakStarts.current.has(b.id)) {
              showToast(`☕ ${name} just took a ${b.statusType || "break"}`, "info");
            }
            knownBreakStarts.current.add(b.id);

            // Notification for break end
            if (b.endedAt && initialFetchDone.current && !knownBreakEnds.current.has(b.id)) {
              const start = new Date(b.startedAt).getTime();
              const end = new Date(b.endedAt).getTime();
              const mins = Math.round((end - start) / 60000);
              showToast(`▶️ ${name} has resumed working (Break was ${mins} min)`, "success");
            }
            if (b.endedAt) {
              knownBreakEnds.current.add(b.id);
            }
          });
          initialFetchDone.current = true;
        }
      } catch (e) {}
    };
    // Initial fetch to populate known breaks without notifying
    checkBreaks();
    const interval = setInterval(checkBreaks, 10000); // Check every 10 seconds to be more responsive
    return () => clearInterval(interval);
  }, [currentUser.role, showToast]);

  const handlePunchInClick = async () => {
    if (unclosedShift) {
      setActiveUnclosedRecord(unclosedShift);
      setIsUnclosedModalOpen(true);
      showToast("Please submit your work summary for yesterday's shift before punching in today.", "info");
      return;
    }

    if (isPunchingIn) return;
    setIsPunchingIn(true);
    try {
      const res = await fetch("/mdz-crm/api/attendance/punch-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: currentUser.employeeId }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        if (data.requireUnclosedResolution) {
          setActiveUnclosedRecord({ id: data.unclosedShiftId, date: data.dateStr });
          setIsUnclosedModalOpen(true);
          showToast(data.error || "Please complete yesterday's shift first.", "error");
          return;
        }
        showToast(data.error || "Failed to punch in.", "error");
        setIsPunchingIn(false);
        return;
      }
      
      punchIn();
      showToast("✓ Punched In successfully!", "success");
    } catch (e) {
      showToast("Network error while punching in.", "error");
    } finally {
      setIsPunchingIn(false);
    }
  };

  const handlePunchOutClick = async () => {
    if (isVideographerUser) {
      // Videographers can punch out anytime with 0 early restrictions or approval blocks
      const success = await confirmPunchOutAnyway("Videographer shoot completed");
      await refreshStatus();
      if (success) {
        const totalMinutes = Math.floor(workSeconds / 60);
        const hrs = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const dur = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        setLastShootDurationStr(dur);
        setIsVideographerUploadModalOpen(true);
      }
      return;
    }

    const res = punchOut();
    if (res.requiresConfirmation) {
      setIsPunchOutConfirmOpen(true);
      setIsBreakSheetOpen(false); // close break sheet if open
    } else {
      await confirmPunchOutAnyway();
      await refreshStatus();
    }
  };

  const handleConfirmPunchOutAnyway = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!punchOutReason.trim()) {
      showToast("Please provide a reason for leaving early.", "error");
      return;
    }
    
    try {
      const response = await fetch("/mdz-crm/api/attendance/punch-out-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: currentUser.employeeId, reason: punchOutReason }),
      });
      const data = await response.json();
      
      if (data.success) {
        markPunchOutPending();
        setIsPunchOutConfirmOpen(false);
        showToast("Punch out request submitted for admin approval.", "info");
      } else {
        showToast(data.error || "Failed to submit request", "error");
      }
    } catch (e) {
      showToast("Error submitting request", "error");
    }
  };

  return (
    <header className={`sticky top-0 z-40 bg-white/95 dark:bg-[#12100E]/95 backdrop-blur-2xl border-b ${themeStyle.sidebarBorder} px-2.5 sm:px-4 md:px-6 py-2 flex items-center justify-between shadow-xs dark:shadow-2xl transition-all shrink-0 h-14 sm:h-16 w-full max-w-full overflow-hidden`}>
      {/* Left Brand Logo & Context */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
        {/* Mobile Menu Toggle Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className={`md:hidden w-8 h-8 flex items-center justify-center rounded-xl ${themeStyle.accentBadge} hover:opacity-80 transition-all touch-target shrink-0`}
            title="Toggle Menu"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <Link
          href={
            currentUser.role === "CLIENT"
              ? "/client"
              : currentUser.role === "OWNER" || currentUser.role === "SUB_ADMIN"
              ? "/owner"
              : currentUser.role === "SALES"
              ? "/sales"
              : "/employee"
          }
          className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 select-none group"
        >
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={`${branding.companyName} Logo`}
              className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain rounded-lg shadow-sm ring-1 ${themeStyle.ringClass} group-hover:scale-105 transition-all bg-white dark:bg-slate-900 p-0.5 shrink-0`}
              onError={(e) => {
                // Fallback to default if custom image fails to load
                (e.target as HTMLImageElement).src = "/mdz-crm/mdz-logo.jpg";
              }}
            />
          ) : (
            <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br ${themeStyle.swatchBg} text-white font-black flex items-center justify-center text-xs sm:text-sm shadow-sm shrink-0`}>
              {branding.companyName.charAt(0)}
            </div>
          )}
          <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight font-sans flex items-center gap-1 sm:gap-1.5 select-none min-w-0">
            <span className={`${themeStyle.primaryGradient} bg-clip-text text-transparent font-black truncate max-w-[95px] xs:max-w-[130px] sm:max-w-none`}>
              {branding.companyName}
            </span>
            {branding.brandTagline && (
              <span className={`${themeStyle.secondaryGradient} bg-clip-text text-transparent font-black hidden xs:inline shrink-0`}>
                {branding.brandTagline}
              </span>
            )}
          </span>
        </Link>
      </div>

      {/* Center Search Shortcut (Desktop only - flexible container so it never overlaps controls) */}
      {currentUser.role !== "CLIENT" && (
        <button
          onClick={onOpenSearch}
          className="hidden lg:flex items-center justify-between max-w-xs xl:max-w-sm w-full mx-4 px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-indigo-500/40 text-xs transition-all shadow-xs dark:shadow-lg group shrink"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
            <span className="font-sans truncate">Search Leads, Projects, Employees...</span>
          </div>
          <kbd className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0 ml-2">
            ⌘K
          </kbd>
        </button>
      )}

      {/* Right Controls & Live Work Session Stopwatch (Always shrink-0, never overlapped) */}
      {/* Right Controls & Live Work Session Stopwatch */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0 ml-auto">
        {/* Work Clock Controls Bar (Employees & Sales only, never for Clients or Owner) */}
        {(currentUser.role === "EMPLOYEE" || currentUser.role === "SALES") && (
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {status === "WORKING" && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => setIsBreakSheetOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-sm dark:shadow-lg dark:shadow-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 active:scale-95 transition-all touch-target shrink-0 cursor-pointer"
                title="Active Stopwatch (Click for Break Menu)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="font-mono text-xs">{formatHMS(workSeconds)}</span>
              </button>

              {/* Direct 1-Click Lunch Break Button */}
              <button
                type="button"
                disabled={isBreakActionLoading}
                onClick={() => startBreak("Lunch")}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1 sm:gap-1.5 shadow-md shadow-amber-500/20 transition-all touch-target shrink-0 ${
                  isBreakActionLoading
                    ? "bg-amber-400 cursor-not-allowed opacity-80"
                    : "bg-amber-500 hover:bg-amber-600 active:scale-95 cursor-pointer"
                }`}
                title="Take Lunch Break (1-Click)"
              >
                {isBreakActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <Coffee className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="hidden md:inline">{isBreakActionLoading ? "Starting Lunch..." : "Lunch Break"}</span>
              </button>

              <button
                onClick={handlePunchOutClick}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-rose-600/20 active:scale-95 transition-all touch-target shrink-0 cursor-pointer"
                title="Punch Out for Today"
              >
                <Power className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">Punch Out</span>
              </button>
            </div>
          )}

          {status === "ON_BREAK" && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => setIsBreakSheetOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 text-xs font-bold text-violet-700 dark:text-violet-400 shadow-sm dark:shadow-lg dark:shadow-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 active:scale-95 transition-all touch-target shrink-0"
                title="Click for Break Controls"
              >
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shrink-0" />
                <span className="font-mono text-xs">{formatHMS(breakSeconds)}</span>
              </button>

              <button
                onClick={resumeWork}
                disabled={isBreakActionLoading}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-600/20 active:scale-95 transition-all touch-target shrink-0 ${
                  isBreakActionLoading
                    ? "bg-indigo-400 cursor-not-allowed opacity-80"
                    : "bg-indigo-600 hover:bg-indigo-500 active:scale-95 cursor-pointer"
                }`}
                title="Resume Work Session"
              >
                {isBreakActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                )}
                <span className="hidden md:inline">{isBreakActionLoading ? "Resuming..." : "Resume"}</span>
              </button>
            </div>
          )}

          {status === "NOT_PUNCHED_IN" && (
            <button
              onClick={handlePunchInClick}
              disabled={isPunchingIn}
              className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-1 sm:gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all touch-target shrink-0 ${isPunchingIn ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'}`}
              title="Punch In to Work Clock"
            >
              <Play className="w-3.5 h-3.5 fill-white shrink-0" />
              <span>{isPunchingIn ? "Punching..." : "Punch In"}</span>
            </button>
          )}

          {status === "DAY_COMPLETE" && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold text-xs flex items-center gap-1 sm:gap-1.5 border border-slate-200 dark:border-slate-700/80 cursor-default shrink-0 select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="hidden xs:inline">Shift Complete</span>
                <span className="xs:hidden">Done</span>
              </div>
              {isVideographerUser && (
                <>
                  <button
                    onClick={handlePunchInClick}
                    disabled={isPunchingIn}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-orange-600/20 active:scale-95 transition-all touch-target shrink-0"
                    title="Punch in for next shoot anytime"
                  >
                    <Play className="w-3 h-3 fill-white shrink-0" />
                    <span>New Shoot</span>
                  </button>
                  <button
                    onClick={() => setIsVideographerUploadModalOpen(true)}
                    className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-500/20 active:scale-95 transition-all shrink-0"
                    title="Upload Raw Shoot Footage for Video Editors"
                  >
                    <Film className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden md:inline">Upload Footage</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        )}

        {/* Notification Bell Center */}
        <div className="shrink-0">
          <NotificationBell currentUserId={currentUser.id} />
        </div>

        {/* Chat Shortcut (Internal only) */}
        {currentUser.role !== "CLIENT" && (
          <div className="shrink-0">
            <Link
              href="/chat"
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center touch-target"
              title="Internal Chat"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        )}

        {/* Theme Toggle */}
        <div className="hidden md:block shrink-0">
          <ThemeToggle />
        </div>

        {/* User Profile Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-1 sm:gap-2 p-0.5 sm:p-1 rounded-xl bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 transition-all active:scale-95 touch-target"
            title="Account & Profile"
          >
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt={currentUser.name}
                className="w-7 h-7 sm:w-7 sm:h-7 rounded-lg object-cover shadow-xs border border-indigo-200 dark:border-indigo-800"
              />
            ) : (
              <div className="w-7 h-7 sm:w-7 sm:h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentUser.name[0]?.toUpperCase() || "U"}
              </div>
            )}
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-500 dark:text-slate-400 mr-0.5" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl p-2 z-50 text-xs space-y-1">
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                <div className="relative shrink-0">
                  {currentPhoto ? (
                    <img
                      src={currentPhoto}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover border border-indigo-200 dark:border-indigo-800"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                      {currentUser.name[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsAvatarModalOpen(true);
                    }}
                    className="absolute -bottom-1 -right-1 p-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white border border-white dark:border-slate-900 shadow-xs cursor-pointer"
                    title="Change Photo"
                  >
                    <Camera className="w-2.5 h-2.5" />
                  </button>
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{currentUser.email}</div>
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 pt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    {currentUser.role} ROLE
                  </div>
                </div>
              </div>

              {/* Quick Change Profile Photo Action */}
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setIsAvatarModalOpen(true);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Change Profile Photo</span>
              </button>

              <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 md:hidden flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Appearance</span>
                <ThemeToggle />
              </div>

              {onLogout && (
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2.5 transition-all border-t border-slate-100 dark:border-slate-800"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Session</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={currentPhoto}
        userName={currentUser.name}
        targetUserId={currentUser.id}
        onSuccess={(newUrl) => setCurrentPhoto(newUrl)}
        title="Update Your Profile Photo"
      />

      {/* Break & Punch Out Bottom Sheet */}
      <BottomSheet
        isOpen={isBreakSheetOpen}
        onClose={() => setIsBreakSheetOpen(false)}
        title="Live Work Session Controls"
        subtitle={`Current Status: ${status === 'WORKING' ? 'Working (Stopwatch Active)' : 'On Break'}`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-1">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {status === "WORKING" ? "Active Work Duration" : `Break Duration (${breakType})`}
            </div>
            <div className="text-4xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {status === "WORKING" ? formatHMS(workSeconds) : formatHMS(breakSeconds)}
            </div>
          </div>

          {status === "WORKING" ? (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Take a Break:</span>
              <div className="grid grid-cols-2 gap-2">
                {["Lunch", "Tea", "Client Call", "Meeting"].map((type) => (
                  <button
                    key={type}
                    disabled={isBreakActionLoading}
                    onClick={async () => {
                      setIsBreakSheetOpen(false);
                      await startBreak(type);
                    }}
                    className="p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 text-violet-900 dark:text-violet-300 font-semibold text-xs border border-violet-200 dark:border-violet-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Coffee className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span>{type}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handlePunchOutClick}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all mt-2 cursor-pointer"
              >
                <Power className="w-4 h-4" />
                <span>Punch Out for Today</span>
              </button>
            </div>
          ) : (
            <button
              disabled={isBreakActionLoading}
              onClick={async () => {
                setIsBreakSheetOpen(false);
                await resumeWork();
              }}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isBreakActionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <Play className="w-4 h-4 fill-white shrink-0" />
              )}
              <span>{isBreakActionLoading ? "Resuming..." : "Resume Work Session"}</span>
            </button>
          )}
        </div>
      </BottomSheet>

      {/* Early Punch Out Reason Sheet */}
      <BottomSheet
        isOpen={isPunchOutConfirmOpen}
        onClose={() => setIsPunchOutConfirmOpen(false)}
        title="Early Punch Out Request"
        subtitle="You are leaving before completing 8 hours. Please provide a reason for admin approval."
      >
        <form onSubmit={handleConfirmPunchOutAnyway} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for leaving early
            </label>
            <input
              type="text"
              required
              value={punchOutReason}
              onChange={(e) => setPunchOutReason(e.target.value)}
              placeholder="e.g. Doctor's appointment, family emergency"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Power className="w-4 h-4" />
            <span>Submit Punch Out Request</span>
          </button>
        </form>
      </BottomSheet>

      {/* Unclosed Shift Work Summary Modal */}
      <UnclosedShiftModal
        isOpen={isUnclosedModalOpen}
        onClose={() => setIsUnclosedModalOpen(false)}
        unclosedRecord={activeUnclosedRecord || unclosedShift}
        onSuccess={async () => {
          setIsUnclosedModalOpen(false);
          setActiveUnclosedRecord(null);
          await refreshStatus();
        }}
      />

      {/* Videographer Shoot Footage Upload Modal */}
      <VideographerUploadModal
        isOpen={isVideographerUploadModalOpen}
        onClose={() => setIsVideographerUploadModalOpen(false)}
        videographerName={currentUser.name}
        workedDurationStr={lastShootDurationStr}
      />
    </header>
  );
}
