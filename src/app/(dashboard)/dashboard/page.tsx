import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { StatCards } from "@/components/dashboard/stat-cards";
import { PurchaseTrend } from "@/components/dashboard/purchase-trend";
import { inr } from "@/lib/utils";

/**
 * Executive Dashboard — live KPIs pulled from the database.
 * Falls back to zeros gracefully before the DB is seeded.
 */
export default async function DashboardPage() {
  const user = await getSession();

  // pull KPIs (all guarded so the page renders even on an empty DB)
  const [items, pendingPOs, unpaid] = await Promise.all([
    prisma.item
      .findMany({ select: { currentStock: true, reorderLevel: true, averageCost: true } })
      .catch(() => [] as { currentStock: number; reorderLevel: number; averageCost: number }[]),
    prisma.purchaseOrder
      .count({ where: { status: { in: ["PENDING_APPROVAL", "APPROVED", "SENT"] } } })
      .catch(() => 0),
    prisma.purchaseInvoice
      .aggregate({ _sum: { grandTotal: true, paidAmount: true }, where: { paymentStatus: { not: "PAID" } } })
      .catch(() => null),
  ]);

  // Column-to-column comparisons (stock vs reorder level) are computed in JS.
  const lowStock = items.filter((i) => i.currentStock > 0 && i.currentStock <= i.reorderLevel).length;
  const outOfStock = items.filter((i) => i.currentStock <= 0).length;
  const inventoryValue = items.reduce((s, i) => s + i.currentStock * (i.averageCost || 0), 0);
  const pendingPayments = (unpaid?._sum.grandTotal || 0) - (unpaid?._sum.paidAmount || 0);

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">
          Welcome back, {user?.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-ink-muted">Here's what's happening across Capital Motor Works today.</p>
      </div>

      <StatCards
        inventoryValue={inr(inventoryValue)}
        totalItems={items.length}
        lowStock={lowStock}
        outOfStock={outOfStock}
        pendingOrders={pendingPOs}
        pendingPayments={inr(Math.max(0, pendingPayments))}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PurchaseTrend />
        </div>
        <QuickPanel />
      </div>
    </div>
  );
}

function QuickPanel() {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Quick actions</h3>
      <div className="mt-4 space-y-2">
        {[
          ["Add inventory item", "/inventory/new"],
          ["Create purchase order", "/purchase/new"],
          ["Record vendor payment", "/accounting/payments/new"],
          ["New workshop entry", "/workshop/new"],
        ].map(([label, href]) => (
          <a key={href} href={href} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-ink-soft transition hover:border-brand-300 hover:bg-brand-50 dark:border-white/10 dark:hover:bg-white/5">
            {label}
            <span className="text-brand-500">→</span>
          </a>
        ))}
      </div>
    </div>
  );
}
