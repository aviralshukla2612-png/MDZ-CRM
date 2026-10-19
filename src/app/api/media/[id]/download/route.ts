import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canReadMedia } from "@/lib/media-auth";
import { getDriveFileStream, isGoogleDriveConfigured } from "@/lib/googleDrive";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

import { findLocalFile } from "@/lib/storageHelper";

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
    });

    if (!mediaFile) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    // Authorize read access
    const canRead = await canReadMedia(user, {
      entityType: mediaFile.entityType,
      entityId: mediaFile.entityId,
      category: mediaFile.category,
      uploadedById: mediaFile.uploadedById || undefined,
    });

    if (!canRead) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to access this file." },
        { status: 403 }
      );
    }

    const isDownload = req.nextUrl.searchParams.get("download") === "true";
    const dispositionType = isDownload ? "attachment" : "inline";
    const encodedFileName = encodeURIComponent(mediaFile.originalName);

    // 1. Check if stored locally or if local copy exists
    const localFilePath = findLocalFile(mediaFile.fileName);
    if (localFilePath) {
      const fileBuffer = await fs.promises.readFile(localFilePath);
      const headers = new Headers();
      headers.set("Content-Type", mediaFile.mimeType || "application/octet-stream");
      headers.set(
        "Content-Disposition",
        `${dispositionType}; filename="${mediaFile.originalName}"; filename*=UTF-8''${encodedFileName}`
      );
      headers.set("Content-Length", fileBuffer.length.toString());
      headers.set("Cache-Control", "private, max-age=3600");

      return new Response(fileBuffer, {
        status: 200,
        headers,
      });
    }

    // 2. Stream from Google Drive
    if (!isGoogleDriveConfigured()) {
      return NextResponse.json(
        { success: false, error: "Google Drive storage is not configured." },
        { status: 503 }
      );
    }

    try {
      const driveStreamObj = await getDriveFileStream(mediaFile.driveFileId);

      // Convert Node Readable stream to Web ReadableStream
      const webStream = Readable.toWeb(driveStreamObj.stream as Readable);

      const headers = new Headers();
      headers.set("Content-Type", mediaFile.mimeType || driveStreamObj.mimeType || "application/octet-stream");
      headers.set(
        "Content-Disposition",
        `${dispositionType}; filename="${mediaFile.originalName}"; filename*=UTF-8''${encodedFileName}`
      );
      if (mediaFile.fileSize) {
        headers.set("Content-Length", mediaFile.fileSize.toString());
      }
      headers.set("Cache-Control", "private, max-age=3600");

      return new Response(webStream as any, {
        status: 200,
        headers,
      });
    } catch (driveErr: any) {
      console.error("[MediaDownload] Drive stream error:", driveErr);
      const errMsg = driveErr?.message || String(driveErr);
      if (errMsg.includes("invalid_grant")) {
        return NextResponse.json(
          {
            success: false,
            error: "Google Drive authorization expired (invalid_grant). Please refresh GOOGLE_DRIVE_REFRESH_TOKEN in .env or configure a Google Service Account.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { success: false, error: errMsg || "Failed to download file from Google Drive." },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("[MediaDownload] Error streaming file:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to download file." },
      { status: 500 }
    );
  }
}
