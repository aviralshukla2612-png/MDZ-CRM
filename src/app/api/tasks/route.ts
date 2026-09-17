import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { recalculateProjectProgress } from "@/lib/progressEngine";

export async function GET(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const isEmployee = authRes.activeRole === "EMPLOYEE";
    const effectiveEmployeeId = isEmployee ? authRes.employeeId : employeeId;

    const whereClause: any = {
      status: { not: "ARCHIVED" },
    };

    if (effectiveEmployeeId && effectiveEmployeeId !== "ALL") {
      whereClause.assignedToId = effectiveEmployeeId;
    }

    if (projectId && projectId !== "ALL") {
      whereClause.projectId = projectId;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: [
        { isMostImportant: "desc" },
        { deadline: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
            status: true,
            client: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            designation: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: tasks,
      tasks,
    });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { projectId, title } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Project is required" },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Task title is required" },
        { status: 400 }
      );
    }

    // Role check: Only OWNER, ADMIN, SALES, or team members of this project can add tasks
    if (authRes.activeRole === "EMPLOYEE") {
      const membership = await prisma.projectMembership.findFirst({
        where: {
          projectId,
          employeeId: authRes.employeeId,
          isActive: true,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You are not authorized to add tasks to this project" },
          { status: 403 }
        );
      }
    }

    const taskCount = await prisma.task.count({ where: { projectId } });

    const newTask = await prisma.task.create({
      data: {
        projectId,
        title: title.trim(),
        description: body.description ? String(body.description).trim() : null,
        priority: body.priority || "MEDIUM",
        status: body.status || "TODO",
        assignedToId: body.assignedToId || (authRes.activeRole === "EMPLOYEE" ? authRes.employeeId : null),
        createdById: authRes.id,
        deadline: body.deadline ? new Date(body.deadline) : null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        orderInt: typeof body.orderInt === "number" ? body.orderInt : taskCount + 1,
        completedAt: body.status === "COMPLETED" || body.status === "DONE" ? new Date() : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
            client: { select: { companyName: true } },
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            designation: true,
            avatarUrl: true,
          },
        },
      },
    });

    await recalculateProjectProgress(projectId);

    return NextResponse.json({
      success: true,
      task: newTask,
      data: newTask,
    });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create task" },
      { status: 500 }
    );
  }
}
