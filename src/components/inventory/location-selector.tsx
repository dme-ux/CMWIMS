"use client";

import { useMemo } from "react";

type Warehouse = { id: string; name: string };
type Rack = { id: string; name: string; warehouseId: string };
type Shelf = { id: string; name: string; rackId: string };
type Bin = { id: string; name: string; shelfId: string };
export type LocationValue = { warehouseId: string; rackId: string; shelfId: string; binId: string };
export type LocationMasters = { warehouses: Warehouse[]; racks: Rack[]; shelves: Shelf[]; bins: Bin[] };

const cls = "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50 disabled:text-ink-muted dark:border-white/10 dark:bg-white/5";

export function LocationSelector({ value, onChange, masters, compact = false }: { value: LocationValue; onChange: (value: LocationValue) => void; masters: LocationMasters; compact?: boolean }) {
  const racks = useMemo(() => masters.racks.filter((r) => r.warehouseId === value.warehouseId), [masters.racks, value.warehouseId]);
  const shelves = useMemo(() => masters.shelves.filter((s) => s.rackId === value.rackId), [masters.shelves, value.rackId]);
  const bins = useMemo(() => masters.bins.filter((b) => b.shelfId === value.shelfId), [masters.bins, value.shelfId]);

  function setWarehouse(warehouseId: string) { onChange({ warehouseId, rackId: "", shelfId: "", binId: "" }); }
  function setRack(rackId: string) { onChange({ ...value, rackId, shelfId: "", binId: "" }); }
  function setShelf(shelfId: string) { onChange({ ...value, shelfId, binId: "" }); }

  return (
    <div className={compact ? "grid min-w-[520px] grid-cols-4 gap-2" : "grid gap-2 sm:grid-cols-2 lg:grid-cols-4"}>
      <select value={value.warehouseId} onChange={(e) => setWarehouse(e.target.value)} className={cls}>
        <option value="">Warehouse *</option>
        {masters.warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
      <select value={value.rackId} onChange={(e) => setRack(e.target.value)} className={cls} disabled={!value.warehouseId}>
        <option value="">Rack</option>
        {racks.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      <select value={value.shelfId} onChange={(e) => setShelf(e.target.value)} className={cls} disabled={!value.rackId}>
        <option value="">Shelf</option>
        {shelves.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <select value={value.binId} onChange={(e) => onChange({ ...value, binId: e.target.value })} className={cls} disabled={!value.shelfId}>
        <option value="">Bin</option>
        {bins.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </div>
  );
}
