// ============================================================================
//  Inventory data helpers — item search/list, single item, master lookups.
// ============================================================================
import { prisma } from "@/lib/prisma";

export type ItemFilters = { q?: string; status?: string; categoryId?: string };

/** Stock status derived from levels. */
export function stockStatus(current: number, reorder: number) {
  if (current <= 0) return "out" as const;
  if (current <= reorder) return "low" as const;
  return "in" as const;
}

const ITEM_INCLUDE = {
  category: true,
  brand: true,
  vendor: true,
  unit: true,
  warehouse: true,
  rack: true,
  shelf: true,
  bin: true,
  vehicleModel: true,
} as const;

/** Smart search + filter across the catalogue. */
export async function getItems(filters: ItemFilters = {}) {
  const { q, status, categoryId } = filters;
  const where: any = { isActive: true };
  if (categoryId) where.categoryId = categoryId;

  const term = q?.trim();
  if (term) {
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { sku: { contains: term, mode: "insensitive" } },
      { partNumber: { contains: term, mode: "insensitive" } },
      { oemNumber: { contains: term, mode: "insensitive" } },
      { barcode: { contains: term, mode: "insensitive" } },
    ];
  }

  const items = await prisma.item.findMany({
    where,
    include: ITEM_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  // Stock-status filter is computed in JS (current vs reorder comparison).
  if (status === "low") return items.filter((i) => i.currentStock > 0 && i.currentStock <= i.reorderLevel);
  if (status === "out") return items.filter((i) => i.currentStock <= 0);
  if (status === "in") return items.filter((i) => i.currentStock > i.reorderLevel);
  return items;
}

export async function getItemById(id: string) {
  return prisma.item.findUnique({ where: { id }, include: ITEM_INCLUDE });
}

/** All master lists needed to populate the item form dropdowns. */
export async function getMasters() {
  const [brands, categories, subCategories, models, units, hsnCodes, vendors, warehouses, racks, shelves, bins] =
    await Promise.all([
      prisma.brand.findMany({ orderBy: { name: "asc" } }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.subCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.vehicleModel.findMany({ include: { oemBrand: true }, orderBy: { name: "asc" } }),
      prisma.unit.findMany({ orderBy: { name: "asc" } }),
      prisma.hSNCode.findMany({ orderBy: { code: "asc" } }),
      prisma.vendor.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.warehouse.findMany({ orderBy: { name: "asc" } }),
      prisma.rack.findMany({ orderBy: { name: "asc" } }),
      prisma.shelf.findMany({ orderBy: { name: "asc" } }),
      prisma.bin.findMany({ orderBy: { name: "asc" } }),
    ]);
  return { brands, categories, subCategories, models, units, hsnCodes, vendors, warehouses, racks, shelves, bins };
}

export type Masters = Awaited<ReturnType<typeof getMasters>>;
