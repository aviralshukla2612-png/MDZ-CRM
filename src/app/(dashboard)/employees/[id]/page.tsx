"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  ArrowLeft,
  UserCheck,
  Clock,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Mail,
  Phone,
  Building,
  Sparkles,
  BarChart3,
  Calendar,
  Coffee,
  AlertCircle,
  LogOut,
  LogIn,
} from "lucide-react";

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<any>(null);
  const [assignedProjs, setAssignedProjs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editSalary, setEditSalary] = useState<number>(0);
  const [confirmStatus, setConfirmStatus] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [holidays, setHolidays] = useState<any[]>([]);

  React.useEffect(() => {
    fetch(`/mdz-crm/api/holidays?year=${selectedYear}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setHolidays(json.data || []);
      })
      .catch((err) => console.error(err));
  }, [selectedYear]);

  const analytics = React.useMemo(() => {
    if (!employee) return null;
    const atts = employee.attendances || [];
    const events = employee.statusEvents || [];

    const monthlyAtts = atts.filter((a: any) => {
      const d = new Date(a.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const monthlyEvents = events.filter((e: any) => {
      const d = new Date(e.startedAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    let totalWorkMinutes = 0;
    let daysPresentCount = 0;
    monthlyAtts.forEach((a: any) => {
      if (a.totalMinutes && a.totalMinutes > 0) {
        totalWorkMinutes += a.totalMinutes;
        daysPresentCount++;
      } else if (a.punchIn) {
        daysPresentCount++;
      }
    });

    const workHoursStr = `${Math.floor(totalWorkMinutes / 60)}h ${String(totalWorkMinutes % 60).padStart(2, "0")}m`;
    const avgWorkMins = daysPresentCount > 0 ? Math.round(totalWorkMinutes / daysPresentCount) : 0;
    const avgWorkStr = `Avg ${Math.floor(avgWorkMins / 60)}h ${String(avgWorkMins % 60).padStart(2, "0")}m / day (${daysPresentCount} days present)`;

    let totalBreakMinutes = 0;
    let breakSessionsCount = 0;
    monthlyEvents.forEach((e: any) => {
      const st = String(e.statusType || "").toUpperCase();
      if (["BREAK", "LUNCH", "TEA_BREAK", "TEA", "LUNCH_BREAK"].includes(st)) {
        breakSessionsCount++;
        if (e.durationMinutes) {
          totalBreakMinutes += e.durationMinutes;
        } else if (e.startedAt && e.endedAt) {
          const diff = Math.round((new Date(e.endedAt).getTime() - new Date(e.startedAt).getTime()) / 60000);
          if (diff > 0) totalBreakMinutes += diff;
        }
      }
    });

    const breakTimeStr = `${Math.floor(totalBreakMinutes / 60)}h ${String(totalBreakMinutes % 60).padStart(2, "0")}m`;
    const breakSubtext = `${breakSessionsCount} break session(s) taken`;

    const halfDaysCount = monthlyAtts.filter((a: any) => a.status === "HALF_DAY" || (a.totalMinutes > 0 && a.totalMinutes < 240)).length;

    const daysInMonthCount = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    let weekendsCount = 0;
    for (let day = 1; day <= daysInMonthCount; day++) {
      const dayOfWeek = new Date(selectedYear, selectedMonth, day).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendsCount++;
      }
    }

    const monthlyHolidays = holidays.filter((h: any) => {
      const d = new Date(h.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const daysOffStr = `${weekendsCount + monthlyHolidays.length} Days Off`;
    const daysOffSubtext = `${monthlyHolidays.length} Official Holidays + ${weekendsCount} Weekends`;

    let sumPunchInMins = 0;
    let cntPunchIn = 0;
    let sumPunchOutMins = 0;
    let cntPunchOut = 0;

    monthlyAtts.forEach((a: any) => {
      if (a.punchIn) {
        const d = new Date(a.punchIn);
        sumPunchInMins += d.getHours() * 60 + d.getMinutes();
        cntPunchIn++;
      }
      if (a.punchOut) {
        const d = new Date(a.punchOut);
        sumPunchOutMins += d.getHours() * 60 + d.getMinutes();
        cntPunchOut++;
      }
    });

    const formatMinsToAmPm = (mins: number) => {
      let h = Math.floor(mins / 60);
      const m = mins % 60;
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12;
      if (h === 0) h = 12;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
    };

    const avgPunchInStr = cntPunchIn > 0 ? formatMinsToAmPm(Math.round(sumPunchInMins / cntPunchIn)) : "--:--";
    const avgPunchOutStr = cntPunchOut > 0 ? formatMinsToAmPm(Math.round(sumPunchOutMins / cntPunchOut)) : "--:--";

    return {
      workHoursStr,
      avgWorkStr,
      breakTimeStr,
      breakSubtext,
      halfDaysCount,
      daysOffStr,
      daysOffSubtext,
      avgPunchInStr,
      avgPunchOutStr,
      cntPunchIn,
      cntPunchOut,
    };
  }, [employee, selectedMonth, selectedYear, holidays]);

  const calendarGrid = React.useMemo(() => {
    if (!employee) return [];
    const atts = employee.attendances || [];
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;

    const cells: any[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ isEmpty: true, id: `empty-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(selectedYear, selectedMonth, day);
      const dayOfWeek = dayDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = isCurrentMonth && today.getDate() === day;

      const att = atts.find((a: any) => {
        const d = new Date(a.date);
        return d.getDate() === day && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });

      const hol = holidays.find((h: any) => {
        const d = new Date(h.date);
        return d.getDate() === day && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });

      let dotColor = "bg-slate-400";
      let workLabel = "0h 0m";

      if (hol) {
        dotColor = "bg-indigo-500";
        workLabel = `🎉 ${hol.title}`;
      } else if (isToday && employee?.punchedIn) {
        dotColor = "bg-blue-500";
        workLabel = att?.totalMinutes ? `${Math.floor(att.totalMinutes / 60)}h ${att.totalMinutes % 60}m` : "0h 0m";
      } else if (att) {
        const mins = att.totalMinutes || 0;
        workLabel = `${Math.floor(mins / 60)}h ${mins % 60}m`;
        if (mins >= 480 || att.status === "PRESENT") {
          dotColor = "bg-emerald-500";
        } else if (mins > 0 || att.status === "HALF_DAY") {
          dotColor = "bg-rose-500";
        } else {
          dotColor = "bg-slate-400";
        }
      } else if (isWeekend) {
        dotColor = "bg-slate-400";
        workLabel = "OFF";
      }

      cells.push({
        isEmpty: false,
        id: `day-${day}`,
        day,
        isWeekend,
        isToday,
        dotColor,
        workLabel,
      });
    }

    return cells;
  }, [employee, selectedMonth, selectedYear]);

  // Project Compensation Modal State
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [selectedProj, setSelectedProj] = useState<any>(null);
  const [compAmountInput, setCompAmountInput] = useState<string>("");
  const [compCurrencyInput, setCompCurrencyInput] = useState<string>("INR");
  const [isClearComp, setIsClearComp] = useState<boolean>(false);

  const handleSaveCompensation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProj) return;
    try {
      let payloadAmount: number | null = null;
      if (!isClearComp && compAmountInput !== "") {
        payloadAmount = Number(compAmountInput);
        if (isNaN(payloadAmount) || payloadAmount < 0) {
          showToast("Please enter a valid non-negative compensation amount", "error");
          return;
        }
      }

      const res = await fetch(`/mdz-crm/api/admin/employees/${params.id}/projects/${selectedProj.id}/compensation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: payloadAmount, currency: compCurrencyInput }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Project compensation updated successfully", "success");
        setIsCompModalOpen(false);
        fetchEmployee();
      } else {
        showToast(json.error || "Failed to update compensation", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  React.useEffect(() => {
    fetchEmployee();
  }, []);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/mdz-crm/api/employees/${params.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        const e = json.data;
        const today = new Date();
        const isToday = (dateStr: string) => {
          const d = new Date(dateStr);
          return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        };
        const todayAtt = e.attendances?.filter((a: any) => isToday(a.date)) || [];
        const isPunchedIn = todayAtt.some((a: any) => a.punchIn && !a.punchOut);
        const isShiftCompleted = todayAtt.some((a: any) => a.punchIn && a.punchOut);

        setEmployee({
          ...e,
          employeeId: e.employeeIdCode,
          name: e.user.name,
          email: e.user.email,
          role: e.user.activeRole,
          designation: e.user.designation,
          department: e.user.department,
          phone: "+91 98980 000" + (e.employeeIdCode?.length > 3 ? e.employeeIdCode.slice(-2) : "01"),
          punchedIn: isPunchedIn,
          shiftCompleted: isShiftCompleted,
          punchInTime: todayAtt[0]?.punchIn ? new Date(todayAtt[0].punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "09:00 AM",
          todayWorkSeconds: (todayAtt[0]?.totalMinutes || 0) * 60,
          currentProject: e.workSessions?.[0]?.project?.name || "General Workspace",
          currentTask: e.workSessions?.[0]?.notes || "Focusing on active tasks",
          assignedProjects: ["PRJ-2026-001"],
          todayTimeline: e.workSessions?.map((w: any) => ({
            id: w.id,
            timeRange: "09:00 AM - 11:00 AM",
            activity: w.notes || "Core development",
            project: w.project?.name || "General",
            duration: `${w.durationMinutes}m`,
          })) || [],
          attendanceRecord: e.attendances?.map((a: any) => ({
            date: new Date(a.date).toLocaleDateString(),
            punchIn: a.punchIn ? new Date(a.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "09:00 AM",
            punchOut: a.punchOut ? new Date(a.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "On-Going",
            status: a.status,
            workHours: `${Math.floor((a.totalMinutes || 0) / 60)}h ${(a.totalMinutes || 0) % 60}m`,
          })) || [],
          isActive: e.user?.isActive !== false,
          empStatus: e.status,
        });
        
        setEditName(e.user?.name || "");
        setEditDesignation(e.user?.designation || "");
        setEditDepartment(e.user?.department || "");
        setEditSalary(e.salaryMonthly || 0);

        const projs = (e.memberships || []).map((m: any) => {
          const activeTasks = (m.project?.tasks || []).filter((t: any) => t.status !== "ARCHIVED");
          const totalTasks = activeTasks.length;
          const completedTasks = activeTasks.filter((t: any) => t.status === "COMPLETED" || t.status === "DONE").length;
          const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

          const now = new Date();
          const empAssignedTasks = activeTasks.filter((t: any) => t.assignedToId === e.user?.id);
          let deliveryStatus = "ON TRACK";
          let deliveryColor = "green";

          if (empAssignedTasks.length > 0) {
            const overdueTask = empAssignedTasks.find((t: any) => t.status !== "COMPLETED" && t.status !== "DONE" && t.deadline && now > new Date(t.deadline));
            if (overdueTask) {
              const days = Math.ceil((now.getTime() - new Date(overdueTask.deadline).getTime()) / (1000 * 60 * 60 * 24));
              deliveryStatus = `DELAYED — ${days} day${days > 1 ? "s" : ""} overdue`;
              deliveryColor = "red";
            }
          } else if (m.project?.targetDeadline) {
            if (now > new Date(m.project.targetDeadline) && progress < 100) {
              const days = Math.ceil((now.getTime() - new Date(m.project.targetDeadline).getTime()) / (1000 * 60 * 60 * 24));
              deliveryStatus = `DELAYED — ${days} day${days > 1 ? "s" : ""} overdue`;
              deliveryColor = "red";
            }
          }

          return {
            id: m.project.id,
            projectNumber: m.project.projectNumber,
            name: m.project.name,
            clientName: m.project.client?.companyName || "Client",
            roleInProject: m.roleInProject,
            progress,
            compensationAmount: m.compensationAmount,
            currency: m.currency || "INR",
            deliveryStatus,
            deliveryColor,
          };
        });
        setAssignedProjs(projs);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"timeline" | "projects" | "attendance" | "help">("timeline");

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/mdz-crm/api/employees/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          designation: editDesignation,
          department: editDepartment,
          salaryMonthly: editSalary,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Employee profile updated successfully", "success");
        setIsEditOpen(false);
        fetchEmployee();
      } else {
        showToast(json.error || "Failed to update employee", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newIsActive = !employee.isActive;
      const newStatus = newIsActive ? "ACTIVE" : "INACTIVE";
      const res = await fetch(`/mdz-crm/api/employees/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: newIsActive,
          status: newStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Employee ${newIsActive ? 'Activated' : 'Deactivated'} successfully`, "success");
        fetchEmployee();
      } else {
        showToast(json.error || "Failed to change status", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 animate-pulse">Loading Employee Data...</div>;
  if (!employee) return <div className="p-12 text-center text-rose-400">Employee Not Found or Access Denied</div>;

  return (
    <div className="space-y-6 pb-16">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/employees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Team Directory</span>
        </Link>
        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {employee.employeeId}
        </span>
      </div>

      {/* Employee Hero Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-xs">
              {employee.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {employee.role}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {employee.department}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                {employee.name}
              </h1>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {employee.designation} • {employee.email}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {employee.punchedIn ? (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>● Working · Punched In at {employee.punchInTime}</span>
              </span>
            ) : employee.shiftCompleted ? (
              <span className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold shadow-xs">
                Shift Completed Today
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                Not Punched In Today
              </span>
            )}
            <button
              onClick={() => setIsEditOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirmStatus(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${employee.isActive ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'}`}
            >
              {employee.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>

        {/* Current Active Focus Pill */}
        <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-1 text-xs">
          <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-300">
            <span>CURRENT FOCUS TASK</span>
            <span className="font-mono text-[11px] text-indigo-700 dark:text-indigo-400">{employee.currentProject}</span>
          </div>
          <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            "{employee.currentTask}"
          </p>
        </div>
      </div>

      {/* Monthly Work & Attendance Analytics */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Monthly Work & Attendance Analytics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly working hours, total break durations, and average punch times
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-").map(Number);
                setSelectedYear(y);
                setSelectedMonth(m);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              {[0, 1, 2, 3, 4, 5].map((offset) => {
                const d = new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
                const year = d.getFullYear();
                const month = d.getMonth();
                const monthName = d.toLocaleString("default", { month: "long" });
                const isCurrent = offset === 0;
                return (
                  <option key={`${year}-${month}`} value={`${year}-${month}`}>
                    {monthName} {year} {isCurrent ? "(Current Month)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* 6 Metric Cards Grid */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Card 1: TOTAL WORK HOURS */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  TOTAL WORK HOURS
                </span>
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                {analytics.workHoursStr}
              </div>
              <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {analytics.avgWorkStr}
              </div>
            </div>

            {/* Card 2: TOTAL BREAK TIME */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  TOTAL BREAK TIME
                </span>
                <Coffee className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                {analytics.breakTimeStr}
              </div>
              <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                {analytics.breakSubtext}
              </div>
            </div>

            {/* Card 3: HALF DAYS / EARLY OUTS */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  HALF DAYS / EARLY OUTS
                </span>
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                {analytics.halfDaysCount} Half Day(s)
              </div>
              <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                0.5 day salary deduction / half day
              </div>
            </div>

            {/* Card 4: HOLIDAYS & DAYS OFF */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  HOLIDAYS & DAYS OFF
                </span>
                <Sparkles className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                {analytics.daysOffStr}
              </div>
              <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                {analytics.daysOffSubtext}
              </div>
            </div>

            {/* Card 5: AVG PUNCH-OUT TIME */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  AVG PUNCH-OUT TIME
                </span>
                <LogOut className="w-4 h-4 text-violet-500" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                {analytics.avgPunchOutStr}
              </div>
              <div className="text-[11px] font-medium text-violet-600 dark:text-violet-400">
                Across {analytics.cntPunchOut} completed shift(s)
              </div>
            </div>

            {/* Card 6: AVG PUNCH-IN TIME */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  AVG PUNCH-IN TIME
                </span>
                <LogIn className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                {analytics.avgPunchInStr}
              </div>
              <div className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400">
                {analytics.cntPunchIn} Working Day(s) Present
              </div>
            </div>
          </div>
        )}

        {/* Monthly Attendance Calendar Grid */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                Monthly Attendance Calendar Grid
              </h3>
            </div>
            <div className="flex items-center flex-wrap gap-3 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Complete Hours</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Early Punch Out</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span>Weekend / Holiday</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Working Today</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((dayName, idx) => (
              <div
                key={dayName}
                className={`text-center font-mono text-[11px] font-bold pb-1 ${
                  idx === 0 ? "text-rose-500" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {dayName}
              </div>
            ))}

            {calendarGrid.map((cell) => {
              if (cell.isEmpty) {
                return (
                  <div
                    key={cell.id}
                    className="min-h-[64px] rounded-xl bg-slate-50/40 dark:bg-slate-900/40 border border-transparent"
                  />
                );
              }
              return (
                <div
                  key={cell.id}
                  className={`min-h-[64px] p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                    cell.isToday
                      ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-blue-500"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className={cell.isWeekend ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}>
                      {cell.day}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${cell.dotColor}`} />
                  </div>

                  <div className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                    {cell.workLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {[
          { id: "timeline", label: `Today Work History (${employee.todayTimeline.length})` },
          { id: "projects", label: `Assigned Projects (${assignedProjs.length})` },
          { id: "attendance", label: `Attendance Records (${employee.attendanceRecord.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Today Work History Timeline ("Who worked on what, when, and for how long?") */}
      {activeTab === "timeline" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Granular Work Execution Log</h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              TODAY'S TOTAL: 4h 15m
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {employee.todayTimeline.map((item: any) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.timeRange}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.project}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.activity}</div>
                </div>

                <div className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0 text-center sm:text-right">
                  ⏱️ {item.duration}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Assigned Projects & Compensation */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          {/* Total Assigned Compensation Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg border border-slate-800">
            <div className="space-y-0.5">
              <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">PROJECT-WISE COMPENSATION SUMMARY</div>
              <div className="text-xs font-semibold text-slate-300">Total Assigned Project Compensation across {assignedProjs.length} assigned projects</div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              ₹{assignedProjs.reduce((sum: number, p: any) => sum + (p.compensationAmount !== null && p.compensationAmount !== undefined ? p.compensationAmount : 0), 0).toLocaleString("en-IN")}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedProjs?.map((p: any) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{p.projectNumber || p.id}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {p.roleInProject || "MEMBER"}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{p.name}</h4>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">🏢 {p.clientName}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 dark:text-slate-400">Project Compensation</span>
                    {p.compensationAmount !== null && p.compensationAmount !== undefined ? (
                      <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                        ₹{p.compensationAmount.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                        Not Set
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-slate-500 dark:text-slate-400">Delivery Performance</span>
                    {p.deliveryColor === "red" ? (
                      <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold font-mono">
                        🔴 {p.deliveryStatus}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold font-mono">
                        🟢 {p.deliveryStatus}
                      </span>
                    )}
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono text-right">{p.progress}% Complete</div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => {
                      setSelectedProj(p);
                      setCompAmountInput(p.compensationAmount !== null && p.compensationAmount !== undefined ? String(p.compensationAmount) : "");
                      setCompCurrencyInput(p.currency || "INR");
                      setIsClearComp(false);
                      setIsCompModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1.5"
                  >
                    <span>{p.compensationAmount !== null && p.compensationAmount !== undefined ? "Edit Amount" : "+ Add Amount"}</span>
                  </button>

                  <Link
                    href={`/projects/${p.id}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all"
                  >
                    Workspace
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Attendance Records */}
      {activeTab === "attendance" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Attendance & Punch Log</h3>
          <div className="space-y-2 text-xs">
            {employee.attendanceRecord.map((rec: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between font-mono">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{rec.date}</span>
                  <span className="text-slate-400 ml-3">In: {rec.punchIn} • Out: {rec.punchOut}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{rec.workHours}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {rec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Employee Bottom Sheet */}
      <BottomSheet
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Employee Profile"
        subtitle="Update employee details and department."
      >
        <form onSubmit={handleUpdateEmployee} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Designation</label>
            <input
              type="text"
              required
              value={editDesignation}
              onChange={(e) => setEditDesignation(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Department</label>
            <input
              type="text"
              required
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Monthly Salary</label>
            <input
              type="number"
              value={editSalary}
              onChange={(e) => setEditSalary(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-2"
          >
            Save Changes
          </button>
        </form>
      </BottomSheet>

      {/* Set Project Compensation Bottom Sheet */}
      <BottomSheet
        isOpen={isCompModalOpen}
        onClose={() => setIsCompModalOpen(false)}
        title="Set Project Compensation"
        subtitle={`Employee: ${employee?.name} | Project: ${selectedProj?.name}`}
      >
        <form onSubmit={handleSaveCompensation} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
            <div className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300">ADMIN CONTROLLED ASSIGNMENT</div>
            <div className="text-slate-800 dark:text-slate-200 font-medium">
              Project compensation is specific to {employee?.name}'s work on {selectedProj?.name}.
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Project Compensation Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="any"
              disabled={isClearComp}
              value={compAmountInput}
              onChange={(e) => setCompAmountInput(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-mono font-bold text-sm disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Currency</label>
            <select
              value={compCurrencyInput}
              onChange={(e) => setCompCurrencyInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-semibold"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="clearComp"
              checked={isClearComp}
              onChange={(e) => setIsClearComp(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="clearComp" className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Clear compensation (Reset to "Not Set")
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCompModalOpen(false)}
              className="w-1/2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all"
            >
              Save Compensation
            </button>
          </div>
        </form>
      </BottomSheet>

      {employee && (
        <ConfirmModal
          isOpen={confirmStatus}
          onClose={() => setConfirmStatus(false)}
          onConfirm={handleToggleStatus}
          title={`${employee.isActive ? 'Deactivate' : 'Activate'} Employee`}
          message={`Are you sure you want to ${employee.isActive ? 'deactivate' : 'activate'} ${employee.name}? ${employee.isActive ? 'They will no longer be able to log in or punch in.' : 'They will regain access to the system.'}`}
          confirmText={employee.isActive ? "Yes, Deactivate" : "Yes, Activate"}
          isDestructive={employee.isActive}
        />
      )}
    </div>
  );
}
