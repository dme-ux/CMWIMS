"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, TrendingUp, Wallet, Percent, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/reports/export-button";
import { ExportPdfButton } from "@/components/reports/export-pdf-button";
import { inr, formatDate } from "@/lib/utils";

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5";

type Customer = { id: string; name: string };
type Sale = {
  id: string;
  number: string;
  date: string;
  customerId: string | null;
  customerName: string | null;
  vehicleNo: string | null;
  description: string | null;
  amount: number;
  costOfGoods: number;
  paidAmount: number;
  status: string;
  mode: string | null;
  customer: Customer | null;
};
type Summary = { revenue: number; cost: number; grossProfit: number; margin: number; collected: number };

const statusMeta: Record<string, [string, string]> = {
  UNPAID: ["Unpaid", "bg-red-50 text-red-700 dark:bg-red-500/10"],
  PARTIAL: ["Partial", "bg-amber-50 text-amber-700 dark:bg-amber-500/10"],
  PAID: ["Paid", "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10"],
};

const emptyForm = { id: "", date: "", customerId: "", customerName: "", vehicleNo: "", description: "", amount: "", costOfGoods: "" };

export function SalesClient({
  initial,
  summary,
  customers,
  canManage,
}: {
  initial: Sale[];
  summary: Summary;
  customers: Customer[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<Sale | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("Cash");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (from && r.date < from) return false;
      if (to && r.date > to + "T23:59:59") return false;
      if (q) {
        const hay = `${r.number} ${r.customerName ?? r.customer?.name ?? ""} ${r.vehicleNo ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, q, from, to]);

  function openNew() {
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setErr(null);
    setOpen(true);
  }
  function openEdit(r: Sale) {
    setForm({
      id: r.id,
      date: r.date.slice(0, 10),
      customerId: r.customerId ?? "",
      customerName: r.customerName ?? "",
      vehicleNo: r.vehicleNo ?? "",
      description: r.description ?? "",
      amount: String(r.amount),
      costOfGoods: String(r.costOfGoods),
    });
    setErr(null);
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/sales/${form.id}` : "/api/sales", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not save");
      setOpen(false);
      router.refresh();
      if (isEdit) setRows((prev) => prev.map((r) => (r.id === d.sale.id ? { ...r, ...d.sale } : r)));
      else setRows((prev) => [d.sale, ...prev]);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this sale entry?")) return;
    const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Could not delete");
    }
  }

  function openPay(r: Sale) {
    setPayFor(r);
    setPayAmount(String(r.amount - r.paidAmount));
    setPayMode("Cash");
  }

  async function submitPay() {
    if (!payFor) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/sales/${payFor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pay: true, amount: Number(payAmount), mode: payMode }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not record payment");
      setRows((prev) => prev.map((r) => (r.id === d.sale.id ? { ...r, ...d.sale } : r)));
      setPayFor(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  const filteredGP = filtered.reduce((s, r) => s + (r.amount - r.costOfGoods), 0);
  const filteredRevenue = filtered.reduce((s, r) => s + r.amount, 0);

  const csvColumns = ["Invoice #", "Date", "Customer", "Vehicle", "Amount", "Cost", "Gross Profit", "Paid", "Status"];
  const csvRows = filtered.map((r) => [
    r.number, formatDate(r.date), r.customerName ?? r.customer?.name ?? "", r.vehicleNo ?? "", r.amount, r.costOfGoods, r.amount - r.costOfGoods, r.paidAmount, r.status,
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Sales</h1>
          <p className="text-sm text-ink-muted">Customer billing — feeds the Gross Profit report (Sales − Cost of Goods).</p>
        </div>
        {canManage && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> New Sale
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Revenue (this month)" value={inr(summary.revenue)} />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Gross Profit (this month)" value={inr(summary.grossProfit)} />
        <StatCard icon={<Percent className="h-5 w-5" />} label="Margin" value={`${summary.margin.toFixed(1)}%`} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-3 dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 dark:border-white/10">
          <Search className="h-4 w-4 text-ink-muted" />
          <input className="w-full bg-transparent py-2 text-sm outline-none" placeholder="Search invoice # / customer / vehicle..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <input type="date" className={input + " w-auto"} value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-xs text-ink-muted">to</span>
        <input type="date" className={input + " w-auto"} value={to} onChange={(e) => setTo(e.target.value)} />
        <ExportButton columns={csvColumns} rows={csvRows} filename="sales" />
        <ExportPdfButton title="Sales Report" subtitle={`Revenue ${inr(filteredRevenue)} · Gross Profit ${inr(filteredGP)}`} columns={csvColumns} rows={csvRows} filename="sales" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Gross Profit</th>
                <th className="px-4 py-3">Status</th>
                {canManage && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.length === 0 && (
                <tr><td colSpan={canManage ? 8 : 7} className="px-4 py-16 text-center text-ink-muted">No sales yet.</td></tr>
              )}
              {filtered.map((r) => {
                const [label, cls] = statusMeta[r.status] ?? [r.status, "bg-slate-100 text-slate-600"];
                return (
                  <tr key={r.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3 text-xs text-ink-muted">{r.number}</td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{formatDate(r.date)}</td>
                    <td className="px-4 py-3 font-medium text-ink dark:text-slate-100">{r.customerName ?? r.customer?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{r.vehicleNo || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(r.amount)}</td>
                    <td className="px-4 py-3 text-right">{inr(r.amount - r.costOfGoods)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span></td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {r.status !== "PAID" && (
                            <Button variant="outline" onClick={() => openPay(r)} className="!px-2.5 !py-1.5 text-xs">Collect</Button>
                          )}
                          <button onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-ink-muted hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-white/10">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => remove(r.id)} className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-white/10">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[rgb(var(--surface))]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">{form.id ? "Edit Sale" : "New Sale"}</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-ink-muted hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            {err && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{err}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Date</span>
                <input type="date" className={input} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Vehicle No.</span>
                <input className={input} value={form.vehicleNo} onChange={(e) => setForm((f) => ({ ...f, vehicleNo: e.target.value }))} />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-muted">Customer (existing)</span>
                <select className={input} value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}>
                  <option value="">— Select or type a name below —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-muted">Or Customer Name (if not in list)</span>
                <input className={input} value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-muted">Description</span>
                <textarea rows={2} className={input} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Sale Amount (₹)</span>
                <input type="number" min="0" step="1" className={input} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Cost of Goods (₹, optional)</span>
                <input type="number" min="0" step="1" className={input} value={form.costOfGoods} onChange={(e) => setForm((f) => ({ ...f, costOfGoods: e.target.value }))} />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} loading={busy}>Save Sale</Button>
            </div>
          </div>
        </div>
      )}

      {payFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPayFor(null)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[rgb(var(--surface))]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">Collect payment — {payFor.number}</h3>
              <button onClick={() => setPayFor(null)} className="rounded-lg p-1 text-ink-muted hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3">
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Amount (₹) — pending {inr(payFor.amount - payFor.paidAmount)}</span>
                <input type="number" min="0" step="1" className={input} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Mode</span>
                <select className={input} value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                  <option>Cash</option>
                  <option>Bank</option>
                  <option>UPI</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPayFor(null)}>Cancel</Button>
              <Button onClick={submitPay} loading={busy}>Record Payment</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10">{icon}</div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-ink dark:text-slate-100">{value}</p>
    </div>
  );
}
