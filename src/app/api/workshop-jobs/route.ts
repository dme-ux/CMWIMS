// ============================================================================
//  /api/workshop-jobs  —  list (GET) + create (POST)
// ============================================================================
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { generateJobNumber, getJobs } from "@/lib/workshop";

const num = (v: unknown) => (v === "" || v == null ? null : Number(v) || 0);

export async function GET() {
  const session = await getSession();
  if (!session || !can(session.role, "workshop.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jobs = await getJobs();
  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !can(session.role, "workshop.manage")) {
    return NextResponse.json({ error: "You don't have permission to create job cards." }, { status: 403 });
  }

  try {
    const b = await req.json();
    if (!b.complaint?.trim()) return NextResponse.json({ error: "Enter the complaint / work required." }, { status: 400 });

    const jobNumber = await generateJobNumber();
    const job = await prisma.workshopJob.create({
      data: {
        jobNumber,
        customerId: b.customerId || null,
        complaint: b.complaint.trim(),
        vehicleNo: b.vehicleNo?.trim() ? b.vehicleNo.trim().toUpperCase() : null,
        model: b.model?.trim() || null,
        odometer: num(b.odometer),
        contactNo: b.contactNo?.trim() || null,
        estimate: num(b.estimate),
        status: "RECEIVED",
      },
    });

    await prisma.auditLog.create({
      data: { userId: session.id, action: "CREATE", entity: "WorkshopJob", entityId: job.id, detail: jobNumber },
    });

    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: "Could not create the job card." }, { status: 500 });
  }
}
