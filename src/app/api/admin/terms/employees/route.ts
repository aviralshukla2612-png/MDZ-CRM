import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUser } from "@/lib/notifications";
import { getPublishedTerms } from "@/lib/termsEngine";

export async function GET() {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const globalTerms = await getPublishedTerms("EMPLOYEE");

    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            activeRole: true,
            designation: true,
            department: true,
            phone: true,
            termsAcceptedVersion: true,
            termsAcceptedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = employees.map((emp) => {
      const hasCustom = Boolean(emp.customTermsContent && emp.customTermsContent.trim());
      const effectiveVersion = hasCustom ? emp.termsVersion || "v1.0" : globalTerms.version;
      const isAccepted = hasCustom
        ? emp.termsAccepted
        : emp.user?.termsAcceptedVersion === globalTerms.version;

      return {
        id: emp.id,
        userId: emp.userId,
        employeeIdCode: emp.employeeIdCode,
        name: emp.user?.name || "Employee",
        email: emp.user?.email || "",
        designation: emp.user?.designation || "Staff",
        department: emp.user?.department || "General",
        salaryMonthly: emp.salaryMonthly,
        phone: emp.user?.phone || emp.phone || "",
        hasCustomTerms: hasCustom,
        customTermsTitle: emp.customTermsTitle,
        customTermsContent: emp.customTermsContent,
        termsVersion: emp.termsVersion || "v1.0",
        effectiveVersion,
        termsAccepted: isAccepted,
        termsAcceptedAt: hasCustom ? emp.termsAcceptedAt : emp.user?.termsAcceptedAt,
        joiningDate: emp.joiningDate,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      globalTerms,
    });
  } catch (error: any) {
    console.error("GET /api/admin/terms/employees error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees terms data" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const {
      employeeId,
      customTermsTitle,
      customTermsContent,
      termsVersion,
      requireReAcceptance,
      resetToDefault,
    } = body;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee record not found" },
        { status: 404 }
      );
    }

    let updateData: any = {};

    if (resetToDefault) {
      // Revert to global company terms
      updateData = {
        customTermsTitle: null,
        customTermsContent: null,
        termsVersion: "v1.0",
        termsAccepted: false,
        termsAcceptedAt: null,
      };
    } else {
      if (!customTermsContent || !customTermsContent.trim()) {
        return NextResponse.json(
          { success: false, error: "Individual terms content cannot be empty" },
          { status: 400 }
        );
      }

      const cleanVersion = termsVersion?.trim() || employee.termsVersion || "v1.0";
      const cleanTitle =
        customTermsTitle?.trim() ||
        `Employment Terms & Individual Agreement — ${employee.user.name}`;

      updateData = {
        customTermsTitle: cleanTitle,
        customTermsContent: customTermsContent.trim(),
        termsVersion: cleanVersion,
      };

      if (requireReAcceptance) {
        updateData.termsAccepted = false;
        updateData.termsAcceptedAt = null;
      }
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
      include: { user: true },
    });

    // Notify employee about individual terms update
    try {
      await sendNotificationToUser({
        recipientId: employee.userId,
        title: "📜 Terms & Conditions Updated",
        message: resetToDefault
          ? "Your terms and conditions have been updated to the standard company agreement."
          : `Admin has updated your individual Employment Terms & Agreement (${updateData.termsVersion || "v1.0"}). Please review and accept.`,
        urgency: "HIGH",
        linkUrl: "/employee/terms",
      });
    } catch (notifErr) {
      console.warn("Failed to dispatch terms notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: resetToDefault
        ? `Reset terms for ${employee.user.name} to default company terms`
        : `Updated individual terms for ${employee.user.name} successfully`,
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/admin/terms/employees error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update employee terms" },
      { status: 500 }
    );
  }
}
