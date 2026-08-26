// ============================================================================
// Purchase Order data helpers.
// ============================================================================
import { prisma } from "@/lib/prisma";

/** Concurrency-safe running document number, safely bootstrapped from live data. */
async function nextCounter(key: "PO" | "GRN") {
  let current = await prisma.documentCounter.findUnique({ where: { key } });
  if (!current) {
    const numbers = key === "PO"
      ? (await prisma.purchaseOrder.findMany({ select: { number: true } })).map((x) => x.number)
      : (await prisma.goodsReceipt.findMany({ select: { number: true } })).map((x) => x.number);
    const max = numbers.reduce((m, v) => {
      const hit = v.match(/^(?:PO|GRN)-(\d+)$/i);
      return hit ? Math.max(m, Number(hit[1]) || 0) : m;
    }, 0);
    try { current = await prisma.documentCounter.create({ data: { key, lastNo: max } }); }
    catch { current = await prisma.documentCounter.findUnique({ where: { key } }); }
  }
  const row = await prisma.documentCounter.upsert({
    where: { key }, update: { lastNo: { increment: 1 } }, create: { key, lastNo: 1 },
  });
  return row.lastNo;
}

/** Next PO number, e.g. PO-00001. */
export async function generatePONumber() {
  const n = await nextCounter("PO");
  return `PO-${String(n).padStart(5, "0")}`;
}

/** Next GRN number, e.g. GRN-00001. */
export async function generateGRNNumber() {
  const n = await nextCounter("GRN");
  return `GRN-${String(n).padStart(5, "0")}`;
}

export async function getPurchaseOrders() {
  return prisma.purchaseOrder.findMany({
    include: { vendor: true, _count: { select: { items: true, receipts: true } } },
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
      receipts: {
        include: {
          receivedBy: true,
          items: { include: { item: true, warehouse: true, rack: true, shelf: true, bin: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/** Vendors + items needed to build/edit a PO. */
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
