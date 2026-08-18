import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getCustomers } from "@/lib/customer-vehicle";
import { CustomersClient } from "@/components/customers/customers-client";
export const dynamic = "force-dynamic";
export default async function CustomersPage() {
  const s = await getSession(); if (!s || !can(s.role, "workshop.view")) redirect("/dashboard");
  const rows = await getCustomers();
  const data = rows.map((c:any)=>({ ...c, createdAt:c.createdAt.toISOString(), updatedAt:c.updatedAt.toISOString(), vehicles:c.vehicles.map((v:any)=>({...v,createdAt:v.createdAt.toISOString(),updatedAt:v.updatedAt.toISOString()})) }));
  return <CustomersClient initial={data} canManage={can(s.role,"workshop.manage")} />;
}
