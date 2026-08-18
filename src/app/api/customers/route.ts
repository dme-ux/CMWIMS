import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { customerCode, getCustomers } from "@/lib/customer-vehicle";

const str = (v: unknown) => typeof v === "string" && v.trim() ? v.trim() : null;

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "workshop.view")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ customers: await getCustomers(req.nextUrl.searchParams.get("q") || "") });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || !can(s.role, "workshop.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.name?.trim()) return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
    const phone = str(b.phone);
    if (phone) {
      const duplicate = await prisma.customer.findFirst({ where: { phone } });
      if (duplicate) return NextResponse.json({ error: "Customer with this mobile already exists.", customer: duplicate }, { status: 409 });
    }
    const customer = await prisma.customer.create({ data: {
      code: customerCode(), name: b.name.trim(), phone, altPhone: str(b.altPhone), email: str(b.email), gstin: str(b.gstin),
      address: str(b.address), city: str(b.city), state: str(b.state), pincode: str(b.pincode), notes: str(b.notes),
    }});
    await prisma.auditLog.create({ data: { userId: s.id, action: "CREATE", entity: "Customer", entityId: customer.id, detail: customer.name } });
    return NextResponse.json({ customer });
  } catch (e: any) { return NextResponse.json({ error: e.message || "Could not save customer." }, { status: 400 }); }
}
