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
        select: { id: true, status: true },
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
    };
  });

  return NextResponse.json({
    success: true,
    client: clientCtx.client,
    contact: clientCtx.contact,
    projects: formattedProjects,
  });
}
