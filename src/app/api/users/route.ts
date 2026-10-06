import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { canSession, ROLE_LABELS, ALL_PERMISSIONS, effectivePermissions } from "@/lib/auth/rbac";
import { hashPassword } from "@/lib/auth/password";
const VALID_ROLES=Object.keys(ROLE_LABELS);
export async function GET(){
 const s=await getSession(); if(!s||!canSession(s,"users.manage"))return NextResponse.json({error:"Unauthorized"},{status:401});
 const users=await prisma.user.findMany({orderBy:{createdAt:"asc"},select:{id:true,name:true,username:true,email:true,role:true,isActive:true,lastLoginAt:true,customPermissions:true}});
 return NextResponse.json({users:users.map(u=>({...u,permissions:effectivePermissions(u.role as any,u.customPermissions),usesCustomPermissions:Array.isArray(u.customPermissions)})),allPermissions:ALL_PERMISSIONS});
}
export async function POST(req:NextRequest){
 const s=await getSession(); if(!s||!canSession(s,"users.manage"))return NextResponse.json({error:"You don't have permission to manage users."},{status:403});
 try{const b=await req.json();if(!b.name?.trim()||!b.username?.trim()||!b.email?.trim()||!b.password)return NextResponse.json({error:"Name, username, email and password are required."},{status:400});
 if(!VALID_ROLES.includes(b.role))return NextResponse.json({error:"Select a valid role."},{status:400});
 const custom=Array.isArray(b.permissions)?b.permissions.filter((p:string)=>ALL_PERMISSIONS.includes(p as any)):undefined;
 const user=await prisma.user.create({data:{name:b.name.trim(),username:b.username.trim().toLowerCase(),email:b.email.trim().toLowerCase(),role:b.role,passwordHash:await hashPassword(String(b.password)),customPermissions:custom},select:{id:true,name:true,username:true,email:true,role:true,isActive:true,customPermissions:true}});
 await prisma.auditLog.create({data:{userId:s.id,action:"CREATE",entity:"User",entityId:user.id,detail:user.username}});return NextResponse.json({user});
 }catch(e:any){if(e?.code==="P2002")return NextResponse.json({error:"That username or email is already taken."},{status:409});return NextResponse.json({error:"Could not create the user."},{status:500})}
}
