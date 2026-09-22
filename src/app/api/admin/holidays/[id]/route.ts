import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const existing = await prisma.holiday.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Holiday not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.type !== undefined) updateData.type = String(body.type).toUpperCase();
    if (body.state !== undefined) updateData.state = body.state ? String(body.state).trim() : null;
    if (body.description !== undefined) updateData.description = body.description ? String(body.description).trim() : null;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.isOptional !== undefined) updateData.isOptional = Boolean(body.isOptional);

    const updated = await prisma.holiday.update({
      where: { id: params.id },
      data: updateData,
    });

    try {
      await prisma.activityEvent.create({
        data: {
          eventType: "HOLIDAY_UPDATED",
          actorId: authRes.id,
          entityType: "HOLIDAY",
          entityId: updated.id,
          metadataJson: JSON.stringify({
            title: updated.title,
            updates: updateData,
          }),
        },
      });
    } catch {}

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/holidays/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update holiday" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const existing = await prisma.holiday.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Holiday not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const hardDelete = searchParams.get("hard") === "true";

    if (hardDelete || existing.source === "ADMIN" || existing.source === "MANUAL") {
      await prisma.holiday.delete({ where: { id: params.id } });
    } else {
      // Soft delete for system/google imported holidays
      await prisma.holiday.update({
        where: { id: params.id },
        data: { isActive: false },
      });
    }

    try {
      await prisma.activityEvent.create({
        data: {
          eventType: "HOLIDAY_DELETED",
          actorId: authRes.id,
          entityType: "HOLIDAY",
          entityId: params.id,
          metadataJson: JSON.stringify({
            title: existing.title,
            date: existing.date,
            hardDelete,
          }),
        },
      });
    } catch {}

    return NextResponse.json({ success: true, message: "Holiday removed successfully" });
  } catch (error: any) {
    console.error("DELETE /api/admin/holidays/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete holiday" },
      { status: 500 }
    );
  }
}
