import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { updateSale, deleteSale, paySale } from "@/lib/sales";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s || !can(s.role, "sales.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const b = await req.json();

    // Payment entry
    if (b.pay) {
      const amount = Number(b.amount);
      if (!amount || amount <= 0) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
      if (!b.mode) return NextResponse.json({ error: "Select a payment mode." }, { status: 400 });
      const sale = await paySale(id, amount, b.mode);
      await prisma.auditLog.create({ data: { userId: s.id, action: "UPDATE", entity: "CustomerInvoice", entityId: id, detail: `₹${amount} via ${b.mode}` } });
      return NextResponse.json({ sale });
    }

    const amount = b.amount !== undefined ? Number(b.amount) : undefined;
    if (amount !== undefined && (!amount || amount <= 0)) {
      return NextResponse.json({ error: "Enter a valid sale amount." }, { status: 400 });
    }
    const sale = await updateSale(id, {
      date: b.date,
      customerId: b.customerId,
      customerName: b.customerName,
      vehicleNo: b.vehicleNo,
      description: b.description,
      amount,
      costOfGoods: b.costOfGoods !== undefined ? Number(b.costOfGoods) : undefined,
    });
    await prisma.auditLog.create({ data: { userId: s.id, action: "UPDATE", entity: "CustomerInvoice", entityId: id, detail: sale.number } });
    return NextResponse.json({ sale });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not update sale." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s || !can(s.role, "sales.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    await deleteSale(id);
    await prisma.auditLog.create({ data: { userId: s.id, action: "DELETE", entity: "CustomerInvoice", entityId: id, detail: "" } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not delete sale." }, { status: 400 });
  }
}
