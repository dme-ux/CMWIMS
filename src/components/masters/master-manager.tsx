"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MASTER_TYPES, MASTER_ORDER } from "@/lib/master-config";

type Row = Record<string, any>;

export function MasterManager() {
  const [type, setType] = useState(MASTER_ORDER[0]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const cfg = MASTER_TYPES[type];

  const load = useCallback(async (t: string) => {
    setLoading(true); setError(null);
    try { const res = await fetch(`/api/masters/${t}`); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Could not load."); setRows(data.rows); }
    catch (e: any) { setError(e.message); setRows([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(type); }, [type, load]);

  async function save(values: Row) {
    setError(null); const isEdit = !!values.id;
    const res = await fetch(`/api/masters/${type}`, { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const data = await res.json(); if (!res.ok) { setError(data.error || "Could not save."); return; }
    setEditing(null); load(type);
  }
  async function remove(row: Row) {
    if (!confirm("Delete this record?")) return;
    const res = await fetch(`/api/masters/${type}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id }) });
    const data = await res.json(); if (!res.ok) { setError(data.error || "Could not delete."); return; } load(type);
  }

  return <div className="space-y-4">
    <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-xs text-brand-800">For physical stock setup use <b>Warehouse → Rack → Shelf → Bin</b>. Create them in this order.</div>
    <div className="flex flex-wrap gap-2">{MASTER_ORDER.map((t)=><button key={t} onClick={()=>{setType(t);setEditing(null);}} className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${t===type?"bg-brand-600 text-white shadow-glass":"border border-slate-200 text-ink-soft hover:bg-brand-50 dark:border-white/10 dark:hover:bg-white/5"}`}>{MASTER_TYPES[t].label}</button>)}</div>
    {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}
    <div className="rounded-2xl border border-slate-200/70 bg-white shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-white/5"><h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">{cfg.label}</h3><Button onClick={()=>setEditing({})} className="px-3 py-2"><Plus className="h-4 w-4"/> Add</Button></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted dark:bg-white/5"><tr>{cfg.columns.map((c)=><th key={c} className="px-5 py-2.5">{cfg.fields.find((f)=>f.key===c)?.label ?? friendly(c)}</th>)}<th className="px-5 py-2.5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/5">
        {loading && <tr><td colSpan={cfg.columns.length+1} className="px-5 py-10 text-center text-ink-muted">Loading…</td></tr>}
        {!loading && rows.length===0 && <tr><td colSpan={cfg.columns.length+1} className="px-5 py-10 text-center text-ink-muted">No records yet. Click “Add”.</td></tr>}
        {!loading && rows.map((r)=><tr key={r.id} className="hover:bg-brand-50/40 dark:hover:bg-white/5">{cfg.columns.map((c)=><td key={c} className="px-5 py-3 text-ink-soft dark:text-slate-300">{String(r[c] ?? "—")}</td>)}<td className="px-5 py-3"><div className="flex items-center justify-end gap-1"><button onClick={()=>setEditing(r)} aria-label="Edit" className="rounded-lg p-1.5 text-ink-muted hover:bg-brand-50 hover:text-brand-600"><Pencil className="h-4 w-4"/></button><button onClick={()=>remove(r)} aria-label="Delete" className="rounded-lg p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4"/></button></div></td></tr>)}
      </tbody></table></div>
    </div>
    {editing!==null && <MasterFormModal type={type} initial={editing} onClose={()=>setEditing(null)} onSave={save}/>} 
  </div>;
}

function friendly(v:string){return v.replace(/Name$/,"").replace(/([A-Z])/g," $1").replace(/^./,(c)=>c.toUpperCase());}

function MasterFormModal({type,initial,onClose,onSave}:{type:string;initial:Row;onClose:()=>void;onSave:(v:Row)=>Promise<void>}){
  const cfg=MASTER_TYPES[type]; const [values,setValues]=useState<Row>({...initial}); const [saving,setSaving]=useState(false); const [err,setErr]=useState<string|null>(null); const [options,setOptions]=useState<Record<string,Row[]>>({});
  useEffect(()=>{
    const sources=[...new Set(cfg.fields.map((f)=>f.optionsFrom).filter(Boolean) as string[])];
    Promise.all(sources.map(async(s)=>{const res=await fetch(`/api/masters/${s}`);const data=await res.json();return [s,res.ok?data.rows:[]] as const;})).then((pairs)=>setOptions(Object.fromEntries(pairs)));
  },[type]);
  async function submit(){for(const f of cfg.fields){if(f.required&&!String(values[f.key]??"").trim()){setErr(`${f.label} is required.`);return;}}setSaving(true);await onSave(values);setSaving(false);}
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-glass-lg dark:bg-[rgb(var(--surface))]" onClick={(e)=>e.stopPropagation()}>
    <div className="mb-4 flex items-center justify-between"><h3 className="font-display text-base font-semibold text-ink dark:text-slate-100">{initial.id?"Edit":"Add"} {cfg.label.replace(/s$/,"")}</h3><button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-4 w-4"/></button></div>
    {err&&<p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
    <div className="space-y-3">{cfg.fields.map((f)=><label key={f.key} className="block"><span className="mb-1 block text-xs font-medium text-ink-muted">{f.label}{f.required?" *":""}</span>{f.type==="select"?<select value={values[f.key]??""} onChange={(e)=>setValues((v)=>({...v,[f.key]:e.target.value}))} className={cls}><option value="">— Select —</option>{(options[f.optionsFrom||""]||[]).map((o)=><option key={o.id} value={o.id}>{optionLabel(f.optionsFrom||"",o)}</option>)}</select>:<input type={f.type==="number"?"number":"text"} value={values[f.key]??""} onChange={(e)=>setValues((v)=>({...v,[f.key]:e.target.value}))} className={cls}/>}</label>)}</div>
    <div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-slate-100 dark:hover:bg-white/5">Cancel</button><Button onClick={submit} loading={saving}><Save className="h-4 w-4"/> Save</Button></div>
  </div></div>;
}
function optionLabel(type:string,o:Row){if(type==="rack")return `${o.name}${o.warehouseName?` · ${o.warehouseName}`:""}`;if(type==="shelf")return `${o.name}${o.rackName?` · ${o.rackName}`:""}`;return o.name||o.code||o.id;}
const cls="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-white/5";
