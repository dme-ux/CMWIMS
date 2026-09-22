import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { listSalaryPayments } from "@/lib/salary";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "salary.view")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const rows = await listSalaryPayments({
    month: sp.get("month") || undefined,
    employeeId: sp.get("employeeId") || undefined,
    status: sp.get("status") || undefined,
  });
  return NextResponse.json({ payments: rows });
}
