import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { generateGatePassNumber, getGatePasses } from "@/lib/gatepass";

export async function GET() {
  const session = await getSession();
  if (!session || !can(session.role, "workshop.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const passes = await getGatePasses();
  return NextResponse.json({ passes });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !can(session.role, "workshop.view")) {
    return NextResponse.json({ error: "You don't have permission to create gate passes." }, { status: 403 });
  }

  try {
    const b = await req.json();
    if (!b.partyName?.trim() || !b.vehicleNo?.trim()) {
      return NextResponse.json({ error: "Party name and vehicle number are required." }, { status: 400 });
    }

    const number = await generateGatePassNumber();
    const pass = await prisma.gatePass.create({
      data: {
        number,
        date: b.date ? new Date(b.date) : new Date(),
        partyName: b.partyName.trim(),
        vehicleNo: b.vehicleNo.trim().toUpperCase(),
        purpose: b.purpose?.trim() || null,
        authorisedBy: b.authorisedBy?.trim() || null,
        createdById: session.id,
      },
    });

    await prisma.auditLog.create({
      data: { userId: session.id, action: "CREATE", entity: "GatePass", entityId: pass.id, detail: number },
    });

    return NextResponse.json({ pass });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Gate pass number clash — please retry." }, { status: 409 });
    return NextResponse.json({ error: "Could not create the gate pass." }, { status: 500 });
  }
}
