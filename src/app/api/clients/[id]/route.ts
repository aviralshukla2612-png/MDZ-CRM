import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const client = await prisma.client.findFirst({
      where: { OR: [{ id: params.id }, { clientNumber: params.id }] },
      include: { contacts: true, projects: true, invoices: true },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        notes: body.notes,
        totalBusiness: body.totalBusiness,
        outstandingBalance: body.outstandingBalance,
      },
    });

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SUB_ADMIN", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const client = await prisma.client.findFirst({
      where: { OR: [{ id: params.id }, { clientNumber: params.id }] },
      select: { id: true, companyName: true },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    const clientId = client.id;

    // Find and clean up all child records
    const projects = await prisma.project.findMany({
      where: { clientId },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length > 0) {
      await prisma.task.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.projectMembership.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.projectDocument.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.projectNote.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.clientDiscussion.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.clientUpdate.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.changeRequest.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.paymentMilestone.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.projectStage.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
    }

    await prisma.clientContact.deleteMany({ where: { clientId } });
    await prisma.clientPortalToken.deleteMany({ where: { clientId } });
    await prisma.invoice.deleteMany({ where: { clientId } });
    await prisma.mediaFile.deleteMany({ where: { entityType: "CLIENT", entityId: clientId } });

    await prisma.client.delete({
      where: { id: clientId },
    });

    return NextResponse.json({ success: true, message: `Client "${client.companyName}" deleted successfully.` });
  } catch (error: any) {
    console.error("Failed to delete client:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete client" },
      { status: 500 }
    );
  }
}
