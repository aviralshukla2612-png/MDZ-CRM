import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { verifyClientProjectAccess } from "@/lib/client-auth";
import { recalculateProjectProgress } from "@/lib/progressEngine";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const projectId = params.id;

  // Authorization Checks
  if (authRes.activeRole === "CLIENT") {
    const isAuthorized = await verifyClientProjectAccess(authRes.email, projectId);
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }
  } else if (authRes.activeRole === "EMPLOYEE") {
    if (!authRes.employeeId) {
      return NextResponse.json({ success: false, error: "Forbidden: Employee profile missing" }, { status: 403 });
    }

    const membership = await prisma.projectMembership.findFirst({
      where: {
        projectId,
        employeeId: authRes.employeeId,
        isActive: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You are not an assigned member of this project" },
        { status: 403 }
      );
    }
  } else if (authRes.activeRole !== "OWNER" && authRes.activeRole !== "SALES") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const tasks = await prisma.task.findMany({
      where: { projectId, status: { not: "ARCHIVED" } },
      orderBy: [{ isMostImportant: "desc" }, { orderInt: "asc" }, { createdAt: "asc" }],
      include: {
        assignedTo: {
          select: { id: true, name: true, designation: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    const progress = await recalculateProjectProgress(projectId);

    return NextResponse.json({
      success: true,
      tasks,
      progress,
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/tasks error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const projectId = params.id;

  const isAdminOrOwner = authRes.activeRole === "OWNER" || (authRes.activeRole as string) === "ADMIN" || authRes.activeRole === "SALES";

  // Authorization: OWNER, ADMIN, SALES, or assigned EMPLOYEE
  if (!isAdminOrOwner) {
    if (authRes.activeRole === "EMPLOYEE") {
      if (!authRes.employeeId) {
        return NextResponse.json({ success: false, error: "Forbidden: Employee profile missing" }, { status: 403 });
      }

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
    } else {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only assigned team members or Admins can create tasks" },
        { status: 403 }
      );
    }
  }

  try {
    const body = await req.json();
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: "Task title is required" },
        { status: 400 }
      );
    }

    // Security check: Only OWNER or ADMIN can set isMostImportant on task creation
    if (body.isMostImportant !== undefined && !isAdminOrOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only Admin or Owner can set Most Important Task status" },
        { status: 403 }
      );
    }

    // Determine initial task order
    const taskCount = await prisma.task.count({ where: { projectId } });

    const newTask = await prisma.task.create({
      data: {
        projectId,
        title: body.title.trim(),
        description: body.description ? String(body.description).trim() : null,
        priority: body.priority || "MEDIUM",
        status: body.status === "IN_PROGRESS" || body.status === "COMPLETED" ? body.status : "TODO",
        assignedToId: body.assignedToId || null,
        createdById: authRes.id,
        orderInt: typeof body.orderInt === "number" ? body.orderInt : taskCount + 1,
        completedAt: body.status === "COMPLETED" ? new Date() : null,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, designation: true, avatarUrl: true },
        },
      },
    });

    // Recalculate Progress Engine & Update Project Cache
    const progress = await recalculateProjectProgress(projectId);

    return NextResponse.json({
      success: true,
      task: newTask,
      progress,
    });
  } catch (error) {
    console.error("POST /api/projects/[id]/tasks error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create task" },
      { status: 500 }
    );
  }
}
