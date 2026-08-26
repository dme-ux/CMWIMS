"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpFromLine, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

type LocationStock={id:string;quantity:number;reservedQty:number;warehouse:{name:string};rack:{name:string}|null;shelf:{name:string}|null;bin:{name:string}|null};
type Item={id:string;name:string;sku:string;currentStock:number;reservedStock:number;locationStocks:LocationStock[]};
type Reason={value:string;label:string};
type Customer={id:string;name:string;code:string;phone:string|null};
type Vehicle={id:string;registration:string|null;chassisNumber:string|null;brand:string|null;modelName:string|null;customerId:string|null};
type Job={id:string;jobNumber:string;customerId:string|null;vehicleId:string|null;customerName:string|null;vehicleNo:string|null;carBrand:string|null;model:string|null};

export function IssueForm({items,reasons,customers,vehicles,jobs}:{items:Item[];reasons:Reason[];customers:Customer[];vehicles:Vehicle[];jobs:Job[]}){
  const router=useRouter();
  const [itemId,setItemId]=useState(""); const [locationStockId,setLocationStockId]=useState(""); const [reason,setReason]=useState(reasons[0]?.value??""); const [quantity,setQuantity]=useState(1);
  const [issueAgainst,setIssueAgainst]=useState("JOB"); const [customerId,setCustomerId]=useState(""); const [vehicleId,setVehicleId]=useState(""); const [workshopJobId,setWorkshopJobId]=useState(""); const [party,setParty]=useState(""); const [reference,setReference]=useState(""); const [note,setNote]=useState("");
  const [busy,setBusy]=useState(false); const [msg,setMsg]=useState<{ok:boolean;text:string}|null>(null);
  const item=useMemo(()=>items.find((i)=>i.id===itemId),[itemId,items]); const source=useMemo(()=>item?.locationStocks.find((l)=>l.id===locationStockId),[item,locationStockId]); const sourceAvailable=source?Math.max(0,source.quantity-source.reservedQty):0;

  function pickJob(id:string){setWorkshopJobId(id);const j=jobs.find((x)=>x.id===id);if(j){setCustomerId(j.customerId||"");setVehicleId(j.vehicleId||"");setReference(j.jobNumber);}}
  async function submit(){setMsg(null);if(!itemId)return setMsg({ok:false,text:"Select an item."});if(!locationStockId)return setMsg({ok:false,text:"Select exact source location."});if(quantity<=0)return setMsg({ok:false,text:"Enter a valid quantity."});
    setBusy(true);try{const res=await fetch("/api/stock/issue",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({itemId,locationStockId,reason,quantity,issueAgainst,customerId:customerId||null,vehicleId:vehicleId||null,workshopJobId:workshopJobId||null,party,reference,note})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Could not issue.");setMsg({ok:true,text:`Issued successfully. Total stock: ${data.newStock} · Source location: ${data.locationQty}.`});setQuantity(1);setParty("");setReference("");setNote("");setWorkshopJobId("");setCustomerId("");setVehicleId("");router.refresh();}catch(e:any){setMsg({ok:false,text:e.message});}finally{setBusy(false);}}

  return <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-white/10 dark:bg-[rgb(var(--surface))]">
    <div className="mb-4"><h3 className="font-display text-sm font-semibold text-ink dark:text-slate-100">Issue material from exact location</h3><p className="mt-1 text-xs text-ink-muted">Link every outward entry to a Job Card, Vehicle, Customer or other purpose for complete traceability.</p></div>
    {msg&&<p className={`mb-3 rounded-lg px-3 py-2 text-sm ${msg.ok?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-600"}`}>{msg.text}</p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <F label="Item" span><select value={itemId} onChange={(e)=>{setItemId(e.target.value);setLocationStockId("");}} className={inputCls}><option value="">— Select item —</option>{items.map((i)=><option key={i.id} value={i.id}>{i.name} ({i.sku}) · {i.currentStock} total</option>)}</select></F>
      <F label="Source location" span><select value={locationStockId} onChange={(e)=>setLocationStockId(e.target.value)} className={inputCls} disabled={!item}><option value="">— Select exact location —</option>{(item?.locationStocks||[]).map((l)=>{const label=[l.warehouse.name,l.rack?.name,l.shelf?.name,l.bin?.name].filter(Boolean).join(" · ");const a=Math.max(0,l.quantity-l.reservedQty);return <option key={l.id} value={l.id}>{label} · Available {a}</option>;})}</select>{item&&item.locationStocks.length===0&&<span className="mt-1 flex items-center gap-1 text-xs text-amber-600"><MapPin className="h-3 w-3"/> No location stock yet. Receive/assign stock through Inward first.</span>}</F>
      <F label="Reason"><select value={reason} onChange={(e)=>setReason(e.target.value)} className={inputCls}>{reasons.map((r)=><option key={r.value} value={r.value}>{r.label}</option>)}</select></F>
      <F label={`Quantity ${source?`(max ${sourceAvailable})`:""}`}><input type="number" min={0.001} step="any" max={sourceAvailable||undefined} value={quantity} onChange={(e)=>setQuantity(Number(e.target.value))} className={inputCls}/></F>
      <F label="Issue against"><select value={issueAgainst} onChange={(e)=>setIssueAgainst(e.target.value)} className={inputCls}><option value="JOB">Job Card</option><option value="VEHICLE">Vehicle</option><option value="CUSTOMER">Customer</option><option value="OTHER">Other / Internal</option></select></F>
      {issueAgainst==="JOB"&&<F label="Job Card"><select value={workshopJobId} onChange={(e)=>pickJob(e.target.value)} className={inputCls}><option value="">— Select job —</option>{jobs.map((j)=><option key={j.id} value={j.id}>{j.jobNumber} · {j.vehicleNo||j.customerName||"Workshop"}</option>)}</select></F>}
      {(issueAgainst==="CUSTOMER"||issueAgainst==="JOB")&&<F label="Customer"><select value={customerId} onChange={(e)=>setCustomerId(e.target.value)} className={inputCls}><option value="">— Optional —</option>{customers.map((c)=><option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}</select></F>}
      {(issueAgainst==="VEHICLE"||issueAgainst==="JOB")&&<F label="Vehicle"><select value={vehicleId} onChange={(e)=>setVehicleId(e.target.value)} className={inputCls}><option value="">— Optional —</option>{vehicles.map((v)=><option key={v.id} value={v.id}>{v.registration||v.chassisNumber||v.id} · {[v.brand,v.modelName].filter(Boolean).join(" ")}</option>)}</select></F>}
      <F label="Issued to / Party"><input value={party} onChange={(e)=>setParty(e.target.value)} placeholder="Person / department / vendor" className={inputCls}/></F>
      <F label="Reference"><input value={reference} onChange={(e)=>setReference(e.target.value)} placeholder="Job card / invoice / gate pass" className={inputCls}/></F>
      <F label="Note"><input value={note} onChange={(e)=>setNote(e.target.value)} className={inputCls}/></F>
    </div><div className="mt-4 flex justify-end"><Button onClick={submit} loading={busy}><ArrowUpFromLine className="h-4 w-4"/> Issue material</Button></div>
  </div>;
}
const inputCls="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200 disabled:opacity-50 dark:border-white/10 dark:bg-white/5";
function F({label,span,children}:{label:string;span?:boolean;children:React.ReactNode}){return <label className={`block ${span?"lg:col-span-2":""}`}><span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>{children}</label>;}
