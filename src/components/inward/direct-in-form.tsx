"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

type Item = { id: string; name: string; sku: string; currentStock: number };
type LocationMasters = {
  warehouses: { id: string; name: string }[];
  racks: { id: string; name: string; warehouseId: string }[];
  shelves: { id: string; name: string; rackId: string }[];
  bins: { id: string; name: string; shelfId: string }[];
};

export function DirectInForm({ items, locations }: { items: Item[]; locations: LocationMasters }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [itemId, setItemId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [rackId, setRackId] = useState("");
  const [shelfId, setShelfId] = useState("");
  const [binId, setBinId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [rate, setRate] = useState<number | "">("");
  const [vendorName, setVendorName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const racks = useMemo(() => locations.racks.filter((r) => !warehouseId || r.warehouseId === warehouseId), [locations.racks, warehouseId]);
  const shelves = useMemo(() => locations.shelves.filter((s) => !rackId || s.rackId === rackId), [locations.shelves, rackId]);
  const bins = useMemo(() => locations.bins.filter((b) => !shelfId || b.shelfId === shelfId), [locations.bins, shelfId]);

  async function submit() {
    setMsg(null);
    if (!itemId) return setMsg({ ok: false, text: "Select an item." });
    if (!warehouseId) return setMsg({ ok: false, text: "Select a warehouse." });
    setBusy(true);
    try {
      const res = await fetch("/api/stock/direct-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, warehouseId, rackId, shelfId, binId, quantity, rate, vendorName, poNumber, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add stock.");
      setMsg({ ok: true, text: `Stock added. Total: ${data.newStock} · Selected location: ${data.locationQty}.` });
      setQuantity(1); setRate(""); setVendorName(""); setPoNumber(""); setNote("");
      router.refresh();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-3 text-left">
        <span className="flex items-center gap-2 font-display text-sm font-semibold text-ink dark:text-slate-100">
          <ArrowDownToLine className="h-4 w-4 text-brand-600" /> Direct In · exact location stock
        </span>
        <span className="text-sm text-brand-600">{open ? "Close" : "Open"}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 dark:border-white/5">
          {msg && <p className={`mb-3 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block sm:col-span-2 lg:col-span-4">
              <span className="mb-1 block text-xs font-medium text-ink-muted">Item</span>
              <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={inputCls}>
                <option value="">— Select item —</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku}) · {i.currentStock} total</option>)}
              </select>
            </label>

            <Select label="Warehouse *" value={warehouseId} onChange={(v) => { setWarehouseId(v); setRackId(""); setShelfId(""); setBinId(""); }} options={locations.warehouses.map((x) => [x.id, x.name])} />
            <Select label="Rack" value={rackId} onChange={(v) => { setRackId(v); setShelfId(""); setBinId(""); }} options={racks.map((x) => [x.id, x.name])} />
            <Select label="Shelf" value={shelfId} onChange={(v) => { setShelfId(v); setBinId(""); }} options={shelves.map((x) => [x.id, x.name])} />
            <Select label="Bin" value={binId} onChange={setBinId} options={bins.map((x) => [x.id, x.name])} />

            <F label="Quantity"><input type="number" min={0.001} step="any" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={inputCls} /></F>
            <F label="Rate (optional)"><input type="number" step="any" value={rate} onChange={(e) => setRate(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Avg cost if blank" className={inputCls} /></F>
            <F label="Vendor name (optional)"><input value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={inputCls} /></F>
            <F label="PO / reference (optional)"><input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className={inputCls} /></F>
            <F label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} /></F>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1 text-xs text-ink-muted"><MapPin className="h-3.5 w-3.5" /> Warehouse is mandatory; Rack/Shelf/Bin can be selected as available.</p>
            <Button onClick={submit} loading={busy}><ArrowDownToLine className="h-4 w-4" /> Add stock</Button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>{children}</label>;
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}><option value="">— Select —</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>;
}
