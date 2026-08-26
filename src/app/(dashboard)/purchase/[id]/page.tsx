import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, PackageCheck, MapPin, ReceiptText } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getPurchaseOrderById, poStatusMeta } from "@/lib/purchase";
import { inr, formatDate } from "@/lib/utils";
import { POActions } from "@/components/purchase/po-actions";
import { POPrintButton } from "@/components/purchase/po-print";

export const dynamic = "force-dynamic";

export default async function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "purchase.view")) redirect("/dashboard");
  const po = await getPurchaseOrderById(id);
  if (!po) notFound();
  const [label, cls] = poStatusMeta(po.status);
  const canManage = can(session.role, "purchase.manage");
  const editable = canManage && !["RECEIVED", "CANCELLED"].includes(po.status);
  const receivable = canManage && ["APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(po.status) && po.items.some((x) => x.receivedQty < x.quantity);

  return <div className="space-y-5">
    <Link href="/purchase" className="flex items-center gap-2 text-sm text-ink-muted hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Back to purchase orders</Link>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="flex items-center gap-3"><h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">{po.number}</h1><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span></div><p className="mt-1 text-sm text-ink-muted">{po.vendor.name} · {formatDate(po.orderDate)}</p></div>
      <div className="flex flex-wrap items-start gap-2">
        <POPrintButton po={po} />
        {editable && <Link href={`/purchase/${po.id}/edit`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:border-white/10 dark:bg-white/5"><Pencil className="h-4 w-4" /> Edit PO</Link>}
        {receivable && <Link href={`/inward/${po.id}`} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glass hover:bg-brand-700"><PackageCheck className="h-4 w-4" /> Receive material</Link>}
        <POActions id={po.id} status={po.status} canManage={canManage} canApprove={can(session.role, "purchase.approve")} />
      </div>
    </div>

    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5"><tr><th className="px-4 py-3">Item</th><th className="px-4 py-3 text-right">Ordered</th><th className="px-4 py-3 text-right">Received</th><th className="px-4 py-3 text-right">Pending</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">GST %</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
      <tbody className="divide-y divide-slate-100 dark:divide-white/5">{po.items.map((line)=><tr key={line.id}><td className="px-4 py-3"><div className="font-medium text-ink dark:text-slate-100">{line.item.name}</div><div className="text-xs text-ink-muted">{line.item.sku}</div></td><td className="px-4 py-3 text-right">{line.quantity}</td><td className="px-4 py-3 text-right font-medium text-emerald-700">{line.receivedQty}</td><td className="px-4 py-3 text-right font-medium text-amber-700">{Math.max(0,line.quantity-line.receivedQty)}</td><td className="px-4 py-3 text-right">{inr(line.rate)}</td><td className="px-4 py-3 text-right">{line.gstRate}%</td><td className="px-4 py-3 text-right font-medium">{inr(line.amount)}</td></tr>)}</tbody></table>
      <div className="flex justify-end border-t border-slate-100 px-5 py-4 dark:border-white/5"><div className="w-64 space-y-1.5 text-sm"><div className="flex justify-between text-ink-soft dark:text-slate-300"><span>Sub total</span><span>{inr(po.subTotal)}</span></div><div className="flex justify-between text-ink-soft dark:text-slate-300"><span>GST</span><span>{inr(po.taxTotal)}</span></div><div className="flex justify-between border-t border-slate-200 pt-2 font-display text-base font-bold text-ink dark:border-white/10 dark:text-slate-100"><span>Grand total</span><span>{inr(po.grandTotal)}</span></div></div></div>
    </div>

    {po.receipts.length > 0 && <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/5"><h3 className="flex items-center gap-2 font-display text-sm font-semibold"><ReceiptText className="h-4 w-4" /> Goods Receipt / GRN History</h3><span className="text-xs text-ink-muted">{po.receipts.length} receipt(s)</span></div>
      <div className="divide-y divide-slate-100 dark:divide-white/5">{po.receipts.map((r)=><div key={r.id} className="p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><Link href={`/inward/grn/${r.id}`} className="font-semibold text-brand-600 hover:underline">{r.number}</Link><span className="ml-2 text-xs text-ink-muted">{formatDate(r.createdAt)} · {r.receivedBy?.name || "System"}</span></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Received</span></div><div className="grid gap-2 md:grid-cols-2">{r.items.map((x)=><div key={x.id} className="rounded-xl border border-slate-100 p-3 text-sm dark:border-white/5"><div className="font-medium">{x.item.name} · Qty {x.quantity}</div><div className="mt-1 flex items-start gap-1 text-xs text-ink-muted"><MapPin className="mt-0.5 h-3 w-3 shrink-0" />{[x.warehouse.name,x.rack?.name,x.shelf?.name,x.bin?.name].filter(Boolean).join(" → ")}</div></div>)}</div></div>)}</div>
    </div>}

    {po.notes && <p className="text-sm text-ink-muted">Notes: {po.notes}</p>}
  </div>;
}
