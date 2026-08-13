import { getCashMovements } from "./app/cashGateway";
import { getSupabaseClient } from "../lib/supabaseClient";
import { settleAccountPayableWithRpc, settleSaleDebtWithRpc } from "./supabase/cashService";
import { roundCurrency } from "../utils/posFinance";

function normalizeText(value) {
  return String(value || "").trim();
}

function sortByCreatedAt(items = []) {
  return [...items].sort((left, right) => {
    const leftTime = left.createdAt?.toMillis?.() || left.created_at?.toMillis?.() || 0;
    const rightTime = right.createdAt?.toMillis?.() || right.created_at?.toMillis?.() || 0;
    return rightTime - leftTime;
  });
}

const CASH_INCOME_TYPES = new Set(["sale_income", "debt_payment", "debt_payment_income", "manual_income"]);
const CASH_EXPENSE_TYPES = new Set(["purchase_expense", "supplier_payment", "operating_expense", "operational_expense"]);

export function calculateExpectedCash({
  openingAmount = 0,
  cashIncome = 0,
  cashExpense = 0,
  refunds = 0,
  withdrawals = 0,
  adjustments = 0,
} = {}) {
  return roundCurrency(
    Number(openingAmount || 0) +
      Number(cashIncome || 0) -
      Number(cashExpense || 0) -
      Number(refunds || 0) -
      Number(withdrawals || 0) +
      Number(adjustments || 0)
  );
}

export function calculateCashDifference(expectedCash, countedCash) {
  return roundCurrency(Number(countedCash || 0) - Number(expectedCash || 0));
}

export function groupMovementsByMethod(movements = []) {
  return movements.reduce((summary, movement) => {
    const method = normalizeText(movement.method || movement.paymentMethod || "cash") || "cash";
    summary[method] = roundCurrency((summary[method] || 0) + Number(movement.amount || 0));
    return summary;
  }, {});
}

function groupMovementsByMethodWhen(movements = [], predicate = () => true) {
  return movements.reduce((summary, movement) => {
    if (!predicate(movement)) {
      return summary;
    }

    const method = normalizeText(movement.method || movement.paymentMethod || "cash") || "cash";
    summary[method] = roundCurrency((summary[method] || 0) + Number(movement.amount || 0));
    return summary;
  }, {});
}

export function summarizeCashSession(session, movements = []) {
  const validMovements = movements.filter((movement) => {
    const status = normalizeText(movement.status || "valid").toLowerCase();
    return !["canceled", "cancelled", "reversed"].includes(status);
  });
  const openingAmount = Number(session?.openingAmount ?? session?.opening_amount ?? 0);
  const cashIncome = validMovements
    .filter((movement) => movement.method === "cash" && CASH_INCOME_TYPES.has(movement.type))
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const digitalIncome = validMovements
    .filter((movement) => movement.method !== "cash" && CASH_INCOME_TYPES.has(movement.type))
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const cashExpense = validMovements
    .filter((movement) => movement.method === "cash" && CASH_EXPENSE_TYPES.has(movement.type))
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const digitalExpense = validMovements
    .filter((movement) => movement.method !== "cash" && CASH_EXPENSE_TYPES.has(movement.type))
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const refunds = validMovements
    .filter((movement) => movement.type === "refund")
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const withdrawals = validMovements
    .filter((movement) => movement.type === "withdrawal")
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const adjustments = validMovements
    .filter((movement) => movement.type === "adjustment")
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const expectedCash = calculateExpectedCash({
    openingAmount,
    cashIncome,
    cashExpense,
    refunds,
    withdrawals,
    adjustments,
  });

  return {
    openingAmount,
    cashIncome,
    digitalIncome,
    totalCollected: roundCurrency(cashIncome + digitalIncome),
    cashExpense,
    digitalExpense,
    refunds,
    withdrawals,
    adjustments,
    expectedCash,
    byMethod: groupMovementsByMethod(validMovements),
    incomeByMethod: groupMovementsByMethodWhen(validMovements, (movement) => CASH_INCOME_TYPES.has(movement.type)),
    expenseByMethod: groupMovementsByMethodWhen(validMovements, (movement) => CASH_EXPENSE_TYPES.has(movement.type)),
    movementCount: validMovements.length,
  };
}

