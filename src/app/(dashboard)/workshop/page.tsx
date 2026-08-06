import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { getJobs, getWorkshopCustomers } from "@/lib/workshop";
import { WorkshopClient } from "@/components/workshop/workshop-client";

export const dynamic = "force-dynamic";

export default async function WorkshopPage() {
  const session = await getSession();
  if (!session || !can(session.role, "workshop.view")) redirect("/dashboard");

  const [jobs, customers, companySetting] = await Promise.all([
    getJobs(),
    getWorkshopCustomers(),
    prisma.setting.findUnique({ where: { key: "company" } }).catch(() => null),
  ]);
  const company = companySetting ? JSON.parse(companySetting.value) : {};
  const canManage = can(session.role, "workshop.manage");

  const jobsData = jobs.map((j: any) => ({
    id: j.id, jobNumber: j.jobNumber, complaint: j.complaint, status: j.status,
    estimate: j.estimate, createdAt: j.createdAt.toISOString(),
    vehicleNo: j.vehicleNo ?? null, model: j.model ?? null, odometer: j.odometer ?? null, contactNo: j.contactNo ?? null,
    serviceType: j.serviceType ?? null, additionalRequests: j.additionalRequests ?? null,
    custSignature: j.custSignature ?? null, advisorSignature: j.advisorSignature ?? null,
    customer: j.customer ? { name: j.customer.name } : null,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Workshop · Job Cards</h1>
        <p className="text-sm text-ink-muted">Create job cards, capture signatures, and print.</p>
      </div>
      <WorkshopClient jobs={jobsData} customers={customers} canManage={canManage} company={company} />
    </div>
  );
}
