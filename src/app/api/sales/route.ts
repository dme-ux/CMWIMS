import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { listSales, createSale } from "@/lib/sales";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "sales.view")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const sales = await listSales({
    q: sp.get("q") || undefined,
    from: sp.get("from") || undefined,
    to: sp.get("to") || undefined,
    status: sp.get("status") || undefined,
  });
  return NextResponse.json({ sales });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "sales.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.date) return NextResponse.json({ error: "Date is required." }, { status: 400 });
    const amount = Number(b.amount);
    if (!amount || amount <= 0) return NextResponse.json({ error: "Enter a valid sale amount." }, { status: 400 });
    if (!b.customerId && !b.customerName?.trim()) {
      return NextResponse.json({ error: "Select a customer or enter a customer name." }, { status: 400 });
    }
    const sale = await createSale(
      {
        date: b.date,
        customerId: b.customerId || null,
        customerName: b.customerName || null,
        vehicleNo: b.vehicleNo,
        description: b.description,
        amount,
        costOfGoods: Number(b.costOfGoods) || 0,
      },
      s.name
    );
    await prisma.auditLog.create({
      data: { userId: s.id, action: "CREATE", entity: "CustomerInvoice", entityId: sale.id, detail: `${sale.number} · ₹${amount}` },
    });
    return NextResponse.json({ sale });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not save sale." }, { status: 400 });
  }
}
