import { prisma } from "@/lib/prisma";
export const WORKSHOP_STATUSES=["RECEIVED","IN_PROGRESS","WAITING_PARTS","READY","DELIVERED","CANCELLED"] as const;
export async function generateJobNumber(receivedAt=new Date()){
 const y=receivedAt.getMonth()>=3?receivedAt.getFullYear():receivedAt.getFullYear()-1; const fy=`${y}/${String(y+1).slice(-2)}`;
 const prefix=`CMW-${fy}-`; const count=await prisma.workshopJob.count({where:{jobNumber:{startsWith:prefix}}});
 let n=count+1; while(await prisma.workshopJob.findUnique({where:{jobNumber:prefix+String(n).padStart(4,'0')}})) n++;
 return prefix+String(n).padStart(4,'0');
}
export async function getJobs(){return prisma.workshopJob.findMany({include:{customer:true,vehicle:true,parts:{include:{item:true},orderBy:{issuedAt:'desc'}}},orderBy:{receivedAt:'desc'},take:300});}
export async function getWorkshopCustomers(){return prisma.customer.findMany({where:{isActive:true},orderBy:{name:'asc'},select:{id:true,name:true,phone:true,email:true,vehicles:true}});}
export function jobStatusMeta(status:string):[string,string]{const m:Record<string,[string,string]>={RECEIVED:["Received","bg-slate-100 text-slate-600"],IN_PROGRESS:["In progress","bg-brand-50 text-brand-700"],WAITING_PARTS:["Waiting parts","bg-amber-50 text-amber-700"],READY:["Ready","bg-cyan-50 text-cyan-700"],DELIVERED:["Delivered","bg-emerald-50 text-emerald-700"],CANCELLED:["Cancelled","bg-red-50 text-red-700"]};return m[status]??[status,"bg-slate-100 text-slate-600"]}
