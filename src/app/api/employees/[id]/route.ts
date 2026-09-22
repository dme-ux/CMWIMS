import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { updateEmployee, deleteEmployee } from "@/lib/salary";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s || !can(s.role, "salary.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const b = await req.json();
    const salary = b.salary !== undefined ? Number(b.salary) : undefined;
    if (salary !== undefined && (!salary || salary <= 0)) {
      return NextResponse.json({ error: "Enter a valid monthly salary." }, { status: 400 });
    }
    const employee = await updateEmployee(id, {
      name: b.name,
      role: b.role,
      phone: b.phone,
      email: b.email,
      salary,
      isActive: b.isActive,
    });
    await prisma.auditLog.create({
      data: { userId: s.id, action: "UPDATE", entity: "Employee", entityId: employee.id, detail: `${employee.name}` },
    });
    return NextResponse.json({ employee });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not update employee." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s || !can(s.role, "salary.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    // Employees with past salary history are deactivated instead of deleted, so
    // the salary ledger for past months stays intact.
    const hasHistory = await prisma.salaryPayment.count({ where: { employeeId: id } });
    if (hasHistory > 0) {
      await updateEmployee(id, { isActive: false });
    } else {
      await deleteEmployee(id);
    }
    await prisma.auditLog.create({ data: { userId: s.id, action: "DELETE", entity: "Employee", entityId: id, detail: "" } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not remove employee." }, { status: 400 });
  }
}
