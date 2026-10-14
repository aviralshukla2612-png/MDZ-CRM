import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const vendors = await prisma.eventVendor.findMany({
      where: { eventId: params.id },
      orderBy: [{ category: "asc" }, { vendorName: "asc" }],
    });

    return NextResponse.json({ success: true, data: vendors });
  } catch (error: any) {
    console.error("Fetch Vendors Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch event vendors" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      vendorName,
      category = "DECOR",
      contactPerson = "",
      phone = "",
      email = "",
      quoteAmount = 0,
      approvedAmount = 0,
      advancePaid = 0,
      balanceDue = 0,
      paymentMilestones = "",
      deliverablesTracked = "",
      contractUrl = "",
      escalationContact = "",
      arrivalStatus = "EXPECTED",
    } = body;

    if (!vendorName) {
      return NextResponse.json({ success: false, error: "Vendor name is required" }, { status: 400 });
    }

    const calculatedBalance =
      balanceDue !== undefined && balanceDue !== null
        ? Number(balanceDue)
        : Math.max(0, (Number(approvedAmount) || Number(quoteAmount) || 0) - (Number(advancePaid) || 0));

    const vendor = await prisma.eventVendor.create({
      data: {
        eventId: params.id,
        vendorName,
        category,
        contactPerson,
        phone,
        email,
        quoteAmount: Number(quoteAmount) || 0,
        approvedAmount: Number(approvedAmount) || 0,
        advancePaid: Number(advancePaid) || 0,
        balanceDue: calculatedBalance,
        paymentMilestones,
        deliverablesTracked,
        contractUrl,
        escalationContact,
        arrivalStatus,
      },
    });

    return NextResponse.json({ success: true, data: vendor }, { status: 201 });
  } catch (error: any) {
    console.error("Add Vendor Error:", error);
    return NextResponse.json({ success: false, error: "Failed to add event vendor" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { vendorId, ...updateData } = body;

    if (!vendorId) {
      return NextResponse.json({ success: false, error: "vendorId is required" }, { status: 400 });
    }

    if (updateData.quoteAmount !== undefined) updateData.quoteAmount = Number(updateData.quoteAmount);
    if (updateData.approvedAmount !== undefined) updateData.approvedAmount = Number(updateData.approvedAmount);
    if (updateData.advancePaid !== undefined) updateData.advancePaid = Number(updateData.advancePaid);
    if (updateData.balanceDue !== undefined) updateData.balanceDue = Number(updateData.balanceDue);

    const updated = await prisma.eventVendor.update({
      where: { id: vendorId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update Vendor Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update vendor" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) {
      return NextResponse.json({ success: false, error: "vendorId is required" }, { status: 400 });
    }

    await prisma.eventVendor.delete({
      where: { id: vendorId },
    });

    return NextResponse.json({ success: true, message: "Vendor removed" });
  } catch (error: any) {
    console.error("Delete Vendor Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete vendor" }, { status: 500 });
  }
}
