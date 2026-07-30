import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ShoppingCart } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getPurchaseOrders, poStatusMeta } from "@/lib/purchase";
import { inr, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PurchasePage() {
  const session = await getSession();
  if (!session || !can(session.role, "purchase.view")) redirect("/dashboard");
  const canManage = can(session.role, "purchase.manage");
  const orders = await getPurchaseOrders();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Purchase Orders</h1>
          <p className="text-sm text-ink-muted">{orders.length} order{orders.length === 1 ? "" : "s"}</p>
        </div>
        {canManage && (
          <Link href="/purchase/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glass hover:bg-brand-700">
            <Plus className="h-4 w-4" /> New PO
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">PO #</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {orders.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-ink-muted">
                  <ShoppingCart className="mx-auto mb-3 h-8 w-8 opacity-40" />
                  No purchase orders yet.{canManage && " Create your first PO."}
                </td></tr>
              )}
              {orders.map((po) => {
                const [label, cls] = poStatusMeta(po.status);
                return (
                  <tr key={po.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <Link href={`/purchase/${po.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-300">{po.number}</Link>
                    </td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{po.vendor.name}</td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{formatDate(po.orderDate)}</td>
                    <td className="px-4 py-3 text-right">{po._count.items}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(po.grandTotal)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span></td>
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
