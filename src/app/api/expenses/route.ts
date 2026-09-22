import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { listExpenses } from "@/lib/expenses";

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "expenses.view")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const rows = await listExpenses({
    q: sp.get("q") || undefined,
    categoryId: sp.get("categoryId") || undefined,
    from: sp.get("from") || undefined,
    to: sp.get("to") || undefined,
  });
  return NextResponse.json({ expenses: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "expenses.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.date) return NextResponse.json({ error: "Date is required." }, { status: 400 });
    if (!b.categoryId) return NextResponse.json({ error: "Category is required." }, { status: 400 });
    const amount = Number(b.amount);
    if (!amount || amount <= 0) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });

    const expense = await prisma.expense.create({
      data: {
        date: new Date(b.date),
        categoryId: b.categoryId,
        description: str(b.description),
        amount,
        paidBy: str(b.paidBy),
        mode: str(b.mode),
        createdByName: s.name,
      },
      include: { category: true },
    });
    await prisma.auditLog.create({
      data: { userId: s.id, action: "CREATE", entity: "Expense", entityId: expense.id, detail: `${expense.category.name} · ₹${amount}` },
    });
    return NextResponse.json({ expense });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not save expense." }, { status: 400 });
  }
}
