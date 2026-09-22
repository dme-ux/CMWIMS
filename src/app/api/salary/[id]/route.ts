import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { paySalary, updateAttendance } from "@/lib/salary";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s || !can(s.role, "salary.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const b = await req.json();

    // Attendance entry (month-end "kitne din present the")
    if (b.presentDays !== undefined) {
      const presentDays = Number(b.presentDays);
      if (Number.isNaN(presentDays) || presentDays < 0) {
        return NextResponse.json({ error: "Enter valid present days." }, { status: 400 });
      }
      const payment = await updateAttendance(id, presentDays, b.totalDays ? Number(b.totalDays) : undefined);
      await prisma.auditLog.create({
        data: { userId: s.id, action: "UPDATE", entity: "SalaryPayment", entityId: payment.id, detail: `Attendance: ${presentDays}/${payment.totalDays} days` },
      });
      return NextResponse.json({ payment });
    }

    // Payment entry
    const amount = Number(b.amount);
    if (!amount || amount <= 0) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
    if (!b.mode) return NextResponse.json({ error: "Select a payment mode (Cash / Bank / UPI)." }, { status: 400 });

    const payment = await paySalary(id, amount, b.mode, b.notes);
    await prisma.auditLog.create({
      data: { userId: s.id, action: "UPDATE", entity: "SalaryPayment", entityId: payment.id, detail: `₹${amount} via ${b.mode}` },
    });
    return NextResponse.json({ payment });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not save." }, { status: 400 });
  }
}
