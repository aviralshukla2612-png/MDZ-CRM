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
    const mediaType = searchParams.get("type"); // "video" | "image" | "document"
    const search = searchParams.get("search");

    const whereClause: any = {};

    if (entityType && entityType !== "ALL") {
      whereClause.entityType = entityType.toUpperCase();
    }

    if (entityId && entityId !== "ALL") {
      whereClause.entityId = entityId;
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (mediaType && mediaType !== "ALL") {
      if (mediaType === "video") {
        whereClause.mimeType = { startsWith: "video/" };
      } else if (mediaType === "image") {
        whereClause.mimeType = { startsWith: "image/" };
      } else if (mediaType === "document") {
        whereClause.OR = [
          { mimeType: { contains: "pdf" } },
          { mimeType: { contains: "word" } },
          { mimeType: { contains: "sheet" } },
          { mimeType: { contains: "text" } },
          { mimeType: { contains: "presentation" } },
        ];
      }
    }

    if (search && search.trim()) {
      whereClause.originalName = { contains: search.trim(), mode: "insensitive" };
    }

    // If client, hide internal-only categories
    if (user.activeRole === "CLIENT") {
      whereClause.category = { not: "INTERNAL" };
    }

    const files = await prisma.mediaFile.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
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
        uploadedById: file.uploadedById || undefined,
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
