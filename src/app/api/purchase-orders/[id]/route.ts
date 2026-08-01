// ============================================================================
//  /api/purchase-orders/[id]  —  status transitions (PATCH)
//  actions: submit · approve · reject · send · cancel
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Purchase order not found." }, { status: 404 });

  const { action } = await req.json();
  const data: any = {};

  switch (action) {
    case "submit":
      if (!can(session.role, "purchase.manage")) return forbidden();
      if (existing.status !== "DRAFT") return bad("Only draft orders can be submitted.");
      data.status = "PENDING_APPROVAL";
      break;
    case "approve":
      if (!can(session.role, "purchase.approve")) return forbidden();
      if (!["DRAFT", "PENDING_APPROVAL"].includes(existing.status)) return bad("This order can't be approved.");
      data.status = "APPROVED";
      data.approvedById = session.id;
      data.approvedAt = new Date();
      break;
    case "reject":
      if (!can(session.role, "purchase.approve")) return forbidden();
      if (!["DRAFT", "PENDING_APPROVAL"].includes(existing.status)) return bad("Only draft or pending orders can be rejected.");
      data.status = "CANCELLED";
      break;
    case "send":
      if (!can(session.role, "purchase.manage")) return forbidden();
      if (existing.status !== "APPROVED") return bad("Approve the order before sending.");
      data.status = "SENT";
      break;
    case "cancel":
      if (!can(session.role, "purchase.manage")) return forbidden();
      if (["RECEIVED", "CANCELLED"].includes(existing.status)) return bad("This order can't be cancelled.");
      data.status = "CANCELLED";
      break;
    default:
      return bad("Unknown action.");
  }

  const po = await prisma.purchaseOrder.update({ where: { id }, data });
  await prisma.auditLog.create({
    data: { userId: session.id, action: `PO_${action.toUpperCase()}`, entity: "PurchaseOrder", entityId: id, detail: existing.number },
  });
  return NextResponse.json({ po });
}

const forbidden = () => NextResponse.json({ error: "You don't have permission for this action." }, { status: 403 });
const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });
