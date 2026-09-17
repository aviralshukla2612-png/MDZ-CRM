"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderKanban,
  User,
  Search,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Check,
  Star,
  Layers,
  X,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";

export interface TaskCalendarItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  deadline?: string | null;
  startDate?: string | null;
  createdAt: string;
  completedAt?: string | null;
  isMostImportant?: boolean;
  assignedToId?: string | null;
  assignee?: string;
  assigneeAvatar?: string | null;
  projectId?: string;
  projectName?: string;
  clientName?: string;
  project?: {
    id: string;
    name: string;
    projectNumber?: string;
    client?: {
      companyName?: string;
    };
  };
  assignedTo?: {
    id: string;
    name: string;
    designation?: string;
    avatarUrl?: string | null;
  };
}

interface ProjectTaskCalendarProps {
  tasks?: TaskCalendarItem[];
  allProjects: any[];
  employees: any[];
  onRefresh?: () => void;
  selectedEmployeeId?: string;
  onSelectEmployee?: (empId: string) => void;
  isCompact?: boolean;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function ProjectTaskCalendar({
  tasks: propTasks,
  allProjects,
  employees,
  onRefresh,
  selectedEmployeeId = "ALL",
  onSelectEmployee,
  isCompact = false,
}: ProjectTaskCalendarProps) {
  const { showToast } = useToast();
  const today = useMemo(() => new Date(), []);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Filters
  const [filterDeveloper, setFilterDeveloper] = useState<string>(selectedEmployeeId || "ALL");
  const [filterProject, setFilterProject] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // New Task Modal State
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskProjectId, setNewTaskProjectId] = useState(allProjects[0]?.id || "");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState(
    filterDeveloper !== "ALL" ? filterDeveloper : ""
  );
  const [newTaskPriority, setNewTaskPriority] = useState("HIGH");
  const [newTaskStatus, setNewTaskStatus] = useState("TODO");
  const [newTaskDeadline, setNewTaskDeadline] = useState(
    selectedDate.toISOString().split("T")[0]
  );
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Sync selectedEmployeeId if changed from props
  React.useEffect(() => {
    if (selectedEmployeeId) {
      setFilterDeveloper(selectedEmployeeId);
    }
  }, [selectedEmployeeId]);

  // Aggregate all tasks from allProjects if propTasks is not provided
  const allTasks: TaskCalendarItem[] = useMemo(() => {
    if (propTasks && propTasks.length > 0) {
      return propTasks;
    }

    const aggregated: TaskCalendarItem[] = [];
    allProjects.forEach((p) => {
      if (Array.isArray(p.tasks)) {
        p.tasks.forEach((t: any) => {
          aggregated.push({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            deadline: t.deadline,
            startDate: t.startDate,
            createdAt: t.createdAt || new Date().toISOString(),
            completedAt: t.completedAt,
            isMostImportant: t.isMostImportant,
            assignedToId: t.assignedToId || t.assignedTo?.id,
            assignee: t.assignee || t.assignedTo?.name || "Unassigned",
            assigneeAvatar: t.assigneeAvatar || t.assignedTo?.avatarUrl || null,
            projectId: p.id,
            projectName: p.name,
            clientName: p.clientName || p.client?.companyName || "Client",
            project: {
              id: p.id,
              name: p.name,
              projectNumber: p.projectCode || p.projectNumber,
              client: {
                companyName: p.clientName || p.client?.companyName,
              },
            },
            assignedTo: t.assignedTo || {
              id: t.assignedToId,
              name: t.assignee,
              designation: "Developer",
              avatarUrl: t.assigneeAvatar,
            },
          });
        });
      }
    });

    return aggregated;
  }, [propTasks, allProjects]);

  // Filter tasks based on controls
  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      // Developer filter
      if (filterDeveloper !== "ALL") {
        if (t.assignedToId !== filterDeveloper && t.assignedTo?.id !== filterDeveloper) {
          return false;
        }
      }

