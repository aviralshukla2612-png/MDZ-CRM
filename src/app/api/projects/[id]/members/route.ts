import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const project = await prisma.project.findFirst({
      where: { OR: [{ id: params.id }, { projectNumber: params.id }] },
      include: {
        memberships: {
          include: {
            employee: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    // Get list of all active employees to choose from
    const allEmployees = await prisma.employee.findMany({
      where: {
        user: {
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            department: true,
            activeRole: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    return NextResponse.json({
      success: true,
      members: project.memberships.filter((m) => m.isActive),
      removalHistory: project.memberships.filter((m) => !m.isActive),
      availableEmployees: allEmployees.map((e) => ({
        id: e.id,
        name: e.user?.name || "Unknown",
        email: e.user?.email,
        designation: e.user?.designation || "Developer",
        department: e.user?.department || "Engineering",
        role: e.user?.activeRole,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching project members:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch project members" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { employeeId, roleInProject, compensationAmount } = body;

    if (!employeeId) {
      return NextResponse.json({ success: false, error: "Employee is required" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { OR: [{ id: params.id }, { projectNumber: params.id }] },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const role = roleInProject || "DEVELOPER";

    // Check if membership already exists
    const existing = await prisma.projectMembership.findFirst({
      where: {
        projectId: project.id,
        employeeId: employee.id,
      },
    });

    let membership;
    if (existing) {
      membership = await prisma.projectMembership.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          roleInProject: role,
          compensationAmount: compensationAmount !== undefined && compensationAmount !== "" ? Number(compensationAmount) : existing.compensationAmount,
          assignedById: authRes.id,
          assignedAt: new Date(),
          removedAt: null,
          removedById: null,
          removalReason: null,
        },
      });
    } else {
      membership = await prisma.projectMembership.create({
        data: {
          projectId: project.id,
          employeeId: employee.id,
          roleInProject: role,
          compensationAmount: compensationAmount !== undefined && compensationAmount !== "" ? Number(compensationAmount) : undefined,
          assignedById: authRes.id,
          isActive: true,
        },
      });
    }

    // If project was awaiting Sub Admin team allocation, activate it to IN_PROGRESS
    if (project.status === "PENDING_SUB_ADMIN_ALLOCATION") {
      await prisma.project.update({
        where: { id: project.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    // Send notification to the assigned employee
    if (employee.userId) {
      try {
        await prisma.notification.create({
          data: {
            recipientId: employee.userId,
            title: "New Project Assignment",
            message: `Admin assigned you to project "${project.name}" as ${role}.`,
            urgency: "HIGH",
            linkUrl: `/projects/${project.id}`,
          },
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${employee.user?.name || "Developer"} as ${role}`,
      data: membership,
    });
  } catch (error: any) {
    console.error("Error assigning member:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to assign member" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const membershipId = searchParams.get("membershipId");
    const reason = searchParams.get("reason") || "Reassigned by Admin";

    if (!membershipId) {
      return NextResponse.json({ success: false, error: "membershipId is required" }, { status: 400 });
    }

    const membership = await prisma.projectMembership.update({
      where: { id: membershipId },
      data: {
        isActive: false,
        removedAt: new Date(),
        removedById: authRes.id,
        removalReason: reason,
      },
      include: {
        employee: { include: { user: true } },
        project: true,
      },
    });

    if (membership.employee?.userId) {
      try {
        await prisma.notification.create({
          data: {
            recipientId: membership.employee.userId,
            title: "Removed from Project",
            message: `You were removed from "${membership.project.name}". Reason: ${reason}`,
            urgency: "NORMAL",
            linkUrl: `/projects`,
          },
        });
      } catch (notifErr) {
        console.error("Failed to create notification:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Member removed from project successfully",
    });
  } catch (error: any) {
    console.error("Error removing member:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to remove member" }, { status: 500 });
  }
}
