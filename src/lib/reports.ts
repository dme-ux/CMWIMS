// ============================================================================
//  Reports registry — each report returns { columns, rows } for table + CSV.
// ============================================================================
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

const round = (n: number) => Math.round((n || 0) * 100) / 100;

export type ReportResult = { columns: string[]; rows: (string | number)[][] };
export type ReportMeta = { key: string; label: string; description: string };

type ReportDef = ReportMeta & { fetch: () => Promise<ReportResult> };

export const REPORTS: Record<string, ReportDef> = {
  stock: {
    key: "stock",
    label: "Stock Report",
    description: "Current stock, location and value for every item.",
    async fetch() {
      const items = await prisma.item.findMany({
        where: { isActive: true },
        include: { category: true, unit: true, warehouse: true, rack: true, shelf: true, bin: true },
        orderBy: { name: "asc" },
      });
      return {
        columns: ["SKU", "Name", "Category", "Location", "Current Stock", "Unit", "Avg Cost", "Stock Value", "Selling Rate"],
        rows: items.map((i) => [
          i.sku, i.name, i.category?.name ?? "",
          [i.warehouse?.name, i.rack?.name, i.shelf?.name, i.bin?.name].filter(Boolean).join(" / "),
          i.currentStock, i.unit?.name ?? "", round(i.averageCost), round(i.currentStock * i.averageCost), i.sellingRate,
        ]),
      };
    },
  },

  "low-stock": {
    key: "low-stock",
    label: "Low Stock Report",
    description: "Items at or below their reorder level.",
    async fetch() {
      const items = await prisma.item.findMany({ where: { isActive: true }, include: { vendor: true }, orderBy: { name: "asc" } });
      const low = items.filter((i) => i.currentStock <= i.reorderLevel);
      return {
        columns: ["SKU", "Name", "Current Stock", "Reorder Level", "Preferred Vendor"],
        rows: low.map((i) => [i.sku, i.name, i.currentStock, i.reorderLevel, i.vendor?.name ?? ""]),
      };
    },
  },

  movements: {
    key: "movements",
    label: "Stock Movement Report",
    description: "Audit trail of every stock change.",
    async fetch() {
      const moves = await prisma.stockMovement.findMany({ include: { item: true, user: true }, orderBy: { createdAt: "desc" }, take: 500 });
      return {
        columns: ["Date", "Item", "Type", "Qty", "Old Stock", "New Stock", "Reference", "By"],
        rows: moves.map((m) => [formatDate(m.createdAt), m.item.name, m.type, m.quantity, m.oldStock, m.newStock, m.reference ?? "", m.user?.name ?? ""]),
      };
    },
  },

  purchase: {
    key: "purchase",
    label: "Purchase Report",
    description: "All purchase orders with status and value.",
    async fetch() {
      const pos = await prisma.purchaseOrder.findMany({ include: { vendor: true }, orderBy: { createdAt: "desc" }, take: 500 });
      return {
        columns: ["PO #", "Vendor", "Date", "Status", "Sub Total", "Tax", "Grand Total"],
        rows: pos.map((p) => [p.number, p.vendor.name, formatDate(p.orderDate), p.status, round(p.subTotal), round(p.taxTotal), round(p.grandTotal)]),
      };
    },
  },

  outstanding: {
    key: "outstanding",
    label: "Outstanding / Payment Report",
    description: "Unpaid and partially-paid vendor bills.",
    async fetch() {
      const bills = await prisma.purchaseInvoice.findMany({ where: { paymentStatus: { not: "PAID" } }, include: { vendor: true }, orderBy: { invoiceDate: "desc" } });
      return {
        columns: ["Bill #", "Vendor", "Date", "Due", "Total", "Paid", "Pending", "Status"],
        rows: bills.map((b) => [b.number, b.vendor.name, formatDate(b.invoiceDate), b.dueDate ? formatDate(b.dueDate) : "", round(b.grandTotal), round(b.paidAmount), round(b.grandTotal - b.paidAmount), b.paymentStatus]),
      };
    },
  },

  "dead-stock": {
    key: "dead-stock",
    label: "Dead Stock Report",
    description: "In-stock items with no movement in the last 90 days.",
    async fetch() {
      const items = await prisma.item.findMany({ where: { isActive: true, currentStock: { gt: 0 } }, orderBy: { name: "asc" } });
      const latest = await prisma.stockMovement.groupBy({ by: ["itemId"], _max: { createdAt: true } });
      const lastMap = new Map(latest.map((l) => [l.itemId, l._max.createdAt]));
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const dead = items.filter((i) => {
        const last = lastMap.get(i.id);
        return !last || last < cutoff;
      });
      return {
        columns: ["SKU", "Name", "Current Stock", "Last Movement"],
        rows: dead.map((i) => {
          const last = lastMap.get(i.id);
          return [i.sku, i.name, i.currentStock, last ? formatDate(last) : "Never"];
        }),
      };
    },
  },
};

export const REPORT_LIST: ReportMeta[] = Object.values(REPORTS).map(({ key, label, description }) => ({ key, label, description }));
