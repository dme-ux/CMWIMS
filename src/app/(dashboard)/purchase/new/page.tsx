import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getPOFormData } from "@/lib/purchase";
import { POForm } from "@/components/purchase/po-form";

export const dynamic = "force-dynamic";

export default async function NewPOPage() {
  const session = await getSession();
  if (!session || !can(session.role, "purchase.manage")) redirect("/purchase");
  const { vendors, items } = await getPOFormData();

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">New Purchase Order</h1>
      <POForm vendors={vendors} items={items} />
    </div>
  );
}
