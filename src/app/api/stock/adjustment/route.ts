import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { changeLocationStock } from "@/lib/stock";

const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) {
    return NextResponse.json({ error: "You don't have permission to adjust stock." }, { status: 403 });
  }

  const b = await req.json();
  if (!b.itemId) return NextResponse.json({ error: "Select an item." }, { status: 400 });
  if (!b.locationStockId) return NextResponse.json({ error: "Select an exact stock location." }, { status: 400 });
  if (!b.reason?.trim()) return NextResponse.json({ error: "Adjustment reason is mandatory." }, { status: 400 });

  const delta = num(b.delta);
  if (!delta) return NextResponse.json({ error: "Enter a non-zero adjustment quantity." }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUniqueOrThrow({ where: { id: b.itemId } });
      const source = await tx.itemLocationStock.findUnique({ where: { id: b.locationStockId } });
      if (!source || source.itemId !== item.id) throw new Error("Selected stock location is invalid.");

      const oldStock = Number(item.currentStock || 0);
      const newStock = oldStock + delta;
      if (newStock < -0.000001) throw new Error(`Total stock cannot go below zero. Current stock: ${oldStock}.`);

      const loc = { warehouseId: source.warehouseId, rackId: source.rackId, shelfId: source.shelfId, binId: source.binId };
      const locationStock = await changeLocationStock(tx, item.id, loc, delta);

      await tx.item.update({ where: { id: item.id }, data: { currentStock: Math.max(0, newStock) } });
      const movement = await tx.stockMovement.create({
        data: {
          itemId: item.id,
          type: "ADJUSTMENT",
          quantity: delta,
          oldStock,
          newStock: Math.max(0, newStock),
          rate: item.averageCost,
          reference: b.reference?.trim() || null,
          reason: `Stock adjustment · ${b.reason.trim()}`,
          warehouseId: loc.warehouseId,
          rackId: loc.rackId,
          shelfId: loc.shelfId,
          binId: loc.binId,
          locationNote: b.note?.trim() || null,
          userId: session.id,
        },
      });

      return { movementId: movement.id, newStock: Math.max(0, newStock), locationQty: locationStock.newQty };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not adjust stock." }, { status: 400 });
  }
}
