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
      brandVoiceGuide,
      campaignPlanner,
      scopeDocument,
      onboardingForm,
      competitorAnalysis,
      contentPillars,
      meetingNotes,
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
            clientName: (onboardingForm?.clientName || companyName).trim(),
            brandName: (onboardingForm?.businessBrandName || brandName || companyName).trim(),
            contactNumber: onboardingForm?.contactNumber || (phone ? phone.trim() : ""),
            email: onboardingForm?.emailAddress || normalizedEmail,
            website: onboardingForm?.website || (websiteUrl ? websiteUrl.trim() : ""),
            businessLocation: onboardingForm?.businessLocation || (registeredAddress ? registeredAddress.trim() : "India"),
          },
          businessInfo: {
            legalName: (onboardingForm?.clientName || companyName).trim(),
            brandName: (onboardingForm?.businessBrandName || brandName || companyName).trim(),
            gstin: gstNumber ? gstNumber.trim().toUpperCase() : "",
            websiteUrl: onboardingForm?.website || (websiteUrl ? websiteUrl.trim() : ""),
            registeredAddress: onboardingForm?.businessLocation || (registeredAddress ? registeredAddress.trim() : ""),
          },
          primaryContact: {
            fullName: (onboardingForm?.pocName || contactName).trim(),
            role: onboardingForm?.pocDesignation || (designation ? designation.trim() : "Primary Contact"),
            phone: onboardingForm?.pocContactNumber || (phone ? phone.trim() : ""),
            whatsapp: whatsapp ? whatsapp.trim() : (phone ? phone.trim() : ""),
            email: onboardingForm?.pocEmailAddress || normalizedEmail,
          },
          brandAssets: {
            brandGuideUrl: brandGuideUrl ? brandGuideUrl.trim() : "",
            logoDriveUrl: onboardingForm?.brandAssets?.logo?.linkOrLocation || (brandGuideUrl ? brandGuideUrl.trim() : ""),
            rawFootageDriveUrl: onboardingForm?.googleDriveFolderLink || (rawFootageDriveUrl ? rawFootageDriveUrl.trim() : ""),
            fontFamilies: "Outfit, Inter, Sans-Serif",
            primaryColorHex: primaryColorHex || "#059669",
            brandAssetsAvailable: onboardingForm?.brandAssets || null,
          },
          socialHandles: {
            instagram: onboardingForm?.instagramHandle || (instagramHandle ? instagramHandle.trim() : ""),
            youtube: onboardingForm?.youtubeHandle || (youtubeHandle ? youtubeHandle.trim() : ""),
            facebook: onboardingForm?.facebookHandle || (facebookUrl ? facebookUrl.trim() : ""),
            linkedin: onboardingForm?.linkedinHandle || (linkedinUrl ? linkedinUrl.trim() : ""),
            tiktok: onboardingForm?.tiktokHandle || "",
            pinterest: onboardingForm?.pinterestHandle || "",
            other: onboardingForm?.otherSocialHandle || "",
          },
          servicesRequired: Array.isArray(onboardingForm?.servicesRequired) && onboardingForm.servicesRequired.length > 0
            ? onboardingForm.servicesRequired
            : (Array.isArray(goals) && goals.length > 0 ? goals : [
                "Social Media Management",
                "Content Creation",
                "Reels / Video Editing",
                "Graphic Design",
              ]),
          packageSelected: {
            name: onboardingForm?.packageName || "Enterprise Digital Growth Retainer",
            startDate: onboardingForm?.startDate || new Date().toISOString().split("T")[0],
            endDate: onboardingForm?.endDate || "",
            duration: onboardingForm?.contractDuration || "Monthly Retainer",
          },
          deliverables: {
            postsPerWeek: onboardingForm?.postsPerWeek ? `${onboardingForm.postsPerWeek} Posts per Week` : `${Math.round(targetCarousels / 4) || 2} Posts per Week`,
            reelsPerWeek: onboardingForm?.reelsPerWeek ? `${onboardingForm.reelsPerWeek} Reels per Week` : `${Math.round(targetReels / 4) || 4} Reels per Week`,
            storiesPerWeek: onboardingForm?.storiesPerWeek ? `${onboardingForm.storiesPerWeek} Stories per Week` : `${Math.round(targetStories / 4) || 3} Stories per Week`,
            contentCalendar: onboardingForm?.deliverablesChecklist?.includes("Content Calendar") ? "Included (1st of every month)" : "Provided on 1st of every month",
            hashtagResearch: onboardingForm?.deliverablesChecklist?.includes("Hashtag Research") ? "Included & refreshed bi-weekly" : "Included",
            captionWriting: onboardingForm?.deliverablesChecklist?.includes("Caption Writing") ? "Included with Hook-Value-CTA" : "Included",
            graphicDesign: onboardingForm?.deliverablesChecklist?.includes("Graphic Design") ? "Included" : "Full brand visual identity & carousels",
            videoEditing: onboardingForm?.deliverablesChecklist?.includes("Video Editing") ? "Included" : "4K cinematic color-graded reels",
            monthlyReport: onboardingForm?.deliverablesChecklist?.includes("Monthly Report") ? "Included" : "Executive delivery and KPI growth report",
            otherDeliverables: onboardingForm?.deliverablesChecklistOther || "",
          },
          contentRequirements: {
            styleTone: onboardingForm?.contentStyleTone || brandVoiceTone || "Luxury, aesthetic, high-authority, polished",
            language: onboardingForm?.preferredLanguage || preferredLanguage || "English & Hinglish",
            references: onboardingForm?.contentReferences || "High-performing visual references and case studies",
            specialRequirements: onboardingForm?.specialRequirements || (currentChallenges ? `Focus: ${currentChallenges}` : "Festive campaigns & seasonal launches"),
          },
          productInfo: onboardingForm?.productServiceInfo || productsServices || "Commercial brand and product service offerings",
          googleDriveLink: onboardingForm?.googleDriveFolderLink || rawFootageDriveUrl || brandGuideUrl || "https://drive.google.com",
          accessPermissions: Array.isArray(onboardingForm?.accountAccess) && onboardingForm.accountAccess.length > 0
            ? onboardingForm.accountAccess
            : (Array.isArray(accessChecklist) && accessChecklist.length > 0
                ? accessChecklist
                : [
                    "Instagram (Professional Invite / Manager)",
                    "Facebook Page & Meta Business Suite",
                    "Google Drive (Assets Folder)",
                  ]),
          pointOfContact: {
            name: (onboardingForm?.pocName || contactName).trim(),
            designation: onboardingForm?.pocDesignation || (designation ? designation.trim() : "Primary Contact"),
            phone: onboardingForm?.pocContactNumber || (phone ? phone.trim() : ""),
            email: onboardingForm?.pocEmailAddress || normalizedEmail,
          },
          preferredCommunication: Array.isArray(onboardingForm?.communicationMethods) && onboardingForm.communicationMethods.length > 0
            ? onboardingForm.communicationMethods
            : ["WhatsApp Business Group", "Google Meet", "Email"],
          importantNotes: onboardingForm?.importantClientNotes || `Review SLA: 24-48 Hours. USP: ${usp || "N/A"}.`,
          rawOnboardingForm: onboardingForm || null,
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
          competitors:
            competitors ||
            (competitorAnalysis
              ? [
                  competitorAnalysis.competitor1?.name,
                  competitorAnalysis.competitor2?.name,
                  competitorAnalysis.competitor3?.name,
                ]
                  .filter(Boolean)
                  .join(", ")
              : "Industry peers and active market competitors"),
          competitorAnalysis: competitorAnalysis || null,
          contentPillars: contentPillars || null,
          meetingNotes: meetingNotes || null,
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
          brandVoiceGuide: brandVoiceGuide || null,
        },
        brandVoice: {
          personality:
            (brandVoiceGuide?.personalityTraits?.length > 0
              ? brandVoiceGuide.personalityTraits.join(", ")
              : brandVoiceGuide?.brandPersonality?.length > 0
              ? brandVoiceGuide.brandPersonality.join(", ")
              : "Authoritative, Direct, High-Stakes, Data-Backed, Relentlessly Practical"),
          tone:
            brandVoiceTone ||
            (brandVoiceGuide?.toneTypes?.length > 0
              ? brandVoiceGuide.toneTypes.join(", ")
              : brandVoiceGuide?.tone?.length > 0
              ? brandVoiceGuide.tone.join(", ")
              : "Professional, bold, aesthetic, direct"),
          dialectRule:
            preferredLanguage ||
            (brandVoiceGuide?.preferredLanguages?.length > 0
              ? brandVoiceGuide.preferredLanguages.join(", ")
              : "English & Hinglish"),
          alwaysUseWords: brandVoiceGuide?.wordsToUse
            ? brandVoiceGuide.wordsToUse
                .split("\n")
                .map((w: string) => w.trim())
                .filter(Boolean)
            : ["Execution", "Precision", "ROI", "Compounding", "Scalable", "Playbook", "Leverage"],
          neverUseWords: brandVoiceGuide?.wordsToAvoid
            ? brandVoiceGuide.wordsToAvoid
                .split("\n")
                .map((w: string) => w.trim())
                .filter(Boolean)
            : ["Guru", "Hustle 24/7", "Cheap", "Guaranteed overnight riches", "Synergy", "Hack"],
          communicationStyle:
            (brandVoiceGuide?.commStyles?.length > 0
              ? brandVoiceGuide.commStyles.join(", ")
              : brandVoiceGuide?.communicationStyle?.length > 0
              ? brandVoiceGuide.communicationStyle.join(", ")
              : "Hook-driven, value-first, polished and aesthetic"),
          guide: brandVoiceGuide || null,
        },
        scope: {
          clientInfo: {
            clientName: companyName.trim(),
            brandName: (brandName || companyName).trim(),
            startDate: scopeDocument?.projectStartDate || new Date().toISOString().split("T")[0],
            duration: scopeDocument?.projectDuration || "Monthly Retainer",
            primaryContact: contactName.trim(),
            email: normalizedEmail,
            phone: phone ? phone.trim() : "",
          },
          scopeOfWork:
            scopeDocument?.scopeOfWork ||
            "Strategic content production, video editing, social media distribution, and analytics.",
          servicesIncluded:
            scopeDocument?.servicesIncluded?.length > 0
              ? scopeDocument.servicesIncluded
              : [
                  "Monthly content calendar formulation & ideation",
                  "Video editing for short-form reels (4K color grade, motion graphics, sound sync)",
                  "High-converting carousel and static graphic design",
                  "Caption copywriting with SEO keywords and hashtags",
                  "Monthly performance analytics and delivery review sync",
                ],
          servicesNotIncluded:
            scopeDocument?.servicesNotIncluded?.length > 0
              ? scopeDocument.servicesNotIncluded
              : [
                  "In-person physical video shoots (unless separately contracted)",
                  "Direct advertising budget spend (paid directly to Meta/Google)",
                  "Backend website core development",
                ],
          monthlyDeliverables: [
            { type: "Reels / Short Videos", quantity: scopeDocument?.deliverablesReels ?? targetReels },
            { type: "High-Value Carousels", quantity: scopeDocument?.deliverablesCarousels ?? targetCarousels },
            { type: "Interactive Stories & Statics", quantity: scopeDocument?.deliverablesStories ?? targetStories },
            ...(scopeDocument?.deliverablesStatics
              ? [{ type: "Static Graphics", quantity: scopeDocument.deliverablesStatics }]
              : []),
          ],
          approvalTimeline: scopeDocument?.reviewTimeline || "24-48 Hours",
          revisionPolicy: scopeDocument?.revisionsIncluded || "2 rounds included per deliverable",
          postingResponsibility: scopeDocument?.postingResponsibility || "we_post",
          postingDetails: scopeDocument?.postingDetails || "",
          clientResponsibilities:
            scopeDocument?.clientResponsibilities?.length > 0
              ? scopeDocument.clientResponsibilities
              : [
                  "Provide timely content, assets and information",
                  "Review and approve content within 48 hours",
                  "Share product/service updates",
                  "Provide access to required accounts",
                ],
          contentSubmission: {
            format: scopeDocument?.submissionFormat || "Google Drive Assets Folder",
            frequency: scopeDocument?.submissionFrequency || "Weekly / Monthly Cycle",
            deadline: scopeDocument?.submissionDeadline || "Every Monday",
          },
          paymentTerms: scopeDocument?.paymentTerms || "monthly",
          additionalWorkCharges: {
            rate: scopeDocument?.hourlyRateOrTask || "₹2,500/hr",
            examples: scopeDocument?.additionalWorkExamples || "Extra reels, ad creatives",
          },
          adSpendResponsibility: scopeDocument?.adSpendResponsibility || "we_manage_client_pays",
          communicationChannels:
            scopeDocument?.communicationChannels?.length > 0
              ? scopeDocument.communicationChannels
              : ["WhatsApp", "Email"],
          responseSla: scopeDocument?.expectedResponseTime || "Within 24 Hours",
          workingHours: scopeDocument?.workingHours || "Mon-Fri, 10 AM - 6:30 PM",
          deadlines: {
            calendarShareDate: scopeDocument?.monthlyCalendarShareDate || "1st of every month",
            contentSubmission: scopeDocument?.contentSubmissionDeadline || "3 days prior",
            finalApproval: scopeDocument?.finalApprovalDeadline || "24 hours prior",
          },
          cancellationPolicy: {
            noticePeriod: scopeDocument?.noticePeriod || "30 days written notice",
            refundPolicy: scopeDocument?.refundPolicy || "No refund for active month",
            pauseOption: scopeDocument?.pauseOption || "14 days prior notice",
          },
          contentOwnership: scopeDocument?.ownershipOption || "transferred_after_payment",
          rawFilePolicy: scopeDocument?.rawFileOption || "available_on_request",
          disclaimerAcknowledged: scopeDocument?.disclaimerAcknowledged ?? true,
          documentData: scopeDocument || null,
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
            name:
              campaignPlanner?.campaignName?.trim() ||
              `${(brandName || companyName).trim()} Q4 Growth & Launch Campaign`,
            type: campaignPlanner?.campaignType || "Organic Social & Paid Growth",
            theme:
              campaignPlanner?.campaignTheme ||
              brandVoiceTone ||
              "Brand Authority, Cinematic Hooks & Market Positioning",
            duration: campaignPlanner?.campaignDuration || "October 2026 (Monthly Retainer)",
            startDate: campaignPlanner?.startDate || new Date().toISOString().split("T")[0],
            endDate: campaignPlanner?.endDate || "2026-11-30",
            objectives:
              campaignPlanner?.objectives?.length > 0
                ? campaignPlanner.objectives
                : Array.isArray(goals) && goals.length > 0
                ? goals
                : ["Brand Awareness", "Lead Generation", "Qualified Client Inquiries", "Follower Growth"],
            targetAudience: {
              ageGroup: campaignPlanner?.audienceAgeGroup || "24 - 48 years",
              gender: campaignPlanner?.audienceGender || "All",
              location: campaignPlanner?.audienceLocation || registeredAddress || "India / Global",
              interests:
                campaignPlanner?.audienceInterests ||
                productsServices ||
                "Business, Commercial Commerce, High-Value Offerings",
              painPoints:
                campaignPlanner?.audiencePainPoints ||
                currentChallenges ||
                "Consistent creative delivery, Scaling engagement",
              goals: campaignPlanner?.audienceGoals || "Establish authority and scale customer inquiries",
            },
            offerAndMessage: {
              offer: campaignPlanner?.campaignOffer || usp || "Exclusive Premier Retainer Partnership",
              keyMessage:
                campaignPlanner?.keyMessage ||
                "High-impact visual presence and continuous creative execution",
              usp: campaignPlanner?.usp || usp || "Premium aesthetic, 48-hour turnarounds, dedicated creative team",
              cta: campaignPlanner?.campaignCta || "Schedule Consultation / Review Deliverables",
            },
            platforms:
              campaignPlanner?.platforms?.length > 0
                ? campaignPlanner.platforms
                : ["Instagram", "Facebook", "LinkedIn", "YouTube"],
            contentFormats: campaignPlanner?.contentFormats || ["Reels / Short Videos", "Carousels", "Stories"],
            contentRequired: {
              reelsQty: campaignPlanner?.reelsQty ?? targetReels,
              carouselsQty: campaignPlanner?.carouselsQty ?? targetCarousels,
              storiesQty: campaignPlanner?.storiesQty ?? targetStories,
              staticQty: campaignPlanner?.staticPostsQty ?? 5,
              bannersQty: campaignPlanner?.bannersQty ?? 2,
              adCreativesQty: campaignPlanner?.adCreativesQty ?? 4,
              otherQty: campaignPlanner?.otherContentQty ?? 0,
            },
            creativeCopy: {
              visualRequirements:
                campaignPlanner?.creativeRequirements ||
                "Cinematic grade, modern typography, high contrast, brand colors",
              copyRequirements:
                campaignPlanner?.copyRequirements ||
                "Hook-first, value-driven captions with relevant hashtags",
            },
            campaignHashtag: campaignPlanner?.campaignHashtag || "#ScaleWithMillionaire",
            additionalHashtags: campaignPlanner?.additionalHashtags || "#BrandGrowth #DirectResponse",
            influencerRequirements: campaignPlanner?.influencerRequirements || "",
            paidAds: {
              runPaidAds: campaignPlanner?.runPaidAds ?? true,
              platforms: campaignPlanner?.adPlatforms || ["Meta Ads (Instagram/Facebook)"],
              objectives: campaignPlanner?.adObjectives || "Lead Generation",
              budget: campaignPlanner?.budget || "25000",
              creativeRequirements: campaignPlanner?.adCreativeRequirements || "",
            },
            launchPlan: {
              preLaunch:
                campaignPlanner?.preLaunchActivities?.length > 0
                  ? campaignPlanner.preLaunchActivities
                  : [
                      "Audit existing assets and brand tone",
                      "Define content calendar & hooks pipeline",
                      "Setup Google Drive cloud asset workflow",
                    ],
              launch:
                campaignPlanner?.launchActivities?.length > 0
                  ? campaignPlanner.launchActivities
                  : [
                      "Publish hero brand reel across channels",
                      "Launch carousel deep-dive and authority breakdown",
                      "Activate interactive story polls and client engagement",
                    ],
            },
            contentSchedule:
              campaignPlanner?.contentSchedule?.length > 0
                ? campaignPlanner.contentSchedule
                : [
                    { id: 1, date: "2026-10-20", contentType: "Reel", platform: "Instagram", topicCaption: "Hook: Why Most Brands Struggle with Consistency", status: "Ready" },
                    { id: 2, date: "2026-10-22", contentType: "Carousel", platform: "Instagram / LinkedIn", topicCaption: "5 Core Frameworks to Scale Growth in 2026", status: "In Progress" },
                    { id: 3, date: "2026-10-25", contentType: "Reel", platform: "Instagram / YouTube", topicCaption: "Behind The Scenes: Crafting Bespoke Quality", status: "In Progress" },
                    { id: 4, date: "2026-10-27", contentType: "Reel", platform: "Instagram", topicCaption: "Customer Transformation & Case Study Review", status: "Scheduled" },
                    { id: 5, date: "2026-10-29", contentType: "Carousel", platform: "Instagram", topicCaption: "The Blueprint for Authority & Inbound Leads", status: "Scheduled" },
                  ],
            teamResponsibilities:
              campaignPlanner?.teamResponsibilities?.length > 0
                ? campaignPlanner.teamResponsibilities
                : [
                    { id: 1, name: "Sumit Rathod", role: "Video Editor", responsibilities: "Reel cuts, color grade, motion graphics", deadline: "2026-10-22" },
                    { id: 2, name: "Aryan Visuals", role: "Graphic Designer", responsibilities: "Carousel graphics, slide layouts", deadline: "2026-10-24" },
                  ],
            approvalDeadlines: campaignPlanner?.approvalDeadlines || [],
            campaignStatus: campaignPlanner?.currentStatus || "Planning",
            stages: campaignPlanner?.stages || ["Planning", "Content Creation"],
            performanceMetrics: campaignPlanner?.targetMetrics || {},
            actualResults: campaignPlanner?.actualResults || {},
            learnings: {
              workedWell: campaignPlanner?.learningsWorkedWell || "",
              didntWork: campaignPlanner?.learningsDidntWork || "",
              keyLearnings: campaignPlanner?.keyLearnings || "",
            },
            nextSteps: {
              actionsForFuture: campaignPlanner?.actionsForFuture || "",
              recommendations: campaignPlanner?.recommendations || "",
              ideasToExplore: campaignPlanner?.ideasToExplore || "",
            },
            plannerData: campaignPlanner || null,
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
