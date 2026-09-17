import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verifyClientProjectAccess, canUserCreateDailyUpdate } from "@/lib/client-auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationToAdmins } from "@/lib/notifications";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const projectId = params.id;

  if (userOrRes.activeRole === "CLIENT") {
    const isAuthorized = await verifyClientProjectAccess(userOrRes.email, projectId);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Access denied or project not found." },
        { status: 403 }
      );
    }
  }

  const updates = await prisma.clientUpdate.findMany({
    where: {
      projectId,
      visibility: "CLIENT_VISIBLE",
    },
    orderBy: { createdAt: "desc" },
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
  });

  return NextResponse.json({
    success: true,
    updates,
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const projectId = params.id;

  // Authoritative RBAC Check: OWNER or active ProjectMembership EMPLOYEE
  const isAllowed = await canUserCreateDailyUpdate(
    userOrRes.id,
    userOrRes.activeRole,
    projectId
  );

  if (!isAllowed) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Forbidden: Only assigned project members or owners can post daily updates for this project.",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Update title is required." },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Update content summary is required." },
        { status: 400 }
      );
    }

    // Author identity is strictly derived from the authenticated session (userOrRes.id)
    const newUpdate = await prisma.clientUpdate.create({
      data: {
        projectId,
        title: title.trim(),
        content: content.trim(),
        visibility: "CLIENT_VISIBLE",
        authorId: userOrRes.id,
      },
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
    });

    // Auto-sync task highlights into Project tasks so progress bar and task stack update immediately
    try {
      const taskItems: string[] = [];
      if (Array.isArray(body.tasks)) {
        body.tasks.forEach((t: any) => {
          if (typeof t === "string" && t.trim()) taskItems.push(t.trim());
        });
      }
      if (taskItems.length === 0 && content) {
        const lines = content.split("\n");
        for (const line of lines) {
          const match = line.match(/^\d+\.\s*(.+)$/);
          if (match && match[1]?.trim() && !match[1].toLowerCase().startsWith("note:")) {
            taskItems.push(match[1].trim());
          }
        }
      }

      if (taskItems.length > 0) {
        const employee = await prisma.employee.findFirst({
          where: { userId: userOrRes.id },
        });

        for (const taskText of taskItems) {
          await prisma.task.create({
            data: {
              projectId,
              title: taskText,
              status: "COMPLETED",
              completedAt: new Date(),
              priority: "MEDIUM",
              assignedToId: employee?.id || null,
              createdById: userOrRes.id,
            },
          });
        }
      }

      const { recalculateProjectProgress } = await import("@/lib/progressEngine");
      await recalculateProjectProgress(projectId);
    } catch (taskErr) {
      console.error("[DailyUpdate] Error syncing tasks:", taskErr);
    }

    // Notify Admins & Sub-Admins in real-time
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true, projectNumber: true },
      });
      const authorName = newUpdate.author?.name || userOrRes.name || "Employee";
      const projName = project?.name || "Project";
      await sendNotificationToAdmins({
        title: "📋 Daily Task Update Submitted",
        message: `${authorName} posted daily update for ${projName}: "${newUpdate.title}"`,
        urgency: "MEDIUM",
        linkUrl: `/employee/updates`,
        excludeUserId: userOrRes.id,
      });
    } catch (notifErr) {
      console.warn("[DailyUpdate] Failed to notify admins:", notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        update: newUpdate,
        message: "Daily progress update posted successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating daily update:", error);
    return NextResponse.json(
      { success: false, error: "Failed to post daily progress update." },
      { status: 500 }
    );
  }
}
