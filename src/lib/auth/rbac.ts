// ============================================================================
//  Role-Based Access Control (RBAC)
//  Central permission map — every module gate reads from here.
// ============================================================================

export type Role =
  | "ADMIN"
  | "MANAGER"
  | "STORE_MANAGER"
  | "ACCOUNTS"
  | "PURCHASE"
  | "WORKSHOP"
  | "SERVICE_ADVISOR"
  | "TECHNICIAN"
  | "VIEWER";

/** Every permission key used across the app. */
export type Permission =
  | "dashboard.view"
  | "masters.manage"
  | "inventory.view"
  | "inventory.manage"
  | "purchase.view"
  | "purchase.manage"
  | "purchase.approve"
  | "accounts.view"
  | "accounts.manage"
  | "reports.view"
  | "workshop.view"
  | "workshop.manage"
  | "workshop.assigned" // technician: only jobs assigned to them
  | "settings.manage"
  | "users.manage";

const ALL: Permission[] = [
  "dashboard.view", "masters.manage", "inventory.view", "inventory.manage",
  "purchase.view", "purchase.manage", "purchase.approve", "accounts.view",
  "accounts.manage", "reports.view", "workshop.view", "workshop.manage",
  "workshop.assigned", "settings.manage", "users.manage",
];

/** Role -> permission grants. Single source of truth. */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ALL,
  MANAGER: ALL.filter((p) => p !== "settings.manage" && p !== "users.manage"),
  STORE_MANAGER: ["dashboard.view", "inventory.view", "inventory.manage", "reports.view"],
  PURCHASE: ["dashboard.view", "purchase.view", "purchase.manage", "inventory.view", "reports.view"],
  ACCOUNTS: ["dashboard.view", "accounts.view", "accounts.manage", "purchase.view", "reports.view"],
  WORKSHOP: ["dashboard.view", "workshop.view", "workshop.manage", "inventory.view"],
  SERVICE_ADVISOR: ["dashboard.view", "workshop.view", "workshop.manage"],
  TECHNICIAN: ["dashboard.view", "workshop.assigned"],
  VIEWER: ["dashboard.view", "inventory.view", "reports.view"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  STORE_MANAGER: "Store Manager",
  ACCOUNTS: "Accounts",
  PURCHASE: "Purchase",
  WORKSHOP: "Workshop",
  SERVICE_ADVISOR: "Service Advisor",
  TECHNICIAN: "Technician",
  VIEWER: "Viewer",
};
