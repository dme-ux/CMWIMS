import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { listExpenses, getExpenseCategories, getExpenseSummary } from "@/lib/expenses";
import { ExpensesClient } from "@/components/expenses/expenses-client";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const session = await getSession();
  if (!session || !can(session.role, "expenses.view")) redirect("/dashboard");

  const [expenses, categories, summary] = await Promise.all([
    listExpenses(),
    getExpenseCategories(),
    getExpenseSummary(),
  ]);

  return (
    <ExpensesClient
      initial={expenses.map((e) => ({ ...e, date: e.date.toISOString(), createdAt: e.createdAt.toISOString() }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      summary={summary}
      canManage={can(session.role, "expenses.manage")}
    />
  );
}