export function subscribeToCashMovements(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  let cancelled = false;
  const publish = () => {
    getCashMovements(businessId)
      .then((movements) => {
        if (!cancelled) callback(sortByCreatedAt(movements));
      })
      .catch((error) => {
        console.error("[financeControl:cashMovements]", error);
        if (!cancelled) callback([]);
      });
  };

  publish();
  const intervalId = window.setInterval(publish, 15000);
  return () => {
    cancelled = true;
    window.clearInterval(intervalId);
  };

}

export function subscribeToAccountsReceivable(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  let cancelled = false;

  const publish = () => {
    listAccountsReceivable(businessId)
      .then((accounts) => {
        if (!cancelled) callback(accounts);
      })
      .catch((error) => {
        console.error("[financeControl:receivables]", error);
        if (!cancelled) callback([]);
      });
  };

  const channels = ["sales", "payments"].map((table) =>
    client
      .channel(`finance_receivables:${table}:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `business_id=eq.${businessId}`,
        },
        publish
      )
      .subscribe()
  );

  publish();
  return () => {
    cancelled = true;
    channels.forEach((channel) => client.removeChannel(channel));
  };
}

export function subscribeToAccountsPayable(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  let cancelled = false;

  const publish = () => {
    listAccountsPayable(businessId)
      .then((accounts) => {
        if (!cancelled) callback(accounts);
      })
      .catch((error) => {
        console.error("[financeControl:payables]", error);
        if (!cancelled) callback([]);
      });
  };

  const channels = ["accounts_payable", "purchases", "cash_movements"].map((table) =>
    client
      .channel(`finance_payables:${table}:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `business_id=eq.${businessId}`,
        },
        publish
      )
      .subscribe()
  );

  publish();
  return () => {
    cancelled = true;
    channels.forEach((channel) => client.removeChannel(channel));
  };
}

export async function registerPayablePayment({
  businessId,
  accountPayableId,
  amount,
  method = "cash",
  reference = "",
  actor = {},
}) {
  const normalizedBusinessId = normalizeText(businessId);
  const normalizedPayableId = normalizeText(accountPayableId);
  const normalizedMethod = normalizeText(method || "cash") || "cash";
  const paymentAmount = roundCurrency(amount);

  if (!normalizedBusinessId || !normalizedPayableId) {
    throw new Error("Debes indicar la cuenta por pagar.");
  }

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    throw new Error("El pago a proveedor debe ser mayor a cero.");
  }

  return settleAccountPayableWithRpc({
    p_business_id: normalizedBusinessId,
    p_account_payable_id: normalizedPayableId,
    p_amount: paymentAmount,
    p_method: normalizedMethod,
    p_reference: normalizeText(reference) || null,
    p_notes: normalizeText(actor?.email || actor?.name)
      ? `Registrado por ${normalizeText(actor?.name || actor?.email)}`
      : null,
  });
}

export async function registerReceivablePayment({
  businessId,
  accountReceivableId,
  amount,
  method = "cash",
  reference = "",
  actor = {},
}) {
  const normalizedBusinessId = normalizeText(businessId);
  const normalizedReceivableId = normalizeText(accountReceivableId);
  const normalizedMethod = normalizeText(method || "cash") || "cash";
  const paymentAmount = roundCurrency(amount);

  if (!normalizedBusinessId || !normalizedReceivableId) {
    throw new Error("Debes indicar la cuenta por cobrar.");
  }

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    throw new Error("El abono debe ser mayor a cero.");
  }

  return settleSaleDebtWithRpc({
    p_business_id: normalizedBusinessId,
    p_sale_id: normalizedReceivableId,
    p_amount: paymentAmount,
    p_method: normalizedMethod,
    p_reference: normalizeText(reference) || null,
    p_notes: normalizeText(actor?.email || actor?.name)
      ? `Registrado por ${normalizeText(actor?.name || actor?.email)}`
      : null,
  });
}

