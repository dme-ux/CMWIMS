// ============================================================================
//  /api/bills/[id]/payments  —  record a payment against a bill (POST)
//  Updates paidAmount + paymentStatus in a transaction.
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";

const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "accounts.manage")) {
    return NextResponse.json({ error: "You don't have permission to record payments." }, { status: 403 });
  }

  const bill = await prisma.purchaseInvoice.findUnique({ where: { id } });
  if (!bill) return NextResponse.json({ error: "Bill not found." }, { status: 404 });

  const b = await req.json();
  const amount = num(b.amount);
  const pending = bill.grandTotal - bill.paidAmount;
  if (amount <= 0) return NextResponse.json({ error: "Enter a payment amount." }, { status: 400 });
  if (amount > pending + 0.001) return NextResponse.json({ error: `Amount exceeds the pending balance (${pending.toFixed(2)}).` }, { status: 400 });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          vendorId: bill.vendorId,
          invoiceId: bill.id,
          amount,
          mode: b.mode || null,
          reference: b.reference || null,
          paidAt: b.paidAt ? new Date(b.paidAt) : new Date(),
        },
      });

      const paidAmount = bill.paidAmount + amount;
      const paymentStatus = paidAmount >= bill.grandTotal - 0.001 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";
      await tx.purchaseInvoice.update({ where: { id }, data: { paidAmount, paymentStatus } });
    });

    await prisma.auditLog.create({
      data: { userId: session.id, action: "PAYMENT", entity: "PurchaseInvoice", entityId: id, detail: `${amount}` },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not record the payment." }, { status: 500 });
  }
}
