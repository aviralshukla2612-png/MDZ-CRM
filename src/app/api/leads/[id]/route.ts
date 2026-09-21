import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const lead = await prisma.lead.findFirst({
      where: { OR: [{ id: params.id }, { leadNumber: params.id }] },
      include: { followups: true, activities: true },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch lead" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES", "ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const updateData: any = {};

    if (body.clientName !== undefined || body.companyName !== undefined) {
      updateData.companyName = body.clientName !== undefined ? body.clientName : body.companyName;
    }
    if (body.contactPerson !== undefined) {
      updateData.contactPerson = body.contactPerson;
    }
    if (body.phone !== undefined || body.mobile !== undefined) {
      updateData.mobile = body.phone !== undefined ? body.phone : body.mobile;
    }
    if (body.whatsapp !== undefined) {
      updateData.whatsapp = body.whatsapp;
    }
    if (body.email !== undefined) {
      updateData.email = body.email;
    }
    if (body.stage !== undefined || body.status !== undefined) {
      updateData.status = body.stage !== undefined ? body.stage : body.status;
    }
    if (body.leadPriority !== undefined || body.priority !== undefined) {
      updateData.priority = body.leadPriority !== undefined ? body.leadPriority : body.priority;
    }
    if (body.projectScope !== undefined || body.interestedService !== undefined) {
      updateData.interestedService = body.projectScope !== undefined ? body.projectScope : body.interestedService;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.leadValue !== undefined || body.estimatedBudget !== undefined) {
      const val = Number(body.leadValue !== undefined ? body.leadValue : body.estimatedBudget);
      if (!isNaN(val)) updateData.estimatedBudget = val;
    }
    if (body.expectedRevenue !== undefined || body.expectedValue !== undefined) {
      const val = Number(body.expectedRevenue !== undefined ? body.expectedRevenue : body.expectedValue);
      if (!isNaN(val)) updateData.expectedValue = val;
    }
    if (body.source !== undefined) {
      updateData.source = body.source;
    }
    if (body.gstNo !== undefined) {
      updateData.remarks = body.gstNo ? `GST: ${body.gstNo}` : null;
    } else if (body.remarks !== undefined) {
      updateData.remarks = body.remarks;
    }

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error("Failed to update lead:", error);
    return NextResponse.json({ success: false, error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    await prisma.lead.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete lead" }, { status: 500 });
  }
}
