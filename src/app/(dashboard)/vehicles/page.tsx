import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { getCustomers, getVehicles } from "@/lib/customer-vehicle";
import { VehiclesClient } from "@/components/vehicles/vehicles-client";
export const dynamic="force-dynamic";
export default async function VehiclesPage(){const s=await getSession();if(!s||!can(s.role,"workshop.view"))redirect('/dashboard');const [v,c]=await Promise.all([getVehicles(),getCustomers()]);return <VehiclesClient initial={v.map((x:any)=>({...x,createdAt:x.createdAt.toISOString(),updatedAt:x.updatedAt.toISOString()}))} customers={c.map((x:any)=>({id:x.id,name:x.name,phone:x.phone}))} canManage={can(s.role,"workshop.manage")}/>}
