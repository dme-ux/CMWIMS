import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageCheck, ArrowDownToLine } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getReceivablePOs } from "@/lib/inward";
import { poStatusMeta } from "@/lib/purchase";
import { inr, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InwardPage() {
  const session = await getSession();
  if (!session || !can(session.role, "purchase.manage")) redirect("/dashboard");
  const orders = await getReceivablePOs();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Inward · Material Receipt</h1>
        <p className="text-sm text-ink-muted">Purchase orders awaiting receipt.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">PO #</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {orders.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-ink-muted">
                  <ArrowDownToLine className="mx-auto mb-3 h-8 w-8 opacity-40" />
                  Nothing to receive right now. Approve a PO to receive material against it.
                </td></tr>
              )}
              {orders.map((po) => {
                const [label, cls] = poStatusMeta(po.status);
                return (
                  <tr key={po.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-ink dark:text-slate-100">{po.number}</td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{po.vendor.name}</td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{formatDate(po.orderDate)}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(po.grandTotal)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/inward/${po.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
                        <PackageCheck className="h-3.5 w-3.5" /> Receive
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
