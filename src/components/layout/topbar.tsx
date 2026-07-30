"use client";

import { Bell, Moon, Sun, Search, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { ROLE_LABELS, type Role } from "@/lib/auth/rbac";

export function Topbar({ name, role }: { name: string; role: Role }) {
  const { theme, toggle } = useTheme();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-200/70 bg-white/70 px-5 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[rgb(var(--surface))]/70">
      {/* search */}
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white/60 px-3 py-2 dark:border-white/10 dark:bg-white/5">
        <Search className="h-4 w-4 text-ink-muted" />
        <input
          placeholder="Search part no, OEM, item, chassis…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
        />
      </div>

      <button onClick={toggle} aria-label="Toggle theme" className="rounded-lg p-2 text-ink-soft hover:bg-brand-50 dark:hover:bg-white/5">
        {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>

      <button aria-label="Notifications" className="relative rounded-lg p-2 text-ink-soft hover:bg-brand-50 dark:hover:bg-white/5">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
      </button>

      <div className="flex items-center gap-3 border-l border-slate-200 pl-4 dark:border-white/10">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
          {initials}
        </div>
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm font-semibold text-ink dark:text-slate-100">{name}</p>
          <p className="text-[11px] text-ink-muted">{ROLE_LABELS[role]}</p>
        </div>
        <button onClick={logout} aria-label="Sign out" className="rounded-lg p-2 text-ink-soft hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
