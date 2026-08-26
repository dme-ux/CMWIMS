import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getGRNById } from "@/lib/grn";
import { formatDate, inr } from "@/lib/utils";

export const dynamic = "force-dynamic";
export default async function GRNPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession(); if (!session || !can(session.role, "purchase.view")) redirect("/dashboard");
  const grn = await getGRNById(id); if (!grn) notFound();
  return <div className="space-y-5">
    <Link href={`/purchase/${grn.poId}`} className="flex items-center gap-2 text-sm text-ink-muted hover:text-brand-600"><ArrowLeft className="h-4 w-4"/> Back to {grn.po.number}</Link>
    <div><h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Goods Receipt · {grn.number}</h1><p className="text-sm text-ink-muted">{grn.po.vendor.name} · {formatDate(grn.createdAt)} · Received by {grn.receivedBy?.name || "System"}</p></div>
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]"><table className="w-full min-w-[900px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5"><tr><th className="px-4 py-3">Part</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3">Stored Location</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/5">{grn.items.map((x)=><tr key={x.id}><td className="px-4 py-3"><div className="font-medium">{x.item.name}</div><div className="text-xs text-ink-muted">{x.item.sku}</div></td><td className="px-4 py-3 text-right font-medium">{x.quantity}</td><td className="px-4 py-3 text-right">{inr(x.rate)}</td><td className="px-4 py-3"><span className="inline-flex items-start gap-1 text-xs"><MapPin className="mt-0.5 h-3 w-3 text-amber-500"/>{[x.warehouse.name,x.rack?.name,x.shelf?.name,x.bin?.name].filter(Boolean).join(" → ")}</span></td></tr>)}</tbody></table></div>
  </div>;
}
