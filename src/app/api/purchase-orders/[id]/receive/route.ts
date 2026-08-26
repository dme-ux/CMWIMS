// ============================================================================
// /api/purchase-orders/[id]/receive — safe GRN / material receipt (POST)
// Uses a short batch transaction (not Prisma interactive transaction), making
// it reliable behind Supabase/Supavisor/pgBouncer pooled connections.
// ============================================================================
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { RECEIVABLE_STATUSES } from "@/lib/inward";
import { generateGRNNumber } from "@/lib/purchase";

type ReceiveLine = {
  poItemId: string;
  receiveQty: number;
  warehouseId: string;
  rackId?: string | null;
  shelfId?: string | null;
  binId?: string | null;
};

const n = (v: unknown) => Number(v) || 0;
const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const locKey = (itemId: string, l: ReceiveLine) => [itemId, l.warehouseId, l.rackId || "", l.shelfId || "", l.binId || ""].join("|");

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "purchase.manage")) {
    return NextResponse.json({ error: "You don't have permission to receive material." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const requestId = clean(body.requestId) || randomUUID();

    // Network retry / double-click protection.
    const alreadyDone = await prisma.goodsReceipt.findUnique({ where: { requestId } });
    if (alreadyDone) return NextResponse.json({ ok: true, duplicate: true, grnNumber: alreadyDone.number, receiptId: alreadyDone.id });

    const raw: ReceiveLine[] = Array.isArray(body.lines)
      ? body.lines.map((l: any) => ({
          poItemId: String(l.poItemId || ""), receiveQty: n(l.receiveQty), warehouseId: String(l.warehouseId || ""),
          rackId: clean(l.rackId), shelfId: clean(l.shelfId), binId: clean(l.binId),
        })).filter((l: ReceiveLine) => l.poItemId && l.receiveQty > 0)
      : [];
    if (!raw.length) return NextResponse.json({ error: "Enter a quantity to receive on at least one line." }, { status: 400 });
    if (new Set(raw.map((l) => l.poItemId)).size !== raw.length) return NextResponse.json({ error: "The same PO line was submitted more than once." }, { status: 400 });
    if (raw.some((l) => !l.warehouseId)) return NextResponse.json({ error: "Warehouse is required for every received line." }, { status: 400 });

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { item: true } } },
    });
    if (!po) return NextResponse.json({ error: "Purchase order not found." }, { status: 404 });
    if (!RECEIVABLE_STATUSES.includes(po.status)) return NextResponse.json({ error: "This PO is not open for receiving." }, { status: 400 });

    const poItemMap = new Map(po.items.map((x) => [x.id, x]));
    for (const l of raw) {
      const pi = poItemMap.get(l.poItemId);
      if (!pi) return NextResponse.json({ error: "One of the submitted PO lines is invalid." }, { status: 400 });
      const pending = pi.quantity - pi.receivedQty;
      if (l.receiveQty > pending + 0.000001) return NextResponse.json({ error: `Cannot receive more than pending quantity for ${pi.item.name}. Pending: ${pending}.` }, { status: 400 });
    }

    // Validate all location hierarchy selections in a few short reads.
    const warehouseIds = [...new Set(raw.map((x) => x.warehouseId))];
    const rackIds = [...new Set(raw.map((x) => x.rackId).filter(Boolean) as string[])];
    const shelfIds = [...new Set(raw.map((x) => x.shelfId).filter(Boolean) as string[])];
    const binIds = [...new Set(raw.map((x) => x.binId).filter(Boolean) as string[])];
    const [warehouses, racks, shelves, bins] = await Promise.all([
      prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } }),
      rackIds.length ? prisma.rack.findMany({ where: { id: { in: rackIds } } }) : Promise.resolve([]),
      shelfIds.length ? prisma.shelf.findMany({ where: { id: { in: shelfIds } } }) : Promise.resolve([]),
      binIds.length ? prisma.bin.findMany({ where: { id: { in: binIds } } }) : Promise.resolve([]),
    ]);
    const wm = new Map(warehouses.map((x) => [x.id, x]));
    const rm = new Map(racks.map((x) => [x.id, x]));
    const sm = new Map(shelves.map((x) => [x.id, x]));
    const bm = new Map(bins.map((x) => [x.id, x]));
    for (const l of raw) {
      if (!wm.has(l.warehouseId)) return NextResponse.json({ error: "Selected warehouse was not found." }, { status: 400 });
      if (l.rackId && (!rm.has(l.rackId) || rm.get(l.rackId)!.warehouseId !== l.warehouseId)) return NextResponse.json({ error: "Rack does not belong to selected warehouse." }, { status: 400 });
      if (l.shelfId && (!l.rackId || !sm.has(l.shelfId) || sm.get(l.shelfId)!.rackId !== l.rackId)) return NextResponse.json({ error: "Shelf does not belong to selected rack." }, { status: 400 });
      if (l.binId && (!l.shelfId || !bm.has(l.binId) || bm.get(l.binId)!.shelfId !== l.shelfId)) return NextResponse.json({ error: "Bin does not belong to selected shelf." }, { status: 400 });
    }

    const itemIds = [...new Set(raw.map((l) => poItemMap.get(l.poItemId)!.itemId))];
    const existingLocations = await prisma.itemLocationStock.findMany({ where: { itemId: { in: itemIds }, warehouseId: { in: warehouseIds } } });
    const existingLocationMap = new Map(existingLocations.map((x) => [[x.itemId, x.warehouseId, x.rackId || "", x.shelfId || "", x.binId || ""].join("|"), x]));

    // Aggregate item quantities/cost so each item total is changed once.
    const itemAgg = new Map<string, { qty: number; value: number; oldStock: number; oldAvg: number; cursor: number }>();
    for (const l of raw) {
      const pi = poItemMap.get(l.poItemId)!;
      const cur = itemAgg.get(pi.itemId) || { qty: 0, value: 0, oldStock: pi.item.currentStock, oldAvg: pi.item.averageCost, cursor: pi.item.currentStock };
      cur.qty += l.receiveQty; cur.value += l.receiveQty * pi.rate;
      itemAgg.set(pi.itemId, cur);
    }

    const locationAgg = new Map<string, { itemId: string; line: ReceiveLine; qty: number }>();
    for (const l of raw) {
      const pi = poItemMap.get(l.poItemId)!;
      const key = locKey(pi.itemId, l);
      const cur = locationAgg.get(key) || { itemId: pi.itemId, line: l, qty: 0 };
      cur.qty += l.receiveQty;
      locationAgg.set(key, cur);
    }

    const grnNumber = await generateGRNNumber();
    const receiptId = randomUUID();
    const ops: Prisma.PrismaPromise<any>[] = [];

    // Receipt record with exact physical placement per line.
    ops.push(prisma.goodsReceipt.create({
      data: {
        id: receiptId, number: grnNumber, requestId, poId: po.id, receivedById: session.id,
        items: { create: raw.map((l) => {
          const pi = poItemMap.get(l.poItemId)!;
          return { poItemId: pi.id, itemId: pi.itemId, quantity: l.receiveQty, rate: pi.rate, warehouseId: l.warehouseId, rackId: l.rackId, shelfId: l.shelfId, binId: l.binId };
        }) },
      },
    }));

    // PO line counters.
    for (const l of raw) ops.push(prisma.purchaseOrderItem.update({ where: { id: l.poItemId }, data: { receivedQty: { increment: l.receiveQty } } }));

    // Total item stock + weighted average cost.
    for (const [itemId, a] of itemAgg) {
      const newStock = a.oldStock + a.qty;
      const newAvg = newStock > 0 ? ((a.oldStock * a.oldAvg) + a.value) / newStock : a.oldAvg;
      ops.push(prisma.item.update({ where: { id: itemId }, data: { currentStock: { increment: a.qty }, averageCost: newAvg } }));
    }

    // Exact location stock.
    for (const [key, a] of locationAgg) {
      const existing = existingLocationMap.get(key);
      if (existing) ops.push(prisma.itemLocationStock.update({ where: { id: existing.id }, data: { quantity: { increment: a.qty } } }));
      else ops.push(prisma.itemLocationStock.create({ data: { itemId: a.itemId, warehouseId: a.line.warehouseId, rackId: a.line.rackId, shelfId: a.line.shelfId, binId: a.line.binId, quantity: a.qty } }));
    }

    // Permanent stock movement rows with deterministic stock-after figures.
    for (const l of raw) {
      const pi = poItemMap.get(l.poItemId)!;
      const a = itemAgg.get(pi.itemId)!;
      const oldStock = a.cursor;
      const newStock = oldStock + l.receiveQty;
      a.cursor = newStock;
      ops.push(prisma.stockMovement.create({ data: {
        itemId: pi.itemId, type: "INWARD_GRN", quantity: l.receiveQty, oldStock, newStock, rate: pi.rate,
        reference: grnNumber, reason: `Material received against ${po.number}`,
        warehouseId: l.warehouseId, rackId: l.rackId, shelfId: l.shelfId, binId: l.binId, userId: session.id,
      } }));
    }

    const receivedNow = new Map(raw.map((l) => [l.poItemId, l.receiveQty]));
    const allReceived = po.items.every((pi) => pi.receivedQty + (receivedNow.get(pi.id) || 0) >= pi.quantity - 0.000001);
    const anyReceived = po.items.some((pi) => pi.receivedQty + (receivedNow.get(pi.id) || 0) > 0);
    const nextStatus = allReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : po.status;
    ops.push(prisma.purchaseOrder.update({ where: { id: po.id }, data: { status: nextStatus as any } }));
    ops.push(prisma.auditLog.create({ data: { userId: session.id, action: "PO_RECEIVE", entity: "PurchaseOrder", entityId: po.id, detail: `${po.number} · ${grnNumber}` } }));

    await prisma.$transaction(ops);
    return NextResponse.json({ ok: true, grnNumber, receiptId, status: nextStatus });
  } catch (e: any) {
    if (e?.code === "P2002") {
      // Most likely a repeated requestId after a network retry.
      return NextResponse.json({ error: "This receipt was already processed. Refresh the PO to see the GRN." }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || "Could not receive material." }, { status: 400 });
  }
}
