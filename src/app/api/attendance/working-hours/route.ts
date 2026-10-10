import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/attendance/working-hours
export async function GET(req: NextRequest) {
  try {
    const authRes = await requireAuth();
    if (authRes instanceof NextResponse) return authRes;

    // Fetch global system setting for default working hours
    const defaultSetting = await prisma.systemSetting.findUnique({
      where: { key: "default_daily_working_hours" },
    });
    const defaultWorkingHours = parseFloat(defaultSetting?.value || "8.0");

    // Fetch all active/employee profiles
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            department: true,
            avatarUrl: true,
            activeRole: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedEmployees = employees.map((emp) => ({
      id: emp.id,
      userId: emp.userId,
      employeeIdCode: emp.employeeIdCode,
      name: emp.user.name,
      email: emp.user.email,
      designation: emp.user.designation || "Team Member",
      department: emp.user.department || "General",
      avatarUrl: emp.user.avatarUrl,
      activeRole: emp.user.activeRole,
      status: emp.status,
      targetWorkingHours: emp.targetWorkingHours || defaultWorkingHours,
    }));

    return NextResponse.json({
      success: true,
      defaultWorkingHours,
      employees: formattedEmployees,
    });
  } catch (error) {
    console.error("GET /api/attendance/working-hours error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch working hours data" }, { status: 500 });
  }
}

// POST /api/attendance/working-hours
export async function POST(req: NextRequest) {
  try {
    const authRes = await requireAuth();
    if (authRes instanceof NextResponse) return authRes;

    const allowedRoles = ["OWNER", "ADMIN", "SUB_ADMIN"];
    if (!allowedRoles.includes(authRes.activeRole)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Admin / Owner can manage employee working hours" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, defaultWorkingHours, employeeId, hours, employeeHoursMap, applyToAll } = body;

    // 1. Set Global Default Working Hours
    if (action === "SET_GLOBAL_DEFAULT" || defaultWorkingHours !== undefined) {
      const parsedDefault = parseFloat(String(defaultWorkingHours));
      if (isNaN(parsedDefault) || parsedDefault <= 0 || parsedDefault > 24) {
        return NextResponse.json({ success: false, error: "Invalid working hours value (must be 0.5 - 24 hours)" }, { status: 400 });
      }

      await prisma.systemSetting.upsert({
        where: { key: "default_daily_working_hours" },
        update: { value: String(parsedDefault) },
        create: { id: "default_daily_working_hours", key: "default_daily_working_hours", value: String(parsedDefault) },
      });

      if (applyToAll) {
        await prisma.employee.updateMany({
          data: { targetWorkingHours: parsedDefault },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Global default working hours set to ${parsedDefault}h${applyToAll ? " and applied to all employees" : ""}`,
      });
    }

    // 2. Assign Working Hours to Single Employee
    if (action === "ASSIGN_EMPLOYEE" || (employeeId && hours !== undefined)) {
      const parsedHours = parseFloat(String(hours));
      if (isNaN(parsedHours) || parsedHours <= 0 || parsedHours > 24) {
        return NextResponse.json({ success: false, error: "Invalid working hours (must be 0.5 - 24 hours)" }, { status: 400 });
      }

      const updated = await prisma.employee.update({
        where: { id: employeeId },
        data: { targetWorkingHours: parsedHours },
        include: { user: { select: { name: true } } },
      });

      return NextResponse.json({
        success: true,
        message: `Updated target working hours for ${updated.user.name} to ${parsedHours} hours/day`,
        employee: updated,
      });
    }

    // 3. Bulk Assign Working Hours to Multiple Employees
    if (action === "BULK_ASSIGN" && employeeHoursMap && typeof employeeHoursMap === "object") {
      const updates = [];
      for (const [empId, empHours] of Object.entries(employeeHoursMap)) {
        const val = parseFloat(String(empHours));
        if (!isNaN(val) && val > 0 && val <= 24) {
          updates.push(
            prisma.employee.update({
              where: { id: empId },
              data: { targetWorkingHours: val },
            })
          );
        }
      }

      await Promise.all(updates);

      return NextResponse.json({
        success: true,
        message: `Successfully updated working hours for ${updates.length} employees`,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action or missing parameters" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/attendance/working-hours error:", error);
    return NextResponse.json({ success: false, error: "Failed to update working hours" }, { status: 500 });
  }
}
