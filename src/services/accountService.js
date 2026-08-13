import { normalizeUserRole } from "../utils/accountPermissions";
import { getSupabaseClient } from "../lib/supabaseClient";
import { listBusinessUsers } from "./supabase/businessService";

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
    updatedAt: new Date().toISOString(),
  };
}

export function subscribeToBusinessUsers(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  const publish = () => {
    listBusinessUsers(businessId)
      .then((users) => {
        callback(
          users
            .map((user) => ({
              ...user,
              display_name: user.display_name || user.profiles?.display_name || "",
              email: user.email || user.profiles?.email || "",
            }))
            .sort((a, b) => String(a.display_name || a.email).localeCompare(String(b.display_name || b.email)))
        );
      })
      .catch((error) => {
        console.error("[account:businessUsers]", error);
        callback([]);
      });
  };

  const channel = client
    .channel(`account_business_users:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "business_users",
        filter: `business_id=eq.${businessId}`,
      },
      publish
    )
    .subscribe();

  publish();

  return () => {
    client.removeChannel(channel);
  };

}

export function subscribeToPaymentMethods(businessId, callback) {
  if (!businessId) {
    callback(DEFAULT_PAYMENT_METHODS.map(normalizePaymentMethodConfig));
    return () => {};
  }

  const client = getSupabaseClient();
  const publish = async () => {
    const { data, error } = await client
      .from("business_settings")
      .select("settings")
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      console.error("[account:paymentMethods]", error);
      callback(DEFAULT_PAYMENT_METHODS.map(normalizePaymentMethodConfig));
      return;
    }

    const methods = Array.isArray(data?.settings?.paymentMethods)
      ? data.settings.paymentMethods
      : DEFAULT_PAYMENT_METHODS;
    callback(methods.map(normalizePaymentMethodConfig).sort((a, b) => a.sortOrder - b.sortOrder));
  };

  const channel = client
    .channel(`account_payment_methods:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "business_settings",
        filter: `business_id=eq.${businessId}`,
      },
      publish
    )
    .subscribe();

  publish();

  return () => {
    client.removeChannel(channel);
  };

}

export function subscribeToBusinessSettings(businessId, callback) {
  if (!businessId) {
    callback(validateBusinessSettings());
    return () => {};
  }

  const client = getSupabaseClient();
  const publish = async () => {
    const { data, error } = await client
      .from("business_settings")
      .select("settings")
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      console.error("[account:businessSettings]", error);
      callback(validateBusinessSettings());
      return;
    }

    callback(validateBusinessSettings(data?.settings || {}));
  };

  const channel = client
    .channel(`account_business_settings:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "business_settings",
        filter: `business_id=eq.${businessId}`,
      },
      publish
    )
    .subscribe();

  publish();

  return () => {
    client.removeChannel(channel);
  };

}

export function subscribeToAuditLogs(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  const publish = async () => {
    const { data, error } = await client
      .from("audit_logs")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[account:auditLogs]", error);
      callback([]);
      return;
    }

    callback((data || []).map((log) => ({
      ...log,
      createdAt: log.created_at,
      user_name: log.user_name || "",
      entityType: log.entity_type,
      entityId: log.entity_id,
    })));
  };

  const channel = client
    .channel(`account_audit_logs:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "audit_logs",
        filter: `business_id=eq.${businessId}`,
      },
      publish
    )
    .subscribe();

  publish();

  return () => {
    client.removeChannel(channel);
  };

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

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("audit_logs")
    .insert({
      business_id: normalizedBusinessId,
      user_id: actor?.id || null,
      module,
      action,
      entity_type: entityType,
      entity_id: entityId || "",
      previous_value: previousValue,
      new_value: newValue,
      reason,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;

}

export async function updateBusinessProfileWithAudit(businessId, values, actor, previousValue) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) throw new Error("No se encontro el negocio activo.");

  const payload = sanitizeBusinessProfile(values);
  if (!payload.name) throw new Error("El nombre comercial es obligatorio.");

  const client = getSupabaseClient();
  const { error: businessError } = await client
    .from("businesses")
    .update({
      name: payload.name,
      legal_name: payload.legal_name || null,
      logo_url: payload.logo_url || "",
      status: payload.status || "active",
      metadata: {
        nit: payload.nit,
        address: payload.address,
        city: payload.city,
        phone: payload.phone,
        email: payload.email,
        category: payload.category,
        currency: payload.currency,
        timezone: payload.timezone,
        receipt_notes: payload.receipt_notes,
      },
    })
    .eq("id", normalizedBusinessId);

  if (businessError) throw businessError;

  await createAuditLog({
    businessId: normalizedBusinessId,
    actor,
    module: "account",
    action: "account.manageBusiness",
    entityType: "business",
    entityId: normalizedBusinessId,
    previousValue,
    newValue: payload,
    reason: "Actualizacion de datos del negocio",
  });
  return;

}

