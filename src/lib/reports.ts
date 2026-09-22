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

  "vendor-payments": {
    key: "vendor-payments",
    label: "Vendor Payment Report",
    description: "Vendor-wise billed, paid and pending across all bills.",
    async fetch() {
      const bills = await prisma.purchaseInvoice.findMany({ include: { vendor: true } });
      const map = new Map<string, { name: string; billed: number; paid: number }>();
      for (const b of bills) {
        const row = map.get(b.vendorId) ?? { name: b.vendor.name, billed: 0, paid: 0 };
        row.billed += b.grandTotal;
        row.paid += b.paidAmount;
        map.set(b.vendorId, row);
      }
      const list = Array.from(map.values()).sort((a, b) => (b.billed - b.paid) - (a.billed - a.paid));
      return {
        columns: ["Vendor", "Billed", "Paid", "Pending"],
        rows: list.map((v) => [v.name, round(v.billed), round(v.paid), round(v.billed - v.paid)]),
      };
    },
  },

  expenses: {
    key: "expenses",
    label: "Expense Report",
    description: "All operational expenses — food, electricity, fuel, rent and more.",
    async fetch() {
      const rows = await prisma.expense.findMany({ include: { category: true }, orderBy: { date: "desc" }, take: 1000 });
      return {
        columns: ["Date", "Category", "Description", "Amount", "Paid By", "Mode", "Entered By"],
        rows: rows.map((e) => [formatDate(e.date), e.category.name, e.description ?? "", round(e.amount), e.paidBy ?? "", e.mode ?? "", e.createdByName ?? ""]),
      };
    },
  },

  salary: {
    key: "salary",
    label: "Salary Report",
    description: "Employee-wise monthly salary: due, paid and pending.",
    async fetch() {
      const rows = await prisma.salaryPayment.findMany({
        include: { employee: true },
        orderBy: [{ month: "desc" }, { employee: { name: "asc" } }],
        take: 1000,
      });
      return {
        columns: ["Month", "Employee", "Role", "Due", "Paid", "Pending", "Status", "Mode", "Paid On"],
        rows: rows.map((r) => [
          r.month, r.employee.name, r.employee.role, round(r.amount), round(r.paidAmount), round(r.amount - r.paidAmount),
          r.status, r.mode ?? "", r.paidAt ? formatDate(r.paidAt) : "",
        ]),
      };
    },
  },

  "company-summary": {
    key: "company-summary",
    label: "Company Monthly Summary",
    description: "Everything the company spent and earned, month by month — expenses, vendor payments, unbilled purchases, salary, and sales/profit — side by side.",
    async fetch() {
      const [expenses, bills, unbilled, salaries, sales] = await Promise.all([
        prisma.expense.findMany({ select: { date: true, amount: true } }),
        prisma.purchaseInvoice.findMany({ select: { invoiceDate: true, paidAmount: true } }),
        prisma.unbilledPurchase.findMany({ select: { date: true, amount: true } }),
        prisma.salaryPayment.findMany({ select: { month: true, paidAmount: true } }),
        prisma.customerInvoice.findMany({ select: { date: true, amount: true, costOfGoods: true } }),
      ]);
      const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const map = new Map<string, { expenses: number; vendorPaid: number; unbilled: number; salary: number; sales: number; cost: number }>();
      const bump = (m: string, field: "expenses" | "vendorPaid" | "unbilled" | "salary" | "sales" | "cost", val: number) => {
        const row = map.get(m) ?? { expenses: 0, vendorPaid: 0, unbilled: 0, salary: 0, sales: 0, cost: 0 };
        row[field] += val;
        map.set(m, row);
      };
      for (const e of expenses) bump(key(e.date), "expenses", e.amount);
      for (const b of bills) bump(key(b.invoiceDate), "vendorPaid", b.paidAmount);
      for (const u of unbilled) bump(key(u.date), "unbilled", u.amount);
      for (const s of salaries) bump(s.month, "salary", s.paidAmount);
      for (const s of sales) { bump(key(s.date), "sales", s.amount); bump(key(s.date), "cost", s.costOfGoods); }

      const months = Array.from(map.keys()).sort().reverse();
      return {
        columns: ["Month", "Expenses", "Vendor Payments", "Unbilled Purchases", "Salary Paid", "Total Outflow", "Sales", "Gross Profit"],
        rows: months.map((m) => {
          const r = map.get(m)!;
          const total = r.expenses + r.vendorPaid + r.unbilled + r.salary;
          const gp = r.sales - r.cost;
          return [m, round(r.expenses), round(r.vendorPaid), round(r.unbilled), round(r.salary), round(total), round(r.sales), round(gp)];
        }),
      };
    },
  },

  "all-expenses": {
    key: "all-expenses",
    label: "All Expenses Report",
    description: "Every rupee that left the company — operational expenses, vendor payments, unbilled/cash purchases and salary paid — in one list.",
    async fetch() {
      const [expenses, bills, unbilled, salaries] = await Promise.all([
        prisma.expense.findMany({ include: { category: true }, orderBy: { date: "desc" } }),
        prisma.purchaseInvoice.findMany({ where: { paidAmount: { gt: 0 } }, include: { vendor: true }, orderBy: { invoiceDate: "desc" } }),
        prisma.unbilledPurchase.findMany({ orderBy: { date: "desc" } }),
        prisma.salaryPayment.findMany({ where: { paidAmount: { gt: 0 } }, include: { employee: true }, orderBy: { paidAt: "desc" } }),
      ]);

      type Row = { date: Date; type: string; party: string; details: string; amount: number; mode: string };
      const all: Row[] = [
        ...expenses.map((e) => ({ date: e.date, type: "Expense", party: e.category.name, details: e.description ?? "", amount: e.amount, mode: e.mode ?? "" })),
        ...bills.map((b) => ({ date: b.invoiceDate, type: "Vendor Payment", party: b.vendor.name, details: b.number, amount: b.paidAmount, mode: "" })),
        ...unbilled.map((u) => ({ date: u.date, type: "Unbilled Purchase", party: u.vendorName, details: u.description ?? "", amount: u.paidAmount || u.amount, mode: u.mode ?? "" })),
        ...salaries.map((s) => ({ date: s.paidAt ?? new Date(), type: "Salary", party: s.employee.name, details: s.month, amount: s.paidAmount, mode: s.mode ?? "" })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

      return {
        columns: ["Date", "Type", "Party", "Details", "Amount", "Mode"],
        rows: all.map((r) => [formatDate(r.date), r.type, r.party, r.details, round(r.amount), r.mode]),
      };
    },
  },

  "gross-profit": {
    key: "gross-profit",
    label: "Gross Profit Report",
    description: "Sales revenue vs cost of goods, month by month — Gross Profit = Sales − Cost.",
    async fetch() {
      const sales = await prisma.customerInvoice.findMany({ select: { date: true, amount: true, costOfGoods: true } });
      const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const map = new Map<string, { revenue: number; cost: number }>();
      for (const s of sales) {
        const row = map.get(key(s.date)) ?? { revenue: 0, cost: 0 };
        row.revenue += s.amount;
        row.cost += s.costOfGoods;
        map.set(key(s.date), row);
      }
      const months = Array.from(map.keys()).sort().reverse();
      return {
        columns: ["Month", "Sales Revenue", "Cost of Goods", "Gross Profit", "Margin %"],
        rows: months.map((m) => {
          const r = map.get(m)!;
          const gp = r.revenue - r.cost;
          const margin = r.revenue > 0 ? (gp / r.revenue) * 100 : 0;
          return [m, round(r.revenue), round(r.cost), round(gp), round(margin)];
        }),
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
