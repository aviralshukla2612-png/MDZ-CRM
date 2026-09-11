import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getClientAccountForUser } from "@/lib/client-auth";
import { getPublishedTerms } from "@/lib/termsEngine";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const clientCtx = await getClientAccountForUser(userOrRes.email);
  if (!clientCtx || !clientCtx.contact) {
    return NextResponse.json(
      { success: false, error: "No client contact record associated with this account." },
      { status: 404 }
    );
  }

  const currentTerms = await getPublishedTerms("CLIENT");
  const now = new Date();

  // Update ClientContact terms state
  const updatedContact = await prisma.clientContact.update({
    where: { id: clientCtx.contact.id },
    data: {
      termsAccepted: true,
      termsAcceptedAt: now,
      termsVersion: currentTerms.version,
    },
  });

  // Create immutable audit log entry
  await prisma.termsAcceptanceLog.create({
    data: {
      termsId: currentTerms.id,
      clientContactId: clientCtx.contact.id,
      targetAudience: "CLIENT",
      termsVersion: currentTerms.version,
      acceptedAt: now,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Terms and conditions accepted successfully.",
    contact: {
      id: updatedContact.id,
      termsAccepted: updatedContact.termsAccepted,
      termsAcceptedAt: updatedContact.termsAcceptedAt,
      termsVersion: updatedContact.termsVersion,
    },
  });
}
