import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Wallet, AlertTriangle, FileText } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getBills, getOutstandingSummary, getVendorDues, paymentStatusMeta } from "@/lib/accounting";
import { inr, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountingPage() {
  const session = await getSession();
  if (!session || !can(session.role, "accounts.view")) redirect("/dashboard");
  const canManage = can(session.role, "accounts.manage");
  const [bills, summary, vendorDues] = await Promise.all([getBills(), getOutstandingSummary(), getVendorDues()]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Accounting</h1>
          <p className="text-sm text-ink-muted">Vendor bills, payments and outstanding.</p>
        </div>
        {canManage && (
          <Link href="/accounting/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glass hover:bg-brand-700">
            <Plus className="h-4 w-4" /> New bill
          </Link>
        )}
      </div>

      {/* summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard icon={<Wallet className="h-5 w-5" />} label="Total outstanding" value={inr(summary.outstanding)} tone="brand" />
        <SummaryCard icon={<FileText className="h-5 w-5" />} label="Unpaid bills" value={summary.unpaidCount} tone="amber" />
        <SummaryCard icon={<AlertTriangle className="h-5 w-5" />} label="Overdue bills" value={summary.overdue} tone="red" />
      </div>

      {/* vendor-wise ledger — "kitna vendor ko due hai, kitna pay kiya" */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="border-b border-slate-200/70 px-4 py-3 dark:border-white/10">
          <h2 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Vendor Ledger — billed, paid &amp; pending</h2>
          <p className="text-xs text-ink-muted">Running total across every bill, per vendor.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3 text-right">Billed</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {vendorDues.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-ink-muted">No vendor bills yet.</td></tr>
              )}
              {vendorDues.map((v) => (
                <tr key={v.vendorId} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-ink dark:text-slate-100">{v.name}</td>
                  <td className="px-4 py-3 text-right text-ink-soft dark:text-slate-300">{inr(v.billed)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{inr(v.paid)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${v.pending > 0 ? "text-red-600" : "text-ink-soft"}`}>{inr(v.pending)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Bill #</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {bills.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-ink-muted">
                  <FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />
                  No bills yet.{canManage && " Create your first vendor bill."}
                </td></tr>
              )}
              {bills.map((bill) => {
                const [label, cls] = paymentStatusMeta(bill.paymentStatus);
                const pending = bill.grandTotal - bill.paidAmount;
                return (
                  <tr key={bill.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <Link href={`/accounting/${bill.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-300">{bill.number}</Link>
                    </td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{bill.vendor.name}</td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{formatDate(bill.invoiceDate)}</td>
                    <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{bill.dueDate ? formatDate(bill.dueDate) : "—"}</td>
                    <td className="px-4 py-3 text-right">{inr(bill.grandTotal)}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(pending)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span></td>
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

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone: string }) {
  const tones: Record<string, string> = {
    brand: "text-brand-600 bg-brand-50 dark:bg-brand-500/10",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
    red: "text-red-600 bg-red-50 dark:bg-red-500/10",
  };
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>{icon}</div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-ink dark:text-slate-100">{value}</p>
    </div>
  );
}
