import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { createSubscriptionErrorHandler } from "./subscriptionService";
import { getDefaultPermissionsByRole, normalizeUserRole } from "../utils/accountPermissions";

export const DEFAULT_PAYMENT_METHODS = [
  {
    key: "cash",
    name: "Efectivo",
    active: true,
    affectsPhysicalCash: true,
    affectsDigitalCash: false,
    requiresReference: false,
    requiresCustomer: false,
    allowsChange: true,
    isCredit: false,
    isNonCashConsumption: false,
    sortOrder: 10,
  },
  {
    key: "debit_card",
    name: "Tarjeta debito",
    active: true,
    affectsPhysicalCash: false,
    affectsDigitalCash: true,
    requiresReference: true,
    requiresCustomer: false,
    allowsChange: false,
    isCredit: false,
    isNonCashConsumption: false,
    sortOrder: 20,
  },
  {
    key: "credit_card",
    name: "Tarjeta credito",
    active: true,
    affectsPhysicalCash: false,
    affectsDigitalCash: true,
    requiresReference: true,
    requiresCustomer: false,
    allowsChange: false,
    isCredit: false,
    isNonCashConsumption: false,
    sortOrder: 30,
  },
  {
    key: "transfer",
    name: "Transferencia",
    active: true,
    affectsPhysicalCash: false,
    affectsDigitalCash: true,
    requiresReference: true,
    requiresCustomer: false,
    allowsChange: false,
    isCredit: false,
    isNonCashConsumption: false,
    sortOrder: 40,
  },
  {
    key: "nequi",
    name: "Nequi",
    active: true,
    affectsPhysicalCash: false,
    affectsDigitalCash: true,
    requiresReference: true,
    requiresCustomer: false,
    allowsChange: false,
    isCredit: false,
    isNonCashConsumption: false,
    sortOrder: 50,
  },
  {
    key: "daviplata",
    name: "Daviplata",
    active: true,
    affectsPhysicalCash: false,
    affectsDigitalCash: true,
    requiresReference: true,
    requiresCustomer: false,
    allowsChange: false,
    isCredit: false,
    isNonCashConsumption: false,
    sortOrder: 60,
  },
  {
    key: "qr",
    name: "QR",
    active: true,
    affectsPhysicalCash: false,
    affectsDigitalCash: true,
    requiresReference: true,
    requiresCustomer: false,
    allowsChange: false,
    isCredit: false,
    isNonCashConsumption: false,
    sortOrder: 70,
  },
  {
    key: "ticket_wallet",
    name: "Tiquetera",
    active: true,
    affectsPhysicalCash: false,
    affectsDigitalCash: false,
    requiresReference: false,
    requiresCustomer: true,
    allowsChange: false,
    isCredit: false,
    isNonCashConsumption: true,
    sortOrder: 80,
  },
  {
    key: "courtesy",
    name: "Cortesia",
    active: true,
    affectsPhysicalCash: false,
    affectsDigitalCash: false,
    requiresReference: false,
    requiresCustomer: false,
    allowsChange: false,
    isCredit: false,
    isNonCashConsumption: true,
    sortOrder: 90,
  },
  {
    key: "account_credit",
    name: "Credito/deuda cliente",
    active: true,
    affectsPhysicalCash: false,
    affectsDigitalCash: false,
    requiresReference: false,
    requiresCustomer: true,
    allowsChange: false,
    isCredit: true,
    isNonCashConsumption: false,
    sortOrder: 100,
  },
];

export const DEFAULT_BUSINESS_SETTINGS = {
  cash: {
    requireOpenCashSession: true,
    allowSalesWithoutCashSession: false,
    maxClosingDifference: 0,
    closeRoles: ["owner", "admin", "cashier"],
  },
  pos: {
    allowDiscounts: true,
    requireDiscountReason: true,
    allowCreditSales: true,
    requireCustomerForDebt: true,
    allowCourtesy: true,
    requireCourtesyReason: true,
  },
  tables: {
    requireCleaningBeforeFree: false,
    allowTableTransfer: true,
    allowSplitBill: true,
    requireWaiterOnOpen: false,
  },
  tickets: {
    defaultValidityDays: 30,
    allowCustomTickets: true,
    allowBalanceAdjustments: true,
    requireAdjustmentReason: true,
  },
  inventory: {
    applyInventoryOnSaleConfirmation: true,
    alertLowStock: true,
    allowNegativeStock: false,
  },
  purchases: {
    allowEditConfirmedPurchases: false,
    requireCancelReason: true,
    updateAverageCost: true,
  },
  technicalSheets: {
    showCostsOnlyToAuthorizedRoles: true,
    allowNestedRecipes: true,
    defaultTargetFoodCost: 35,
  },
};

