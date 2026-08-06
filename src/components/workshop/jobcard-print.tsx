"use client";

import { Printer, X } from "lucide-react";

export type PrintJob = {
  jobNumber: string; createdAt: string; status: string;
  customerName: string; contactNo: string | null;
  vehicleNo: string | null; model: string | null; odometer: number | null;
  serviceType: string | null; additionalRequests: string | null; complaint: string | null;
  estimate: number | null; custSignature: string | null; advisorSignature: string | null;
};
type Company = { name?: string; address?: string; phone?: string };

function fmt(d: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

const TERMS = [
  "I hereby authorise the mentioned jobs to be executed using the required material / parts.",
  "I have removed all my belongings from my car and the company will not be responsible for any loss.",
  "All vehicles kept stored in our workshop or driven by our staff are at owner's risk.",
  "Mode of payment: Cash / Credit Cards / Debit Cards; taxes extra as applicable.",
  "Any additional repairs done in workshop or outside will be charged extra.",
  "Vehicle will only be handed over on producing this copy at the time of delivery.",
  "Repair estimate is prepared at the request of the customer and is subject to change.",
  "Payment of the invoice must be made in full before taking delivery; the company may retain the car until full payment is received.",
  "Garaging charges of Rs.1000/- per day are payable if the car is not collected within seven days of completion.",
  "Customers are requested to check their car to their entire satisfaction at the time of taking delivery.",
];

export function JobCardPrint({ job, company, onClose }: { job: PrintJob; company: Company; onClose: () => void }) {
  const sig = (data: string | null, label: string) =>
    data ? (
      <img src={data} alt={label} className="h-16 border border-slate-300 bg-white" />
    ) : (
      <div className="flex h-16 items-center text-xs italic text-slate-400">Not Available</div>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 print:static print:bg-white print:p-0" onClick={onClose}>
      <div className="my-4 w-full max-w-3xl rounded-2xl bg-white shadow-glass-lg print:my-0 print:max-w-none print:shadow-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 print:hidden">
          <h3 className="font-display text-sm font-semibold text-ink">Job Card preview</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"><Printer className="h-3.5 w-3.5" /> Print / PDF</button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div id="jobcard-print" className="p-8 text-slate-900 print:p-10">
          <div className="mb-4 flex items-center justify-center gap-4 border-b-2 border-brand-700 pb-4 text-center">
            <div>
              <h1 className="font-display text-2xl font-bold text-brand-700">{company.name || "CAPITAL MOTOR WORKS"}</h1>
              {company.address && <p className="mt-0.5 text-[11px] text-slate-500">{company.address}</p>}
              {company.phone && <p className="text-[11px] text-slate-500">Ph: {company.phone}</p>}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-x-8 gap-y-1 rounded bg-brand-50 px-4 py-2 text-sm">
            <span><b>Job Card No:</b> {job.jobNumber}</span>
            <span><b>Date/Time:</b> {fmt(job.createdAt)}</span>
            <span><b>Status:</b> {job.status}</span>
          </div>

          <SectionTitle>1. Customer &amp; Vehicle Details</SectionTitle>
          <table className="mb-4 w-full border-collapse text-sm">
            <tbody>
              <TR><TH>Customer Name</TH><TD>{job.customerName}</TD><TH>Vehicle No.</TH><TD>{job.vehicleNo || "—"}</TD></TR>
              <TR><TH>Contact</TH><TD>{job.contactNo || "—"}</TD><TH>Model</TH><TD>{job.model || "—"}</TD></TR>
              <TR><TH>Odometer</TH><TD>{job.odometer ? `${job.odometer} KMS` : "—"}</TD><TH>Estimate</TH><TD>{job.estimate ? `₹ ${job.estimate}` : "—"}</TD></TR>
            </tbody>
          </table>

          <SectionTitle>2. Service Requested</SectionTitle>
          <table className="mb-4 w-full border-collapse text-sm">
            <tbody>
              <TR><TH>Service Type</TH><TD colSpan={3}>{job.serviceType || "—"}</TD></TR>
              <TR><TH>Additional Requests</TH><TD colSpan={3}>{job.additionalRequests || "—"}</TD></TR>
              <TR><TH>Complaint</TH><TD colSpan={3}>{job.complaint || "—"}</TD></TR>
            </tbody>
          </table>

          <div className="mt-10 flex items-end justify-between gap-8">
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold text-slate-500">Customer Signature</div>
              {sig(job.custSignature, "Customer")}
              <div className="mt-1 border-t border-slate-400 pt-1 text-[11px] text-slate-600">{job.customerName}</div>
            </div>
            <div className="flex-1 text-right">
              <div className="mb-1 text-[11px] font-semibold text-slate-500">Advisor / Executive Signature</div>
              <div className="flex justify-end">{sig(job.advisorSignature, "Advisor")}</div>
              <div className="mt-1 border-t border-slate-400 pt-1 text-[11px] text-slate-600">{company.name || "Capital Motor Works"}</div>
            </div>
          </div>

          <div className="mt-10 break-before-page pt-2">
            <h2 className="mb-3 text-center font-display text-base font-bold uppercase tracking-wide text-brand-700">Terms &amp; Conditions</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-[11px] leading-relaxed text-slate-700">
              {TERMS.map((t, i) => <li key={i}>{t}</li>)}
            </ol>
            <div className="mt-10 flex items-end justify-between gap-8">
              <div className="flex-1"><div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600">Customer Signature</div></div>
              <div className="flex-1 text-right"><div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600">For {company.name || "Capital Motor Works"}</div></div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media print { body * { visibility: hidden; } #jobcard-print, #jobcard-print * { visibility: visible; } #jobcard-print { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 bg-brand-700 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">{children}</div>;
}
function TR({ children }: { children: React.ReactNode }) { return <tr>{children}</tr>; }
function TH({ children }: { children: React.ReactNode }) { return <th className="w-1/6 border border-slate-300 bg-slate-50 px-2 py-1.5 text-left font-semibold">{children}</th>; }
function TD({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) { return <td colSpan={colSpan} className="border border-slate-300 px-2 py-1.5">{children}</td>; }
