import { prisma } from "@/lib/prisma";

export async function generateGatePassNumber() {
  const count = await prisma.gatePass.count();
  const yy = new Date().getFullYear().toString().slice(-2);
  return `GP-${yy}-${String(count + 1).padStart(4, "0")}`;
}

export async function getGatePasses() {
  return prisma.gatePass.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
}
