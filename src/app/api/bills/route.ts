// ============================================================================
//  /api/bills  —  vendor bills: list (GET) + create (POST)
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { generateBillNumber, getBills } from "@/lib/accounting";

const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);

export async function GET() {
  const session = await getSession();
  if (!session || !can(session.role, "accounts.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const bills = await getBills();
  return NextResponse.json({ bills });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !can(session.role, "accounts.manage")) {
    return NextResponse.json({ error: "You don't have permission to create bills." }, { status: 403 });
  }

  try {
    const b = await req.json();
    if (!b.vendorId) return NextResponse.json({ error: "Select a vendor." }, { status: 400 });

    const subTotal = num(b.subTotal);
    const taxTotal = num(b.taxTotal);
    const grandTotal = subTotal + taxTotal;
    if (grandTotal <= 0) return NextResponse.json({ error: "Bill amount must be greater than zero." }, { status: 400 });

    const number = b.number?.trim() || (await generateBillNumber());

    const bill = await prisma.purchaseInvoice.create({
      data: {
        number,
        vendorId: b.vendorId,
        poId: b.poId || null,
        invoiceDate: b.invoiceDate ? new Date(b.invoiceDate) : new Date(),
        dueDate: b.dueDate ? new Date(b.dueDate) : null,
        subTotal,
        taxTotal,
        grandTotal,
        paidAmount: 0,
        paymentStatus: "UNPAID",
      },
    });

    await prisma.auditLog.create({
      data: { userId: session.id, action: "CREATE", entity: "PurchaseInvoice", entityId: bill.id, detail: number },
    });

    return NextResponse.json({ bill });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "A bill with this number already exists." }, { status: 409 });
    return NextResponse.json({ error: "Could not create the bill." }, { status: 500 });
  }
}
