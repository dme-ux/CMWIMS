// ============================================================================
//  Outward helpers — issue reasons and recent outward movements.
// ============================================================================
import { prisma } from "@/lib/prisma";

/** Reason -> stock-movement type. All of these reduce stock. */
export const ISSUE_REASONS: { value: string; label: string; type: string }[] = [
  { value: "WORKSHOP_CONSUMPTION", label: "Workshop consumption", type: "WORKSHOP_CONSUMPTION" },
  { value: "CUSTOMER_SALE", label: "Customer sale", type: "CUSTOMER_SALE" },
  { value: "INTERNAL_TRANSFER", label: "Internal transfer", type: "INTERNAL_TRANSFER" },
  { value: "DAMAGE", label: "Damage", type: "DAMAGE" },
  { value: "VENDOR_RETURN", label: "Vendor return", type: "VENDOR_RETURN" },
  { value: "ADJUSTMENT", label: "Adjustment", type: "ADJUSTMENT" },
];

const OUT_TYPES = ISSUE_REASONS.map((r) => r.type);

export async function getIssuableItems() {
  return prisma.item.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true, currentStock: true },
  });
}

export async function getRecentIssues() {
  return prisma.stockMovement.findMany({
    where: { type: { in: OUT_TYPES as any } },
    include: { item: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
