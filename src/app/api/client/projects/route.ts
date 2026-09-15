import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getClientAccountForUser } from "@/lib/client-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const clientCtx = await getClientAccountForUser(userOrRes.email);
  if (!clientCtx) {
    return NextResponse.json(
      { success: false, error: "No client account associated with this user." },
      { status: 404 }
    );
  }

  const projects = await prisma.project.findMany({
    where: { clientId: clientCtx.client.id },
    include: {
      tasks: {
        select: { id: true, title: true, status: true, assignedToId: true },
      },
      memberships: {
        where: { isActive: true },
        include: {
          employee: {
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
            },
          },
        },
      },
      changeRequests: {
        include: {
          items: true,
        },
        orderBy: { requestSeqInt: "desc" },
      },
      clientUpdates: {
        where: { visibility: "CLIENT_VISIBLE" },
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              name: true,
              designation: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const formattedProjects = projects.map((p) => {
    const activeTasks = p.tasks.filter((t) => t.status !== "ARCHIVED");
    const totalTasks = activeTasks.length;
    const completedTasks = activeTasks.filter(
      (t) => t.status === "COMPLETED" || t.status === "DONE"
    ).length;
    const progressPercentage =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // Quota for this project
    const submittedRequests = p.changeRequests.filter(
      (cr) => cr.status !== "DRAFT" && cr.status !== "CANCELLED"
    );
    const usedCount = submittedRequests.length;
    const remainingCount = Math.max(0, 3 - usedCount);

    // Map developers
    const teamMembers = p.memberships.map((m) => {
      const devUser = m.employee.user;
      const devTasks = activeTasks.filter((t) => t.assignedToId === devUser.id);
      const inProgressTask = devTasks.find((t) => t.status === "IN_PROGRESS");
      const currentTask = inProgressTask || devTasks.find((t) => t.status !== "COMPLETED" && t.status !== "DONE") || null;
      const empCode = m.employee.employeeIdCode || "01";
      const phone = (m.employee as any).phone || ("+91 98980 000" + (empCode.length > 3 ? empCode.slice(-2) : "01"));

      return {
        membershipId: m.id,
        projectId: p.id,
        projectName: p.name,
        projectNumber: p.projectNumber,
        roleInProject: m.roleInProject,
        name: devUser.name,
        email: devUser.email,
        phone,
        designation: devUser.designation || "Software Developer",
        department: devUser.department,
        avatarUrl: devUser.avatarUrl,
        currentTask: currentTask
          ? {
              id: currentTask.id,
              title: currentTask.title,
              status: currentTask.status,
            }
          : null,
      };
    });

    return {
      id: p.id,
      projectNumber: p.projectNumber,
      name: p.name,
      description: p.description,
      status: p.status,
      priority: p.priority,
      startDate: p.startDate,
      targetDeadline: p.targetDeadline,
      liveUrl: p.liveUrl,
      stagingUrl: p.stagingUrl,
      totalTasks,
      completedTasks,
      progressPercentage,
      zeroTaskMessage:
        totalTasks === 0 ? "No tasks have been added to this project yet." : null,
      teamMembers,
      changeRequests: p.changeRequests,
      quota: {
        includedCount: 3,
        usedCount,
        remainingCount,
      },
      clientUpdates: p.clientUpdates,
    };
  });

  return NextResponse.json({
    success: true,
    client: clientCtx.client,
    contact: clientCtx.contact,
    projects: formattedProjects,
  });
}
