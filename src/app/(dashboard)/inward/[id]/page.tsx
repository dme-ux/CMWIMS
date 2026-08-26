import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getReceivablePOById, RECEIVABLE_STATUSES } from "@/lib/inward";
import { getLocationMasters } from "@/lib/stock";
import { ReceiveForm } from "@/components/inward/receive-form";

export const dynamic = "force-dynamic";

export default async function ReceivePOPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "purchase.manage")) redirect("/dashboard");

  const [po, masters] = await Promise.all([getReceivablePOById(id), getLocationMasters()]);
  if (!po) notFound();
  if (!RECEIVABLE_STATUSES.includes(po.status)) redirect(`/purchase/${po.id}`);

  const lines = po.items.map((l) => ({ id: l.id, name: l.item.name, sku: l.item.sku, quantity: l.quantity, receivedQty: l.receivedQty, rate: l.rate }));

  return (
    <div className="space-y-5">
      <div><h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Receive material · {po.number}</h1><p className="text-sm text-ink-muted">{po.vendor.name}</p></div>
      {masters.warehouses.length === 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Create at least one Warehouse under Masters before receiving material.</div>}
      <ReceiveForm poId={po.id} poNumber={po.number} lines={lines} masters={masters} />
    </div>
  );
}
