import { prisma } from "@/lib/prisma";

export const ISSUE_REASONS: { value: string; label: string; type: string }[] = [
  { value: "WORKSHOP_CONSUMPTION", label: "Workshop consumption", type: "WORKSHOP_CONSUMPTION" },
  { value: "CUSTOMER_SALE", label: "Customer sale", type: "CUSTOMER_SALE" },
  { value: "INTERNAL_TRANSFER", label: "Internal transfer", type: "INTERNAL_TRANSFER" },
  { value: "DAMAGE", label: "Damage", type: "DAMAGE" },
  { value: "VENDOR_RETURN", label: "Vendor return", type: "VENDOR_RETURN" },
  { value: "ADJUSTMENT", label: "Adjustment", type: "ADJUSTMENT" },
];

export async function getIssuableItems() {
  return prisma.item.findMany({
    where: { isActive: true }, orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true, currentStock: true, reservedStock: true,
      locationStocks: { where: { quantity: { gt: 0 } }, include: { warehouse: true, rack: true, shelf: true, bin: true }, orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getOutwardTargets() {
  const [customers, vehicles, jobs] = await Promise.all([
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, code: true, phone: true } }),
    prisma.vehicle.findMany({ orderBy: { updatedAt: "desc" }, take: 500, select: { id: true, registration: true, chassisNumber: true, brand: true, modelName: true, customerId: true } }),
    prisma.workshopJob.findMany({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } }, orderBy: { createdAt: "desc" }, take: 300, select: { id: true, jobNumber: true, customerId: true, vehicleId: true, customerName: true, vehicleNo: true, carBrand: true, model: true } }),
  ]);
  return { customers, vehicles, jobs };
}
