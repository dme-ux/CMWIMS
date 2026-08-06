import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { ISSUE_REASONS } from "@/lib/outward";

const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v) || 0);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) {
    return NextResponse.json({ error: "You don't have permission to issue material." }, { status: 403 });
  }

  const b = await req.json();
  const reason = ISSUE_REASONS.find((r) => r.value === b.reason);
  if (!reason) return NextResponse.json({ error: "Select a valid reason." }, { status: 400 });
  if (!b.itemId) return NextResponse.json({ error: "Select an item." }, { status: 400 });

  const qty = num(b.quantity);
  if (qty <= 0) return NextResponse.json({ error: "Enter a quantity greater than zero." }, { status: 400 });

  const reasonText = b.party?.trim() ? `${reason.label} · ${b.party.trim()}` : reason.label;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUniqueOrThrow({ where: { id: b.itemId } });
      const oldStock = item.currentStock;
      const newStock = oldStock - qty;
      if (newStock < 0) throw new Error(`Only ${oldStock} in stock — cannot issue ${qty}.`);

      await tx.item.update({ where: { id: item.id }, data: { currentStock: newStock } });
      await tx.stockMovement.create({
        data: {
          itemId: item.id,
          type: reason.type as any,
          quantity: -qty,
          oldStock,
          newStock,
          rate: item.averageCost,
          reference: b.reference?.trim() || null,
          reason: reasonText,
          locationNote: b.note?.trim() || null,
          userId: session.id,
        },
      });
      return { newStock };
    });

    return NextResponse.json({ ok: true, newStock: result.newStock });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not issue material." }, { status: 400 });
  }
}
