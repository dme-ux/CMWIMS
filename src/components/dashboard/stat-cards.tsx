"use client";

import { motion } from "framer-motion";
import { Boxes, AlertTriangle, PackageX, ClipboardList, Wallet, Layers } from "lucide-react";

interface Props {
  inventoryValue: string;
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  pendingOrders: number;
  pendingPayments: string;
}

export function StatCards(p: Props) {
  const cards = [
    { label: "Inventory value", value: p.inventoryValue, icon: Wallet, tone: "brand" },
    { label: "Total items", value: p.totalItems, icon: Layers, tone: "brand" },
    { label: "Low stock", value: p.lowStock, icon: AlertTriangle, tone: "amber" },
    { label: "Out of stock", value: p.outOfStock, icon: PackageX, tone: "red" },
    { label: "Pending orders", value: p.pendingOrders, icon: ClipboardList, tone: "brand" },
    { label: "Pending payments", value: p.pendingPayments, icon: Boxes, tone: "amber" },
  ];

  const tones: Record<string, string> = {
    brand: "text-brand-600 bg-brand-50 dark:bg-brand-500/10",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
    red: "text-red-600 bg-red-50 dark:bg-red-500/10",
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card transition hover:shadow-glass dark:border-white/10 dark:bg-[rgb(var(--surface))]"
          >
            <div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${tones[c.tone]}`}>
              <Icon className="h-[18px] w-[18px]" />
            </div>
            <p className="text-xs text-ink-muted">{c.label}</p>
            <p className="mt-1 font-display text-xl font-bold text-ink dark:text-slate-100">{c.value}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
