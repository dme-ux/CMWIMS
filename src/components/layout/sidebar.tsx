"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Boxes, Database, ArrowDownToLine, ArrowUpFromLine, ShoppingCart, Wallet, ClipboardList, FileSpreadsheet, ShieldCheck, Ticket, BarChart3, FileText, Settings, ChevronRight, Users, CarFront } from "lucide-react";
import { cn } from "@/lib/utils";
import { can, type Permission, type Role } from "@/lib/auth/rbac";
interface NavItem { label:string; short:string; href:string; icon:React.ElementType; perm:Permission }
const NAV:NavItem[]=[
 {label:"Dashboard",short:"Home",href:"/dashboard",icon:LayoutDashboard,perm:"dashboard.view"},
 {label:"Masters",short:"Masters",href:"/masters",icon:Database,perm:"masters.manage"},
 {label:"Inventory",short:"Stock",href:"/inventory",icon:Boxes,perm:"inventory.view"},
 {label:"Inward",short:"In",href:"/inward",icon:ArrowDownToLine,perm:"purchase.manage"},
 {label:"Outward",short:"Out",href:"/outward",icon:ArrowUpFromLine,perm:"inventory.manage"},
 {label:"Purchase",short:"PO",href:"/purchase",icon:ShoppingCart,perm:"purchase.view"},
 {label:"Accounting",short:"Accounts",href:"/accounting",icon:Wallet,perm:"accounts.view"},
 {label:"Customers",short:"Customer",href:"/customers",icon:Users,perm:"workshop.view"},
 {label:"Vehicles",short:"Vehicle",href:"/vehicles",icon:CarFront,perm:"workshop.view"},
 {label:"Job Cards",short:"Jobs",href:"/workshop",icon:ClipboardList,perm:"workshop.view"},
 {label:"Estimates",short:"Estimate",href:"/estimates",icon:FileSpreadsheet,perm:"workshop.view"},
 {label:"QC Reports",short:"QC",href:"/qc-reports",icon:ShieldCheck,perm:"workshop.view"},
 {label:"Gate Pass",short:"Gate",href:"/gate-pass",icon:Ticket,perm:"workshop.view"},
 {label:"Reports",short:"Reports",href:"/reports",icon:BarChart3,perm:"reports.view"},
 {label:"Audit Log",short:"Audit",href:"/audit",icon:FileText,perm:"settings.manage"},
 {label:"Settings",short:"Settings",href:"/settings",icon:Settings,perm:"settings.manage"},
];
export function Sidebar({role}:{role:Role}){const pathname=usePathname();const items=NAV.filter(n=>can(role,n.perm));const render=(item:NavItem,mobile=false)=>{const active=pathname===item.href||pathname.startsWith(item.href+"/");const Icon=item.icon;return <Link key={item.href} href={item.href} className={mobile?"shrink-0":"block"}><motion.div whileHover={mobile?undefined:{x:3}} className={cn(mobile?"flex min-w-[68px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium":"group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",active?"bg-brand-600 text-white shadow-glass":"text-ink-soft hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-white/5")}><Icon className={mobile?"h-5 w-5":"h-[18px] w-[18px]"}/><span className={mobile?"max-w-[64px] truncate":"flex-1"}>{mobile?item.short:item.label}</span>{!mobile&&active&&<ChevronRight className="h-4 w-4 opacity-80"/>}</motion.div></Link>};return <><aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[rgb(var(--surface))]/80 lg:flex"><div className="flex items-center gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-white/10"><Image src="/logo.jpeg" alt="CMW" width={40} height={40} className="rounded-lg"/><div className="leading-tight"><p className="font-display text-sm font-bold text-brand-700 dark:text-brand-200">CMW ERP</p><p className="text-[11px] text-ink-muted">Capital Motor Works</p></div></div><nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">{items.map(i=>render(i))}</nav><div className="border-t px-5 py-3 text-[11px] text-ink-muted dark:border-white/10">Powered by <span className="font-semibold text-brand-600">SystemMaster</span></div></aside><nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 lg:hidden"><div className="flex gap-1 overflow-x-auto pb-[env(safe-area-inset-bottom)]">{items.map(i=>render(i,true))}</div></nav></>}
