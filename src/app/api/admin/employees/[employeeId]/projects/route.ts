import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { employeeId: string } }
) {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [{ id: params.employeeId }, { employeeIdCode: params.employeeId }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            department: true,
            avatarUrl: true,
          },
        },
        memberships: {
          where: { isActive: true },
          include: {
            project: {
              include: {
                tasks: {
                  select: {
                    id: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found." },
        { status: 404 }
      );
    }

    let totalAssignedCompensation = 0;

    const projects = employee.memberships.map((m) => {
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
      }

      return {
        membershipId: m.id,
        projectId: m.project.id,
        projectNumber: m.project.projectNumber,
        projectName: m.project.name,
        description: m.project.description,
        status: m.project.status,
        progressPercentage,
        roleInProject: m.roleInProject,
        compensationAmount: m.compensationAmount,
        currency: m.currency || "INR",
        assignedAt: m.assignedAt,
      };
    });

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        employeeIdCode: employee.employeeIdCode,
        userId: employee.user.id,
        name: employee.user.name,
        email: employee.user.email,
        designation: employee.user.designation,
        department: employee.user.department,
        avatarUrl: employee.user.avatarUrl,
      },
      projects,
      totalAssignedCompensation,
    });
  } catch (error) {
    console.error("Failed to fetch employee project compensation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
