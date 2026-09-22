import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { listEmployees, listSalaryPayments, currentMonth } from "@/lib/salary";
import { SalaryClient } from "@/components/salary/salary-client";

export const dynamic = "force-dynamic";

export default async function SalaryPage() {
  const session = await getSession();
  if (!session || !can(session.role, "salary.view")) redirect("/dashboard");

  const month = currentMonth();
  const [employees, payments] = await Promise.all([
    listEmployees(true),
    listSalaryPayments({ month }),
  ]);

  return (
    <SalaryClient
      month={month}
      employees={employees.map((e) => ({ id: e.id, name: e.name, role: e.role, salary: e.salary }))}
      initial={payments.map((p) => ({
        ...p,
        paidAt: p.paidAt ? p.paidAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
        employee: { id: p.employee.id, name: p.employee.name, role: p.employee.role, code: p.employee.code },
      }))}
      canManage={can(session.role, "salary.manage")}
    />
  );
}
