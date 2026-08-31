"use client";

import { Printer, X } from "lucide-react";
import { RECEIVING_CHECKLIST } from "@/lib/qc-checklists";

export type PrintJob = {
  jobNumber:string; receivedAt:string; status:string; customerName:string|null; contactNo:string|null; emailId:string|null;
  vehicleNo:string|null; carBrand:string|null; model:string|null; variant?:string|null; vin?:string|null; chassisNumber:string|null;
  engineNumber:string|null; odometer:number|null; serviceType:string|null; additionalRequests:string|null; complaint:string|null;
  estimate?:number|null; receivingChecklist?:any; fuelType:string|null; fuelReading:string|null; headRest:string|null; perfume:string|null;
  speaker:string|null; jackSet:string|null; toolKit:string|null; spareWheel:string|null; floorMats:string|null; rcBook:string|null;
  insuranceStatus:string|null; insuranceCompany:string|null; insuranceExpiry:string|null; remarks:string|null; custSignature:string|null;
  advisorSignature:string|null; parts:{id:string;quantity:number;returnedQty:number;rate:number;locationLabel:string|null;item:{sku:string;name:string;partNumber:string|null}}[]
};

function displayStatus(v?: string) {
  const m: Record<string,string> = {
    OK:"✓ OK / Working", NOT_WORKING:"✕ Not Working", DAMAGE:"Issue / Damage", NA:"N/A", NOT_CHECKED:"—",
    PASS:"✓ Pass", FAIL:"✕ Fail", ADVISORY:"Advisory", REPAIR:"Repair Required"
  };
  return m[v || ""] || v || "—";
}

