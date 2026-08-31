import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { WORKSHOP_STATUSES } from "@/lib/workshop";
const str=(v:unknown)=>typeof v==='string'&&v.trim()?v.trim():null;
const num=(v:unknown)=>v===''||v==null?null:Number(v)||null;
function dt(date:any,time:any){if(!date)return undefined;const t=typeof time==='string'&&time?time:'00:00';const d=new Date(`${date}T${t}:00+05:30`);return isNaN(d.getTime())?undefined:d}

export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const{id}=await params;const s=await getSession();if(!s||!can(s.role,'workshop.manage'))return NextResponse.json({error:'No permission'},{status:403});
 const b=await req.json();const old=await prisma.workshopJob.findUnique({where:{id},include:{customer:true,vehicle:true}});if(!old)return NextResponse.json({error:'Job card not found.'},{status:404});
 const data:any={};
 if(b.status){if(!(WORKSHOP_STATUSES as readonly string[]).includes(b.status))return NextResponse.json({error:'Invalid status.'},{status:400});data.status=b.status;}
 if(b.remark?.trim()){const stamp=new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});data.remarks=[old.remarks,`${stamp}: ${b.remark.trim()}`].filter(Boolean).join(' | ')}
 if(b.mode==='EDIT'){
   if(!String(b.customerName||'').trim()||!String(b.contactNo||'').trim()||!String(b.vehicleNo||'').trim()||!String(b.carBrand||'').trim()||!String(b.serviceType||'').trim())return NextResponse.json({error:'Customer, mobile, registration, brand and service type are required.'},{status:400});
   Object.assign(data,{customerName:String(b.customerName).trim(),contactNo:String(b.contactNo).trim(),emailId:str(b.emailId),vehicleNo:String(b.vehicleNo).trim().toUpperCase(),carBrand:str(b.carBrand),model:str(b.model),variant:str(b.variant),vin:null,chassisNumber:str(b.chassisNumber),engineNumber:str(b.engineNumber),odometer:num(b.odometer),serviceType:str(b.serviceType),complaint:str(b.complaint)||str(b.serviceType),additionalRequests:str(b.additionalRequests),estimate:null,receivingChecklist:(b.receivingChecklist&&typeof b.receivingChecklist==='object')?b.receivingChecklist:old.receivingChecklist,fuelType:str(b.fuelType),fuelReading:str(b.fuelReading),headRest:str(b.headRest),perfume:str(b.perfume),speaker:str(b.speaker),jackSet:str(b.jackSet),toolKit:str(b.toolKit),spareWheel:str(b.spareWheel),floorMats:str(b.floorMats),rcBook:str(b.rcBook),insuranceStatus:str(b.insuranceStatus),insuranceCompany:str(b.insuranceCompany),insuranceExpiry:b.insuranceExpiry?new Date(`${b.insuranceExpiry}T00:00:00+05:30`):null});
   const ra=dt(b.jobDate,b.inTime);if(ra)data.receivedAt=ra;if(b.inTime)data.inTime=str(b.inTime);
   if(old.customerId)await prisma.customer.update({where:{id:old.customerId},data:{name:data.customerName,phone:data.contactNo,email:data.emailId,address:str(b.address)}}).catch(()=>null);
   if(old.vehicleId)await prisma.vehicle.update({where:{id:old.vehicleId},data:{registration:data.vehicleNo,vin:null,chassisNumber:data.chassisNumber,engineNumber:data.engineNumber,brand:data.carBrand,modelName:data.model,variant:data.variant,fuelType:data.fuelType,lastOdometer:data.odometer}}).catch(()=>null);
 }
 const job=await prisma.workshopJob.update({where:{id},data});
 await prisma.auditLog.create({data:{userId:s.id,action:b.mode==='EDIT'?'JOB_EDIT':'JOB_UPDATE',entity:'WorkshopJob',entityId:id,detail:`${old.jobNumber}${b.status?` -> ${b.status}`:''}${b.remark?` · ${b.remark}`:''}`}}).catch(()=>null);
 return NextResponse.json({job});
}
