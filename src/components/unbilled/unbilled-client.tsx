"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, PackageOpen, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/reports/export-button";
import { ExportPdfButton } from "@/components/reports/export-pdf-button";
import { inr, formatDate } from "@/lib/utils";

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5";

type Purchase = {
  id: string;
  date: string;
  vendorName: string;
  description: string | null;
  amount: number;
  paidAmount: number;
  mode: string | null;
  notes: string | null;
};

const emptyForm = { id: "", date: "", vendorName: "", description: "", amount: "", paidAmount: "", mode: "Cash", notes: "" };

export function UnbilledClient({
  initial,
  monthTotal,
  canManage,
}: {
  initial: Purchase[];
  monthTotal: { amount: number; paid: number };
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

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (from && r.date < from) return false;
      if (to && r.date > to + "T23:59:59") return false;
      if (q) {
        const hay = `${r.vendorName} ${r.description ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, q, from, to]);

  const filteredTotal = filtered.reduce((s, r) => s + r.amount, 0);

  function openNew() {
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setErr(null);
    setOpen(true);
  }
  function openEdit(r: Purchase) {
    setForm({
      id: r.id,
      date: r.date.slice(0, 10),
      vendorName: r.vendorName,
      description: r.description ?? "",
      amount: String(r.amount),
      paidAmount: String(r.paidAmount),
      mode: r.mode ?? "Cash",
      notes: r.notes ?? "",
    });
    setErr(null);
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/unbilled-purchases/${form.id}` : "/api/unbilled-purchases", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not save");
      setOpen(false);
      router.refresh();
      if (isEdit) setRows((prev) => prev.map((r) => (r.id === d.purchase.id ? { ...r, ...d.purchase } : r)));
      else setRows((prev) => [d.purchase, ...prev]);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/unbilled-purchases/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Could not delete");
    }
  }

  const csvColumns = ["Date", "Vendor", "Description", "Amount", "Paid", "Mode", "Notes"];
  const csvRows = filtered.map((r) => [formatDate(r.date), r.vendorName, r.description ?? "", r.amount, r.paidAmount, r.mode ?? "", r.notes ?? ""]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Unbilled Purchases</h1>
          <p className="text-sm text-ink-muted">Vendor material received without a formal bill/invoice (cash/informal supply).</p>
        </div>
        {canManage && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> New Entry
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="This month (total)" value={inr(monthTotal.amount)} />
        <StatCard label="This month (paid)" value={inr(monthTotal.paid)} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-3 dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 dark:border-white/10">
          <Search className="h-4 w-4 text-ink-muted" />
          <input className="w-full bg-transparent py-2 text-sm outline-none" placeholder="Search vendor / description..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <input type="date" className={input + " w-auto"} value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-xs text-ink-muted">to</span>
        <input type="date" className={input + " w-auto"} value={to} onChange={(e) => setTo(e.target.value)} />
        <ExportButton columns={csvColumns} rows={csvRows} filename="unbilled-purchases" />
        <ExportPdfButton title="Unbilled Purchases" subtitle={`Total ${inr(filteredTotal)}`} columns={csvColumns} rows={csvRows} filename="unbilled-purchases" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3">Mode</th>
                {canManage && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-16 text-center text-ink-muted">
                    <PackageOpen className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    No unbilled purchase entries yet.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 font-medium text-ink dark:text-slate-100">{r.vendorName}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{r.description || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">{inr(r.amount)}</td>
                  <td className="px-4 py-3 text-right">{inr(r.paidAmount)}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{r.mode || "—"}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
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
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-brand-200 font-semibold dark:border-brand-500/30">
                  <td className="px-4 py-3" colSpan={3}>Total</td>
                  <td className="px-4 py-3 text-right text-brand-700 dark:text-brand-200">{inr(filteredTotal)}</td>
                  <td colSpan={canManage ? 3 : 2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[rgb(var(--surface))]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">{form.id ? "Edit Entry" : "New Unbilled Purchase"}</h3>
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
                <span className="mb-1 block text-xs text-ink-muted">Vendor Name</span>
                <input className={input} value={form.vendorName} onChange={(e) => setForm((f) => ({ ...f, vendorName: e.target.value }))} />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-muted">Description</span>
                <textarea rows={2} className={input} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Amount (₹)</span>
                <input type="number" min="0" step="1" className={input} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Paid so far (₹)</span>
                <input type="number" min="0" step="1" className={input} value={form.paidAmount} onChange={(e) => setForm((f) => ({ ...f, paidAmount: e.target.value }))} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Mode</span>
                <select className={input} value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}>
                  <option>Cash</option>
                  <option>Bank</option>
                  <option>UPI</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Notes</span>
                <input className={input} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} loading={busy}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-ink dark:text-slate-100">{value}</p>
    </div>
  );
}
