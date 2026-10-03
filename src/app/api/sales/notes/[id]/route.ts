import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const existingNote = await prisma.salesNote.findUnique({
      where: { id },
    });

    if (!existingNote || existingNote.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Note not found or access denied" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { title, content, category, tags, isPinned, isArchived } = body;

    const updatedNote = await prisma.salesNote.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && {
          tags: Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === "string" ? tags : "[]"),
        }),
        ...(isPinned !== undefined && { isPinned: Boolean(isPinned) }),
        ...(isArchived !== undefined && { isArchived: Boolean(isArchived) }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedNote,
      message: "Note updated successfully",
    });
  } catch (error: any) {
    console.error("Failed to update sales note:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const existingNote = await prisma.salesNote.findUnique({
      where: { id },
    });

    if (!existingNote || existingNote.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Note not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.salesNote.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error: any) {
    console.error("Failed to delete sales note:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete note" },
      { status: 500 }
    );
  }
}
