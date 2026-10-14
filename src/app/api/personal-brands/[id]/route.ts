import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const profile = await prisma.personalBrandProfile.findUnique({
      where: { id: params.id },
      include: {
        client: {
          include: {
            contacts: true,
          },
        },
        contentItems: {
          orderBy: [{ scheduledDate: "asc" }, { createdAt: "desc" }],
        },
        brandMetrics: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
        },
        meetingNotes: {
          orderBy: { meetingDate: "desc" },
        },
        clientFeedbacks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ success: false, error: "Personal Brand Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    console.error("Personal Brand Detail Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const updateData: any = {};

    const allowedFields = [
      "clientName",
      "handle",
      "niche",
      "clientId",
      "avatarUrl",
      "professionalBio",
      "brandPositioning",
      "targetAudience",
      "targetGeography",
      "toneOfVoice",
      "brandGuidelines",
      "socialLinksJson",
      "monthlyPackage",
      "monthlyCommitments",
      "brandAuditSummary",
      "competitorTracking",
      "monthlyGoalsKpis",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        if (field === "socialLinksJson" && typeof body[field] !== "string") {
          updateData[field] = JSON.stringify(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    });

    const updated = await prisma.personalBrandProfile.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Personal Brand Update Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update profile" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    await prisma.personalBrandProfile.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Personal brand profile deleted successfully" });
  } catch (error: any) {
    console.error("Personal Brand Delete Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete profile" }, { status: 500 });
  }
}
