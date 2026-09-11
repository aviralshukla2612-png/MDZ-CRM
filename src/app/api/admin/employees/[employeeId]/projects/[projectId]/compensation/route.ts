import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { employeeId: string; projectId: string } }
) {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { amount, currency } = body;

    // Validate amount format: null (to clear/reset), or non-negative finite number
    if (amount !== null && amount !== undefined) {
      if (
        typeof amount !== "number" ||
        isNaN(amount) ||
        !isFinite(amount) ||
        amount < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid monetary amount. Must be a non-negative number or null.",
          },
          { status: 400 }
        );
      }
    }

    // Resolve employee
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [{ id: params.employeeId }, { employeeIdCode: params.employeeId }],
      },
      select: { id: true, userId: true, user: { select: { name: true } } },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found." },
        { status: 404 }
      );
    }

    // Verify Project exists
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 }
      );
    }

    // Verify Active ProjectMembership exists
    const membership = await prisma.projectMembership.findFirst({
      where: {
        employeeId: employee.id,
        projectId: project.id,
        isActive: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Forbidden: Employee is not assigned to this project or assignment is inactive.",
        },
        { status: 403 }
      );
    }

    const oldAmount = membership.compensationAmount;
    const newAmount = amount === undefined ? oldAmount : amount;
    const newCurrency = currency || membership.currency || "INR";

    // Update ProjectMembership
    const updatedMembership = await prisma.projectMembership.update({
      where: { id: membership.id },
      data: {
        compensationAmount: newAmount,
        currency: newCurrency,
      },
    });

    // Record Audit Event
    try {
      await prisma.activityEvent.create({
        data: {
          eventType: "PROJECT_COMPENSATION_UPDATED",
          actorId: authRes.id,
          entityType: "ProjectMembership",
          entityId: membership.id,
          projectId: project.id,
          metadataJson: JSON.stringify({
            employeeId: employee.id,
            employeeName: employee.user.name,
            projectId: project.id,
            projectName: project.name,
            oldAmount,
            newAmount,
            currency: newCurrency,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (auditErr) {
      console.error("Audit log error (non-fatal):", auditErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        membershipId: updatedMembership.id,
        employeeId: employee.id,
        projectId: project.id,
        compensationAmount: updatedMembership.compensationAmount,
        currency: updatedMembership.currency,
      },
    });
  } catch (error) {
    console.error("Failed to update project compensation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
