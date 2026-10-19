import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getClientAccountForUser } from "@/lib/client-auth";
import { prisma } from "@/lib/prisma";
import { getClientPortalData, saveClientPortalData } from "@/lib/clientPortalStore";

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { searchParams } = new URL(req.url);
    const requestedClientId = searchParams.get("clientId");

    let targetClientId: string | null = null;
    let targetClientName: string = "Client Account";

    // If client user is logged in
    const clientCtx = await getClientAccountForUser(userOrRes.email);
    if (clientCtx) {
      targetClientId = clientCtx.client.id;
      targetClientName = clientCtx.client.companyName;
    } else if (requestedClientId) {
      // Admin or Team checking a client
      const dbClient = await prisma.client.findUnique({
        where: { id: requestedClientId },
        select: { id: true, companyName: true },
      });
      if (dbClient) {
        targetClientId = dbClient.id;
        targetClientName = dbClient.companyName;
      } else {
        targetClientId = requestedClientId;
        targetClientName = requestedClientId;
      }
    } else {
      // If admin/employee is previewing without clientId, grab first client or default
      const firstClient = await prisma.client.findFirst({
        select: { id: true, companyName: true },
        orderBy: { createdAt: "desc" },
      });
      if (firstClient) {
        targetClientId = firstClient.id;
        targetClientName = firstClient.companyName;
      } else {
        targetClientId = "default-client";
        targetClientName = "MDZ Enterprise Client";
      }
    }

    if (!targetClientId) {
      targetClientId = "default-client";
    }

    const data = getClientPortalData(targetClientId, targetClientName);
    return NextResponse.json({
      success: true,
      clientId: targetClientId,
      clientName: targetClientName,
      client: {
        id: targetClientId,
        companyName: targetClientName,
        email: clientCtx?.client?.email || userOrRes.email,
        gstNumber: clientCtx?.client?.gstNumber || null,
      },
      data,
    });
  } catch (error: any) {
    console.error("Error fetching client portal data:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();
    const { clientId: reqClientId, section, sectionData, data: fullData } = body;

    let targetClientId: string | null = null;
    const clientCtx = await getClientAccountForUser(userOrRes.email);

    if (clientCtx) {
      targetClientId = clientCtx.client.id;
    } else if (reqClientId) {
      targetClientId = reqClientId;
    } else {
      const firstClient = await prisma.client.findFirst({
        select: { id: true },
      });
      targetClientId = firstClient ? firstClient.id : "default-client";
    }

    let payload: any = {};
    if (section && sectionData !== undefined) {
      payload[section] = sectionData;
    } else if (fullData) {
      payload = fullData;
    } else {
      payload = body;
      delete payload.clientId;
    }

    const finalClientId = targetClientId || "default-client";
    const updated = saveClientPortalData(finalClientId, payload, userOrRes.email);

    return NextResponse.json({
      success: true,
      clientId: finalClientId,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error saving client portal data:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
