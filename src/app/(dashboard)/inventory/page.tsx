// CMW Phase 1 Inventory — super-fast part, cross-reference and vehicle search.
import Link from "next/link";
import { Plus, Pencil, PackageSearch, MapPin, Car, Layers3, History } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getItems, stockStatus } from "@/lib/items";
import { inr } from "@/lib/utils";
import { SearchBar, DeleteItemButton } from "@/components/inventory/controls";

export const dynamic = "force-dynamic";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  const canManage = session ? can(session.role, "inventory.manage") : false;
  const items = await getItems({ q: sp.q, status: sp.status });

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Inventory · Parts Finder</h1><p className="text-sm text-ink-muted">Search SKU, part no, OEM, barcode, alternate number, car brand or model · {items.length} results</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/inventory/ledger" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-brand-600 dark:border-white/10"><History className="h-4 w-4" /> Stock Ledger</Link>{canManage && <Link href="/inventory/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glass hover:bg-brand-700"><Plus className="h-4 w-4" /> Add part</Link>}</div>
    </div>

    <SearchBar />

    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5"><tr>
          <th className="px-4 py-3">Part</th><th className="px-4 py-3">Numbers</th><th className="px-4 py-3">Compatible Cars</th><th className="px-4 py-3">Locations</th><th className="px-4 py-3 text-right">Available</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3">Status</th>{canManage && <th className="px-4 py-3 text-right">Actions</th>}
        </tr></thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {items.length === 0 && <tr><td colSpan={canManage ? 8 : 7} className="px-4 py-16 text-center text-ink-muted"><PackageSearch className="mx-auto mb-3 h-8 w-8 opacity-40" />No matching parts found.</td></tr>}
          {items.map((it: any) => {
            const st = stockStatus(it.currentStock, it.reorderLevel);
            const available = Math.max(0, it.currentStock - it.reservedStock);
            const refs = it.crossReferences?.slice(0, 3) || [];
            const cars = it.compatibilities?.slice(0, 3) || [];
            const locations = it.locationStocks?.filter((x: any) => x.quantity !== 0) || [];
            return <tr key={it.id} className="align-top hover:bg-brand-50/40 dark:hover:bg-white/5">
              <td className="px-4 py-3"><div className="font-medium text-ink dark:text-slate-100">{it.name}</div><div className="text-xs text-ink-muted">{it.sku}{it.category ? ` · ${it.category.name}` : ""}</div></td>
              <td className="px-4 py-3 text-ink-soft"><div>{it.partNumber || "—"}</div><div className="text-xs text-ink-muted">OEM: {it.oemNumber || "—"}</div>{refs.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{refs.map((r: any) => <span key={r.id} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-white/10">{r.code}</span>)}</div>}</td>
              <td className="px-4 py-3">{cars.length ? <div className="space-y-1">{cars.map((c: any) => <div key={c.id} className="flex items-center gap-1 text-xs"><Car className="h-3 w-3 text-brand-500" />{c.vehicleModel.oemBrand?.name ? `${c.vehicleModel.oemBrand.name} · ` : ""}{c.vehicleModel.name}</div>)}{it.compatibilities.length > 3 && <div className="text-[11px] text-ink-muted">+{it.compatibilities.length - 3} more</div>}</div> : <span className="text-ink-muted">—</span>}</td>
              <td className="px-4 py-3">{locations.length ? <div className="space-y-1">{locations.slice(0, 3).map((l: any) => <div key={l.id} className="flex items-start gap-1 text-xs"><MapPin className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" /><span>{[l.warehouse?.name, l.rack?.name, l.shelf?.name, l.bin?.name].filter(Boolean).join(" · ")} <b>({l.quantity})</b></span></div>)}</div> : <span className="text-ink-muted">Legacy/unassigned</span>}</td>
              <td className="px-4 py-3 text-right"><div className="font-semibold">{available}{it.unit ? ` ${it.unit.name}` : ""}</div>{it.reservedStock > 0 && <div className="text-[11px] text-amber-600">Reserved {it.reservedStock}</div>}</td>
              <td className="px-4 py-3 text-right">{inr(it.sellingRate)}</td>
              <td className="px-4 py-3"><StatusBadge status={st} /></td>
              {canManage && <td className="px-4 py-3"><div className="flex items-center justify-end gap-1"><Link href={`/inventory/${it.id}/edit`} aria-label="Edit" className="rounded-lg p-1.5 text-ink-muted hover:bg-brand-50 hover:text-brand-600"><Pencil className="h-4 w-4" /></Link><DeleteItemButton id={it.id} name={it.name} /></div></td>}
            </tr>;
          })}
        </tbody>
      </table></div>
    </div>
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-ink-muted dark:border-white/10 dark:bg-white/5"><Layers3 className="h-4 w-4" /> Phase 2B: use Stock Ledger for permanent timestamp-wise IN / OUT / adjustment history. Stock corrections are recorded as movements, not silent edits.</div>
  </div>;
}

function StatusBadge({ status }: { status: "in" | "low" | "out" }) {
  const map = { in: ["In stock", "bg-emerald-50 text-emerald-700"], low: ["Low", "bg-amber-50 text-amber-700"], out: ["Out", "bg-red-50 text-red-700"] } as const;
  const [label, cls] = map[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>;
}
