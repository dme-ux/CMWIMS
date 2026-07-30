"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Trash2 } from "lucide-react";

/** Smart search + status filter. Updates the URL, which re-runs the server query. */
export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const status = params.get("status") ?? "";

  // debounce typing -> URL
  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(Array.from(params.entries()));
      if (q) sp.set("q", q);
      else sp.delete("q");
      router.replace(`/inventory?${sp.toString()}`);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setStatus(v: string) {
    const sp = new URLSearchParams(Array.from(params.entries()));
    if (v) sp.set("status", v);
    else sp.delete("status");
    router.replace(`/inventory?${sp.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
        <Search className="h-4 w-4 text-ink-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by part no, OEM, name, SKU or barcode…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
        />
      </div>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-white/5"
      >
        <option value="">All stock</option>
        <option value="in">In stock</option>
        <option value="low">Low stock</option>
        <option value="out">Out of stock</option>
      </select>
    </div>
  );
}

/** Soft-delete a single item, then refresh the list. */
export function DeleteItemButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`Remove "${name}" from the catalogue?`)) return;
    setBusy(true);
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={remove} disabled={busy} aria-label="Delete" className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
