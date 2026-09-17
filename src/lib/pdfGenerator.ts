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
