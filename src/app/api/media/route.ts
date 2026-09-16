import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canReadMedia } from "@/lib/media-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const category = searchParams.get("category");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: "entityType and entityId query parameters are required." },
        { status: 400 }
      );
    }

    const whereClause: any = {
      entityType: entityType.toUpperCase(),
      entityId,
    };

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    // If client, hide internal-only categories
    if (user.activeRole === "CLIENT") {
      whereClause.category = { not: "INTERNAL" };
    }

    const files = await prisma.mediaFile.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, activeRole: true },
        },
      },
    });

    // Run batch authorization verification
    const filteredFiles = [];
    for (const file of files) {
      const allowed = await canReadMedia(user, {
        entityType: file.entityType,
        entityId: file.entityId,
        category: file.category,
        uploadedById: file.uploadedById,
      });
      if (allowed) {
        filteredFiles.push(file);
      }
    }

    return NextResponse.json({ success: true, files: filteredFiles });
  } catch (err: any) {
    console.error("[MediaList] Error fetching media list:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Server error fetching media." },
      { status: 500 }
    );
  }
}
