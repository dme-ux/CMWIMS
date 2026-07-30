// ============================================================================
//  /api/purchase-orders/[id]/receive  —  GRN / material receipt (POST)
//  Increments stock, updates weighted average cost, records a movement,
//  advances PO status. All in one transaction.
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { RECEIVABLE_STATUSES } from "@/lib/inward";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "purchase.manage")) {
    return NextResponse.json({ error: "You don't have permission to receive material." }, { status: 403 });
  }

  const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: { include: { item: true } } } });
  if (!po) return NextResponse.json({ error: "Purchase order not found." }, { status: 404 });
  if (!RECEIVABLE_STATUSES.includes(po.status)) {
    return NextResponse.json({ error: "This PO is not open for receiving." }, { status: 400 });
  }

  const body = await req.json();
  const lines: { poItemId: string; receiveQty: number }[] = Array.isArray(body.lines) ? body.lines : [];

  try {
    await prisma.$transaction(async (tx) => {
      for (const l of lines) {
        const qty = Number(l.receiveQty) || 0;
        if (qty <= 0) continue;

        const poItem = po.items.find((pi) => pi.id === l.poItemId);
        if (!poItem) continue;

        const remaining = poItem.quantity - poItem.receivedQty;
        if (qty > remaining) throw new Error(`Cannot receive more than the pending quantity for ${poItem.item.name}.`);

        // Read the item fresh (handles the same item on multiple lines).
        const item = await tx.item.findUniqueOrThrow({ where: { id: poItem.itemId } });
        const oldStock = item.currentStock;
        const newStock = oldStock + qty;
        const newAvg = newStock > 0 ? (oldStock * item.averageCost + qty * poItem.rate) / newStock : poItem.rate;

        await tx.item.update({ where: { id: item.id }, data: { currentStock: newStock, averageCost: newAvg } });
        await tx.purchaseOrderItem.update({ where: { id: poItem.id }, data: { receivedQty: poItem.receivedQty + qty } });
        await tx.stockMovement.create({
          data: {
            itemId: item.id,
            type: "INWARD_GRN",
            quantity: qty,
            oldStock,
            newStock,
            rate: poItem.rate,
            reference: po.number,
            reason: "Material received",
            userId: session.id,
          },
        });
      }

      // Recompute PO status from the fresh line quantities.
      const fresh = await tx.purchaseOrderItem.findMany({ where: { poId: id } });
      const allReceived = fresh.every((pi) => pi.receivedQty >= pi.quantity);
      const anyReceived = fresh.some((pi) => pi.receivedQty > 0);
      const status = allReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : po.status;
      await tx.purchaseOrder.update({ where: { id }, data: { status } });
    });

    await prisma.auditLog.create({
      data: { userId: session.id, action: "PO_RECEIVE", entity: "PurchaseOrder", entityId: id, detail: po.number },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not receive material." }, { status: 400 });
  }
}
