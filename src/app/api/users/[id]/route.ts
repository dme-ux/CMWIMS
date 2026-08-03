// ============================================================================
//  /api/users/[id]  —  update role/active/password (PATCH), deactivate (DELETE)
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can, ROLE_LABELS } from "@/lib/auth/rbac";
import { hashPassword } from "@/lib/auth/password";

const VALID_ROLES = Object.keys(ROLE_LABELS);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "users.manage")) {
    return NextResponse.json({ error: "You don't have permission to manage users." }, { status: 403 });
  }

  const b = await req.json();
  const data: any = {};

  if (b.role !== undefined) {
    if (!VALID_ROLES.includes(b.role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    data.role = b.role;
  }
  if (b.isActive !== undefined) {
    if (id === session.id && b.isActive === false) return NextResponse.json({ error: "You can't deactivate your own account." }, { status: 400 });
    data.isActive = !!b.isActive;
  }
  if (b.password) data.passwordHash = await hashPassword(String(b.password));

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const user = await prisma.user.update({
    where: { id }, data,
    select: { id: true, name: true, username: true, email: true, role: true, isActive: true },
  });
  await prisma.auditLog.create({
    data: { userId: session.id, action: "UPDATE", entity: "User", entityId: id, detail: user.username },
  });
  return NextResponse.json({ user });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "users.manage")) {
    return NextResponse.json({ error: "You don't have permission to manage users." }, { status: 403 });
  }
  if (id === session.id) return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });

  await prisma.user.update({ where: { id }, data: { isActive: false } });
  await prisma.auditLog.create({ data: { userId: session.id, action: "DEACTIVATE", entity: "User", entityId: id } });
  return NextResponse.json({ ok: true });
}
