import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getClientPortalData, saveClientPortalData } from "@/lib/clientPortalStore";
import {
  getDeliveryMasterData,
  saveDeliveryMasterData,
  ClientDeliveryStatus,
} from "@/lib/deliveryMasterStore";

export async function GET(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN", "SALES", "EMPLOYEE", "CLIENT"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const filterClientId = searchParams.get("clientId");

    // 1. Load persistent Master Delivery Data (seeded with 16 clients matching Excel sheet)
    const masterData = getDeliveryMasterData();
    let clientRows: ClientDeliveryStatus[] = [...masterData.clientStatusList];

    // 2. Fetch clients from database to ensure any newly added CRM clients are also included
    const dbClients = await prisma.client.findMany({
      include: {
        projects: {
          include: {
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const getCode = (name: string, clientNumber?: string) => {
      if (clientNumber && clientNumber.startsWith("CLI-")) {
        const parts = clientNumber.split("-");
        if (parts[1]) return parts[1].slice(0, 3).toUpperCase();
      }
      const words = name.trim().split(/\s+/);
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return name.slice(0, 3).toUpperCase();
    };

    // Add any CRM clients that don't exist yet in clientRows
    for (const c of dbClients) {
      const code = getCode(c.companyName, c.clientNumber);
      const exists = clientRows.some(
        (r) => r.id === c.id || r.clientCode.toUpperCase() === code.toUpperCase()
      );
      if (!exists) {
        clientRows.push({
          id: c.id,
          clientCode: code,
          clientName: c.companyName,
          target: 30,
          done: 0,
          pending: 30,
          inProgress: 0,
          onHold: 0,
          overdue: 0,
          completionPct: 0,
          missingLinks: 0,
          unassigned: 30,
        });
      }
    }

    // Filter if specific clientId requested
    if (filterClientId) {
      clientRows = clientRows.filter(
        (r) => r.id === filterClientId || r.clientCode === filterClientId
      );
    }

    // Recalculate pending, completionPct, and master totals
    let masterPlanned = 0;
    let masterCompleted = 0;
    let masterRemaining = 0;
    let masterOnHold = 0;
    let masterOverdue = 0;
    let masterInProgress = 0;
    let masterPublished = 0;
    let masterMissingLinks = 0;
    let masterUnassigned = 0;

    const sanitizedClientRows = clientRows.map((r) => {
      const target = Number(r.target) || 0;
      const done = Number(r.done) || 0;
      const inProgress = Number(r.inProgress) || 0;
      const onHold = Number(r.onHold) || 0;
      const overdue = Number(r.overdue) || 0;
      const missingLinks = Number(r.missingLinks) || 0;
      const unassigned = Number(r.unassigned) || 0;
      const pending = Math.max(0, target - done);
      const completionPct = target > 0 ? Math.round((done / target) * 100) : 0;

      masterPlanned += target;
      masterCompleted += done;
      masterRemaining += pending;
      masterOnHold += onHold;
      masterOverdue += overdue;
      masterInProgress += inProgress;
      masterPublished += done;
      masterMissingLinks += missingLinks;
      masterUnassigned += unassigned;

      return {
        ...r,
        target,
        done,
        pending,
        inProgress,
        onHold,
        overdue,
        completionPct,
        missingLinks,
        unassigned,
      };
    });

    const masterCompletionPct =
      masterPlanned > 0 ? Math.round((masterCompleted / masterPlanned) * 100) : 0;

    // Collect production log deliverables
    const allProductionItems: any[] = [];
    for (const c of dbClients) {
      const storeData = getClientPortalData(c.id, c.companyName);
      const prodLog = Array.isArray(storeData?.delivery?.productionLog)
        ? storeData.delivery.productionLog
        : [];
      prodLog.forEach((item: any) => {
        allProductionItems.push({
          ...item,
          clientId: c.id,
          clientName: c.companyName,
          clientCode: getCode(c.companyName, c.clientNumber),
        });
      });
    }

    // Reference targets & team summary
    const clientTargets = [
      { type: "Viral Reels / Short Videos", target: 30, completed: 21, inProgress: 6, remaining: 3, deadline: "Mon, Wed, Fri" },
      { type: "High-Engagement Carousels", target: 15, completed: 10, inProgress: 4, remaining: 1, deadline: "Tues & Sat" },
      { type: "Brand Identity Statics & Quotes", target: 15, completed: 11, inProgress: 3, remaining: 1, deadline: "Thursdays" },
      { type: "Interactive Daily Stories", target: 60, completed: 42, inProgress: 12, remaining: 6, deadline: "Daily (2-3/day)" },
      { type: "Performance Ad Creatives (Meta & Google)", target: 8, completed: 5, inProgress: 2, remaining: 1, deadline: "Bi-Monthly Refresh" },
    ];

    const teamSummary = [
      { role: "Creative Lead & Strategist", name: "Rahul Sharma", assigned: 25, completed: 18, pending: 7, turnaround: "24h" },
      { role: "Senior Video Editor", name: "Sumit Rathod", assigned: 30, completed: 21, pending: 9, turnaround: "48h" },
      { role: "Motion & Graphic Designer", name: "Aryan Visuals", assigned: 25, completed: 17, pending: 8, turnaround: "24h" },
      { role: "Copywriter & SMM", name: "Neha Roy", assigned: 45, completed: 32, pending: 13, turnaround: "12h" },
    ];

    const extraWork = [
      { id: "ew-1", date: "2026-10-09", request: "Emergency Diwali Campaign Banner Adaptations", requestedBy: "Client Head", status: "Completed", billable: "Covered in SLA" },
      { id: "ew-2", date: "2026-10-13", request: "Rush PR Launch Video 30s", requestedBy: "Founder", status: "Delivered", billable: "Complimentary" },
    ];

    const howToUse = {
      driveFolder: "https://drive.google.com/drive/folders/mdz-agency-client-master",
      rules: [
        "Raw Footage Upload: Drop high-resolution camera assets in Google Drive '01_Raw_Footage' 72 hours before target release.",
        "Client Review SLA: Review drafts within 24-48 hours. Mark comments directly in the Drive preview or approve with one click.",
        "Revisions Included: Each deliverable includes 2 rounds of standard feedback and editorial polish.",
        "Publishing: Approved assets are auto-scheduled in Meta Business Suite / Buffer based on prime engagement hours.",
      ],
    };

    return NextResponse.json({
      success: true,
      data: {
        monthYear: masterData.monthYear || "October 2026",
        subtitle: masterData.subtitle || "October 2026 working plan • counts update from Production Log • all task completion times and Google Drive links are manually entered",
        kpis: {
          planned: masterPlanned,
          completed: masterCompleted,
          remaining: masterRemaining,
          onHold: masterOnHold,
          overdue: masterOverdue,
          inProgress: masterInProgress,
          published: masterPublished,
          completionPct: masterCompletionPct,
          missingLinks: masterMissingLinks,
          unassigned: masterUnassigned,
        },
        clientStatusList: sanitizedClientRows,
        productionLog: allProductionItems,
        clientTargets,
        teamSummary,
        extraWork,
        howToUse,
      },
    });
  } catch (error) {
    console.error("Delivery control fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch delivery control data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN", "SUB_ADMIN", "SALES", "EMPLOYEE", "CLIENT"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { action } = body;

    // 1. Update single client row in delivery master
    if (action === "UPDATE_CLIENT_ROW") {
      const { row } = body;
      if (!row || !row.id) {
        return NextResponse.json({ success: false, error: "Missing row data" }, { status: 400 });
      }

      const master = getDeliveryMasterData();
      const updatedList = master.clientStatusList.map((item) => {
        if (item.id === row.id || item.clientCode === row.clientCode) {
          const target = Number(row.target) || 0;
          const done = Number(row.done) || 0;
          const inProgress = Number(row.inProgress) || 0;
          const onHold = Number(row.onHold) || 0;
          const overdue = Number(row.overdue) || 0;
          const missingLinks = Number(row.missingLinks) || 0;
          const unassigned = Number(row.unassigned) || 0;
          const pending = Math.max(0, target - done);
          const completionPct = target > 0 ? Math.round((done / target) * 100) : 0;

          return {
            ...item,
            ...row,
            target,
            done,
            pending,
            inProgress,
            onHold,
            overdue,
            completionPct,
            missingLinks,
            unassigned,
          };
        }
        return item;
      });

      saveDeliveryMasterData({ clientStatusList: updatedList });
      return NextResponse.json({ success: true, message: "Client target row updated successfully" });
    }

    // 2. Bulk update all client rows in delivery master
    if (action === "UPDATE_ALL_CLIENT_ROWS") {
      const { rows } = body;
      if (!Array.isArray(rows)) {
        return NextResponse.json({ success: false, error: "Rows must be an array" }, { status: 400 });
      }

      const sanitized: ClientDeliveryStatus[] = rows.map((r: any) => {
        const target = Number(r.target) || 0;
        const done = Number(r.done) || 0;
        const inProgress = Number(r.inProgress) || 0;
        const onHold = Number(r.onHold) || 0;
        const overdue = Number(r.overdue) || 0;
        const missingLinks = Number(r.missingLinks) || 0;
        const unassigned = Number(r.unassigned) || 0;
        const pending = Math.max(0, target - done);
        const completionPct = target > 0 ? Math.round((done / target) * 100) : 0;

        return {
          id: r.id || `cl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          clientCode: (r.clientCode || "CLI").toUpperCase().trim(),
          clientName: r.clientName || "Client Account",
          target,
          done,
          pending,
          inProgress,
          onHold,
          overdue,
          completionPct,
          missingLinks,
          unassigned,
        };
      });

      saveDeliveryMasterData({ clientStatusList: sanitized });
      return NextResponse.json({ success: true, message: "All client targets saved successfully" });
    }

    // 3. Add a new client row to delivery master
    if (action === "ADD_CLIENT_ROW") {
      const { clientCode, clientName, target } = body;
      const master = getDeliveryMasterData();
      const numTarget = Number(target) || 0;
      const newRow: ClientDeliveryStatus = {
        id: `cl-${Date.now()}`,
        clientCode: (clientCode || "NEW").toUpperCase().trim(),
        clientName: clientName || "New Client Account",
        target: numTarget,
        done: 0,
        pending: numTarget,
        inProgress: 0,
        onHold: 0,
        overdue: 0,
        completionPct: 0,
        missingLinks: 0,
        unassigned: numTarget,
      };

      const updated = [...master.clientStatusList, newRow];
      saveDeliveryMasterData({ clientStatusList: updated });
      return NextResponse.json({ success: true, message: "Client added successfully", data: newRow });
    }

    // 4. Delete client row from delivery master
    if (action === "DELETE_CLIENT_ROW") {
      const { id } = body;
      const master = getDeliveryMasterData();
      const filtered = master.clientStatusList.filter((item) => item.id !== id);
      saveDeliveryMasterData({ clientStatusList: filtered });
      return NextResponse.json({ success: true, message: "Client row removed successfully" });
    }

    // Production log deliverable actions
    const { clientId, deliverable } = body;
    let targetClientId = clientId;
    if (!targetClientId) {
      const firstClient = await prisma.client.findFirst();
      if (!firstClient) {
        return NextResponse.json({ success: false, error: "No client found" }, { status: 404 });
      }
      targetClientId = firstClient.id;
    }

    const client = await prisma.client.findUnique({ where: { id: targetClientId } });
    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    const storeData = getClientPortalData(targetClientId, client.companyName);
    const delivery = storeData.delivery || {};
    const productionLog = Array.isArray(delivery.productionLog) ? delivery.productionLog : [];

    if (action === "ADD_DELIVERABLE") {
      const newDeliverable = {
        id: `pl-${Date.now()}`,
        date: deliverable.date || new Date().toISOString().split("T")[0],
        deliverable: deliverable.deliverable || "New Content Deliverable",
        deliverableTitle: deliverable.deliverable || "New Content Deliverable",
        format: deliverable.format || "Reel",
        editor: deliverable.editor || "Video Editor",
        assignee: deliverable.editor || "Video Editor",
        rawLink: deliverable.rawLink || "",
        finalLink: deliverable.finalLink || "",
        driveLink: deliverable.finalLink || deliverable.rawLink || "",
        reviewStatus: deliverable.reviewStatus || "Drafting",
        publishedStatus: deliverable.publishedStatus || "In Production",
        status: deliverable.status || "IN_PROGRESS",
      };

      delivery.productionLog = [newDeliverable, ...productionLog];
      saveClientPortalData(targetClientId, { delivery });

      return NextResponse.json({ success: true, message: "Deliverable added successfully", data: newDeliverable });
    }

    if (action === "UPDATE_STATUS") {
      const { id, reviewStatus, publishedStatus, status } = body;
      delivery.productionLog = productionLog.map((item: any) => {
        if (item.id === id) {
          return {
            ...item,
            reviewStatus: reviewStatus !== undefined ? reviewStatus : item.reviewStatus,
            publishedStatus: publishedStatus !== undefined ? publishedStatus : item.publishedStatus,
            status: status !== undefined ? status : item.status,
          };
        }
        return item;
      });

      saveClientPortalData(targetClientId, { delivery });
      return NextResponse.json({ success: true, message: "Status updated successfully" });
    }

    if (action === "UPDATE_DRIVE_LINK") {
      const { id, finalLink, driveLink } = body;
      delivery.productionLog = productionLog.map((item: any) => {
        if (item.id === id) {
          return {
            ...item,
            finalLink: finalLink || item.finalLink,
            driveLink: driveLink || finalLink || item.driveLink,
          };
        }
        return item;
      });

      saveClientPortalData(targetClientId, { delivery });
      return NextResponse.json({ success: true, message: "Drive link updated successfully" });
    }

    if (action === "EDIT_DELIVERABLE") {
      const { deliverable: deliv } = body;
      delivery.productionLog = productionLog.map((item: any) => {
        if (item.id === deliv.id) {
          return {
            ...item,
            ...deliv,
            deliverable: deliv.deliverable || item.deliverable,
            deliverableTitle: deliv.deliverable || item.deliverableTitle,
          };
        }
        return item;
      });

      saveClientPortalData(targetClientId, { delivery });
      return NextResponse.json({ success: true, message: "Deliverable updated successfully" });
    }

    if (action === "DELETE_DELIVERABLE") {
      const { id } = body;
      delivery.productionLog = productionLog.filter((item: any) => item.id !== id);

      saveClientPortalData(targetClientId, { delivery });
      return NextResponse.json({ success: true, message: "Deliverable deleted successfully" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Delivery control save error:", error);
    return NextResponse.json({ success: false, error: "Failed to update delivery control" }, { status: 500 });
  }
}
