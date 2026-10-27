import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    let employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { userId: authRes.id },
          ...(authRes.employeeId ? [{ id: authRes.employeeId }] : []),
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            designation: true,
            department: true,
            activeRole: true,
          },
        },
      },
    });

    if (!employee) {
      // Auto-provision employee profile for unlinked active users
      const code = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      employee = await prisma.employee.create({
        data: {
          userId: authRes.id,
          employeeIdCode: code,
          skillsJson: "[]",
          phone: "",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
              designation: true,
              department: true,
              activeRole: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: employee.id,
        employeeIdCode: employee.employeeIdCode,
        name: employee.user?.name || "Employee",
        email: employee.user?.email || "",
        phone: employee.user?.phone || employee.phone || "",
        avatarUrl: employee.user?.avatarUrl || null,
        designation: employee.user?.designation || "Staff",
        department: employee.user?.department || "Operations",
        relative1Name: employee.relative1Name || "",
        relative1Relation: employee.relative1Relation || "Father",
        relative1Phone: employee.relative1Phone || "",
        relative2Name: employee.relative2Name || "",
        relative2Relation: employee.relative2Relation || "Mother",
        relative2Phone: employee.relative2Phone || "",
      },
    });
  } catch (error) {
    console.error("GET /api/employees/me error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch profile details" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();

    let employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { userId: authRes.id },
          ...(authRes.employeeId ? [{ id: authRes.employeeId }] : []),
        ],
      },
    });

    if (!employee) {
      const code = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      employee = await prisma.employee.create({
        data: {
          userId: authRes.id,
          employeeIdCode: code,
          skillsJson: "[]",
        },
      });
    }

    const employeeUpdateData: any = {};
    const userUpdateData: any = {};

    if (body.phone !== undefined) {
      const cleanPhone = String(body.phone || "").trim();
      employeeUpdateData.phone = cleanPhone;
      userUpdateData.phone = cleanPhone;
    }

    if (body.relative1Name !== undefined) employeeUpdateData.relative1Name = String(body.relative1Name || "").trim();
    if (body.relative1Relation !== undefined) employeeUpdateData.relative1Relation = String(body.relative1Relation || "").trim();
    if (body.relative1Phone !== undefined) employeeUpdateData.relative1Phone = String(body.relative1Phone || "").trim();

    if (body.relative2Name !== undefined) employeeUpdateData.relative2Name = String(body.relative2Name || "").trim();
    if (body.relative2Relation !== undefined) employeeUpdateData.relative2Relation = String(body.relative2Relation || "").trim();
    if (body.relative2Phone !== undefined) employeeUpdateData.relative2Phone = String(body.relative2Phone || "").trim();

    const updatedEmployee = await prisma.employee.update({
      where: { id: employee.id },
      data: employeeUpdateData,
    });

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: authRes.id },
        data: userUpdateData,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Emergency relative contacts updated successfully",
      data: {
        id: updatedEmployee.id,
        relative1Name: updatedEmployee.relative1Name || "",
        relative1Relation: updatedEmployee.relative1Relation || "",
        relative1Phone: updatedEmployee.relative1Phone || "",
        relative2Name: updatedEmployee.relative2Name || "",
        relative2Relation: updatedEmployee.relative2Relation || "",
        relative2Phone: updatedEmployee.relative2Phone || "",
      },
    });
  } catch (error) {
    console.error("PATCH /api/employees/me error:", error);
    return NextResponse.json({ success: false, error: "Failed to update relative contacts" }, { status: 500 });
  }
}
