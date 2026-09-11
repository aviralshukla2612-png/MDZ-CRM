import { prisma } from "@/lib/prisma";

export interface ProjectProgressResult {
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  zeroTaskMessage: string | null;
}

/**
 * Single Source of Truth Progress Engine
 * Formula:
 * activeTotalTasks = tasks.filter(t => t.status !== "ARCHIVED").length
 * completedTasks = activeTasks.filter(t => t.status === "COMPLETED" || t.status === "DONE").length
 * progressPercentage = activeTotalTasks === 0 ? 0 : Math.round((completedTasks / activeTotalTasks) * 100)
 *
 * Transactionally updates Project.progressPercentage in DB as a server-maintained derived cache.
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

  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { id: true, status: true },
  });

  const activeTasks = tasks.filter((t) => t.status !== "ARCHIVED");
  const totalTasks = activeTasks.length;
  const completedTasks = activeTasks.filter(
    (t) => t.status === "COMPLETED" || t.status === "DONE"
  ).length;

  const progressPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Update Project derived cache in database
  await prisma.project.update({
    where: { id: projectId },
    data: { progressPercentage },
  });

  return {
    totalTasks,
    completedTasks,
    progressPercentage,
    zeroTaskMessage:
      totalTasks === 0 ? "No tasks have been added to this project yet." : null,
  };
}
