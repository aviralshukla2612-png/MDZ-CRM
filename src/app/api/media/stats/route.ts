import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const TOTAL_DRIVE_QUOTA_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB limit (10,737,418,240 bytes)

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const aggregation = await prisma.mediaFile.aggregate({
      _sum: { fileSize: true },
      _count: { id: true },
    });

    const usedBytes = aggregation._sum.fileSize || 0;
    const fileCount = aggregation._count.id || 0;
    const remainingBytes = Math.max(0, TOTAL_DRIVE_QUOTA_BYTES - usedBytes);

    const usedGb = (usedBytes / (1024 * 1024 * 1024)).toFixed(2);
    const remainingGb = (remainingBytes / (1024 * 1024 * 1024)).toFixed(2);
    const percentageUsed = Math.min(100, Math.round((usedBytes / TOTAL_DRIVE_QUOTA_BYTES) * 100));

    // Category breakdown
    const categoryStats = await prisma.mediaFile.groupBy({
      by: ["category"],
      _sum: { fileSize: true },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalQuotaBytes: TOTAL_DRIVE_QUOTA_BYTES,
        totalQuotaGb: 10,
        usedBytes,
        usedGb,
        remainingBytes,
        remainingGb,
        percentageUsed,
        fileCount,
        isNearLimit: percentageUsed >= 80,
        isLimitReached: usedBytes >= TOTAL_DRIVE_QUOTA_BYTES,
        categoryBreakdown: categoryStats.map((c) => ({
          category: c.category,
          bytes: c._sum.fileSize || 0,
          count: c._count.id || 0,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/media/stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch storage statistics" },
      { status: 500 }
    );
  }
}
