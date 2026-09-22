import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getEmployeeSpecificTerms, getPublishedTerms } from "@/lib/termsEngine";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const terms = await getEmployeeSpecificTerms(authRes.id);
    const now = new Date();
    const version = terms.version || "v1.0";

    // Update User terms acceptance state
    await prisma.user.update({
      where: { id: authRes.id },
      data: {
        termsAcceptedVersion: version,
        termsAcceptedAt: now,
      },
    });

    // Update Employee specific acceptance state
    const emp = await prisma.employee.findFirst({
      where: { userId: authRes.id },
    });
    if (emp) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: {
          termsAccepted: true,
          termsAcceptedAt: now,
          termsVersion: version,
        },
      });
    }

    // Create immutable audit log entry
    await prisma.termsAcceptanceLog.create({
      data: {
        termsId: terms.id.startsWith("custom-") ? null : terms.id,
        userId: authRes.id,
        targetAudience: "EMPLOYEE",
        termsVersion: version,
        acceptedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Employee terms accepted successfully",
      termsAcceptedVersion: version,
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
