import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { leadSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const url = new URL(req.url);
    const sourceFilter = url.searchParams.get("source");

    const whereClause: any = {};
    if (sourceFilter && sourceFilter !== "ALL") {
      whereClause.source = sourceFilter;
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        followups: true,
        activities: true,
        mediaFiles: true,
        assignedSalesperson: {
          select: { id: true, name: true, email: true, designation: true },
        },
      },
    });

    const formatted = leads.map((l) => ({
      id: l.id,
      leadNumber: l.leadNumber,
      clientName: l.companyName || l.contactPerson,
      contactPerson: l.contactPerson,
      email: l.email || "prospect@example.com",
      phone: l.mobile,
      whatsapp: l.whatsapp,
      stage: l.status,
      status: l.status,
      leadValue: l.estimatedBudget,
      expectedRevenue: l.expectedValue,
      projectScope: l.interestedService,
      interestedService: l.interestedService,
      source: l.source || "WEBSITE",
      industry: l.industry || "General",
      subCategory: l.subCategory,
      businessType: l.businessType,
      location: l.location,
      goalsJson: l.goalsJson,
      servicesJson: l.servicesJson,
      durationType: l.durationType,
      durationMonths: l.durationMonths,
      targetAudience: l.targetAudience,
      competitors: l.competitors,
      additionalDetails: l.additionalDetails,
      assignedSales: l.assignedSalesperson?.name || "Unassigned",
      assignedSalespersonId: l.assignedSalespersonId,
      assignedSalesperson: l.assignedSalesperson,
      gstNo: l.remarks ? l.remarks.replace("GST: ", "") : undefined,
      nextFollowupDate: l.nextFollowupAt ? new Date(l.nextFollowupAt).toLocaleDateString() : "Tomorrow 10:00 AM",
      leadPriority: l.priority,
      createdAt: l.createdAt,
      mediaFiles: l.mediaFiles || [],
      notes: [],
      callHistory: l.followups.map((f) => ({
        id: f.id,
        caller: l.assignedSalesperson?.name || "Sales Rep",
        notes: f.notes || "Call logged",
        date: new Date(f.scheduledAt).toLocaleDateString(),
        outcome: f.result || "Scheduled",
      })),
      activityHistory: l.activities.map((a) => ({
        id: a.id,
        time: new Date(a.createdAt).toLocaleDateString(),
        text: a.action,
      })),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch leads from database" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    
    // Zod validation
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }
    
    const validData = parsed.data;
    const leadCount = await prisma.lead.count();

    const newLead = await prisma.lead.create({
      data: {
        leadNumber: `LEAD-2026-00${leadCount + 1}`,
        contactPerson: validData.contactPerson,
        companyName: validData.clientName,
        mobile: validData.phone,
        email: validData.email,
        source: body.source ? String(body.source).toUpperCase() : "MANUAL",
        interestedService: validData.projectScope,
        estimatedBudget: validData.leadValue,
        expectedValue: validData.expectedRevenue,
        priority: validData.leadPriority,
        status: validData.stage,
        remarks: validData.gstNo ? `GST: ${validData.gstNo}` : null,
        createdById: authRes.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newLead.id,
        leadNumber: newLead.leadNumber,
        clientName: newLead.companyName,
        contactPerson: newLead.contactPerson,
        email: newLead.email,
        phone: newLead.mobile,
        source: newLead.source,
        stage: newLead.status,
        leadValue: newLead.estimatedBudget,
        expectedRevenue: newLead.expectedValue,
        projectScope: newLead.interestedService,
        assignedSales: "Karan Verma",
        gstNo: newLead.remarks ? newLead.remarks.replace("GST: ", "") : undefined,
        nextFollowupDate: "Tomorrow 10:00 AM",
        leadPriority: newLead.priority,
        notes: [],
        callHistory: [],
        activityHistory: [{ id: Date.now().toString(), time: "Just now", text: "Lead created in CRM pipeline." }],
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create lead" }, { status: 500 });
  }
}
