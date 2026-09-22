import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { updateUnbilled, deleteUnbilled } from "@/lib/unbilled";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s || !can(s.role, "purchase.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const b = await req.json();
    const amount = b.amount !== undefined ? Number(b.amount) : undefined;
    if (amount !== undefined && (!amount || amount <= 0)) {
      return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
    }
    const purchase = await updateUnbilled(id, {
      date: b.date,
      vendorName: b.vendorName,
      description: b.description,
      amount,
      paidAmount: b.paidAmount !== undefined ? Number(b.paidAmount) : undefined,
      mode: b.mode,
      notes: b.notes,
    });
    await prisma.auditLog.create({ data: { userId: s.id, action: "UPDATE", entity: "UnbilledPurchase", entityId: id, detail: purchase.vendorName } });
    return NextResponse.json({ purchase });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not update." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s || !can(s.role, "purchase.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    await deleteUnbilled(id);
    await prisma.auditLog.create({ data: { userId: s.id, action: "DELETE", entity: "UnbilledPurchase", entityId: id, detail: "" } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not delete." }, { status: 400 });
  }
}
