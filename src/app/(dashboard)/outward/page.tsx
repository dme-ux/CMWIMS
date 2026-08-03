import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getIssuableItems, getRecentIssues, ISSUE_REASONS } from "@/lib/outward";
import { formatDate } from "@/lib/utils";
import { IssueForm } from "@/components/outward/issue-form";

export const dynamic = "force-dynamic";

export default async function OutwardPage() {
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) redirect("/dashboard");

  const [items, recent] = await Promise.all([getIssuableItems(), getRecentIssues()]);
  const reasons = ISSUE_REASONS.map((r) => ({ value: r.value, label: r.label }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Outward · Issue Material</h1>
        <p className="text-sm text-ink-muted">Issue stock for workshop, sales, transfers or adjustments.</p>
      </div>

      <IssueForm items={items} reasons={reasons} />

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="border-b border-slate-100 px-5 py-3 dark:border-white/5">
          <h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Recent issues</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Stock after</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {recent.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-muted">No material issued yet.</td></tr>
              )}
              {recent.map((m) => (
                <tr key={m.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{formatDate(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink dark:text-slate-100">{m.item.name}</div>
                    <div className="text-xs text-ink-muted">{m.item.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{m.reason || m.type}</td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">{m.quantity}</td>
                  <td className="px-4 py-3 text-right">{m.newStock}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{m.reference || "—"}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{m.user?.name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
