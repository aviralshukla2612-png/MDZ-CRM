import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN", "SALES", "EMPLOYEE"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    // 1. Ensure all active users with activeRole EMPLOYEE, SUB_ADMIN, or SALES have an employee profile
    const unlinkedUsers = await prisma.user.findMany({
      where: {
        activeRole: { in: ["EMPLOYEE", "SUB_ADMIN", "SALES"] },
        employeeProfile: null,
      },
    });
    for (const u of unlinkedUsers) {
      const code = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      await prisma.employee.create({
        data: {
          userId: u.id,
          employeeIdCode: code,
          skillsJson: "[]",
        },
      });
    }

    const employees = await prisma.employee.findMany({
      where: {
        user: {
          activeRole: {
            not: "OWNER",
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        attendances: true,
        workSessions: {
          include: { project: true },
        },
        memberships: {
          where: { isActive: true },
          include: {
            project: {
              include: {
                client: true,
                tasks: true,
                memberships: {
                  where: { isActive: true },
                  include: {
                    employee: {
                      include: { user: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const formatted = employees.map((e) => {
      const today = new Date();
      const isToday = (dateStr: string | Date) => {
        const d = new Date(dateStr);
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      };
      const todayAtt = e.attendances.filter(a => isToday(a.date));
      const isPunchedIn = todayAtt.some((a) => a.punchIn && !a.punchOut);
      const isShiftCompleted = todayAtt.some((a) => a.punchIn && a.punchOut);

      const activeMemberships = (e.memberships || []).filter((m) => m.project != null);
      const assignedProjects = activeMemberships.map((m) => {
        const p = m.project;
        const totalTasks = p.tasks?.filter((t: any) => t.status !== "ARCHIVED").length || 0;
        const completedTasks = p.tasks?.filter((t: any) => (t.status === "COMPLETED" || t.status === "DONE") && t.status !== "ARCHIVED").length || 0;
        const calculatedProgress = totalTasks === 0 ? (p.progressPercentage || 0) : Math.round((completedTasks / totalTasks) * 100);

        return {
          id: p.id,
          projectNumber: p.projectNumber,
          name: p.name,
          status: p.status,
          priority: p.priority,
          progress: calculatedProgress,
          progressPercentage: calculatedProgress,
          contractValue: p.contractValue || 0,
          targetDeadline: p.targetDeadline ? new Date(p.targetDeadline).toLocaleDateString() : "No Deadline",
          roleInProject: m.roleInProject,
          assignedAt: m.assignedAt ? new Date(m.assignedAt).toLocaleDateString() : undefined,
          compensationAmount: m.compensationAmount,
          clientName: p.client?.companyName || "Unknown Client",
          totalTasks,
          completedTasks,
          teamMembers: (p.memberships || []).map((pm: any) => ({
            id: pm.employee?.id || pm.employeeId || "unknown",
            employeeId: pm.employeeId || pm.employee?.id,
            employeeIdCode: pm.employee?.employeeIdCode,
            userId: pm.employee?.userId,
            name: pm.employee?.user?.name || "Unknown User",
            email: pm.employee?.user?.email,
            role: pm.roleInProject,
            active: pm.isActive,
          })),
          tasks: (p.tasks || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            isMostImportant: t.isMostImportant,
          })),
        };
      });

      return {
        id: e.id,
        userId: e.userId,
        employeeId: e.employeeIdCode,
        name: e.user?.name || "Employee",
        email: e.user?.email || "",
        avatarUrl: e.user?.avatarUrl || null,
        role: e.user?.activeRole || "EMPLOYEE",
        designation: e.user?.designation || "Developer",
        department: e.user?.department || "Engineering",
        phone: "+91 98980 000" + (e.employeeIdCode.length > 3 ? e.employeeIdCode.slice(-2) : "01"),
        punchedIn: isPunchedIn,
        shiftCompleted: isShiftCompleted,
        punchInTime: todayAtt[0]?.punchIn ? new Date(todayAtt[0].punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "09:00 AM",
        todayWorkSeconds: (e.attendances[0]?.totalMinutes || 120) * 60,
        currentProject: assignedProjects[0]?.name || e.workSessions[0]?.project?.name || "General Workspace",
        currentTask: e.workSessions[0]?.notes || "Focusing on active tasks",
        totalProjects: assignedProjects.length,
        activeProjectsCount: assignedProjects.filter((p) => (p.status || "").toUpperCase() === "IN_PROGRESS").length,
        planningProjectsCount: assignedProjects.filter((p) => {
          const s = (p.status || "").toUpperCase();
          return s === "PLANNING" || s === "DRAFT" || s.includes("PENDING") || s.includes("ALLOCATION");
        }).length,
        completedProjectsCount: assignedProjects.filter((p) => {
          const s = (p.status || "").toUpperCase();
          return s === "COMPLETED" || s === "DONE" || s === "DELIVERED";
        }).length,
        onHoldProjectsCount: assignedProjects.filter((p) => {
          const s = (p.status || "").toUpperCase();
          return s === "ON_HOLD" || s === "PAUSED" || s === "BLOCKED";
        }).length,
        assignedProjects: assignedProjects,
        todayTimeline: e.workSessions.map((w) => ({
          id: w.id,
          timeRange: "09:00 AM - 11:00 AM",
          activity: w.notes || "Core development",
          project: w.project?.name || "General",
          duration: `${w.durationMinutes}m`,
        })),
        attendanceRecord: e.attendances.map((a) => ({
          date: new Date(a.date).toLocaleDateString(),
          punchIn: a.punchIn ? new Date(a.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "09:00 AM",
          punchOut: a.punchOut ? new Date(a.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "On-Going",
          status: a.status,
          workHours: `${Math.floor((a.totalMinutes || 0) / 60)}h ${(a.totalMinutes || 0) % 60}m`,
        })),
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ success: false, error: "Missing required fields: name, email, password" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 409 });
    }

    const count = await prisma.employee.count();
    const code = `EMP-${Math.floor(100 + Math.random() * 900)}`;
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: body.email,
          passwordHash: hashedPassword,
          name: body.name,
          designation: body.designation || "Team Member",
          department: body.department || "General",
          activeRole: body.role === "SALES" ? "SALES" : body.role === "SUB_ADMIN" ? "SUB_ADMIN" : "EMPLOYEE",
          avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + count * 100}?w=150`,
        },
      });

      // Fetch prevailing company leave policy from an existing employee
      const referenceEmployee = await tx.employee.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { sickLeaveTotal: true, casualLeaveTotal: true, paidLeaveTotal: true }
      });

      const newEmployee = await tx.employee.create({
        data: {
          userId: newUser.id,
          employeeIdCode: code,
          salaryMonthly: body.salaryMonthly || 0,
          skillsJson: JSON.stringify(body.skills || []),
          sickLeaveTotal: referenceEmployee?.sickLeaveTotal ?? 10,
          casualLeaveTotal: referenceEmployee?.casualLeaveTotal ?? 15,
          paidLeaveTotal: referenceEmployee?.paidLeaveTotal ?? 15,
        },
      });

      return { user: newUser, employee: newEmployee };
    });

    const { passwordHash, ...safeUser } = result.user;

    return NextResponse.json({ success: true, data: { id: result.employee.id, code, user: safeUser } });
  } catch (error) {
    console.error("Employee Creation Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create employee" }, { status: 500 });
  }
}
