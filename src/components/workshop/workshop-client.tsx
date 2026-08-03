"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WORKSHOP_STATUSES, jobStatusMeta } from "@/lib/workshop";
import { inr, formatDate } from "@/lib/utils";

type Customer = { id: string; name: string };
type Job = {
  id: string; jobNumber: string; complaint: string | null; status: string;
  estimate: number | null; createdAt: string; customer: { name: string } | null;
};

/** Workshop job cards — create + manage status inline. */
export function WorkshopClient({ jobs, customers, canManage }: { jobs: Job[]; customers: Customer[]; canManage: boolean }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [complaint, setComplaint] = useState("");
  const [estimate, setEstimate] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    if (!complaint.trim()) return setError("Enter the complaint / work required.");
    setBusy(true);
    try {
      const res = await fetch("/api/workshop-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, complaint, estimate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create.");
      setShowForm(false); setComplaint(""); setEstimate(""); setCustomerId("");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/workshop-jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setShowForm((s) => !s)}><Plus className="h-4 w-4" /> {showForm ? "Close" : "New job card"}</Button>
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
          <h3 className="mb-4 font-display text-sm font-semibold text-ink dark:text-slate-100">New job card</h3>
          {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-muted">Customer</span>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5">
                <option value="">— Walk-in / none —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-muted">Estimate (₹)</span>
              <input type="number" value={estimate} onChange={(e) => setEstimate(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-ink-muted">Complaint / work required</span>
              <textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5" />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={create} loading={busy}><Wrench className="h-4 w-4" /> Create job card</Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Job #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Complaint</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Estimate</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {jobs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-ink-muted">
                  <Wrench className="mx-auto mb-3 h-8 w-8 opacity-40" />
                  No job cards yet.{canManage && " Create your first one."}
                </td></tr>
              )}
              {jobs.map((j) => {
                const [label, cls] = jobStatusMeta(j.status);
                return (
                  <tr key={j.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-ink dark:text-slate-100">{j.jobNumber}</td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{j.customer?.name || "Walk-in"}</td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300 max-w-xs truncate">{j.complaint}</td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{formatDate(j.createdAt)}</td>
                    <td className="px-4 py-3 text-right">{j.estimate ? inr(j.estimate) : "—"}</td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <select value={j.status} onChange={(e) => changeStatus(j.id, e.target.value)} className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${cls}`}>
                          {WORKSHOP_STATUSES.map((s) => <option key={s} value={s}>{jobStatusMeta(s)[0]}</option>)}
                        </select>
                      ) : (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
