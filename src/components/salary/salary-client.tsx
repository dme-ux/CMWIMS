"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Wallet, IndianRupee, CircleCheck, Clock, Users, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/reports/export-button";
import { inr } from "@/lib/utils";

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5";

type Employee = { id: string; name: string; role: string; salary: number };
type Payment = {
  id: string;
  employeeId: string;
  month: string;
  amount: number;
  paidAmount: number;
  status: string;
  mode: string | null;
  paidAt: string | null;
  notes: string | null;
  employee: { id: string; name: string; role: string; code: string };
};

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

const statusMeta: Record<string, [string, string]> = {
  PENDING: ["Pending", "bg-red-50 text-red-700 dark:bg-red-500/10"],
  PARTIAL: ["Partial", "bg-amber-50 text-amber-700 dark:bg-amber-500/10"],
  PAID: ["Paid", "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10"],
};

export function SalaryClient({
  month: initialMonth,
  employees,
  initial,
  canManage,
}: {
  month: string;
  employees: Employee[];
  initial: Payment[];
  canManage: boolean;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [rows, setRows] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [payFor, setPayFor] = useState<Payment | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [payNotes, setPayNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadMonth(m: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/salary?month=${m}`);
      const d = await res.json();
      if (res.ok) setRows(d.payments);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (month !== initialMonth) loadMonth(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const generatedIds = new Set(rows.map((r) => r.employeeId));
  const missing = employees.filter((e) => !generatedIds.has(e.id));

  const due = rows.reduce((s, r) => s + r.amount, 0);
  const paid = rows.reduce((s, r) => s + r.paidAmount, 0);
  const pending = due - paid;

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/salary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      const d = await res.json();
      if (res.ok) await loadMonth(month);
      else alert(d.error || "Could not generate salaries");
    } finally {
      setGenerating(false);
    }
  }

  function openPay(r: Payment) {
    setPayFor(r);
    setPayAmount(String(r.amount - r.paidAmount));
    setPayMode("Cash");
    setPayNotes("");
    setErr(null);
  }

  async function submitPay() {
    if (!payFor) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/salary/${payFor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(payAmount), mode: payMode, notes: payNotes }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not record payment");
      setRows((prev) => prev.map((r) => (r.id === d.payment.id ? { ...r, ...d.payment } : r)));
      setPayFor(null);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const csvColumns = ["Employee", "Role", "Month", "Due", "Paid", "Pending", "Status", "Mode", "Paid On"];
  const csvRows = rows.map((r) => [
    r.employee.name, r.employee.role, r.month, r.amount, r.paidAmount, r.amount - r.paidAmount, r.status, r.mode ?? "", r.paidAt ? r.paidAt.slice(0, 10) : "",
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Salary</h1>
          <p className="text-sm text-ink-muted">Monthly employee salary — generate, track, and mark as paid (Cash / Bank / UPI).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/employees">
            <Button variant="outline"><Users className="h-4 w-4" /> Employees</Button>
          </Link>
          {canManage && (
            <Button onClick={generate} loading={generating}>
              <RefreshCw className="h-4 w-4" /> Generate Salaries
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Wallet className="h-5 w-5" />} label={`Due — ${monthLabel(month)}`} value={inr(due)} tone="brand" />
        <StatCard icon={<CircleCheck className="h-5 w-5" />} label="Paid" value={inr(paid)} tone="brand" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Pending" value={inr(pending)} tone="amber" />
      </div>

      {missing.length > 0 && canManage && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          {missing.length} active employee{missing.length === 1 ? "" : "s"} not generated for {monthLabel(month)} yet — click <strong>Generate Salaries</strong>.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-3 dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          Month
          <input type="month" className={input + " w-auto"} value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <ExportButton columns={csvColumns} rows={csvRows} filename={`salary-${month}`} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Due</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Mode</th>
                {canManage && <th className="px-4 py-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-ink-muted">Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-ink-muted">
                    <Wallet className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    No salary entries for {monthLabel(month)} yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const [label, cls] = statusMeta[r.status] ?? [r.status, "bg-slate-100 text-slate-600"];
                const pendingAmt = r.amount - r.paidAmount;
                return (
                  <tr key={r.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-ink dark:text-slate-100">{r.employee.name}</td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{r.employee.role}</td>
                    <td className="px-4 py-3 text-right">{inr(r.amount)}</td>
                    <td className="px-4 py-3 text-right">{inr(r.paidAmount)}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(pendingAmt)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span></td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{r.mode || "—"}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        {r.status !== "PAID" && (
                          <Button variant="outline" onClick={() => openPay(r)} className="!px-3 !py-1.5 text-xs">Mark Paid</Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-brand-200 font-semibold dark:border-brand-500/30">
                  <td className="px-4 py-3" colSpan={2}>Total</td>
                  <td className="px-4 py-3 text-right text-brand-700 dark:text-brand-200">{inr(due)}</td>
                  <td className="px-4 py-3 text-right">{inr(paid)}</td>
                  <td className="px-4 py-3 text-right">{inr(pending)}</td>
                  <td colSpan={canManage ? 3 : 2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {payFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPayFor(null)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[rgb(var(--surface))]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">Pay {payFor.employee.name}</h3>
              <button onClick={() => setPayFor(null)} className="rounded-lg p-1 text-ink-muted hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            {err && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{err}</p>}
            <div className="grid gap-3">
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Amount (₹) — pending {inr(payFor.amount - payFor.paidAmount)}</span>
                <input type="number" min="0" step="1" className={input} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Payment Mode</span>
                <select className={input} value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                  <option>Cash</option>
                  <option>Bank</option>
                  <option>UPI</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Notes (optional)</span>
                <input className={input} placeholder="e.g. Advance adjusted, half-month" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
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

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  const tones: Record<string, string> = {
    brand: "text-brand-600 bg-brand-50 dark:bg-brand-500/10",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
  };
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>{icon}</div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-ink dark:text-slate-100">{value}</p>
    </div>
  );
}
