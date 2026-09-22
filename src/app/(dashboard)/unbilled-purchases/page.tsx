import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { listUnbilled, getUnbilledTotal } from "@/lib/unbilled";
import { UnbilledClient } from "@/components/unbilled/unbilled-client";

export const dynamic = "force-dynamic";

export default async function UnbilledPurchasesPage() {
  const session = await getSession();
  if (!session || !can(session.role, "purchase.view")) redirect("/dashboard");

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [purchases, monthTotal] = await Promise.all([listUnbilled(), getUnbilledTotal(monthStart)]);

  return (
    <UnbilledClient
      initial={purchases.map((p) => ({ ...p, date: p.date.toISOString(), createdAt: p.createdAt.toISOString() }))}
      monthTotal={monthTotal}
      canManage={can(session.role, "purchase.manage")}
    />
  );
}
