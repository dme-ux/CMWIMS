import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { changeLocationStock } from "@/lib/stock";

const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) {
    return NextResponse.json({ error: "You don't have permission to add stock." }, { status: 403 });
  }

  const b = await req.json();
  if (!b.itemId) return NextResponse.json({ error: "Select an item." }, { status: 400 });
  if (!b.warehouseId) return NextResponse.json({ error: "Select a warehouse/location." }, { status: 400 });
  const qty = num(b.quantity);
  if (qty <= 0) return NextResponse.json({ error: "Enter a quantity greater than zero." }, { status: 400 });

  const reasonParts = ["Direct in"];
  if (b.vendorName?.trim()) reasonParts.push(`Vendor: ${b.vendorName.trim()}`);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUniqueOrThrow({ where: { id: b.itemId } });
      const rate = b.rate === "" || b.rate == null ? item.averageCost : num(b.rate);
      const oldStock = item.currentStock;
      const newStock = oldStock + qty;
      const newAvg = newStock > 0 ? (oldStock * item.averageCost + qty * rate) / newStock : rate;

      const loc = {
        warehouseId: String(b.warehouseId),
        rackId: b.rackId || null,
        shelfId: b.shelfId || null,
        binId: b.binId || null,
      };
      const locationStock = await changeLocationStock(tx, item.id, loc, qty);

      await tx.item.update({
        where: { id: item.id },
        data: {
          currentStock: newStock,
          averageCost: newAvg,
          warehouseId: loc.warehouseId,
          rackId: loc.rackId,
          shelfId: loc.shelfId,
          binId: loc.binId,
        },
      });

      await tx.stockMovement.create({
        data: {
          itemId: item.id,
          type: "INWARD_GRN",
          quantity: qty,
          oldStock,
          newStock,
          rate,
          reference: b.poNumber?.trim() || b.reference?.trim() || null,
          reason: reasonParts.join(" · "),
          warehouseId: loc.warehouseId,
          rackId: loc.rackId,
          shelfId: loc.shelfId,
          binId: loc.binId,
          locationNote: b.note?.trim() || null,
          userId: session.id,
        },
      });

      return { newStock, locationQty: locationStock.newQty };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not add stock." }, { status: 400 });
  }
}
