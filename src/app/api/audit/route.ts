import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // 1. Fetch System ActivityEvents
    const activityEvents = await prisma.activityEvent.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: { id: true, name: true, email: true, designation: true },
        },
      },
    });

    // 2. Fetch Lead Activities
    const leadActivities = await prisma.leadActivity.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        lead: {
          select: { id: true, leadNumber: true, companyName: true, contactPerson: true },
        },
      },
    });

    // 3. Fetch Terms Acceptance Logs
    const termsLogs = await prisma.termsAcceptanceLog.findMany({
      take: 50,
      orderBy: { acceptedAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, designation: true },
        },
        terms: {
          select: { id: true, title: true, version: true },
        },
      },
    });

    // 4. Fetch Leave Requests (Approved/Rejected/Created)
    const leaveRequests = await prisma.leaveRequest.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          include: {
            user: {
              select: { id: true, name: true, email: true, designation: true },
            },
          },
        },
        approvedBy: {
          select: { id: true, name: true },
        },
      },
    });

    // 5. Fetch Client / Project Updates
    const clientUpdates = await prisma.clientUpdate.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, designation: true },
        },
        project: {
          select: { id: true, name: true, projectNumber: true },
        },
      },
    });

    // Normalize all feeds into a unified audit stream
    const unifiedEvents: any[] = [];

    activityEvents.forEach((evt) => {
      let parsedDetails = evt.metadataJson;
      try {
        if (evt.metadataJson && (evt.metadataJson.startsWith("{") || evt.metadataJson.startsWith("["))) {
          const parsed = JSON.parse(evt.metadataJson);
          if (parsed.message) parsedDetails = parsed.message;
          else if (parsed.reason) parsedDetails = parsed.reason;
          else if (parsed.notes) parsedDetails = parsed.notes;
        }
      } catch {
        // Keep as string
      }

      unifiedEvents.push({
        id: evt.id,
        type: evt.eventType || "SYSTEM_EVENT",
        category: getEventCategory(evt.eventType, evt.entityType),
        actor: evt.actor?.name || "System Automated",
        actorEmail: evt.actor?.email,
        actorRole: evt.actor?.designation || "Admin",
        entity: `${evt.entityType || "Entity"} (${evt.entityId || "Global"})`,
        entityType: evt.entityType,
        entityId: evt.entityId,
        projectId: evt.projectId,
        details: parsedDetails || `Triggered ${evt.eventType} on ${evt.entityType}`,
        rawMetadata: evt.metadataJson,
        createdAt: evt.createdAt.toISOString(),
      });
    });

    leadActivities.forEach((la) => {
      unifiedEvents.push({
        id: la.id,
        type: la.action || "LEAD_ACTION",
        category: "SALES",
        actor: "Sales Team",
        actorEmail: null,
        actorRole: "Sales Executive",
        entity: `Lead ${la.lead?.leadNumber || la.leadId} (${la.lead?.companyName || la.lead?.contactPerson || "Lead"})`,
        entityType: "LEAD",
        entityId: la.leadId,
        details: la.detailsJson || `Lead updated: ${la.action}`,
        rawMetadata: la.detailsJson,
        createdAt: la.createdAt.toISOString(),
      });
    });

    termsLogs.forEach((tl) => {
      unifiedEvents.push({
        id: tl.id,
        type: "TERMS_ACCEPTED",
        category: "COMPLIANCE",
        actor: tl.user?.name || "User",
        actorEmail: tl.user?.email,
        actorRole: tl.user?.designation || "Employee",
        entity: `Terms ${tl.termsVersion} (${tl.targetAudience})`,
        entityType: "TERMS",
        entityId: tl.termsId || "",
        details: `Formally reviewed and accepted terms version ${tl.termsVersion} via IP ${tl.ipAddress || "Verified Session"}`,
        rawMetadata: null,
        createdAt: tl.acceptedAt.toISOString(),
      });
    });

    leaveRequests.forEach((lr) => {
      const empName = lr.employee?.user?.name || "Employee";
      const empRole = lr.employee?.user?.designation || "Staff";
      unifiedEvents.push({
        id: lr.id,
        type: lr.status === "APPROVED" ? "LEAVE_APPROVED" : lr.status === "REJECTED" ? "LEAVE_REJECTED" : "LEAVE_APPLIED",
        category: "HR",
        actor: lr.status === "APPROVED" && lr.approvedBy ? lr.approvedBy.name : empName,
        actorEmail: lr.employee?.user?.email || null,
        actorRole: empRole,
        entity: `Leave Application (${lr.leaveType})`,
        entityType: "LEAVE",
        entityId: lr.id,
        details: `${empName} applied for ${lr.days} day(s) ${lr.leaveType} leave: "${lr.reason}". Status: ${lr.status}${lr.rejectionReason ? ` (${lr.rejectionReason})` : ""}`,
        rawMetadata: null,
        createdAt: lr.createdAt.toISOString(),
      });
    });

    clientUpdates.forEach((cu) => {
      unifiedEvents.push({
        id: cu.id,
        type: "PROJECT_UPDATE_POSTED",
        category: "PROJECTS",
        actor: cu.author?.name || "Project Lead",
        actorEmail: null,
        actorRole: cu.author?.designation || "Project Manager",
        entity: `Project ${cu.project?.projectNumber || ""} (${cu.project?.name || "Project"})`,
        entityType: "PROJECT",
        entityId: cu.projectId,
        details: `"${cu.title}": ${cu.content}`,
        rawMetadata: null,
        createdAt: cu.createdAt.toISOString(),
      });
    });

    // Sort by timestamp descending
    unifiedEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Filter by category if requested
    const filtered = category && category !== "ALL"
      ? unifiedEvents.filter((e) => e.category === category)
      : unifiedEvents;

    return NextResponse.json({
      success: true,
      data: filtered.slice(0, limit),
      total: unifiedEvents.length,
    });
  } catch (error) {
    console.error("GET /api/audit error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch audit events", data: [] }, { status: 500 });
  }
}

function getEventCategory(eventType: string = "", entityType: string = ""): string {
  const t = (eventType + " " + entityType).toUpperCase();
  if (t.includes("PROJECT") || t.includes("TASK") || t.includes("MILESTONE")) return "PROJECTS";
  if (t.includes("LEAD") || t.includes("CLIENT") || t.includes("INQUIRY") || t.includes("SALES")) return "SALES";
  if (t.includes("TERMS") || t.includes("SECURITY") || t.includes("AUTH") || t.includes("COMPLIANCE")) return "COMPLIANCE";
  if (t.includes("PAYMENT") || t.includes("INVOICE") || t.includes("BUDGET") || t.includes("FINANCE") || t.includes("COMPENSATION")) return "FINANCE";
  if (t.includes("HOLIDAY") || t.includes("LEAVE") || t.includes("ATTENDANCE") || t.includes("EMPLOYEE")) return "HR";
  return "SYSTEM";
}
