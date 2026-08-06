"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";

type Item = { id: string; name: string; sku: string; currentStock: number };

export function DirectInForm({ items }: { items: Item[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [rate, setRate] = useState<number | "">("");
  const [vendorName, setVendorName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setMsg(null);
    if (!itemId) return setMsg({ ok: false, text: "Select an item." });
    setBusy(true);
    try {
      const res = await fetch("/api/stock/direct-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity, rate, vendorName, poNumber, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add stock.");
      setMsg({ ok: true, text: `Stock added. New stock: ${data.newStock}.` });
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
          <ArrowDownToLine className="h-4 w-4 text-brand-600" /> Direct In (add stock without a PO)
        </span>
        <span className="text-sm text-brand-600">{open ? "Close" : "Open"}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 dark:border-white/5">
          {msg && <p className={`mb-3 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block lg:col-span-3">
              <span className="mb-1 block text-xs font-medium text-ink-muted">Item</span>
              <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5">
                <option value="">— Select item —</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku}) · {i.currentStock} in stock</option>)}
              </select>
            </label>
            <F label="Quantity"><input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={inputCls} /></F>
            <F label="Rate (optional)"><input type="number" value={rate} onChange={(e) => setRate(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Avg cost if blank" className={inputCls} /></F>
            <F label="Vendor name (optional)"><input value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={inputCls} /></F>
            <F label="PO number (optional)"><input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className={inputCls} /></F>
            <F label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} /></F>
          </div>
          <div className="mt-4 flex justify-end">
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
