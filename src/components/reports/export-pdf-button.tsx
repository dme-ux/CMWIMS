"use client";

import { FileDown } from "lucide-react";

/**
 * Client-side "professional" PDF export — CMW-branded header band, a
 * striped data table, and a footer with generation date + page numbers.
 * Used next to the existing CSV export button on every report/list.
 */
export function ExportPdfButton({
  title,
  subtitle,
  columns,
  rows,
  filename,
}: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
  filename: string;
}) {
  async function toPDF() {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const landscape = columns.length > 6;
    const doc = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header band
    doc.setFillColor(26, 43, 76); // brand navy
    doc.rect(0, 0, pageWidth, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Capital Motor Works", 12, 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("CMW ERP · Smart Inventory & Workshop Management", 12, 16.5);
    doc.setFontSize(8);
    doc.text(new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), pageWidth - 12, 11, { align: "right" });

    // Title
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, 12, 29);
    let startY = 34;
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitle, 12, 34.5);
      doc.setTextColor(20, 20, 20);
      startY = 39;
    }

    autoTable(doc, {
      startY,
      head: [columns],
      body: rows.map((r) => r.map((c) => String(c ?? ""))),
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [40, 40, 40] },
      headStyles: { fillColor: [26, 43, 76], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 248, 251] },
      margin: { left: 12, right: 12 },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 140);
      doc.text("Powered by SystemMaster", 12, pageHeight - 7);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 12, pageHeight - 7, { align: "right" });
    }

    doc.save(`${filename}.pdf`);
  }

  return (
    <button
      onClick={toPDF}
      disabled={rows.length === 0}
      className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50 dark:border-white/10 dark:text-brand-200"
    >
      <FileDown className="h-4 w-4" /> Export PDF
    </button>
  );
}
