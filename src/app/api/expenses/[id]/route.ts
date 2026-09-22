import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s || !can(s.role, "expenses.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const b = await req.json();
    const amount = Number(b.amount);
    if (!amount || amount <= 0) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        date: b.date ? new Date(b.date) : undefined,
        categoryId: b.categoryId || undefined,
        description: str(b.description),
        amount,
        paidBy: str(b.paidBy),
        mode: str(b.mode),
      },
      include: { category: true },
    });
    await prisma.auditLog.create({
      data: { userId: s.id, action: "UPDATE", entity: "Expense", entityId: expense.id, detail: `${expense.category.name} · ₹${amount}` },
    });
    return NextResponse.json({ expense });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not update expense." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s || !can(s.role, "expenses.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    await prisma.expense.delete({ where: { id } });
    await prisma.auditLog.create({ data: { userId: s.id, action: "DELETE", entity: "Expense", entityId: id, detail: "" } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not delete expense." }, { status: 400 });
  }
}
