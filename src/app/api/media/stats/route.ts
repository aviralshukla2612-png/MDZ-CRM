import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    const usedGb = (usedBytes / (1024 * 1024 * 1024)).toFixed(2);

    // Category breakdown
    const categoryStats = await prisma.mediaFile.groupBy({
      by: ["category"],
      _sum: { fileSize: true },
      _count: { id: true },
    });

    const maxFileMb = parseInt(process.env.MAX_MEDIA_FILE_SIZE_MB || "10240", 10);
    const maxFileGb = maxFileMb >= 1024 ? maxFileMb / 1024 : 10;

    return NextResponse.json({
      success: true,
      stats: {
        maxFileMb,
        maxFileGb,
        usedBytes,
        usedGb,
        fileCount,
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
