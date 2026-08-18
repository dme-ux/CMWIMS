import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageCheck, ArrowDownToLine, MapPin, History } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getReceivablePOs } from "@/lib/inward";
import { getIssuableItems } from "@/lib/outward";
import { getLocationMasters } from "@/lib/stock";
import { getStockMovements, locationText } from "@/lib/stock-ledger";
import { poStatusMeta } from "@/lib/purchase";
import { inr, formatDate } from "@/lib/utils";
import { DirectInForm } from "@/components/inward/direct-in-form";

export const dynamic = "force-dynamic";

function dt(v: Date) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(v);
}

export default async function InwardPage() {
  const session = await getSession();
  if (!session || !can(session.role, "purchase.manage")) redirect("/dashboard");
  const [orders, items, locations, history] = await Promise.all([
    getReceivablePOs(), getIssuableItems(), getLocationMasters(), getStockMovements({ direction: "IN" }, 200),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Inward · Material Receipt</h1><p className="text-sm text-ink-muted">Every new receipt is assigned to an exact warehouse/location and permanently timestamped.</p></div>
        <Link href="/inventory/ledger?direction=IN" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-600 dark:border-white/10"><History className="h-4 w-4" /> Full inward history</Link>
      </div>

      <DirectInForm items={items} locations={locations} />

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/5"><h3 className="font-display text-sm font-semibold">Inward history · latest first</h3><span className="text-xs text-ink-muted">Last {history.length} entries</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5"><tr><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Item / Part</th><th className="px-4 py-3">Exact Location</th><th className="px-4 py-3 text-right">Qty In</th><th className="px-4 py-3 text-right">Stock After</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">By</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {history.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-ink-muted">No inward entries yet.</td></tr>}
          {history.map((m) => <tr key={m.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5"><td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{dt(m.createdAt)}</td><td className="px-4 py-3"><div className="font-medium">{m.item.name}</div><div className="text-xs text-ink-muted">{m.item.sku}{m.item.partNumber ? ` · ${m.item.partNumber}` : ""}</div></td><td className="px-4 py-3 text-xs"><span className="inline-flex items-start gap-1"><MapPin className="mt-0.5 h-3 w-3 text-amber-500" />{locationText(m)}</span></td><td className="px-4 py-3 text-right font-semibold text-emerald-600">+{m.quantity}</td><td className="px-4 py-3 text-right">{m.newStock}</td><td className="px-4 py-3">{m.reference || "—"}</td><td className="px-4 py-3">{m.reason || m.type}</td><td className="px-4 py-3">{m.user?.name || "System / legacy"}</td></tr>)}
        </tbody></table></div>
      </div>

      <div>
        <h2 className="mb-2 font-display text-sm font-semibold text-ink-soft dark:text-slate-300">Receive against a purchase order</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5"><tr><th className="px-4 py-3">PO #</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {orders.length === 0 && <tr><td colSpan={6} className="px-4 py-16 text-center text-ink-muted"><ArrowDownToLine className="mx-auto mb-3 h-8 w-8 opacity-40" />Nothing to receive right now. Approve a PO to receive material against it.</td></tr>}
          {orders.map((po) => { const [label, cls] = poStatusMeta(po.status); return <tr key={po.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5"><td className="px-4 py-3 font-medium">{po.number}</td><td className="px-4 py-3">{po.vendor.name}</td><td className="px-4 py-3">{formatDate(po.orderDate)}</td><td className="px-4 py-3 text-right font-medium">{inr(po.grandTotal)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span></td><td className="px-4 py-3 text-right"><Link href={`/inward/${po.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"><PackageCheck className="h-3.5 w-3.5" /> Receive</Link></td></tr>; })}
        </tbody></table></div></div>
      </div>
    </div>
  );
}
