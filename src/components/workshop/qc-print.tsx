"use client";
import {Printer,X} from "lucide-react";
import {DELIVERY_CHECKLIST} from "@/lib/qc-checklists";

function mark(v:any){if(v==='PASS'||v==='OK')return '✓ PASS';if(v==='FAIL'||v==='REPAIR'||v==='NOT_WORKING'||v==='DAMAGE')return '✕ FAIL';if(v==='NA')return 'N/A';return '—'}

export function QCPrint({report:r,company:c,documents:d,onClose}:{report:any;company:any;documents:any;onClose:()=>void}){
  const map=r.checklist||{};
  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/50 p-2 print:static print:bg-white print:p-0" onClick={onClose}><div className="mx-auto max-w-4xl bg-white shadow-2xl print:max-w-none print:shadow-none" onClick={e=>e.stopPropagation()}>
    <div className="flex justify-between p-3 print:hidden"><b>QC Report Preview</b><div className="flex gap-2"><button onClick={()=>window.print()} className="rounded bg-brand-600 px-3 py-1.5 text-xs font-bold text-white"><Printer className="mr-1 inline h-4 w-4"/>Print / Save PDF</button><button onClick={onClose}><X/></button></div></div>
    <div id="qc-print" className="qc-page text-slate-900">
      <Header c={c} title="FINAL DELIVERY QC REPORT" no={r.qcNumber}/>
      <div className="info-grid"><KV k="Job Card" v={r.job.jobNumber}/><KV k="Date / Time" v={new Date(r.createdAt).toLocaleString('en-IN')}/><KV k="Customer" v={r.job.customerName}/><KV k="Mobile" v={r.job.contactNo}/><KV k="Vehicle" v={r.job.vehicleNo}/><KV k="Make / Model" v={[r.job.carBrand,r.job.model].filter(Boolean).join(' ')}/><KV k="VIN / Chassis" v={r.job.vin||r.job.chassisNumber}/><KV k="Mileage" v={r.job.odometer?r.job.odometer+' KM':'—'}/></div>

      {DELIVERY_CHECKLIST.map(s=><div key={s.title} className="qc-block"><div className="qc-title">{s.title}</div><table><thead><tr><th>Check Point</th><th>Status</th><th>Remark</th></tr></thead><tbody>{s.items.map(i=><tr key={i.key}><td>{i.label}</td><td className="status">{mark(map[i.key]?.status)}</td><td>{map[i.key]?.comment||''}</td></tr>)}</tbody></table></div>)}

      <div className="result-box"><div><b>FINAL QC RESULT:</b> {r.overallStatus}</div><div><b>ROAD TEST:</b> {r.roadTest||'—'}</div><div className="wide"><b>Defects / Additional Work:</b> {r.defects||'—'}</div><div className="wide"><b>Remarks:</b> {r.remarks||'—'}</div></div>
      <div className="sign-grid"><div>{r.signature&&<img src={r.signature} alt="QC signature"/>}<div className="sig">Technician / QC: {r.technicianName||r.createdByName||'—'}</div></div><div className="sig right">Authorised By / Delivery Signature</div></div>
      {d?.qcFooter&&<p className="footer">{d.qcFooter}</p>}
    </div>
  </div><style>{`
    #qc-print{font-family:Arial,Helvetica,sans-serif}.qc-page{width:210mm;min-height:297mm;margin:0 auto;padding:10mm 11mm;box-sizing:border-box;background:#fff}.hdr{display:flex;gap:14px;align-items:center;border-bottom:3px solid #173f9f;padding-bottom:9px;margin-bottom:10px}.hdr img{width:58px;height:58px;object-fit:contain}.co{flex:1}.co h1{font-size:20px;color:#173f9f;margin:0 0 4px}.co p{font-size:8.5px;margin:2px 0}.ttl{text-align:right}.ttl b{font-size:15px}.ttl div{font-size:10px;margin-top:4px}.info-grid{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #cbd5e1;margin-bottom:9px}.kv{padding:5px;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;font-size:9px}.kv span{display:block;color:#64748b;font-size:7.5px;text-transform:uppercase}.qc-block{margin-bottom:7px}.qc-title{background:#173f9f;color:#fff;padding:4px 7px;font-size:9.5px;font-weight:800}.qc-block table{width:100%;border-collapse:collapse;font-size:8.5px}.qc-block th,.qc-block td{border:1px solid #cbd5e1;padding:3px 5px}.qc-block th{text-align:left;background:#f8fafc}.qc-block th:nth-child(2),.status{width:74px;text-align:center}.result-box{display:grid;grid-template-columns:1fr 1fr;border:1px solid #cbd5e1;font-size:9px;margin-top:8px}.result-box>div{padding:5px;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1}.result-box .wide{grid-column:1/3}.sign-grid{display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:22px;font-size:9px}.sign-grid img{height:38px;object-fit:contain}.sig{border-top:1px solid #64748b;padding-top:4px}.right{text-align:right}.footer{font-size:7.5px;color:#64748b;border-top:1px solid #e2e8f0;margin-top:10px;padding-top:4px}@page{size:A4;margin:0}@media print{body *{visibility:hidden!important}#qc-print,#qc-print *{visibility:visible!important}#qc-print{position:absolute;left:0;top:0;width:210mm}.print\\:hidden{display:none!important}}
  `}</style></div>
}
function Header({c,title,no}:{c:any;title:string;no:string}){return <div className="hdr"><img src={c.logoDataUrl||'/logo.jpeg'} alt="CMW logo"/><div className="co"><h1>{c.name||'CAPITAL MOTOR WORKS'}</h1><p>{c.address}</p><p>{[c.phone,c.email,c.website].filter(Boolean).join(' · ')}</p></div><div className="ttl"><b>{title}</b><div>{no}</div></div></div>}
function KV({k,v}:{k:string;v:any}){return <div className="kv"><span>{k}</span><b>{v||'—'}</b></div>}
