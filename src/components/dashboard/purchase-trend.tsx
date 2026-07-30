"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/** Monthly purchase vs issue trend. Wire to /api/reports/trend for live data. */
const DATA = [
  { m: "Jan", purchase: 420000, issue: 310000 },
  { m: "Feb", purchase: 380000, issue: 350000 },
  { m: "Mar", purchase: 510000, issue: 420000 },
  { m: "Apr", purchase: 470000, issue: 390000 },
  { m: "May", purchase: 620000, issue: 480000 },
  { m: "Jun", purchase: 580000, issue: 520000 },
];

export function PurchaseTrend() {
  return (
    <div className="h-full rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Purchase vs Issue</h3>
        <span className="text-xs text-ink-muted">Last 6 months</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={DATA} margin={{ left: -10, right: 8 }}>
          <defs>
            <linearGradient id="gPurchase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gIssue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip
            formatter={(v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v)}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Area type="monotone" dataKey="purchase" stroke="#2563eb" strokeWidth={2} fill="url(#gPurchase)" />
          <Area type="monotone" dataKey="issue" stroke="#60a5fa" strokeWidth={2} fill="url(#gIssue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
