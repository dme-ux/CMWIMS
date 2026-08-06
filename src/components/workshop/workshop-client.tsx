"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wrench, Printer, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WORKSHOP_STATUSES, jobStatusMeta } from "@/lib/workshop";
import { inr, formatDate } from "@/lib/utils";
import { SignaturePad, type SignaturePadHandle } from "@/components/workshop/signature-pad";
import { JobCardPrint, type PrintJob } from "@/components/workshop/jobcard-print";

type Customer = { id: string; name: string };
type Job = {
  id: string; jobNumber: string; complaint: string | null; status: string;
  estimate: number | null; createdAt: string;
  vehicleNo: string | null; model: string | null; odometer: number | null; contactNo: string | null;
  serviceType: string | null; additionalRequests: string | null;
  custSignature: string | null; advisorSignature: string | null;
  customer: { name: string } | null;
};
type Company = { name?: string; address?: string; phone?: string };

export function WorkshopClient({ jobs, customers, canManage, company }: { jobs: Job[]; customers: Customer[]; canManage: boolean; company: Company }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ customerId: "", customerName: "", contactNo: "", vehicleNo: "", model: "", odometer: "" as number | "", serviceType: "", additionalRequests: "", complaint: "", estimate: "" as number | "" });
  const [custSig, setCustSig] = useState(false);
  const [advSig, setAdvSig] = useState(false);
  const custRef = useRef<SignaturePadHandle>(null);
  const advRef = useRef<SignaturePadHandle>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  async function create() {
    setError(null);
    if (!f.complaint.trim()) return setError("Enter the complaint / work required.");
    setBusy(true);
    try {
      const payload: any = { ...f };
      if (custSig) payload.custSignature = custRef.current?.getDataUrl() || null;
      if (advSig) payload.advisorSignature = advRef.current?.getDataUrl() || null;

      const res = await fetch("/api/workshop-jobs", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create.");
      setShowForm(false); setCustSig(false); setAdvSig(false);
      setF({ customerId: "", customerName: "", contactNo: "", vehicleNo: "", model: "", odometer: "", serviceType: "", additionalRequests: "", complaint: "", estimate: "" });
      router.refresh();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/workshop-jobs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    router.refresh();
  }

  function openPrint(j: Job) {
    setPrintJob({
      jobNumber: j.jobNumber, createdAt: j.createdAt, status: j.status,
      customerName: j.customer?.name || "Walk-in", contactNo: j.contactNo,
      vehicleNo: j.vehicleNo, model: j.model, odometer: j.odometer,
      serviceType: j.serviceType, additionalRequests: j.additionalRequests, complaint: j.complaint,
      estimate: j.estimate, custSignature: j.custSignature, advisorSignature: j.advisorSignature,
    });
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <F label="Customer">
              <select value={f.customerId} onChange={(e) => { const c = customers.find((x) => x.id === e.target.value); set("customerId", e.target.value); set("customerName", c?.name || ""); }} className={inputCls}>
                <option value="">— Walk-in / none —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </F>
            <F label="Contact no."><input value={f.contactNo} onChange={(e) => set("contactNo", e.target.value)} className={inputCls} /></F>
            <F label="Vehicle no."><input value={f.vehicleNo} onChange={(e) => set("vehicleNo", e.target.value.toUpperCase())} placeholder="DL01AB1234" className={inputCls} /></F>
            <F label="Model"><input value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="E-Class, F-Pace…" className={inputCls} /></F>
            <F label="Odometer (KM)"><input type="number" value={f.odometer} onChange={(e) => set("odometer", e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} /></F>
            <F label="Estimate (₹)"><input type="number" value={f.estimate} onChange={(e) => set("estimate", e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} /></F>
            <F label="Service type"><input value={f.serviceType} onChange={(e) => set("serviceType", e.target.value)} placeholder="General Service, AC…" className={inputCls} /></F>
            <F label="Additional requests"><input value={f.additionalRequests} onChange={(e) => set("additionalRequests", e.target.value)} className={inputCls} /></F>
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="mb-1 block text-xs font-medium text-ink-muted">Complaint / work required</span>
              <textarea value={f.complaint} onChange={(e) => set("complaint", e.target.value)} rows={3} className={inputCls} />
            </label>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <SigBlock title="Customer signature" enabled={custSig} onToggle={setCustSig} onClear={() => custRef.current?.clear()} padRef={custRef} color="#1e40af" />
            <SigBlock title="Advisor / Executive signature" enabled={advSig} onToggle={setAdvSig} onClear={() => advRef.current?.clear()} padRef={advRef} color="#b45309" />
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
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3 text-right">Estimate</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {jobs.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-ink-muted">
                  <Wrench className="mx-auto mb-3 h-8 w-8 opacity-40" /> No job cards yet.{canManage && " Create your first one."}
                </td></tr>
              )}
              {jobs.map((j) => {
                const [label, cls] = jobStatusMeta(j.status);
                return (
                  <tr key={j.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-ink dark:text-slate-100">{j.jobNumber}</td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">
                      {j.customer?.name || "Walk-in"}{j.contactNo && <div className="text-xs text-ink-muted">{j.contactNo}</div>}
                    </td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">
                      {j.vehicleNo ? <span className="font-medium">{j.vehicleNo}</span> : "—"}
                      {(j.model || j.odometer) && <div className="text-xs text-ink-muted">{[j.model, j.odometer ? `${j.odometer} km` : null].filter(Boolean).join(" · ")}</div>}
                    </td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300 max-w-[180px] truncate">{j.serviceType || j.complaint}</td>
                    <td className="px-4 py-3 text-right">{j.estimate ? inr(j.estimate) : "—"}</td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <select value={j.status} onChange={(e) => changeStatus(j.id, e.target.value)} className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${cls}`}>
                          {WORKSHOP_STATUSES.map((s) => <option key={s} value={s}>{jobStatusMeta(s)[0]}</option>)}
                        </select>
                      ) : <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openPrint(j)} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:border-white/10 dark:text-brand-200">
                        <Printer className="h-3.5 w-3.5" /> Print
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {printJob && <JobCardPrint job={printJob} company={company} onClose={() => setPrintJob(null)} />}
    </div>
  );
}

function SigBlock({ title, enabled, onToggle, onClear, padRef, color }: { title: string; enabled: boolean; onToggle: (v: boolean) => void; onClear: () => void; padRef: React.Ref<SignaturePadHandle>; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200/70 p-3 dark:border-white/10">
      <div className="mb-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-ink dark:text-slate-100">
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} className="h-4 w-4 accent-brand-600" />
          {title}
        </label>
        {enabled && <button type="button" onClick={onClear} className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand-600"><Eraser className="h-3.5 w-3.5" /> Clear</button>}
      </div>
      {enabled ? <SignaturePad ref={padRef} color={color} /> : <p className="text-xs text-ink-muted">Disabled — will show &ldquo;Not Available&rdquo; on the printed job card.</p>}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>{children}</label>;
}
