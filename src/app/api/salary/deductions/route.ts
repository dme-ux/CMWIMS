import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { listDeductions, createDeduction } from "@/lib/salary";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "salary.view")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const employeeId = req.nextUrl.searchParams.get("employeeId") || undefined;
  const deductions = await listDeductions(employeeId);
  return NextResponse.json({ deductions });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "salary.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.employeeId) return NextResponse.json({ error: "Select an employee." }, { status: 400 });
    if (b.type !== "ADVANCE" && b.type !== "EMI") return NextResponse.json({ error: "Type must be Advance or EMI." }, { status: 400 });
    const totalAmount = Number(b.totalAmount);
    const installmentAmount = Number(b.installmentAmount);
    if (!totalAmount || totalAmount <= 0) return NextResponse.json({ error: "Enter a valid total amount." }, { status: 400 });
    if (!installmentAmount || installmentAmount <= 0) return NextResponse.json({ error: "Enter a valid monthly installment amount." }, { status: 400 });

    const deduction = await createDeduction({
      employeeId: b.employeeId,
      type: b.type,
      totalAmount,
      installmentAmount,
      notes: b.notes,
    });
    await prisma.auditLog.create({
      data: { userId: s.id, action: "CREATE", entity: "SalaryDeduction", entityId: deduction.id, detail: `${b.type} ₹${totalAmount} (₹${installmentAmount}/mo)` },
    });
    return NextResponse.json({ deduction });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not add." }, { status: 400 });
  }
}