      // Project filter
      if (filterProject !== "ALL") {
        if (t.projectId !== filterProject && t.project?.id !== filterProject) {
          return false;
        }
      }

      // Status filter
      if (filterStatus !== "ALL") {
        const s = (t.status || "").toUpperCase();
        if (filterStatus === "PENDING" && (s === "COMPLETED" || s === "DONE")) return false;
        if (filterStatus === "COMPLETED" && !(s === "COMPLETED" || s === "DONE")) return false;
        if (filterStatus === "IN_PROGRESS" && !(s === "IN_PROGRESS" || s === "CURRENT")) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (t.title || "").toLowerCase().includes(query);
        const matchesDesc = (t.description || "").toLowerCase().includes(query);
        const matchesProject = (t.projectName || t.project?.name || "").toLowerCase().includes(query);
        const matchesAssignee = (t.assignee || t.assignedTo?.name || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesProject && !matchesAssignee) {
          return false;
        }
      }

      return true;
    });
  }, [allTasks, filterDeveloper, filterProject, filterStatus, searchQuery]);

  // Helper to extract clean YYYY-MM-DD string from a Date or ISO string
  const getDateKey = (dateInput: Date | string | null | undefined): string | null => {
    if (!dateInput) return null;
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return null;
    }
  };

  // Map tasks by date string (YYYY-MM-DD)
  // Priority order for task date: deadline -> startDate -> createdAt
  const tasksByDateMap = useMemo(() => {
    const map = new Map<string, TaskCalendarItem[]>();

    filteredTasks.forEach((task) => {
      const dateKey =
        getDateKey(task.deadline) ||
        getDateKey(task.startDate) ||
        getDateKey(task.createdAt);

      if (dateKey) {
        const list = map.get(dateKey) || [];
        list.push(task);
        map.set(dateKey, list);
      }
    });

    return map;
  }, [filteredTasks]);

  // Calendar Grid Cells Calculation
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{
      id: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      date: Date;
      dateKey: string;
      isToday: boolean;
      isSelected: boolean;
      tasks: TaskCalendarItem[];
    }> = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const key = getDateKey(prevDate)!;
      cells.push({
        id: `prev-${dayNum}`,
        dayNumber: dayNum,
        isCurrentMonth: false,
        date: prevDate,
        dateKey: key,
        isToday:
          today.getFullYear() === prevDate.getFullYear() &&
          today.getMonth() === prevDate.getMonth() &&
          today.getDate() === prevDate.getDate(),
        isSelected:
          selectedDate.getFullYear() === prevDate.getFullYear() &&
          selectedDate.getMonth() === prevDate.getMonth() &&
          selectedDate.getDate() === prevDate.getDate(),
        tasks: tasksByDateMap.get(key) || [],
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const thisDate = new Date(currentYear, currentMonth, day);
      const key = getDateKey(thisDate)!;
      cells.push({
        id: `curr-${day}`,
        dayNumber: day,
        isCurrentMonth: true,
        date: thisDate,
        dateKey: key,
        isToday:
          today.getFullYear() === currentYear &&
          today.getMonth() === currentMonth &&
          today.getDate() === day,
        isSelected:
          selectedDate.getFullYear() === currentYear &&
          selectedDate.getMonth() === currentMonth &&
          selectedDate.getDate() === day,
        tasks: tasksByDateMap.get(key) || [],
      });
    }

    // Trailing days to fill 5 or 6 rows (multiple of 7)
    const totalCells = cells.length;
    const remaining = 7 - (totalCells % 7);
    if (remaining < 7 && remaining > 0) {
      for (let nextDay = 1; nextDay <= remaining; nextDay++) {
        const nextDate = new Date(currentYear, currentMonth + 1, nextDay);
        const key = getDateKey(nextDate)!;
        cells.push({
          id: `next-${nextDay}`,
          dayNumber: nextDay,
          isCurrentMonth: false,
          date: nextDate,
          dateKey: key,
          isToday:
            today.getFullYear() === nextDate.getFullYear() &&
            today.getMonth() === nextDate.getMonth() &&
            today.getDate() === nextDate.getDate(),
          isSelected:
            selectedDate.getFullYear() === nextDate.getFullYear() &&
            selectedDate.getMonth() === nextDate.getMonth() &&
            selectedDate.getDate() === nextDate.getDate(),
          tasks: tasksByDateMap.get(key) || [],
        });
      }
    }

    return cells;
  }, [currentYear, currentMonth, selectedDate, today, tasksByDateMap]);

  // Selected date key & tasks
  const selectedDateKey = useMemo(() => getDateKey(selectedDate), [selectedDate]);
  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDateKey) return [];
    return tasksByDateMap.get(selectedDateKey) || [];
  }, [selectedDateKey, tasksByDateMap]);

  // Handlers for month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  // Quick Task status toggle
  const handleToggleTaskStatus = async (task: TaskCalendarItem) => {
    const isDone = task.status === "COMPLETED" || task.status === "DONE";
    const nextStatus = isDone ? "TODO" : "COMPLETED";

    const projectId = task.projectId || task.project?.id;
    if (!projectId) return;

    try {
      const res = await fetch(`/mdz-crm/api/projects/${projectId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          nextStatus === "COMPLETED" ? "✓ Task marked completed!" : "Task marked as To Do",
          "success"
        );
        if (onRefresh) onRefresh();
      } else {
        showToast(json.error || "Failed to update task", "error");
      }
    } catch {
      showToast("Network error updating task", "error");
    }
  };

  // Create new task for selected date
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskProjectId) {
      showToast("Please select a project", "error");
      return;
    }
    if (!newTaskTitle.trim()) {
      showToast("Please enter a task title", "error");
      return;
    }

    setIsSubmittingTask(true);
    try {
      const res = await fetch(`/mdz-crm/api/projects/${newTaskProjectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim() || undefined,
          priority: newTaskPriority,
          status: newTaskStatus,
          assignedToId: newTaskAssignee || undefined,
          deadline: newTaskDeadline ? new Date(newTaskDeadline).toISOString() : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Task scheduled successfully!", "success");
        setIsNewTaskOpen(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
        if (onRefresh) onRefresh();
      } else {
        showToast(json.error || "Failed to create task", "error");
      }
    } catch {
      showToast("Network error creating task", "error");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const formattedSelectedDate = useMemo(() => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  return (
    <div className="space-y-5 w-full">
      {/* TOP CONTROL BAR: Month Switcher + Quick Actions + Filters */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Month Navigation & Today */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    {filteredTasks.length} Tasks
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Interactive schedule & deadline master
                </div>
              </div>
            </div>

            {/* Prev / Today / Next Buttons */}
            <div className="flex items-center gap-1.5 ml-0 sm:ml-4 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGoToday}
                className="px-3 py-1 rounded-xl text-xs font-bold hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer"
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Add Task Button + Developer Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Developer Dropdown */}
            <div className="relative">
              <select
                value={filterDeveloper}
                onChange={(e) => {
                  setFilterDeveloper(e.target.value);
                  if (onSelectEmployee) onSelectEmployee(e.target.value);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-3 pr-8 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer appearance-none shadow-2xs"
              >
                <option value="ALL">👥 All Developers ({employees.length})</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    👤 {emp.name} ({emp.designation || "Developer"})
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>

            {/* Project Dropdown */}
            <div className="relative">
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-3 pr-8 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer appearance-none shadow-2xs"
              >
                <option value="ALL">📁 All Projects ({allProjects.length})</option>
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>

            {/* Schedule Task Button */}
            <button
              type="button"
              onClick={() => {
                setNewTaskDeadline(selectedDate.toISOString().split("T")[0]);
                setIsNewTaskOpen(true);
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Task</span>
            </button>
          </div>
        </div>

        {/* Filter Pills & Quick Search Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold mr-1">
              Status:
            </span>
            {[
              { id: "ALL", label: "All Tasks" },
              { id: "PENDING", label: "To Do / In Progress" },
              { id: "COMPLETED", label: "Completed" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterStatus(st.id)}
                className={`px-3 py-1 rounded-xl font-bold transition-all text-xs whitespace-nowrap cursor-pointer ${
                  filterStatus === st.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, assignee..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT: Interactive Calendar Grid (Left 65%) + Selected Date Task Drawer (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CALENDAR GRID (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-3">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center font-mono text-[11px] font-bold">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div
                key={day}
                className={`py-1.5 rounded-lg ${
                  idx === 0
                    ? "text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20"
                    : "text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell) => {
              const taskCount = cell.tasks.length;
              const hasTasks = taskCount > 0;
              const completedCount = cell.tasks.filter(
                (t) => t.status === "COMPLETED" || t.status === "DONE"
              ).length;
              const hasUrgent = cell.tasks.some(
                (t) => (t.priority || "").toUpperCase() === "URGENT"
              );

              return (
                <div
                  key={cell.id}
                  onClick={() => setSelectedDate(cell.date)}
                  className={`min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative select-none ${
                    cell.isSelected
                      ? "bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40 shadow-md shadow-indigo-600/10 z-10"
                      : cell.isToday
                      ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 ring-1 ring-blue-400/40"
                      : cell.isCurrentMonth
                      ? "bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      : "bg-slate-50/40 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/40 opacity-40 hover:opacity-80"
                  }`}
                >
                  {/* Cell Header: Day Number + Badges */}
                  <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        cell.isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : cell.isToday
                          ? "bg-blue-500 text-white font-black"
                          : cell.isCurrentMonth
                          ? "text-slate-800 dark:text-slate-200"
                          : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Task count chip */}
                    {hasTasks && (
                      <span
                        className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                          hasUrgent
                            ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                            : completedCount === taskCount
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                        }`}
                      >
                        {completedCount === taskCount ? (
                          <Check className="w-2.5 h-2.5" />
                        ) : null}
                        <span>{taskCount}</span>
                      </span>
                    )}
                  </div>

                  {/* Task Mini Previews (up to 2 visible on grid) */}
                  <div className="space-y-1 overflow-hidden my-auto">
                    {cell.tasks.slice(0, 2).map((t) => {
                      const isDone = t.status === "COMPLETED" || t.status === "DONE";
                      const isUrgent = (t.priority || "").toUpperCase() === "URGENT";
                      const isHigh = (t.priority || "").toUpperCase() === "HIGH";

                      return (
                        <div
                          key={t.id}
                          className={`text-[10px] leading-tight px-1.5 py-1 rounded-md truncate font-medium flex items-center gap-1 border transition-all ${
                            isDone
                              ? "bg-slate-100 dark:bg-slate-800/80 text-slate-400 line-through border-transparent"
                              : isUrgent
                              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                              : isHigh
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60"
                          }`}
                          title={`${t.title} (${t.projectName || "Project"})`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isDone
                                ? "bg-emerald-500"
                                : isUrgent
                                ? "bg-rose-500 animate-pulse"
                                : isHigh
                                ? "bg-amber-500"
                                : "bg-indigo-500"
                            }`}
                          />
                          <span className="truncate">{t.title}</span>
                        </div>
                      );
                    })}

                    {taskCount > 2 && (
                      <div className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 px-1">
                        +{taskCount - 2} more...
                      </div>
                    )}
                  </div>

                  {/* Add task quick hover trigger */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(cell.date);
                      setNewTaskDeadline(cell.date.toISOString().split("T")[0]);
                      setIsNewTaskOpen(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1.5 right-1.5 p-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                    title={`Add task for ${cell.dateKey}`}
                  >
                    <Plus className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Footer Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Urgent Priority</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>High Priority</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>Normal / To Do</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Completed</span>
              </span>
            </div>

            <div className="font-mono text-slate-400">
              Click any date to inspect scheduled tasks
            </div>
          </div>
        </div>

        {/* SELECTED DATE TASK DRAWER (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-4 sticky top-4">
          {/* Drawer Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                Daily Task Schedule
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {formattedSelectedDate}
              </h3>
              <div className="text-xs text-slate-400 mt-0.5">
                {tasksForSelectedDate.length === 0
                  ? "No tasks scheduled for this day"
                  : `${tasksForSelectedDate.length} tasks scheduled`}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewTaskDeadline(selectedDate.toISOString().split("T")[0]);
                setIsNewTaskOpen(true);
              }}
              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 transition-colors shadow-2xs"
              title="Add task for this date"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Tasks List */}
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {tasksForSelectedDate.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Free Agenda
                  </div>
                  <div className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto">
                    No deadlines or tasks scheduled for {selectedDate.toLocaleDateString()}.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewTaskDeadline(selectedDate.toISOString().split("T")[0]);
                    setIsNewTaskOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Schedule Task Here</span>
                </button>
              </div>
            ) : (
              tasksForSelectedDate.map((task) => {
                const isDone = task.status === "COMPLETED" || task.status === "DONE";
                const isUrgent = (task.priority || "").toUpperCase() === "URGENT";
                const isHigh = (task.priority || "").toUpperCase() === "HIGH";

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      isDone
                        ? "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-75"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-600"
                    }`}
                  >
                    {/* Top Row: Status Checkbox + Title + Priority Pill */}
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskStatus(task)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                          isDone
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                            : "border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-900"
                        }`}
                        title={isDone ? "Mark Incomplete" : "Mark Completed"}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`font-bold text-xs leading-snug ${
                              isDone
                                ? "text-slate-400 line-through"
                                : "text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {task.title}
                          </h4>

                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                              isUrgent
                                ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                : isHigh
                                ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {task.priority || "NORMAL"}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadata: Project + Assignee */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                      {/* Project Tag */}
                      <Link
                        href={`/projects/${task.projectId || task.project?.id}`}
                        className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold truncate max-w-[160px]"
                        title={`Project: ${task.projectName || task.project?.name}`}
                      >
                        <FolderKanban className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {task.projectName || task.project?.name || "Project"}
                        </span>
                      </Link>

                      {/* Assignee Badge */}
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                          {task.assignee?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="truncate max-w-[100px]">
                          {task.assignee || "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* SCHEDULE TASK BOTTOM SHEET / MODAL */}
      <BottomSheet
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        title="Schedule New Task"
        subtitle={`Schedule task execution for ${selectedDate.toLocaleDateString()}`}
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          {/* Project Select */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Select Project *
            </label>
            <select
              value={newTaskProjectId}
              onChange={(e) => setNewTaskProjectId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
              required
            >
              <option value="">-- Choose Project --</option>
              {allProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.clientName || "Client"})
                </option>
              ))}
            </select>
          </div>

          {/* Task Title */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Task Title *
            </label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Implement Payment Webhook Gateway"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Description (Optional)
            </label>
            <textarea
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Specify requirements or deliverables..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Grid: Assignee + Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                Assign Developer
              </label>
              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    👤 {emp.name} ({emp.designation || "Developer"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                Priority
              </label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">🔴 Urgent / Critical</option>
              </select>
            </div>
          </div>

          {/* Target Deadline Date */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Target Date / Deadline *
            </label>
            <input
              type="date"
              value={newTaskDeadline}
              onChange={(e) => setNewTaskDeadline(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
              required
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewTaskOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingTask}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmittingTask ? "Scheduling..." : "Schedule Task"}</span>
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
