import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { REPORTS } from "@/lib/reports";
import { ExportButton } from "@/components/reports/export-button";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ report: string }> }) {
  const { report } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "reports.view")) redirect("/dashboard");

  const def = REPORTS[report];
  if (!def) notFound();
  const { columns, rows } = await def.fetch();

  return (
    <div className="space-y-5">
      <Link href="/reports" className="flex items-center gap-2 text-sm text-ink-muted hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> All reports
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">{def.label}</h1>
          <p className="text-sm text-ink-muted">{rows.length} row{rows.length === 1 ? "" : "s"} · {def.description}</p>
        </div>
        <ExportButton columns={columns} rows={rows} filename={def.key} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>{columns.map((c) => <th key={c} className="px-4 py-3 whitespace-nowrap">{c}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {rows.length === 0 && (
                <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-ink-muted">No data for this report.</td></tr>
              )}
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                  {row.map((cell, j) => <td key={j} className="px-4 py-3 whitespace-nowrap text-ink-soft dark:text-slate-300">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
