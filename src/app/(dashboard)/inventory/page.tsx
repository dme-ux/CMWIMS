// Inventory list — smart search, status badges, location, quick edit/delete.
import Link from "next/link";
import { Plus, Pencil, PackageSearch } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getItems, stockStatus } from "@/lib/items";
import { inr } from "@/lib/utils";
import { SearchBar, DeleteItemButton } from "@/components/inventory/controls";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const canManage = session ? can(session.role, "inventory.manage") : false;
  const items = await getItems({ q: sp.q, status: sp.status });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Inventory</h1>
          <p className="text-sm text-ink-muted">{items.length} item{items.length === 1 ? "" : "s"}</p>
        </div>
        {canManage && (
          <Link href="/inventory/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glass hover:bg-brand-700">
            <Plus className="h-4 w-4" /> Add item
          </Link>
        )}
      </div>

      <SearchBar />

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Part / OEM</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3">Status</th>
                {canManage && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {items.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-16 text-center text-ink-muted">
                    <PackageSearch className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    No items match your search. {canManage && "Add your first item to get started."}
                  </td>
                </tr>
              )}
              {items.map((it) => {
                const st = stockStatus(it.currentStock, it.reorderLevel);
                const loc = [it.warehouse?.name, it.rack?.name, it.shelf?.name, it.bin?.name].filter(Boolean).join(" · ");
                return (
                  <tr key={it.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink dark:text-slate-100">{it.name}</div>
                      <div className="text-xs text-ink-muted">{it.sku}{it.category ? ` · ${it.category.name}` : ""}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      <div>{it.partNumber || "—"}</div>
                      <div className="text-xs text-ink-muted">{it.oemNumber || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{loc || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">{it.currentStock}{it.unit ? ` ${it.unit.name}` : ""}</td>
                    <td className="px-4 py-3 text-right">{inr(it.sellingRate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={st} /></td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/inventory/${it.id}/edit`} aria-label="Edit" className="rounded-lg p-1.5 text-ink-muted hover:bg-brand-50 hover:text-brand-600">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <DeleteItemButton id={it.id} name={it.name} />
                        </div>
                      </td>
                    )}
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

function StatusBadge({ status }: { status: "in" | "low" | "out" }) {
  const map = {
    in: ["In stock", "bg-emerald-50 text-emerald-700"],
    low: ["Low", "bg-amber-50 text-amber-700"],
    out: ["Out", "bg-red-50 text-red-700"],
  } as const;
  const [label, cls] = map[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>;
}
