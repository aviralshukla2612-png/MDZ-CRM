"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";

export type ClockState = "NOT_PUNCHED_IN" | "WORKING" | "ON_BREAK" | "DAY_COMPLETE";

export interface TimelineEvent {
  id: string;
  time: string;
  type: "PUNCH_IN" | "WORK" | "BREAK" | "CALL" | "PUNCH_OUT";
  title: string;
  subtitle?: string;
  duration?: string;
  isCurrent?: boolean;
}

interface WorkClockContextType {
  status: ClockState;
  workSeconds: number;
  breakSeconds: number;
  breakType: string;
  breakReason: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  currentProject: string;
  currentTask: string;
  usedLunchSeconds: number;
  usedTeaSeconds: number;
  usedCallSeconds: number;
  lunchAllowanceSeconds: number;
  teaAllowanceSeconds: number;
  callAllowanceSeconds: number;
  locationVerified: boolean;
  deviceVerified: boolean;
  simulatedGeofenceError: boolean;
  simulatedDeviceError: boolean;
  timeline: TimelineEvent[];
  unclosedShift: { id: string; date: string | Date; punchIn: string | Date } | null;
  isBreakActionLoading: boolean;
  isVideographer: boolean;
  targetWorkingHours: number;
  REQUIRED_WORK_SECONDS: number;
  // Actions
  punchIn: () => void;
  startBreak: (type: string, reason?: string) => Promise<void>;
  resumeWork: () => Promise<void>;
  changeWork: (project: string, task: string) => void;
  punchOut: (customRequiredSeconds?: number) => { success: boolean; requiresConfirmation: boolean; remainingSeconds: number };
  confirmPunchOutAnyway: (reason?: string) => Promise<boolean>;
  markPunchOutPending: () => void;
  refreshStatus: () => Promise<void>;
  toggleGeofenceError: () => void;
  toggleDeviceError: () => void;
  formatHMS: (sec: number) => string;
  formatHM: (sec: number) => string;
}

const WorkClockContext = createContext<WorkClockContextType | undefined>(undefined);

const INITIAL_TIMELINE: TimelineEvent[] = [];