function normalizeBoolean(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizePaymentMethodConfig(method = {}) {
  const base = DEFAULT_PAYMENT_METHODS.find((item) => item.key === method.key) || {};
  return {
    ...base,
    ...method,
    key: String(method.key || base.key || "").trim(),
    name: String(method.name || base.name || method.key || "").trim(),
    active: normalizeBoolean(method.active, base.active ?? true),
    affectsPhysicalCash: normalizeBoolean(
      method.affectsPhysicalCash ?? method.affects_physical_cash,
      base.affectsPhysicalCash
    ),
    affectsDigitalCash: normalizeBoolean(
      method.affectsDigitalCash ?? method.affects_digital_cash,
      base.affectsDigitalCash
    ),
    requiresReference: normalizeBoolean(
      method.requiresReference ?? method.requires_reference,
      base.requiresReference
    ),
    requiresCustomer: normalizeBoolean(
      method.requiresCustomer ?? method.requires_customer,
      base.requiresCustomer
    ),
    allowsChange: normalizeBoolean(method.allowsChange ?? method.allows_change, base.allowsChange),
    isCredit: normalizeBoolean(method.isCredit ?? method.is_credit, base.isCredit),
    isNonCashConsumption: normalizeBoolean(
      method.isNonCashConsumption ?? method.is_non_cash_consumption,
      base.isNonCashConsumption
    ),
    sortOrder: Number(method.sortOrder ?? method.sort_order ?? base.sortOrder ?? 999),
  };
}

export function validateBusinessSettings(settings = {}) {
  return {
    ...DEFAULT_BUSINESS_SETTINGS,
    ...settings,
    cash: { ...DEFAULT_BUSINESS_SETTINGS.cash, ...(settings.cash || {}) },
    pos: { ...DEFAULT_BUSINESS_SETTINGS.pos, ...(settings.pos || {}) },
    tables: { ...DEFAULT_BUSINESS_SETTINGS.tables, ...(settings.tables || {}) },
    tickets: { ...DEFAULT_BUSINESS_SETTINGS.tickets, ...(settings.tickets || {}) },
    inventory: { ...DEFAULT_BUSINESS_SETTINGS.inventory, ...(settings.inventory || {}) },
    purchases: { ...DEFAULT_BUSINESS_SETTINGS.purchases, ...(settings.purchases || {}) },
    technicalSheets: {
      ...DEFAULT_BUSINESS_SETTINGS.technicalSheets,
      ...(settings.technicalSheets || {}),
    },
  };
}

export function sanitizeBusinessProfile(values = {}) {
  return {
    name: String(values.name || "").trim(),
    legal_name: String(values.legalName || values.legal_name || "").trim(),
    nit: String(values.nit || "").trim(),
    address: String(values.address || "").trim(),
    city: String(values.city || "").trim(),
    phone: String(values.phone || "").trim(),
    email: String(values.email || "").trim().toLowerCase(),
    logo_url: String(values.logoUrl || values.logo_url || "").trim(),
    category: String(values.category || "").trim(),
    currency: String(values.currency || "COP").trim() || "COP",
    timezone: String(values.timezone || "America/Bogota").trim() || "America/Bogota",
    receipt_notes: String(values.receiptNotes || values.receipt_notes || "").trim(),
    status: String(values.status || "active").trim() || "active",
    updatedAt: serverTimestamp(),
  };
}

function toFirestorePaymentMethod(method, businessId) {
  const normalized = normalizePaymentMethodConfig(method);
  return {
    business_id: businessId,
    key: normalized.key,
    name: normalized.name,
    active: normalized.active,
    affects_physical_cash: normalized.affectsPhysicalCash,
    affects_digital_cash: normalized.affectsDigitalCash,
    requires_reference: normalized.requiresReference,
    requires_customer: normalized.requiresCustomer,
    allows_change: normalized.allowsChange,
    is_credit: normalized.isCredit,
    is_non_cash_consumption: normalized.isNonCashConsumption,
    sort_order: normalized.sortOrder,
    updatedAt: serverTimestamp(),
  };
}

export function subscribeToBusinessUsers(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const usersQuery = query(collection(db, "business_users"), where("business_id", "==", businessId));
  return onSnapshot(usersQuery, (snapshot) => {
    const users = snapshot.docs
      .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
      .sort((a, b) => String(a.display_name || a.email).localeCompare(String(b.display_name || b.email)));
    callback(users);
  }, createSubscriptionErrorHandler({
    scope: "business_users:subscribeToBusinessUsers",
    callback,
    emptyValue: [],
  }));
}

export function subscribeToPaymentMethods(businessId, callback) {
  if (!businessId) {
    callback(DEFAULT_PAYMENT_METHODS);
    return () => {};
  }

  const methodsQuery = query(collection(db, "paymentMethods"), where("business_id", "==", businessId));
  return onSnapshot(methodsQuery, (snapshot) => {
    const methods = snapshot.docs.map((snapshotDoc) =>
      normalizePaymentMethodConfig({ id: snapshotDoc.id, ...snapshotDoc.data() })
    );
    callback((methods.length ? methods : DEFAULT_PAYMENT_METHODS).sort((a, b) => a.sortOrder - b.sortOrder));
  }, createSubscriptionErrorHandler({
    scope: "paymentMethods:subscribeToPaymentMethods",
    callback,
    emptyValue: DEFAULT_PAYMENT_METHODS,
  }));
}

export function subscribeToBusinessSettings(businessId, callback) {
  if (!businessId) {
    callback(validateBusinessSettings());
    return () => {};
  }

  return onSnapshot(doc(db, "businessSettings", businessId), (snapshot) => {
    callback(validateBusinessSettings(snapshot.exists() ? snapshot.data() : {}));
  }, createSubscriptionErrorHandler({
    scope: "businessSettings:subscribeToBusinessSettings",
    callback,
    emptyValue: validateBusinessSettings(),
  }));
}

export function subscribeToAuditLogs(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const logsQuery = query(collection(db, "auditLogs"), where("business_id", "==", businessId));
  return onSnapshot(logsQuery, (snapshot) => {
    const logs = snapshot.docs
      .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
      .sort((a, b) => {
        const left = a.createdAt?.toMillis?.() || 0;
        const right = b.createdAt?.toMillis?.() || 0;
        return right - left;
      })
      .slice(0, 50);
    callback(logs);
  }, createSubscriptionErrorHandler({
    scope: "auditLogs:subscribeToAuditLogs",
    callback,
    emptyValue: [],
  }));
}

export async function createAuditLog({
  businessId,
  actor,
  module,
  action,
  entityType,
  entityId,
  previousValue = null,
  newValue = null,
  reason = "",
}) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) return "";

  const ref = await addDoc(collection(db, "auditLogs"), {
    business_id: normalizedBusinessId,
    businessId: normalizedBusinessId,
    user_id: actor?.id || "",
    userId: actor?.id || "",
    user_name: actor?.name || actor?.email || "Usuario",
    userName: actor?.name || actor?.email || "Usuario",
    module,
    action,
    entity_type: entityType,
    entityType,
    entity_id: entityId || "",
    entityId: entityId || "",
    previousValue,
    newValue,
    reason,
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

export async function updateBusinessProfileWithAudit(businessId, values, actor, previousValue) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) throw new Error("No se encontro el negocio activo.");

  const payload = sanitizeBusinessProfile(values);
  if (!payload.name) throw new Error("El nombre comercial es obligatorio.");

  const batch = writeBatch(db);
  batch.set(doc(db, "businesses", normalizedBusinessId), payload, { merge: true });
  batch.set(doc(collection(db, "auditLogs")), {
    business_id: normalizedBusinessId,
    businessId: normalizedBusinessId,
    user_id: actor?.id || "",
    userId: actor?.id || "",
    user_name: actor?.name || actor?.email || "Usuario",
    userName: actor?.name || actor?.email || "Usuario",
    module: "account",
    action: "account.manageBusiness",
    entity_type: "business",
    entityType: "business",
    entity_id: normalizedBusinessId,
    entityId: normalizedBusinessId,
    previousValue,
    newValue: payload,
    reason: "Actualizacion de datos del negocio",
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function updateBusinessUserRole({ businessId, targetUserId, role, status, actor, previousValue }) {
  const normalizedBusinessId = String(businessId || "").trim();
  const normalizedTargetUserId = String(targetUserId || "").trim();
  const normalizedRole = normalizeUserRole(role);
  if (!normalizedBusinessId || !normalizedTargetUserId) throw new Error("Usuario o negocio invalido.");

  if (previousValue?.role === "owner" && normalizedRole !== "owner") {
    throw new Error("El administrador principal no puede perder su rol desde esta pantalla.");
  }

  const usersSnapshot = await getDocs(query(collection(db, "business_users"), where("business_id", "==", normalizedBusinessId)));
  const adminCount = usersSnapshot.docs.filter((snapshotDoc) => {
    const data = snapshotDoc.data();
    const userRole = snapshotDoc.id === normalizedTargetUserId ? normalizedRole : normalizeUserRole(data.role);
    const userStatus = snapshotDoc.id === normalizedTargetUserId ? status : data.status;
    return ["owner", "admin"].includes(userRole) && String(userStatus || "active") === "active";
  }).length;

  if (adminCount < 1) {
    throw new Error("Debe existir al menos un administrador activo.");
  }

  const batch = writeBatch(db);
  batch.set(doc(db, "business_users", normalizedTargetUserId), {
    role: normalizedRole,
    status: String(status || "active").trim() || "active",
    permissions: getDefaultPermissionsByRole(normalizedRole),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(collection(db, "auditLogs")), {
    business_id: normalizedBusinessId,
    businessId: normalizedBusinessId,
    user_id: actor?.id || "",
    userId: actor?.id || "",
    user_name: actor?.name || actor?.email || "Usuario",
    userName: actor?.name || actor?.email || "Usuario",
    module: "account",
    action: "users.manage",
    entity_type: "business_user",
    entityType: "business_user",
    entity_id: normalizedTargetUserId,
    entityId: normalizedTargetUserId,
    previousValue,
    newValue: { role: normalizedRole, status },
    reason: "Cambio de rol o estado de usuario",
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function savePaymentMethods(businessId, methods, actor) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) throw new Error("No se encontro el negocio activo.");

  const batch = writeBatch(db);
  methods.forEach((method) => {
    const normalized = normalizePaymentMethodConfig(method);
    if (!normalized.key) return;
    batch.set(
      doc(db, "paymentMethods", `${normalizedBusinessId}_${normalized.key}`),
      {
        ...toFirestorePaymentMethod(normalized, normalizedBusinessId),
        createdAt: method.createdAt || serverTimestamp(),
      },
      { merge: true }
    );
  });
  batch.set(doc(collection(db, "auditLogs")), {
    business_id: normalizedBusinessId,
    businessId: normalizedBusinessId,
    user_id: actor?.id || "",
    userId: actor?.id || "",
    user_name: actor?.name || actor?.email || "Usuario",
    userName: actor?.name || actor?.email || "Usuario",
    module: "account",
    action: "paymentMethods.update",
    entity_type: "paymentMethods",
    entityType: "paymentMethods",
    entity_id: normalizedBusinessId,
    entityId: normalizedBusinessId,
    previousValue: null,
    newValue: methods,
    reason: "Actualizacion de metodos de pago",
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function saveBusinessSettings(businessId, settings, actor) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) throw new Error("No se encontro el negocio activo.");

  const normalizedSettings = validateBusinessSettings(settings);
  const batch = writeBatch(db);
  batch.set(doc(db, "businessSettings", normalizedBusinessId), {
    ...normalizedSettings,
    business_id: normalizedBusinessId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(collection(db, "auditLogs")), {
    business_id: normalizedBusinessId,
    businessId: normalizedBusinessId,
    user_id: actor?.id || "",
    userId: actor?.id || "",
    user_name: actor?.name || actor?.email || "Usuario",
    userName: actor?.name || actor?.email || "Usuario",
    module: "account",
    action: "settings.update",
    entity_type: "businessSettings",
    entityType: "businessSettings",
    entity_id: normalizedBusinessId,
    entityId: normalizedBusinessId,
    previousValue: null,
    newValue: normalizedSettings,
    reason: "Actualizacion de configuracion operativa",
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}
