import { NextResponse } from "next/server";
import { pullLatestFromGoogleSheet } from "@/lib/deliverySheetSync";
import { getDeliveryMasterData, saveDeliveryMasterData } from "@/lib/deliveryMasterStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const master = getDeliveryMasterData();
  return NextResponse.json({
    status: "ONLINE",
    message: "Millionaire OS Google Sheet Webhook is active and listening.",
    lastSync: master.lastGoogleSheetSync || null,
    lastStatus: master.lastSyncStatus || "IDLE",
    appsScriptConnected: Boolean(master.appsScriptUrl),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { event, action, sheetName } = body;

    console.log(`[GoogleSheetWebhook] Received ${event || action || "EVENT"} from Sheet: ${sheetName || "N/A"}`);

    if (action === "PING" || event === "PING") {
      return NextResponse.json({
        success: true,
        message: "Pong! Google Sheet Webhook endpoint is live and verified.",
        timestamp: new Date().toISOString(),
      });
    }

    // Trigger full pull from Google Sheet
    const syncResult = await pullLatestFromGoogleSheet();

    saveDeliveryMasterData({
      lastGoogleSheetSync: new Date().toISOString(),
      lastSyncStatus: syncResult.success ? "SUCCESS" : "ERROR",
      lastSyncMessage: `Webhook trigger: ${syncResult.message}`,
    });

    return NextResponse.json({
      success: true,
      message: "Webhook processed and CRM synchronized with Google Sheet!",
      syncResult,
    });
  } catch (error: any) {
    console.error("[GoogleSheetWebhook] Error handling webhook:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
