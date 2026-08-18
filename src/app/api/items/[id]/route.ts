// ============================================================================
// /api/items/[id] — CMW Phase 1
// Metadata edit only. Stock is intentionally NOT editable here.
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";

const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);
const str = (v: unknown) => (v == null || v === "" ? null : String(v).trim());
const intOrNull = (v: unknown) => (v === "" || v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null);

function refs(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.map((r: any) => ({ code: String(r?.code || "").trim(), type: str(r?.type), brand: str(r?.brand), note: str(r?.note) }))
    .filter((r) => r.code && !seen.has(r.code.toLowerCase()) && seen.add(r.code.toLowerCase()));
}
function compat(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.map((c: any) => ({ vehicleModelId: String(c?.vehicleModelId || "").trim(), variant: str(c?.variant), engineCode: str(c?.engineCode), fuelType: str(c?.fuelType), yearFrom: intOrNull(c?.yearFrom), yearTo: intOrNull(c?.yearTo), note: str(c?.note) }))
    .filter((c) => c.vehicleModelId && !seen.has(c.vehicleModelId) && seen.add(c.vehicleModelId));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) return NextResponse.json({ error: "You don't have permission to edit items." }, { status: 403 });

  try {
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Item not found." }, { status: 404 });
    const b = await req.json();
    const crossReferences = refs(b.crossReferences);
    const compatibilities = compat(b.compatibilities);

    const item = await prisma.$transaction(async (tx) => {
      await tx.itemCrossReference.deleteMany({ where: { itemId: id } });
      await tx.itemVehicleCompatibility.deleteMany({ where: { itemId: id } });

      const updated = await tx.item.update({
        where: { id },
        data: {
          name: b.name != null ? String(b.name).trim() : existing.name,
          description: str(b.description), partNumber: str(b.partNumber), oemNumber: str(b.oemNumber), barcode: str(b.barcode), imageUrl: str(b.imageUrl),
          brandId: str(b.brandId), categoryId: str(b.categoryId), subCategoryId: str(b.subCategoryId),
          modelId: compatibilities[0]?.vehicleModelId || null,
          unitId: str(b.unitId), hsnId: str(b.hsnId), vendorId: str(b.vendorId),
          minStock: num(b.minStock), maxStock: num(b.maxStock), reorderLevel: num(b.reorderLevel),
          purchaseRate: num(b.purchaseRate), sellingRate: num(b.sellingRate), mrp: num(b.mrp), gstRate: b.gstRate === undefined ? existing.gstRate : num(b.gstRate),
          crossReferences: crossReferences.length ? { create: crossReferences } : undefined,
          compatibilities: compatibilities.length ? { create: compatibilities } : undefined,
        },
      });
      await tx.auditLog.create({ data: { userId: session.id, action: "UPDATE", entity: "Item", entityId: id, detail: updated.name } });
      return updated;
    });
    return NextResponse.json({ item });
  } catch (e: any) {
    console.error("PUT /api/items/[id]", e);
    if (e?.code === "P2002") return NextResponse.json({ error: "That barcode/cross-reference is already in use." }, { status: 409 });
    return NextResponse.json({ error: "Could not update the item." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) return NextResponse.json({ error: "You don't have permission to delete items." }, { status: 403 });
  await prisma.item.update({ where: { id }, data: { isActive: false } });
  await prisma.auditLog.create({ data: { userId: session.id, action: "DELETE", entity: "Item", entityId: id } });
  return NextResponse.json({ ok: true });
}
