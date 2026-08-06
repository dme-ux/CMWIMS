import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";

const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) {
    return NextResponse.json({ error: "You don't have permission to add stock." }, { status: 403 });
  }

  const b = await req.json();
  if (!b.itemId) return NextResponse.json({ error: "Select an item." }, { status: 400 });
  const qty = num(b.quantity);
  if (qty <= 0) return NextResponse.json({ error: "Enter a quantity greater than zero." }, { status: 400 });

  const parts = ["Direct in"];
  if (b.vendorName?.trim()) parts.push(`Vendor: ${b.vendorName.trim()}`);
  const reasonText = parts.join(" · ");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUniqueOrThrow({ where: { id: b.itemId } });
      const rate = b.rate === "" || b.rate == null ? item.averageCost : num(b.rate);
      const oldStock = item.currentStock;
      const newStock = oldStock + qty;
      const newAvg = newStock > 0 ? (oldStock * item.averageCost + qty * rate) / newStock : rate;

      await tx.item.update({ where: { id: item.id }, data: { currentStock: newStock, averageCost: newAvg } });
      await tx.stockMovement.create({
        data: {
          itemId: item.id,
          type: "ADJUSTMENT",
          quantity: qty,
          oldStock,
          newStock,
          rate,
          reference: b.poNumber?.trim() || b.reference?.trim() || null,
          reason: reasonText,
          locationNote: b.note?.trim() || null,
          userId: session.id,
        },
      });
      return { newStock };
    });

    return NextResponse.json({ ok: true, newStock: result.newStock });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not add stock." }, { status: 400 });
  }
}
