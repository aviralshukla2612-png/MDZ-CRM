import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sendNotificationToUser } from "@/lib/notifications";

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    let title = "🚀 Live CRM Alert";
    let message = "This is a real-time notification sent via WebSocket & Firebase Push!";
    let urgency: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
    let linkUrl = "/mdz-crm";

    try {
      const body = await req.json();
      if (body.title) title = body.title;
      if (body.message) message = body.message;
      if (body.urgency) urgency = body.urgency;
      if (body.linkUrl) linkUrl = body.linkUrl;
    } catch {
      // Use defaults if empty body
    }

    const notification = await sendNotificationToUser({
      recipientId: authRes.id,
      title,
      message,
      urgency,
      linkUrl,
    });

    return NextResponse.json({
      success: true,
      data: notification,
      message: "Test notification dispatched to DB, WebSocket, and Push!",
    });
  } catch (error: any) {
    console.error("Failed to send test notification:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to dispatch test notification" },
      { status: 500 }
    );
  }
}
