import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Search, MapPin, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getIssuableItems } from "@/lib/outward";
import { getLedgerMasters, getStockMovements, locationText, movementLabel } from "@/lib/stock-ledger";
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form";

export const dynamic = "force-dynamic";

function dt(v: Date) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(v);
}

export default async function StockLedgerPage({ searchParams }: { searchParams: Promise<{ q?: string; itemId?: string; warehouseId?: string; direction?: string; from?: string; to?: string }> }) {
  const session = await getSession();
  if (!session || !can(session.role, "inventory.view")) redirect("/dashboard");
  const sp = await searchParams;
  const direction = sp.direction === "IN" || sp.direction === "OUT" ? sp.direction : "ALL";
  const [movements, masters, adjustmentItems] = await Promise.all([
    getStockMovements({ q: sp.q, itemId: sp.itemId, warehouseId: sp.warehouseId, direction, from: sp.from, to: sp.to }, 500),
    getLedgerMasters(),
    getIssuableItems(),
  ]);
  const canManage = can(session.role, "inventory.manage");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/inventory" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600"><ArrowLeft className="h-3.5 w-3.5" /> Inventory</Link>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Stock Ledger · Movement History</h1>
          <p className="text-sm text-ink-muted">Permanent IN / OUT / adjustment trail with exact timestamp, user and physical location.</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm text-ink-muted dark:bg-white/5">Showing latest <b className="text-ink dark:text-slate-100">{movements.length}</b> matching entries</div>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card md:grid-cols-3 xl:grid-cols-7 dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <label className="xl:col-span-2 text-xs font-medium text-ink-muted">Search<input name="q" defaultValue={sp.q || ""} placeholder="Part, SKU, OEM, reference, reason..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" /></label>
        <label className="text-xs font-medium text-ink-muted">Item<select name="itemId" defaultValue={sp.itemId || ""} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"><option value="">All items</option>{masters.items.map((it) => <option key={it.id} value={it.id}>{it.name} · {it.sku}</option>)}</select></label>
        <label className="text-xs font-medium text-ink-muted">Warehouse<select name="warehouseId" defaultValue={sp.warehouseId || ""} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"><option value="">All warehouses</option>{masters.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
        <label className="text-xs font-medium text-ink-muted">Movement<select name="direction" defaultValue={direction} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"><option value="ALL">IN + OUT</option><option value="IN">IN only</option><option value="OUT">OUT only</option></select></label>
        <label className="text-xs font-medium text-ink-muted">From<input name="from" type="date" defaultValue={sp.from || ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" /></label>
        <label className="text-xs font-medium text-ink-muted">To<input name="to" type="date" defaultValue={sp.to || ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" /></label>
        <div className="flex items-end gap-2 xl:col-span-7"><button className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"><Search className="h-4 w-4" /> Apply filters</button><Link href="/inventory/ledger" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium dark:border-white/10">Clear</Link></div>
      </form>

      {canManage && <StockAdjustmentForm items={adjustmentItems as any} />}

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5"><tr><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">IN / OUT</th><th className="px-4 py-3">Item / Part</th><th className="px-4 py-3">Exact Location</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Before</th><th className="px-4 py-3 text-right">After</th><th className="px-4 py-3">Reason / Type</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Note</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {movements.length === 0 && <tr><td colSpan={11} className="px-4 py-14 text-center text-ink-muted">No stock movement found for these filters.</td></tr>}
              {movements.map((m) => {
                const directionLabel = movementLabel(m);
                const isIn = directionLabel === "IN";
                return <tr key={m.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{dt(m.createdAt)}</td>
                  <td className="px-4 py-3">{isIn ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"><ArrowDownToLine className="h-3 w-3" /> IN</span> : <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700"><ArrowUpFromLine className="h-3 w-3" /> OUT</span>}</td>
                  <td className="px-4 py-3"><div className="font-medium text-ink dark:text-slate-100">{m.item.name}</div><div className="text-xs text-ink-muted">{m.item.sku}{m.item.partNumber ? ` · ${m.item.partNumber}` : ""}</div></td>
                  <td className="px-4 py-3 text-xs"><span className="inline-flex items-start gap-1"><MapPin className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />{locationText(m)}</span></td>
                  <td className={`px-4 py-3 text-right font-semibold ${isIn ? "text-emerald-600" : "text-red-600"}`}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}{m.item.unit ? ` ${m.item.unit.name}` : ""}</td>
                  <td className="px-4 py-3 text-right">{m.oldStock}</td><td className="px-4 py-3 text-right font-medium">{m.newStock}</td>
                  <td className="px-4 py-3"><div className="font-medium">{m.reason || m.type}</div><div className="text-[11px] text-ink-muted">{m.type}</div></td>
                  <td className="px-4 py-3">{m.reference || "—"}</td><td className="px-4 py-3">{m.user?.name || "System / legacy"}</td><td className="max-w-[220px] px-4 py-3 text-xs text-ink-muted">{m.locationNote || "—"}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
