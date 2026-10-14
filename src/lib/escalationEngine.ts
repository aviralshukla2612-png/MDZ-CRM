import { prisma } from "@/lib/prisma";
import { sendNotificationToUser } from "@/lib/notifications";

export interface EscalationSummary {
  escalatedTasksCount: number;
  escalatedProjectsCount: number;
  escalatedInvoicesCount: number;
  escalatedMilestonesCount: number;
  escalatedFollowupsCount: number;
  notificationsDispatched: number;
}

export interface OperationalException {
  id: string;
  entityType: "TASK" | "PROJECT" | "INVOICE" | "MILESTONE" | "FOLLOWUP";
  entityId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  project?: string;
  client?: string;
  actionText: string;
  actionHref: string;
  badgeColor: string;
  time: string;
  daysOverdue: number;
  interactive: boolean;
}

/**
 * Checks if an active escalation notification was already sent to the recipient
 * within the last 24 hours for the given destination link URL to prevent spamming.
 */
async function shouldSendEscalationNotification(
  recipientId: string,
  linkUrl: string,
  titlePrefix: string
): Promise<boolean> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.notification.findFirst({
      where: {
        recipientId,
        linkUrl,
        title: { startsWith: titlePrefix },
        createdAt: { gte: twentyFourHoursAgo },
      },
      select: { id: true },
    });
    return !existing;
  } catch {
    return true;
  }
}

/**
 * Finds all Owner and Admin user IDs to route executive-level escalations.
 */
async function getAdminAndOwnerUserIds(): Promise<string[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        activeRole: { in: ["OWNER", "ADMIN", "SUB_ADMIN"] },
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  } catch {
    return [];
  }
}

/**
 * Automatic Overdue Escalation Engine
 * 1. Automatically transitions overdue invoices, payment milestones, and followups to 'OVERDUE'
 * 2. Automatically escalates overdue tasks and delayed projects to 'URGENT' priority
 * 3. Proactively generates real-time notifications with 24h anti-spam throttling
 * 4. Can be executed on-demand, during exception queries, or via cron jobs
 */
