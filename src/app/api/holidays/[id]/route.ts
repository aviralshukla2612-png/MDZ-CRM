import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const existing = await prisma.holiday.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Holiday not found" }, { status: 404 });
    }

    await prisma.holiday.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Holiday deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/holidays/[id] error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to delete holiday" }, { status: 500 });
  }
}
