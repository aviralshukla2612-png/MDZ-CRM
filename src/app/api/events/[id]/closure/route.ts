import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const closure = await prisma.eventClosure.findUnique({
      where: { eventId: params.id },
    });

    return NextResponse.json({ success: true, data: closure });
  } catch (error: any) {
    console.error("Fetch Event Closure Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch event closure" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      equipmentReconciled = false,
      vendorPaymentsClosed = false,
      budgetReconciled = false,
      clientFeedback = "",
      clientRating = 5,
      lessonsLearned = "",
      performanceReportSummary = "",
      eventArchiveUrl = "",
      finalSignOffBy = "",
      isFinalSignOff = false,
    } = body;

    const closure = await prisma.eventClosure.upsert({
      where: { eventId: params.id },
      create: {
        eventId: params.id,
        equipmentReconciled: Boolean(equipmentReconciled),
        vendorPaymentsClosed: Boolean(vendorPaymentsClosed),
        budgetReconciled: Boolean(budgetReconciled),
        clientFeedback,
        clientRating: Number(clientRating) || 5,
        lessonsLearned,
        performanceReportSummary,
        eventArchiveUrl,
        finalSignOffBy,
        finalSignOffDate: isFinalSignOff ? new Date() : null,
      },
      update: {
        equipmentReconciled: Boolean(equipmentReconciled),
        vendorPaymentsClosed: Boolean(vendorPaymentsClosed),
        budgetReconciled: Boolean(budgetReconciled),
        clientFeedback,
        clientRating: Number(clientRating) || 5,
        lessonsLearned,
        performanceReportSummary,
        eventArchiveUrl,
        finalSignOffBy,
        ...(isFinalSignOff ? { finalSignOffDate: new Date() } : {}),
      },
    });

    if (isFinalSignOff) {
      await prisma.eventProject.update({
        where: { id: params.id },
        data: {
          closureSignOff: true,
          status: "COMPLETED",
        },
      });
    }

    return NextResponse.json({ success: true, data: closure });
  } catch (error: any) {
    console.error("Save Event Closure Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save closure" }, { status: 500 });
  }
}
