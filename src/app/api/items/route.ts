// ============================================================================
// /api/items — CMW Phase 1
// Create/list with cross references, vehicle compatibility and opening location.
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getItems } from "@/lib/items";

const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);
const str = (v: unknown) => (v == null || v === "" ? null : String(v).trim());
const intOrNull = (v: unknown) => (v === "" || v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null);

function refs(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .map((r: any) => ({ code: String(r?.code || "").trim(), type: str(r?.type), brand: str(r?.brand), note: str(r?.note) }))
    .filter((r) => r.code && !seen.has(r.code.toLowerCase()) && seen.add(r.code.toLowerCase()));
}

function compat(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .map((c: any) => ({
      vehicleModelId: String(c?.vehicleModelId || "").trim(),
      variant: str(c?.variant), engineCode: str(c?.engineCode), fuelType: str(c?.fuelType),
      yearFrom: intOrNull(c?.yearFrom), yearTo: intOrNull(c?.yearTo), note: str(c?.note),
    }))
    .filter((c) => c.vehicleModelId && !seen.has(c.vehicleModelId) && seen.add(c.vehicleModelId));
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const items = await getItems({ q: sp.get("q") || undefined, status: sp.get("status") || undefined, categoryId: sp.get("categoryId") || undefined });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) {
    return NextResponse.json({ error: "You don't have permission to add items." }, { status: 403 });
  }

  try {
    const b = await req.json();
    if (!b.sku || !b.name) return NextResponse.json({ error: "SKU and item name are required." }, { status: 400 });

    const opening = num(b.openingStock);
    const purchaseRate = num(b.purchaseRate);
    const crossReferences = refs(b.crossReferences);
    const compatibilities = compat(b.compatibilities);
    const warehouseId = str(b.warehouseId);
    if (opening > 0 && !warehouseId) {
      return NextResponse.json({ error: "Select a warehouse when opening stock is greater than zero." }, { status: 400 });
    }

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.item.create({
        data: {
          sku: String(b.sku).trim(), name: String(b.name).trim(), description: str(b.description),
          partNumber: str(b.partNumber), oemNumber: str(b.oemNumber), barcode: str(b.barcode), qrCode: str(b.qrCode), imageUrl: str(b.imageUrl),
          brandId: str(b.brandId), categoryId: str(b.categoryId), subCategoryId: str(b.subCategoryId),
          modelId: compatibilities[0]?.vehicleModelId || str(b.modelId), // legacy compatibility for old screens
          unitId: str(b.unitId), hsnId: str(b.hsnId), vendorId: str(b.vendorId),
          warehouseId, rackId: str(b.rackId), shelfId: str(b.shelfId), binId: str(b.binId), // legacy primary location
          openingStock: opening, currentStock: opening, minStock: num(b.minStock), maxStock: num(b.maxStock), reorderLevel: num(b.reorderLevel),
          purchaseRate, sellingRate: num(b.sellingRate), mrp: num(b.mrp), gstRate: b.gstRate === undefined ? 18 : num(b.gstRate), averageCost: purchaseRate,
          crossReferences: crossReferences.length ? { create: crossReferences } : undefined,
          compatibilities: compatibilities.length ? { create: compatibilities } : undefined,
        },
      });

      if (warehouseId) {
        await tx.itemLocationStock.create({
          data: { itemId: created.id, warehouseId, rackId: str(b.rackId), shelfId: str(b.shelfId), binId: str(b.binId), quantity: opening },
        });
      }

      if (opening > 0) {
        await tx.stockMovement.create({
          data: { itemId: created.id, type: "OPENING", quantity: opening, oldStock: 0, newStock: opening, rate: purchaseRate,
            reason: "Opening stock", locationNote: [b.warehouseName, b.rackName, b.shelfName, b.binName].filter(Boolean).join(" / ") || null, userId: session.id },
        });
      }
      await tx.auditLog.create({ data: { userId: session.id, action: "CREATE", entity: "Item", entityId: created.id, detail: created.name } });
      return created;
    });

    return NextResponse.json({ item });
  } catch (e: any) {
    console.error("POST /api/items", e);
    if (e?.code === "P2002") return NextResponse.json({ error: "SKU, barcode or cross-reference already exists for this item." }, { status: 409 });
    return NextResponse.json({ error: "Could not save the item. Check master/location selections and try again." }, { status: 500 });
  }
}
