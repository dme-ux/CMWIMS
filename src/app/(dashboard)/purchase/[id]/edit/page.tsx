import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getPOFormData, getPurchaseOrderById } from "@/lib/purchase";
import { POForm } from "@/components/purchase/po-form";

export const dynamic = "force-dynamic";

export default async function EditPOPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "purchase.manage")) redirect("/purchase");
  const [po, data] = await Promise.all([getPurchaseOrderById(id), getPOFormData()]);
  if (!po) notFound();
  if (["RECEIVED", "CANCELLED"].includes(po.status)) redirect(`/purchase/${po.id}`);

  const initialOrder = {
    id: po.id, number: po.number, status: po.status, vendorId: po.vendorId,
    expectedDate: po.expectedDate ? po.expectedDate.toISOString().slice(0, 10) : "",
    notes: po.notes || "",
    items: po.items.map((l) => ({ id: l.id, itemId: l.itemId, quantity: l.quantity, receivedQty: l.receivedQty, rate: l.rate, gstRate: l.gstRate })),
  };

  return <div className="space-y-5"><div><h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Edit Purchase Order</h1><p className="text-sm text-ink-muted">{po.number} · {po.vendor.name}</p></div><POForm vendors={data.vendors} items={data.items} initialOrder={initialOrder} /></div>;
}