export function WorkClockProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ClockState>("NOT_PUNCHED_IN");
  const [isVideographer, setIsVideographer] = useState<boolean>(false);
  const [workSeconds, setWorkSeconds] = useState<number>(0); 
  const [breakSeconds, setBreakSeconds] = useState<number>(0);
  const [breakType, setBreakType] = useState<string>("Lunch");
  const [breakReason, setBreakReason] = useState<string>("");
  const [punchInTime, setPunchInTime] = useState<string | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);

  const [currentProject, setCurrentProject] = useState<string>("General Workspace");
  const [currentTask, setCurrentTask] = useState<string>("Focusing on active tasks");

  const [usedLunchSeconds, setUsedLunchSeconds] = useState<number>(0);
  const [usedTeaSeconds, setUsedTeaSeconds] = useState<number>(0); 
  const [usedCallSeconds, setUsedCallSeconds] = useState<number>(0);
  const [lunchAllowanceSeconds, setLunchAllowanceSeconds] = useState<number>(45 * 60); // 45m default
  const teaAllowanceSeconds = 10 * 60; // 10m
  const callAllowanceSeconds = 120 * 60; // 2h

  // Fetch configured lunch duration allowance
  useEffect(() => {
    fetch("/mdz-crm/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data && json.data.lunch_duration_minutes) {
          const mins = parseInt(json.data.lunch_duration_minutes, 10);
          if (!isNaN(mins) && mins > 0) {
            setLunchAllowanceSeconds(mins * 60);
          }
        }
      })
      .catch(() => {});
  }, []);

  const [locationVerified, setLocationVerified] = useState<boolean>(true);
  const [deviceVerified, setDeviceVerified] = useState<boolean>(true);
  const [simulatedGeofenceError, setSimulatedGeofenceError] = useState<boolean>(false);
  const [simulatedDeviceError, setSimulatedDeviceError] = useState<boolean>(false);

  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_TIMELINE);

  const [unclosedShift, setUnclosedShift] = useState<{ id: string; date: string | Date; punchIn: string | Date } | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isBreakActionLoading, setIsBreakActionLoading] = useState(false);
  const isActionPendingRef = React.useRef<boolean>(false);
  const lastPunchOutStatusRef = React.useRef<string | null>(null);
  const statusRef = React.useRef<ClockState>(status);
  const punchInTimeRef = React.useRef<string | null>(punchInTime);
  const punchOutTimeRef = React.useRef<string | null>(punchOutTime);
  const { showToast } = useToast();
  const { data: session } = useSession();
  const currentEmployeeId = session?.user?.employeeId;

  const [targetWorkingHours, setTargetWorkingHours] = useState<number>(7.0);

  useEffect(() => {
    fetch("/mdz-crm/api/attendance/working-hours")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const empId = session?.user?.employeeId;
          if (empId && json.employees) {
            const found = json.employees.find((e: any) => e.id === empId || e.userId === session?.user?.id);
            if (found && found.targetWorkingHours) {
              setTargetWorkingHours(found.targetWorkingHours);
              return;
            }
          }
          if (json.defaultWorkingHours) {
            setTargetWorkingHours(json.defaultWorkingHours);
          }
        }
      })
      .catch(() => {});
  }, [session?.user?.employeeId, session?.user?.id]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    punchInTimeRef.current = punchInTime;
  }, [punchInTime]);

  useEffect(() => {
    punchOutTimeRef.current = punchOutTime;
  }, [punchOutTime]);

  const pollStatus = React.useCallback(async () => {
    try {
      const employeeId = session?.user?.employeeId;
      if (!employeeId) return; // Don't poll if no employee profile
      
      // Prevent stale poll responses from overwriting actions currently being processed
      if (isActionPendingRef.current) return;

      const res = await fetch(`/mdz-crm/api/attendance/status?employeeId=${employeeId}&t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      
      // Check again after fetch in case user clicked break/punch while fetch was in-flight
      if (isActionPendingRef.current) return;

      if (json.success && json.data) {
        const dbStatus = json.data.punchOutRequestStatus;
        const generalStatus = json.data.status;
        
        if (json.data.isVideographer !== undefined) {
          setIsVideographer(Boolean(json.data.isVideographer));
        }

        if (json.data.unclosedShift) {
          setUnclosedShift(json.data.unclosedShift);
        } else {
          setUnclosedShift(null);
        }

        if (lastPunchOutStatusRef.current === "PENDING" && dbStatus === "APPROVED") {
          showToast("✓ Your early punch-out request was approved!", "success");
          setStatus("DAY_COMPLETE");
          if (json.data.punchOut) {
            const serverTime = new Date(json.data.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            setPunchOutTime(serverTime);
            setTimeline((prev) => [
              ...prev,
              {
                id: `evt-${Date.now()}`,
                time: serverTime,
                type: "PUNCH_OUT",
                title: "Punch Out",
                subtitle: `Day Complete at ${serverTime}`,
              },
            ]);
          }
        } else if (lastPunchOutStatusRef.current === "PENDING" && dbStatus === "REJECTED") {
          showToast("⚠️ Your punch-out request was REJECTED by admin. You must continue working.", "error");
          setStatus("WORKING");
          setPunchOutTime(null);
        } else {
          // Sync with backend only if there is significant drift (> 10 seconds)
          if (json.data.workSeconds !== undefined) {
            setWorkSeconds((prev) => 
              Math.abs(prev - json.data.workSeconds) > 10 ? json.data.workSeconds : prev
            );
          }
          if (json.data.breakSeconds !== undefined) {
            setBreakSeconds((prev) => 
              Math.abs(prev - json.data.breakSeconds) > 10 ? json.data.breakSeconds : prev
            );
          }

          if (json.data.punchIn && !punchInTimeRef.current) {
            setPunchInTime(new Date(json.data.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          }

          if (generalStatus !== statusRef.current) {
            setStatus(generalStatus);
            if (generalStatus === "NOT_PUNCHED_IN") {
              setWorkSeconds(0);
              setBreakSeconds(0);
              setTimeline([]);
            } else if (generalStatus === "DAY_COMPLETE" && json.data.punchOut && !punchOutTimeRef.current) {
              const serverTime = new Date(json.data.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              setPunchOutTime(serverTime);
              setTimeline((prev) => [
                ...prev,
                {
                  id: `evt-${Date.now()}`,
                  time: serverTime,
                  type: "PUNCH_OUT",
                  title: "Punch Out",
                  subtitle: `Day Complete at ${serverTime}`,
                },
              ]);
            }
          }
        }

        lastPunchOutStatusRef.current = dbStatus;
      }
    } catch (err) {}
  }, [session?.user?.employeeId, showToast]);

  // Polling for Attendance Status
  useEffect(() => {
    if (!isLoaded) return;
    pollStatus();
    const intervalId = setInterval(pollStatus, 5000);
    return () => clearInterval(intervalId);
  }, [isLoaded, pollStatus]);

  // Load from localStorage on mount (hydration safe)
  useEffect(() => {
    const employeeId = session?.user?.employeeId;
    if (!employeeId) return;
    const saved = localStorage.getItem(`ess_work_clock_state_v2_${employeeId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.status) setStatus(parsed.status);
        if (parsed.workSeconds !== undefined) setWorkSeconds(parsed.workSeconds);
        if (parsed.breakSeconds !== undefined) setBreakSeconds(parsed.breakSeconds);
        if (parsed.breakType) setBreakType(parsed.breakType);
        if (parsed.breakReason) setBreakReason(parsed.breakReason);
        if (parsed.punchInTime) setPunchInTime(parsed.punchInTime);
        if (parsed.punchOutTime) setPunchOutTime(parsed.punchOutTime);
        if (parsed.currentProject) setCurrentProject(parsed.currentProject);
        if (parsed.currentTask) setCurrentTask(parsed.currentTask);
        if (parsed.usedLunchSeconds !== undefined) setUsedLunchSeconds(parsed.usedLunchSeconds);
        if (parsed.usedTeaSeconds !== undefined) setUsedTeaSeconds(parsed.usedTeaSeconds);
        if (parsed.usedCallSeconds !== undefined) setUsedCallSeconds(parsed.usedCallSeconds);
        if (parsed.timeline) setTimeline(parsed.timeline);
      } catch (e) {
        console.error("Failed to parse work clock state", e);
      }
    } else {
      // Reset if no saved state for this user
      if (status !== "NOT_PUNCHED_IN") setStatus("NOT_PUNCHED_IN");
    }
    setIsLoaded(true);
  }, [session?.user?.employeeId]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    const stateToSave = {
      status,
      workSeconds,
      breakSeconds,
      breakType,
      breakReason,
      punchInTime,
      punchOutTime,
      currentProject,
      currentTask,
      usedLunchSeconds,
      usedTeaSeconds,
      usedCallSeconds,
      timeline,
    };
    const employeeId = session?.user?.employeeId;
    if (!employeeId) return;
    localStorage.setItem(`ess_work_clock_state_v2_${employeeId}`, JSON.stringify(stateToSave));
  }, [
    isLoaded,
    status,
    workSeconds,
    breakSeconds,
    breakType,
    breakReason,
    punchInTime,
    punchOutTime,
    currentProject,
    currentTask,
    usedLunchSeconds,
    usedTeaSeconds,
    usedCallSeconds,
    timeline,
    session?.user?.employeeId,
  ]);

  // Ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (status === "WORKING") {
      interval = setInterval(() => {
        setWorkSeconds((prev) => prev + 1);
      }, 1000);
    } else if (status === "ON_BREAK") {
      interval = setInterval(() => {
        setBreakSeconds((prev) => {
          const next = prev + 1;
          if (breakType === "Lunch") setUsedLunchSeconds((l) => l + 1);
          if (breakType === "Tea") setUsedTeaSeconds((t) => t + 1);
          if (breakType === "Client Call") setUsedCallSeconds((c) => c + 1);
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, breakType]);

  const formatHMS = (sec: number) => {
    const hrs = Math.floor(sec / 3600).toString().padStart(2, "0");
    const mins = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${s}`;
  };

  const formatHM = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins > 0 ? `${mins}m` : "00m"}`;
  };

  const punchIn = () => {
    isActionPendingRef.current = true;
    const now = new Date();
    const formatted = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setPunchInTime(formatted);
    setWorkSeconds(0);
    setBreakSeconds(0);
    setStatus("WORKING");

    setTimeline([
      {
        id: `evt-${Date.now()}`,
        time: formatted,
        type: "PUNCH_IN",
        title: "Punch In",
        subtitle: "Any Device • Anywhere Verified",
      },
    ]);

    setTimeout(() => {
      isActionPendingRef.current = false;
    }, 2000);
  };

  const startBreak = async (type: string, reason?: string) => {
    if (isActionPendingRef.current) return;
    isActionPendingRef.current = true;
    setIsBreakActionLoading(true);

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setBreakType(type);
    setBreakReason(reason || "");
    setBreakSeconds(0);
    setStatus("ON_BREAK");

    setTimeline((prev) => [
      ...prev,
      {
        id: `evt-${Date.now()}`,
        time: now,
        type: type === "Client Call" ? "CALL" : "BREAK",
        title: `${type} Break`,
        subtitle: reason ? `Reason: ${reason}` : `Started at ${now}`,
      },
    ]);

    try {
      const employeeId = session?.user?.employeeId;
      if (employeeId) {
        await fetch("/mdz-crm/api/attendance/breaks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId,
            action: "START",
            statusType: type,
            notes: reason,
          }),
        });
      }
    } catch (e) {
      console.error("Failed to log break start", e);
    } finally {
      setTimeout(() => {
        isActionPendingRef.current = false;
        setIsBreakActionLoading(false);
      }, 1200);
    }
  };

  const resumeWork = async () => {
    if (isActionPendingRef.current) return;
    isActionPendingRef.current = true;
    setIsBreakActionLoading(true);

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setStatus("WORKING");
    showToast("✓ Work session resumed!", "success");

    setTimeline((prev) => [
      ...prev,
      {
        id: `evt-${Date.now()}`,
        time: now,
        type: "WORK",
        title: "Resumed Work",
        subtitle: "Break ended",
      },
    ]);

    try {
      const employeeId = session?.user?.employeeId;
      await fetch("/mdz-crm/api/attendance/breaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeId || undefined,
          action: "END",
        }),
      });
    } catch (e) {
      console.error("Failed to log break end", e);
    } finally {
      setTimeout(() => {
        isActionPendingRef.current = false;
        setIsBreakActionLoading(false);
      }, 1200);
    }
  };

  const changeWork = (proj: string, task: string) => {
    setCurrentProject(proj);
    setCurrentTask(task);
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setTimeline((prev) => [
      ...prev,
      {
        id: `evt-${Date.now()}`,
        time: now,
        type: "WORK",
        title: proj,
        subtitle: task,
      },
    ]);
  };

  const REQUIRED_WORK_SECONDS = (targetWorkingHours || 7.0) * 3600;

  const punchOut = (customRequiredSeconds?: number) => {
    // Videographers can punch out anytime without shift restriction or admin approval requests
    if (isVideographer) {
      confirmPunchOutAnyway();
      return { success: true, requiresConfirmation: false, remainingSeconds: 0 };
    }

    const reqSeconds = customRequiredSeconds ?? REQUIRED_WORK_SECONDS;
    const totalActiveSeconds = workSeconds + breakSeconds;
    if (totalActiveSeconds >= reqSeconds) {
      confirmPunchOutAnyway();
      return { success: true, requiresConfirmation: false, remainingSeconds: 0 };
    } else {
      const remainingSeconds = reqSeconds - totalActiveSeconds;
      return { success: false, requiresConfirmation: true, remainingSeconds };
    }
  };

  const confirmPunchOutAnyway = async (reason?: string): Promise<boolean> => {
    try {
      const res = await fetch("/mdz-crm/api/attendance/punch-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      
      if (json.success) {
        const serverPunchOutTime = new Date(json.data.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        
        setPunchOutTime(serverPunchOutTime);
        setStatus("DAY_COMPLETE");

        setTimeline((prev) => [
          ...prev,
          {
            id: `evt-${Date.now()}`,
            time: serverPunchOutTime,
            type: "PUNCH_OUT",
            title: "Punch Out",
            subtitle: `Day Complete at ${serverPunchOutTime}`,
          },
        ]);
        
        showToast("Successfully punched out for the day.", "success");
        await pollStatus();
        return true;
      } else {
        showToast("Failed to punch out: " + json.error, "error");
        return false;
      }
    } catch (e) {
      console.error("Punch out error:", e);
      showToast("Network error. Please try again.", "error");
      return false;
    }
  };

  const refreshStatus = async () => {
    await pollStatus();
  };

  const toggleGeofenceError = () => setSimulatedGeofenceError((prev) => !prev);
  const toggleDeviceError = () => setSimulatedDeviceError((prev) => !prev);

  const markPunchOutPending = () => {
    lastPunchOutStatusRef.current = "PENDING";
  };

  return (
    <WorkClockContext.Provider
      value={{
        status,
        workSeconds,
        breakSeconds,
        breakType,
        breakReason,
        punchInTime,
        punchOutTime,
        currentProject,
        currentTask,
        usedLunchSeconds,
        usedTeaSeconds,
        usedCallSeconds,
        lunchAllowanceSeconds,
        teaAllowanceSeconds,
        callAllowanceSeconds,
        locationVerified,
        deviceVerified,
        simulatedGeofenceError,
        simulatedDeviceError,
        timeline,
        unclosedShift,
        isBreakActionLoading,
        isVideographer,
        targetWorkingHours,
        REQUIRED_WORK_SECONDS,
        punchIn,
        startBreak,
        resumeWork,
        changeWork,
        punchOut,
        confirmPunchOutAnyway,
        markPunchOutPending,
        refreshStatus,
        toggleGeofenceError,
        toggleDeviceError,
        formatHMS,
        formatHM,
      }}
    >
      {children}
    </WorkClockContext.Provider>
  );
}

export function useWorkClock() {
  const context = useContext(WorkClockContext);
  if (!context) {
    throw new Error("useWorkClock must be used within a WorkClockProvider");
  }
  return context;
}
