import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { listDeductions, listEmployees } from "@/lib/salary";
import { AdvancesClient } from "@/components/salary/advances-client";

export const dynamic = "force-dynamic";

export default async function AdvancesPage() {
  const session = await getSession();
  if (!session || !can(session.role, "salary.view")) redirect("/dashboard");

  const [deductions, employees] = await Promise.all([listDeductions(), listEmployees(true)]);

  return (
    <AdvancesClient
      initial={deductions.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        employee: { id: d.employee.id, name: d.employee.name, role: d.employee.role },
      }))}
      employees={employees.map((e) => ({ id: e.id, name: e.name, role: e.role }))}
      canManage={can(session.role, "salary.manage")}
    />
  );
}
