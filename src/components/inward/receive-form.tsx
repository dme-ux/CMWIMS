"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/utils";
import { LocationSelector, type LocationMasters, type LocationValue } from "@/components/inventory/location-selector";

type Line = { id: string; name: string; sku: string; quantity: number; receivedQty: number; rate: number };
type LineState = { receiveQty: number; location: LocationValue };
const emptyLocation = (): LocationValue => ({ warehouseId: "", rackId: "", shelfId: "", binId: "" });

/** GRN form — quantity + exact physical location against each PO line. */
export function ReceiveForm({ poId, poNumber, lines, masters }: { poId: string; poNumber: string; lines: Line[]; masters: LocationMasters }) {
  const router = useRouter();
  const requestIdRef = useRef<string>(globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`);
  const [state, setState] = useState<Record<string, LineState>>(
    Object.fromEntries(lines.map((l) => [l.id, { receiveQty: Math.max(0, l.quantity - l.receivedQty), location: emptyLocation() }]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(id: string, value: Partial<LineState>) {
    setState((s) => ({ ...s, [id]: { ...s[id], ...value } }));
  }

  async function submit() {
    setError(null);
    const payload = lines
      .map((l) => ({
        poItemId: l.id,
        receiveQty: Number(state[l.id]?.receiveQty) || 0,
        ...state[l.id]?.location,
      }))
      .filter((l) => l.receiveQty > 0);

    if (payload.length === 0) return setError("Enter a quantity to receive on at least one line.");
    const missing = payload.find((l) => !l.warehouseId);
    if (missing) return setError("Select a warehouse for every line being received.");

    setSaving(true);
    try {
      const res = await fetch(`/api/purchase-orders/${poId}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: requestIdRef.current, lines: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not receive.");
      requestIdRef.current = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      router.push(`/purchase/${poId}`);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-ink-muted hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <Button onClick={submit} loading={saving} disabled={saving}><PackageCheck className="h-4 w-4" /> Receive material</Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}
      <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-xs text-brand-800">
        <b>{poNumber}</b> · Select the exact Warehouse → Rack → Shelf → Bin for each part. Rack/Shelf/Bin are optional, but Warehouse is mandatory.
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3 text-right">Ordered</th>
                <th className="px-4 py-3 text-right">Already received</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 w-32 text-right">Receive now</th>
                <th className="px-4 py-3">Store location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {lines.map((l) => {
                const pending = Math.max(0, l.quantity - l.receivedQty);
                const row = state[l.id];
                return (
                  <tr key={l.id} className="align-top">
                    <td className="px-4 py-3"><div className="font-medium text-ink dark:text-slate-100">{l.name}</div><div className="text-xs text-ink-muted">{l.sku}</div></td>
                    <td className="px-4 py-3 text-right">{l.quantity}</td>
                    <td className="px-4 py-3 text-right">{l.receivedQty}</td>
                    <td className="px-4 py-3 text-right font-medium">{pending}</td>
                    <td className="px-4 py-3 text-right">{inr(l.rate)}</td>
                    <td className="px-4 py-3">
                      <input type="number" min={0} max={pending} step="any" value={row?.receiveQty ?? 0}
                        onChange={(e) => patch(l.id, { receiveQty: Number(e.target.value) })} disabled={pending <= 0}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50 disabled:text-ink-muted dark:border-white/10 dark:bg-white/5" />
                    </td>
                    <td className="px-4 py-3">
                      <LocationSelector value={row?.location || emptyLocation()} onChange={(location) => patch(l.id, { location })} masters={masters} compact />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-ink-muted">A successful receipt creates a GRN, updates exact-location stock, total stock, weighted average cost, PO received quantity and the permanent stock ledger together.</p>
    </div>
  );
}
