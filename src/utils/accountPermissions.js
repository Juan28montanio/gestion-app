export const ROLE_LABELS = {
  owner: "Administrador principal",
  admin: "Administrador",
  cashier: "Cajero",
  waiter: "Mesero",
  kitchen: "Cocina",
  assistant: "Auxiliar",
  accountant: "Contador/Consulta",
  viewer: "Solo lectura",
};

export const ACCOUNT_MODULES = [
  "dashboard",
  "pos",
  "cash",
  "sales",
  "tables",
  "kitchen",
  "customers",
  "tickets",
  "inventory",
  "supplies",
  "technicalSheets",
  "purchases",
  "reports",
  "account",
  "settings",
];

export const ACCOUNT_ACTIONS = [
  "view",
  "create",
  "edit",
  "cancel",
  "delete",
  "deactivate",
  "adjust",
  "close",
  "export",
  "manageUsers",
  "viewCosts",
  "managePermissions",
];

export const CRITICAL_PERMISSIONS = [
  "pos.createSale",
  "sales.cancel",
  "cash.open",
  "cash.close",
  "cash.adjust",
  "purchases.confirm",
  "purchases.cancel",
  "inventory.adjust",
  "technicalSheets.viewCosts",
  "tickets.adjustBalance",
  "users.manage",
  "account.manageBusiness",
  "reports.viewFinancials",
];

const ROLE_PERMISSIONS = {
  owner: ["*"],
  admin: ["*"],
  cashier: [
    "dashboard.view",
    "pos.view",
    "pos.createSale",
    "cash.view",
    "cash.open",
    "cash.close",
    "customers.view",
    "tickets.view",
    "sales.view",
  ],
  waiter: ["tables.view", "tables.create", "tables.edit", "pos.view", "customers.view"],
  kitchen: ["kitchen.view", "tables.view"],
  assistant: [
    "dashboard.view",
    "inventory.view",
    "inventory.edit",
    "supplies.view",
    "purchases.view",
    "technicalSheets.view",
  ],
  accountant: [
    "dashboard.view",
    "cash.view",
    "sales.view",
    "purchases.view",
    "reports.view",
    "reports.viewFinancials",
    "technicalSheets.viewCosts",
  ],
  viewer: ACCOUNT_MODULES.map((module) => `${module}.view`),
};

export function normalizeUserRole(role) {
  const normalized = String(role || "viewer").trim().toLowerCase();
  if (normalized === "owner") return "owner";
  return ROLE_LABELS[normalized] ? normalized : "viewer";
}

export function getRoleLabel(role) {
  return ROLE_LABELS[normalizeUserRole(role)] || ROLE_LABELS.viewer;
}

export function getDefaultPermissionsByRole(role) {
  return ROLE_PERMISSIONS[normalizeUserRole(role)] || ROLE_PERMISSIONS.viewer;
}

export function hasPermission(userOrProfile, permission) {
  const role = normalizeUserRole(userOrProfile?.role);
  if (role === "owner" || role === "admin") return true;

  const permissions = Array.isArray(userOrProfile?.permissions)
    ? userOrProfile.permissions
    : getDefaultPermissionsByRole(role);

  return permissions.includes("*") || permissions.includes(permission);
}

export function canViewModule(userOrProfile, module) {
  return hasPermission(userOrProfile, `${module}.view`);
}

export function canPerformAction(userOrProfile, permission) {
  return hasPermission(userOrProfile, permission);
}

export function requireAdmin(userOrProfile) {
  const role = normalizeUserRole(userOrProfile?.role);
  if (role !== "owner" && role !== "admin") {
    throw new Error("Esta accion requiere rol administrador.");
  }
}

export function requirePermission(userOrProfile, permission) {
  if (!hasPermission(userOrProfile, permission)) {
    throw new Error("No tienes permisos suficientes para esta accion.");
  }
}

export function canManageAccountSection(userOrProfile) {
  return hasPermission(userOrProfile, "account.manageBusiness") || hasPermission(userOrProfile, "users.manage");
}
