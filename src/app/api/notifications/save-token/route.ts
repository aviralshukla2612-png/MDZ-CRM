import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { token, device } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid token is required" },
        { status: 400 }
      );
    }

    // Upsert the token for the authenticated user
    const savedToken = await prisma.userPushToken.upsert({
      where: { token },
      update: {
        userId: authRes.id,
        device: device || null,
        updatedAt: new Date(),
      },
      create: {
        userId: authRes.id,
        token,
        device: device || null,
      },
    });

    return NextResponse.json({ success: true, data: savedToken });
  } catch (error) {
    console.error("Failed to save FCM token:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save push token" },
      { status: 500 }
    );
  }
}
