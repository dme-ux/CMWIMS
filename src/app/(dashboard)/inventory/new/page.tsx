import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {can, canSession} from "@/lib/auth/rbac";
import { getMasters } from "@/lib/items";
import { ItemForm } from "@/components/inventory/item-form";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const session = await getSession();
  if (!session || !canSession(session, "inventory.manage")) redirect("/inventory");
  const masters = await getMasters();

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Add item</h1>
      <ItemForm masters={masters} mode="create" />
    </div>
  );
}
