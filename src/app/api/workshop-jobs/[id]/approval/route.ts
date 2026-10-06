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
    const updated=await prisma.workshopJob.update({where:{id},data:{approvalStatus:"PENDING",approvalRequestedAt:new Date(),approvalRequestedBy:s.name,approvalWhatsAppSentAt:b.whatsappSent?new Date():undefined,approvalRemarks:null,approvedAt:null,approvedBy:null}});
    await prisma.auditLog.create({data:{userId:s.id,action:"JOB_APPROVAL_REQUEST",entity:"WorkshopJob",entityId:id,detail:`${job.jobNumber} sent for approval`}}).catch(()=>null);
    return NextResponse.json({job:updated});
  }
  if(!canSession(s,"workshop.approve"))return NextResponse.json({error:"Only an authorised approver can approve/reject job cards."},{status:403});
  if(!["APPROVE","REJECT","REVISION"].includes(action))return NextResponse.json({error:"Invalid approval action."},{status:400});
  const status=action==="APPROVE"?"APPROVED":action==="REJECT"?"REJECTED":"REVISION_REQUIRED";
  const updated=await prisma.workshopJob.update({where:{id},data:{approvalStatus:status,approvedAt:action==="APPROVE"?new Date():null,approvedBy:action==="APPROVE"?(String(b.approvedByName||s.name).trim().slice(0,120)||s.name):null,approvalRemarks:String(b.remarks||"").trim()||null}});
  await prisma.auditLog.create({data:{userId:s.id,action:`JOB_${status}`,entity:"WorkshopJob",entityId:id,detail:`${job.jobNumber} · ${String(b.remarks||"").trim()}`}}).catch(()=>null);
  return NextResponse.json({job:updated});
}
