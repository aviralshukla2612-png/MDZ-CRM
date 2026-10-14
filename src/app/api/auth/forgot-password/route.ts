import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail, generatePasswordResetEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, reset instructions have been dispatched.",
      });
    }

    // Invalidate old tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    // Generate new secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    // Determine base URL
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "www.millionairedizital.com";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const origin = `${proto}://${host}`;
    const resetUrl = `${origin}/mdz-crm/reset-password?token=${token}`;

    console.log(`[Password Reset] Generated reset link for ${email}: ${resetUrl}`);

    const html = generatePasswordResetEmail(user.name || "User", resetUrl);
    const emailResult = await sendEmail({
      to: email,
      subject: "Reset your Millionaire OS password",
      html,
    });

    if (!emailResult.success) {
      console.warn(`[Password Reset] SMTP dispatch failed: ${emailResult.error}`);
    }

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, reset instructions have been dispatched to your inbox.",
      // Include direct reset link in development or if SMTP is unconfigured so admins can still recover passwords
      devResetUrl: process.env.NODE_ENV !== "production" || !process.env.SMTP_HOST ? resetUrl : undefined,
    });
  } catch (error: any) {
    console.error("[Forgot Password Error]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
