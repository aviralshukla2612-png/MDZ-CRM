import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const isPinned = searchParams.get("isPinned");

    const whereClause: any = {
      userId: user.id,
      isArchived: false,
    };

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (isPinned === "true") {
      whereClause.isPinned = true;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const notes = await prisma.salesNote.findMany({
      where: whereClause,
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    console.error("Failed to fetch sales notes:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch sales notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, category, tags, isPinned } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const newNote = await prisma.salesNote.create({
      data: {
        userId: user.id,
        title: title.trim(),
        content: content || "",
        category: category || "GENERAL",
        tags: Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === "string" ? tags : "[]"),
        isPinned: Boolean(isPinned),
      },
    });

    return NextResponse.json({
      success: true,
      data: newNote,
      message: "Note saved successfully",
    });
  } catch (error: any) {
    console.error("Failed to create sales note:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save note" },
      { status: 500 }
    );
  }
}
