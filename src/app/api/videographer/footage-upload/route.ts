import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendNotificationToAdmins, sendNotificationToEditors } from "@/lib/notifications";

export async function GET() {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    // Return all users who can act as video editors
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        designation: true,
        department: true,
        avatarUrl: true,
      },
    });

    const editors = allUsers.filter((u) => {
      const d = (u.designation || "").toLowerCase();
      const dep = (u.department || "").toLowerCase();
      return (
        d.includes("editor") ||
        d.includes("editing") ||
        d.includes("video edit") ||
        dep.includes("editor") ||
        dep.includes("editing")
      );
    });

    // Also get recent footage uploads for history
    const recentUploads = await prisma.videographerFootage.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      editors: editors.length > 0 ? editors : allUsers.slice(0, 10), // fallback if no specific editor created yet
      recentUploads,
    });
  } catch (error) {
    console.error("Fetch Editors Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch editors" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      shootTitle,
      driveUrl,
      notes = "",
      videosCount = 0,
      photosCount = 0,
      editorId,
      editorName,
    } = body;

    if (!shootTitle || !driveUrl) {
      return NextResponse.json(
        { success: false, error: "Shoot title and drive/footage URL are required" },
        { status: 400 }
      );
    }

    const videographerName = authRes.name || "Videographer";
    const videographerId = authRes.id;

    // Save record to DB
    const footage = await prisma.videographerFootage.create({
      data: {
        videographerId,
        videographerName,
        shootTitle,
        driveUrl,
        notes: notes || "",
        videosCount: Number(videosCount) || 0,
        photosCount: Number(photosCount) || 0,
        editorId: editorId || null,
        editorName: editorName || "Editing Team",
        status: "UPLOADED",
      },
    });

    // 1. Notify Video Editors
    try {
      await sendNotificationToEditors({
        title: "🎞️ New Raw Footage Uploaded for Editing",
        message: `Videographer ${videographerName} uploaded raw shoot assets for "${shootTitle}". Drive link ready for editing.`,
        urgency: "HIGH",
        linkUrl: driveUrl,
        specificEditorId: editorId || undefined,
      });
    } catch (editorNotifErr) {
      console.warn("Failed to notify editors:", editorNotifErr);
    }

    // 2. Notify Admins and Sub-Admins
    try {
      await sendNotificationToAdmins({
        title: "📦 Videographer Uploaded Shoot Footage",
        message: `Videographer ${videographerName} uploaded raw videos and images for "${shootTitle}". Editors have been alerted.`,
        urgency: "MEDIUM",
        linkUrl: driveUrl,
        excludeUserId: authRes.id,
      });
    } catch (adminNotifErr) {
      console.warn("Failed to notify admins of footage upload:", adminNotifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Shoot footage uploaded and notifications sent to video editors & management!",
      data: footage,
    });
  } catch (error) {
    console.error("Footage Upload Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process footage upload" }, { status: 500 });
  }
}
