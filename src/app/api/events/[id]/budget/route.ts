import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const budgetItems = await prisma.eventBudgetItem.findMany({
      where: { eventId: params.id },
      orderBy: [{ category: "asc" }, { createdAt: "desc" }],
    });

    const event = await prisma.eventProject.findUnique({
      where: { id: params.id },
      select: {
        estimatedBudget: true,
        approvedBudget: true,
        quotationAmount: true,
        actualCost: true,
      },
    });

    const totalsByCategory: Record<string, { estimated: number; actual: number; paid: number }> = {};
    let totalEstimated = 0;
    let totalActual = 0;
    let totalPaid = 0;

    budgetItems.forEach((item) => {
      if (!totalsByCategory[item.category]) {
        totalsByCategory[item.category] = { estimated: 0, actual: 0, paid: 0 };
      }
      totalsByCategory[item.category].estimated += item.estimatedCost;
      totalsByCategory[item.category].actual += item.actualCost;
      totalsByCategory[item.category].paid += item.advancePaid + item.balancePaid;

      totalEstimated += item.estimatedCost;
      totalActual += item.actualCost;
      totalPaid += item.advancePaid + item.balancePaid;
    });

    return NextResponse.json({
      success: true,
      data: {
        budgetItems,
        eventBudget: event,
        totals: {
          totalEstimated,
          totalActual,
          totalPaid,
          variance: (event?.approvedBudget || totalEstimated) - totalActual,
          estimatedProfitability: (event?.quotationAmount || 0) - totalActual,
        },
        totalsByCategory,
      },
    });
  } catch (error: any) {
    console.error("Fetch Budget Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch event budget" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      category = "PRODUCTION",
      description,
      estimatedCost = 0,
      actualCost = 0,
      advancePaid = 0,
      balancePaid = 0,
      status = "PENDING",
      vendorName = "",
      approvedBy = "",
    } = body;

    if (!description) {
      return NextResponse.json({ success: false, error: "Description is required" }, { status: 400 });
    }

    const item = await prisma.eventBudgetItem.create({
      data: {
        eventId: params.id,
        category,
        description,
        estimatedCost: Number(estimatedCost) || 0,
        actualCost: Number(actualCost) || 0,
        advancePaid: Number(advancePaid) || 0,
        balancePaid: Number(balancePaid) || 0,
        status,
        vendorName,
        approvedBy,
      },
    });

    // Update event actualCost total
    const allItems = await prisma.eventBudgetItem.findMany({ where: { eventId: params.id } });
    const currentActualCost = allItems.reduce((acc, cur) => acc + cur.actualCost, 0);
    await prisma.eventProject.update({
      where: { id: params.id },
      data: { actualCost: currentActualCost },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: any) {
    console.error("Create Budget Item Error:", error);
    return NextResponse.json({ success: false, error: "Failed to add budget item" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { itemId, ...updateData } = body;

    if (!itemId) {
      return NextResponse.json({ success: false, error: "itemId is required" }, { status: 400 });
    }

    if (updateData.estimatedCost !== undefined) updateData.estimatedCost = Number(updateData.estimatedCost);
    if (updateData.actualCost !== undefined) updateData.actualCost = Number(updateData.actualCost);
    if (updateData.advancePaid !== undefined) updateData.advancePaid = Number(updateData.advancePaid);
    if (updateData.balancePaid !== undefined) updateData.balancePaid = Number(updateData.balancePaid);

    const updated = await prisma.eventBudgetItem.update({
      where: { id: itemId },
      data: updateData,
    });

    // Recalculate event actualCost total
    const allItems = await prisma.eventBudgetItem.findMany({ where: { eventId: params.id } });
    const currentActualCost = allItems.reduce((acc, cur) => acc + cur.actualCost, 0);
    await prisma.eventProject.update({
      where: { id: params.id },
      data: { actualCost: currentActualCost },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update Budget Item Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update budget item" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ success: false, error: "itemId is required" }, { status: 400 });
    }

    await prisma.eventBudgetItem.delete({
      where: { id: itemId },
    });

    // Recalculate event actualCost total
    const allItems = await prisma.eventBudgetItem.findMany({ where: { eventId: params.id } });
    const currentActualCost = allItems.reduce((acc, cur) => acc + cur.actualCost, 0);
    await prisma.eventProject.update({
      where: { id: params.id },
      data: { actualCost: currentActualCost },
    });

    return NextResponse.json({ success: true, message: "Budget item deleted" });
  } catch (error: any) {
    console.error("Delete Budget Item Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete budget item" }, { status: 500 });
  }
}