export function JobCardPrint({job:j,company:c,documents:d,onClose}:{job:PrintJob;company:any;documents:any;onClose:()=>void}) {
  const terms = String(d?.jobCardTerms || "")
    .split(/\n+/).map((x:string)=>x.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean);
  const checks = j.receivingChecklist || {};
  const received = new Date(j.receivedAt);

  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/50 p-2 print:static print:bg-white print:p-0" onClick={onClose}>
    <div className="mx-auto max-w-4xl bg-white shadow-2xl print:max-w-none print:shadow-none" onClick={e=>e.stopPropagation()}>
      <div className="flex justify-between p-3 print:hidden">
        <b>Job Card Preview</b>
        <div className="flex gap-2">
          <button onClick={()=>window.print()} className="rounded bg-brand-600 px-3 py-1.5 text-xs font-bold text-white"><Printer className="mr-1 inline h-4 w-4"/>Print / Save PDF</button>
          <button onClick={onClose}><X/></button>
        </div>
      </div>

      <div id="jobcard-print" className="text-slate-900">
        <section className="job-page page-one">
          <Header c={c} title="JOB CARD" no={j.jobNumber}/>

          <div className="job-meta">
            <Meta k="Job Card No." v={j.jobNumber}/><Meta k="Date" v={received.toLocaleDateString("en-IN")}/><Meta k="Time In" v={received.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}/>
          </div>

          <Block title="1. Customer & Vehicle Details">
            <table className="compact-table"><tbody>
              <TR a="Customer Name" b={j.customerName} c="Vehicle No." d={j.vehicleNo}/>
              <TR a="Mobile" b={j.contactNo} c="Brand / Model" d={[j.carBrand,j.model,j.variant].filter(Boolean).join(" ")}/>
              <TR a="Mileage (KM)" b={j.odometer || "—"} c="Chassis Number" d={j.chassisNumber || "—"}/>
              <TR a="Email" b={j.emailId || "—"} c="Status" d={j.status}/>
            </tbody></table>
          </Block>

          <Block title="2. Vehicle Condition / Working Check">
            <div className="check-grid">
              {RECEIVING_CHECKLIST.flatMap(s=>s.items).map(i=>{
                const v=checks[i.key]||{};
                return <div className="check-row" key={i.key}><span>{i.label}</span><b>{displayStatus(v.status)}</b>{v.comment&&<small>{v.comment}</small>}</div>
              })}
            </div>
          </Block>

          <Block title="3. Accessories / Fuel / Documents">
            <table className="compact-table"><tbody>
              <TR a="Fuel" b={`${j.fuelType||"—"} · ${j.fuelReading||"—"}`} c="Insurance" d={j.insuranceStatus||"—"}/>
              <TR a="Head Rest" b={j.headRest} c="Perfume / Accessory" d={j.perfume}/>
              <TR a="Jack Set" b={j.jackSet} c="Tool Kit" d={j.toolKit}/>
              <TR a="Spare Wheel" b={j.spareWheel} c="Floor Mats" d={j.floorMats}/>
              <TR a="RC Book" b={j.rcBook} c="Speaker Present" d={j.speaker}/>
            </tbody></table>
          </Block>

          <Block title="4. Service Requested">
            <table className="compact-table"><tbody>
              <TR a="Service Type" b={j.serviceType} c="Job Status" d={j.status}/>
              <tr><TH>Complaint / Work Required</TH><TD colSpan={3}>{j.complaint||"—"}</TD></tr>
              <tr><TH>Additional Request</TH><TD colSpan={3}>{j.additionalRequests||"—"}</TD></tr>
            </tbody></table>
          </Block>

          {j.parts?.length>0 && <Block title="Parts Issued">
            <table className="parts-table"><thead><tr><th>Part</th><th>Part No.</th><th>Net Qty</th></tr></thead><tbody>
              {j.parts.slice(0,6).map(p=><tr key={p.id}><td>{p.item.name}</td><td>{p.item.partNumber||p.item.sku}</td><td>{p.quantity-p.returnedQty}</td></tr>)}
            </tbody></table>
          </Block>}

          <div className="signature-grid">
            <div>{j.custSignature&&<img src={j.custSignature} alt="Customer signature"/>}<div className="sig-line">Customer Signature</div></div>
            <div>{j.advisorSignature&&<img src={j.advisorSignature} alt="Advisor signature"/>}<div className="sig-line right">Advisor / Executive Signature</div></div>
          </div>
          <div className="footer-note">Vehicle received subject to the Terms & Conditions printed on Page 2.</div>
        </section>

        <section className="job-page terms-page">
          <Header c={c} title="JOB CARD - TERMS & CONDITIONS" no={j.jobNumber}/>
          <h2>Terms & Conditions</h2>
          <ol>{terms.length ? terms.map((t:string,i:number)=><li key={i}>{t}</li>) : <li>Terms & Conditions are configurable from ERP Settings.</li>}</ol>
          <div className="terms-signatures"><div className="sig-line">Customer Signature</div><div className="sig-line right">For {c.name||"Capital Motor Works"}</div></div>
        </section>
      </div>
    </div>

    <style>{`
      #jobcard-print{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#111827}
      .job-page{width:210mm;min-height:297mm;margin:0 auto;padding:10mm 11mm;box-sizing:border-box;background:#fff;position:relative}
      .page-one{height:297mm;overflow:hidden}
      .terms-page{break-before:page;page-break-before:always}
      .doc-header{display:flex;align-items:center;gap:14px;border-bottom:3px solid #1e3a8a;padding-bottom:9px;margin-bottom:10px}
      .doc-header img{width:58px;height:58px;object-fit:contain}.doc-company{flex:1}.doc-company h1{font-size:21px;line-height:1;margin:0 0 5px;color:#173f9f;font-weight:800}.doc-company p{font-size:9px;margin:2px 0}.doc-title{text-align:right}.doc-title b{font-size:16px}.doc-title div{font-size:11px;margin-top:4px}
      .job-meta{display:grid;grid-template-columns:1.3fr 1fr 1fr;border:1px solid #cbd5e1;margin-bottom:9px}.meta{padding:6px 8px;border-right:1px solid #cbd5e1}.meta:last-child{border:0}.meta span{display:block;font-size:8px;text-transform:uppercase;color:#64748b}.meta b{font-size:11px}
      .block{margin-bottom:8px}.block-title{background:#173f9f;color:white;font-size:10px;font-weight:800;text-transform:uppercase;padding:5px 8px;letter-spacing:.2px}
      .compact-table{width:100%;border-collapse:collapse;font-size:9px}.compact-table th,.compact-table td{border:1px solid #cbd5e1;padding:4px 6px;vertical-align:top}.compact-table th{background:#f8fafc;text-align:left;font-weight:700;width:18%}.compact-table td{width:32%}
      .check-grid{display:grid;grid-template-columns:1fr 1fr;border-left:1px solid #cbd5e1;border-top:1px solid #cbd5e1}.check-row{display:grid;grid-template-columns:1fr 92px;gap:4px;align-items:center;min-height:24px;padding:3px 5px;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;font-size:8.5px}.check-row b{text-align:center;font-size:8px}.check-row small{grid-column:1/3;color:#475569;font-size:7.5px}
      .parts-table{width:100%;border-collapse:collapse;font-size:8px}.parts-table th,.parts-table td{border:1px solid #cbd5e1;padding:3px 5px}.parts-table th{background:#f8fafc;text-align:left}
      .signature-grid{display:grid;grid-template-columns:1fr 1fr;gap:45px;margin-top:18px}.signature-grid img{height:38px;max-width:150px;object-fit:contain}.signature-grid>div:nth-child(2) img{margin-left:auto;display:block}.sig-line{border-top:1px solid #64748b;padding-top:4px;font-size:9px}.sig-line.right{text-align:right}.footer-note{text-align:center;color:#64748b;font-size:7.5px;margin-top:8px}
      .terms-page h2{text-align:center;font-size:17px;margin:18px 0}.terms-page ol{font-size:10.5px;line-height:1.6;padding-left:24px}.terms-page li{margin-bottom:7px}.terms-signatures{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:55px}
      @page{size:A4;margin:0}
      @media print{body *{visibility:hidden!important}#jobcard-print,#jobcard-print *{visibility:visible!important}#jobcard-print{position:absolute;left:0;top:0;width:210mm}.job-page{margin:0;box-shadow:none}.print\\:hidden{display:none!important}}
    `}</style>
  </div>
}

function Header({c,title,no}:{c:any;title:string;no:string}){return <div className="doc-header"><img src={c.logoDataUrl||"/logo.jpeg"} alt="CMW logo"/><div className="doc-company"><h1>{c.name||"CAPITAL MOTOR WORKS"}</h1><p>{c.address}</p><p>{[c.phone,c.email,c.website,c.gstin&&`GSTIN: ${c.gstin}`].filter(Boolean).join(" · ")}</p></div><div className="doc-title"><b>{title}</b><div>{no}</div></div></div>}
function Block({title,children}:{title:string;children:React.ReactNode}){return <div className="block"><div className="block-title">{title}</div>{children}</div>}
function Meta({k,v}:{k:string;v:any}){return <div className="meta"><span>{k}</span><b>{v||"—"}</b></div>}
function TH({children}:{children:React.ReactNode}){return <th>{children}</th>}
function TD({children,colSpan}:{children:React.ReactNode;colSpan?:number}){return <td colSpan={colSpan}>{children||"—"}</td>}
function TR({a,b,c,d}:{a:string;b:any;c:string;d:any}){return <tr><TH>{a}</TH><TD>{b}</TD><TH>{c}</TH><TD>{d}</TD></tr>}
