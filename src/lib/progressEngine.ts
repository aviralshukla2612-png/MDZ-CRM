import { prisma } from "@/lib/prisma";

export interface ProjectProgressResult {
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  zeroTaskMessage: string | null;
}

export const COMPLETED_TASK_STATUSES = [
  "COMPLETED",
  "DONE",
  "COMPLETE",
  "DELIVERED",
  "RESOLVED",
  "WON",
];

export function isTaskCompleted(status: string | null | undefined): boolean {
  if (!status) return false;
  return COMPLETED_TASK_STATUSES.includes(status.trim().toUpperCase());
}

export function isTaskActive(status: string | null | undefined): boolean {
  if (!status) return true;
  return status.trim().toUpperCase() !== "ARCHIVED";
}

export interface ProgressCalculationInput {
  status?: string | null;
  progressPercentage?: number | null;
  tasks?: Array<{ status?: string | null }> | null;
  stages?: Array<{
    status?: string | null;
    progressPercentage?: number | null;
    weight?: number | null;
  }> | null;
  clientUpdatesCount?: number | null;
}

/**
 * Pure calculation function for project progress percentage.
 * Guarantees a valid number between 0 and 100.
 */
export function calculateProgressFromProjectData(input: ProgressCalculationInput): number {
  // If project is explicitly marked as COMPLETED, it is always 100%
  if (input.status?.toUpperCase() === "COMPLETED") {
    return 100;
  }

  // 1. Task-based calculation
  if (input.tasks && Array.isArray(input.tasks)) {
    const activeTasks = input.tasks.filter((t) => isTaskActive(t.status));
    if (activeTasks.length > 0) {
      const completedCount = activeTasks.filter((t) => isTaskCompleted(t.status)).length;
      return Math.min(100, Math.max(0, Math.round((completedCount / activeTasks.length) * 100)));
    }
  }

  // 2. Stages/Milestones calculation
  if (input.stages && Array.isArray(input.stages) && input.stages.length > 0) {
    let totalWeight = 0;
    let weightedProgress = 0;

    for (const stage of input.stages) {
      const weight = typeof stage.weight === "number" && stage.weight > 0 ? stage.weight : 1;
      const stageProgress =
        stage.status?.toUpperCase() === "COMPLETED"
          ? 100
          : typeof stage.progressPercentage === "number"
          ? Math.min(100, Math.max(0, stage.progressPercentage))
          : 0;
      weightedProgress += stageProgress * weight;
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      return Math.min(100, Math.max(0, Math.round(weightedProgress / totalWeight)));
    }
  }

  // 3. Explicit progressPercentage stored on the project
  if (typeof input.progressPercentage === "number" && !isNaN(input.progressPercentage) && input.progressPercentage > 0) {
    return Math.min(100, Math.max(0, Math.round(input.progressPercentage)));
  }

  // 4. Client updates count fallback
  if (typeof input.clientUpdatesCount === "number" && input.clientUpdatesCount > 0) {
    return Math.min(100, Math.max(0, input.clientUpdatesCount * 25));
  }

  return 0;
}

/**
 * Single Source of Truth Progress Engine
 * Permanently resolves project by either ID (UUID) or projectNumber,
 * computes progress from tasks/stages/status, updates DB cache, and returns result.
 */
export async function recalculateProjectProgress(projectId: string): Promise<ProjectProgressResult> {
  if (!projectId) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      progressPercentage: 0,
      zeroTaskMessage: "No tasks have been added to this project yet.",
    };
  }

  // 1. Find the project by ID or projectNumber
  const project = await prisma.project.findFirst({
    where: {
      OR: [{ id: projectId }, { projectNumber: projectId }],
    },
    select: {
      id: true,
      status: true,
      progressPercentage: true,
      _count: { select: { clientUpdates: true } },
      stages: {
        select: {
          id: true,
          status: true,
          progressPercentage: true,
          weight: true,
        },
      },
    },
  });

  if (!project) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      progressPercentage: 0,
      zeroTaskMessage: "Project not found.",
    };
  }

  const actualProjectId = project.id;

  // 2. Fetch tasks for this project
  const tasks = await prisma.task.findMany({
    where: { projectId: actualProjectId },
    select: { id: true, status: true },
  });

  const activeTasks = tasks.filter((t) => isTaskActive(t.status));
  const totalTasks = activeTasks.length;
  const completedTasks = activeTasks.filter((t) => isTaskCompleted(t.status)).length;

  const progressPercentage = calculateProgressFromProjectData({
    status: project.status,
    progressPercentage: project.progressPercentage,
    tasks: activeTasks,
    stages: project.stages,
    clientUpdatesCount: project._count.clientUpdates,
  });

  // 3. Update Project derived cache in database
  await prisma.project.update({
    where: { id: actualProjectId },
    data: { progressPercentage },
  });

  return {
    totalTasks,
    completedTasks,
    progressPercentage,
    zeroTaskMessage:
      totalTasks === 0
        ? progressPercentage > 0
          ? null
          : "No tasks have been added to this project yet."
        : null,
  };
}
