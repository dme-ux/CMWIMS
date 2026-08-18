"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Search, MapPin, Car, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Masters } from "@/lib/items";

type AnyItem = Record<string, any> | null;

type Compatibility = { vehicleModelId: string; variant?: string; engineCode?: string; fuelType?: string; yearFrom?: number | string; yearTo?: number | string; note?: string };
type CrossRef = { code: string; type?: string; brand?: string; note?: string };

export function ItemForm({ masters, item = null, mode }: { masters: Masters; item?: AnyItem; mode: "create" | "edit" }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState("");
  const [crossRefText, setCrossRefText] = useState<string>(
    (item?.crossReferences || []).map((r: any) => String(r.code || "")).join("\n")
  );
  const initialCompat: Compatibility[] = (item?.compatibilities || []).map((c: any) => ({
    vehicleModelId: c.vehicleModelId,
    variant: c.variant || "",
    engineCode: c.engineCode || "",
    fuelType: c.fuelType || "",
    yearFrom: c.yearFrom || "",
    yearTo: c.yearTo || "",
    note: c.note || "",
  }));
  const [compatibilities, setCompatibilities] = useState<Compatibility[]>(initialCompat);

  const [f, setF] = useState({
    sku: item?.sku ?? "", name: item?.name ?? "", partNumber: item?.partNumber ?? "", oemNumber: item?.oemNumber ?? "",
    barcode: item?.barcode ?? "", description: item?.description ?? "", brandId: item?.brandId ?? "", categoryId: item?.categoryId ?? "",
    subCategoryId: item?.subCategoryId ?? "", unitId: item?.unitId ?? "", hsnId: item?.hsnId ?? "", vendorId: item?.vendorId ?? "",
    warehouseId: item?.warehouseId ?? "", rackId: item?.rackId ?? "", shelfId: item?.shelfId ?? "", binId: item?.binId ?? "",
    openingStock: item?.openingStock ?? 0, currentStock: item?.currentStock ?? 0,
    minStock: item?.minStock ?? 0, maxStock: item?.maxStock ?? 0, reorderLevel: item?.reorderLevel ?? 0,
    purchaseRate: item?.purchaseRate ?? 0, sellingRate: item?.sellingRate ?? 0, mrp: item?.mrp ?? 0, gstRate: item?.gstRate ?? 18,
  });

  const set = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }));

  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    return masters.models.filter((m) => {
      const label = `${m.oemBrand?.name || ""} ${m.name}`.toLowerCase();
      return !q || label.includes(q);
    });
  }, [masters.models, modelSearch]);

  const racks = masters.racks.filter((r: any) => !f.warehouseId || r.warehouseId === f.warehouseId);
  const shelves = masters.shelves.filter((s: any) => !f.rackId || s.rackId === f.rackId);
  const bins = masters.bins.filter((b: any) => !f.shelfId || b.shelfId === f.shelfId);

  function toggleModel(id: string) {
    setCompatibilities((prev) => prev.some((c) => c.vehicleModelId === id)
      ? prev.filter((c) => c.vehicleModelId !== id)
      : [...prev, { vehicleModelId: id }]);
  }

  function parseCrossRefs(): CrossRef[] {
    return crossRefText.split(/[\n,]+/).map((x: string) => x.trim()).filter(Boolean).map((code: string) => ({ code, type: "ALTERNATE" }));
  }

  async function submit() {
    setError(null);
    if (!f.sku.trim() || !f.name.trim()) return setError("SKU and item name are required.");
    if (mode === "create" && Number(f.openingStock) > 0 && !f.warehouseId) return setError("Opening stock ke liye warehouse select karein.");
    setSaving(true);
    try {
      const url = mode === "create" ? "/api/items" : `/api/items/${item!.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, crossReferences: parseCrossRefs(), compatibilities }),
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
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-ink-muted hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> Back</button>
        <Button onClick={submit} loading={saving}><Save className="h-4 w-4" /> {mode === "create" ? "Save item" : "Update item"}</Button>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      <Section title="Basic Part Details" icon={<Hash className="h-4 w-4" />}>
        <Text label="SKU / Item code *" value={f.sku} onChange={(v) => set("sku", v)} disabled={mode === "edit"} />
        <Text label="Item name *" value={f.name} onChange={(v) => set("name", v)} />
        <Text label="Part number" value={f.partNumber} onChange={(v) => set("partNumber", v)} />
        <Text label="OEM number" value={f.oemNumber} onChange={(v) => set("oemNumber", v)} />
        <Text label="Barcode" value={f.barcode} onChange={(v) => set("barcode", v)} />
        <Text label="Description" value={f.description} onChange={(v) => set("description", v)} />
      </Section>

      <Section title="Cross Reference / Alternate Part Numbers" icon={<Search className="h-4 w-4" />}>
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className="mb-1 block text-xs font-medium text-ink-muted">One number per line (OEM / Bosch / Brembo / Textar / superseded / alternate)</span>
          <textarea value={crossRefText} onChange={(e) => setCrossRefText(e.target.value)} rows={4} placeholder={'34116878876\nP06087\n098649xxxx'} className={fieldClass} />
          <span className="mt-1 block text-[11px] text-ink-muted">Inventory search in sab numbers se part find karega.</span>
        </label>
      </Section>

      <Section title="Classification">
        <Select label="Part Brand" value={f.brandId} onChange={(v) => set("brandId", v)} options={masters.brands.map((b) => [b.id, b.name])} />
        <Select label="Category" value={f.categoryId} onChange={(v) => set("categoryId", v)} options={masters.categories.map((c) => [c.id, c.name])} />
        <Select label="Sub category" value={f.subCategoryId} onChange={(v) => set("subCategoryId", v)} options={masters.subCategories.map((s) => [s.id, s.name])} />
        <Select label="Unit" value={f.unitId} onChange={(v) => set("unitId", v)} options={masters.units.map((u) => [u.id, u.name])} />
        <Select label="HSN code" value={f.hsnId} onChange={(v) => set("hsnId", v)} options={masters.hsnCodes.map((h) => [h.id, h.code])} />
        <Select label="Preferred vendor" value={f.vendorId} onChange={(v) => set("vendorId", v)} options={masters.vendors.map((v) => [v.id, v.name])} />
      </Section>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
        <div className="mb-4 flex items-center gap-2"><Car className="h-4 w-4 text-brand-600" /><h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Compatible Vehicles</h3></div>
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 px-3 dark:border-white/10"><Search className="h-4 w-4 text-ink-muted" /><input value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="Search BMW, Mercedes, Audi, model..." className="w-full bg-transparent py-2.5 text-sm outline-none" /></div>
        <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((m) => {
            const checked = compatibilities.some((c) => c.vehicleModelId === m.id);
            return <label key={m.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${checked ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 dark:border-white/10"}`}>
              <input type="checkbox" checked={checked} onChange={() => toggleModel(m.id)} />
              <span>{m.oemBrand ? `${m.oemBrand.name} · ` : ""}{m.name}</span>
            </label>;
          })}
        </div>
        <p className="mt-3 text-xs text-ink-muted">Selected: {compatibilities.length}. Detailed variant/year/engine mapping Phase 1B/vehicle master se extend hoga.</p>
      </div>

      {mode === "create" ? (
        <Section title="Opening Stock Location" icon={<MapPin className="h-4 w-4" />}>
          <Select label="Warehouse" value={f.warehouseId} onChange={(v) => { set("warehouseId", v); set("rackId", ""); set("shelfId", ""); set("binId", ""); }} options={masters.warehouses.map((w) => [w.id, w.name])} />
          <Select label="Rack" value={f.rackId} onChange={(v) => { set("rackId", v); set("shelfId", ""); set("binId", ""); }} options={racks.map((r: any) => [r.id, r.name])} />
          <Select label="Shelf" value={f.shelfId} onChange={(v) => { set("shelfId", v); set("binId", ""); }} options={shelves.map((s: any) => [s.id, s.name])} />
          <Select label="Bin" value={f.binId} onChange={(v) => set("binId", v)} options={bins.map((b: any) => [b.id, b.name])} />
          <Num label="Opening stock" value={f.openingStock} onChange={(v) => set("openingStock", v)} />
        </Section>
      ) : (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">Current stock: <b>{f.currentStock}</b>. Stock edit yahan intentionally disabled hai. Phase 2 mein proper Stock Adjustment + reason + audit workflow aayega.</div>
      )}

      <Section title="Stock Rules & Pricing">
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

const fieldClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5";
function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]"><div className="mb-4 flex items-center gap-2">{icon}<h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">{title}</h3></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div></div>;
}
function Text({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span><input value={value ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`${fieldClass} disabled:bg-slate-50 disabled:text-ink-muted`} /></label>;
}
function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span><input type="number" value={value ?? 0} onChange={(e) => onChange(e.target.value)} className={fieldClass} /></label>;
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span><select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={fieldClass}><option value="">— Select —</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>;
}
