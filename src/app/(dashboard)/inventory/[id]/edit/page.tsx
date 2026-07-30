import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getItemById, getMasters } from "@/lib/items";
import { ItemForm } from "@/components/inventory/item-form";

export const dynamic = "force-dynamic";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "inventory.manage")) redirect("/inventory");

  const [item, masters] = await Promise.all([getItemById(id), getMasters()]);
  if (!item) notFound();

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Edit item</h1>
      <ItemForm masters={masters} item={item} mode="edit" />
    </div>
  );
}
