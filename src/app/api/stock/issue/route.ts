import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { ISSUE_REASONS } from "@/lib/outward";
import { changeLocationStock } from "@/lib/stock";

const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) {
    return NextResponse.json({ error: "You don't have permission to issue material." }, { status: 403 });
  }

  const b = await req.json();
  const reason = ISSUE_REASONS.find((r) => r.value === b.reason);
  if (!reason) return NextResponse.json({ error: "Select a valid reason." }, { status: 400 });
  if (!b.itemId) return NextResponse.json({ error: "Select an item." }, { status: 400 });
  if (!b.locationStockId) return NextResponse.json({ error: "Select the exact stock location." }, { status: 400 });

  const qty = num(b.quantity);
  if (qty <= 0) return NextResponse.json({ error: "Enter a quantity greater than zero." }, { status: 400 });
  const reasonText = b.party?.trim() ? `${reason.label} · ${b.party.trim()}` : reason.label;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUniqueOrThrow({ where: { id: b.itemId } });
      const source = await tx.itemLocationStock.findUnique({ where: { id: b.locationStockId } });
      if (!source || source.itemId !== item.id) throw new Error("Selected stock location is invalid.");

      const availableAtLocation = Math.max(0, source.quantity - source.reservedQty);
      if (qty > availableAtLocation) throw new Error(`Only ${availableAtLocation} available at selected location.`);

      const oldStock = item.currentStock;
      const newStock = oldStock - qty;
      if (newStock < -0.000001) throw new Error(`Only ${oldStock} total stock available.`);

      const loc = {
        warehouseId: source.warehouseId,
        rackId: source.rackId,
        shelfId: source.shelfId,
        binId: source.binId,
      };
      const locationStock = await changeLocationStock(tx, item.id, loc, -qty);

      await tx.item.update({ where: { id: item.id }, data: { currentStock: Math.max(0, newStock) } });
      await tx.stockMovement.create({
        data: {
          itemId: item.id,
          type: reason.type as any,
          quantity: -qty,
          oldStock,
          newStock: Math.max(0, newStock),
          rate: item.averageCost,
          reference: b.reference?.trim() || null,
          reason: reasonText,
          warehouseId: loc.warehouseId,
          rackId: loc.rackId,
          shelfId: loc.shelfId,
          binId: loc.binId,
          locationNote: b.note?.trim() || null,
          userId: session.id,
        },
      });

      return { newStock: Math.max(0, newStock), locationQty: locationStock.newQty };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not issue material." }, { status: 400 });
  }
}
