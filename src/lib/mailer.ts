import nodemailer from "nodemailer";

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export function getMailerTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendEmail({ to, subject, html, text }: SendMailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getMailerTransporter();

    if (!transporter) {
      console.warn(
        `[Mailer Warning] SMTP is not configured in .env. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS to send real emails.`
      );
      return {
        success: false,
        error: "SMTP configuration is missing. Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env.",
      };
    }

    const fromAddress = process.env.SMTP_FROM || `"Millionaire OS" <${process.env.SMTP_USER}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ""),
      html,
    });

    console.log(`[Mailer] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Mailer Error] Failed to send email:", error);
    return {
      success: false,
      error: error?.message || "Failed to send email via SMTP",
    };
  }
}

export function generatePasswordResetEmail(name: string, resetUrl: string): string {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password — Millionaire OS</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .logo { font-size: 22px; font-weight: 900; color: #d97706; margin-bottom: 24px; letter-spacing: -0.5px; }
        .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .content { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: #ffffff !important; text-decoration: none; padding: 12px 28px; font-weight: 700; font-size: 14px; border-radius: 10px; margin: 12px 0 24px 0; }
        .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 18px; margin-top: 24px; line-height: 1.5; }
        .link-text { word-break: break-all; font-size: 11px; color: #64748b; margin-top: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">⚡ Millionaire OS</div>
        <div class="title">Password Reset Request</div>
        <div class="content">
          Hello <strong>${name || "User"}</strong>,<br><br>
          We received a request to reset the password for your Millionaire OS account. Click the button below to create a new password. This link is valid for <strong>1 hour</strong>.
        </div>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
        </div>
        <div class="content">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </div>
        <div class="footer">
          If the button above does not work, copy and paste this link into your browser:
          <div class="link-text">${resetUrl}</div>
          <br>
          © 2026 Millionaire Dizital LLP. All rights reserved.
        </div>
      </div>
    </body>
  </html>
  `;
}
