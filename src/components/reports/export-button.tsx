"use client";

import { Download } from "lucide-react";

/** Client-side CSV export (opens directly in Excel). */
export function ExportButton({ columns, rows, filename }: { columns: string[]; rows: (string | number)[][]; filename: string }) {
  function toCSV() {
    const esc = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [columns.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))];
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={toCSV} disabled={rows.length === 0} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50 dark:border-white/10 dark:text-brand-200">
      <Download className="h-4 w-4" /> Export CSV
    </button>
  );
}
