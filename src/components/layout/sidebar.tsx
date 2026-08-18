"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Boxes, Database, ArrowDownToLine, ArrowUpFromLine,
  ShoppingCart, Wallet, Wrench, Ticket, BarChart3, FileText, Settings, ChevronRight, Users, CarFront,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can, type Permission, type Role } from "@/lib/auth/rbac";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  perm: Permission;
}

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, perm: "dashboard.view" },
  { label: "Masters", href: "/masters", icon: Database, perm: "masters.manage" },
  { label: "Inventory", href: "/inventory", icon: Boxes, perm: "inventory.view" },
  { label: "Inward", href: "/inward", icon: ArrowDownToLine, perm: "purchase.manage" },
  { label: "Outward", href: "/outward", icon: ArrowUpFromLine, perm: "inventory.manage" },
  { label: "Purchase", href: "/purchase", icon: ShoppingCart, perm: "purchase.view" },
  { label: "Accounting", href: "/accounting", icon: Wallet, perm: "accounts.view" },
  { label: "Customers", href: "/customers", icon: Users, perm: "workshop.view" },
  { label: "Vehicles", href: "/vehicles", icon: CarFront, perm: "workshop.view" },
  { label: "Workshop", href: "/workshop", icon: Wrench, perm: "workshop.view" },
  { label: "Gate Pass", href: "/gate-pass", icon: Ticket, perm: "workshop.view" },
  { label: "Reports", href: "/reports", icon: BarChart3, perm: "reports.view" },
  { label: "Audit Log", href: "/audit", icon: FileText, perm: "settings.manage" },
  { label: "Settings", href: "/settings", icon: Settings, perm: "settings.manage" },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => can(role, n.perm));

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[rgb(var(--surface))]/80 lg:flex">
      <div className="flex items-center gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-white/10">
        <Image src="/logo.jpeg" alt="CMW" width={40} height={40} className="rounded-lg" />
        <div className="leading-tight">
          <p className="font-display text-sm font-bold text-brand-700 dark:text-brand-200">CMW ERP</p>
          <p className="text-[11px] text-ink-muted">Capital Motor Works</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block">
              <motion.div
                whileHover={{ x: 3 }}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-600 text-white shadow-glass"
                    : "text-ink-soft hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-white/5"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="h-4 w-4 opacity-80" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/70 px-5 py-3 text-[11px] text-ink-muted dark:border-white/10">
        Powered by <span className="font-semibold text-brand-600">SystemMaster</span>
      </div>
    </aside>
  );
}
