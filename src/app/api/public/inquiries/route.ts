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
import { Readable } from "stream";

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

    // 6. Handle Google Drive Uploads for Files
    const uploadedDriveFiles: {
      driveFileId: string;
      fileName: string;
      originalName: string;
      mimeType: string;
      fileSize: number;
    }[] = [];

    if (uploadedFiles.length > 0 && isGoogleDriveConfigured()) {
      try {
        const folderId = await resolveEntityFolder("LEAD", leadNumber, "Inquiry-Attachments");

        for (const file of uploadedFiles) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const stream = Readable.from(buffer);
          const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

          const driveRes = await uploadStreamToDrive({
            stream,
            fileName: safeName,
            mimeType: file.type || "application/octet-stream",
            folderId,
          });

          uploadedDriveFiles.push({
            driveFileId: driveRes.driveFileId,
            fileName: driveRes.fileName,
            originalName: file.name,
            mimeType: file.type || "application/octet-stream",
            fileSize: file.size,
          });
        }
      } catch (driveErr: any) {
        console.error("[Inquiry API] Google Drive upload error:", driveErr);
        // Rollback any drive files uploaded during this batch
        for (const f of uploadedDriveFiles) {
          await deleteDriveFile(f.driveFileId).catch(() => {});
        }
        return NextResponse.json(
          {
            success: false,
            error: "Failed to securely store uploaded attachments. Please try again without files or contact support.",
          },
          { status: 500 }
        );
      }
    } else if (uploadedFiles.length > 0) {
      // Local fallback metadata if Google Drive not configured
      for (const file of uploadedFiles) {
        uploadedDriveFiles.push({
          driveFileId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          fileName: file.name,
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
            additionalDetails: validData.additionalDetails,
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
              storageProvider: isGoogleDriveConfigured() ? "GOOGLE_DRIVE" : "LOCAL",
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
        if (isGoogleDriveConfigured()) {
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
