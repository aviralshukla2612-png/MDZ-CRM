import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET() {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  if (authRes.activeRole === "CLIENT") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  let whereClause = {};
  if (authRes.activeRole === "EMPLOYEE") {
    let empId = authRes.employeeId;
    if (!empId) {
      const emp = await prisma.employee.findFirst({
        where: { userId: authRes.id },
      });
      empId = emp?.id;
    }
    whereClause = {
      memberships: {
        some: {
          OR: [
            ...(empId ? [{ employeeId: empId }] : []),
            { employee: { userId: authRes.id } },
          ],
          isActive: true,
        },
      },
    };
  }

  try {
    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        memberships: {
          include: {
            employee: {
              include: { user: true },
            },
          },
        },
        tasks: {
          include: { assignedTo: true },
        },
        documents: true,
        changeRequests: true,
        clientUpdates: {
          include: { author: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const isEmployee = authRes.activeRole === "EMPLOYEE";
    const isAdminOrSubAdmin = ["OWNER", "ADMIN", "SUB_ADMIN"].includes(authRes.activeRole);

    const formatted = projects.map((p) => {
      const activeTasks = p.tasks ? p.tasks.filter((t) => t.status !== "ARCHIVED") : [];
      const totalTasks = activeTasks.length;
      const completedTasks = activeTasks.filter(
        (t) => t.status === "COMPLETED" || t.status === "DONE"
      ).length;

      let calculatedProgress = 0;
      if (totalTasks > 0) {
        calculatedProgress = Math.round((completedTasks / totalTasks) * 100);
      } else if (p.status === "COMPLETED") {
        calculatedProgress = 100;
      } else if (p.clientUpdates && p.clientUpdates.length > 0) {
        calculatedProgress = Math.min(100, p.clientUpdates.length * 25);
      }

      const activeMembers = p.memberships.filter((m) => m.isActive);
      const tmMembership = activeMembers.find((m) => m.roleInProject === "TM") || activeMembers[0];
      const primaryMember = activeMembers[0];

      return {
        id: p.id,
        projectCode: p.projectNumber,
        name: p.name,
        clientId: p.clientId,
        clientName: p.client ? p.client.companyName : "Client Account",
        tmId: tmMembership?.employee?.id || "UNASSIGNED",
        tmName: tmMembership?.employee?.user?.name ? `${tmMembership.employee.user.name}${tmMembership.roleInProject === "TM" ? " (Tech Lead)" : ""}` : "Unassigned",
        assignedEmployeeId: primaryMember?.employee?.id || primaryMember?.employeeId || null,
        assignedEmployeeName: primaryMember?.employee?.user?.name || null,
        progress: calculatedProgress,
        progressPercentage: calculatedProgress,
        currentStage: p.status,
        contractValue: isAdminOrSubAdmin ? p.contractValue : undefined,
        paidValue: isAdminOrSubAdmin ? 0 : undefined,
        overdueValue: isAdminOrSubAdmin ? 0 : undefined,
        deadline: p.targetDeadline ? new Date(p.targetDeadline).toLocaleDateString() : null,
        targetDeadline: p.targetDeadline ? p.targetDeadline.toISOString() : null,
        status: p.status,
        health: p.priority === "URGENT" ? "AT_RISK" : "ON_TRACK",
        scopeItems: p.scopeText ? p.scopeText.split("\n") : ["Storefront Next.js App Router"],
        teamMembers: p.memberships.map((m) => ({
          id: m.employee?.id || m.employeeId || "unknown",
          employeeId: m.employeeId || m.employee?.id,
          employeeIdCode: m.employee?.employeeIdCode,
          userId: m.employee?.userId,
          name: m.employee?.user?.name || "Unknown User",
          email: m.employee?.user?.email,
          role: m.roleInProject,
          assignedDate: new Date(m.assignedAt).toLocaleDateString(),
          active: m.isActive,
        })),
        removalHistory: p.memberships
          .filter((m) => !m.isActive)
          .map((m) => ({
            id: m.id,
            name: m.employee?.user?.name || "Unknown User",
            role: m.roleInProject,
            removedDate: m.removedAt ? new Date(m.removedAt).toLocaleDateString() : (m.assignedAt ? new Date(m.assignedAt).toLocaleDateString() : new Date().toLocaleDateString()),
            reason: m.removalReason || "Reassigned to another project",
          })),
        tasks: (isEmployee && authRes.employeeId
          ? p.tasks.filter((t) => t.assignedToId === authRes.employeeId)
          : p.tasks
        ).map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description || null,
          assignee: t.assignedTo?.name || "Unassigned",
          assigneeAvatar: (t.assignedTo as any)?.avatarUrl || null,
          status: t.status,
          priority: t.priority,
          isMostImportant: t.isMostImportant || false,
          deadline: t.deadline ? t.deadline.toISOString() : null,
          startDate: t.startDate ? t.startDate.toISOString() : null,
          createdAt: t.createdAt.toISOString(),
          completedAt: t.completedAt ? t.completedAt.toISOString() : null,
          blockedReason: t.status === "BLOCKED" ? "Waiting for client input" : undefined,
          assignedToId: t.assignedToId,
          projectId: p.id,
          projectName: p.name,
          clientName: p.client ? p.client.companyName : "Client Account",
        })),
        livingDocs: p.documents.map((d) => ({
          id: d.id,
          title: d.title,
          version: `v${d.version}.0`,
          lastUpdated: new Date(d.updatedAt).toLocaleDateString(),
          author: "Meet Shah",
          content: d.content,
        })),
        changeRequests: p.changeRequests.map((cr) => ({
          id: cr.requestNumber,
          title: cr.requestedChange,
          value: cr.costImpactAmount,
          status: cr.status,
          date: new Date(cr.createdAt).toLocaleDateString(),
        })),
        clientUpdates: (p.clientUpdates || []).map((u) => ({
          id: u.id,
          title: u.title,
          content: u.content,
          createdAt: u.createdAt.toISOString(),
          authorName: u.author?.name || "Employee",
          authorRole: u.author?.activeRole || "EMPLOYEE",
          author: {
            name: u.author?.name || "Employee",
            designation: u.author?.designation || "Developer",
          },
        })),
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch projects from database" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN", "SALES", "EMPLOYEE"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();

    // 1. Resolve or create a valid Client to prevent foreign key constraint violations
    let client = null;
    if (body.clientId) {
      client = await prisma.client.findUnique({ where: { id: body.clientId } });
    }

    if (!client && body.clientName && typeof body.clientName === "string" && body.clientName.trim()) {
      const trimmedClientName = body.clientName.trim();
      client = await prisma.client.findFirst({
        where: { companyName: trimmedClientName },
      });
      if (!client) {
        const clientCount = await prisma.client.count();
        const clientNumber = `CLT-${String(clientCount + 1).padStart(3, "0")}-${Math.floor(100 + Math.random() * 900)}`;
        client = await prisma.client.create({
          data: {
            clientNumber,
            companyName: trimmedClientName,
            email: `${trimmedClientName.toLowerCase().replace(/[^a-z0-9]/g, "") || "client"}@example.com`,
            phone: "+91 98765 43210",
            createdById: authRes.id,
            contacts: {
              create: [
                {
                  name: "Primary Contact",
                  designation: "Executive",
                  isPrimary: true,
                },
              ],
            },
          },
        });
      }
    }

    if (!client) {
      client = await prisma.client.findFirst();
    }

    if (!client) {
      const clientCount = await prisma.client.count();
      const clientNumber = `CLT-${String(clientCount + 1).padStart(3, "0")}`;
      client = await prisma.client.create({
        data: {
          clientNumber,
          companyName: "Zenith Tech Labs",
          email: "contact@zenithtech.com",
          phone: "+91 98765 43210",
          createdById: authRes.id,
          contacts: {
            create: [
              {
                name: "Primary Contact",
                designation: "Executive",
                isPrimary: true,
              },
            ],
          },
        },
      });
    }

    // 2. Generate a unique project number
    const projectCount = await prisma.project.count();
    const uniqueCode = `PRJ-${new Date().getFullYear()}-${String(projectCount + 1).padStart(3, "0")}-${Math.floor(100 + Math.random() * 900)}`;

    const data: any = {
      projectNumber: uniqueCode,
      name: body.name || "New Digital Solution",
      clientId: client.id,
      contractValue: Number(body.contractValue) || 0,
      status: body.status || "PLANNING",
      priority: body.priority || "HIGH",
      progressPercentage: typeof body.progressPercentage === "number" ? body.progressPercentage : (Number(body.progressPercentage) || 0),
      targetDeadline: body.deadline ? new Date(body.deadline) : (body.targetDeadline ? new Date(body.targetDeadline) : null),
      createdById: authRes.id,
    };

    let assignedEmp: any = null;
    if (body.assigneeId) {
      assignedEmp = await prisma.employee.findFirst({
        where: {
          OR: [
            { id: body.assigneeId },
            { userId: body.assigneeId },
            { employeeIdCode: body.assigneeId },
          ],
        },
        include: { user: true },
      });

      if (!assignedEmp) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ id: body.assigneeId }, { email: body.assigneeId }],
          },
        });
        if (user) {
          const code = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
          assignedEmp = await prisma.employee.create({
            data: {
              userId: user.id,
              employeeIdCode: code,
              skillsJson: "[]",
            },
            include: { user: true },
          });
        }
      }

      if (assignedEmp) {
        data.memberships = {
          create: [
            {
              employeeId: assignedEmp.id,
              roleInProject: body.roleInProject || "TM",
              isActive: true,
              assignedById: authRes.id,
            },
          ],
        };
      }
    }

    // Auto-assign the creating employee if not designated
    if (!assignedEmp) {
      let creatorEmpId = authRes.employeeId;
      if (!creatorEmpId && authRes.activeRole === "EMPLOYEE") {
        const creatorEmp = await prisma.employee.findFirst({
          where: { userId: authRes.id },
        });
        creatorEmpId = creatorEmp?.id;
      }

      if (creatorEmpId) {
        assignedEmp = await prisma.employee.findUnique({
          where: { id: creatorEmpId },
          include: { user: true },
        });

        if (assignedEmp) {
          data.memberships = {
            create: [
              {
                employeeId: assignedEmp.id,
                roleInProject: body.roleInProject || "DEVELOPER",
                isActive: true,
                assignedById: authRes.id,
              },
            ],
          };
        }
      }
    }

    const newProject = await prisma.project.create({
      data,
      include: {
        client: true,
        memberships: {
          include: {
            employee: {
              include: { user: true }
            }
          }
        }
      },
    });

    if (assignedEmp && assignedEmp.userId) {
      try {
        await prisma.notification.create({
          data: {
            recipientId: assignedEmp.userId,
            title: "New Project Assignment",
            message: `Admin has assigned you to a new project: ${newProject.name}`,
            urgency: "HIGH",
            linkUrl: `/projects/${newProject.id}`,
          },
        });
      } catch (err) {
        console.error("Failed to notify assigned employee:", err);
      }
    }

    const tmMembership = newProject.memberships?.find((m: any) => m.roleInProject === "TM" && m.isActive);

    const formattedProject = {
      id: newProject.id,
      projectCode: newProject.projectNumber,
      name: newProject.name,
      clientId: newProject.clientId,
      clientName: newProject.client ? newProject.client.companyName : "Client Account",
      tmId: tmMembership?.employee?.id || "UNASSIGNED",
      tmName: tmMembership?.employee?.user?.name ? `${tmMembership.employee.user.name} (Tech Lead)` : "Unassigned",
      progress: newProject.progressPercentage,
      currentStage: newProject.status,
      contractValue: newProject.contractValue,
      paidValue: 0,
      overdueValue: 0,
      deadline: newProject.targetDeadline ? new Date(newProject.targetDeadline).toLocaleDateString() : null,
      targetDeadline: newProject.targetDeadline ? newProject.targetDeadline.toISOString() : null,
      status: newProject.status,
      health: newProject.priority === "URGENT" ? "AT_RISK" : "ON_TRACK",
      scopeItems: newProject.scopeText ? newProject.scopeText.split("\n") : ["Storefront Next.js App Router"],
      teamMembers: [],
      removalHistory: [],
      tasks: [],
      livingDocs: [],
      changeRequests: [],
    };

    return NextResponse.json({ success: true, data: formattedProject });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create project" },
      { status: 500 }
    );
  }
}
