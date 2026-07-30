// ============================================================================
//  /api/items/[id]  —  update (PUT), soft-delete (DELETE)
//  Note: params is async in Next.js 15+.
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";

const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);
const str = (v: unknown) => (v == null || v === "" ? null : String(v));

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) {
    return NextResponse.json({ error: "You don't have permission to edit items." }, { status: 403 });
  }

  try {
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Item not found." }, { status: 404 });

    const b = await req.json();
    const newStock = b.currentStock === undefined ? existing.currentStock : num(b.currentStock);

    const item = await prisma.item.update({
      where: { id },
      data: {
        name: b.name != null ? String(b.name).trim() : existing.name,
        description: str(b.description),
        partNumber: str(b.partNumber),
        oemNumber: str(b.oemNumber),
        barcode: str(b.barcode),
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
        currentStock: newStock,
        minStock: num(b.minStock),
        maxStock: num(b.maxStock),
        reorderLevel: num(b.reorderLevel),
        purchaseRate: num(b.purchaseRate),
        sellingRate: num(b.sellingRate),
        mrp: num(b.mrp),
        gstRate: b.gstRate === undefined ? existing.gstRate : num(b.gstRate),
      },
    });

    // Record an adjustment movement if stock was changed manually.
    if (newStock !== existing.currentStock) {
      await prisma.stockMovement.create({
        data: {
          itemId: id,
          type: "ADJUSTMENT",
          quantity: newStock - existing.currentStock,
          oldStock: existing.currentStock,
          newStock,
          reason: "Manual edit",
          userId: session.id,
        },
      });
    }

    await prisma.auditLog.create({
      data: { userId: session.id, action: "UPDATE", entity: "Item", entityId: id, detail: item.name },
    });

    return NextResponse.json({ item });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "That SKU or barcode is already in use." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not update the item." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) {
    return NextResponse.json({ error: "You don't have permission to delete items." }, { status: 403 });
  }

  // Soft-delete: keeps stock history intact and avoids breaking references.
  await prisma.item.update({ where: { id }, data: { isActive: false } });
  await prisma.auditLog.create({
    data: { userId: session.id, action: "DELETE", entity: "Item", entityId: id },
  });
  return NextResponse.json({ ok: true });
}
