"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PremiumReminderModal } from "./PremiumReminderModal";
import DailyProgressEntryModal, { ProjectOption } from "@/components/projects/DailyProgressEntryModal";
import { useWorkClock } from "@/lib/workClockContext";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";

export function TimeReminders() {
  const { status, startBreak, workSeconds, breakSeconds } = useWorkClock();
  const { data: session } = useSession();
  const { showToast } = useToast();
  
  const [showLunchReminder, setShowLunchReminder] = useState(false);
  const [showDailyTaskReminder, setShowDailyTaskReminder] = useState(false);
  const [showPunchOutReminder, setShowPunchOutReminder] = useState(false);

  // Daily Progress modal state triggered from the reminder
  const [isDailyUpdateOpen, setIsDailyUpdateOpen] = useState(false);
  const [employeeProjects, setEmployeeProjects] = useState<ProjectOption[]>([]);

  // Fetch employee projects for the quick daily update modal
  useEffect(() => {
    if (session?.user && session.user.role === "EMPLOYEE") {
      fetch("/mdz-crm/api/projects")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setEmployeeProjects(
              json.data.map((p: any) => ({
                id: p.id,
                name: p.name,
                projectCode: p.projectCode || p.projectNumber,
                projectNumber: p.projectNumber,
                clientName: p.clientName || p.client?.companyName,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const handleStartBreak = useCallback(
    (type: string, reason: string) => {
      startBreak(type, reason);
    },
    [startBreak]
  );

  useEffect(() => {
    // Only apply to employees who are currently punched in
    if (status === "NOT_PUNCHED_IN" || status === "DAY_COMPLETE") return;
    if (session?.user?.role !== "EMPLOYEE") return;
    
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      const todayDateStr = now.toDateString();
      const employeeId = session?.user?.employeeId || "unknown";
      
      const lunchKey = `lunch_reminder_${employeeId}_${todayDateStr}`;
      const dailyTaskKey = `daily_task_reminder_${employeeId}_${todayDateStr}`;
      const punchOutKey = `punch_out_reminder_${employeeId}_${todayDateStr}`;
      
      // 1:10 PM = 13:10 -> Show Lunch Reminder
      if (hours === 13 && minutes === 10) {
        if (!localStorage.getItem(lunchKey)) {
          if (status === "WORKING") { // Only show if they haven't already taken a break
            setShowLunchReminder(true);
            localStorage.setItem(lunchKey, "true");
          }
        }
      }
      
      // 1:15 PM = 13:15 -> Automatically start lunch break if still working
      const autoLunchKey = `auto_lunch_${employeeId}_${todayDateStr}`;
      if (hours === 13 && minutes === 15) {
        if (!localStorage.getItem(autoLunchKey)) {
          if (status === "WORKING") {
            handleStartBreak("LUNCH", "System: Automatic Lunch Break");
            localStorage.setItem(autoLunchKey, "true");
            setShowLunchReminder(false);
          }
        }
      }

      // 20 MINUTES BEFORE PUNCH OUT (18:40 = 6:40 PM or 8h 40m of active work)
      // Standard shift ends at 19:00 (7:00 PM) -> 20 minutes before is 18:40
      const is20MinsBeforePunchOut = 
        (hours === 18 && minutes >= 40) ||
        (workSeconds + breakSeconds >= 31200);

      if (is20MinsBeforePunchOut) {
        if (!localStorage.getItem(dailyTaskKey)) {
          if (status === "WORKING" || status === "ON_BREAK") {
            setShowDailyTaskReminder(true);
            localStorage.setItem(dailyTaskKey, "true");
            // Also dispatch push notification so user gets alert even on other tabs
            fetch("/mdz-crm/api/notifications/daily-task-reminder", { method: "POST" }).catch(() => {});
          }
        }
      }
      
      // 6:45 PM = 18:45 -> Show Final Punch Out Reminder
      if (hours === 18 && minutes === 45) {
        if (!localStorage.getItem(punchOutKey)) {
          if (status === "WORKING" || status === "ON_BREAK") {
            setShowPunchOutReminder(true);
            localStorage.setItem(punchOutKey, "true");
          }
        }
      }
    };

    const interval = setInterval(checkTime, 30000); // Check every 30 seconds
    checkTime(); // Check immediately on mount/status change

    return () => clearInterval(interval);
  }, [status, session?.user?.employeeId, session?.user?.role, workSeconds, breakSeconds, handleStartBreak]);

  return (
    <>
      {/* Lunch Break Reminder */}
      <PremiumReminderModal
        isOpen={showLunchReminder}
        onClose={() => setShowLunchReminder(false)}
        type="LUNCH"
        title="Time for Lunch Break 🍽️"
        message="It's 1:10 PM! Please take your scheduled lunch break to recharge."
      />

      {/* 20 Mins Before Punch Out: Daily Task Update Reminder */}
      <PremiumReminderModal
        isOpen={showDailyTaskReminder}
        onClose={() => setShowDailyTaskReminder(false)}
        type="DAILY_UPDATE"
        title="Update Your Daily Tasks 📋"
        message="Your shift ends in 20 minutes! Please update your daily task highlights before punching out so Admin and your Clients stay informed."
        actionText="Update Daily Tasks Now 📝"
        onAction={() => setIsDailyUpdateOpen(true)}
        secondaryText="I'll Update in a Moment"
      />
      
      {/* Final Punch Out Reminder */}
      <PremiumReminderModal
        isOpen={showPunchOutReminder}
        onClose={() => setShowPunchOutReminder(false)}
        type="PUNCH_OUT"
        title="Punch Out Reminder 🕔"
        message="It's 6:45 PM! Please wrap up your tasks and prepare to punch out for the day."
      />

      {/* Direct Daily Progress Update Modal */}
      <DailyProgressEntryModal
        projects={employeeProjects}
        isOpen={isDailyUpdateOpen}
        onClose={() => setIsDailyUpdateOpen(false)}
        onSuccess={() => {
          showToast("✓ Daily task updates posted to Client & Admin successfully!", "success");
          setIsDailyUpdateOpen(false);
        }}
      />
    </>
  );
}
