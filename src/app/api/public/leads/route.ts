import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncInquiryToGoogleSheets } from "@/lib/googleSheets";

// In-memory rate limiting map: ip -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 30; // Generous limit for webhooks/forms

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

/**
 * Standardize source name to clean uppercase key
 */
function normalizeSource(sourceRaw?: string): string {
  if (!sourceRaw) return "WEBSITE";
  const s = sourceRaw.trim().toUpperCase();
  if (s.includes("INSTA") || s.includes("IG")) return "INSTAGRAM";
  if (s.includes("FB") || s.includes("FACEBOOK")) return "FACEBOOK";
  if (s.includes("LINKEDIN") || s.includes("LI")) return "LINKEDIN";
  if (s.includes("WHATSAPP") || s.includes("WA")) return "WHATSAPP";
  if (s.includes("GOOGLE") || s.includes("GADS") || s.includes("ADWORDS")) return "GOOGLE_ADS";
  if (s.includes("WEB") || s.includes("LANDING") || s.includes("FORM")) return "WEBSITE";
  if (s.includes("ZAPIER") || s.includes("MAKE") || s.includes("PABBLY") || s.includes("N8N") || s.includes("WEBHOOK")) return "WEBHOOK";
  if (s.includes("REFERRAL")) return "REFERRAL";
  return s;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown-client";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests from this connection. Please wait a moment.",
        },
        { status: 429 }
      );
    }

    let payload: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const entries = Array.from(formData.entries());
      for (const [key, value] of entries) {
        if (typeof value === "string") {
          payload[key] = value;
        }
      }
    } else {
      try {
        payload = await req.json();
      } catch {
        payload = {};
      }
    }

    // Anti-Spam / Honeypot Check
    if (payload.website_hp && payload.website_hp.trim().length > 0) {
      return NextResponse.json({
        success: true,
        message: "Lead received successfully.",
        referenceId: `LEAD-${new Date().getFullYear()}-0000`,
      });
    }

    // Extract & Normalize Contact Details
    const contactPerson = (
      payload.contactPerson ||
      payload.contactName ||
      payload.name ||
      payload.fullName ||
      payload.full_name ||
      payload.first_name ||
      "Prospective Client"
    ).trim();

    const companyName = (
      payload.companyName ||
      payload.company ||
      payload.business_name ||
      payload.organization ||
      contactPerson
    ).trim();

    const mobile = (
      payload.mobile ||
      payload.phone ||
      payload.phoneNumber ||
      payload.phone_number ||
      payload.contactNumber ||
      payload.tel ||
      ""
    ).trim();

    const whatsapp = (
      payload.whatsapp ||
      payload.whatsapp_number ||
      payload.wa ||
      mobile
    ).trim();

    const email = (
      payload.email ||
      payload.emailAddress ||
      payload.email_address ||
      ""
    ).trim();

    // Source Platform & Marketing attribution
    const rawSource =
      payload.source ||
      payload.platform ||
      payload.lead_source ||
      payload.channel ||
      payload.utm_source ||
      req.nextUrl.searchParams.get("source") ||
      "WEBSITE";

    const source = normalizeSource(rawSource);

    const interestedService = (
      payload.interestedService ||
      payload.service ||
      payload.services ||
      payload.requirement ||
      payload.projectScope ||
      payload.ad_name ||
      "General Consultation"
    ).toString().trim();

    const location = (
      payload.location ||
      payload.city ||
      payload.country ||
      payload.state ||
      ""
    ).trim();

    const industry = (payload.industry || payload.sector || "").trim();
    const budgetRaw = payload.estimatedBudget || payload.budget || payload.leadValue || 0;
    const estimatedBudget = parseFloat(String(budgetRaw).replace(/[^0-9.]/g, "")) || 0;

    const message = (
      payload.message ||
      payload.description ||
      payload.additionalDetails ||
      payload.notes ||
      payload.query ||
      ""
    ).trim();

    // Collect extra tracking & UTM parameters
    const metadataDetails: Record<string, any> = {
      rawSource,
      utm_source: payload.utm_source || req.nextUrl.searchParams.get("utm_source"),
      utm_medium: payload.utm_medium || req.nextUrl.searchParams.get("utm_medium"),
      utm_campaign: payload.utm_campaign || req.nextUrl.searchParams.get("utm_campaign"),
      utm_content: payload.utm_content || req.nextUrl.searchParams.get("utm_content"),
      ad_id: payload.ad_id || payload.adId,
      campaign_name: payload.campaign_name || payload.campaignName,
      form_id: payload.form_id || payload.formId,
      page_url: payload.page_url || payload.referrer || req.headers.get("referer"),
      ip_address: ip,
      submitted_at: new Date().toISOString(),
    };

    if (message) {
      metadataDetails.message = message;
    }

    // Require at least a name and either phone or email
    if (!mobile && !email) {
      return NextResponse.json(
        {
          success: false,
          error: "At least a mobile phone number or an email address is required to register a lead.",
        },
        { status: 400 }
      );
    }

    // 2. Generate Unique Lead Number
    const leadCount = await prisma.lead.count();
    const year = new Date().getFullYear();
    const leadNumber = `LEAD-${year}-${String(leadCount + 101).padStart(4, "0")}`;

    // Find internal system owner/admin user for creation relation
    const systemUser = await prisma.user.findFirst({
      where: { activeRole: { in: ["OWNER", "ADMIN"] }, isActive: true },
      select: { id: true },
    });

    // 3. Store in Database
    const newLead = await prisma.lead.create({
      data: {
        leadNumber,
        contactPerson,
        companyName,
        mobile: mobile || "N/A",
        whatsapp: whatsapp || mobile || null,
        email: email || null,
        source,
        interestedService,
        industry: industry || null,
        location: location || null,
        estimatedBudget,
        expectedValue: estimatedBudget,
        priority: source === "WHATSAPP" || source === "INSTAGRAM" ? "HIGH" : "MEDIUM",
        status: "NEW",
        additionalDetails: JSON.stringify(metadataDetails),
        remarks: message ? `Initial Query: ${message}` : `Captured via ${source}`,
        createdById: systemUser?.id || null,
      },
    });

    // 4. Log Activity Event
    if (systemUser?.id) {
      await prisma.activityEvent.create({
        data: {
          eventType: "LEAD_CREATED",
          actorId: systemUser.id,
          entityType: "LEAD",
          entityId: newLead.id,
          metadataJson: JSON.stringify({
            leadNumber,
            source,
            clientName: companyName,
            contactPerson,
            phone: mobile,
            email,
            interestedService,
            estimatedBudget,
          }),
        },
      });
    }

    // 5. Notify all Admins, Sub-Admins, Owners & Sales Team
    try {
      const internalStaff = await prisma.user.findMany({
        where: {
          activeRole: { in: ["OWNER", "ADMIN", "SUB_ADMIN", "SALES"] },
          isActive: true,
        },
        select: { id: true, name: true, activeRole: true },
      });

      const sourceEmoji =
        source === "INSTAGRAM"
          ? "📸 Instagram"
          : source === "FACEBOOK"
          ? "🔵 Facebook"
          : source === "LINKEDIN"
          ? "💼 LinkedIn"
          : source === "WHATSAPP"
          ? "💬 WhatsApp"
          : source === "GOOGLE_ADS"
          ? "🎯 Google Ads"
          : "🌐 Website";

      const notifTitle = `🔥 New Lead from ${sourceEmoji}: ${companyName}`;
      const notifMessage = `${contactPerson} (${mobile || email}) submitted an inquiry for "${interestedService}". Lead ID: ${leadNumber}`;

      for (const staff of internalStaff) {
        await prisma.notification.create({
          data: {
            recipientId: staff.id,
            title: notifTitle,
            message: notifMessage,
            urgency: "HIGH",
            linkUrl: `/leads`,
          },
        });
      }
    } catch (notifErr) {
      console.warn("[Multi-Source Lead API] Staff notification warning:", notifErr);
    }

    // 6. Optional Background Sync to Google Sheets
    syncInquiryToGoogleSheets({
      leadNumber,
      companyName,
      contactPerson,
      email,
      phone: mobile,
      industry: industry || "General",
      subCategory: source,
      businessType: "Inbound Lead",
      location: location || "N/A",
      goals: [source],
      services: [interestedService],
      duration: "Immediate",
      targetAudience: "N/A",
      competitors: "N/A",
      additionalDetails: message || JSON.stringify(metadataDetails),
      submittedAt: new Date().toISOString(),
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        message: "Lead successfully recorded in CRM and notifications dispatched to Admin & Sub-Admin team.",
        data: {
          id: newLead.id,
          leadNumber: newLead.leadNumber,
          source: newLead.source,
          contactPerson: newLead.contactPerson,
          companyName: newLead.companyName,
          status: newLead.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Multi-Source Lead API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to record incoming lead into CRM. Please verify data format.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Multi-Source Lead Capture API is operational. Send POST requests with client information.",
    supportedSources: [
      "INSTAGRAM",
      "FACEBOOK",
      "LINKEDIN",
      "WEBSITE",
      "WHATSAPP",
      "GOOGLE_ADS",
      "WEBHOOK",
      "REFERRAL",
      "OTHER",
    ],
    samplePayload: {
      name: "Rajesh Sharma",
      company: "Apex Innovations",
      phone: "+91 98765 43210",
      email: "rajesh@example.com",
      source: "INSTAGRAM", // or FACEBOOK, LINKEDIN, WEBSITE, etc.
      interestedService: "Full Stack Web App & Digital Marketing",
      location: "Mumbai, India",
      estimatedBudget: 75000,
      message: "Interested in developing enterprise web portal",
    },
  });
}
