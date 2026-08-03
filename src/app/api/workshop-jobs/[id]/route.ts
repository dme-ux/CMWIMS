// ============================================================================
//  /api/workshop-jobs/[id]  —  update status (PATCH)
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { WORKSHOP_STATUSES } from "@/lib/workshop";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !can(session.role, "workshop.manage")) {
    return NextResponse.json({ error: "You don't have permission to update job cards." }, { status: 403 });
  }

  const { status } = await req.json();
  if (!WORKSHOP_STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const existing = await prisma.workshopJob.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Job card not found." }, { status: 404 });

  const job = await prisma.workshopJob.update({ where: { id }, data: { status } });
  await prisma.auditLog.create({
    data: { userId: session.id, action: "JOB_STATUS", entity: "WorkshopJob", entityId: id, detail: `${existing.jobNumber} -> ${status}` },
  });
  return NextResponse.json({ job });
}
