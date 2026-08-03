import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { UserManager } from "@/components/users/user-manager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getSession();
  if (!session || !can(session.role, "users.manage")) redirect("/dashboard");

  return (
    <div className="space-y-5">
      <Link href="/settings" className="flex items-center gap-2 text-sm text-ink-muted hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">User Management</h1>
        <p className="text-sm text-ink-muted">Add users, assign roles, and control access.</p>
      </div>
      <UserManager />
    </div>
  );
}
