import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "workshop.view")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });
  const customers = await prisma.customer.findMany({
    where: { OR: [
      { name: { contains: q, mode: "insensitive" } }, { phone: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } },
      { vehicles: { some: { OR: [
        { registration: { contains: q, mode: "insensitive" } }, { vin: { contains: q, mode: "insensitive" } }, { chassisNumber: { contains: q, mode: "insensitive" } },
      ] } } },
    ] },
    include: { vehicles: true, workshopJobs: { orderBy: { createdAt: "desc" }, take: 10 } },
    take: 12,
  });
  return NextResponse.json({ results: customers });
}
