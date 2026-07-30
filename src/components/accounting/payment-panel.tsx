"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/utils";

/** Record a payment against a bill. Shown only when a balance is pending. */
export function PaymentPanel({ billId, pending }: { billId: string; pending: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(pending);
  const [mode, setMode] = useState("Bank");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (pending <= 0) return null;

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/bills/${billId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, mode, reference, paidAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not record payment.");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <div className="mb-4 flex items-center gap-2 text-brand-600">
        <Wallet className="h-5 w-5" /><h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Record payment</h3>
      </div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">Amount (pending {inr(pending)})</span>
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">Mode</span>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5">
            <option>Bank</option><option>Cash</option><option>UPI</option><option>Cheque</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">Reference</span>
          <input value={reference} onChange={(e) => setReference(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-muted">Date</span>
          <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5" />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={submit} loading={busy}><Wallet className="h-4 w-4" /> Record payment</Button>
      </div>
    </div>
  );
}
