"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type LocationStock = {
  id: string;
  quantity: number;
  reservedQty: number;
  warehouse: { name: string };
  rack?: { name: string } | null;
  shelf?: { name: string } | null;
  bin?: { name: string } | null;
};

type Item = { id: string; name: string; sku: string; currentStock: number; locationStocks: LocationStock[] };

export function StockAdjustmentForm({ items }: { items: Item[] }) {
  const [itemId, setItemId] = useState("");
  const [locationStockId, setLocationStockId] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const item = useMemo(() => items.find((x) => x.id === itemId), [items, itemId]);
  const locations = item?.locationStocks || [];

  async function submit() {
    setMsg(null);
    if (!itemId || !locationStockId || !delta || !reason.trim()) {
      setMsg({ ok: false, text: "Item, location, adjustment quantity and reason are mandatory." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/stock/adjustment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, locationStockId, delta, reason, reference, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not adjust stock.");
      setMsg({ ok: true, text: `Adjustment saved. Total stock is now ${data.newStock}; selected location ${data.locationQty}.` });
      setDelta(""); setReason(""); setReference(""); setNote("");
      setTimeout(() => window.location.reload(), 700);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message || "Could not adjust stock." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <div className="mb-4 flex items-center gap-2"><RefreshCw className="h-4 w-4 text-amber-500" /><h3 className="font-display text-sm font-semibold">Controlled stock adjustment</h3></div>
      <p className="mb-4 text-xs text-ink-muted">Do not edit stock manually. Every correction creates a permanent timestamped movement entry.</p>
      {msg && <div className={`mb-4 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-medium text-ink-muted">Item *<select value={itemId} onChange={(e) => { setItemId(e.target.value); setLocationStockId(""); }} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"><option value="">— Select item —</option>{items.map((it) => <option key={it.id} value={it.id}>{it.name} ({it.sku}) · {it.currentStock} total</option>)}</select></label>
        <label className="text-xs font-medium text-ink-muted">Exact location *<select value={locationStockId} onChange={(e) => setLocationStockId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"><option value="">— Select location —</option>{locations.map((l) => { const loc = [l.warehouse?.name,l.rack?.name,l.shelf?.name,l.bin?.name].filter(Boolean).join(" → "); return <option key={l.id} value={l.id}>{loc} · {l.quantity} qty</option>; })}</select></label>
        <label className="text-xs font-medium text-ink-muted">Adjustment Qty *<input type="number" step="any" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="+2 or -1" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" /></label>
        <label className="text-xs font-medium text-ink-muted">Reason *<input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Physical count difference / damage..." className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" /></label>
        <label className="text-xs font-medium text-ink-muted">Reference<input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Count sheet / approval ref" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" /></label>
        <label className="text-xs font-medium text-ink-muted">Note<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" /></label>
      </div>
      <div className="mt-4 flex justify-end"><Button onClick={submit} loading={saving}>Save adjustment</Button></div>
    </div>
  );
}
