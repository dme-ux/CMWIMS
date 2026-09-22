import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { closeDeduction, deleteDeduction } from "@/lib/salary";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s || !can(s.role, "salary.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const deduction = await closeDeduction(id);
    await prisma.auditLog.create({ data: { userId: s.id, action: "UPDATE", entity: "SalaryDeduction", entityId: id, detail: "Closed" } });
    return NextResponse.json({ deduction });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not update." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s || !can(s.role, "salary.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    await deleteDeduction(id);
    await prisma.auditLog.create({ data: { userId: s.id, action: "DELETE", entity: "SalaryDeduction", entityId: id, detail: "" } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not remove." }, { status: 400 });
  }
}
