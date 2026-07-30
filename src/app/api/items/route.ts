// ============================================================================
//  /api/items  —  create item (POST), list/search (GET)
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getItems } from "@/lib/items";

const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);
const str = (v: unknown) => (v == null || v === "" ? null : String(v));

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const items = await getItems({
    q: sp.get("q") || undefined,
    status: sp.get("status") || undefined,
    categoryId: sp.get("categoryId") || undefined,
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) {
    return NextResponse.json({ error: "You don't have permission to add items." }, { status: 403 });
  }

  try {
    const b = await req.json();
    if (!b.sku || !b.name) {
      return NextResponse.json({ error: "SKU and item name are required." }, { status: 400 });
    }

    const opening = num(b.openingStock);
    const current = b.currentStock === undefined ? opening : num(b.currentStock);
    const purchaseRate = num(b.purchaseRate);

    const item = await prisma.item.create({
      data: {
        sku: String(b.sku).trim(),
        name: String(b.name).trim(),
        description: str(b.description),
        partNumber: str(b.partNumber),
        oemNumber: str(b.oemNumber),
        barcode: str(b.barcode),
        qrCode: str(b.qrCode),
        imageUrl: str(b.imageUrl),
        brandId: str(b.brandId),
        categoryId: str(b.categoryId),
        subCategoryId: str(b.subCategoryId),
        modelId: str(b.modelId),
        unitId: str(b.unitId),
        hsnId: str(b.hsnId),
        vendorId: str(b.vendorId),
        warehouseId: str(b.warehouseId),
        rackId: str(b.rackId),
        shelfId: str(b.shelfId),
        binId: str(b.binId),
        openingStock: opening,
        currentStock: current,
        minStock: num(b.minStock),
        maxStock: num(b.maxStock),
        reorderLevel: num(b.reorderLevel),
        purchaseRate,
        sellingRate: num(b.sellingRate),
        mrp: num(b.mrp),
        gstRate: b.gstRate === undefined ? 18 : num(b.gstRate),
        averageCost: purchaseRate,
      },
    });

    // Opening-stock movement (audit trail)
    if (current > 0) {
      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          type: "OPENING",
          quantity: current,
          oldStock: 0,
          newStock: current,
          rate: purchaseRate,
          reason: "Opening stock",
          userId: session.id,
        },
      });
    }

    await prisma.auditLog.create({
      data: { userId: session.id, action: "CREATE", entity: "Item", entityId: item.id, detail: item.name },
    });

    return NextResponse.json({ item });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "An item with this SKU or barcode already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not save the item. Try again." }, { status: 500 });
  }
}
