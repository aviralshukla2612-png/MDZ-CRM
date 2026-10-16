import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Basic Indian GSTIN Regex: 2 digits, 5 letters, 4 digits, 1 letter, 1 Z/digit, 1 checksum letter/digit
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, contactName, email, password, phone, gstNumber, termsAccepted } = body;

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

    // 2. Automatically create initial Project so client has active deliverables & dashboard metrics
    const projectCount = await prisma.project.count();
    const projectNumber = `PRJ-2026-${String(projectCount + 1).padStart(3, "0")}-${Math.floor(100 + Math.random() * 900)}`;

    const initialProject = await prisma.project.create({
      data: {
        projectNumber,
        name: "Brand Growth & Digital Marketing Retainer",
        clientId: newClient.id,
        contractValue: 150000,
        status: "IN_PROGRESS",
        priority: "HIGH",
        progressPercentage: 50,
        targetDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdById: creatorId,
        stages: {
          create: [
            { name: "01_Onboarding_&_Brand_Audit", orderIndex: 1, weight: 20, progressPercentage: 100, status: "COMPLETED" },
            { name: "02_Creative_Production_&_Reels", orderIndex: 2, weight: 30, progressPercentage: 70, status: "IN_PROGRESS" },
            { name: "03_Performance_Ads_Launch", orderIndex: 3, weight: 30, progressPercentage: 30, status: "IN_PROGRESS" },
            { name: "04_Revenue_Scale_&_Optimization", orderIndex: 4, weight: 20, progressPercentage: 0, status: "PENDING" },
          ],
        },
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

    // 4. Create initial Invoices and Milestones
    const paidAmount = 90000;
    const pendingAmount = 60000;
    const inv1Num = `INV-2026-${Date.now().toString().slice(-4)}1`;
    const inv2Num = `INV-2026-${Date.now().toString().slice(-4)}2`;

    await prisma.invoice.create({
      data: {
        invoiceNumber: inv1Num,
        projectId: initialProject.id,
        clientId: newClient.id,
        issueDate: new Date(),
        dueDate: new Date(),
        totalAmount: paidAmount,
        taxAmount: Math.round(paidAmount * 0.18),
        grandTotal: paidAmount,
        status: "PAID",
        itemsJson: JSON.stringify([{ description: "Advance Retainer & Onboarding Setup", amount: paidAmount }]),
      },
    }).catch(() => null);

    await prisma.invoice.create({
      data: {
        invoiceNumber: inv2Num,
        projectId: initialProject.id,
        clientId: newClient.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        totalAmount: pendingAmount,
        taxAmount: Math.round(pendingAmount * 0.18),
        grandTotal: pendingAmount,
        status: "UNPAID",
        itemsJson: JSON.stringify([{ description: "Mid-Term Milestone: Ads Scaling & Production", amount: pendingAmount }]),
      },
    }).catch(() => null);

    await prisma.paymentMilestone.create({
      data: {
        projectId: initialProject.id,
        title: "Milestone 1: Retainer Setup & Onboarding",
        amount: paidAmount,
        dueDate: new Date(),
        status: "PAID",
        paidAmount: paidAmount,
        paidAt: new Date(),
        invoiceNumber: inv1Num,
      },
    }).catch(() => null);

    await prisma.paymentMilestone.create({
      data: {
        projectId: initialProject.id,
        title: "Milestone 2: Execution & Ads Scaling",
        amount: pendingAmount,
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        status: "UPCOMING",
        paidAmount: 0,
        invoiceNumber: inv2Num,
      },
    }).catch(() => null);

    // 5. Assign to a team member (Employee C / Sales rep) for workload visibility
    const nonOwnerEmployee = await prisma.employee.findFirst({
      where: { user: { activeRole: { not: "OWNER" } } },
    });
    if (nonOwnerEmployee) {
      await prisma.projectMembership.create({
        data: {
          projectId: initialProject.id,
          employeeId: nonOwnerEmployee.id,
          roleInProject: "DEV_LEAD",
          isActive: true,
          assignedById: newClient.createdById,
        },
      }).catch(() => null);
    }

    // 6. Pre-seed persistent JSON store with client's actual company name
    try {
      const { getClientPortalData } = await import("@/lib/clientPortalStore");
      getClientPortalData(newClient.id, newClient.companyName);
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
