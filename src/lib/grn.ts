import { prisma } from "@/lib/prisma";

export async function getGRNById(id: string) {
  return prisma.goodsReceipt.findUnique({
    where: { id },
    include: {
      po: { include: { vendor: true } },
      receivedBy: true,
      items: { include: { item: true, warehouse: true, rack: true, shelf: true, bin: true } },
    },
  });
}
