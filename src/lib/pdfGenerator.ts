import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ProposalPDFData {
  id: string;
  client: string;
  clientEmail?: string;
  clientPhone?: string;
  title: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  validUntil: string;
  createdAt: string;
  items?: Array<{
    id?: string;
    description: string;
    qty: number;
    rate: number;
  }>;
}

export function generateAndDownloadProposalPDF(q: ProposalPDFData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo #4f46e5
  const slateDark: [number, number, number] = [15, 23, 42]; // Slate-900 #0f172a
  const slateMuted: [number, number, number] = [100, 116, 139]; // Slate-500 #64748b

  // 1. Top Indigo Accent Header Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 8, "F");

  // 2. Company Brand & Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text("MDZ OS", 15, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...slateMuted);
  doc.text("COMMERCIAL PROPOSAL & SCOPE ESTIMATION", 15, 29);
  doc.text("Enterprise Dizital Solutions & Architecture", 15, 33);

  // Proposal Meta Box (Right-aligned)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...slateDark);
  doc.text("COMMERCIAL QUOTE", 195, 22, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...slateMuted);
  doc.text(`Proposal Ref: ${q.id}`, 195, 28, { align: "right" });
  doc.text(`Date Issued: ${q.createdAt || new Date().toLocaleDateString("en-IN")}`, 195, 32, { align: "right" });
  doc.text(`Valid Until: ${q.validUntil || "30 days from issue"}`, 195, 36, { align: "right" });
  doc.text(`Status: ${q.status || "DRAFT"}`, 195, 40, { align: "right" });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(15, 44, 195, 44);

  // 3. Client & Engagement Two-Box Layout
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 48, 87, 27, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 48, 87, 27, 2, 2, "D");

  doc.roundedRect(108, 48, 87, 27, 2, 2, "F");
  doc.roundedRect(108, 48, 87, 27, 2, 2, "D");

  // Client Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text("PREPARED FOR (CLIENT)", 19, 54);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...slateDark);
  doc.text(q.client || "Valued Enterprise Client", 19, 60);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...slateMuted);
  let clientY = 65;
  if (q.clientEmail) {
    doc.text(`Email: ${q.clientEmail}`, 19, clientY);
    clientY += 4;
  }
  if (q.clientPhone) {
    doc.text(`Phone: ${q.clientPhone}`, 19, clientY);
  }

  // Project Engagement Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text("ENGAGEMENT & PROPOSAL TITLE", 112, 54);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...slateDark);
  const titleLines = doc.splitTextToSize(q.title || "Custom Web & Platform Engineering", 79);
  doc.text(titleLines, 112, 60);

  // 4. Deliverables Table
  const validItems = q.items && q.items.length > 0
    ? q.items.filter(it => it.description || it.rate > 0)
    : [];

  const tableRows = (validItems.length > 0
    ? validItems
    : [{ description: q.title || "Custom Platform Engineering & Implementation", qty: 1, rate: q.subtotal || q.total }]
  ).map((it, idx) => [
    idx + 1,
    it.description || "Deliverable Specification",
    it.qty || 1,
    `INR ${(it.rate || 0).toLocaleString("en-IN")}`,
    `INR ${((it.qty || 1) * (it.rate || 0)).toLocaleString("en-IN")}`
  ]);

  autoTable(doc, {
    startY: 80,
    head: [["#", "Deliverable / Scope Specification", "Qty", "Unit Rate (INR)", "Amount (INR)"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 32, halign: "right" },
      4: { cellWidth: 35, halign: "right" },
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3.5,
      textColor: slateDark,
      overflow: "linebreak",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 15, right: 15 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 130;

  // 5. Commercial Breakdown & Terms Section
  const totalsBoxX = 118;
  const totalsBoxWidth = 77;
  const totalsStartY = finalY + 8;

  // Totals Box (Right)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(totalsBoxX, totalsStartY, totalsBoxWidth, 34, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(totalsBoxX, totalsStartY, totalsBoxWidth, 34, 2, 2, "D");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...slateMuted);
  doc.text("Subtotal:", totalsBoxX + 5, totalsStartY + 7);
  doc.text(`INR ${(q.subtotal || 0).toLocaleString("en-IN")}`, totalsBoxX + totalsBoxWidth - 5, totalsStartY + 7, { align: "right" });

  doc.text("GST (18%):", totalsBoxX + 5, totalsStartY + 14);
  doc.text(`INR ${(q.tax || 0).toLocaleString("en-IN")}`, totalsBoxX + totalsBoxWidth - 5, totalsStartY + 14, { align: "right" });

  doc.setDrawColor(226, 232, 240);
  doc.line(totalsBoxX + 5, totalsStartY + 18, totalsBoxX + totalsBoxWidth - 5, totalsStartY + 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...slateDark);
  doc.text("Grand Total:", totalsBoxX + 5, totalsStartY + 27);
  doc.setTextColor(...primaryColor);
  doc.text(`INR ${(q.total || 0).toLocaleString("en-IN")}`, totalsBoxX + totalsBoxWidth - 5, totalsStartY + 27, { align: "right" });

  // Terms Box (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...slateDark);
  doc.text("COMMERCIAL TERMS & PAYMENT SCHEDULE", 15, totalsStartY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...slateMuted);
  doc.text("• Milestone 1: 50% mobilization advance upon signing & project kickoff.", 15, totalsStartY + 13);
  doc.text("• Milestone 2: 30% upon beta / staging deployment and client review.", 15, totalsStartY + 18);
  doc.text("• Milestone 3: 20% upon final production launch & domain handover.", 15, totalsStartY + 23);
  doc.text("• Validity: This proposal is valid for 30 days from date of issuance.", 15, totalsStartY + 28);

  // 6. Signature Acceptance Blocks
  const sigY = totalsStartY + 45;
  if (sigY < 260) {
    doc.setDrawColor(203, 213, 225);
    doc.line(15, sigY + 15, 75, sigY + 15);
    doc.line(135, sigY + 15, 195, sigY + 15);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...slateDark);
    doc.text("MDZ OS Authorized Signatory", 15, sigY + 20);
    doc.text("Client Authorized Signatory", 135, sigY + 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...slateMuted);
    doc.text("Date & Company Seal", 15, sigY + 24);
    doc.text("Date & Signature / Acceptance", 135, sigY + 24);
  }

  // 7. Footer
  doc.setFillColor(...primaryColor);
  doc.rect(0, 287, 210, 10, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Generated by MDZ OS Commercial Architecture Platform • Strictly Confidential", 105, 293, { align: "center" });

  const sanitized = (q.client || "Client").replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`${q.id}_${sanitized}_Proposal.pdf`);
}

export interface ExecutiveBriefPDFData {
  executiveName: string;
  generatedAt: string;
  formattedDate: string;
  financialMetrics: {
    totalBilling: number;
    paidBilling: number;
    pendingBilling: number;
    overdueBilling: number;
    overdueInvoicesCount: number;
    pipelineValue: number;
    activeLeadsCount: number;
  };
  projectsSummary: {
    totalActiveProjects: number;
    delayedProjectsCount: number;
    onTrackProjectsCount: number;
    projects: Array<{
      projectNumber: string;
      name: string;
      clientName: string;
      status: string;
      priority: string;
      progressPercentage: number;
      targetDeadline: string;
      isDelayed: boolean;
      overdueTasksCount: number;
    }>;
  };
  exceptions: Array<{
    severity: string;
    title: string;
    description: string;
    project?: string;
    client?: string;
    time: string;
  }>;
  workforceMetrics: {
    totalEmployees: number;
    presentCount: number;
    onBreakCount: number;
    absentCount: number;
    attendancePercentage: number;
  };
}

export function generateAndDownloadExecutiveBriefPDF(data: ExecutiveBriefPDFData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo #4f46e5
  const slateDark: [number, number, number] = [15, 23, 42]; // Slate-900 #0f172a
  const slateMuted: [number, number, number] = [100, 116, 139]; // Slate-500 #64748b
  const dangerColor: [number, number, number] = [225, 29, 72]; // Rose-600 #e11d48
  const emeraldColor: [number, number, number] = [16, 185, 129]; // Emerald-500

  // 1. Accent Top Strip
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 8, "F");

  // 2. Header Brand & Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.text("MILLIONAIRE DIZITAL", 15, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...slateDark);
  doc.text("EXECUTIVE BRIEF & OPERATIONAL PERFORMANCE AUDIT", 15, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...slateMuted);
  doc.text("Automated Executive Intelligence Report • Confidential", 15, 33);

  // Right-aligned Metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...slateDark);
  doc.text(`Prepared For: ${data.executiveName} (Owner/Exec)`, 195, 22, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...slateMuted);
  doc.text(`Generated: ${data.formattedDate}`, 195, 27, { align: "right" });
  doc.text(`Security: STRICTLY CONFIDENTIAL`, 195, 32, { align: "right" });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(15, 37, 195, 37);

  // 3. Section 1: Financial Performance Highlights
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...slateDark);
  doc.text("1. FINANCIAL COMMAND METRICS", 15, 44);

  const fin = data.financialMetrics;
  const finTableRows = [
    [
      "Total Billing",
      `INR ${fin.totalBilling.toLocaleString("en-IN")}`,
      "Collected (Paid)",
      `INR ${fin.paidBilling.toLocaleString("en-IN")}`,
    ],
    [
      "Pending Invoices",
      `INR ${fin.pendingBilling.toLocaleString("en-IN")}`,
      "Overdue Payments",
      `INR ${fin.overdueBilling.toLocaleString("en-IN")} (${fin.overdueInvoicesCount} inv.)`,
    ],
    [
      "Sales Pipeline",
      `INR ${fin.pipelineValue.toLocaleString("en-IN")} (${fin.activeLeadsCount} active leads)`,
      "Collection Ratio",
      `${fin.totalBilling > 0 ? Math.round((fin.paidBilling / fin.totalBilling) * 100) : 100}% of billed volume`,
    ],
  ];

  autoTable(doc, {
    startY: 47,
    head: [["Metric Category", "Amount", "Metric Category", "Amount / Status"]],
    body: finTableRows,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      textColor: slateDark,
    },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: "bold" },
      1: { cellWidth: 45 },
      2: { cellWidth: 45, fontStyle: "bold" },
      3: { cellWidth: 45 },
    },
    margin: { left: 15, right: 15 },
  });

  let currentY = (doc as any).lastAutoTable?.finalY || 80;

  // 4. Section 2: Active Projects Health & Deadlines
  currentY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...slateDark);
  doc.text(`2. ACTIVE PROJECTS & DELIVERY STATUS (${data.projectsSummary.totalActiveProjects} Projects)`, 15, currentY);

  const prjRows = (data.projectsSummary.projects || []).slice(0, 10).map((p) => [
    p.projectNumber || "-",
    p.name,
    p.clientName,
    p.targetDeadline,
    `${p.progressPercentage}%`,
    p.isDelayed ? "DELAYED / URGENT" : "ON TRACK",
  ]);

  if (prjRows.length === 0) {
    prjRows.push(["-", "No active projects found", "-", "-", "0%", "N/A"]);
  }

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Code", "Project Name", "Client", "Deadline", "Progress", "Health"]],
    body: prjRows,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: slateDark,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 30, halign: "center" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 15, right: 15 },
  });

  currentY = (doc as any).lastAutoTable?.finalY || 135;

  // 5. Section 3: Operational Escalations & Needs Attention
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 8;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...slateDark);
  doc.text(`3. OPERATIONAL ESCALATIONS & EXCEPTIONS (${data.exceptions.length} Items)`, 15, currentY);

  const excRows = (data.exceptions || []).slice(0, 12).map((e) => [
    e.severity,
    e.title,
    e.time || "-",
    e.project || e.client || "System",
  ]);

  if (excRows.length === 0) {
    excRows.push(["ON TRACK", "All operations running on schedule — zero active escalations", "-", "All Systems"]);
  }

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Severity", "Roadblock / Issue Description", "Overdue / Status", "Entity Context"]],
    body: excRows,
    theme: "striped",
    headStyles: {
      fillColor: dangerColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: slateDark,
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: "bold" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 35 },
      3: { cellWidth: 40 },
    },
    alternateRowStyles: {
      fillColor: [255, 241, 242],
    },
    margin: { left: 15, right: 15 },
  });

  currentY = (doc as any).lastAutoTable?.finalY || 190;

  // 6. Section 4: Workforce Capacity & Realtime Attendance
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 8;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...slateDark);
  doc.text("4. WORKFORCE ATTENDANCE & OPERATIONAL CAPACITY", 15, currentY);

  const wf = data.workforceMetrics;
  const wfTableRows = [
    [
      "Total Active Employees",
      String(wf.totalEmployees),
      "Present Today",
      `${wf.presentCount} (${wf.attendancePercentage}%)`,
    ],
    [
      "On Break / Lunch",
      String(wf.onBreakCount),
      "Absent / Not Punched In",
      String(wf.absentCount),
    ],
  ];

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Workforce Metric", "Value", "Workforce Metric", "Value"]],
    body: wfTableRows,
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      textColor: slateDark,
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: "bold" },
      1: { cellWidth: 40 },
      2: { cellWidth: 50, fontStyle: "bold" },
      3: { cellWidth: 40 },
    },
    margin: { left: 15, right: 15 },
  });

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...primaryColor);
    doc.rect(0, 287, 210, 10, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `Millionaire Dizital OS • Founder Command Brief • Page ${i} of ${totalPages} • Confidential`,
      105,
      293,
      { align: "center" }
    );
  }

  const dateSlug = new Date().toISOString().slice(0, 10);
  doc.save(`MDZ_Executive_Brief_${dateSlug}.pdf`);
}

