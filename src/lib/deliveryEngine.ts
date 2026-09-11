import { prisma } from "@/lib/prisma";

export interface DeliveryStatusResult {
  status:
    | "ON_TRACK"
    | "DELAYED"
    | "COMPLETED_EARLY"
    | "COMPLETED_ON_TIME"
    | "COMPLETED_LATE"
    | "NO_DEADLINE";
  label: string;
  color: "green" | "red" | "gray" | "amber";
  daysOverdue?: number;
}

export async function getEmployeeProjectDeliveryStatus(
  projectId: string,
  employeeUserId: string
): Promise<DeliveryStatusResult> {
  // Fetch Project & assigned active tasks for employee
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        where: {
          assignedToId: employeeUserId,
          status: { not: "ARCHIVED" },
        },
      },
    },
  });

  if (!project) {
    return { status: "NO_DEADLINE", label: "Deadline not set", color: "gray" };
  }

  const assignedTasks = project.tasks;
  const now = new Date();

  // 1. Task-First Delivery Evaluation
  if (assignedTasks.length > 0) {
    const activeTasks = assignedTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "DONE");
    const completedTasks = assignedTasks.filter((t) => t.status === "COMPLETED" || t.status === "DONE");

    // Check for any active overdue task
    const overdueTask = activeTasks.find(
      (t) => t.deadline && now > new Date(t.deadline)
    );

    if (overdueTask && overdueTask.deadline) {
      const daysOverdue = Math.ceil(
        (now.getTime() - new Date(overdueTask.deadline).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return {
        status: "DELAYED",
        label: `DELAYED — ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue`,
        color: "red",
        daysOverdue,
      };
    }

    // If all assigned tasks are completed
    if (activeTasks.length === 0 && completedTasks.length > 0) {
      const lateCompletedTask = completedTasks.find((t) => {
        if (!t.deadline || !t.completedAt) return false;
        return new Date(t.completedAt) > new Date(t.deadline);
      });

      if (lateCompletedTask) {
        return {
          status: "COMPLETED_LATE",
          label: "COMPLETED LATE",
          color: "red",
        };
      } else {
        return {
          status: "COMPLETED_EARLY",
          label: "COMPLETED ON TIME",
          color: "green",
        };
      }
    }

    // Active tasks exist and none are overdue
    return {
      status: "ON_TRACK",
      label: "ON TRACK",
      color: "green",
    };
  }

  // 2. Project Target Deadline Fallback Evaluation
  if (project.targetDeadline) {
    const targetDeadline = new Date(project.targetDeadline);

    if (project.status === "COMPLETED" || project.status === "DONE") {
      const completionDate = project.actualCompletionDate
        ? new Date(project.actualCompletionDate)
        : now;
      if (completionDate <= targetDeadline) {
        return {
          status: "COMPLETED_ON_TIME",
          label: "COMPLETED ON TIME",
          color: "green",
        };
      } else {
        return {
          status: "COMPLETED_LATE",
          label: "COMPLETED LATE",
          color: "red",
        };
      }
    } else {
      if (now > targetDeadline) {
        const daysOverdue = Math.ceil(
          (now.getTime() - targetDeadline.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          status: "DELAYED",
          label: `DELAYED — ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue`,
          color: "red",
          daysOverdue,
        };
      } else {
        return {
          status: "ON_TRACK",
          label: "ON TRACK",
          color: "green",
        };
      }
    }
  }

  // 3. No Deadlines Available
  return {
    status: "NO_DEADLINE",
    label: "Deadline not set",
    color: "gray",
  };
}
