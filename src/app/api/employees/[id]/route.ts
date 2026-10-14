import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const employee = await prisma.employee.findFirst({
      where: { OR: [{ id: params.id }, { employeeIdCode: params.id }] },
      include: {
        user: true,
        attendances: { orderBy: { date: "desc" } },
        statusEvents: { orderBy: { startedAt: "desc" } },
        workSessions: { include: { project: true } },
        memberships: {
          where: { isActive: true },
          include: {
            project: {
              include: {
                client: { select: { companyName: true } },
                tasks: { select: { id: true, status: true } },
              },
            },
          },
        },
        dailyWorkLogs: { orderBy: { date: "desc" }, take: 60 },
      },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    // IDOR Protection: Only OWNER/ADMIN/SUB_ADMIN or the employee themselves can access this profile
    if (authRes.activeRole !== "OWNER" && authRes.activeRole !== "ADMIN" && authRes.activeRole !== "SUB_ADMIN" && authRes.employeeId !== employee.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You cannot access another employee's profile" }, { status: 403 });
    }

    // Confidentiality Isolation: Strips compensationAmount for non-OWNER role
    if (authRes.activeRole !== "OWNER") {
      employee.memberships = employee.memberships.map((m: any) => ({
        ...m,
        compensationAmount: null,
      }));
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch employee" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    
    const existing = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { user: true }
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const isAdmin = ["OWNER", "ADMIN", "SUB_ADMIN"].includes(authRes.activeRole);
    const isSelf = existing.userId === authRes.id || existing.id === authRes.employeeId;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ success: false, error: "Forbidden: You cannot modify this employee profile" }, { status: 403 });
    }

    const userUpdateData: any = {};
    const employeeUpdateData: any = {};

    // Mobile / Phone update (Allowed for Admin, Sub-Admin, and Employee self-service)
    if (body.phone !== undefined) {
      const cleanPhone = String(body.phone || "").trim();
      userUpdateData.phone = cleanPhone;
      employeeUpdateData.phone = cleanPhone;
    }
    if (body.mobile !== undefined) {
      const cleanMobile = String(body.mobile || "").trim();
      userUpdateData.phone = cleanMobile;
      employeeUpdateData.phone = cleanMobile;
    }

    // Relative 1 & Relative 2 Emergency Contacts (Compulsory 2 relative phone numbers)
    if (body.relative1Name !== undefined) employeeUpdateData.relative1Name = String(body.relative1Name || "").trim();
    if (body.relative1Relation !== undefined) employeeUpdateData.relative1Relation = String(body.relative1Relation || "").trim();
    if (body.relative1Phone !== undefined) employeeUpdateData.relative1Phone = String(body.relative1Phone || "").trim();

    if (body.relative2Name !== undefined) employeeUpdateData.relative2Name = String(body.relative2Name || "").trim();
    if (body.relative2Relation !== undefined) employeeUpdateData.relative2Relation = String(body.relative2Relation || "").trim();
    if (body.relative2Phone !== undefined) employeeUpdateData.relative2Phone = String(body.relative2Phone || "").trim();


    // Admin & Sub-Admin controls (Email, Name, Designation, Department, Salary, Status, etc.)
    if (isAdmin) {
      if (body.email !== undefined) {
        const cleanEmail = String(body.email || "").toLowerCase().trim();
        if (cleanEmail && cleanEmail !== existing.user?.email) {
          const duplicate = await prisma.user.findUnique({ where: { email: cleanEmail } });
          if (duplicate && duplicate.id !== existing.userId) {
            return NextResponse.json({ success: false, error: "Email is already in use by another account" }, { status: 400 });
          }
          userUpdateData.email = cleanEmail;
        }
      }
      if (body.name) userUpdateData.name = body.name;
      if (body.designation) userUpdateData.designation = body.designation;
      if (body.department) userUpdateData.department = body.department;
      if (body.isActive !== undefined) userUpdateData.isActive = body.isActive;
      if (body.salaryMonthly !== undefined) employeeUpdateData.salaryMonthly = Number(body.salaryMonthly);
      if (body.status) employeeUpdateData.status = body.status;

      // Daily Target Quota controls (Managed by Admin, Sub-Admin, and Owner)
      if (body.dailyTargetTitle !== undefined) employeeUpdateData.dailyTargetTitle = String(body.dailyTargetTitle || "Tasks").trim();
      if (body.dailyTargetCount !== undefined) employeeUpdateData.dailyTargetCount = Math.max(0, Number(body.dailyTargetCount) || 0);
      if (body.dailyTargetUnit !== undefined) employeeUpdateData.dailyTargetUnit = String(body.dailyTargetUnit || "units").trim();
      if (body.dailyTargetNotes !== undefined) employeeUpdateData.dailyTargetNotes = String(body.dailyTargetNotes || "").trim();
    }

    const updatedEmployee = await prisma.$transaction(async (tx) => {
      if (Object.keys(employeeUpdateData).length > 0) {
        await tx.employee.update({
          where: { id: params.id },
          data: employeeUpdateData,
        });
      }

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userUpdateData,
        });
      }

      return await tx.employee.findUnique({
        where: { id: params.id },
        include: { user: true }
      });
    });

    if (updatedEmployee && updatedEmployee.user) {
      const { passwordHash, ...safeUser } = updatedEmployee.user;
      (updatedEmployee as any).user = safeUser;
    }

    return NextResponse.json({ success: true, data: updatedEmployee });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    // We cannot delete the User record because they might be the "createdBy" on Projects/Leads.
    // Doing so would cascade-delete important company data or fail due to FK constraints.
    // Instead, we delete the Employee profile (which cascades to attendances, memberships) 
    // and soft-delete/deactivate the User account.
    
    await prisma.$transaction([
      prisma.employee.delete({
        where: { id: params.id },
      }),
      prisma.user.update({
        where: { id: employee.userId },
        data: { 
          isActive: false,
          activeRole: "DEACTIVATED",
        }
      }),
      // Remove all specific role assignments
      prisma.userRole.deleteMany({
        where: { userId: employee.userId }
      })
    ]);

    return NextResponse.json({ success: true, data: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete employee" }, { status: 500 });
  }
}

