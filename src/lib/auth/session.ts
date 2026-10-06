import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Permission, Role } from "./rbac";
import { effectivePermissions } from "./rbac";
import { prisma } from "@/lib/prisma";

const COOKIE = "cmw_token";
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "change-me-in-production");

export interface SessionUser {
  id:string; name:string; username:string; role:Role; email:string;
  permissions?: Permission[] | null;
}

export async function signToken(user: SessionUser, remember=false) {
  const { permissions: _permissions, ...payload } = user;
  return new SignJWT({ ...payload }).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime(remember?"30d":"1d").sign(secret());
}
export async function verifyToken(token:string):Promise<SessionUser|null>{try{const{payload}=await jwtVerify(token,secret());return payload as unknown as SessionUser}catch{return null}}

// Re-read role + custom permissions on every request so admin changes take effect immediately.
export async function getSession():Promise<SessionUser|null>{
  const store=await cookies(); const token=store.get(COOKIE)?.value; if(!token)return null;
  const base=await verifyToken(token); if(!base)return null;
  try{
    const dbUser=await prisma.user.findUnique({where:{id:base.id},select:{id:true,name:true,username:true,email:true,role:true,isActive:true,customPermissions:true}});
    if(!dbUser?.isActive)return null;
    return {id:dbUser.id,name:dbUser.name,username:dbUser.username,email:dbUser.email,role:dbUser.role as Role,permissions:effectivePermissions(dbUser.role as Role,dbUser.customPermissions)};
  }catch{return base}
}
export async function setSessionCookie(token:string,remember:boolean){const s=await cookies();s.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:remember?60*60*24*30:60*60*24})}
export async function clearSessionCookie(){const s=await cookies();s.set(COOKIE,"",{path:"/",maxAge:0})}
export const AUTH_COOKIE=COOKIE;
