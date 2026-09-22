"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Receipt, Wallet, CalendarClock, Pencil, Trash2, X } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/reports/export-button";
import { inr, formatDate } from "@/lib/utils";

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5";
const COLORS = ["#1a2b4c", "#c9a227", "#2563eb", "#e07a5f", "#3d9970", "#8e44ad", "#e67e22", "#16a085", "#c0392b", "#7f8c8d"];

type Category = { id: string; name: string };
type ExpenseRow = {
  id: string;
  date: string;
  categoryId: string;
  category: Category;
  description: string | null;
  amount: number;
  paidBy: string | null;
  mode: string | null;
  createdByName: string | null;
  createdAt: string;
};
type Summary = {
  today: number;
  month: number;
  byCategory: { name: string; total: number }[];
  trend: { label: string; total: number }[];
};

const emptyForm = { id: "", date: "", categoryId: "", description: "", amount: "", paidBy: "", mode: "Cash" };

export function ExpensesClient({
  initial,
  categories,
  summary,
  canManage,
}: {
  initial: ExpenseRow[];
  categories: Category[];
  summary: Summary;
  canManage: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [cats, setCats] = useState(categories);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [newCat, setNewCat] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (catFilter && r.categoryId !== catFilter) return false;
      if (from && r.date < from) return false;
      if (to && r.date > to + "T23:59:59") return false;
      if (q) {
        const hay = `${r.category.name} ${r.description ?? ""} ${r.paidBy ?? ""} ${r.mode ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, q, catFilter, from, to]);

  const filteredTotal = filtered.reduce((s, r) => s + r.amount, 0);

  function openNew() {
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10), categoryId: cats[0]?.id ?? "" });
    setErr(null);
    setOpen(true);
  }
  function openEdit(r: ExpenseRow) {
    setForm({
      id: r.id,
      date: r.date.slice(0, 10),
      categoryId: r.categoryId,
      description: r.description ?? "",
      amount: String(r.amount),
      paidBy: r.paidBy ?? "",
      mode: r.mode ?? "Cash",
    });
    setErr(null);
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/expenses/${form.id}` : "/api/expenses", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not save");
      setOpen(false);
      router.refresh();
      // optimistic local update so table reflects instantly
      if (isEdit) {
        setRows((prev) => prev.map((r) => (r.id === d.expense.id ? { ...d.expense } : r)));
      } else {
        setRows((prev) => [d.expense, ...prev]);
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this expense entry?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Could not delete");
    }
  }

  async function addCategory() {
    const name = newCat.trim();
    if (!name) return;
    const res = await fetch("/api/expenses/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const d = await res.json();
    if (res.ok) {
      setCats((prev) => (prev.some((c) => c.id === d.category.id) ? prev : [...prev, d.category].sort((a, b) => a.name.localeCompare(b.name))));
      setForm((f) => ({ ...f, categoryId: d.category.id }));
      setNewCat("");
    } else {
      alert(d.error || "Could not add category");
    }
  }

  const pieData = summary.byCategory.map((c) => ({ name: c.name, value: c.total }));
  const csvColumns = ["Date", "Category", "Description", "Amount", "Paid By", "Mode", "Entered By"];
  const csvRows = filtered.map((r) => [formatDate(r.date), r.category.name, r.description ?? "", r.amount, r.paidBy ?? "", r.mode ?? "", r.createdByName ?? ""]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Expenses</h1>
          <p className="text-sm text-ink-muted">Day-to-day operational spend — food, electricity, fuel, rent and more.</p>
        </div>
        {canManage && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> New Expense
          </Button>
        )}
      </div>

      {/* summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Today" value={inr(summary.today)} tone="brand" />
        <StatCard icon={<CalendarClock className="h-5 w-5" />} label="This month" value={inr(summary.month)} tone="amber" />
        <StatCard icon={<Receipt className="h-5 w-5" />} label="Entries (filtered)" value={String(filtered.length)} sub={inr(filteredTotal)} tone="brand" />
      </div>

      {/* charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink dark:text-slate-100">Category-wise spend (this month)</h3>
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">No expenses recorded this month yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={(d) => d.name}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => inr(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink dark:text-slate-100">Weekly trend (last 8 weeks)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={summary.trend} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <Line type="monotone" dataKey="total" stroke="#1a2b4c" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-3 dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 dark:border-white/10">
          <Search className="h-4 w-4 text-ink-muted" />
          <input className="w-full bg-transparent py-2 text-sm outline-none" placeholder="Search description / paid by / mode..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={input + " w-auto"} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input type="date" className={input + " w-auto"} value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-xs text-ink-muted">to</span>
        <input type="date" className={input + " w-auto"} value={to} onChange={(e) => setTo(e.target.value)} />
        <ExportButton columns={csvColumns} rows={csvRows} filename="expenses" />
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Paid By</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Entered By</th>
                {canManage && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="px-4 py-16 text-center text-ink-muted">
                    <Receipt className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    No expenses match these filters.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{formatDate(r.date)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">{r.category.name}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{r.description || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">{inr(r.amount)}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{r.paidBy || "—"}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{r.mode || "—"}</td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{r.createdByName || "—"}</td>
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
                  <td colSpan={canManage ? 4 : 3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* add/edit modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[rgb(var(--surface))]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">{form.id ? "Edit Expense" : "New Expense"}</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-ink-muted hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            {err && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{err}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-1">
                <span className="mb-1 block text-xs text-ink-muted">Date</span>
                <input type="date" className={input} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </label>
              <label className="sm:col-span-1">
                <span className="mb-1 block text-xs text-ink-muted">Amount (₹)</span>
                <input type="number" min="0" step="0.01" className={input} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-muted">Category</span>
                <div className="flex gap-2">
                  <select className={input} value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-muted">Add a new category</span>
                <div className="flex gap-2">
                  <input className={input} placeholder="e.g. Water, AMC, Courier" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
                  <Button variant="outline" onClick={addCategory} type="button">Add</Button>
                </div>
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-muted">Description</span>
                <textarea rows={2} className={input} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Paid By</span>
                <input className={input} placeholder="e.g. Sunil / Petty cash" value={form.paidBy} onChange={(e) => setForm((f) => ({ ...f, paidBy: e.target.value }))} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Mode</span>
                <select className={input} value={form.mode} onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}>
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Card</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} loading={busy}>Save Expense</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone: string }) {
  const tones: Record<string, string> = {
    brand: "text-brand-600 bg-brand-50 dark:bg-brand-500/10",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
  };
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>{icon}</div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-ink dark:text-slate-100">{value}</p>
      {sub && <p className="text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}
