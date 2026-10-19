import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Basic Indian GSTIN Regex: 2 digits, 5 letters, 4 digits, 1 letter, 1 Z/digit, 1 checksum letter/digit
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      brandName,
      contactName,
      designation,
      email,
      password,
      phone,
      whatsapp,
      gstNumber,
      websiteUrl,
      registeredAddress,
      brandGuideUrl,
      rawFootageDriveUrl,
      primaryColorHex,
      instagramHandle,
      youtubeHandle,
      facebookUrl,
      linkedinUrl,
      reelsQuota,
      carouselsQuota,
      storiesQuota,
      termsAccepted,
      // Client Brief & Strategy
      productsServices,
      goals,
      targetAudience,
      usp,
      competitors,
      currentChallenges,
      // Brand Voice & Language
      brandVoiceTone,
      preferredLanguage,
      // Access Checklist
      accessChecklist,
      // Scope Acknowledgements
      approvalSlaAcknowledged,
      revisionPolicyAcknowledged,
    } = body;

    if (!companyName || typeof companyName !== "string" || companyName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Company name must be at least 2 characters long." },
        { status: 400 }
      );
    }

    if (!contactName || typeof contactName !== "string" || contactName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Contact full name must be at least 2 characters long." },
        { status: 400 }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address (e.g. name@company.com)." },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { success: false, error: "Phone number is required." },
        { status: 400 }
      );
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { success: false, error: "Phone number must contain at least 10 digits." },
        { status: 400 }
      );
    }

    if (phoneDigits.length > 15) {
      return NextResponse.json(
        { success: false, error: "Phone number cannot exceed 15 digits." },
        { status: 400 }
      );
    }

    if (/^(\d)\1+$/.test(phoneDigits)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid, non-repeating phone number." },
        { status: 400 }
      );
    }

    let checkDigits = phoneDigits;
    if (phoneDigits.length === 12 && phoneDigits.startsWith("91")) {
      checkDigits = phoneDigits.slice(2);
    } else if (phoneDigits.length === 11 && phoneDigits.startsWith("0")) {
      checkDigits = phoneDigits.slice(1);
    }

    if (checkDigits.length === 10 && !/^[6-9]\d{9}$/.test(checkDigits)) {
      return NextResponse.json(
        { success: false, error: "Indian mobile numbers must start with 6, 7, 8, or 9." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const isTermsAccepted = termsAccepted === undefined || termsAccepted === null ? true : Boolean(termsAccepted);
    if (!isTermsAccepted) {
      return NextResponse.json(
        { success: false, error: "You must accept the Terms of Service to register." },
        { status: 400 }
      );
    }

    if (gstNumber && typeof gstNumber === "string" && gstNumber.trim()) {
      const cleanGst = gstNumber.trim();
      if (!GSTIN_REGEX.test(cleanGst)) {
        return NextResponse.json(
          { success: false, error: "Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5" },
          { status: 400 }
        );
      }
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists." },
        { status: 400 }
      );
    }

    // Find default system user to assign createdById if required
    let systemUser = await prisma.user.findFirst({
      where: { activeRole: "OWNER" },
    });

    const passwordHash = await bcrypt.hash(password, 10);

    // Create User record with CLIENT role
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: contactName.trim(),
        designation: "Client Contact",
        department: "External",
        activeRole: "CLIENT",
      },
    });

    const creatorId = systemUser ? systemUser.id : newUser.id;
    const clientNumber = `CLI-${Date.now().toString().slice(-6)}`;

    // Create Client (Company) and primary ClientContact
    const newClient = await prisma.client.create({
      data: {
        clientNumber,
        companyName: companyName.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : "",
        gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : null,
        totalBusiness: 150000,
        outstandingBalance: 0,
        createdById: creatorId,
        contacts: {
          create: {
            name: contactName.trim(),
            designation: "Primary Contact",
            email: normalizedEmail,
            phone: phone ? phone.trim() : "",
            isPrimary: true,
            termsAccepted: true,
            termsAcceptedAt: new Date(),
            termsVersion: "v1.0",
          },
        },
      },
      include: {
        contacts: true,
      },
    });

    // 2. Pre-seed persistent JSON store with client's actual details
    try {
      const { getClientPortalData, saveClientPortalData } = await import("@/lib/clientPortalStore");
      const initialPortalData = getClientPortalData(newClient.id, newClient.companyName);

      const targetReels = Number(reelsQuota) || 30;
      const targetCarousels = Number(carouselsQuota) || 15;
      const targetStories = Number(storiesQuota) || 15;
      const totalPlanned = targetReels + targetCarousels + targetStories;

      saveClientPortalData(newClient.id, {
        ...initialPortalData,
        onboarding: {
          clientDetails: {
            clientName: companyName.trim(),
            brandName: (brandName || companyName).trim(),
            contactNumber: phone ? phone.trim() : "",
            email: normalizedEmail,
            website: websiteUrl ? websiteUrl.trim() : "",
            businessLocation: registeredAddress ? registeredAddress.trim() : "India",
          },
          businessInfo: {
            legalName: companyName.trim(),
            brandName: (brandName || companyName).trim(),
            gstin: gstNumber ? gstNumber.trim().toUpperCase() : "",
            websiteUrl: websiteUrl ? websiteUrl.trim() : "",
            registeredAddress: registeredAddress ? registeredAddress.trim() : "",
          },
          primaryContact: {
            fullName: contactName.trim(),
            role: designation ? designation.trim() : "Primary Contact",
            phone: phone ? phone.trim() : "",
            whatsapp: whatsapp ? whatsapp.trim() : (phone ? phone.trim() : ""),
            email: normalizedEmail,
          },
          brandAssets: {
            brandGuideUrl: brandGuideUrl ? brandGuideUrl.trim() : "",
            logoDriveUrl: brandGuideUrl ? brandGuideUrl.trim() : "",
            rawFootageDriveUrl: rawFootageDriveUrl ? rawFootageDriveUrl.trim() : "",
            fontFamilies: "Outfit, Inter, Sans-Serif",
            primaryColorHex: primaryColorHex || "#059669",
          },
          socialHandles: {
            instagram: instagramHandle ? instagramHandle.trim() : "",
            youtube: youtubeHandle ? youtubeHandle.trim() : "",
            facebook: facebookUrl ? facebookUrl.trim() : "",
            linkedin: linkedinUrl ? linkedinUrl.trim() : "",
            tiktok: "",
            pinterest: "",
            other: "",
          },
          servicesRequired: Array.isArray(goals) && goals.length > 0 ? goals : [
            "Social Media Management",
            "Content Creation",
            "Reels / Video Editing",
            "Graphic Design",
          ],
          packageSelected: {
            name: "Enterprise Digital Growth Retainer",
            startDate: new Date().toISOString().split("T")[0],
            duration: "Monthly Retainer",
          },
          deliverables: {
            postsPerWeek: `${Math.round(targetCarousels / 4) || 2} Posts per Week`,
            reelsPerWeek: `${Math.round(targetReels / 4) || 4} Reels per Week`,
            storiesPerWeek: `${Math.round(targetStories / 4) || 3} Stories per Week`,
            contentCalendar: "Provided on 1st of every month",
            hashtagResearch: "Included & refreshed bi-weekly",
            captionWriting: "Included with Hook-Value-CTA structure",
            graphicDesign: "Full brand visual identity & carousels",
            videoEditing: "4K cinematic color-graded reels",
            monthlyReport: "Executive delivery and KPI growth report",
          },
          contentRequirements: {
            styleTone: brandVoiceTone || "Luxury, aesthetic, high-authority, polished",
            language: preferredLanguage || "English & Hinglish",
            references: "High-performing visual references and case studies",
            specialRequirements: currentChallenges ? `Focus: ${currentChallenges}` : "Festive campaigns & seasonal launches",
          },
          productInfo: productsServices || "Commercial brand and product service offerings",
          googleDriveLink: rawFootageDriveUrl || brandGuideUrl || "https://drive.google.com",
          accessPermissions: Array.isArray(accessChecklist) && accessChecklist.length > 0
            ? accessChecklist
            : [
                "Instagram (Professional Invite / Manager)",
                "Facebook Page & Meta Business Suite",
                "Google Drive (Assets Folder)",
              ],
          pointOfContact: {
            name: contactName.trim(),
            designation: designation ? designation.trim() : "Primary Contact",
            phone: phone ? phone.trim() : "",
            email: normalizedEmail,
          },
          preferredCommunication: ["WhatsApp Business Group", "Google Meet", "Email"],
          importantNotes: `Review SLA: 24-48 Hours. USP: ${usp || "N/A"}.`,
        },
        brief: {
          businessInfo: {
            name: (brandName || companyName).trim(),
            industry: "Commercial Brand & Digital Commerce",
            description: productsServices || "Brand operating in digital and consumer space",
          },
          productsServices: {
            mainOfferings: productsServices || "Signature brand products and consulting services",
            heroProducts: "Primary Brand Lineup",
          },
          businessGoals: Array.isArray(goals) && goals.length > 0 ? goals.join(", ") : "Grow brand authority and qualified inbound leads",
          targetAudience: {
            details: targetAudience || "High-intent consumers, professionals, and targeted buyers",
          },
          usp: usp || "Premium quality, fast turnarounds, and bespoke creative execution",
          competitors: competitors || "Industry peers and active market competitors",
          currentChallenges: currentChallenges || "Consistent creative delivery, scaling engagement and reach",
          importantLinks: {
            website: websiteUrl ? websiteUrl.trim() : "",
            instagram: instagramHandle ? instagramHandle.trim() : "",
            drive: rawFootageDriveUrl || brandGuideUrl || "https://drive.google.com",
          },
          contactDetails: {
            primaryName: contactName.trim(),
            designation: designation ? designation.trim() : "Primary Contact",
            phone: phone ? phone.trim() : "",
            email: normalizedEmail,
          },
        },
        brandVoice: {
          tone: brandVoiceTone || "Professional, bold, aesthetic, direct",
          preferredLanguage: preferredLanguage || "English & Hinglish",
          communicationStyle: "Hook-driven, value-first, polished and aesthetic",
        },
        scope: {
          clientInfo: {
            clientName: companyName.trim(),
            brandName: (brandName || companyName).trim(),
            startDate: new Date().toISOString().split("T")[0],
            duration: "Monthly Retainer",
            primaryContact: contactName.trim(),
            email: normalizedEmail,
            phone: phone ? phone.trim() : "",
          },
          scopeOfWork: "Strategic content production, video editing, social media distribution, and analytics.",
          servicesIncluded: [
            "Monthly content calendar formulation & ideation",
            "Video editing for short-form reels (4K color grade, motion graphics, sound sync)",
            "High-converting carousel and static graphic design",
            "Caption copywriting with SEO keywords and hashtags",
            "Monthly performance analytics and delivery review sync",
          ],
          servicesNotIncluded: [
            "In-person physical video shoots (unless separately contracted)",
            "Direct advertising budget spend (paid directly to Meta/Google)",
          ],
          monthlyDeliverables: [
            { type: "Reels / Short Videos", quantity: targetReels },
            { type: "High-Value Carousels", quantity: targetCarousels },
            { type: "Interactive Stories & Statics", quantity: targetStories },
          ],
          approvalTimeline: "24-48 Hours",
          revisionPolicy: "2 rounds included per deliverable",
        },
        delivery: {
          monthYear: "October 2026",
          subtitle: `${companyName.trim()} Delivery Plan • Live Production Tracking & Google Drive Assets`,
          kpis: {
            planned: totalPlanned,
            completed: 0,
            remaining: totalPlanned,
            onHold: 0,
            overdue: 0,
            inProgress: 2,
            published: 0,
            completionPct: 0,
            missingLinks: 1,
            unassigned: 0,
          },
          clientStatusList: [
            {
              id: newClient.id,
              clientCode: clientNumber.slice(-3).toUpperCase(),
              clientName: companyName.trim(),
              target: totalPlanned,
              done: 0,
              pending: totalPlanned,
              inProgress: 2,
              onHold: 0,
              overdue: 0,
              completionPct: 0,
              missingLinks: 1,
              unassigned: 0,
            },
          ],
          productionLog: [
            {
              id: "pl-1",
              date: "2026-10-20",
              deliverableTitle: `${(brandName || companyName).trim()} Hook & Brand Authority Reel #01`,
              deliverable: `${(brandName || companyName).trim()} Hook & Brand Authority Reel #01`,
              format: "Reel / Short Video",
              assignee: "Sumit Rathod (Lead Editor)",
              editor: "Sumit Rathod (Lead Editor)",
              driveLink: rawFootageDriveUrl || brandGuideUrl || "https://drive.google.com",
              finalLink: rawFootageDriveUrl || brandGuideUrl || "https://drive.google.com",
              status: "READY",
              reviewStatus: "Ready for Client Review",
              publishedStatus: "In Review",
              publishedDate: "2026-10-22",
            },
            {
              id: "pl-2",
              date: "2026-10-22",
              deliverableTitle: `${(brandName || companyName).trim()} Core Value & Services Carousel #01`,
              deliverable: `${(brandName || companyName).trim()} Core Value & Services Carousel #01`,
              format: "Carousel",
              assignee: "Aryan Visuals (Creative Lead)",
              editor: "Aryan Visuals (Creative Lead)",
              driveLink: rawFootageDriveUrl || brandGuideUrl || "https://drive.google.com",
              finalLink: rawFootageDriveUrl || brandGuideUrl || "https://drive.google.com",
              status: "IN_PROGRESS",
              reviewStatus: "In Client Review",
              publishedStatus: "In Production",
              publishedDate: "2026-10-24",
            },
            {
              id: "pl-3",
              date: "2026-10-25",
              deliverableTitle: `${(brandName || companyName).trim()} Problem vs Solution Reel #02`,
              deliverable: `${(brandName || companyName).trim()} Problem vs Solution Reel #02`,
              format: "Reel / Short Video",
              assignee: "Sumit Rathod (Lead Editor)",
              editor: "Sumit Rathod (Lead Editor)",
              driveLink: rawFootageDriveUrl || brandGuideUrl || "https://drive.google.com",
              finalLink: rawFootageDriveUrl || brandGuideUrl || "https://drive.google.com",
              status: "IN_PROGRESS",
              reviewStatus: "Drafting / In Production",
              publishedStatus: "In Production",
              publishedDate: "2026-10-27",
            },
            {
              id: "pl-4",
              date: "2026-10-27",
              deliverableTitle: `${(brandName || companyName).trim()} Client Transformation & Case Study Reel #03`,
              deliverable: `${(brandName || companyName).trim()} Client Transformation & Case Study Reel #03`,
              format: "Reel / Short Video",
              assignee: "MDZ Video Team",
              editor: "MDZ Video Team",
              driveLink: rawFootageDriveUrl || brandGuideUrl || "https://drive.google.com",
              finalLink: rawFootageDriveUrl || brandGuideUrl || "https://drive.google.com",
              status: "PLANNED",
              reviewStatus: "Scheduled",
              publishedStatus: "Scheduled",
              publishedDate: "2026-10-29",
            },
            {
              id: "pl-5",
              date: "2026-10-29",
              deliverableTitle: `${(brandName || companyName).trim()} High-Impact Visual Carousel #02`,
              deliverable: `${(brandName || companyName).trim()} High-Impact Visual Carousel #02`,
              format: "Carousel",
              assignee: "Aryan Visuals",
              editor: "Aryan Visuals",
              driveLink: rawFootageDriveUrl || brandGuideUrl || "https://drive.google.com",
              finalLink: rawFootageDriveUrl || brandGuideUrl || "https://drive.google.com",
              status: "PLANNED",
              reviewStatus: "Scheduled",
              publishedStatus: "Scheduled",
              publishedDate: "2026-10-31",
            },
          ],
          clientTargets: {
            reels: { target: targetReels, completed: 0, remaining: targetReels },
            carousels: { target: targetCarousels, completed: 0, remaining: targetCarousels },
            stories: { target: targetStories, completed: 0, remaining: targetStories },
          },
        },
        campaigns: [
          {
            id: `camp-${newClient.id}`,
            name: `${(brandName || companyName).trim()} Q4 Growth & Launch Campaign`,
            type: "Organic Social & Paid Growth",
            theme: brandVoiceTone || "Brand Authority, Cinematic Hooks & Market Positioning",
            duration: "October 2026 (Monthly Retainer)",
            startDate: new Date().toISOString().split("T")[0],
            endDate: "2026-10-31",
            objectives:
              Array.isArray(goals) && goals.length > 0
                ? goals
                : ["Brand Awareness", "Lead Generation", "Qualified Client Inquiries", "Follower Growth"],
            targetAudience: {
              ageGroup: "24 - 48 years",
              gender: "All",
              location: registeredAddress || "India / Global",
              interests: productsServices || "Business, Commercial Commerce, High-Value Offerings",
              painPoints: currentChallenges || "Consistent creative delivery, Scaling engagement",
              goals: "Establish authority and scale customer inquiries",
            },
            offerAndMessage: {
              offer: usp || "Exclusive Premier Retainer Partnership",
              keyMessage: "High-impact visual presence and continuous creative execution",
              usp: usp || "Premium aesthetic, 48-hour turnarounds, dedicated creative team",
              cta: "Schedule Consultation / Review Deliverables",
            },
            platforms: ["Instagram", "Facebook", "LinkedIn", "YouTube"],
            contentRequired: {
              reelsQty: targetReels,
              carouselsQty: targetCarousels,
              storiesQty: targetStories,
              staticQty: 5,
              bannersQty: 2,
              adCreativesQty: 4,
              otherQty: 0,
            },
            creativeCopy: {
              visualRequirements: "Cinematic grade, modern typography, high contrast, brand colors",
              copyRequirements: "Hook-first, value-driven captions with relevant hashtags",
            },
            launchPlan: {
              preLaunch: [
                "Audit existing assets and brand tone",
                "Define content calendar & hooks pipeline",
                "Setup Google Drive cloud asset workflow",
              ],
              launch: [
                "Publish hero brand reel across channels",
                "Launch carousel deep-dive and authority breakdown",
                "Activate interactive story polls and client engagement",
              ],
            },
            contentSchedule: [
              { id: 1, date: "2026-10-20", contentType: "Reel", platform: "Instagram", topicCaption: "Hook: Why Most Brands Struggle with Consistency", status: "Ready" },
              { id: 2, date: "2026-10-22", contentType: "Carousel", platform: "Instagram / LinkedIn", topicCaption: "5 Core Frameworks to Scale Growth in 2026", status: "In Progress" },
              { id: 3, date: "2026-10-25", contentType: "Reel", platform: "Instagram / YouTube", topicCaption: "Behind The Scenes: Crafting Bespoke Quality", status: "In Progress" },
              { id: 4, date: "2026-10-27", contentType: "Reel", platform: "Instagram", topicCaption: "Customer Transformation & Case Study Review", status: "Scheduled" },
              { id: 5, date: "2026-10-29", contentType: "Carousel", platform: "Instagram", topicCaption: "The Blueprint for Authority & Inbound Leads", status: "Scheduled" },
            ],
            teamResponsibilities: [
              { id: 1, name: "Sumit Rathod", role: "Video Editor", responsibilities: "Reel cuts, color grade, motion graphics", deadline: "2026-10-22" },
              { id: 2, name: "Aryan Visuals", role: "Graphic Designer", responsibilities: "Carousel graphics, slide layouts", deadline: "2026-10-24" },
            ],
          },
        ],
      }, normalizedEmail);
    } catch (e) {
      console.error("Store pre-seed error:", e);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Client account registered successfully. Please sign in.",
        client: {
          id: newClient.id,
          companyName: newClient.companyName,
          gstNumber: newClient.gstNumber,
        },
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.activeRole,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Client registration error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
