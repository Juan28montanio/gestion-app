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
  const result = await closeCashSessionWithRpc({
    p_business_id: businessId,
    p_cash_session_id: closingId,
    p_counted_amount: Number(cashCounted || 0),
    p_notes: String(context.notes || context.closingNotes || "").trim() || null,
  });

  return {
    businessName: context.businessName || "SmartProfit",
    operatorName: context.operatorName || "Operador SmartProfit",
    cashierEmail: context.cashierEmail || "",
    closingCode: `CIERRE-${new Date().toISOString().slice(0, 10)}`,
    openedAt: null,
    closedAt: new Date(),
    openingAmount: 0,
    salesTotal: 0,
    expensesTotal: 0,
    purchaseExpensesTotal: 0,
    operatingExpensesTotal: 0,
    netBalance: 0,
    totalCollected: 0,
    totalSalesCount: 0,
    ticketWalletUnits: 0,
    byMethod: {},
    movementEntries: [],
    auditEntries: [],
    purchaseSummary: { count: 0, total: 0 },
    cashExpected: Number(result?.expected_amount || 0),
    cashCounted: Number(result?.counted_amount || cashCounted || 0),
    cashDifference: Number(result?.difference_amount || 0),
  };
}

export async function getCashMovements(businessId, cashSessionId = "") {
  return listCashMovements(businessId, cashSessionId);
}
