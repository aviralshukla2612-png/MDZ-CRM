import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Basic Indian GSTIN Regex: 2 digits, 5 letters, 4 digits, 1 letter, 1 Z/digit, 1 checksum letter/digit
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, contactName, email, password, phone, gstNumber, termsAccepted } = body;

    if (!companyName || typeof companyName !== "string" || !companyName.trim()) {
      return NextResponse.json(
        { success: false, error: "Company name is required." },
        { status: 400 }
      );
    }

    if (!contactName || typeof contactName !== "string" || !contactName.trim()) {
      return NextResponse.json(
        { success: false, error: "Contact person name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { success: false, error: "You must accept the Terms and Conditions of Service to register." },
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
