import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getBillById, paymentStatusMeta } from "@/lib/accounting";
import { inr, formatDate } from "@/lib/utils";
import { PaymentPanel } from "@/components/accounting/payment-panel";

export const dynamic = "force-dynamic";

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "accounts.view")) redirect("/dashboard");

  const bill = await getBillById(id);
  if (!bill) notFound();
  const [label, cls] = paymentStatusMeta(bill.paymentStatus);
  const pending = bill.grandTotal - bill.paidAmount;
  const canManage = can(session.role, "accounts.manage");

  return (
    <div className="space-y-5">
      <Link href="/accounting" className="flex items-center gap-2 text-sm text-ink-muted hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to accounting
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">{bill.number}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {bill.vendor.name} · {formatDate(bill.invoiceDate)}{bill.po ? ` · PO ${bill.po.number}` : ""}
          </p>
        </div>
      </div>

      {/* amounts */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Amount label="Bill total" value={inr(bill.grandTotal)} />
        <Amount label="Paid" value={inr(bill.paidAmount)} />
        <Amount label="Pending" value={inr(pending)} highlight />
      </div>

      {canManage && <PaymentPanel billId={bill.id} pending={pending} />}

      {/* payment history */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="border-b border-slate-100 px-5 py-3 dark:border-white/5">
          <h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Payment history</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {bill.payments.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-muted">No payments recorded yet.</td></tr>
            )}
            {bill.payments.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{formatDate(p.paidAt)}</td>
                <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{p.mode || "—"}</td>
                <td className="px-4 py-3 text-ink-soft dark:text-slate-300">{p.reference || "—"}</td>
                <td className="px-4 py-3 text-right font-medium">{inr(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Amount({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-card ${highlight ? "border-brand-200 bg-brand-50 dark:border-brand-500/20 dark:bg-brand-500/10" : "border-slate-200/70 bg-white dark:border-white/10 dark:bg-[rgb(var(--surface))]"}`}>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${highlight ? "text-brand-700 dark:text-brand-200" : "text-ink dark:text-slate-100"}`}>{value}</p>
    </div>
  );
}
