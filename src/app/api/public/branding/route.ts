import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BRANDING, BrandingConfig } from "@/lib/branding";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          startsWith: "brand_",
        },
      },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const branding: BrandingConfig = {
      companyName: settingsMap["brand_company_name"] || DEFAULT_BRANDING.companyName,
      brandTagline: settingsMap["brand_tagline"] || DEFAULT_BRANDING.brandTagline,
      companyFullTitle: settingsMap["brand_full_title"] || DEFAULT_BRANDING.companyFullTitle,
      companySubtext: settingsMap["brand_subtext"] || DEFAULT_BRANDING.companySubtext,
      logoUrl: settingsMap["brand_logo_url"] || DEFAULT_BRANDING.logoUrl,
      faviconUrl: settingsMap["brand_favicon_url"] || DEFAULT_BRANDING.faviconUrl,
      themeColor: (settingsMap["brand_theme"] as any) || DEFAULT_BRANDING.themeColor,
      copyrightText: settingsMap["brand_copyright"] || DEFAULT_BRANDING.copyrightText,
      supportEmail: settingsMap["brand_support_email"] || DEFAULT_BRANDING.supportEmail,
      supportPhone: settingsMap["brand_support_phone"] || DEFAULT_BRANDING.supportPhone,
      websiteUrl: settingsMap["brand_website_url"] || DEFAULT_BRANDING.websiteUrl,
    };

    return NextResponse.json({
      success: true,
      data: branding,
    });
  } catch (error) {
    console.error("GET /api/public/branding error:", error);
    return NextResponse.json({
      success: true,
      data: DEFAULT_BRANDING,
    });
  }
}
