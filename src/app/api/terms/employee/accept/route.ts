import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPublishedTerms } from "@/lib/termsEngine";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const currentTerms = await getPublishedTerms("EMPLOYEE");
    const now = new Date();

    // Update User terms acceptance state
    await prisma.user.update({
      where: { id: authRes.id },
      data: {
        termsAcceptedVersion: currentTerms.version,
        termsAcceptedAt: now,
      },
    });

    // Create immutable audit log entry
    await prisma.termsAcceptanceLog.create({
      data: {
        termsId: currentTerms.id,
        userId: authRes.id,
        targetAudience: "EMPLOYEE",
        termsVersion: currentTerms.version,
        acceptedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Employee terms accepted successfully",
      termsAcceptedVersion: currentTerms.version,
      termsAcceptedAt: now,
    });
  } catch (error) {
    console.error("POST /api/terms/employee/accept error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process terms acceptance" },
      { status: 500 }
    );
  }
}
