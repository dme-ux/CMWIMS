import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { listUnbilled, createUnbilled } from "@/lib/unbilled";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "purchase.view")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const purchases = await listUnbilled({
    q: sp.get("q") || undefined,
    from: sp.get("from") || undefined,
    to: sp.get("to") || undefined,
  });
  return NextResponse.json({ purchases });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "purchase.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.date) return NextResponse.json({ error: "Date is required." }, { status: 400 });
    if (!b.vendorName?.trim()) return NextResponse.json({ error: "Vendor name is required." }, { status: 400 });
    const amount = Number(b.amount);
    if (!amount || amount <= 0) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });

    const purchase = await createUnbilled(
      {
        date: b.date,
        vendorName: b.vendorName.trim(),
        description: b.description,
        amount,
        paidAmount: Number(b.paidAmount) || 0,
        mode: b.mode,
        notes: b.notes,
      },
      s.name
    );
    await prisma.auditLog.create({
      data: { userId: s.id, action: "CREATE", entity: "UnbilledPurchase", entityId: purchase.id, detail: `${purchase.vendorName} · ₹${amount}` },
    });
    return NextResponse.json({ purchase });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not save." }, { status: 400 });
  }
}
