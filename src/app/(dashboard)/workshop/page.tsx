import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getJobs, getWorkshopCustomers } from "@/lib/workshop";
import { WorkshopClient } from "@/components/workshop/workshop-client";

export const dynamic = "force-dynamic";

export default async function WorkshopPage() {
  const session = await getSession();
  if (!session || !can(session.role, "workshop.view")) redirect("/dashboard");

  const [jobs, customers] = await Promise.all([getJobs(), getWorkshopCustomers()]);
  const canManage = can(session.role, "workshop.manage");

  const jobsData = jobs.map((j) => ({
    id: j.id, jobNumber: j.jobNumber, complaint: j.complaint, status: j.status,
    estimate: j.estimate, createdAt: j.createdAt.toISOString(),
    customer: j.customer ? { name: j.customer.name } : null,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Workshop · Job Cards</h1>
        <p className="text-sm text-ink-muted">Track vehicle jobs from receipt to delivery.</p>
      </div>
      <WorkshopClient jobs={jobsData} customers={customers} canManage={canManage} />
    </div>
  );
}