export async function reverseCashMovement({ movementId, reason, actor = {} }) {
  const normalizedMovementId = normalizeText(movementId);
  const normalizedReason = normalizeText(reason);
  void actor;

  if (!normalizedMovementId || !normalizedReason) {
    throw new Error("El movimiento y el motivo son obligatorios.");
  }

  throw new Error(
    "La reversa de movimientos requiere una RPC de auditoria en Supabase. Esta accion queda bloqueada temporalmente."
  );

  
}

export async function getAccountPayable(accountPayableId) {
  const normalizedPayableId = normalizeText(accountPayableId);
  if (!normalizedPayableId) return null;

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("accounts_payable")
    .select("*")
    .eq("id", normalizedPayableId)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizePayable(data) : null;
}

function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeReceivable(row = {}) {
  const customer = row.customers || {};
  const pendingAmount = roundCurrency(row.pending_amount ?? 0);
  const createdAt = normalizeDate(row.created_at);

  return {
    id: row.id,
    saleId: row.id,
    sale_id: row.id,
    business_id: row.business_id,
    collection: "accountsReceivable",
    customer_id: row.customer_id || null,
    customerId: row.customer_id || null,
    customer_name: customer.name || row.metadata?.client_payload?.customer_name || "Cliente sin nombre",
    customerName: customer.name || row.metadata?.client_payload?.customerName || "Cliente sin nombre",
    pendingAmount,
    pending_amount: pendingAmount,
    pending_debt_remaining: pendingAmount,
    debt_amount: pendingAmount,
    originalAmount: roundCurrency(row.total ?? 0),
    original_amount: roundCurrency(row.total ?? 0),
    paidAmount: roundCurrency(row.paid_amount ?? 0),
    paid_amount: roundCurrency(row.paid_amount ?? 0),
    status: row.payment_status || row.status || "partial",
    payment_status: row.payment_status || "partial",
    createdAt,
    created_at: row.created_at,
    closed_at: row.closed_at,
    concept: row.sale_number || row.metadata?.client_payload?.concept || "Venta pendiente",
    source: "supabase",
  };
}

export async function listAccountsReceivable(businessId) {
  const normalizedBusinessId = normalizeText(businessId);
  if (!normalizedBusinessId) return [];

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("sales")
    .select("id,business_id,customer_id,total,paid_amount,pending_amount,status,payment_status,sale_number,closed_at,created_at,metadata,customers(name)")
    .eq("business_id", normalizedBusinessId)
    .gt("pending_amount", 0)
    .not("payment_status", "in", "(cancelled,refunded)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeReceivable);
}

function normalizePayable(row = {}) {
  const pendingAmount = roundCurrency(row.pending_amount ?? 0);
  const createdAt = normalizeDate(row.created_at);

  return {
    id: row.id,
    business_id: row.business_id,
    supplier_id: row.supplier_id || null,
    supplierId: row.supplier_id || null,
    supplier_name: row.supplier_name || "Proveedor",
    supplierName: row.supplier_name || "Proveedor",
    purchase_id: row.purchase_id || null,
    purchaseId: row.purchase_id || null,
    concept: row.concept || "Compra a proveedor",
    originalAmount: roundCurrency(row.original_amount ?? 0),
    original_amount: roundCurrency(row.original_amount ?? 0),
    paidAmount: roundCurrency(row.paid_amount ?? 0),
    paid_amount: roundCurrency(row.paid_amount ?? 0),
    pendingAmount,
    pending_amount: pendingAmount,
    status: row.status || "pending",
    dueDate: row.due_date || null,
    due_date: row.due_date || null,
    createdAt,
    created_at: row.created_at,
    source: "supabase",
  };
}

export async function listAccountsPayable(businessId) {
  const normalizedBusinessId = normalizeText(businessId);
  if (!normalizedBusinessId) return [];

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("accounts_payable")
    .select("*")
    .eq("business_id", normalizedBusinessId)
    .not("status", "eq", "cancelled")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizePayable);
}
