import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canDeleteMedia, canReadMedia } from "@/lib/media-auth";
import { deleteDriveFile } from "@/lib/googleDrive";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true, activeRole: true },
        },
      },
    });

    if (!mediaFile) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    const canRead = await canReadMedia(user, {
      entityType: mediaFile.entityType,
      entityId: mediaFile.entityId,
      category: mediaFile.category,
      uploadedById: mediaFile.uploadedById,
    });

    if (!canRead) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, file: mediaFile });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
    });

    if (!mediaFile) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    const canDelete = await canDeleteMedia(user, {
      entityType: mediaFile.entityType,
      entityId: mediaFile.entityId,
      category: mediaFile.category,
      uploadedById: mediaFile.uploadedById,
    });

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to delete this file." },
        { status: 403 }
      );
    }

    // Delete from Google Drive first (or attempt deletion)
    if (mediaFile.driveFileId) {
      await deleteDriveFile(mediaFile.driveFileId).catch((err) =>
        console.warn("[MediaDelete] Warning: Failed to delete Google Drive file:", err)
      );
    }

    // Delete record from Prisma DB
    await prisma.mediaFile.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "File successfully deleted." });
  } catch (err: any) {
    console.error("[MediaDelete] Error deleting file:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete file." },
      { status: 500 }
    );
  }
}
