import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { generateMonthlySalaries, currentMonth } from "@/lib/salary";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "salary.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const b = await req.json().catch(() => ({}));
    const month = b.month || currentMonth();
    const result = await generateMonthlySalaries(month);
    if (result.created > 0) {
      await prisma.auditLog.create({
        data: { userId: s.id, action: "CREATE", entity: "SalaryPayment", entityId: month, detail: `Generated ${result.created} salary entries for ${month}` },
      });
    }
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Could not generate salaries." }, { status: 400 });
  }
}
