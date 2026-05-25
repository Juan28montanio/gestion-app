import { normalizeCashSession, getCashSessionLockInfo } from "../../domain/cash";
import {
  closeCashSessionWithRpc,
  getOpenCashSession,
  listCashSessions,
  listCashMovements,
  openCashSessionWithRpc,
} from "../supabase/cashService";
import { getSupabaseClient } from "../../lib/supabaseClient";

export { getCashSessionLockInfo };

function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeMovementType(type) {
  const value = String(type || "").trim();
  if (value === "sale_income" || value === "debt_payment" || value === "debt_payment_income" || value === "manual_income") {
    return "Ingreso";
  }
  if (value === "purchase_expense" || value === "supplier_payment" || value === "operating_expense" || value === "operational_expense") {
    return "Egreso";
  }
  if (value === "opening") return "Apertura";
  if (value === "closing") return "Cierre";
  return value || "Movimiento";
}

export async function getCurrentOpenCashSession(businessId) {
  return normalizeCashSession(await getOpenCashSession(businessId));
}

export function subscribeToOpenCashSession(businessId, callback) {
  if (!businessId) {
    callback(null);
    return () => {};
  }

  const client = getSupabaseClient();
  const publish = () => {
    getCurrentOpenCashSession(businessId).then(callback).catch((error) => {
      console.error("[app:cashSession]", error);
      callback(null);
    });
  };

  const channel = client
    .channel(`app_cash_sessions:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cash_sessions",
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

export function subscribeToCashSessions(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  const publish = () => {
    listCashSessions(businessId)
      .then((sessions) => callback(sessions.map(normalizeCashSession)))
      .catch((error) => {
        console.error("[app:cashSessions]", error);
        callback([]);
      });
  };

  const channel = client
    .channel(`app_cash_sessions_list:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cash_sessions",
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

export async function openCashSession(businessId, options = {}) {
  return openCashSessionWithRpc({
    p_business_id: businessId,
    p_opening_amount: Number(options.openingAmount || options.opening_amount || 0),
    p_notes: String(options.notes || options.openingNotes || options.opening_notes || "").trim() || null,
  });
}

export async function closeCashSession({ businessId, closingId, cashCounted, context = {} }) {
  const sessionSummary = context.sessionSummary || {};
  const openSession = context.openSession || {};
  const sessionMovements = Array.isArray(context.sessionMovements) ? context.sessionMovements : [];
  const openedAt = normalizeDate(openSession.opened_at || openSession.openedAt || openSession.created_at);
  const closedAt = new Date();
  const result = await closeCashSessionWithRpc({
    p_business_id: businessId,
    p_cash_session_id: closingId,
    p_counted_amount: Number(cashCounted || 0),
    p_notes: String(context.notes || context.closingNotes || "").trim() || null,
  });
  const expectedAmount = Number(result?.expected_amount ?? sessionSummary.expectedCash ?? 0);
  const countedAmount = Number(result?.counted_amount ?? cashCounted ?? 0);
  const differenceAmount = Number(result?.difference_amount ?? countedAmount - expectedAmount);
  const byMethod = Object.keys(sessionSummary.incomeByMethod || {}).length
    ? sessionSummary.incomeByMethod
    : result?.payment_method_totals || {};
  const expenseByMethod = sessionSummary.expenseByMethod || {};
  const movementEntries = sessionMovements.map((movement) => ({
    type: normalizeMovementType(movement.type),
    concept: movement.description || movement.type || "Movimiento de caja",
    detail: movement.description || movement.metadata?.notes || "Movimiento registrado en Supabase",
    paymentMethod: movement.method || "cash",
    amount: Number(movement.amount || 0),
    at: normalizeDate(movement.created_at || movement.createdAt),
  }));

  return {
    businessName: context.businessName || "SmartProfit",
    operatorName: context.operatorName || "Operador SmartProfit",
    cashierEmail: context.cashierEmail || "",
    closingCode: `CIERRE-${new Date().toISOString().slice(0, 10)}`,
    openedAt,
    closedAt,
    openingAmount: Number(sessionSummary.openingAmount ?? openSession.opening_amount ?? 0),
    salesTotal: Number(sessionSummary.totalCollected || 0),
    expensesTotal: Number(sessionSummary.cashExpense || 0) + Number(sessionSummary.digitalExpense || 0),
    purchaseExpensesTotal: 0,
    operatingExpensesTotal: Number(sessionSummary.cashExpense || 0) + Number(sessionSummary.digitalExpense || 0),
    netBalance: Number(sessionSummary.totalCollected || 0) - Number(sessionSummary.cashExpense || 0) - Number(sessionSummary.digitalExpense || 0),
    totalCollected: Number(sessionSummary.totalCollected || 0),
    totalSalesCount: 0,
    ticketWalletUnits: 0,
    byMethod,
    expenseByMethod,
    movementEntries,
    auditEntries: [],
    purchaseSummary: { count: 0, total: 0 },
    cashExpected: expectedAmount,
    cashCounted: countedAmount,
    cashDifference: differenceAmount,
  };
}

export async function getCashMovements(businessId, cashSessionId = "") {
  return listCashMovements(businessId, cashSessionId);
}
