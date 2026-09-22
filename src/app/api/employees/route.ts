import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { listEmployees, createEmployee } from "@/lib/salary";

export async function GET() {
  const s = await getSession();
  if (!s || !can(s.role, "salary.view")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const employees = await listEmployees();
  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "salary.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!b.role?.trim()) return NextResponse.json({ error: "Role is required." }, { status: 400 });
    const salary = Number(b.salary);
    if (!salary || salary <= 0) return NextResponse.json({ error: "Enter a valid monthly salary." }, { status: 400 });

    const employee = await createEmployee({
      name: b.name.trim(),
      role: b.role.trim(),
      phone: b.phone,
      email: b.email,
      salary,
    });
    await prisma.auditLog.create({
      data: { userId: s.id, action: "CREATE", entity: "Employee", entityId: employee.id, detail: `${employee.name} · ₹${salary}/mo` },
    });
    return NextResponse.json({ employee });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not add employee." }, { status: 400 });
  }
}
