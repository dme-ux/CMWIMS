import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const s = await getSession();
  if (!s || !can(s.role, "expenses.view")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const categories = await prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "expenses.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const { name } = await req.json();
    const trimmed = String(name || "").trim();
    if (!trimmed) return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    const existing = await prisma.expenseCategory.findFirst({ where: { name: { equals: trimmed, mode: "insensitive" } } });
    if (existing) return NextResponse.json({ category: existing });
    const category = await prisma.expenseCategory.create({ data: { name: trimmed } });
    return NextResponse.json({ category });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not add category." }, { status: 400 });
  }
}
