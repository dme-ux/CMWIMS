import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getBillFormData } from "@/lib/accounting";
import { BillForm } from "@/components/accounting/bill-form";

export const dynamic = "force-dynamic";

export default async function NewBillPage() {
  const session = await getSession();
  if (!session || !can(session.role, "accounts.manage")) redirect("/accounting");
  const { vendors, pos } = await getBillFormData();

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">New Vendor Bill</h1>
      <BillForm vendors={vendors} pos={pos} />
    </div>
  );
}
