// ============================================================================
//  Accounting data helpers — vendor bills, payments, outstanding.
// ============================================================================
import { prisma } from "@/lib/prisma";

export async function generateBillNumber() {
  const count = await prisma.purchaseInvoice.count();
  return `BILL-${String(count + 1).padStart(5, "0")}`;
}

export async function getBills() {
  return prisma.purchaseInvoice.findMany({
    include: { vendor: true, po: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getBillById(id: string) {
  return prisma.purchaseInvoice.findUnique({
    where: { id },
    include: { vendor: true, po: true, payments: { orderBy: { paidAt: "desc" } } },
  });
}

/** Vendors + billable POs for the new-bill form. */
export async function getBillFormData() {
  const [vendors, pos] = await Promise.all([
    prisma.vendor.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.purchaseOrder.findMany({
      where: { status: { in: ["APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED"] as any } },
      orderBy: { createdAt: "desc" },
      select: { id: true, number: true, vendorId: true, subTotal: true, taxTotal: true, grandTotal: true },
    }),
  ]);
  return { vendors, pos };
}

/** Total outstanding across all bills + overdue count. */
export async function getOutstandingSummary() {
  const bills = await prisma.purchaseInvoice.findMany({
    where: { paymentStatus: { not: "PAID" } },
    select: { grandTotal: true, paidAmount: true, dueDate: true },
  });
  const now = new Date();
  let outstanding = 0, overdue = 0;
  for (const b of bills) {
    outstanding += b.grandTotal - b.paidAmount;
    if (b.dueDate && b.dueDate < now) overdue += 1;
  }
  return { outstanding, overdue, unpaidCount: bills.length };
}

export function paymentStatusMeta(status: string): [string, string] {
  const map: Record<string, [string, string]> = {
    UNPAID: ["Unpaid", "bg-red-50 text-red-700"],
    PARTIAL: ["Partial", "bg-amber-50 text-amber-700"],
    PAID: ["Paid", "bg-emerald-50 text-emerald-700"],
  };
  return map[status] ?? [status, "bg-slate-100 text-slate-600"];
}
