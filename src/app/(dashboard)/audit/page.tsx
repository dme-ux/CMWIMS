import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await getSession();
  if (!session || !can(session.role, "settings.manage")) redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 300 });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Audit Log</h1>
        <p className="text-sm text-ink-muted">Every create, update, and key action across the system.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {logs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-16 text-center text-ink-muted">No activity recorded yet.</td></tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{formatDate(l.createdAt)}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{l.user?.name || "System"}</td>
                  <td className="px-4 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">{l.action}</span></td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{l.entity}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{l.detail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
