"use client";

import { useEffect, useState, useCallback } from "react";
import { UserPlus, KeyRound, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLES: [string, string][] = [
  ["ADMIN", "Administrator"], ["MANAGER", "Manager"], ["STORE_MANAGER", "Store Manager"],
  ["ACCOUNTS", "Accounts"], ["PURCHASE", "Purchase"], ["WORKSHOP", "Workshop"],
  ["SERVICE_ADVISOR", "Service Advisor"], ["TECHNICIAN", "Technician"], ["VIEWER", "Viewer"],
];

type User = { id: string; name: string; username: string; email: string; role: string; isActive: boolean };

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load users.");
      setUsers(data.users);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function patch(id: string, body: any) {
    const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Update failed."); return; }
    setError(null); load();
  }
  async function resetPassword(id: string, username: string) {
    const pw = prompt(`New password for ${username}:`);
    if (!pw) return;
    patch(id, { password: pw });
  }
  async function remove(id: string, username: string) {
    if (!confirm(`Deactivate ${username}?`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed."); return; }
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">{users.length} user{users.length === 1 ? "" : "s"}</p>
        <Button onClick={() => setAdding(true)}><UserPlus className="h-4 w-4" /> Add user</Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-muted">Loading…</td></tr>}
              {!loading && users.map((u) => (
                <tr key={u.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink dark:text-slate-100">{u.name}</div>
                    <div className="text-xs text-ink-muted">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{u.username}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none dark:border-white/10 dark:bg-white/5">
                      {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => patch(u.id, { isActive: !u.isActive })} className={`rounded-full px-2.5 py-1 text-xs font-medium ${u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => resetPassword(u.id, u.username)} title="Reset password" className="rounded-lg p-1.5 text-ink-muted hover:bg-brand-50 hover:text-brand-600"><KeyRound className="h-4 w-4" /></button>
                      <button onClick={() => remove(u.id, u.username)} title="Deactivate" className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {adding && <AddUserModal onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} onError={setError} />}
    </div>
  );
}

function AddUserModal({ onClose, onDone, onError }: { onClose: () => void; onDone: () => void; onError: (m: string) => void }) {
  const [f, setF] = useState({ name: "", username: "", email: "", password: "", role: "VIEWER" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    if (!f.name || !f.username || !f.email || !f.password) { onError("Fill in all fields."); return; }
    setBusy(true);
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { onError(data.error || "Could not create."); return; }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-glass-lg dark:bg-[rgb(var(--surface))]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">Add user</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Full name" value={f.name} onChange={(v) => set("name", v)} />
          <Field label="Username" value={f.username} onChange={(v) => set("username", v)} />
          <Field label="Email" value={f.email} onChange={(v) => set("email", v)} />
          <Field label="Password" type="password" value={f.password} onChange={(v) => set("password", v)} />
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-muted">Role</span>
            <select value={f.role} onChange={(e) => set("role", e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5">
              {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-slate-100 dark:hover:bg-white/5">Cancel</button>
          <Button onClick={submit} loading={busy}><Save className="h-4 w-4" /> Create user</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5" />
    </label>
  );
}
