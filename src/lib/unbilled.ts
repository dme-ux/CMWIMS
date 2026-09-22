// ============================================================================
//  Unbilled purchase helpers — vendor material received without a formal
//  bill/invoice (cash/informal). Kept separate from the PO → GRN → Bill flow
//  because there's no PO or vendor-ledger entry for these.
// ============================================================================
import { prisma } from "@/lib/prisma";

export type UnbilledInput = {
  date: string;
  vendorName: string;
  description?: string | null;
  amount: number;
  paidAmount?: number;
  mode?: string | null;
  notes?: string | null;
};

export async function createUnbilled(input: UnbilledInput, createdByName?: string) {
  return prisma.unbilledPurchase.create({
    data: {
      date: new Date(input.date),
      vendorName: input.vendorName,
      description: input.description || null,
      amount: input.amount,
      paidAmount: input.paidAmount || 0,
      mode: input.mode || null,
      notes: input.notes || null,
      createdByName: createdByName || null,
    },
  });
}

export async function updateUnbilled(id: string, input: Partial<UnbilledInput>) {
  return prisma.unbilledPurchase.update({
    where: { id },
    data: {
      date: input.date ? new Date(input.date) : undefined,
      vendorName: input.vendorName,
      description: input.description,
      amount: input.amount,
      paidAmount: input.paidAmount,
      mode: input.mode,
      notes: input.notes,
    },
  });
}

export async function deleteUnbilled(id: string) {
  return prisma.unbilledPurchase.delete({ where: { id } });
}

export type UnbilledFilters = { q?: string; from?: string; to?: string };

export async function listUnbilled(filters: UnbilledFilters = {}) {
  const where: any = {};
  if (filters.from || filters.to) {
    where.date = {};
    if (filters.from) where.date.gte = new Date(filters.from + "T00:00:00");
    if (filters.to) where.date.lte = new Date(filters.to + "T23:59:59");
  }
  if (filters.q) {
    where.OR = [
      { vendorName: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  return prisma.unbilledPurchase.findMany({ where, orderBy: { date: "desc" }, take: 1000 });
}

export async function getUnbilledTotal(from?: Date, to?: Date) {
  const where: any = {};
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }
  const agg = await prisma.unbilledPurchase.aggregate({ _sum: { amount: true, paidAmount: true }, where });
  return { amount: agg._sum.amount || 0, paid: agg._sum.paidAmount || 0 };
}
