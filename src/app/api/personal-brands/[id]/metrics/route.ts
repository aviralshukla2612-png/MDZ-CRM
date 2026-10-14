import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const metrics = await prisma.personalBrandMetric.findMany({
      where: { profileId: params.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json({ success: true, data: metrics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch metrics" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      month,
      year,
      platform,
      totalFollowers,
      followerGrowth,
      totalReach,
      totalImpressions,
      engagementRate,
      profileVisits,
      inquiriesGenerated,
      topPerformingContent,
      monthlyReportNotes,
      goalsVersusResults,
    } = body;

    const newMetric = await prisma.personalBrandMetric.create({
      data: {
        profileId: params.id,
        month: Number(month) || new Date().getMonth() + 1,
        year: Number(year) || new Date().getFullYear(),
        platform: platform || "TOTAL",
        totalFollowers: Number(totalFollowers) || 0,
        followerGrowth: Number(followerGrowth) || 0,
        totalReach: Number(totalReach) || 0,
        totalImpressions: Number(totalImpressions) || 0,
        engagementRate: Number(engagementRate) || 0,
        profileVisits: Number(profileVisits) || 0,
        inquiriesGenerated: Number(inquiriesGenerated) || 0,
        topPerformingContent: topPerformingContent || "",
        monthlyReportNotes: monthlyReportNotes || "",
        goalsVersusResults: goalsVersusResults || "",
      },
    });

    return NextResponse.json({ success: true, data: newMetric });
  } catch (error: any) {
    console.error("Metric Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to log metric" }, { status: 500 });
  }
}
