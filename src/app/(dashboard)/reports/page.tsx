import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, ChevronRight } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { REPORT_LIST } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session || !can(session.role, "reports.view")) redirect("/dashboard");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Reports</h1>
        <p className="text-sm text-ink-muted">View and export operational reports.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_LIST.map((r) => (
          <Link key={r.key} href={`/reports/${r.key}`} className="group flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card transition hover:border-brand-300 hover:shadow-glass dark:border-white/10 dark:bg-[rgb(var(--surface))]">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">{r.label}</h3>
                <ChevronRight className="h-4 w-4 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </div>
              <p className="mt-1 text-xs text-ink-muted">{r.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
