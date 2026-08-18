import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, History } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getIssuableItems, ISSUE_REASONS } from "@/lib/outward";
import { getStockMovements, locationText } from "@/lib/stock-ledger";
import { IssueForm } from "@/components/outward/issue-form";

export const dynamic = "force-dynamic";

function dt(v: Date) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(v);
}

export default async function OutwardPage() {
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) redirect("/dashboard");
  const [items, history] = await Promise.all([getIssuableItems(), getStockMovements({ direction: "OUT" }, 200)]);
  const reasons = ISSUE_REASONS.map((r) => ({ value: r.value, label: r.label }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Outward · Issue Material</h1><p className="text-sm text-ink-muted">Issue from exact Warehouse → Rack → Shelf → Bin. Every issue stays in permanent timestamp history.</p></div><Link href="/inventory/ledger?direction=OUT" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-600 dark:border-white/10"><History className="h-4 w-4" /> Full outward history</Link></div>
      <IssueForm items={items} reasons={reasons} />
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/5"><h3 className="font-display text-sm font-semibold">Outward history · latest first</h3><span className="text-xs text-ink-muted">Last {history.length} entries</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5"><tr><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Item / Part</th><th className="px-4 py-3">Exact Location</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3 text-right">Qty Out</th><th className="px-4 py-3 text-right">Stock After</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3">By</th><th className="px-4 py-3">Note</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {history.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-ink-muted">No material issued yet.</td></tr>}
          {history.map((m) => <tr key={m.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5"><td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{dt(m.createdAt)}</td><td className="px-4 py-3"><div className="font-medium">{m.item.name}</div><div className="text-xs text-ink-muted">{m.item.sku}{m.item.partNumber ? ` · ${m.item.partNumber}` : ""}</div></td><td className="px-4 py-3 text-xs"><span className="inline-flex items-start gap-1"><MapPin className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />{locationText(m)}</span></td><td className="px-4 py-3">{m.reason || m.type}</td><td className="px-4 py-3 text-right font-semibold text-red-600">{m.quantity}</td><td className="px-4 py-3 text-right">{m.newStock}</td><td className="px-4 py-3">{m.reference || "—"}</td><td className="px-4 py-3">{m.user?.name || "System / legacy"}</td><td className="px-4 py-3 text-xs text-ink-muted">{m.locationNote || "—"}</td></tr>)}
        </tbody></table></div>
      </div>
    </div>
  );
}
