// ============================================================================
//  Purchase Order data helpers.
// ============================================================================
import { prisma } from "@/lib/prisma";

/** Next PO number, e.g. PO-00001 (zero-padded running count). */
export async function generatePONumber() {
  const count = await prisma.purchaseOrder.count();
  return `PO-${String(count + 1).padStart(5, "0")}`;
}

export async function getPurchaseOrders() {
  return prisma.purchaseOrder.findMany({
    include: { vendor: true, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getPurchaseOrderById(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      items: { include: { item: true } },
      createdBy: true,
      approvedBy: true,
    },
  });
}

/** Vendors + items needed to build a new PO. */
export async function getPOFormData() {
  const [vendors, items] = await Promise.all([
    prisma.vendor.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, paymentTerms: true } }),
    prisma.item.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, purchaseRate: true, gstRate: true },
    }),
  ]);
  return { vendors, items };
}

/** Human label + colour class for a PO status. */
export function poStatusMeta(status: string): [string, string] {
  const map: Record<string, [string, string]> = {
    DRAFT: ["Draft", "bg-slate-100 text-slate-600"],
    PENDING_APPROVAL: ["Pending approval", "bg-amber-50 text-amber-700"],
    APPROVED: ["Approved", "bg-brand-50 text-brand-700"],
    SENT: ["Sent", "bg-indigo-50 text-indigo-700"],
    PARTIALLY_RECEIVED: ["Partially received", "bg-cyan-50 text-cyan-700"],
    RECEIVED: ["Received", "bg-emerald-50 text-emerald-700"],
    CANCELLED: ["Cancelled", "bg-red-50 text-red-700"],
  };
  return map[status] ?? [status, "bg-slate-100 text-slate-600"];
}
