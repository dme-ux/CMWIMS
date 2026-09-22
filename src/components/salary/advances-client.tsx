"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft, Landmark, X, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/utils";

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5";

type Employee = { id: string; name: string; role: string };
type Deduction = {
  id: string;
  employeeId: string;
  type: string;
  totalAmount: number;
  installmentAmount: number;
  remainingAmount: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  employee: Employee;
};

const emptyForm = { employeeId: "", type: "ADVANCE", totalAmount: "", installmentAmount: "", notes: "" };

export function AdvancesClient({ initial, employees, canManage }: { initial: Deduction[]; employees: Employee[]; canManage: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const filtered = useMemo(() => rows.filter((r) => showClosed || r.isActive), [rows, showClosed]);

  function openNew() {
    setForm(emptyForm);
    setErr(null);
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/salary/deductions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not save");
      setOpen(false);
      router.refresh();
      setRows((prev) => [d.deduction, ...prev]);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function close(id: string) {
    if (!confirm("Mark this as fully recovered / close it early?")) return;
    const res = await fetch(`/api/salary/deductions/${id}`, { method: "PUT" });
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: false } : r)));
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this record entirely?")) return;
    const res = await fetch(`/api/salary/deductions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      <Link href="/salary" className="flex items-center gap-2 text-sm text-ink-muted hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to Salary
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Advances / EMI</h1>
          <p className="text-sm text-ink-muted">Money given to an employee, recovered automatically from salary in monthly installments.</p>
        </div>
        {canManage && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Add Advance / EMI
          </Button>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} /> Show fully recovered / closed
      </label>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Monthly Installment</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3">Status</th>
                {canManage && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-16 text-center text-ink-muted">
                    <Landmark className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    No advances or EMIs recorded.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink dark:text-slate-100">{r.employee.name}</div>
                    <div className="text-xs text-ink-muted">{r.employee.role}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">{r.type}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{inr(r.totalAmount)}</td>
                  <td className="px-4 py-3 text-right">{inr(r.installmentAmount)}/mo</td>
                  <td className="px-4 py-3 text-right font-medium">{inr(r.remainingAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.isActive ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10"}`}>
                      {r.isActive ? "Active" : "Closed"}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {r.isActive && (
                          <button onClick={() => close(r.id)} title="Close early" className="rounded-lg p-1.5 text-ink-muted hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-white/10">
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => remove(r.id)} title="Delete" className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-white/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[rgb(var(--surface))]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">Add Advance / EMI</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-ink-muted hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            {err && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{err}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-muted">Employee</span>
                <select className={input} value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">— Select —</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Type</span>
                <select className={input} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="ADVANCE">Advance</option>
                  <option value="EMI">EMI</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Total Amount (₹)</span>
                <input type="number" min="0" step="1" className={input} value={form.totalAmount} onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))} />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-muted">Monthly Installment (₹) — kitna har mahine salary se katega</span>
                <input type="number" min="0" step="1" className={input} value={form.installmentAmount} onChange={(e) => setForm((f) => ({ ...f, installmentAmount: e.target.value }))} />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-muted">Notes (optional)</span>
                <input className={input} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </label>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Deduction agle "Generate Salaries" se apne aap shuru ho jaayegi — jab tak poora amount recover na ho jaaye.
            </p>
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
