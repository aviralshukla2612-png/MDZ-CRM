import { NextResponse } from "next/server";
import { getEmployeeSpecificTerms, checkUserTermsStatus } from "@/lib/termsEngine";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const terms = await getEmployeeSpecificTerms(currentUser.id);
    const userStatus = await checkUserTermsStatus(currentUser);

    return NextResponse.json({
      success: true,
      terms,
      userStatus,
    });
  } catch (error) {
    console.error("GET /api/terms/employee error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee terms" },
      { status: 500 }
    );
  }
}
