import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getOperationalExceptions } from "@/lib/escalationEngine";

export async function GET() {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Authoritative Invoices & Financial Metrics
    const [invoiceAggregations, pipelineAggregation, allInvoices] = await Promise.all([
      prisma.invoice.groupBy({
        by: ["status"],
        _sum: { grandTotal: true },
        _count: { id: true },
      }),
      prisma.lead.aggregate({
        where: { status: { notIn: ["LOST", "CONVERTED"] } },
        _sum: { expectedValue: true },
        _count: { id: true },
      }),
      prisma.invoice.findMany({
        include: {
          client: { select: { companyName: true } },
          project: { select: { name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 30,
      }),
    ]);

    let totalBilling = 0;
    let paidBilling = 0;
    let pendingBilling = 0;
    let overdueBilling = 0;
    let overdueInvoicesCount = 0;

    invoiceAggregations.forEach((agg) => {
      const amount = agg._sum.grandTotal || 0;
      totalBilling += amount;
      if (agg.status === "PAID") paidBilling += amount;
      else if (agg.status === "UNPAID") pendingBilling += amount;
      else if (agg.status === "OVERDUE") {
        overdueBilling += amount;
        overdueInvoicesCount += agg._count.id;
      }
    });

    const pipelineValue = pipelineAggregation._sum.expectedValue || 0;
    const activeLeadsCount = pipelineAggregation._count.id;

    // 2. Active Projects & Health
    const projects = await prisma.project.findMany({
      where: {
        status: { notIn: ["COMPLETED", "DONE", "DELIVERED", "CANCELLED"] },
      },
      include: {
        client: { select: { companyName: true } },
        tasks: {
          select: { id: true, status: true, deadline: true },
        },
      },
      orderBy: { targetDeadline: "asc" },
    });

    const projectSummaries = projects.map((p) => {
      const isPastDeadline = p.targetDeadline && new Date(p.targetDeadline).getTime() < now.getTime();
      const overdueTasks = p.tasks.filter(
        (t) => t.status !== "COMPLETED" && t.status !== "DONE" && t.deadline && new Date(t.deadline).getTime() < now.getTime()
      );

      return {
        id: p.id,
        projectNumber: p.projectNumber,
        name: p.name,
        clientName: p.client?.companyName || "Client",
        status: p.status,
        priority: p.priority,
        progressPercentage: Math.round(p.progressPercentage || 0),
        targetDeadline: p.targetDeadline ? new Date(p.targetDeadline).toLocaleDateString("en-IN") : "Not Set",
        isDelayed: isPastDeadline || overdueTasks.length > 0 || p.priority === "URGENT",
        overdueTasksCount: overdueTasks.length,
      };
    });

    // 3. Operational Exceptions (Escalation Engine)
    const exceptions = await getOperationalExceptions();

    // 4. Workforce Attendance & Real-Time Capacity
    const employees = await prisma.employee.findMany({
      where: {
        user: { activeRole: { not: "OWNER" }, isActive: true },
      },
      include: {
        attendances: { where: { date: { gte: startOfToday } } },
        statusEvents: {
          where: { endedAt: null },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });

    const totalEmployees = employees.length;
    let presentCount = 0;
    let onBreakCount = 0;

    employees.forEach((emp) => {
      const activeBreak = emp.statusEvents?.find((e) => e.statusType !== "WORKING");
      const hasPunchedIn = emp.attendances && emp.attendances.length > 0;
      if (hasPunchedIn) presentCount++;
      if (activeBreak) onBreakCount++;
    });

    return NextResponse.json({
      success: true,
      data: {
        executiveName: authRes.name || "Executive",
        generatedAt: now.toISOString(),
        formattedDate: now.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        financialMetrics: {
          totalBilling,
          paidBilling,
          pendingBilling,
          overdueBilling,
          overdueInvoicesCount,
          pipelineValue,
          activeLeadsCount,
        },
        projectsSummary: {
          totalActiveProjects: projects.length,
          delayedProjectsCount: projectSummaries.filter((p) => p.isDelayed).length,
          onTrackProjectsCount: projectSummaries.filter((p) => !p.isDelayed).length,
          projects: projectSummaries,
        },
        exceptions,
        workforceMetrics: {
          totalEmployees,
          presentCount,
          onBreakCount,
          absentCount: Math.max(0, totalEmployees - presentCount),
          attendancePercentage: totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 100,
        },
      },
    });
  } catch (error) {
    console.error("[ExecutiveBriefRoute] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to compile Executive Brief data." },
      { status: 500 }
    );
  }
}
