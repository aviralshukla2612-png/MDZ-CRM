import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verifyClientProjectAccess, getClientAccountForUser } from "@/lib/client-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const projectId = params.id;

  // IDOR Protection for CLIENT role users
  if (userOrRes.activeRole === "CLIENT") {
    const isAuthorized = await verifyClientProjectAccess(userOrRes.email, projectId);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Access denied or project not found." },
        { status: 403 }
      );
    }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          assignedToId: true,
          assignedTo: {
            select: { id: true, name: true, designation: true },
          },
        },
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
        take: 20,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
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
  });

  if (!project) {
    return NextResponse.json(
      { success: false, error: "Project not found." },
      { status: 404 }
    );
  }

  // Progress Engine Calculation
  const activeTasks = project.tasks.filter((t) => t.status !== "ARCHIVED");
  const totalTasks = activeTasks.length;
  const completedTasks = activeTasks.filter(
    (t) => t.status === "COMPLETED" || t.status === "DONE"
  ).length;
  const progressPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Change Requests Quota Calculation (3 Included Revisions)
  const submittedRequests = project.changeRequests.filter(
    (cr) => cr.status !== "DRAFT" && cr.status !== "CANCELLED"
  );
  const usedCount = submittedRequests.length;
  const remainingCount = Math.max(0, 3 - usedCount);

  // Developer Current Work Mapping & Contacts
  const teamMembers = project.memberships.map((m) => {
    const devUser = m.employee.user;
    // Prioritize IN_PROGRESS task assigned to developer, fallback to non-completed
    const devTasks = activeTasks.filter((t) => t.assignedToId === devUser.id);
    const inProgressTask = devTasks.find((t) => t.status === "IN_PROGRESS");
    const currentTask = inProgressTask || devTasks.find((t) => t.status !== "COMPLETED" && t.status !== "DONE") || null;
    const empCode = m.employee.employeeIdCode || "01";
    const phone = (m.employee as any).phone || ("+91 98980 000" + (empCode.length > 3 ? empCode.slice(-2) : "01"));

    return {
      membershipId: m.id,
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

  return NextResponse.json({
    success: true,
    project: {
      id: project.id,
      projectNumber: project.projectNumber,
      name: project.name,
      description: project.description,
      scopeText: project.scopeText,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      targetDeadline: project.targetDeadline,
      liveUrl: project.liveUrl,
      stagingUrl: project.stagingUrl,
      designUrl: project.designUrl,
      totalTasks,
      completedTasks,
      progressPercentage,
      zeroTaskMessage:
        totalTasks === 0 ? "No tasks have been added to this project yet." : null,
      teamMembers,
      clientUpdates: project.clientUpdates,
      changeRequests: project.changeRequests,
      quota: {
        includedCount: 3,
        usedCount,
        remainingCount,
      },
    },
  });
}
