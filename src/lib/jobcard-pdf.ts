"use client";

import { jsPDF } from "jspdf";
import type { PrintJob } from "@/components/workshop/jobcard-print";
import { RECEIVING_CHECKLIST } from "@/lib/qc-checklists";

const BLUE: [number, number, number] = [23, 63, 159];
const BORDER: [number, number, number] = [203, 213, 225];
const LIGHT: [number, number, number] = [248, 250, 252];
const TEXT: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [100, 116, 139];

function statusLabel(v?: string) {
  const m: Record<string, string> = {
    OK: "OK / Working", NOT_WORKING: "Not Working", DAMAGE: "Issue / Damage", NA: "N/A", NOT_CHECKED: "-",
    PASS: "Pass", FAIL: "Fail", ADVISORY: "Advisory", REPAIR: "Repair Required",
  };
  return m[v || ""] || v || "-";
}

async function imageAsDataUrl(src?: string): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith("data:image/")) return src;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || "") || null);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function safe(v: any) { return v === null || v === undefined || v === "" ? "-" : String(v); }

export async function generateOriginalJobCardPdf(job: PrintJob, company: any, documents: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const left = 11, right = 199, width = right - left;
  const received = new Date(job.receivedAt);

  const text = (value: any, x: number, y: number, size = 8, bold = false, opts: any = {}) => {
    doc.setTextColor(...TEXT); doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size);
    doc.text(safe(value), x, y, opts);
  };
  const line = (x1:number,y1:number,x2:number,y2:number) => { doc.setDrawColor(...BORDER); doc.line(x1,y1,x2,y2); };
  const section = (title:string, y:number) => {
    doc.setFillColor(...BLUE); doc.rect(left,y,width,7,"F"); doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.text(title.toUpperCase(),left+2.5,y+4.8); return y+7;
  };

  const logo = await imageAsDataUrl(company?.logoDataUrl || "/logo.jpeg");
  const contacts = [company?.phone, company?.email, company?.website, company?.gstin ? `GSTIN: ${company.gstin}` : ""].filter(Boolean).join("  ·  ");

  // Draw a dynamic-height header so long company addresses/contact lines never overlap or get clipped.
  const drawHeader = (title = "JOB CARD") => {
    if (logo) {
      try { doc.addImage(logo, logo.includes("image/png") ? "PNG" : "JPEG", left, 10, 16, 16, undefined, "FAST"); } catch {}
    }
    doc.setTextColor(...BLUE); doc.setFont("helvetica","bold"); doc.setFontSize(18);
    doc.text(company?.name || "Capital Motor Works", left+20, 16);

    doc.setTextColor(...TEXT); doc.setFont("helvetica","normal"); doc.setFontSize(6.4);
    const addressLines = doc.splitTextToSize(safe(company?.address), 124);
    doc.text(addressLines, left+20, 21, { lineHeightFactor: 1.08 });
    const addressBottom = 21 + Math.max(0, addressLines.length - 1) * 2.9;

    const contactLines = doc.splitTextToSize(contacts, 124);
    const contactY = addressBottom + 3.4;
    doc.text(contactLines, left+20, contactY, { lineHeightFactor: 1.08 });
    const contactBottom = contactY + Math.max(0, contactLines.length - 1) * 2.9;

    doc.setFont("helvetica","bold"); doc.setFontSize(title === "JOB CARD" ? 12 : 10);
    doc.text(title, right, 16, {align:"right"});
    doc.setFont("helvetica","normal"); doc.setFontSize(8);
    doc.text(job.jobNumber, right, 22, {align:"right"});

    const headerBottom = Math.max(30, contactBottom + 4.5);
    doc.setDrawColor(...BLUE); doc.setLineWidth(0.8); doc.line(left, headerBottom, right, headerBottom);
    return headerBottom;
  };

  const headerBottom = drawHeader();

  // Meta row
  let y = headerBottom + 3;
  const metaH = 15, metaW = [75,57,56];
  doc.setDrawColor(...BORDER); doc.rect(left,y,width,metaH);
  let mx = left;
  const metas = [["JOB CARD NO.",job.jobNumber],["DATE",received.toLocaleDateString("en-IN")],["TIME IN",received.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})]];
  metas.forEach((m,i)=>{ if(i) line(mx,y,mx,y+metaH); doc.setTextColor(...MUTED); doc.setFontSize(5.7); doc.setFont("helvetica","normal"); doc.text(m[0],mx+2.5,y+4); text(m[1],mx+2.5,y+10.5,8,true); mx += metaW[i]; });
  y += metaH + 3;

  const table4 = (rows: [string,any,string,any][], startY:number) => {
    const rowH = 7.2, col=[34,61,34,59]; let yy=startY;
    rows.forEach(r=>{
      let x=left; doc.setDrawColor(...BORDER); doc.rect(left,yy,width,rowH);
      for(let i=1;i<4;i++){x += col[i-1]; line(x,yy,x,yy+rowH);}
      doc.setFillColor(...LIGHT); doc.rect(left,yy,col[0],rowH,"F"); doc.rect(left+col[0]+col[1],yy,col[2],rowH,"F");
      text(r[0],left+2,yy+4.7,6.1,true); text(r[1],left+col[0]+2,yy+4.7,6.3,false);
      text(r[2],left+col[0]+col[1]+2,yy+4.7,6.1,true); text(r[3],left+col[0]+col[1]+col[2]+2,yy+4.7,6.3,false);
      yy += rowH;
    }); return yy;
  };

  y = section("1. Customer & Vehicle Details", y);
  y = table4([
    ["Customer Name",job.customerName,"Vehicle No.",job.vehicleNo],
    ["Mobile",job.contactNo,"Brand / Model",[job.carBrand,job.model,job.variant].filter(Boolean).join(" ")],
    ["Mileage (KM)",job.odometer,"Chassis Number",job.chassisNumber],
    ["Email",job.emailId,"Status",job.status],
  ],y); y+=3;

  y = section("2. Vehicle Condition / Working Check", y);
  const items = RECEIVING_CHECKLIST.flatMap(s=>s.items);
  const half = Math.ceil(items.length/2), rowH=7.1;
  const maxRows = Math.max(half, items.length-half);
  for(let i=0;i<maxRows;i++){
    const a=items[i], b=items[i+half];
    doc.setDrawColor(...BORDER); doc.rect(left,y,width,rowH);
    line(left+94,y,left+94,y+rowH);
    const drawCheck=(it:any,x:number)=>{if(!it)return; const v=(job.receivingChecklist||{})[it.key]||{}; text(it.label,x+2,y+4.5,6,false); text(statusLabel(v.status),x+91,y+4.5,5.7,true,{align:"right"});};
    drawCheck(a,left); drawCheck(b,left+94); y+=rowH;
  }
  y+=3;

  y = section("3. Accessories / Fuel / Documents", y);
  y = table4([
    ["Fuel",`${job.fuelType||"-"} · ${job.fuelReading||"-"}`,"Insurance",job.insuranceStatus],
    ["Head Rest",job.headRest,"Perfume / Accessory",job.perfume],
    ["Jack Set",job.jackSet,"Tool Kit",job.toolKit],
    ["Spare Wheel",job.spareWheel,"Floor Mats",job.floorMats],
    ["RC Book",job.rcBook,"Speaker Present",job.speaker],
  ],y); y+=3;

  y = section("4. Service Requested", y);
  y = table4([["Service Type",job.serviceType,"Job Status",job.status]],y);
  const wideRow=(label:string,value:any)=>{const h=Math.max(8,4+doc.splitTextToSize(safe(value),148).length*4);doc.setDrawColor(...BORDER);doc.rect(left,y,width,h);doc.setFillColor(...LIGHT);doc.rect(left,y,42,h,"F");line(left+42,y,left+42,y+h);text(label,left+2,y+5,6.1,true);doc.setFontSize(6.3);doc.setFont("helvetica","normal");doc.setTextColor(...TEXT);doc.text(doc.splitTextToSize(safe(value),142),left+44,y+4.5);y+=h;};
  wideRow("Complaint / Work Required",job.complaint); wideRow("Additional Request",job.additionalRequests);

  if (job.parts?.length && y < 240) {
    y+=3; y=section("Parts Issued",y);
    const shown=job.parts.filter(p=>p.quantity-p.returnedQty>0).slice(0,6);
    shown.forEach(p=>{doc.setDrawColor(...BORDER);doc.rect(left,y,width,6.5);text(p.item.name,left+2,y+4.3,5.8);text(p.item.partNumber||p.item.sku,left+112,y+4.3,5.8);text(String(p.quantity-p.returnedQty),right-3,y+4.3,5.8,true,{align:"right"});y+=6.5;});
  }

  const sigY = Math.max(y+14,267);
  doc.setDrawColor(...MUTED); line(left,sigY,left+65,sigY); line(right-65,sigY,right,sigY);
  text("Customer Signature",left,sigY+4,6.5); text("Advisor / Executive Signature",right,sigY+4,6.5,false,{align:"right"});
  doc.setTextColor(...MUTED); doc.setFontSize(5.6); doc.text("Vehicle received subject to the Terms & Conditions printed on Page 2.",105,286,{align:"center"});

  // Terms page exactly as the preview's Page 2 concept.
  doc.addPage();
  const termsHeaderBottom = drawHeader("JOB CARD - TERMS & CONDITIONS");
  doc.setFont("helvetica","bold");doc.setFontSize(13);doc.text("Terms & Conditions",105,termsHeaderBottom+13,{align:"center"});
  const fallback = "Pickup and delivery of the vehicle, when arranged at the customer request, shall be at the customer risk. Capital Motor Works shall not be responsible for loss, damage, accident, theft or delay during pickup or delivery, except to the extent required by applicable law.";
  const terms=String(documents?.jobCardTerms||fallback).split(/\n+/).map((x:string)=>x.replace(/^\s*\d+[.)]\s*/,"").trim()).filter(Boolean);
  if(!terms.some((t:string)=>/pickup|delivery.*risk/i.test(t)))terms.push(fallback);
  let ty=termsHeaderBottom+24; doc.setFont("helvetica","normal");doc.setFontSize(8.5);
  terms.forEach((term:string,i:number)=>{const lines=doc.splitTextToSize(`${i+1}. ${term}`,174); if(ty+lines.length*4.5>260){doc.addPage();ty=18;} doc.text(lines,left+4,ty);ty+=lines.length*4.5+3;});
  const sy=276;line(left,sy,left+70,sy);line(right-70,sy,right,sy);text("Customer Signature",left,sy+4,7);text(`For ${company?.name||"Capital Motor Works"}`,right,sy+4,7,false,{align:"right"});

  const blob = doc.output("blob");
  const filename = `${job.jobNumber}.pdf`;
  return { doc, blob, file: new File([blob], filename, {type:"application/pdf"}), filename };
}
