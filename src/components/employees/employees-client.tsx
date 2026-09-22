"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Users, Pencil, Trash2, X, Wallet, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inr, formatDate } from "@/lib/utils";

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5";

type Employee = {
  id: string;
  code: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  salary: number;
  isActive: boolean;
  joinedAt: string;
};

const emptyForm = { id: "", name: "", role: "", phone: "", email: "", salary: "" };

export function EmployeesClient({ initial, canManage }: { initial: Employee[]; canManage: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (!showInactive && !r.isActive) return false;
      if (q) {
        const hay = `${r.name} ${r.role} ${r.code} ${r.phone ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, q, showInactive]);

  const totalMonthlySalary = filtered.filter((r) => r.isActive).reduce((s, r) => s + r.salary, 0);

  function openNew() {
    setForm(emptyForm);
    setErr(null);
    setOpen(true);
  }
  function openEdit(r: Employee) {
    setForm({ id: r.id, name: r.name, role: r.role, phone: r.phone ?? "", email: r.email ?? "", salary: String(r.salary) });
    setErr(null);
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const isEdit = !!form.id;
      const res = await fetch(isEdit ? `/api/employees/${form.id}` : "/api/employees", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not save");
      setOpen(false);
      router.refresh();
      if (isEdit) {
        setRows((prev) => prev.map((r) => (r.id === d.employee.id ? { ...r, ...d.employee } : r)));
      } else {
        setRows((prev) => [...prev, d.employee]);
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this employee? (If they have past salary history, they'll be deactivated instead of deleted.)")) return;
    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: false } : r)).filter((r) => r.id !== id || !r.isActive));
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Could not remove");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Employees</h1>
          <p className="text-sm text-ink-muted">Add employees once with their fixed monthly salary — used every month by the Salary module.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/salary">
            <Button variant="outline"><Wallet className="h-4 w-4" /> Go to Salary</Button>
          </Link>
          {canManage && (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Add Employee
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={<Users className="h-5 w-5" />} label="Active employees" value={String(filtered.filter((r) => r.isActive).length)} />
        <StatCard icon={<IndianRupee className="h-5 w-5" />} label="Total fixed monthly salary" value={inr(totalMonthlySalary)} />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-3 dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 dark:border-white/10">
          <Search className="h-4 w-4 text-ink-muted" />
          <input className="w-full bg-transparent py-2 text-sm outline-none" placeholder="Search name / role / phone..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show inactive
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-right">Monthly Salary</th>
                <th className="px-4 py-3">Status</th>
                {canManage && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-4 py-16 text-center text-ink-muted">
                    <Users className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    No employees yet — add your first employee.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-xs text-ink-muted">{r.code}</td>
                  <td className="px-4 py-3 font-medium text-ink dark:text-slate-100">{r.name}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{r.role}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{r.phone || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">{inr(r.salary)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.isActive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10" : "bg-slate-100 text-slate-500 dark:bg-white/5"}`}>
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
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
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[rgb(var(--surface))]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">{form.id ? "Edit Employee" : "Add Employee"}</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-ink-muted hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            {err && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{err}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-muted">Name</span>
                <input className={input} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Role</span>
                <input className={input} placeholder="e.g. Technician, Advisor, Helper" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Fixed Monthly Salary (₹)</span>
                <input type="number" min="0" step="1" className={input} value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Phone</span>
                <input className={input} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-ink-muted">Email (optional)</span>
                <input className={input} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} loading={busy}>Save Employee</Button>
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
