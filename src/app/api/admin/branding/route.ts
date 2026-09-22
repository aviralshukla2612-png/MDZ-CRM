import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { DEFAULT_BRANDING, BrandingConfig } from "@/app/api/public/branding/route";

export async function POST(req: NextRequest) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  const session = authRes;
  const actorId = session.id;

  try {
    const body = await req.json();

    // Check if reset action
    if (body.action === "RESET") {
      const keysToDelete = [
        "brand_company_name",
        "brand_tagline",
        "brand_full_title",
        "brand_subtext",
        "brand_logo_url",
        "brand_favicon_url",
        "brand_theme",
        "brand_copyright",
        "brand_support_email",
        "brand_support_phone",
        "brand_website_url",
      ];

      await prisma.systemSetting.deleteMany({
        where: {
          key: { in: keysToDelete },
        },
      });

      // Audit Event
      await prisma.activityEvent.create({
        data: {
          eventType: "BRANDING_RESET_DEFAULT",
          actorId,
          entityType: "SYSTEM_BRANDING",
          entityId: "global",
          metadataJson: JSON.stringify({ message: "Reset system branding to default Millionaire OS" }),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Branding reset to default configuration",
        data: DEFAULT_BRANDING,
      });
    }

    const {
      companyName,
      brandTagline,
      companyFullTitle,
      companySubtext,
      logoUrl,
      faviconUrl,
      themeColor,
      copyrightText,
      supportEmail,
      supportPhone,
      websiteUrl,
    } = body;

    const updates: Record<string, string> = {};
    if (companyName !== undefined) updates["brand_company_name"] = String(companyName).trim();
    if (brandTagline !== undefined) updates["brand_tagline"] = String(brandTagline).trim();
    if (companyFullTitle !== undefined) updates["brand_full_title"] = String(companyFullTitle).trim();
    if (companySubtext !== undefined) updates["brand_subtext"] = String(companySubtext).trim();
    if (logoUrl !== undefined) updates["brand_logo_url"] = String(logoUrl).trim();
    if (faviconUrl !== undefined) updates["brand_favicon_url"] = String(faviconUrl).trim();
    if (themeColor !== undefined) updates["brand_theme"] = String(themeColor).trim().toLowerCase();
    if (copyrightText !== undefined) updates["brand_copyright"] = String(copyrightText).trim();
    if (supportEmail !== undefined) updates["brand_support_email"] = String(supportEmail).trim();
    if (supportPhone !== undefined) updates["brand_support_phone"] = String(supportPhone).trim();
    if (websiteUrl !== undefined) updates["brand_website_url"] = String(websiteUrl).trim();

    for (const [key, value] of Object.entries(updates)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    // Audit Event
    await prisma.activityEvent.create({
      data: {
        eventType: "BRANDING_UPDATED",
        actorId,
        entityType: "SYSTEM_BRANDING",
        entityId: "global",
        metadataJson: JSON.stringify({
          companyName: updates["brand_company_name"],
          brandTagline: updates["brand_tagline"],
          themeColor: updates["brand_theme"],
          hasLogo: Boolean(updates["brand_logo_url"]),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Branding settings saved successfully",
      data: updates,
    });
  } catch (error) {
    console.error("POST /api/admin/branding error:", error);
    return NextResponse.json({ success: false, error: "Failed to save branding settings" }, { status: 500 });
  }
}
