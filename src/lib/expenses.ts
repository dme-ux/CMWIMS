// ============================================================================
//  Expense data helpers — day-to-day operational spend (food, electricity,
//  fuel, rent, tools etc.) — separate from vendor purchase bills.
// ============================================================================
import { prisma } from "@/lib/prisma";

export type ExpenseFilters = {
  q?: string;
  categoryId?: string;
  from?: string; // yyyy-mm-dd
  to?: string;   // yyyy-mm-dd
};

function dateRange(from?: string, to?: string) {
  const where: any = {};
  if (from) where.gte = new Date(from + "T00:00:00");
  if (to) where.lte = new Date(to + "T23:59:59");
  return Object.keys(where).length ? where : undefined;
}

export async function listExpenses(filters: ExpenseFilters = {}) {
  const where: any = {};
  if (filters.categoryId) where.categoryId = filters.categoryId;
  const range = dateRange(filters.from, filters.to);
  if (range) where.date = range;
  if (filters.q) {
    where.OR = [
      { description: { contains: filters.q, mode: "insensitive" } },
      { paidBy: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  return prisma.expense.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
    take: 500,
  });
}

export async function getExpenseCategories() {
  return prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });
}

export async function getExpenseSummary() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayAgg, monthAgg, monthRows] = await Promise.all([
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: today } } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: monthStart } } }),
    prisma.expense.findMany({
      where: { date: { gte: monthStart } },
      include: { category: true },
    }),
  ]);

  const byCategory = new Map<string, number>();
  for (const e of monthRows) {
    const key = e.category.name;
    byCategory.set(key, (byCategory.get(key) || 0) + e.amount);
  }

  // last 8 weeks trend
  const weekBuckets: { label: string; start: Date; end: Date; total: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(today);
    const day = d.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diffToMonday - i * 7);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    weekBuckets.push({
      label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      start: d,
      end,
      total: 0,
    });
  }
  const trendRows = await prisma.expense.findMany({
    where: { date: { gte: weekBuckets[0].start } },
    select: { date: true, amount: true },
  });
  for (const r of trendRows) {
    for (const w of weekBuckets) {
      if (r.date >= w.start && r.date <= w.end) {
        w.total += r.amount;
        break;
      }
    }
  }

  return {
    today: todayAgg._sum.amount || 0,
    month: monthAgg._sum.amount || 0,
    byCategory: Array.from(byCategory.entries()).map(([name, total]) => ({ name, total })),
    trend: weekBuckets.map((w) => ({ label: w.label, total: w.total })),
  };
}
