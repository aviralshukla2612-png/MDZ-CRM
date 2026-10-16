import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientPortalData, saveClientPortalData } from "@/lib/clientPortalStore";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const clientId = params.id;
    const dbClient = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, companyName: true },
    });

    const clientName = dbClient ? dbClient.companyName : "Client Account";
    const data = getClientPortalData(clientId, clientName);

    return NextResponse.json({
      success: true,
      clientId,
      clientName,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching admin client portal data:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const clientId = params.id;
    const body = await req.json();
    const { section, sectionData, data: fullData } = body;

    let payload: any = {};
    if (section && sectionData !== undefined) {
      payload[section] = sectionData;
    } else if (fullData) {
      payload = fullData;
    } else {
      payload = body;
    }

    const updated = saveClientPortalData(clientId, payload, userOrRes.email);

    return NextResponse.json({
      success: true,
      clientId,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error updating admin client portal data:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
