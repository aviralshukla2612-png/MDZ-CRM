import {
  getDeliveryMasterData,
  saveDeliveryMasterData,
  ClientDeliveryStatus,
  ClientTargetCommitment,
  DEFAULT_CLIENT_TARGET_COMMITMENTS,
  DEFAULT_GOOGLE_SHEET_URL,
} from "./deliveryMasterStore";

export const DEFAULT_SHEET_ID = "1h3FUAY3HQljoerEgMCeBx-cUv-JxuAat";
export const DASHBOARD_GID = "1693502346";
export const CLIENT_TARGETS_GID = "1126021745";
export const PRODUCTION_LOG_GID = "14317656";
export const TEAM_SUMMARY_GID = "1253016903";
export const EXTRA_WORK_GID = "1890403028";

/**
 * Robust CSV line parser supporting quoted fields and embedded commas
 */
export function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

export function extractSheetId(url?: string): string {
  if (!url) return DEFAULT_SHEET_ID;
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : DEFAULT_SHEET_ID;
}

/**
 * Pull all data live from the Google Sheet into CRM
 */
export async function pullLatestFromGoogleSheet(): Promise<{
  success: boolean;
  message: string;
  clientCount?: number;
  taskCount?: number;
  error?: string;
}> {
  try {
    const master = getDeliveryMasterData();
    const sheetUrl = master.driveUrl || DEFAULT_GOOGLE_SHEET_URL;
    const sheetId = extractSheetId(sheetUrl);

    // 1. Fetch Dashboard Tab (gid=1693502346)
    const dashRes = await fetch(
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${DASHBOARD_GID}`,
      { cache: "no-store" }
    );

    if (!dashRes.ok) {
      const err = `Failed to download Google Sheet Dashboard. HTTP status ${dashRes.status}. Ensure link sharing is set to "Anyone with the link can view".`;
      saveDeliveryMasterData({
        lastSyncStatus: "ERROR",
        lastSyncMessage: err,
      });
      return { success: false, message: err, error: err };
    }

    const dashText = await dashRes.text();
    const dashLines = dashText.split(/\r?\n/);

    let inClientTable = false;
    const newClientRows: ClientDeliveryStatus[] = [];
    const seenCodes = new Set<string>();

    for (const line of dashLines) {
      const parts = parseCsvLine(line);
      const firstCol = parts[0]?.toUpperCase() || "";

      if (firstCol === "CLIENT" && parts[1]?.toUpperCase() === "TARGET") {
        inClientTable = true;
        continue;
      }

      if (inClientTable) {
        if (!parts[0] || parts[0].includes("CONTENT-TYPE") || parts[0].includes("ACTION ITEMS")) {
          break;
        }

        const clientCodeRaw = parts[0].replace(/\s*\[\?\]/g, "").trim().toUpperCase();
        if (!clientCodeRaw || seenCodes.has(clientCodeRaw)) {
          continue; // Strict deduplication so client codes are unique and planned stays exact
        }
        seenCodes.add(clientCodeRaw);

        const target = parseInt(parts[1]) || 0;
        const done = parseInt(parts[2]) || 0;
        const pending = parseInt(parts[3]) || Math.max(0, target - done);
        const inProgress = parseInt(parts[4]) || 0;
        const onHold = parseInt(parts[5]) || 0;
        const overdue = parseInt(parts[6]) || 0;
        const completionPct = target > 0 ? Math.round((done / target) * 100) : 0;
        const missingLinks = parseInt(parts[8]) || 0;
        const unassigned = parseInt(parts[9]) || 0;

        const existingRow = master.clientStatusList.find(
          (r) => r.clientCode.toUpperCase() === clientCodeRaw
        );

        newClientRows.push({
          id: existingRow?.id || `cl-${clientCodeRaw.toLowerCase()}`,
          clientCode: clientCodeRaw,
          clientName: existingRow?.clientName || clientCodeRaw,
          target,
          done,
          pending,
          inProgress,
          onHold,
          overdue,
          completionPct,
          missingLinks,
          unassigned,
        });
      }
    }

    // 2. Fetch Client Targets Tab (gid=1126021745)
    let updatedCommitments: ClientTargetCommitment[] = [];
    try {
      const targetsRes = await fetch(
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${CLIENT_TARGETS_GID}`,
        { cache: "no-store" }
      );
      if (targetsRes.ok) {
        const targetsCsv = await targetsRes.text();
        const tLines = targetsCsv.split(/\r?\n/);
        let inTargetsTable = false;

        for (const tLine of tLines) {
          const cols = parseCsvLine(tLine);
          if (cols[0]?.toLowerCase() === "client" && cols[1]?.toLowerCase() === "reels") {
            inTargetsTable = true;
            continue;
          }

          if (inTargetsTable) {
            const clientName = cols[0] || "";
            if (!clientName || clientName.toUpperCase() === "TOTAL") {
              break;
            }

            const reels = parseInt(cols[1]) || 0;
            const carousels = parseInt(cols[2]) || 0;
            const posts = parseInt(cols[3]) || 0;
            const cpUnsplit = parseInt(cols[4]) || 0;
            const stories = parseInt(cols[5]) || 0;
            const total = parseInt(cols[6]) || reels + carousels + posts + cpUnsplit + stories;

            const hasCheck = (val?: string) =>
              Boolean(val && val.trim().length > 0 && !val.includes("0") && val !== "-");

            updatedCommitments.push({
              id: `ct-${clientName.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
              client: clientName,
              reels,
              carousels,
              posts,
              cpUnsplit,
              stories,
              total,
              platforms: {
                ig: hasCheck(cols[7]),
                fb: hasCheck(cols[8]),
                li: hasCheck(cols[9]),
                gmb: hasCheck(cols[10]),
                whatsapp: hasCheck(cols[11]),
                youtube: hasCheck(cols[12]),
              },
              originalCp: cols[13] || "",
              review: cols[14] || "As noted",
              notes: cols[15] || "",
            });
          }
        }
      }
    } catch (tErr) {
      console.error("[GoogleSheetSync] Error syncing client targets tab:", tErr);
    }

    // 3. Fetch Production Log Tab (gid=14317656)
    const productionTasks: any[] = [];
    try {
      const prodRes = await fetch(
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${PRODUCTION_LOG_GID}`,
        { cache: "no-store" }
      );
      if (prodRes.ok) {
        const prodCsv = await prodRes.text();
        const pLines = prodCsv.split(/\r?\n/);
        for (let i = 4; i < pLines.length; i++) {
          const line = pLines[i].trim();
          if (!line) continue;
          const cols = parseCsvLine(line);
          const taskId = cols[0];
          if (!taskId || !taskId.startsWith("MDZ-")) continue;

          productionTasks.push({
            id: taskId,
            month: cols[1] || "2026-10",
            clientCode: cols[2] || "",
            format: cols[3] || "Reel",
            deliverable: cols[4] || taskId,
            deliverableTitle: cols[4] || taskId,
            publishingPlatforms: cols[5] || "",
            assignee: cols[6] || "MDZ Production Team",
            editor: cols[6] || "MDZ Production Team",
            assignedAt: cols[7] || "",
            dueAt: cols[8] || "",
            priority: cols[9] || "Normal",
            status: cols[10] || "PLANNED",
            reviewStatus: cols[10] || "Drafting",
            progress: cols[11] || "0%",
            startedAt: cols[12] || "",
            completedAt: cols[13] || "",
            completedBy: cols[14] || "",
            approvedBy: cols[15] || "",
            publishedAt: cols[16] || "",
            publishedStatus: cols[16] ? "Published" : (cols[10] === "Completed" ? "Approved" : "In Production"),
            driveLink: cols[17] || "",
            finalLink: cols[17] || "",
            pendingReason: cols[18] || "",
            pendingWith: cols[19] || "",
            nextFollowUp: cols[20] || "",
            notes: cols[22] || "",
          });
        }
      }
    } catch (pErr) {
      console.error("[GoogleSheetSync] Error syncing production log tab:", pErr);
    }

    // 4. Fetch Team Summary Tab (gid=1253016903)
    const teamMembers: any[] = [];
    try {
      const teamRes = await fetch(
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${TEAM_SUMMARY_GID}`,
        { cache: "no-store" }
      );
      if (teamRes.ok) {
        const teamCsv = await teamRes.text();
        const tmLines = teamCsv.split(/\r?\n/);
        for (let i = 4; i < tmLines.length; i++) {
          const cols = parseCsvLine(tmLines[i]);
          const role = cols[0];
          const name = cols[1];
          if (!role || !name) continue;
          teamMembers.push({
            role,
            name,
            assigned: parseInt(cols[2]) || 0,
            completed: parseInt(cols[3]) || 0,
            pending: parseInt(cols[4]) || 0,
            turnaround: cols[5] || "24h - 48h",
            overdue: parseInt(cols[6]) || 0,
          });
        }
      }
    } catch (tmErr) {
      console.error("[GoogleSheetSync] Error syncing team summary tab:", tmErr);
    }

    // 5. Fetch Extra Work Tab (gid=1890403028)
    const extraWorkList: any[] = [];
    try {
      const ewRes = await fetch(
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${EXTRA_WORK_GID}`,
        { cache: "no-store" }
      );
      if (ewRes.ok) {
        const ewCsv = await ewRes.text();
        const ewLines = ewCsv.split(/\r?\n/);
        for (let i = 4; i < ewLines.length; i++) {
          const cols = parseCsvLine(ewLines[i]);
          const workId = cols[0];
          if (!workId || !workId.startsWith("EX-")) continue;
          extraWorkList.push({
            id: workId,
            client: cols[1] || "",
            request: cols[2] || "Extra Deliverable",
            assignedTo: cols[3] || "",
            dueAt: cols[4] || "",
            status: cols[5] || "Not Started",
            completedAt: cols[6] || "",
            completedBy: cols[7] || "",
            driveLink: cols[8] || "",
            notes: cols[13] || "",
          });
        }
      }
    } catch (ewErr) {
      console.error("[GoogleSheetSync] Error syncing extra work tab:", ewErr);
    }

    // Save consolidated master data
    const updatePayload: any = {
      lastGoogleSheetSync: new Date().toISOString(),
      lastSyncStatus: "SUCCESS",
      lastSyncMessage: `Synchronized ${newClientRows.length} clients (${newClientRows.reduce((a, b) => a + b.target, 0)} deliverables) and ${productionTasks.length} tasks directly from live Google Sheet`,
    };

    if (newClientRows.length > 0) {
      updatePayload.clientStatusList = newClientRows;
    }
    if (updatedCommitments.length > 0) {
      updatePayload.clientTargetCommitments = updatedCommitments;
    }
    if (productionTasks.length > 0) {
      updatePayload.productionLog = productionTasks;
    }
    if (teamMembers.length > 0) {
      updatePayload.teamSummary = teamMembers;
    }
    if (extraWorkList.length > 0) {
      updatePayload.extraWork = extraWorkList;
    }

    saveDeliveryMasterData(updatePayload);

    return {
      success: true,
      message: updatePayload.lastSyncMessage,
      clientCount: newClientRows.length,
      taskCount: productionTasks.length,
    };
  } catch (err: any) {
    console.error("[GoogleSheetSync] Critical sync error:", err);
    saveDeliveryMasterData({
      lastSyncStatus: "ERROR",
      lastSyncMessage: err?.message || "Error syncing from Google Sheet",
    });
    return {
      success: false,
      message: err?.message || "Error syncing from Google Sheet",
      error: err?.message,
    };
  }
}

/**
 * Pushes changes originating in the CRM into the live Google Sheet via Google Apps Script Web App
 */
export async function pushChangeToGoogleSheet(action: string, payload: any): Promise<{
  success: boolean;
  message: string;
  pushedToSheet: boolean;
  error?: string;
}> {
  try {
    const master = getDeliveryMasterData();
    const appsScriptUrl = master.appsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL;

    if (!appsScriptUrl || !appsScriptUrl.startsWith("http")) {
      // Apps Script URL not configured yet
      return {
        success: true,
        pushedToSheet: false,
        message: "Saved locally in CRM. (Connect your Google Apps Script Web App in Delivery Control settings to automatically write changes back to Google Sheet).",
      };
    }

    // Call the Google Apps Script Web App
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[GoogleSheetSync] Apps Script HTTP ${res.status}`);
      return {
        success: false,
        pushedToSheet: false,
        message: `Google Apps Script returned status ${res.status}`,
      };
    }

    const json = await res.json().catch(() => ({ success: true }));
    return {
      success: true,
      pushedToSheet: true,
      message: json.message || "✓ Changes pushed to live Google Sheet successfully!",
    };
  } catch (err: any) {
    console.error("[GoogleSheetSync] Push error:", err);
    return {
      success: false,
      pushedToSheet: false,
      message: `Failed to push to Google Sheet: ${err?.message || "Network error"}`,
      error: err?.message,
    };
  }
}

/**
 * Diagnostic test for bidirectional connection
 */
export async function testSheetConnection(): Promise<{
  readSuccess: boolean;
  writeSuccess: boolean;
  readMessage: string;
  writeMessage: string;
  sheetTitle?: string;
  latencyMs: number;
}> {
  const start = Date.now();
  const master = getDeliveryMasterData();
  const sheetUrl = master.driveUrl || DEFAULT_GOOGLE_SHEET_URL;
  const sheetId = extractSheetId(sheetUrl);
  const appsScriptUrl = master.appsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL;

  let readSuccess = false;
  let readMessage = "";
  let writeSuccess = false;
  let writeMessage = "";
  let sheetTitle = "";

  // 1. Test Read via Google Sheet CSV
  try {
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${DASHBOARD_GID}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      readSuccess = true;
      readMessage = "✓ Live Sheet read connection verified (CSV Export accessible)";
    } else {
      readMessage = `HTTP ${res.status}: Sheet is private or inaccessible. Set link sharing to 'Anyone with the link can view'.`;
    }
  } catch (e: any) {
    readMessage = `Read error: ${e?.message}`;
  }

  // 2. Test Write via Apps Script
  if (appsScriptUrl && appsScriptUrl.startsWith("http")) {
    try {
      const res = await fetch(appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "PING" }),
        redirect: "follow",
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        writeSuccess = true;
        sheetTitle = json.spreadsheetTitle || "";
        writeMessage = `✓ Live Sheet writeback verified! Connected to "${json.spreadsheetTitle || "Spreadsheet"}"`;
      } else {
        writeMessage = `HTTP ${res.status}: Web App deployment error. Verify 'Execute as: Me' and 'Who has access: Anyone'.`;
      }
    } catch (e: any) {
      writeMessage = `Write test error: ${e?.message}`;
    }
  } else {
    writeMessage = "Google Apps Script Web App URL not configured. Paste your Web App URL to enable live writeback from CRM to Google Sheet.";
  }

  return {
    readSuccess,
    writeSuccess,
    readMessage,
    writeMessage,
    sheetTitle,
    latencyMs: Date.now() - start,
  };
}

/**
 * Ready-to-deploy Google Apps Script Code
 */
export const READY_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * MILLIONAIRE DIZITAL | BIDIRECTIONAL CRM SYNC BRIDGE
 * =========================================================================
 * Instructions:
 * 1. In your Google Sheet, click Extensions > Apps Script.
 * 2. Delete any existing code, paste this entire file, and click Save (disk icon).
 * 3. Update the CRM_WEBHOOK_URL below if using your live domain or ngrok.
 * 4. Click Deploy > New deployment > Select 'Web app'.
 * 5. Set 'Execute as' -> 'Me'
 * 6. Set 'Who has access' -> 'Anyone' (IMPORTANT!)
 * 7. Click Deploy, copy the Web App URL, and paste it into CRM Settings!
 * =========================================================================
 */

// Replace with your CRM's public URL or domain
var CRM_WEBHOOK_URL = "http://localhost:3040/mdz-crm/api/delivery-control/webhook";

/**
 * Receives write requests from CRM and updates Google Sheet cells instantly
 */
function doPost(e) {
  try {
    var contents = e.postData ? JSON.parse(e.postData.contents) : {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = contents.action;

    if (action === "PING") {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Google Apps Script bridge online!",
        spreadsheetTitle: ss.getName()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. UPDATE CLIENT ROW IN DASHBOARD TAB
    if (action === "UPDATE_CLIENT_ROW" || action === "UPDATE_CLIENT") {
      var sheet = ss.getSheetByName("Dashboard");
      if (!sheet) throw new Error("Dashboard sheet tab not found");
      var clientCode = (contents.clientCode || contents.row?.clientCode || "").toUpperCase().trim();
      var target = Number(contents.target !== undefined ? contents.target : contents.row?.target);
      var done = Number(contents.done !== undefined ? contents.done : contents.row?.done);
      var inProgress = Number(contents.inProgress !== undefined ? contents.inProgress : contents.row?.inProgress);
      var onHold = Number(contents.onHold !== undefined ? contents.onHold : contents.row?.onHold);
      var overdue = Number(contents.overdue !== undefined ? contents.overdue : contents.row?.overdue);

      var data = sheet.getDataRange().getValues();
      var updated = false;

      for (var i = 0; i < data.length; i++) {
        var cellVal = String(data[i][0] || "").trim().toUpperCase();
        if (cellVal === clientCode) {
          var rowNum = i + 1;
          if (!isNaN(target)) sheet.getRange(rowNum, 2).setValue(target); // Col B: Target
          if (!isNaN(done)) sheet.getRange(rowNum, 3).setValue(done);     // Col C: Done
          if (!isNaN(target) && !isNaN(done)) sheet.getRange(rowNum, 4).setValue(Math.max(0, target - done)); // Col D: Pending
          if (!isNaN(inProgress)) sheet.getRange(rowNum, 5).setValue(inProgress); // Col E: In Progress
          if (!isNaN(onHold)) sheet.getRange(rowNum, 6).setValue(onHold);         // Col F: On Hold
          if (!isNaN(overdue)) sheet.getRange(rowNum, 7).setValue(overdue);       // Col G: Overdue
          updated = true;
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, updated: updated, clientCode: clientCode })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. BULK UPDATE CLIENT ROWS IN DASHBOARD TAB
    if (action === "UPDATE_ALL_CLIENT_ROWS") {
      var sheet = ss.getSheetByName("Dashboard");
      if (!sheet) throw new Error("Dashboard sheet tab not found");
      var rows = contents.rows || [];
      var data = sheet.getDataRange().getValues();
      var count = 0;

      rows.forEach(function(r) {
        var code = (r.clientCode || "").toUpperCase().trim();
        for (var i = 0; i < data.length; i++) {
          if (String(data[i][0] || "").trim().toUpperCase() === code) {
            var rowNum = i + 1;
            if (r.target !== undefined) sheet.getRange(rowNum, 2).setValue(Number(r.target));
            if (r.done !== undefined) sheet.getRange(rowNum, 3).setValue(Number(r.done));
            if (r.target !== undefined && r.done !== undefined) sheet.getRange(rowNum, 4).setValue(Math.max(0, Number(r.target) - Number(r.done)));
            if (r.inProgress !== undefined) sheet.getRange(rowNum, 5).setValue(Number(r.inProgress));
            if (r.onHold !== undefined) sheet.getRange(rowNum, 6).setValue(Number(r.onHold));
            if (r.overdue !== undefined) sheet.getRange(rowNum, 7).setValue(Number(r.overdue));
            count++;
            break;
          }
        }
      });
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: count })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. UPDATE COMMITMENT IN CLIENT TARGETS TAB
    if (action === "UPDATE_CLIENT_TARGET_COMMITMENT" || action === "UPDATE_TARGET_COMMITMENT") {
      var sheet = ss.getSheetByName("Client Targets");
      if (sheet) {
        var item = contents.commitment || contents;
        var clientName = (item.client || "").toUpperCase().trim();
        var data = sheet.getDataRange().getValues();
        for (var i = 0; i < data.length; i++) {
          if (String(data[i][0] || "").trim().toUpperCase() === clientName) {
            var rowNum = i + 1;
            if (item.reels !== undefined) sheet.getRange(rowNum, 2).setValue(Number(item.reels));
            if (item.carousels !== undefined) sheet.getRange(rowNum, 3).setValue(Number(item.carousels));
            if (item.posts !== undefined) sheet.getRange(rowNum, 4).setValue(Number(item.posts));
            if (item.cpUnsplit !== undefined) sheet.getRange(rowNum, 5).setValue(Number(item.cpUnsplit));
            if (item.stories !== undefined) sheet.getRange(rowNum, 6).setValue(Number(item.stories));
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. UPDATE DELIVERABLE IN PRODUCTION LOG TAB
    if (action === "UPDATE_DELIVERABLE" || action === "UPDATE_TASK" || action === "UPDATE_STATUS" || action === "UPDATE_DRIVE_LINK") {
      var sheet = ss.getSheetByName("Production Log");
      if (sheet) {
        var taskId = contents.taskId || contents.id;
        var data = sheet.getDataRange().getValues();
        for (var i = 4; i < data.length; i++) {
          if (String(data[i][0] || "").trim() === String(taskId).trim() ||
              (contents.deliverable && String(data[i][4] || "").trim() === String(contents.deliverable).trim())) {
            var rowNum = i + 1;
            if (contents.status) sheet.getRange(rowNum, 11).setValue(contents.status); // Col K
            if (contents.progress) sheet.getRange(rowNum, 12).setValue(contents.progress); // Col L
            if (contents.completedAt) sheet.getRange(rowNum, 14).setValue(contents.completedAt); // Col N
            if (contents.completedBy) sheet.getRange(rowNum, 15).setValue(contents.completedBy); // Col O
            if (contents.driveLink || contents.finalLink) sheet.getRange(rowNum, 18).setValue(contents.driveLink || contents.finalLink); // Col R
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Return live JSON data for fast GET requests
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Dashboard");
    var clients = [];

    if (sheet) {
      var data = sheet.getDataRange().getValues();
      var inTable = false;
      for (var i = 0; i < data.length; i++) {
        var col0 = String(data[i][0] || "").trim();
        if (col0.toUpperCase() === "CLIENT") {
          inTable = true;
          continue;
        }
        if (inTable) {
          if (!col0 || col0.includes("CONTENT-TYPE") || col0.includes("ACTION ITEMS")) break;
          clients.push({
            clientCode: col0,
            target: Number(data[i][1]) || 0,
            done: Number(data[i][2]) || 0,
            pending: Number(data[i][3]) || 0,
            inProgress: Number(data[i][4]) || 0,
            onHold: Number(data[i][5]) || 0,
            overdue: Number(data[i][6]) || 0,
          });
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      title: ss.getName(),
      clients: clients
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Real-time event: sends webhook to CRM whenever anyone edits any cell in Google Sheets!
 */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var sheet = e.range.getSheet();
    var payload = {
      event: "SHEET_CELL_EDIT",
      sheetName: sheet.getName(),
      row: e.range.getRow(),
      col: e.range.getColumn(),
      value: e.value,
      oldValue: e.oldValue,
      timestamp: new Date().toISOString()
    };

    UrlFetchApp.fetch(CRM_WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    // Ignore network webhook errors silently in sheet
  }
}
`;
