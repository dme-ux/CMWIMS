// ============================================================================
// CMW Phase 2A — exact physical stock-location helpers.
// Every new stock movement is tied to Warehouse -> Rack -> Shelf -> Bin.
// ============================================================================
import { prisma } from "@/lib/prisma";

export type LocationInput = {
  warehouseId: string;
  rackId?: string | null;
  shelfId?: string | null;
  binId?: string | null;
};

export async function getLocationMasters() {
  const [warehouses, racks, shelves, bins] = await Promise.all([
    prisma.warehouse.findMany({ orderBy: { name: "asc" } }),
    prisma.rack.findMany({ orderBy: { name: "asc" } }),
    prisma.shelf.findMany({ orderBy: { name: "asc" } }),
    prisma.bin.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { warehouses, racks, shelves, bins };
}

export async function validateLocation(tx: any, loc: LocationInput) {
  if (!loc.warehouseId) throw new Error("Warehouse is required.");

  const warehouse = await tx.warehouse.findUnique({ where: { id: loc.warehouseId } });
  if (!warehouse) throw new Error("Selected warehouse was not found.");

  if (loc.rackId) {
    const rack = await tx.rack.findUnique({ where: { id: loc.rackId } });
    if (!rack || rack.warehouseId !== loc.warehouseId) throw new Error("Rack does not belong to selected warehouse.");
  }

  if (loc.shelfId) {
    if (!loc.rackId) throw new Error("Select rack before shelf.");
    const shelf = await tx.shelf.findUnique({ where: { id: loc.shelfId } });
    if (!shelf || shelf.rackId !== loc.rackId) throw new Error("Shelf does not belong to selected rack.");
  }

  if (loc.binId) {
    if (!loc.shelfId) throw new Error("Select shelf before bin.");
    const bin = await tx.bin.findUnique({ where: { id: loc.binId } });
    if (!bin || bin.shelfId !== loc.shelfId) throw new Error("Bin does not belong to selected shelf.");
  }
}

export async function changeLocationStock(
  tx: any,
  itemId: string,
  loc: LocationInput,
  delta: number,
) {
  await validateLocation(tx, loc);

  const row = await tx.itemLocationStock.findFirst({
    where: {
      itemId,
      warehouseId: loc.warehouseId,
      rackId: loc.rackId || null,
      shelfId: loc.shelfId || null,
      binId: loc.binId || null,
    },
  });

  const oldQty = Number(row?.quantity || 0);
  const newQty = oldQty + delta;
  if (newQty < -0.000001) throw new Error(`Only ${oldQty} available at selected location.`);

  if (row) {
    await tx.itemLocationStock.update({ where: { id: row.id }, data: { quantity: Math.max(0, newQty) } });
    return { id: row.id, oldQty, newQty: Math.max(0, newQty) };
  }

  if (delta < 0) throw new Error("No stock exists at selected location.");

  const created = await tx.itemLocationStock.create({
    data: {
      itemId,
      warehouseId: loc.warehouseId,
      rackId: loc.rackId || null,
      shelfId: loc.shelfId || null,
      binId: loc.binId || null,
      quantity: delta,
    },
  });
  return { id: created.id, oldQty: 0, newQty: delta };
}

export function locationLabel(loc: any) {
  return [loc.warehouse?.name, loc.rack?.name, loc.shelf?.name, loc.bin?.name].filter(Boolean).join(" · ");
}
