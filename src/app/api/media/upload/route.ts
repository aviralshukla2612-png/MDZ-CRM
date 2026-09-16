import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUploadMedia } from "@/lib/media-auth";
import {
  isGoogleDriveConfigured,
  resolveEntityFolder,
  uploadStreamToDrive,
  deleteDriveFile,
} from "@/lib/googleDrive";
import { Readable } from "stream";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!isGoogleDriveConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Google Drive storage is not configured. Please ensure GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, and GOOGLE_DRIVE_ROOT_FOLDER_ID are set in .env.",
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const entityType = (formData.get("entityType") as string | null) || "GENERAL";
    const entityId = (formData.get("entityId") as string | null) || "general";
    const category = (formData.get("category") as string | null) || "GENERAL";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided in form data." },
        { status: 400 }
      );
    }

    // Enforce centralized max file size limit
    const maxMb = parseInt(process.env.MAX_MEDIA_FILE_SIZE_MB || "50", 10);
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the maximum allowed limit of ${maxMb}MB.`,
        },
        { status: 413 }
      );
    }

    // Authorize upload against existing RBAC & IDOR guards
    const authorized = await canUploadMedia(user, entityType, entityId);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to upload files here." },
        { status: 403 }
      );
    }

    // Resolve Google Drive target folder
    const targetFolderId = await resolveEntityFolder(entityType, entityId, category);

    // Convert Web File buffer to Node Readable stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    // Generate safe storage filename
    const sanitizedOriginalName = file.name.replace(/[^\w.-]/g, "_");
    const uniqueFileName = `${Date.now()}_${sanitizedOriginalName}`;

    // Upload payload stream to Google Drive
    const driveUpload = await uploadStreamToDrive({
      stream,
      fileName: uniqueFileName,
      mimeType: file.type || "application/octet-stream",
      folderId: targetFolderId,
    });

    const driveFileId = driveUpload.driveFileId;

    // Transactional DB Insert with Rollback on failure
    try {
      const mediaRecord = await prisma.mediaFile.create({
        data: {
          driveFileId,
          storageProvider: "GOOGLE_DRIVE",
          fileName: uniqueFileName,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          category,
          entityType: entityType.toUpperCase(),
          entityId,
          uploadedById: user.id,
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true, activeRole: true },
          },
        },
      });

      // Optional ActivityEvent tracking
      try {
        await prisma.activityEvent.create({
          data: {
            eventType: "FILE_UPLOADED",
            actorId: user.id,
            entityType: entityType.toUpperCase(),
            entityId,
            projectId: entityType.toUpperCase() === "PROJECT" ? entityId : null,
            metadataJson: JSON.stringify({
              mediaFileId: mediaRecord.id,
              fileName: file.name,
              fileSize: file.size,
              category,
            }),
          },
        });
      } catch (logErr) {
        console.warn("Non-critical activity log failure:", logErr);
      }

      return NextResponse.json({ success: true, file: mediaRecord });
    } catch (dbError: any) {
      console.error("[MediaUpload] Prisma insertion failed. Triggering Drive file rollback:", dbError);
      // Clean up orphaned file from Google Drive
      await deleteDriveFile(driveFileId).catch((cleanupErr) =>
        console.error("[MediaUpload] Rollback cleanup failed:", cleanupErr)
      );
      return NextResponse.json(
        { success: false, error: "Failed to persist media record in database. Upload rolled back." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[MediaUpload] Unhandled upload error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error during upload." },
      { status: 500 }
    );
  }
}
