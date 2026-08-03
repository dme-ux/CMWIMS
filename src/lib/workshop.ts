// ============================================================================
//  Workshop helpers — job cards.
// ============================================================================
import { prisma } from "@/lib/prisma";

export const WORKSHOP_STATUSES = ["RECEIVED", "IN_PROGRESS", "WAITING_PARTS", "READY", "DELIVERED", "CANCELLED"];

export async function generateJobNumber() {
  const count = await prisma.workshopJob.count();
  return `JOB-${String(count + 1).padStart(5, "0")}`;
}

export async function getJobs() {
  return prisma.workshopJob.findMany({
    include: { customer: true, vehicle: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getWorkshopCustomers() {
  return prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
}

export function jobStatusMeta(status: string): [string, string] {
  const map: Record<string, [string, string]> = {
    RECEIVED: ["Received", "bg-slate-100 text-slate-600"],
    IN_PROGRESS: ["In progress", "bg-brand-50 text-brand-700"],
    WAITING_PARTS: ["Waiting parts", "bg-amber-50 text-amber-700"],
    READY: ["Ready", "bg-cyan-50 text-cyan-700"],
    DELIVERED: ["Delivered", "bg-emerald-50 text-emerald-700"],
    CANCELLED: ["Cancelled", "bg-red-50 text-red-700"],
  };
  return map[status] ?? [status, "bg-slate-100 text-slate-600"];
}
