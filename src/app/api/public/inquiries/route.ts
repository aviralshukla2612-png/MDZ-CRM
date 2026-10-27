import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicInquirySchema } from "@/lib/validations";
import {
  isGoogleDriveConfigured,
  resolveEntityFolder,
  uploadStreamToDrive,
  deleteDriveFile,
} from "@/lib/googleDrive";
import { syncInquiryToGoogleSheets } from "@/lib/googleSheets";
import { getSafeUploadDir } from "@/lib/storageHelper";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

// In-memory rate limiting map: ip -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

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
          error: "Too many inquiry submissions from this connection. Please wait a few minutes before trying again.",
        },
        { status: 429 }
      );
    }

    let payload: any = {};
    const uploadedFiles: File[] = [];

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      // Extract JSON data or individual fields
      const dataStr = formData.get("data");
      if (typeof dataStr === "string") {
        try {
          payload = JSON.parse(dataStr);
        } catch {
          payload = {};
        }
      } else {
        // Fallback reading form-data keys
        payload.companyName = formData.get("companyName");
        payload.contactName = formData.get("contactName");
        payload.phone = formData.get("phone");
        payload.email = formData.get("email");
        payload.industry = formData.get("industry");
        payload.subCategory = formData.get("subCategory");
        payload.businessType = formData.get("businessType");
        payload.location = formData.get("location");
        payload.durationType = formData.get("durationType");
        payload.durationMonths = Number(formData.get("durationMonths") || 3);
        payload.targetAudience = formData.get("targetAudience") || "";
        payload.competitors = formData.get("competitors") || "";
        payload.productsServices = formData.get("productsServices") || "";
        payload.usp = formData.get("usp") || "";
        payload.socialHandles = formData.get("socialHandles") || "";
        payload.googleDriveLink = formData.get("googleDriveLink") || "";
        payload.preferredLanguage = formData.get("preferredLanguage") || "";
        payload.additionalDetails = formData.get("additionalDetails") || "";
        payload.confirmed = formData.get("confirmed") === "true";
        payload.website_hp = formData.get("website_hp") || "";

        const goalsRaw = formData.getAll("goals");
        payload.goals = goalsRaw.map(String);

        const servicesRaw = formData.getAll("services");
        payload.services = servicesRaw.map(String);
      }

      // Collect uploaded files
      const fileEntries = formData.getAll("files");
      for (const entry of fileEntries) {
        if (entry instanceof File && entry.size > 0) {
          uploadedFiles.push(entry);
        }
      }
    } else {
      payload = await req.json();
    }

    // 2. Anti-Bot / Honeypot Check
    if (payload.website_hp && payload.website_hp.trim().length > 0) {
      // Silently accept without inserting spam into CRM
      return NextResponse.json({
        success: true,
        message: "Inquiry submitted successfully.",
        referenceId: `LEAD-${new Date().getFullYear()}-0000`,
      });
    }

    // 3. Server-Side Zod Validation
    const parsed = publicInquirySchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors)[0]?.[0] || "Invalid form submission";
      return NextResponse.json(
        {
          success: false,
          error: firstError,
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const validData = parsed.data;

    // 4. File Size & Type Validation
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    for (const file of uploadedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `File "${file.name}" exceeds the maximum allowed size of 25MB.`,
          },
          { status: 400 }
        );
      }
    }

    // 5. Generate Lead Number & Find default internal owner
    const leadCount = await prisma.lead.count();
    const year = new Date().getFullYear();
    const leadNumber = `LEAD-${year}-${String(leadCount + 101).padStart(4, "0")}`;

    // Find system owner or admin user for relation default
    const ownerUser = await prisma.user.findFirst({
      where: { activeRole: { in: ["OWNER", "ADMIN"] }, isActive: true },
      select: { id: true },
    });

    const actorId = ownerUser?.id;

    // 6. Handle Storage for Uploaded Files (Google Drive with Graceful Local Fallback)
    const uploadedDriveFiles: {
      driveFileId: string;
      storageProvider: "GOOGLE_DRIVE" | "LOCAL";
      fileName: string;
      originalName: string;
      mimeType: string;
      fileSize: number;
    }[] = [];

    if (uploadedFiles.length > 0) {
      let folderId: string | undefined;
      if (isGoogleDriveConfigured()) {
        try {
          folderId = await resolveEntityFolder("LEAD", leadNumber, "Inquiry-Attachments");
        } catch (folderErr) {
          console.warn("[Inquiry API] Google Drive folder resolution warning. Will fallback to local storage:", folderErr);
        }
      }

      for (const file of uploadedFiles) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        let driveFileId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        let storageProvider: "GOOGLE_DRIVE" | "LOCAL" = "LOCAL";
        let driveUploaded = false;

        // Attempt Google Drive upload if configured and folder is available
        if (isGoogleDriveConfigured() && folderId) {
          try {
            const stream = Readable.from(buffer);
            const driveRes = await uploadStreamToDrive({
              stream,
              fileName: safeName,
              mimeType: file.type || "application/octet-stream",
              folderId,
            });

            if (driveRes?.driveFileId) {
              driveFileId = driveRes.driveFileId;
              storageProvider = "GOOGLE_DRIVE";
              driveUploaded = true;
            }
          } catch (driveErr) {
            console.warn(`[Inquiry API] Google Drive upload failed for ${file.name}. Gracefully falling back to secure local storage:`, driveErr);
          }
        }

        // Graceful Local Fallback: Always ensure file is securely saved on disk if Drive didn't succeed
        if (!driveUploaded) {
          try {
            const uploadDir = await getSafeUploadDir();
            await fs.promises.writeFile(path.join(uploadDir, safeName), buffer);
            storageProvider = "LOCAL";
          } catch (fsErr) {
            console.error(`[Inquiry API] Failed to write local fallback file for ${file.name}:`, fsErr);
          }
        }

        uploadedDriveFiles.push({
          driveFileId,
          storageProvider,
          fileName: safeName,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
        });
      }
    }

    // 7. Atomic Database Transaction
    let newLead: any;
    try {
      newLead = await prisma.$transaction(async (tx) => {
        // A. Create Lead record
        const lead = await tx.lead.create({
          data: {
            leadNumber,
            contactPerson: validData.contactName,
            companyName: validData.companyName,
            mobile: validData.phone,
            whatsapp: validData.phone,
            email: validData.email,
            source: "PUBLIC_INQUIRY",
            interestedService: validData.services.join(", "),
            industry: validData.industry,
            subCategory: validData.subCategory,
            businessType: validData.businessType,
            location: validData.location,
            goalsJson: JSON.stringify(validData.goals),
            servicesJson: JSON.stringify(validData.services),
            durationType: validData.durationType,
            durationMonths: validData.durationMonths,
            targetAudience: validData.targetAudience,
            competitors: validData.competitors,
            additionalDetails: (() => {
              const parts: string[] = [];
              if (validData.productsServices) parts.push(`[Products / Services]: ${validData.productsServices}`);
              if (validData.usp) parts.push(`[USP]: ${validData.usp}`);
              if (validData.socialHandles) parts.push(`[Social Handles]: ${validData.socialHandles}`);
              if (validData.googleDriveLink) parts.push(`[Google Drive]: ${validData.googleDriveLink}`);
              if (validData.preferredLanguage) parts.push(`[Preferred Language]: ${validData.preferredLanguage}`);
              if (validData.additionalDetails) parts.push(`[Project Scope]: ${validData.additionalDetails}`);
              
              if (validData.brandVoiceGuide) {
                const bvg = validData.brandVoiceGuide;
                const summaryLines: string[] = [];
                const bName = bvg.brandName || bvg.brandOverview?.businessName;
                const bInd = bvg.industryNiche || bvg.brandOverview?.industry;
                const bMis = bvg.mission || bvg.brandOverview?.mission;
                const bAud = bvg.targetAudience || bvg.brandOverview?.targetAudience;
                const bPers = bvg.personalityTraits || bvg.brandPersonality;
                const bVoice = bvg.voiceTypes || bvg.brandVoice;
                const bTone = bvg.toneTypes || bvg.tone;
                const bComm = bvg.commStyles || bvg.communicationStyle;
                const bCharProf = bvg.characterProfession || bvg.brandCharacter?.profession;
                const bCharAge = bvg.characterAge || bvg.brandCharacter?.ageRange;
                const bForm = bvg.formalityLevel || bvg.formality;
                const bSent = bvg.sentenceStyles || bvg.sentenceStyle;
                const bCap = bvg.captionStyles || bvg.captionStyle;
                const bCta = bvg.ctaStyles || bvg.ctaStyle;
                const bLang = bvg.preferredLanguages;

                if (bName) summaryLines.push(`Brand: ${bName}`);
                if (bInd) summaryLines.push(`Industry: ${bInd}`);
                if (bMis) summaryLines.push(`Mission: ${bMis}`);
                if (bAud) summaryLines.push(`Target Audience: ${bAud}`);
                if (bPers?.length) summaryLines.push(`Personality: ${bPers.join(", ")}`);
                if (bVoice?.length) summaryLines.push(`Voice: ${bVoice.join(", ")}`);
                if (bTone?.length) summaryLines.push(`Tone: ${bTone.join(", ")}`);
                if (bComm?.length) summaryLines.push(`Communication: ${bComm.join(", ")}`);
                if (bCharProf) summaryLines.push(`Character: ${bCharProf} (${bCharAge || "Any Age"})`);
                if (bForm) summaryLines.push(`Formality: ${bForm}`);
                if (bSent?.length) summaryLines.push(`Sentence Style: ${bSent.join(", ")}`);
                if (bCap?.length) summaryLines.push(`Caption Style: ${bCap.join(", ")}`);
                if (bCta?.length) summaryLines.push(`CTA Style: ${bCta.join(", ")}`);
                if (bvg.wordsToUse) summaryLines.push(`Words to Use: ${bvg.wordsToUse.replace(/\n/g, ", ")}`);
                if (bvg.wordsToAvoid) summaryLines.push(`Words to Avoid: ${bvg.wordsToAvoid.replace(/\n/g, ", ")}`);
                if (bLang?.length) summaryLines.push(`Languages: ${bLang.join(", ")}`);

                if (summaryLines.length > 0) {
                  parts.push(`=== BRAND VOICE & TONE GUIDE ===\n${summaryLines.join("\n")}`);
                }
                parts.push(`[BRAND_VOICE_GUIDE_DATA]: ${JSON.stringify(bvg)}`);
              }

              if (validData.campaignPlanner) {
                const cp = validData.campaignPlanner;
                const cpLines: string[] = [];
                if (cp.campaignName) cpLines.push(`Campaign: ${cp.campaignName}`);
                if (cp.campaignType) cpLines.push(`Type: ${cp.campaignType}`);
                if (cp.campaignDuration) cpLines.push(`Duration: ${cp.campaignDuration} (${cp.startDate || "?"} to ${cp.endDate || "?"})`);
                if (cp.objectives?.length) cpLines.push(`Objectives: ${cp.objectives.join(", ")}`);
                if (cp.campaignOffer) cpLines.push(`Offer: ${cp.campaignOffer}`);
                if (cp.keyMessage) cpLines.push(`Key Message: ${cp.keyMessage}`);
                if (cp.platforms?.length) cpLines.push(`Platforms: ${cp.platforms.join(", ")}`);
                if (cp.contentFormats?.length) cpLines.push(`Formats: ${cp.contentFormats.join(", ")}`);
                const deliverables = [];
                if (cp.reelsQty) deliverables.push(`${cp.reelsQty} Reels`);
                if (cp.staticPostsQty) deliverables.push(`${cp.staticPostsQty} Statics`);
                if (cp.carouselsQty) deliverables.push(`${cp.carouselsQty} Carousels`);
                if (cp.storiesQty) deliverables.push(`${cp.storiesQty} Stories`);
                if (cp.adCreativesQty) deliverables.push(`${cp.adCreativesQty} Ad Creatives`);
                if (deliverables.length) cpLines.push(`Content Needed: ${deliverables.join(", ")}`);
                if (cp.runPaidAds) cpLines.push(`Paid Ads: Yes (Budget: ₹${cp.budget || "N/A"})`);
                if (cp.campaignHashtag) cpLines.push(`Hashtag: ${cp.campaignHashtag}`);

                if (cpLines.length > 0) {
                  parts.push(`=== CAMPAIGN PLANNER ===\n${cpLines.join("\n")}`);
                }
                parts.push(`[CAMPAIGN_PLANNER_DATA]: ${JSON.stringify(cp)}`);
              }

              if (validData.scopeDocument) {
                const sc = validData.scopeDocument;
                const scLines: string[] = [];
                if (sc.scopeOfWork) scLines.push(`Scope: ${sc.scopeOfWork}`);
                if (sc.servicesIncluded?.length) scLines.push(`Included: ${sc.servicesIncluded.join(", ")}`);
                if (sc.servicesNotIncluded?.length) scLines.push(`Excluded: ${sc.servicesNotIncluded.join(", ")}`);
                const monthlyDeliv = [];
                if (sc.deliverablesReels) monthlyDeliv.push(`${sc.deliverablesReels} Reels`);
                if (sc.deliverablesStatics) monthlyDeliv.push(`${sc.deliverablesStatics} Statics`);
                if (sc.deliverablesCarousels) monthlyDeliv.push(`${sc.deliverablesCarousels} Carousels`);
                if (sc.deliverablesStories) monthlyDeliv.push(`${sc.deliverablesStories} Stories`);
                if (sc.deliverablesOther) monthlyDeliv.push(sc.deliverablesOther);
                if (monthlyDeliv.length) scLines.push(`Monthly Deliverables: ${monthlyDeliv.join(", ")}`);
                if (sc.postingResponsibility) scLines.push(`Posting: ${sc.postingResponsibility}`);
                if (sc.reviewTimeline) scLines.push(`Review SLA: ${sc.reviewTimeline}`);
                if (sc.revisionsIncluded) scLines.push(`Revisions: ${sc.revisionsIncluded}`);
                if (sc.paymentTerms) scLines.push(`Payment: ${sc.paymentTerms}`);
                if (sc.noticePeriod) scLines.push(`Notice Period: ${sc.noticePeriod}`);

                if (scLines.length > 0) {
                  parts.push(`=== CLIENT EXPECTATIONS & SCOPE DOCUMENT ===\n${scLines.join("\n")}`);
                }
                parts.push(`[SCOPE_DOCUMENT_DATA]: ${JSON.stringify(sc)}`);
              }

              if (validData.onboardingForm) {
                const ob = validData.onboardingForm;
                const obLines: string[] = [];
                if (ob.clientName) obLines.push(`Client: ${ob.clientName}`);
                if (ob.businessBrandName) obLines.push(`Brand: ${ob.businessBrandName}`);
                if (ob.servicesRequired?.length) obLines.push(`Services Needed: ${ob.servicesRequired.join(", ")}`);
                if (ob.packageName) obLines.push(`Package: ${ob.packageName} (${ob.contractDuration || "Retainer"})`);
                if (ob.contentStyleTone) obLines.push(`Tone: ${ob.contentStyleTone}`);
                if (ob.googleDriveFolderLink) obLines.push(`Drive: ${ob.googleDriveFolderLink}`);
                if (ob.accountAccess?.length) obLines.push(`Access: ${ob.accountAccess.join(", ")}`);
                if (ob.pocName) obLines.push(`POC: ${ob.pocName} (${ob.pocDesignation || "POC"})`);
                if (ob.communicationMethods?.length) obLines.push(`Comm: ${ob.communicationMethods.join(", ")}`);

                if (obLines.length > 0) {
                  parts.push(`=== CLIENT ONBOARDING INTAKE ===\n${obLines.join("\n")}`);
                }
                parts.push(`[ONBOARDING_FORM_DATA]: ${JSON.stringify(ob)}`);
              }

              if (validData.competitorAnalysis) {
                const ca = validData.competitorAnalysis;
                const caLines: string[] = [];
                const c1 = ca.competitor1?.name ? `${ca.competitor1.name} (${ca.competitor1.website || "No site"})` : null;
                const c2 = ca.competitor2?.name ? `${ca.competitor2.name} (${ca.competitor2.website || "No site"})` : null;
                const c3 = ca.competitor3?.name ? `${ca.competitor3.name} (${ca.competitor3.website || "No site"})` : null;
                const comps = [c1, c2, c3].filter(Boolean);
                if (comps.length > 0) caLines.push(`Competitors Analyzed: ${comps.join(" | ")}`);
                if (ca.keyTakeaways) caLines.push(`Key Takeaways: ${ca.keyTakeaways}`);
                if (ca.overallOpportunities) caLines.push(`Opportunities: ${ca.overallOpportunities}`);
                if (ca.strategyIdeas) caLines.push(`Strategy Ideas: ${ca.strategyIdeas}`);

                if (caLines.length > 0) {
                  parts.push(`=== COMPETITOR ANALYSIS SHEET ===\n${caLines.join("\n")}`);
                }
                parts.push(`[COMPETITOR_ANALYSIS_DATA]: ${JSON.stringify(ca)}`);
              }

              if (validData.contentPillars) {
                const cp = validData.contentPillars;
                const cpLines: string[] = [];
                const pillarsList = [
                  { label: "Educational", item: cp.educational },
                  { label: "Promotional", item: cp.promotional },
                  { label: "Engagement", item: cp.engagement },
                  { label: "Trust / Authority", item: cp.trustAuthority },
                  { label: "Entertainment", item: cp.entertainment },
                ];
                for (const p of pillarsList) {
                  if (p.item?.pillarName) {
                    cpLines.push(`• ${p.label}: ${p.item.pillarName} (${p.item.plannedFrequency || "N/A"}, Priority: ${p.item.priority || "Medium"})`);
                  }
                }
                if (cp.overallNotes) {
                  cpLines.push(`Overall Notes: ${cp.overallNotes}`);
                }

                if (cpLines.length > 0) {
                  parts.push(`=== CONTENT PILLARS SHEET ===\n${cpLines.join("\n")}`);
                }
                parts.push(`[CONTENT_PILLARS_DATA]: ${JSON.stringify(cp)}`);
              }

              if (validData.meetingNotes) {
                const mn = validData.meetingNotes;
                const mnLines: string[] = [];
                if (mn.clientBrandName) mnLines.push(`Brand: ${mn.clientBrandName}`);
                if (mn.meetingDate || mn.meetingTime) mnLines.push(`Call Time: ${mn.meetingDate || "?"} at ${mn.meetingTime || "?"}`);
                if (mn.meetingTypes?.length) mnLines.push(`Type: ${mn.meetingTypes.join(", ")}`);
                if (mn.meetingObjective) mnLines.push(`Objective: ${mn.meetingObjective}`);
                const activePoints = mn.discussionPoints?.filter(Boolean) || [];
                if (activePoints.length > 0) mnLines.push(`Discussion Points: ${activePoints.slice(0, 3).join("; ")}`);
                const activeDecisions = mn.decisionsMade?.filter(Boolean) || [];
                if (activeDecisions.length > 0) mnLines.push(`Decisions: ${activeDecisions.slice(0, 3).join("; ")}`);
                if (mn.actionItems?.length > 0) mnLines.push(`Action Items: ${mn.actionItems.length} tasks assigned`);
                if (mn.nextMeetingDate) mnLines.push(`Next Sync: ${mn.nextMeetingDate} at ${mn.nextMeetingTime || "?"}`);

                if (mnLines.length > 0) {
                  parts.push(`=== MEETING / CALL NOTES ===\n${mnLines.join("\n")}`);
                }
                parts.push(`[MEETING_NOTES_DATA]: ${JSON.stringify(mn)}`);
              }

              return parts.join("\n\n") || validData.additionalDetails;
            })(),
            status: "NEW",
            priority: "MEDIUM",
            createdById: actorId || null,
          },
        });

        // B. Create MediaFile records linked to Lead
        for (const f of uploadedDriveFiles) {
          await tx.mediaFile.create({
            data: {
              driveFileId: f.driveFileId,
              storageProvider: f.storageProvider,
              fileName: f.fileName,
              originalName: f.originalName,
              mimeType: f.mimeType,
              fileSize: f.fileSize,
              category: "INQUIRY_ATTACHMENT",
              entityType: "LEAD",
              entityId: lead.id,
              leadId: lead.id,
              uploadedById: actorId || null,
            },
          });
        }

        // C. Record Activity Event
        if (actorId) {
          await tx.activityEvent.create({
            data: {
              eventType: "LEAD_CREATED",
              actorId,
              entityType: "LEAD",
              entityId: lead.id,
              metadataJson: JSON.stringify({
                source: "PUBLIC_INQUIRY",
                companyName: validData.companyName,
                contactName: validData.contactName,
                email: validData.email,
                phone: validData.phone,
                servicesCount: validData.services.length,
                goalsCount: validData.goals.length,
                attachmentsCount: uploadedDriveFiles.length,
                submittedAt: new Date().toISOString(),
              }),
            },
          });
        }

        return lead;
      });
    } catch (dbErr: any) {
      console.error("[Inquiry API] Database transaction error:", dbErr);
      // Compensating Drive cleanup
      for (const f of uploadedDriveFiles) {
        if (f.storageProvider === "GOOGLE_DRIVE") {
          await deleteDriveFile(f.driveFileId).catch(() => {});
        }
      }
      return NextResponse.json(
        {
          success: false,
          error: "Failed to record inquiry into database. Please try again later.",
        },
        { status: 500 }
      );
    }

    // 8. Trigger Internal Team Notifications
    try {
      const internalStaff = await prisma.user.findMany({
        where: {
          activeRole: { in: ["OWNER", "ADMIN", "SUB_ADMIN", "SALES"] },
          isActive: true,
        },
        select: { id: true },
      });

      const notifTitle = `New Client Inquiry: ${validData.companyName}`;
      const notifMessage = `${validData.contactName} submitted an inquiry for ${validData.services.length} services (${validData.industry}). Ref: ${leadNumber}`;

      for (const staff of internalStaff) {
        await prisma.notification.create({
          data: {
            recipientId: staff.id,
            title: notifTitle,
            message: notifMessage,
            urgency: "HIGH",
            linkUrl: `/leads/${newLead.id}`,
          },
        });
      }
    } catch (notifErr) {
      console.warn("[Inquiry API] Staff notification warning:", notifErr);
    }

    // 9. Optional Background Sync to Google Sheets
    syncInquiryToGoogleSheets({
      leadNumber,
      companyName: validData.companyName,
      contactPerson: validData.contactName,
      email: validData.email,
      phone: validData.phone,
      industry: validData.industry,
      subCategory: validData.subCategory,
      businessType: validData.businessType,
      location: validData.location,
      goals: validData.goals,
      services: validData.services,
      duration: `${validData.durationMonths} Months (${validData.durationType})`,
      targetAudience: validData.targetAudience || "N/A",
      competitors: validData.competitors || "N/A",
      additionalDetails: validData.additionalDetails || "N/A",
      submittedAt: new Date().toISOString(),
    }).catch((sheetErr) => {
      console.warn("[Inquiry API] Google Sheets background sync notice:", sheetErr);
    });

    // 10. Return Clean Success Response
    return NextResponse.json(
      {
        success: true,
        message: "Your inquiry has been successfully received. Our team will contact you shortly.",
        referenceId: leadNumber,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Inquiry API] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while submitting your inquiry. Please try again.",
      },
      { status: 500 }
    );
  }
}
