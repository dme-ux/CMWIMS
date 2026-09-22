import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { listSales, getSalesSummary } from "@/lib/sales";
import { prisma } from "@/lib/prisma";
import { SalesClient } from "@/components/sales/sales-client";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const session = await getSession();
  if (!session || !can(session.role, "sales.view")) redirect("/dashboard");

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [sales, summary, customers] = await Promise.all([
    listSales(),
    getSalesSummary(monthStart),
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <SalesClient
      initial={sales.map((s) => ({ ...s, date: s.date.toISOString(), createdAt: s.createdAt.toISOString() }))}
      summary={summary}
      customers={customers}
      canManage={can(session.role, "sales.manage")}
    />
  );
}
