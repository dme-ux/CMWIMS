"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/utils";

type Vendor = { id: string; name: string; paymentTerms: string | null };
type Item = { id: string; name: string; sku: string; purchaseRate: number; gstRate: number };
type Line = { itemId: string; quantity: number; rate: number; gstRate: number };

/** Create a purchase order — vendor + line items with live totals. */
export function POForm({ vendors, items }: { vendors: Vendor[]; items: Item[] }) {
  const router = useRouter();
  const [vendorId, setVendorId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ itemId: "", quantity: 1, rate: 0, gstRate: 18 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemMap = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  function addLine() {
    setLines((l) => [...l, { itemId: "", quantity: 1, rate: 0, gstRate: 18 }]);
  }
  function removeLine(idx: number) {
    setLines((l) => l.filter((_, i) => i !== idx));
  }
  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((l) => l.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }
  function onPickItem(idx: number, itemId: string) {
    const it = itemMap[itemId];
    updateLine(idx, { itemId, rate: it ? it.purchaseRate : 0, gstRate: it ? it.gstRate : 18 });
  }

  const totals = useMemo(() => {
    let sub = 0, tax = 0;
    for (const l of lines) {
      const amt = (Number(l.quantity) || 0) * (Number(l.rate) || 0);
      sub += amt;
      tax += (amt * (Number(l.gstRate) || 0)) / 100;
    }
    return { sub, tax, grand: sub + tax };
  }, [lines]);

  async function submit(status: "DRAFT" | "PENDING_APPROVAL") {
    setError(null);
    if (!vendorId) return setError("Select a vendor.");
    const valid = lines.filter((l) => l.itemId && Number(l.quantity) > 0);
    if (valid.length === 0) return setError("Add at least one item with a quantity.");

    setSaving(true);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, expectedDate, notes, status, items: valid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      router.push("/purchase");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  if (vendors.length === 0 || items.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        You need at least one vendor and one item first. Add them under <b>Masters</b> and <b>Inventory</b>, then create a PO.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-ink-muted hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => submit("DRAFT")} loading={saving}><Save className="h-4 w-4" /> Save draft</Button>
          <Button onClick={() => submit("PENDING_APPROVAL")} loading={saving}><Send className="h-4 w-4" /> Submit for approval</Button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      {/* header */}
      <div className="grid gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))] sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">Vendor *</span>
          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5">
            <option value="">— Select vendor —</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">Expected date</span>
          <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">Notes</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5" />
        </label>
      </div>

      {/* line items */}
      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/5">
          <h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Items</h3>
          <Button onClick={addLine} variant="outline" className="px-3 py-2"><Plus className="h-4 w-4" /> Add line</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-2.5">Item</th>
                <th className="px-4 py-2.5 w-24 text-right">Qty</th>
                <th className="px-4 py-2.5 w-32 text-right">Rate</th>
                <th className="px-4 py-2.5 w-24 text-right">GST %</th>
                <th className="px-4 py-2.5 w-32 text-right">Amount</th>
                <th className="px-4 py-2.5 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {lines.map((l, idx) => {
                const amt = (Number(l.quantity) || 0) * (Number(l.rate) || 0);
                return (
                  <tr key={idx}>
                    <td className="px-4 py-2">
                      <select value={l.itemId} onChange={(e) => onPickItem(idx, e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none dark:border-white/10 dark:bg-white/5">
                        <option value="">— Select item —</option>
                        {items.map((it) => <option key={it.id} value={it.id}>{it.name} ({it.sku})</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2"><input type="number" value={l.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm outline-none dark:border-white/10 dark:bg-white/5" /></td>
                    <td className="px-4 py-2"><input type="number" value={l.rate} onChange={(e) => updateLine(idx, { rate: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm outline-none dark:border-white/10 dark:bg-white/5" /></td>
                    <td className="px-4 py-2"><input type="number" value={l.gstRate} onChange={(e) => updateLine(idx, { gstRate: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm outline-none dark:border-white/10 dark:bg-white/5" /></td>
                    <td className="px-4 py-2 text-right font-medium">{inr(amt)}</td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => removeLine(idx)} aria-label="Remove" className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* totals */}
        <div className="flex justify-end border-t border-slate-100 px-5 py-4 dark:border-white/5">
          <div className="w-64 space-y-1.5 text-sm">
            <Row label="Sub total" value={inr(totals.sub)} />
            <Row label="GST" value={inr(totals.tax)} />
            <div className="flex justify-between border-t border-slate-200 pt-2 font-display text-base font-bold text-ink dark:border-white/10 dark:text-slate-100">
              <span>Grand total</span><span>{inr(totals.grand)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-ink-soft dark:text-slate-300"><span>{label}</span><span>{value}</span></div>;
}
