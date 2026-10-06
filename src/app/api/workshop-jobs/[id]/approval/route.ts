import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getSession} from "@/lib/auth/session";
import {canSession} from "@/lib/auth/rbac";

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params; const s=await getSession(); if(!s)return NextResponse.json({error:"Unauthorized"},{status:401});
  const b=await req.json(); const action=String(b.action||"").toUpperCase();
  const job=await prisma.workshopJob.findUnique({where:{id}}); if(!job)return NextResponse.json({error:"Job card not found."},{status:404});
  if(action==="REQUEST"){
    if(!(canSession(s,"workshop.create")||canSession(s,"workshop.edit")||canSession(s,"workshop.approve")))return NextResponse.json({error:"No permission to request approval."},{status:403});
    const updated=await prisma.workshopJob.update({where:{id},data:{approvalStatus:"PENDING",approvalRequestedAt:new Date(),approvalRequestedBy:s.name,approvalWhatsAppSentAt:b.whatsappSent?new Date():undefined,approvalRemarks:null,approvedAt:null,approvedBy:null,approvalSource:b.whatsappSent?"WHATSAPP_CUSTOMER":"REQUEST",approvalCustomerPhone:String(b.customerPhone||job.contactNo||"").replace(/\D/g,"").slice(0,20)||null}});
    await prisma.auditLog.create({data:{userId:s.id,action:"JOB_APPROVAL_REQUEST",entity:"WorkshopJob",entityId:id,detail:`${job.jobNumber} sent for approval`}}).catch(()=>null);
    return NextResponse.json({job:updated});
  }
  if(!["MANUAL_APPROVE","REJECT","REVISION"].includes(action))return NextResponse.json({error:"Invalid approval action."},{status:400});
  const advisorCanRecord=canSession(s,"workshop.edit")||canSession(s,"workshop.approve");
  if(!advisorCanRecord)return NextResponse.json({error:"Only an authorised advisor/admin can record customer approval or correction."},{status:403});
  const status=action==="MANUAL_APPROVE"?"APPROVED":action==="REJECT"?"REJECTED":"REVISION_REQUIRED";
  const customerPhone=String(b.customerPhone||job.contactNo||"").replace(/\D/g,"").slice(0,20)||null;
  const updated=await prisma.workshopJob.update({where:{id},data:{approvalStatus:status,approvedAt:action==="MANUAL_APPROVE"?new Date():null,approvedBy:action==="MANUAL_APPROVE"?s.name:null,approvalRemarks:String(b.remarks||"").trim()||null,approvalSource:action==="MANUAL_APPROVE"?"MANUAL_ADVISOR":status==="REVISION_REQUIRED"?"CUSTOMER_CORRECTION":null,approvalCustomerPhone:customerPhone}});
  await prisma.auditLog.create({data:{userId:s.id,action:`JOB_${status}`,entity:"WorkshopJob",entityId:id,detail:`${job.jobNumber} · ${String(b.remarks||"").trim()}`}}).catch(()=>null);
  return NextResponse.json({job:updated});
}
