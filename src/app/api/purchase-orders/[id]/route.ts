// ============================================================================
// /api/purchase-orders/[id] — PO edit (PUT) + status transitions (PATCH)
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";

const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "purchase.manage")) return forbidden();

  const existing = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
  if (!existing) return NextResponse.json({ error: "Purchase order not found." }, { status: 404 });
  if (["RECEIVED", "CANCELLED"].includes(existing.status)) return bad("Received or cancelled purchase orders are locked. Use a return/amendment process instead.");

  try {
    const b = await req.json();
    if (!b.vendorId) return bad("Select a vendor.");
    const lines = Array.isArray(b.items) ? b.items.filter((l: any) => l.itemId && num(l.quantity) > 0) : [];
    if (!lines.length) return bad("Add at least one item with a quantity.");

    const oldMap = new Map(existing.items.map((x) => [x.id, x]));
    const submittedExistingIds = new Set<string>();
    let subTotal = 0, taxTotal = 0;
    const updates: any[] = [];
    const creates: any[] = [];

    for (const l of lines) {
      const quantity = num(l.quantity), rate = num(l.rate), gstRate = num(l.gstRate);
      if (quantity <= 0) return bad("Quantity must be greater than zero.");
      const amount = quantity * rate;
      subTotal += amount; taxTotal += (amount * gstRate) / 100;

      if (l.id) {
        const old = oldMap.get(String(l.id));
        if (!old) return bad("One of the PO lines is invalid.");
        submittedExistingIds.add(old.id);
        if (quantity + 0.000001 < old.receivedQty) return bad(`Quantity cannot be reduced below already received quantity (${old.receivedQty}).`);
        if (old.receivedQty > 0 && String(l.itemId) !== old.itemId) return bad("A part cannot be changed after any quantity has already been received.");
        updates.push({ where: { id: old.id }, data: { itemId: String(l.itemId), quantity, rate, gstRate, amount } });
      } else {
        creates.push({ itemId: String(l.itemId), quantity, receivedQty: 0, rate, gstRate, amount });
      }
    }

    const deleteIds = existing.items.filter((x) => !submittedExistingIds.has(x.id)).map((x) => {
      if (x.receivedQty > 0) throw new Error("A PO line with received material cannot be deleted.");
      return x.id;
    });

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        vendorId: b.vendorId,
        expectedDate: b.expectedDate ? new Date(b.expectedDate) : null,
        notes: b.notes?.trim() || null,
        subTotal, taxTotal, grandTotal: subTotal + taxTotal,
        items: {
          ...(deleteIds.length ? { deleteMany: { id: { in: deleteIds } } } : {}),
          ...(updates.length ? { update: updates } : {}),
          ...(creates.length ? { create: creates } : {}),
        },
      },
      include: { items: true },
    });

    await prisma.auditLog.create({ data: { userId: session.id, action: "PO_EDIT", entity: "PurchaseOrder", entityId: id, detail: existing.number } });
    return NextResponse.json({ po });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Could not update the purchase order." }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Purchase order not found." }, { status: 404 });

  const { action } = await req.json();
  const data: any = {};
  switch (action) {
    case "submit":
      if (!can(session.role, "purchase.manage")) return forbidden();
      if (existing.status !== "DRAFT") return bad("Only draft orders can be submitted.");
      data.status = "PENDING_APPROVAL"; break;
    case "approve":
      if (!can(session.role, "purchase.approve")) return forbidden();
      if (!["DRAFT", "PENDING_APPROVAL"].includes(existing.status)) return bad("This order can't be approved.");
      data.status = "APPROVED"; data.approvedById = session.id; data.approvedAt = new Date(); break;
    case "reject":
      if (!can(session.role, "purchase.approve")) return forbidden();
      if (!["DRAFT", "PENDING_APPROVAL"].includes(existing.status)) return bad("Only draft or pending orders can be rejected.");
      data.status = "CANCELLED"; break;
    case "send":
      if (!can(session.role, "purchase.manage")) return forbidden();
      if (existing.status !== "APPROVED") return bad("Approve the order before sending.");
      data.status = "SENT"; break;
    case "cancel":
      if (!can(session.role, "purchase.manage")) return forbidden();
      if (["RECEIVED", "CANCELLED", "PARTIALLY_RECEIVED"].includes(existing.status)) return bad("A received/partially received order can't be cancelled directly.");
      data.status = "CANCELLED"; break;
    default: return bad("Unknown action.");
  }

  const po = await prisma.purchaseOrder.update({ where: { id }, data });
  await prisma.auditLog.create({ data: { userId: session.id, action: `PO_${action.toUpperCase()}`, entity: "PurchaseOrder", entityId: id, detail: existing.number } });
  return NextResponse.json({ po });
}

const forbidden = () => NextResponse.json({ error: "You don't have permission for this action." }, { status: 403 });
const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });
