import { NextResponse } from "next/server";
import { getPublishedTerms, checkClientTermsStatus } from "@/lib/termsEngine";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const terms = await getPublishedTerms("CLIENT");
    const currentUser = await getCurrentUser();

    let clientStatus = null;
    if (currentUser?.email) {
      clientStatus = await checkClientTermsStatus(currentUser.email);
    }

    return NextResponse.json({
      success: true,
      terms,
      clientStatus,
    });
  } catch (error) {
    console.error("GET /api/terms/client error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch client terms" },
      { status: 500 }
    );
  }
}
