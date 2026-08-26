import { prisma } from "@/lib/prisma";

export type LedgerFilters = {
  q?: string;
  itemId?: string;
  warehouseId?: string;
  direction?: "IN" | "OUT" | "ALL";
  from?: string;
  to?: string;
};

function dateStart(v?: string) {
  if (!v) return undefined;
  const d = new Date(`${v}T00:00:00.000`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
function dateEnd(v?: string) {
  if (!v) return undefined;
  const d = new Date(`${v}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function getStockMovements(filters: LedgerFilters = {}, take = 500) {
  const q = filters.q?.trim();
  const from = dateStart(filters.from);
  const to = dateEnd(filters.to);

  return prisma.stockMovement.findMany({
    where: {
      ...(filters.itemId ? { itemId: filters.itemId } : {}),
      ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
      ...(filters.direction === "IN" ? { quantity: { gt: 0 } } : {}),
      ...(filters.direction === "OUT" ? { quantity: { lt: 0 } } : {}),
      ...((from || to) ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      ...(q ? {
        OR: [
          { reference: { contains: q, mode: "insensitive" } },
          { reason: { contains: q, mode: "insensitive" } },
          { locationNote: { contains: q, mode: "insensitive" } },
          { item: { name: { contains: q, mode: "insensitive" } } },
          { item: { sku: { contains: q, mode: "insensitive" } } },
          { item: { partNumber: { contains: q, mode: "insensitive" } } },
          { item: { oemNumber: { contains: q, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: {
      item: { include: { unit: true } },
      user: true,
      warehouse: true,
      rack: true,
      shelf: true,
      bin: true,
      customer: true,
      vehicle: true,
      workshopJob: true,
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getLedgerMasters() {
  const [items, warehouses] = await Promise.all([
    prisma.item.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, sku: true, partNumber: true, currentStock: true } }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { items, warehouses };
}

export function locationText(m: any) {
  return [m.warehouse?.name, m.rack?.name, m.shelf?.name, m.bin?.name].filter(Boolean).join(" → ") || "Legacy / unassigned";
}

export function movementLabel(m: any) {
  if (m.quantity > 0) return "IN";
  if (m.quantity < 0) return "OUT";
  return "ZERO";
}
