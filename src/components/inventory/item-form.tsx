"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Masters } from "@/lib/items";

type AnyItem = Record<string, any> | null;

/** Add / edit item form. Used by both /inventory/new and /inventory/[id]/edit. */
export function ItemForm({
  masters,
  item = null,
  mode,
}: {
  masters: Masters;
  item?: AnyItem;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState({
    sku: item?.sku ?? "",
    name: item?.name ?? "",
    partNumber: item?.partNumber ?? "",
    oemNumber: item?.oemNumber ?? "",
    barcode: item?.barcode ?? "",
    description: item?.description ?? "",
    brandId: item?.brandId ?? "",
    categoryId: item?.categoryId ?? "",
    subCategoryId: item?.subCategoryId ?? "",
    modelId: item?.modelId ?? "",
    unitId: item?.unitId ?? "",
    hsnId: item?.hsnId ?? "",
    vendorId: item?.vendorId ?? "",
    warehouseId: item?.warehouseId ?? "",
    rackId: item?.rackId ?? "",
    shelfId: item?.shelfId ?? "",
    binId: item?.binId ?? "",
    openingStock: item?.openingStock ?? 0,
    currentStock: item?.currentStock ?? 0,
    minStock: item?.minStock ?? 0,
    maxStock: item?.maxStock ?? 0,
    reorderLevel: item?.reorderLevel ?? 0,
    purchaseRate: item?.purchaseRate ?? 0,
    sellingRate: item?.sellingRate ?? 0,
    mrp: item?.mrp ?? 0,
    gstRate: item?.gstRate ?? 18,
  });

  const set = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }));

  async function submit() {
    setError(null);
    if (!f.sku || !f.name) {
      setError("SKU and item name are required.");
      return;
    }
    setSaving(true);
    try {
      const url = mode === "create" ? "/api/items" : `/api/items/${item!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      router.push("/inventory");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-ink-muted hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <Button onClick={submit} loading={saving}>
          <Save className="h-4 w-4" /> {mode === "create" ? "Save item" : "Update item"}
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      {/* Basic */}
      <Section title="Basic details">
        <Text label="SKU / Item code *" value={f.sku} onChange={(v) => set("sku", v)} disabled={mode === "edit"} />
        <Text label="Item name *" value={f.name} onChange={(v) => set("name", v)} />
        <Text label="Part number" value={f.partNumber} onChange={(v) => set("partNumber", v)} />
        <Text label="OEM number" value={f.oemNumber} onChange={(v) => set("oemNumber", v)} />
        <Text label="Barcode" value={f.barcode} onChange={(v) => set("barcode", v)} />
        <Text label="Description" value={f.description} onChange={(v) => set("description", v)} />
      </Section>

      {/* Classification */}
      <Section title="Classification">
        <Select label="Brand" value={f.brandId} onChange={(v) => set("brandId", v)} options={masters.brands.map((b) => [b.id, b.name])} />
        <Select label="Category" value={f.categoryId} onChange={(v) => set("categoryId", v)} options={masters.categories.map((c) => [c.id, c.name])} />
        <Select label="Sub category" value={f.subCategoryId} onChange={(v) => set("subCategoryId", v)} options={masters.subCategories.map((s) => [s.id, s.name])} />
        <Select label="Vehicle model" value={f.modelId} onChange={(v) => set("modelId", v)} options={masters.models.map((m) => [m.id, m.oemBrand ? `${m.oemBrand.name} · ${m.name}` : m.name])} />
        <Select label="Unit" value={f.unitId} onChange={(v) => set("unitId", v)} options={masters.units.map((u) => [u.id, u.name])} />
        <Select label="HSN code" value={f.hsnId} onChange={(v) => set("hsnId", v)} options={masters.hsnCodes.map((h) => [h.id, h.code])} />
        <Select label="Preferred vendor" value={f.vendorId} onChange={(v) => set("vendorId", v)} options={masters.vendors.map((v2) => [v2.id, v2.name])} />
      </Section>

      {/* Location */}
      <Section title="Location">
        <Select label="Warehouse" value={f.warehouseId} onChange={(v) => set("warehouseId", v)} options={masters.warehouses.map((w) => [w.id, w.name])} />
        <Select label="Rack" value={f.rackId} onChange={(v) => set("rackId", v)} options={masters.racks.map((r) => [r.id, r.name])} />
        <Select label="Shelf" value={f.shelfId} onChange={(v) => set("shelfId", v)} options={masters.shelves.map((s) => [s.id, s.name])} />
        <Select label="Bin" value={f.binId} onChange={(v) => set("binId", v)} options={masters.bins.map((bn) => [bn.id, bn.name])} />
      </Section>

      {/* Stock & pricing */}
      <Section title="Stock & pricing">
        {mode === "create" && <Num label="Opening stock" value={f.openingStock} onChange={(v) => set("openingStock", v)} />}
        {mode === "edit" && <Num label="Current stock" value={f.currentStock} onChange={(v) => set("currentStock", v)} />}
        <Num label="Reorder level" value={f.reorderLevel} onChange={(v) => set("reorderLevel", v)} />
        <Num label="Min stock" value={f.minStock} onChange={(v) => set("minStock", v)} />
        <Num label="Max stock" value={f.maxStock} onChange={(v) => set("maxStock", v)} />
        <Num label="Purchase rate" value={f.purchaseRate} onChange={(v) => set("purchaseRate", v)} />
        <Num label="Selling rate" value={f.sellingRate} onChange={(v) => set("sellingRate", v)} />
        <Num label="MRP" value={f.mrp} onChange={(v) => set("mrp", v)} />
        <Num label="GST %" value={f.gstRate} onChange={(v) => set("gstRate", v)} />
      </Section>
    </div>
  );
}

/* ---- small field primitives ---- */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <h3 className="mb-4 font-display text-sm font-semibold text-ink dark:text-slate-100">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}
function Text({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      <input
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50 disabled:text-ink-muted dark:border-white/10 dark:bg-white/5"
      />
    </label>
  );
}
function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      <input
        type="number"
        value={value ?? 0}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5"
      />
    </label>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5"
      >
        <option value="">— Select —</option>
        {options.map(([id, name]) => (
          <option key={id} value={id}>{name}</option>
        ))}
      </select>
    </label>
  );
}
