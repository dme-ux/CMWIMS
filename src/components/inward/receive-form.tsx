"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/utils";

type Line = { id: string; name: string; sku: string; quantity: number; receivedQty: number; rate: number };

/** GRN form — enter quantity received now against each PO line. */
export function ReceiveForm({ poId, poNumber, lines }: { poId: string; poNumber: string; lines: Line[] }) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(lines.map((l) => [l.id, Math.max(0, l.quantity - l.receivedQty)]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const payload = lines
      .map((l) => ({ poItemId: l.id, receiveQty: Number(qty[l.id]) || 0 }))
      .filter((l) => l.receiveQty > 0);
    if (payload.length === 0) return setError("Enter a quantity to receive on at least one line.");

    setSaving(true);
    try {
      const res = await fetch(`/api/purchase-orders/${poId}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not receive.");
      router.push(`/purchase/${poId}`);
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
        <Button onClick={submit} loading={saving}><PackageCheck className="h-4 w-4" /> Receive material</Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3 text-right">Ordered</th>
                <th className="px-4 py-3 text-right">Already received</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 w-32 text-right">Receive now</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {lines.map((l) => {
                const pending = l.quantity - l.receivedQty;
                return (
                  <tr key={l.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink dark:text-slate-100">{l.name}</div>
                      <div className="text-xs text-ink-muted">{l.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-right">{l.quantity}</td>
                    <td className="px-4 py-3 text-right">{l.receivedQty}</td>
                    <td className="px-4 py-3 text-right font-medium">{pending}</td>
                    <td className="px-4 py-3 text-right">{inr(l.rate)}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={pending}
                        value={qty[l.id] ?? 0}
                        onChange={(e) => setQty((q) => ({ ...q, [l.id]: Number(e.target.value) }))}
                        disabled={pending <= 0}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50 disabled:text-ink-muted dark:border-white/10 dark:bg-white/5"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-ink-muted">Receiving updates stock levels, average cost and the PO status automatically.</p>
    </div>
  );
}
