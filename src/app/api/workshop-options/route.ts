import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";

const DEFAULT_BRANDS = ['Mercedes-Benz','BMW','Audi','Jaguar','Land Rover','Volvo','Porsche','Lexus','Toyota','Honda','Skoda','Jeep','KIA','Hyundai','MG'];
const DEFAULT_SERVICES = ['General Service','Oil Change','AC Service','Body Paint','Coolant Leakage','Brake Service','Transmission Oil Change','Electrical Issue','Air Bag Light','Self Problem','Service And Dry Clean','Rubbing Polishing','Diagnosis / Inspection','Accidental Repair'];
const keyFor=(kind:string)=>kind==='brand'?'workshop_brands':kind==='service'?'workshop_services':'';
const defaults=(kind:string)=>kind==='brand'?DEFAULT_BRANDS:DEFAULT_SERVICES;
async function read(kind:string){const key=keyFor(kind);if(!key)return [];const row=await prisma.setting.findUnique({where:{key}}).catch(()=>null);if(!row)return defaults(kind);try{const x=JSON.parse(row.value);return Array.isArray(x)?x.filter(Boolean):defaults(kind)}catch{return defaults(kind)}}

export async function GET(){const s=await getSession();if(!s)return NextResponse.json({error:'Unauthorized'},{status:401});return NextResponse.json({brands:await read('brand'),services:await read('service')});}
export async function POST(req:NextRequest){const s=await getSession();if(!s||!can(s.role,'workshop.manage'))return NextResponse.json({error:'No permission'},{status:403});const b=await req.json();const kind=String(b.kind||'');const value=String(b.value||'').trim();const key=keyFor(kind);if(!key||!value)return NextResponse.json({error:'Type and value are required.'},{status:400});const arr=await read(kind);if(!arr.some((x:string)=>x.toLowerCase()===value.toLowerCase()))arr.push(value);arr.sort((a:string,b:string)=>a.localeCompare(b));await prisma.setting.upsert({where:{key},create:{key,value:JSON.stringify(arr)},update:{value:JSON.stringify(arr)}});await prisma.auditLog.create({data:{userId:s.id,action:'MASTER_ADD',entity:'WorkshopOption',detail:`${kind}: ${value}`}}).catch(()=>null);return NextResponse.json({values:arr});}
export async function DELETE(req:NextRequest){const s=await getSession();if(!s||!can(s.role,'workshop.manage'))return NextResponse.json({error:'No permission'},{status:403});const b=await req.json();const kind=String(b.kind||'');const value=String(b.value||'').trim();const key=keyFor(kind);if(!key||!value)return NextResponse.json({error:'Type and value are required.'},{status:400});const arr=(await read(kind)).filter((x:string)=>x!==value);await prisma.setting.upsert({where:{key},create:{key,value:JSON.stringify(arr)},update:{value:JSON.stringify(arr)}});return NextResponse.json({values:arr});}
