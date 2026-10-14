import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const incidents = await prisma.eventIncident.findMany({
      where: { eventId: params.id },
      orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: incidents });
  } catch (error: any) {
    console.error("Fetch Incidents Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch incidents" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      title,
      description,
      severity = "MEDIUM",
      status = "OPEN",
      reportedBy = "",
      owner = "",
      escalationNotes = "",
    } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, error: "Title and description are required" }, { status: 400 });
    }

    const incident = await prisma.eventIncident.create({
      data: {
        eventId: params.id,
        title,
        description,
        severity,
        status,
        reportedBy,
        owner,
        escalationNotes,
      },
    });

    return NextResponse.json({ success: true, data: incident }, { status: 201 });
  } catch (error: any) {
    console.error("Report Incident Error:", error);
    return NextResponse.json({ success: false, error: "Failed to log incident" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { incidentId, ...updateData } = body;

    if (!incidentId) {
      return NextResponse.json({ success: false, error: "incidentId is required" }, { status: 400 });
    }

    if (updateData.status === "RESOLVED" && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    const updated = await prisma.eventIncident.update({
      where: { id: incidentId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update Incident Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update incident" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const incidentId = searchParams.get("incidentId");

    if (!incidentId) {
      return NextResponse.json({ success: false, error: "incidentId is required" }, { status: 400 });
    }

    await prisma.eventIncident.delete({
      where: { id: incidentId },
    });

    return NextResponse.json({ success: true, message: "Incident deleted" });
  } catch (error: any) {
    console.error("Delete Incident Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete incident" }, { status: 500 });
  }
}
