"use client";
import {Printer} from "lucide-react";
import {Button} from "@/components/ui/button";
import {inr,formatDate} from "@/lib/utils";

export function POPrintButton({po}:{po:any}){
  function printPO(){window.print()}
  return <><Button variant="outline" onClick={printPO}><Printer className="h-4 w-4"/>Print / Save PDF</Button><div id="po-print" className="hidden print:block">
    <div className="po-page">
      <div className="po-hdr"><img src="/logo.jpeg" alt="CMW logo"/><div className="po-co"><h1>CAPITAL MOTOR WORKS</h1><p>Metro Pillar Number 342, 9B, Mehrauli-Gurgaon Rd, Sultanpur, New Delhi</p><p>Purchase Order</p></div><div className="po-no"><b>{po.number}</b><div>{formatDate(po.orderDate)}</div></div></div>
      <div className="po-info"><div><span>Vendor</span><b>{po.vendor.name}</b><small>{po.vendor.address||''}</small><small>{[po.vendor.phone,po.vendor.email].filter(Boolean).join(' · ')}</small></div><div><span>Status</span><b>{po.status}</b><span>Expected Date</span><b>{po.expectedDate?formatDate(po.expectedDate):'—'}</b></div></div>
      <table><thead><tr><th>#</th><th>Item / Part</th><th>SKU</th><th>Qty</th><th>Rate</th><th>GST</th><th>Amount</th></tr></thead><tbody>{po.items.map((x:any,i:number)=><tr key={x.id}><td>{i+1}</td><td>{x.item.name}</td><td>{x.item.sku}</td><td>{x.quantity}</td><td>{inr(x.rate)}</td><td>{x.gstRate}%</td><td>{inr(x.amount)}</td></tr>)}</tbody></table>
      <div className="po-total"><div><span>Sub Total</span><b>{inr(po.subTotal)}</b></div><div><span>GST</span><b>{inr(po.taxTotal)}</b></div><div className="grand"><span>Grand Total</span><b>{inr(po.grandTotal)}</b></div></div>
      {po.notes&&<div className="po-notes"><b>Notes:</b> {po.notes}</div>}
      <div className="po-sign"><div>Prepared By<br/><b>{po.createdBy?.name||'—'}</b></div><div>Approved By<br/><b>{po.approvedBy?.name||'—'}</b></div><div>For Capital Motor Works</div></div>
    </div>
  </div><style>{`
    @media print{body *{visibility:hidden!important}#po-print,#po-print *{visibility:visible!important}#po-print{display:block!important;position:absolute;left:0;top:0;width:210mm}.po-page{width:210mm;min-height:297mm;padding:11mm;box-sizing:border-box;font-family:Arial;color:#111827}.po-hdr{display:flex;align-items:center;gap:14px;border-bottom:3px solid #173f9f;padding-bottom:10px}.po-hdr img{width:58px;height:58px;object-fit:contain}.po-co{flex:1}.po-co h1{font-size:21px;color:#173f9f;margin:0 0 4px}.po-co p{font-size:9px;margin:2px 0}.po-no{text-align:right;font-size:11px}.po-no b{font-size:16px}.po-info{display:grid;grid-template-columns:2fr 1fr;border:1px solid #cbd5e1;margin:12px 0}.po-info>div{padding:8px;border-right:1px solid #cbd5e1}.po-info span,.po-info small{display:block;font-size:8px;color:#64748b}.po-info b{display:block;font-size:11px;margin:2px 0 6px}.po-page table{width:100%;border-collapse:collapse;font-size:9px}.po-page th,.po-page td{border:1px solid #cbd5e1;padding:5px}.po-page th{background:#f8fafc;text-align:left}.po-page th:nth-last-child(-n+4),.po-page td:nth-last-child(-n+4){text-align:right}.po-total{width:72mm;margin:10px 0 0 auto;font-size:9px}.po-total>div{display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid #cbd5e1}.po-total .grand{font-size:11px}.po-notes{margin-top:14px;border:1px solid #cbd5e1;padding:7px;font-size:9px}.po-sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:35px;margin-top:45px;font-size:9px}.po-sign>div{border-top:1px solid #64748b;padding-top:5px;text-align:center}@page{size:A4;margin:0}}
  `}</style></>
}
