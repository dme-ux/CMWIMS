// ============================================================================
//  Inward / GRN data helpers — POs open for material receipt.
// ============================================================================
import { prisma } from "@/lib/prisma";

export const RECEIVABLE_STATUSES = ["APPROVED", "SENT", "PARTIALLY_RECEIVED"];

/** POs that still have material to receive. */
export async function getReceivablePOs() {
  return prisma.purchaseOrder.findMany({
    where: { status: { in: RECEIVABLE_STATUSES as any } },
    include: { vendor: true, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReceivablePOById(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: { vendor: true, items: { include: { item: true } } },
  });
}
