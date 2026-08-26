import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { ISSUE_REASONS } from "@/lib/outward";
const num=(v:unknown)=>(v===""||v==null?0:Number(v)||0); const clean=(v:unknown)=>(typeof v==="string"&&v.trim()?v.trim():null);

export async function POST(req:NextRequest){
  const session=await getSession();if(!session||!can(session.role,"inventory.manage"))return NextResponse.json({error:"You don't have permission to issue material."},{status:403});
  try{
    const b=await req.json();const reason=ISSUE_REASONS.find((r)=>r.value===b.reason);if(!reason)return NextResponse.json({error:"Select a valid reason."},{status:400});if(!b.itemId)return NextResponse.json({error:"Select an item."},{status:400});if(!b.locationStockId)return NextResponse.json({error:"Select the exact stock location."},{status:400});const qty=num(b.quantity);if(qty<=0)return NextResponse.json({error:"Enter a quantity greater than zero."},{status:400});
    const [item,source]=await Promise.all([prisma.item.findUnique({where:{id:b.itemId}}),prisma.itemLocationStock.findUnique({where:{id:b.locationStockId}})]);if(!item)return NextResponse.json({error:"Item not found."},{status:404});if(!source||source.itemId!==item.id)return NextResponse.json({error:"Selected stock location is invalid."},{status:400});
    const availableAtLocation=Math.max(0,source.quantity-source.reservedQty);if(qty>availableAtLocation+0.000001)return NextResponse.json({error:`Only ${availableAtLocation} available at selected location.`},{status:400});if(qty>item.currentStock+0.000001)return NextResponse.json({error:`Only ${item.currentStock} total stock available.`},{status:400});
    const customerId=clean(b.customerId),vehicleId=clean(b.vehicleId),workshopJobId=clean(b.workshopJobId);
    if(customerId&&!await prisma.customer.findUnique({where:{id:customerId},select:{id:true}}))return NextResponse.json({error:"Selected customer was not found."},{status:400});if(vehicleId&&!await prisma.vehicle.findUnique({where:{id:vehicleId},select:{id:true}}))return NextResponse.json({error:"Selected vehicle was not found."},{status:400});if(workshopJobId&&!await prisma.workshopJob.findUnique({where:{id:workshopJobId},select:{id:true}}))return NextResponse.json({error:"Selected job card was not found."},{status:400});
    const oldStock=item.currentStock,newStock=Math.max(0,oldStock-qty),locationQty=Math.max(0,source.quantity-qty);const party=clean(b.party);const reasonText=party?`${reason.label} · ${party}`:reason.label;
    await prisma.$transaction([
      prisma.itemLocationStock.update({where:{id:source.id},data:{quantity:locationQty}}),
      prisma.item.update({where:{id:item.id},data:{currentStock:newStock}}),
      prisma.stockMovement.create({data:{itemId:item.id,type:reason.type as any,quantity:-qty,oldStock,newStock,rate:item.averageCost,reference:clean(b.reference),reason:reasonText,warehouseId:source.warehouseId,rackId:source.rackId,shelfId:source.shelfId,binId:source.binId,locationNote:clean(b.note),customerId,vehicleId,workshopJobId,userId:session.id}}),
      prisma.auditLog.create({data:{userId:session.id,action:"STOCK_ISSUE",entity:"Item",entityId:item.id,detail:`${item.sku} · Qty ${qty}`}}),
    ]);
    return NextResponse.json({ok:true,newStock,locationQty});
  }catch(e:any){return NextResponse.json({error:e?.message||"Could not issue material."},{status:400});}
}
