import { prisma } from "@/lib/prisma";

export async function getCustomers(q = "") {
  const search = q.trim();
  return prisma.customer.findMany({
    where: search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { vehicles: { some: { OR: [
          { registration: { contains: search, mode: "insensitive" } },
          { vin: { contains: search, mode: "insensitive" } },
          { chassisNumber: { contains: search, mode: "insensitive" } },
        ] } } },
      ],
    } : { isActive: true },
    include: { vehicles: { orderBy: { createdAt: "desc" } } },
    orderBy: { updatedAt: "desc" },
    take: 250,
  });
}

export async function getVehicles(q = "") {
  const search = q.trim();
  return prisma.vehicle.findMany({
    where: search ? { OR: [
      { registration: { contains: search, mode: "insensitive" } },
      { vin: { contains: search, mode: "insensitive" } },
      { chassisNumber: { contains: search, mode: "insensitive" } },
      { engineNumber: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { modelName: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { customer: { phone: { contains: search, mode: "insensitive" } } },
    ] } : {},
    include: { customer: true },
    orderBy: { updatedAt: "desc" },
    take: 250,
  });
}

export function customerCode() {
  return `CMW-C-${Date.now().toString(36).toUpperCase()}`;
}
