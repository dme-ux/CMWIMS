"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/utils";

type Vendor = { id: string; name: string };
type PO = { id: string; number: string; vendorId: string; subTotal: number; taxTotal: number; grandTotal: number };

/** Create a vendor bill — optionally linked to a purchase order. */
export function BillForm({ vendors, pos }: { vendors: Vendor[]; pos: PO[] }) {
  const router = useRouter();
  const [f, setF] = useState({
    vendorId: "", poId: "", number: "", invoiceDate: "", dueDate: "", subTotal: 0, taxTotal: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grand = useMemo(() => (Number(f.subTotal) || 0) + (Number(f.taxTotal) || 0), [f.subTotal, f.taxTotal]);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  function onPickPO(poId: string) {
    const po = pos.find((p) => p.id === poId);
    if (!po) { set("poId", ""); return; }
    setF((p) => ({ ...p, poId, vendorId: po.vendorId, subTotal: po.subTotal, taxTotal: po.taxTotal }));
  }

  async function submit() {
    setError(null);
    if (!f.vendorId) return setError("Select a vendor.");
    if (grand <= 0) return setError("Enter the bill amount.");
    setSaving(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      router.push("/accounting");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-ink-muted hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <Button onClick={submit} loading={saving}><Save className="h-4 w-4" /> Save bill</Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))] sm:grid-cols-2 lg:grid-cols-3">
        <Sel label="Link purchase order (optional)" value={f.poId} onChange={onPickPO} options={pos.map((p) => [p.id, `${p.number} · ${inr(p.grandTotal)}`])} placeholder="— No PO —" />
        <Sel label="Vendor *" value={f.vendorId} onChange={(v) => set("vendorId", v)} options={vendors.map((v) => [v.id, v.name])} placeholder="— Select vendor —" />
        <Txt label="Bill / Invoice number" value={f.number} onChange={(v) => set("number", v)} placeholder="Auto if left blank" />
        <Txt label="Invoice date" type="date" value={f.invoiceDate} onChange={(v) => set("invoiceDate", v)} />
        <Txt label="Due date" type="date" value={f.dueDate} onChange={(v) => set("dueDate", v)} />
        <div />
        <Num label="Sub total" value={f.subTotal} onChange={(v) => set("subTotal", v)} />
        <Num label="GST / Tax" value={f.taxTotal} onChange={(v) => set("taxTotal", v)} />
        <div className="flex flex-col justify-end">
          <span className="mb-1 block text-xs font-medium text-ink-muted">Grand total</span>
          <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">{inr(grand)}</div>
        </div>
      </div>
    </div>
  );
}

function Txt({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5" />
    </label>
  );
}
function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5" />
    </label>
  );
}
function Sel({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5">
        <option value="">{placeholder}</option>
        {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </label>
  );
}
