import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const profiles = await prisma.personalBrandProfile.findMany({
      where,
      include: {
        client: {
          select: { id: true, companyName: true, email: true, phone: true },
        },
        _count: {
          select: {
            contentItems: true,
            meetingNotes: true,
            clientFeedbacks: true,
            brandMetrics: true,
          },
        },
        contentItems: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            platform: true,
            productionStage: true,
            scheduledDate: true,
            clientApproved: true,
          },
        },
        brandMetrics: {
          take: 1,
          orderBy: [{ year: "desc" }, { month: "desc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: profiles });
  } catch (error: any) {
    console.error("Personal Brand List Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch personal brand profiles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      clientName,
      handle,
      niche,
      clientId,
      professionalBio,
      brandPositioning,
      targetAudience,
      targetGeography,
      toneOfVoice,
      brandGuidelines,
      socialLinksJson,
      monthlyPackage,
      monthlyCommitments,
      brandAuditSummary,
      competitorTracking,
      monthlyGoalsKpis,
    } = body;

    if (!clientName || !clientName.trim()) {
      return NextResponse.json({ success: false, error: "Client personal brand name is required" }, { status: 400 });
    }

    const newProfile = await prisma.personalBrandProfile.create({
      data: {
        clientName: clientName.trim(),
        handle: handle ? handle.trim() : "",
        niche: niche ? niche.trim() : "General",
        clientId: clientId || null,
        professionalBio: professionalBio || "",
        brandPositioning: brandPositioning || "",
        targetAudience: targetAudience || "",
        targetGeography: targetGeography || "",
        toneOfVoice: toneOfVoice || "",
        brandGuidelines: brandGuidelines || "",
        socialLinksJson: typeof socialLinksJson === "string" ? socialLinksJson : JSON.stringify(socialLinksJson || {}),
        monthlyPackage: monthlyPackage || "",
        monthlyCommitments: monthlyCommitments || "",
        brandAuditSummary: brandAuditSummary || "",
        competitorTracking: competitorTracking || "",
        monthlyGoalsKpis: monthlyGoalsKpis || "",
        status: "ACTIVE",
        createdById: authRes.id,
      },
    });

    return NextResponse.json({ success: true, data: newProfile });
  } catch (error: any) {
    console.error("Personal Brand Create Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create personal brand profile" }, { status: 500 });
  }
}
