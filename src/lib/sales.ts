// ============================================================================
//  Sales helpers — customer billing (revenue), separate from vendor purchase
//  bills. Feeds the Gross Profit report (Sales − Cost of Goods).
// ============================================================================
import { prisma } from "@/lib/prisma";

export async function generateInvoiceNumber() {
  const count = await prisma.customerInvoice.count();
  return `INV-${String(count + 1).padStart(5, "0")}`;
}

export type SaleInput = {
  date: string; // yyyy-mm-dd
  customerId?: string | null;
  customerName?: string | null;
  vehicleNo?: string | null;
  description?: string | null;
  amount: number;
  costOfGoods?: number;
  mode?: string | null;
};

export async function createSale(input: SaleInput, createdByName?: string) {
  const number = await generateInvoiceNumber();
  return prisma.customerInvoice.create({
    data: {
      number,
      date: new Date(input.date),
      customerId: input.customerId || null,
      customerName: input.customerName || null,
      vehicleNo: input.vehicleNo || null,
      description: input.description || null,
      amount: input.amount,
      costOfGoods: input.costOfGoods || 0,
      createdByName: createdByName || null,
    },
    include: { customer: true },
  });
}

export async function updateSale(id: string, input: Partial<SaleInput>) {
  return prisma.customerInvoice.update({
    where: { id },
    data: {
      date: input.date ? new Date(input.date) : undefined,
      customerId: input.customerId,
      customerName: input.customerName,
      vehicleNo: input.vehicleNo,
      description: input.description,
      amount: input.amount,
      costOfGoods: input.costOfGoods,
    },
    include: { customer: true },
  });
}

export async function deleteSale(id: string) {
  return prisma.customerInvoice.delete({ where: { id } });
}

export type SaleFilters = { q?: string; from?: string; to?: string; status?: string };

export async function listSales(filters: SaleFilters = {}) {
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.from || filters.to) {
    where.date = {};
    if (filters.from) where.date.gte = new Date(filters.from + "T00:00:00");
    if (filters.to) where.date.lte = new Date(filters.to + "T23:59:59");
  }
  if (filters.q) {
    where.OR = [
      { number: { contains: filters.q, mode: "insensitive" } },
      { customerName: { contains: filters.q, mode: "insensitive" } },
      { vehicleNo: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  return prisma.customerInvoice.findMany({
    where,
    include: { customer: true },
    orderBy: { date: "desc" },
    take: 1000,
  });
}

/** Record a payment against a sale invoice — Cash / Bank / UPI. */
export async function paySale(id: string, amount: number, mode: string) {
  const row = await prisma.customerInvoice.findUniqueOrThrow({ where: { id } });
  const paidAmount = Math.min(row.amount, (row.paidAmount || 0) + amount);
  const status = paidAmount >= row.amount ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";
  return prisma.customerInvoice.update({ where: { id }, data: { paidAmount, status, mode } });
}

/** Dashboard/report summary: revenue, cost, gross profit for a period. */
export async function getSalesSummary(from?: Date, to?: Date) {
  const where: any = {};
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }
  const agg = await prisma.customerInvoice.aggregate({
    _sum: { amount: true, costOfGoods: true, paidAmount: true },
    where,
  });
  const revenue = agg._sum.amount || 0;
  const cost = agg._sum.costOfGoods || 0;
  return {
    revenue,
    cost,
    grossProfit: revenue - cost,
    margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
    collected: agg._sum.paidAmount || 0,
  };
}
