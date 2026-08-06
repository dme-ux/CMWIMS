"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Printer, X, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

type Pass = {
  id: string; number: string; date: string; partyName: string; vehicleNo: string;
  purpose: string | null; authorisedBy: string | null;
};
type Company = { name?: string; address?: string; phone?: string };

function fmt(d: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

export function GatePassClient({ passes, company }: { passes: Pass[]; company: Company }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [printing, setPrinting] = useState<Pass | null>(null);
  const [f, setF] = useState({ partyName: "", vehicleNo: "", date: "", purpose: "", authorisedBy: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function create() {
    setError(null);
    if (!f.partyName.trim() || !f.vehicleNo.trim()) return setError("Party name and vehicle number are required.");
    setBusy(true);
    try {
      const res = await fetch("/api/gate-passes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create.");
      setShowForm(false);
      setF({ partyName: "", vehicleNo: "", date: "", purpose: "", authorisedBy: "" });
      router.refresh();
      setPrinting(data.pass);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((s) => !s)}><Plus className="h-4 w-4" /> {showForm ? "Close" : "New gate pass"}</Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
          <h3 className="mb-4 font-display text-sm font-semibold text-ink dark:text-slate-100">New gate pass · Vehicle delivery</h3>
          {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Party name *" value={f.partyName} onChange={(v) => set("partyName", v)} />
            <Field label="Vehicle number *" value={f.vehicleNo} onChange={(v) => set("vehicleNo", v)} />
            <Field label="Date" type="date" value={f.date} onChange={(v) => set("date", v)} />
            <Field label="Purpose (optional)" value={f.purpose} onChange={(v) => set("purpose", v)} />
            <Field label="Authorised by (optional)" value={f.authorisedBy} onChange={(v) => set("authorisedBy", v)} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={create} loading={busy}><Ticket className="h-4 w-4" /> Generate</Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Pass #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Party</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3 text-right">Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {passes.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-ink-muted">
                  <Ticket className="mx-auto mb-3 h-8 w-8 opacity-40" /> No gate passes yet.
                </td></tr>
              )}
              {passes.map((p) => (
                <tr key={p.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-ink dark:text-slate-100">{p.number}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{fmt(p.date)}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{p.partyName}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{p.vehicleNo}</td>
                  <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{p.purpose || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setPrinting(p)} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:border-white/10 dark:text-brand-200">
                      <Printer className="h-3.5 w-3.5" /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {printing && <PrintModal pass={printing} company={company} onClose={() => setPrinting(null)} />}
    </div>
  );
}

function PrintModal({ pass, company, onClose }: { pass: Pass; company: Company; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:static print:bg-white print:p-0" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-0 shadow-glass-lg print:max-w-none print:shadow-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 print:hidden">
          <h3 className="font-display text-sm font-semibold text-ink">Gate Pass preview</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"><Printer className="h-3.5 w-3.5" /> Print / PDF</button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="p-8 text-ink print:p-10" id="gatepass-print">
          <div className="mb-6 border-b-2 border-brand-600 pb-4 text-center">
            <h1 className="font-display text-2xl font-bold text-brand-700">{company.name || "Capital Motor Works"}</h1>
            {company.address && <p className="mt-0.5 text-xs text-ink-muted">{company.address}</p>}
            {company.phone && <p className="text-xs text-ink-muted">Ph: {company.phone}</p>}
            <p className="mt-3 inline-block rounded bg-brand-50 px-4 py-1 font-display text-sm font-bold uppercase tracking-wider text-brand-700">Vehicle Gate Pass</p>
          </div>

          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <Row label="Gate Pass No." value={pass.number} />
            <Row label="Date" value={fmt(pass.date)} />
            <Row label="Party Name" value={pass.partyName} span />
            <Row label="Vehicle No." value={pass.vehicleNo} />
            {pass.purpose && <Row label="Purpose" value={pass.purpose} />}
          </div>

          <div className="mt-14 flex items-end justify-between">
            <div className="text-center">
              <div className="w-40 border-t border-slate-400 pt-1 text-xs text-ink-muted">Security</div>
            </div>
            <div className="text-center">
              <div className="w-40 border-t border-slate-400 pt-1 text-xs text-ink-muted">{pass.authorisedBy || "Authorised Signatory"}</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media print { body * { visibility: hidden; } #gatepass-print, #gatepass-print * { visibility: visible; } #gatepass-print { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
    </div>
  );
}

function Row({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <div className="text-xs uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-0.5 font-semibold">{value}</div>
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
