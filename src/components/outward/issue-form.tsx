"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpFromLine } from "lucide-react";
import { Button } from "@/components/ui/button";

type Item = { id: string; name: string; sku: string; currentStock: number };
type Reason = { value: string; label: string };

export function IssueForm({ items, reasons }: { items: Item[]; reasons: Reason[] }) {
  const router = useRouter();
  const [itemId, setItemId] = useState("");
  const [reason, setReason] = useState(reasons[0]?.value ?? "");
  const [quantity, setQuantity] = useState(1);
  const [party, setParty] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const item = useMemo(() => items.find((i) => i.id === itemId), [itemId, items]);

  async function submit() {
    setMsg(null);
    if (!itemId) return setMsg({ ok: false, text: "Select an item." });
    setBusy(true);
    try {
      const res = await fetch("/api/stock/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, reason, quantity, party, reference, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not issue.");
      setMsg({ ok: true, text: `Issued successfully. New stock: ${data.newStock}.` });
      setQuantity(1); setParty(""); setReference(""); setNote("");
      router.refresh();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <h3 className="mb-4 font-display text-sm font-semibold text-ink dark:text-slate-100">Issue material</h3>
      {msg && <p className={`mb-3 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <F label="Item" span>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={inputCls}>
            <option value="">— Select item —</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku}) · {i.currentStock} in stock</option>)}
          </select>
        </F>
        <F label="Reason">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls}>
            {reasons.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </F>
        <F label={`Quantity ${item ? `(max ${item.currentStock})` : ""}`}>
          <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={inputCls} />
        </F>
        <F label="Party / Issued to (optional)"><input value={party} onChange={(e) => setParty(e.target.value)} placeholder="Customer / dept / vendor" className={inputCls} /></F>
        <F label="Reference (optional)"><input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Job card / invoice no." className={inputCls} /></F>
        <F label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} /></F>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={submit} loading={busy}><ArrowUpFromLine className="h-4 w-4" /> Issue material</Button>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5";
function F({ label, span, children }: { label: string; span?: boolean; children: React.ReactNode }) {
  return <label className={`block ${span ? "lg:col-span-2" : ""}`}><span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>{children}</label>;
}
