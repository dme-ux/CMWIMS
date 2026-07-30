// ============================================================================
//  /api/purchase-orders  —  list (GET) + create (POST)
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { generatePONumber, getPurchaseOrders } from "@/lib/purchase";

const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);

export async function GET() {
  const session = await getSession();
  if (!session || !can(session.role, "purchase.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await getPurchaseOrders();
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !can(session.role, "purchase.manage")) {
    return NextResponse.json({ error: "You don't have permission to create purchase orders." }, { status: 403 });
  }

  try {
    const b = await req.json();
    if (!b.vendorId) return NextResponse.json({ error: "Select a vendor." }, { status: 400 });

    const lines = Array.isArray(b.items) ? b.items.filter((l: any) => l.itemId && num(l.quantity) > 0) : [];
    if (lines.length === 0) return NextResponse.json({ error: "Add at least one item with a quantity." }, { status: 400 });

    // Compute totals on the server (never trust the client).
    let subTotal = 0, taxTotal = 0;
    const itemsData = lines.map((l: any) => {
      const quantity = num(l.quantity);
      const rate = num(l.rate);
      const gstRate = num(l.gstRate);
      const amount = quantity * rate;
      subTotal += amount;
      taxTotal += (amount * gstRate) / 100;
      return { itemId: l.itemId, quantity, rate, gstRate, amount };
    });
    const grandTotal = subTotal + taxTotal;

    const status = b.status === "PENDING_APPROVAL" ? "PENDING_APPROVAL" : "DRAFT";
    const number = await generatePONumber();

    const po = await prisma.purchaseOrder.create({
      data: {
        number,
        vendorId: b.vendorId,
        status,
        expectedDate: b.expectedDate ? new Date(b.expectedDate) : null,
        notes: b.notes || null,
        subTotal,
        taxTotal,
        grandTotal,
        createdById: session.id,
        items: { create: itemsData },
      },
    });

    await prisma.auditLog.create({
      data: { userId: session.id, action: "CREATE", entity: "PurchaseOrder", entityId: po.id, detail: number },
    });

    return NextResponse.json({ po });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "PO number clash — please retry." }, { status: 409 });
    return NextResponse.json({ error: "Could not create the purchase order." }, { status: 500 });
  }
}
