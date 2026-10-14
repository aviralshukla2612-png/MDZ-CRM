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
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes timeout for large uploads

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const entityType = (formData.get("entityType") as string | null) || "GENERAL";
    const rawEntityId = (formData.get("entityId") as string | null) || "general";
    const category = (formData.get("category") as string | null) || "GENERAL";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided in form data." },
        { status: 400 }
      );
    }

    // Resolve canonical project ID if entity is PROJECT
    let canonicalEntityId = rawEntityId;
    if (entityType.toUpperCase() === "PROJECT") {
      const proj = await prisma.project.findFirst({
        where: { OR: [{ id: rawEntityId }, { projectNumber: rawEntityId }] },
        select: { id: true },
      });
      if (proj) {
        canonicalEntityId = proj.id;
      }
    }

    // Enforce per-file upload limit (up to 10 GB per file)
    const maxMb = parseInt(process.env.MAX_MEDIA_FILE_SIZE_MB || "10240", 10);
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      const limitDisplay = maxMb >= 1024 ? `${(maxMb / 1024).toFixed(0)} GB` : `${maxMb} MB`;
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the maximum allowed per-file upload limit of ${limitDisplay}.`,
        },
        { status: 413 }
      );
    }

    // Authorize upload against existing RBAC & IDOR guards
    const authorized = await canUploadMedia(user, entityType, canonicalEntityId);
    if (!authorized) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to upload files here." },
        { status: 403 }
      );
    }

    // Convert Web File buffer to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate safe storage filename
    const sanitizedOriginalName = file.name.replace(/[^\w.-]/g, "_");
    const uniqueFileName = `${Date.now()}_${sanitizedOriginalName}`;

    let driveFileId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    let storageProvider = "LOCAL";
    let driveUploadSuccessful = false;
    let driveErrorNotice: string | null = null;

    // 1. Attempt upload to Google Drive if configured
    if (isGoogleDriveConfigured()) {
      try {
        const targetFolderId = await resolveEntityFolder(entityType, canonicalEntityId, category);
        const driveUpload = await uploadStreamToDrive({
          stream: Readable.from(buffer),
          fileName: uniqueFileName,
          mimeType: file.type || "application/octet-stream",
          folderId: targetFolderId,
        });
        driveFileId = driveUpload.driveFileId;
        storageProvider = "GOOGLE_DRIVE";
        driveUploadSuccessful = true;
      } catch (driveErr: any) {
        const errMsg = driveErr?.message || String(driveErr);
        console.warn("[MediaUpload] Google Drive upload failed. Gracefully falling back to local storage:", errMsg);
        if (errMsg.includes("invalid_grant")) {
          driveErrorNotice = "Google Drive authorization expired (invalid_grant). File saved securely to local storage.";
        } else {
          driveErrorNotice = "Google Drive unavailable. File saved securely to local storage.";
        }
      }
    }

    // 2. Fallback to Local Storage if Drive wasn't configured or failed
    if (!driveUploadSuccessful) {
      const uploadDir = path.join(process.cwd(), "uploads");
      await fs.promises.mkdir(uploadDir, { recursive: true });
      const localFilePath = path.join(uploadDir, uniqueFileName);
      await fs.promises.writeFile(localFilePath, buffer);
      storageProvider = "LOCAL";
    }

    // 3. Transactional DB Insert with Rollback on failure
    try {
      const mediaRecord = await prisma.mediaFile.create({
        data: {
          driveFileId,
          storageProvider,
          fileName: uniqueFileName,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          category,
          entityType: entityType.toUpperCase(),
          entityId: canonicalEntityId,
          uploadedById: user.id,
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true, activeRole: true },
          },
        },
      });

      // ActivityEvent tracking
      try {
        await prisma.activityEvent.create({
          data: {
            eventType: "FILE_UPLOADED",
            actorId: user.id,
            entityType: entityType.toUpperCase(),
            entityId: canonicalEntityId,
            projectId: entityType.toUpperCase() === "PROJECT" ? canonicalEntityId : null,
            metadataJson: JSON.stringify({
              mediaFileId: mediaRecord.id,
              fileName: file.name,
              fileSize: file.size,
              category,
              storageProvider,
            }),
          },
        });
      } catch (logErr) {
        console.warn("Non-critical activity log failure:", logErr);
      }

      return NextResponse.json({
        success: true,
        file: mediaRecord,
        storageProvider,
        warning: driveErrorNotice || undefined,
      });
    } catch (dbError: any) {
      console.error("[MediaUpload] Prisma insertion failed. Triggering file rollback:", dbError);
      if (driveUploadSuccessful) {
        await deleteDriveFile(driveFileId).catch((cleanupErr) =>
          console.error("[MediaUpload] Drive rollback cleanup failed:", cleanupErr)
        );
      } else {
        const localFilePath = path.join(process.cwd(), "uploads", uniqueFileName);
        await fs.promises.unlink(localFilePath).catch(() => {});
      }
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
