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

    const r1Phone = (employee.relative1Phone || "").trim();
    const r2Phone = (employee.relative2Phone || "").trim();
    const r1Digits = r1Phone.replace(/\D/g, "");
    const r2Digits = r2Phone.replace(/\D/g, "");
    const hasBothRelatives = Boolean(r1Digits.length >= 10 && r2Digits.length >= 10);

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
        hasBothRelatives,
        needsRelatives: !hasBothRelatives,
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

    // Compulsory check: If updating relative numbers, both relative1Phone and relative2Phone are strictly compulsory
    const isUpdatingRelatives = body.relative1Phone !== undefined || body.relative2Phone !== undefined;

    if (isUpdatingRelatives) {
      const p1 = String(body.relative1Phone || "").trim();
      const p2 = String(body.relative2Phone || "").trim();
      const d1 = p1.replace(/\D/g, "");
      const d2 = p2.replace(/\D/g, "");

      if (!p1 || d1.length < 10) {
        return NextResponse.json(
          { success: false, error: "Relative 1 phone number is compulsory and must contain at least 10 digits." },
          { status: 400 }
        );
      }
      if (!p2 || d2.length < 10) {
        return NextResponse.json(
          { success: false, error: "Relative 2 phone number is compulsory and must contain at least 10 digits." },
          { status: 400 }
        );
      }
      if (d1 === d2) {
        return NextResponse.json(
          { success: false, error: "Relative 1 and Relative 2 must be different contact numbers." },
          { status: 400 }
        );
      }

      employeeUpdateData.relative1Phone = p1;
      employeeUpdateData.relative2Phone = p2;
    }

    if (body.relative1Name !== undefined) employeeUpdateData.relative1Name = String(body.relative1Name || "").trim();
    if (body.relative1Relation !== undefined) employeeUpdateData.relative1Relation = String(body.relative1Relation || "").trim() || "Father";

    if (body.relative2Name !== undefined) employeeUpdateData.relative2Name = String(body.relative2Name || "").trim();
    if (body.relative2Relation !== undefined) employeeUpdateData.relative2Relation = String(body.relative2Relation || "").trim() || "Mother";

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

    const r1Digits = (updatedEmployee.relative1Phone || "").replace(/\D/g, "");
    const r2Digits = (updatedEmployee.relative2Phone || "").replace(/\D/g, "");
    const hasBothRelatives = Boolean(r1Digits.length >= 10 && r2Digits.length >= 10);

    return NextResponse.json({
      success: true,
      message: "Emergency relative contacts saved successfully",
      hasBothRelatives,
      needsRelatives: !hasBothRelatives,
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
