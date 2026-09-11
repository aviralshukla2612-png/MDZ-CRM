import { NextResponse } from "next/server";
import { getPublishedTerms, checkUserTermsStatus } from "@/lib/termsEngine";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const terms = await getPublishedTerms("EMPLOYEE");
    const currentUser = await getCurrentUser();

    let userStatus = null;
    if (currentUser) {
      userStatus = await checkUserTermsStatus(currentUser);
    }

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
