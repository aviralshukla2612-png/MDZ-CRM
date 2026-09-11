import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getEmployeeProjectDeliveryStatus } from "@/lib/deliveryEngine";

export async function GET(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  // Security boundary: Allowed for EMPLOYEE or OWNER
  if (authRes.activeRole !== "EMPLOYEE" && authRes.activeRole !== "OWNER") {
    return NextResponse.json(
      { success: false, error: "Forbidden: Access denied to employee finance." },
      { status: 403 }
    );
  }

  try {
    // Derive Employee identity strictly from server session
    const employee = await prisma.employee.findUnique({
      where: { userId: authRes.id },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            project: {
              include: {
                client: { select: { companyName: true } },
                tasks: { select: { id: true, status: true, assignedToId: true, deadline: true, completedAt: true } },
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee profile not found." },
        { status: 404 }
      );
    }

    let totalAssignedCompensation = 0;
    let configuredCount = 0;
    let notSetConfiguredCount = 0;

    const projects = await Promise.all(
      employee.memberships.map(async (m) => {
        const activeTasks = m.project.tasks.filter((t) => t.status !== "ARCHIVED");
        const totalTasks = activeTasks.length;
        const completedTasks = activeTasks.filter(
          (t) => t.status === "COMPLETED" || t.status === "DONE"
        ).length;
        const progressPercentage =
          totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        const amount = m.compensationAmount;
        if (amount !== null && amount !== undefined) {
          totalAssignedCompensation += amount;
          configuredCount++;
        } else {
          notSetConfiguredCount++;
        }

        const delivery = await getEmployeeProjectDeliveryStatus(m.project.id, authRes.id);

        return {
          membershipId: m.id,
          projectId: m.project.id,
          projectNumber: m.project.projectNumber,
          projectName: m.project.name,
          clientName: m.project.client?.companyName || "Client",
          roleInProject: m.roleInProject,
          progressPercentage,
          compensationAmount: m.compensationAmount,
          currency: m.currency || "INR",
          delivery,
        };
      })
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalAssignedCompensation,
        assignedProjectsCount: projects.length,
        configuredCount,
        notSetConfiguredCount,
      },
      projects,
    });
  } catch (error) {
    console.error("Failed to fetch employee self-service finance:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