export async function updateBusinessUserRole({ businessId, targetUserId, role, status, actor, previousValue }) {
  const normalizedBusinessId = String(businessId || "").trim();
  const normalizedTargetUserId = String(targetUserId || "").trim();
  const normalizedRole = normalizeUserRole(role);
  if (!normalizedBusinessId || !normalizedTargetUserId) throw new Error("Usuario o negocio invalido.");

  if (previousValue?.role === "owner" && normalizedRole !== "owner") {
    throw new Error("El administrador principal no puede perder su rol desde esta pantalla.");
  }

  const client = getSupabaseClient();
  const { data: users, error: usersError } = await client
    .from("business_users")
    .select("id, role, status")
    .eq("business_id", normalizedBusinessId);

  if (usersError) throw usersError;

  const adminCount = (users || []).filter((user) => {
    const userRole = user.id === normalizedTargetUserId ? normalizedRole : normalizeUserRole(user.role);
    const userStatus = user.id === normalizedTargetUserId ? status : user.status;
    return ["owner", "admin"].includes(userRole) && String(userStatus || "active") === "active";
  }).length;

  if (adminCount < 1) {
    throw new Error("Debe existir al menos un administrador activo.");
  }

  const { error: updateError } = await client
    .from("business_users")
    .update({
      role: normalizedRole,
      status: String(status || "active").trim() || "active",
    })
    .eq("id", normalizedTargetUserId)
    .eq("business_id", normalizedBusinessId);

  if (updateError) throw updateError;

  await createAuditLog({
    businessId: normalizedBusinessId,
    actor,
    module: "account",
    action: "users.manage",
    entityType: "business_user",
    entityId: normalizedTargetUserId,
    previousValue,
    newValue: { role: normalizedRole, status },
    reason: "Cambio de rol o estado de usuario",
  });
  return;

}

export async function savePaymentMethods(businessId, methods, actor) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) throw new Error("No se encontro el negocio activo.");

  const normalizedMethods = methods.map(normalizePaymentMethodConfig);
  const client = getSupabaseClient();
  const { data: settingsRow, error: settingsError } = await client
    .from("business_settings")
    .select("settings")
    .eq("business_id", normalizedBusinessId)
    .maybeSingle();

  if (settingsError) throw settingsError;

  const nextSettings = {
    ...(settingsRow?.settings || {}),
    paymentMethods: normalizedMethods,
  };

  const { error } = await client
    .from("business_settings")
    .upsert({
      business_id: normalizedBusinessId,
      settings: nextSettings,
    });

  if (error) throw error;

  await createAuditLog({
    businessId: normalizedBusinessId,
    actor,
    module: "account",
    action: "paymentMethods.update",
    entityType: "business_settings",
    entityId: normalizedBusinessId,
    newValue: normalizedMethods,
    reason: "Actualizacion de metodos de pago",
  });
  return;

}

export async function saveBusinessSettings(businessId, settings, actor) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) throw new Error("No se encontro el negocio activo.");

  const normalizedSettings = validateBusinessSettings(settings);
  const client = getSupabaseClient();
  const { data: settingsRow, error: settingsError } = await client
    .from("business_settings")
    .select("settings")
    .eq("business_id", normalizedBusinessId)
    .maybeSingle();

  if (settingsError) throw settingsError;

  const { error } = await client
    .from("business_settings")
    .upsert({
      business_id: normalizedBusinessId,
      settings: {
        ...(settingsRow?.settings || {}),
        ...normalizedSettings,
      },
    });

  if (error) throw error;

  await createAuditLog({
    businessId: normalizedBusinessId,
    actor,
    module: "account",
    action: "settings.update",
    entityType: "business_settings",
    entityId: normalizedBusinessId,
    newValue: normalizedSettings,
    reason: "Actualizacion de configuracion operativa",
  });
  return;

}
