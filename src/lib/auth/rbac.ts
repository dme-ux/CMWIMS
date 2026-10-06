// ============================================================================
//  Role + per-user Access Control
//  customPermissions=null => role defaults. Array => exact grants for that user.
// ============================================================================

export type Role =
  | "ADMIN" | "MANAGER" | "STORE_MANAGER" | "ACCOUNTS" | "PURCHASE"
  | "WORKSHOP" | "SERVICE_ADVISOR" | "TECHNICIAN" | "VIEWER";

export type Permission =
  | "dashboard.view" | "masters.manage"
  | "inventory.view" | "inventory.manage"
  | "purchase.view" | "purchase.manage" | "purchase.approve"
  | "accounts.view" | "accounts.manage"
  | "expenses.view" | "expenses.create" | "expenses.edit" | "expenses.delete" | "expenses.export" | "expenses.dashboard" | "expenses.manage"
  | "salary.view" | "salary.manage" | "sales.view" | "sales.manage" | "reports.view"
  | "workshop.view" | "workshop.create" | "workshop.edit" | "workshop.status" | "workshop.parts" | "workshop.approve" | "workshop.print" | "workshop.manage" | "workshop.assigned"
  | "settings.manage" | "users.manage";

export const ALL_PERMISSIONS: Permission[] = [
  "dashboard.view","masters.manage","inventory.view","inventory.manage",
  "purchase.view","purchase.manage","purchase.approve","accounts.view","accounts.manage",
  "expenses.view","expenses.create","expenses.edit","expenses.delete","expenses.export","expenses.dashboard","expenses.manage",
  "salary.view","salary.manage","sales.view","sales.manage","reports.view",
  "workshop.view","workshop.create","workshop.edit","workshop.status","workshop.parts","workshop.approve","workshop.print","workshop.manage","workshop.assigned",
  "settings.manage","users.manage",
];

const WORKSHOP_MANAGE: Permission[] = ["workshop.view","workshop.create","workshop.edit","workshop.status","workshop.parts","workshop.print","workshop.manage"];
const EXPENSE_MANAGE: Permission[] = ["expenses.view","expenses.create","expenses.edit","expenses.delete","expenses.export","expenses.dashboard","expenses.manage"];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ALL_PERMISSIONS,
  MANAGER: ALL_PERMISSIONS.filter((p) => p !== "settings.manage" && p !== "users.manage" && p !== "workshop.approve"),
  STORE_MANAGER: ["dashboard.view","inventory.view","inventory.manage","reports.view"],
  PURCHASE: ["dashboard.view","purchase.view","purchase.manage","inventory.view","reports.view"],
  ACCOUNTS: ["dashboard.view","accounts.view","accounts.manage",...EXPENSE_MANAGE,"salary.view","salary.manage","sales.view","sales.manage","purchase.view","reports.view"],
  WORKSHOP: ["dashboard.view",...WORKSHOP_MANAGE,"inventory.view"],
  SERVICE_ADVISOR: ["dashboard.view",...WORKSHOP_MANAGE],
  TECHNICIAN: ["dashboard.view","workshop.assigned"],
  VIEWER: ["dashboard.view","inventory.view","reports.view"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function effectivePermissions(role: Role, customPermissions?: unknown): Permission[] {
  if (!Array.isArray(customPermissions)) return ROLE_PERMISSIONS[role] || [];
  return customPermissions.filter((p): p is Permission => typeof p === "string" && ALL_PERMISSIONS.includes(p as Permission));
}

export function canSession(user: { role: Role; permissions?: Permission[] | null }, permission: Permission): boolean {
  if (Array.isArray(user.permissions)) return user.permissions.includes(permission);
  return can(user.role, permission);
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN:"Administrator", MANAGER:"Manager", STORE_MANAGER:"Store Manager", ACCOUNTS:"Accounts",
  PURCHASE:"Purchase", WORKSHOP:"Workshop", SERVICE_ADVISOR:"Service Advisor", TECHNICIAN:"Technician", VIEWER:"Viewer",
};