export async function runOverdueEscalation(options: { sendNotifications?: boolean } = {}): Promise<EscalationSummary> {
  const { sendNotifications = true } = options;
  const now = new Date();

  let escalatedTasksCount = 0;
  let escalatedProjectsCount = 0;
  let escalatedInvoicesCount = 0;
  let escalatedMilestonesCount = 0;
  let escalatedFollowupsCount = 0;
  let notificationsDispatched = 0;

  const adminIds = sendNotifications ? await getAdminAndOwnerUserIds() : [];

  // =========================================================================
  // 1. INVOICES ESCALATION (Past dueDate and UNPAID/SENT -> mark OVERDUE)
  // =========================================================================
  try {
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ["UNPAID", "SENT"] },
        dueDate: { lt: now },
      },
      include: {
        client: { select: { companyName: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (overdueInvoices.length > 0) {
      await prisma.invoice.updateMany({
        where: {
          id: { in: overdueInvoices.map((inv) => inv.id) },
        },
        data: {
          status: "OVERDUE",
        },
      });
      escalatedInvoicesCount = overdueInvoices.length;

      if (sendNotifications) {
        for (const inv of overdueInvoices) {
          const days = Math.max(1, Math.ceil((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
          const title = `🚨 Overdue Payment: ${inv.invoiceNumber}`;
          const message = `Invoice for ${inv.client?.companyName || "Client"} (₹${inv.totalAmount.toLocaleString("en-IN")}) is ${days} day${days > 1 ? "s" : ""} overdue.`;
          const linkUrl = "/finance";

          for (const adminId of adminIds) {
            const canSend = await shouldSendEscalationNotification(adminId, linkUrl, "🚨 Overdue Payment:");
            if (canSend) {
              await sendNotificationToUser({
                recipientId: adminId,
                title,
                message,
                urgency: days > 3 ? "HIGH" : "MEDIUM",
                linkUrl,
              });
              notificationsDispatched++;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[EscalationEngine] Error processing invoices:", err);
  }

  // =========================================================================
  // 2. PAYMENT MILESTONES ESCALATION (Past dueDate and UPCOMING/DUE -> OVERDUE)
  // =========================================================================
  try {
    const overdueMilestones = await prisma.paymentMilestone.findMany({
      where: {
        status: { in: ["UPCOMING", "DUE"] },
        dueDate: { lt: now },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    if (overdueMilestones.length > 0) {
      await prisma.paymentMilestone.updateMany({
        where: {
          id: { in: overdueMilestones.map((m) => m.id) },
        },
        data: {
          status: "OVERDUE",
        },
      });
      escalatedMilestonesCount = overdueMilestones.length;
    }
  } catch (err) {
    console.error("[EscalationEngine] Error processing payment milestones:", err);
  }

  // =========================================================================
  // 3. TASKS ESCALATION (Past deadline and active -> escalate priority to URGENT)
  // =========================================================================
  try {
    const overdueTasks = await prisma.task.findMany({
      where: {
        status: { notIn: ["COMPLETED", "DONE", "ARCHIVED"] },
        deadline: { lt: now },
      },
      include: {
        project: { select: { id: true, name: true, priority: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Escalate task priority to URGENT if not already
    const tasksToEscalate = overdueTasks.filter((t) => t.priority !== "URGENT");
    if (tasksToEscalate.length > 0) {
      await prisma.task.updateMany({
        where: {
          id: { in: tasksToEscalate.map((t) => t.id) },
        },
        data: {
          priority: "URGENT",
        },
      });
      escalatedTasksCount = tasksToEscalate.length;
    }

    // Also escalate parent project priority to URGENT if tasks are overdue
    const projectIdsToEscalate = Array.from(
      new Set(overdueTasks.map((t) => t.project?.id).filter(Boolean))
    ) as string[];

    if (projectIdsToEscalate.length > 0) {
      await prisma.project.updateMany({
        where: {
          id: { in: projectIdsToEscalate },
          status: { notIn: ["COMPLETED", "DONE", "DELIVERED", "CANCELLED"] },
          priority: { not: "URGENT" },
        },
        data: {
          priority: "URGENT",
        },
      });
    }

    // Send notifications to assignees and admins
    if (sendNotifications && overdueTasks.length > 0) {
      for (const task of overdueTasks) {
        const days = Math.max(1, Math.ceil((now.getTime() - new Date(task.deadline!).getTime()) / (1000 * 60 * 60 * 24)));
        const linkUrl = `/projects/${task.project.id}`;

        // 1. Notify Assigned Employee
        if (task.assignedToId) {
          const empTitle = `⚠️ Task Overdue: ${task.title}`;
          const canSendEmp = await shouldSendEscalationNotification(task.assignedToId, linkUrl, "⚠️ Task Overdue:");
          if (canSendEmp) {
            await sendNotificationToUser({
              recipientId: task.assignedToId,
              title: empTitle,
              message: `Your task '${task.title}' in ${task.project.name} is ${days} day${days > 1 ? "s" : ""} overdue. Priority automatically escalated to URGENT.`,
              urgency: "HIGH",
              linkUrl,
            });
            notificationsDispatched++;
          }
        }

        // 2. Notify Admins/Owners
        const adminTitle = `🚨 Task Deadline Escalation: ${task.title}`;
        const assigneeLabel = task.assignedTo?.name || "Unassigned";
        for (const adminId of adminIds) {
          const canSendAdmin = await shouldSendEscalationNotification(adminId, linkUrl, "🚨 Task Deadline Escalation:");
          if (canSendAdmin) {
            await sendNotificationToUser({
              recipientId: adminId,
              title: adminTitle,
              message: `Task '${task.title}' (${assigneeLabel}) in project '${task.project.name}' is ${days} day${days > 1 ? "s" : ""} overdue!`,
              urgency: "HIGH",
              linkUrl,
            });
            notificationsDispatched++;
          }
        }
      }
    }
  } catch (err) {
    console.error("[EscalationEngine] Error processing tasks:", err);
  }

  // =========================================================================
  // 4. PROJECTS ESCALATION (Past targetDeadline -> escalate priority to URGENT)
  // =========================================================================
  try {
    const overdueProjects = await prisma.project.findMany({
      where: {
        status: { notIn: ["COMPLETED", "DONE", "DELIVERED", "CANCELLED", "WON"] },
        targetDeadline: { lt: now },
      },
      select: {
        id: true,
        name: true,
        projectNumber: true,
        targetDeadline: true,
        priority: true,
      },
    });

    const projectsToEscalate = overdueProjects.filter((p) => p.priority !== "URGENT");
    if (projectsToEscalate.length > 0) {
      await prisma.project.updateMany({
        where: {
          id: { in: projectsToEscalate.map((p) => p.id) },
        },
        data: {
          priority: "URGENT",
        },
      });
      escalatedProjectsCount = projectsToEscalate.length;
    }

    if (sendNotifications && overdueProjects.length > 0) {
      for (const proj of overdueProjects) {
        const days = Math.max(1, Math.ceil((now.getTime() - new Date(proj.targetDeadline!).getTime()) / (1000 * 60 * 60 * 24)));
        const title = `🚨 Project Delivery Overdue: ${proj.name}`;
        const message = `Project ${proj.name} has breached its delivery deadline by ${days} day${days > 1 ? "s" : ""}. Priority set to URGENT.`;
        const linkUrl = `/projects/${proj.id}`;

        for (const adminId of adminIds) {
          const canSend = await shouldSendEscalationNotification(adminId, linkUrl, "🚨 Project Delivery Overdue:");
          if (canSend) {
            await sendNotificationToUser({
              recipientId: adminId,
              title,
              message,
              urgency: "HIGH",
              linkUrl,
            });
            notificationsDispatched++;
          }
        }
      }
    }
  } catch (err) {
    console.error("[EscalationEngine] Error processing projects:", err);
  }

  // =========================================================================
  // 5. SALES FOLLOW-UPS ESCALATION (Past scheduledAt and PENDING -> mark OVERDUE)
  // =========================================================================
  try {
    const overdueFollowups = await prisma.leadFollowup.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lt: now },
      },
      include: {
        lead: { select: { id: true, contactPerson: true, companyName: true } },
        salesperson: { select: { id: true, name: true } },
      },
    });

    if (overdueFollowups.length > 0) {
      await prisma.leadFollowup.updateMany({
        where: {
          id: { in: overdueFollowups.map((f) => f.id) },
        },
        data: {
          status: "OVERDUE",
        },
      });
      escalatedFollowupsCount = overdueFollowups.length;

      if (sendNotifications) {
        for (const f of overdueFollowups) {
          if (f.salespersonId) {
            const linkUrl = `/sales/followups`;
            const canSend = await shouldSendEscalationNotification(f.salespersonId, linkUrl, "⚠️ Overdue Follow-up:");
            if (canSend) {
              await sendNotificationToUser({
                recipientId: f.salespersonId,
                title: `⚠️ Overdue Follow-up: ${f.lead?.contactPerson || "Lead"}`,
                message: `You have an overdue ${f.communicationType || "follow-up"} scheduled for ${f.lead?.companyName || f.lead?.contactPerson || "a client"}.`,
                urgency: "MEDIUM",
                linkUrl,
              });
              notificationsDispatched++;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[EscalationEngine] Error processing followups:", err);
  }

  return {
    escalatedTasksCount,
    escalatedProjectsCount,
    escalatedInvoicesCount,
    escalatedMilestonesCount,
    escalatedFollowupsCount,
    notificationsDispatched,
  };
}

/**
 * Returns prioritized operational exceptions for Founder / Admin dashboards
 * Automatically ensures overdue escalations are processed first.
 */
export async function getOperationalExceptions(): Promise<OperationalException[]> {
  // 1. Run automatic overdue escalation check
  await runOverdueEscalation({ sendNotifications: true });

  const now = new Date();
  const exceptions: OperationalException[] = [];

  // 2. Fetch Overdue Invoices
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: "OVERDUE",
      },
      include: {
        client: { select: { companyName: true } },
        project: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    });

    invoices.forEach((inv) => {
      const days = Math.max(1, Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
      const isCritical = days >= 3;
      exceptions.push({
        id: `EXC-INV-${inv.id}`,
        entityType: "INVOICE",
        entityId: inv.id,
        severity: isCritical ? "CRITICAL" : "HIGH",
        title: `₹${inv.totalAmount.toLocaleString("en-IN")} Payment Overdue (${inv.invoiceNumber})`,
        description: `${inv.client?.companyName || "Client"} invoice is overdue by ${days} day${days > 1 ? "s" : ""}. Immediate collection action required.`,
        project: inv.project?.name || "Financial Milestone",
        client: inv.client?.companyName,
        actionText: "Send Payment Reminder",
        actionHref: "/finance",
        badgeColor: isCritical
          ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
          : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20",
        time: `${days} day${days > 1 ? "s" : ""} overdue`,
        daysOverdue: days,
        interactive: true,
      });
    });
  } catch (err) {
    console.error("[EscalationEngine] Error gathering invoice exceptions:", err);
  }

  // 3. Fetch Overdue Tasks with Active Assignees
  try {
    const overdueTasks = await prisma.task.findMany({
      where: {
        status: { notIn: ["COMPLETED", "DONE", "ARCHIVED"] },
        deadline: { lt: now },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { deadline: "asc" },
      take: 20,
    });

    overdueTasks.forEach((task) => {
      const days = Math.max(1, Math.floor((now.getTime() - new Date(task.deadline!).getTime()) / (1000 * 60 * 60 * 24)));
      const assigneeName = task.assignedTo?.name || "Unassigned";
      exceptions.push({
        id: `EXC-TSK-${task.id}`,
        entityType: "TASK",
        entityId: task.id,
        severity: days >= 3 ? "CRITICAL" : "HIGH",
        title: `Task Overdue: ${task.title}`,
        description: `Assigned to ${assigneeName} in '${task.project.name}'. Breached deadline by ${days} day${days > 1 ? "s" : ""}. Priority escalated to URGENT.`,
        project: task.project.name,
        actionText: "Inspect Task Workspace",
        actionHref: `/projects/${task.project.id}`,
        badgeColor: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20",
        time: `${days} day${days > 1 ? "s" : ""} overdue`,
        daysOverdue: days,
        interactive: true,
      });
    });
  } catch (err) {
    console.error("[EscalationEngine] Error gathering task exceptions:", err);
  }

  // 4. Fetch Delayed Projects (Past targetDeadline or Priority URGENT)
  try {
    const delayedProjects = await prisma.project.findMany({
      where: {
        status: { notIn: ["COMPLETED", "DONE", "DELIVERED", "CANCELLED", "WON"] },
        OR: [
          { targetDeadline: { lt: now } },
          { priority: "URGENT" },
        ],
      },
      include: {
        client: { select: { companyName: true } },
      },
      take: 15,
    });

    delayedProjects.forEach((prj) => {
      const isPastDeadline = prj.targetDeadline && new Date(prj.targetDeadline) < now;
      const days = isPastDeadline
        ? Math.max(1, Math.floor((now.getTime() - new Date(prj.targetDeadline!).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      // Avoid duplicating if tasks already surfaced
      if (!exceptions.some((e) => e.entityType === "PROJECT" && e.entityId === prj.id)) {
        exceptions.push({
          id: `EXC-PRJ-${prj.id}`,
          entityType: "PROJECT",
          entityId: prj.id,
          severity: "CRITICAL",
          title: `Project ${prj.name}: ${isPastDeadline ? "Delivery Deadline Breached" : "High Risk / Urgent"}`,
          description: isPastDeadline
            ? `Target delivery date was missed by ${days} day${days > 1 ? "s" : ""}. Operational intervention required.`
            : `Project marked as URGENT priority. Requires immediate resource allocation.`,
          project: prj.name,
          client: prj.client?.companyName,
          actionText: "Inspect Project Workspace",
          actionHref: `/projects/${prj.id}`,
          badgeColor: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20",
          time: isPastDeadline ? `${days} days overdue` : "Action Required",
          daysOverdue: days,
          interactive: true,
        });
      }
    });
  } catch (err) {
    console.error("[EscalationEngine] Error gathering project exceptions:", err);
  }

  // 5. Fetch Overdue Follow-ups
  try {
    const overdueFollowups = await prisma.leadFollowup.findMany({
      where: {
        status: "OVERDUE",
      },
      include: {
        lead: { select: { id: true, contactPerson: true, companyName: true } },
        salesperson: { select: { name: true } },
      },
      take: 10,
    });

    overdueFollowups.forEach((f) => {
      const days = Math.max(1, Math.floor((now.getTime() - new Date(f.scheduledAt).getTime()) / (1000 * 60 * 60 * 24)));
      exceptions.push({
        id: `EXC-FLP-${f.id}`,
        entityType: "FOLLOWUP",
        entityId: f.id,
        severity: "MEDIUM",
        title: `Overdue ${f.communicationType || "Follow-up"}: ${f.lead?.contactPerson || "Lead"}`,
        description: `Follow-up with ${f.lead?.companyName || f.lead?.contactPerson} assigned to ${f.salesperson?.name || "Sales"} was missed.`,
        actionText: "Open Follow-ups Board",
        actionHref: `/sales/followups`,
        badgeColor: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20",
        time: `${days} day${days > 1 ? "s" : ""} overdue`,
        daysOverdue: days,
        interactive: true,
      });
    });
  } catch (err) {
    console.error("[EscalationEngine] Error gathering followup exceptions:", err);
  }

  // Sort exceptions by severity: CRITICAL > HIGH > MEDIUM > LOW, then by daysOverdue descending
  const severityRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  exceptions.sort((a, b) => {
    const rankDiff = severityRank[a.severity] - severityRank[b.severity];
    if (rankDiff !== 0) return rankDiff;
    return b.daysOverdue - a.daysOverdue;
  });

  return exceptions;
}
