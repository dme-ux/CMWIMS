import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { getVehicles } from "@/lib/customer-vehicle";
const str = (v: unknown) => typeof v === "string" && v.trim() ? v.trim() : null;
const num = (v: unknown) => v === "" || v == null ? null : Number(v) || null;

export async function GET(req: NextRequest) {
  const s = await getSession(); if (!s || !can(s.role, "workshop.view")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ vehicles: await getVehicles(req.nextUrl.searchParams.get("q") || "") });
}
export async function POST(req: NextRequest) {
  const s = await getSession(); if (!s || !can(s.role, "workshop.manage")) return NextResponse.json({ error: "No permission" }, { status: 403 });
  try {
    const b = await req.json();
    if (!b.registration?.trim() && !b.chassisNumber?.trim() && !b.vin?.trim()) return NextResponse.json({ error: "Registration, VIN or chassis number is required." }, { status: 400 });
    const registration = b.registration?.trim() ? b.registration.trim().toUpperCase() : null;
    if (registration && await prisma.vehicle.findUnique({ where: { registration } })) return NextResponse.json({ error: "Vehicle registration already exists." }, { status: 409 });
    const vehicle = await prisma.vehicle.create({ data: {
      customerId: b.customerId || null, registration, vin: str(b.vin), chassisNumber: str(b.chassisNumber), engineNumber: str(b.engineNumber),
      brand: str(b.brand), modelName: str(b.modelName), variant: str(b.variant), fuelType: str(b.fuelType), transmission: str(b.transmission),
      year: num(b.year), color: str(b.color), lastOdometer: num(b.lastOdometer),
    }});
    await prisma.auditLog.create({ data: { userId: s.id, action: "CREATE", entity: "Vehicle", entityId: vehicle.id, detail: registration || vehicle.chassisNumber || vehicle.vin } });
    return NextResponse.json({ vehicle });
  } catch (e: any) { return NextResponse.json({ error: e.message || "Could not save vehicle." }, { status: 400 }); }
}
