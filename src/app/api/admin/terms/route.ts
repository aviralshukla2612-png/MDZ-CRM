import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPublishedTerms } from "@/lib/termsEngine";

export async function GET() {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    // Ensure default terms exist in DB
    await getPublishedTerms("EMPLOYEE");
    await getPublishedTerms("CLIENT");

    const allTerms = await prisma.terms.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        publishedBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { acceptances: true },
        },
      },
    });

    const employeeTerms = allTerms.filter((t) => t.targetAudience === "EMPLOYEE");
    const clientTerms = allTerms.filter((t) => t.targetAudience === "CLIENT");

    return NextResponse.json({
      success: true,
      data: {
        employee: {
          current: employeeTerms.find((t) => t.isCurrent && !t.isDraft) || null,
          draft: employeeTerms.find((t) => t.isDraft) || null,
          history: employeeTerms.filter((t) => !t.isDraft),
        },
        client: {
          current: clientTerms.find((t) => t.isCurrent && !t.isDraft) || null,
          draft: clientTerms.find((t) => t.isDraft) || null,
          history: clientTerms.filter((t) => !t.isDraft),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/terms error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin terms records" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { targetAudience, action, version, title, content } = body;

    if (!targetAudience || (targetAudience !== "EMPLOYEE" && targetAudience !== "CLIENT")) {
      return NextResponse.json({ success: false, error: "Invalid targetAudience" }, { status: 400 });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ success: false, error: "Terms content is required" }, { status: 400 });
    }

    const versionStr = version && typeof version === "string" ? version.trim() : "v1.1";
    const titleStr = title || `${targetAudience === "EMPLOYEE" ? "Employee" : "Client"} Terms and Conditions of Service`;

    if (action === "save_draft") {
      // Find existing draft or create new draft
      const existingDraft = await prisma.terms.findFirst({
        where: { targetAudience, isDraft: true },
      });

      let draftRecord;
      if (existingDraft) {
        draftRecord = await prisma.terms.update({
          where: { id: existingDraft.id },
          data: {
            version: versionStr,
            title: titleStr,
            content: content.trim(),
            updatedAt: new Date(),
          },
        });
      } else {
        draftRecord = await prisma.terms.create({
          data: {
            targetAudience,
            version: versionStr,
            title: titleStr,
            content: content.trim(),
            isCurrent: false,
            isDraft: true,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Draft terms saved successfully",
        terms: draftRecord,
      });
    }

    if (action === "publish") {
      // Unmark any current published terms for this audience
      await prisma.terms.updateMany({
        where: { targetAudience, isCurrent: true },
        data: { isCurrent: false },
      });

      // Delete existing draft if it exists
      await prisma.terms.deleteMany({
        where: { targetAudience, isDraft: true },
      });

      // Create new published terms record
      const publishedTerms = await prisma.terms.create({
        data: {
          targetAudience,
          version: versionStr,
          title: titleStr,
          content: content.trim(),
          isCurrent: true,
          isDraft: false,
          publishedAt: new Date(),
          publishedById: authRes.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Published ${targetAudience} Terms version ${versionStr} successfully`,
        terms: publishedTerms,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action. Use 'save_draft' or 'publish'" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/terms error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process terms management request" },
      { status: 500 }
    );
  }
}
