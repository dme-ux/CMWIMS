import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {can, canSession} from "@/lib/auth/rbac";
import { listEmployees } from "@/lib/salary";
import { EmployeesClient } from "@/components/employees/employees-client";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const session = await getSession();
  if (!session || !canSession(session, "salary.view")) redirect("/dashboard");

  const employees = await listEmployees();

  return (
    <EmployeesClient
      initial={employees.map((e) => ({ ...e, joinedAt: e.joinedAt.toISOString(), createdAt: e.createdAt.toISOString() }))}
      canManage={canSession(session, "salary.manage")}
    />
  );
}
