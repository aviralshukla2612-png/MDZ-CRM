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

    // 2. Automatically create initial Project container so client has a clean workspace
    const projectCount = await prisma.project.count();
    const projectNumber = `PRJ-2026-${String(projectCount + 1).padStart(3, "0")}-${Math.floor(100 + Math.random() * 900)}`;

    const initialProject = await prisma.project.create({
      data: {
        projectNumber,
        name: `${companyName.trim()} Brand Production & Operations`,
        clientId: newClient.id,
        contractValue: 0,
        status: "PLANNING",
        priority: "MEDIUM",
        progressPercentage: 0,
        targetDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdById: creatorId,
      },
    });

    // 3. Create active ClientPortalToken
    await prisma.clientPortalToken.create({
      data: {
        clientId: newClient.id,
        projectId: initialProject.id,
        token: newClient.id,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    }).catch(() => null);

    // 6. Pre-seed persistent JSON store with client's actual details
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
          serviceAgreement: {
            packageTier: "Enterprise Growth Retainer",
            monthlyFee: "₹1,50,000",
            reelsQuota: targetReels,
            carouselsQuota: targetCarousels,
            storiesQuota: targetStories,
            slaApprovalWindow: "24-48 Hours",
            status: "ACTIVE",
          },
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
            inProgress: 0,
            published: 0,
            completionPct: 0,
            missingLinks: 0,
            unassigned: totalPlanned,
          },
          clientStatusList: [
            {
              id: newClient.id,
              clientCode: clientNumber.slice(-3).toUpperCase(),
              clientName: companyName.trim(),
              target: totalPlanned,
              done: 0,
              pending: totalPlanned,
              inProgress: 0,
              onHold: 0,
              overdue: 0,
              completionPct: 0,
              missingLinks: 0,
              unassigned: totalPlanned,
            },
          ],
          productionLog: [],
          clientTargets: {
            reels: { target: targetReels, completed: 0, remaining: targetReels },
            carousels: { target: targetCarousels, completed: 0, remaining: targetCarousels },
            stories: { target: targetStories, completed: 0, remaining: targetStories },
          },
        },
      }, normalizedEmail);

      // Also register in delivery master store
      const { getDeliveryMasterData, saveDeliveryMasterData } = await import("@/lib/deliveryMasterStore");
      const master = getDeliveryMasterData();
      const code = (companyName.trim().slice(0, 3)).toUpperCase();
      const newStatusRow = {
        id: newClient.id,
        clientCode: code,
        clientName: companyName.trim(),
        target: totalPlanned,
        done: 0,
        pending: totalPlanned,
        inProgress: 0,
        onHold: 0,
        overdue: 0,
        completionPct: 0,
        missingLinks: 0,
        unassigned: totalPlanned,
      };
      saveDeliveryMasterData({
        clientStatusList: [...master.clientStatusList.filter((c: any) => c.id !== newClient.id), newStatusRow],
      });
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
