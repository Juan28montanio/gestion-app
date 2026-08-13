import { normalizePaymentBreakdown } from "../utils/payments";
import {
  subscribeToSalesLedger as subscribeToAppSalesLedger,
} from "./app/salesGateway";
import { getSalesLedger as getSupabaseSalesLedger } from "./supabase/salesService";
import { getSupabaseClient } from "../lib/supabaseClient";

function normalizeText(value) {
  return String(value || "").trim();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getTimestampMillis(value) {
  if (!value) return 0;
  if (value?.toMillis) return value.toMillis();
  if (value?.toDate) return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isActivePayment(payment = {}) {
  const status = normalizeText(payment.status || "completed").toLowerCase();
  return !["canceled", "cancelled", "refunded"].includes(status);
}

function getPrimaryPaymentMethod(paymentBreakdown = [], fallback = "cash") {
  const validLines = paymentBreakdown.filter((line) => toNumber(line.amount) > 0);
  if (validLines.length > 1) return "split";
  return normalizeText(validLines[0]?.method || fallback || "cash") || "cash";
}

function indexBySaleId(rows = []) {
  return rows.reduce((index, row) => {
    const saleId = normalizeText(row.sale_id || row.saleId);
    if (!saleId) return index;
    const current = index.get(saleId) || [];
    current.push(row);
    index.set(saleId, current);
    return index;
  }, new Map());
}

function buildCanonicalSale(sale, { items = [], payments = [], legacy = null } = {}) {
  const activePayments = payments.filter(isActivePayment);
  const fallbackMethod = sale.payment_method || sale.paymentMethod || legacy?.payment_method || "cash";
  const paymentBreakdown = activePayments.length
    ? activePayments.map((payment) => ({
        method: payment.method || "cash",
        amount: toNumber(payment.amount),
        reference: payment.reference || "",
        status: payment.status || "completed",
      }))
    : normalizePaymentBreakdown(
        legacy?.payment_breakdown || sale.payment_breakdown || [],
        fallbackMethod,
        toNumber(sale.total)
      );
  const paymentMethod = getPrimaryPaymentMethod(paymentBreakdown, fallbackMethod);
  const legacyItems = Array.isArray(legacy?.items) ? legacy.items : [];
  const normalizedItems = items.length
    ? items.map((item) => ({
        id: item.id,
        productId: item.productId || item.product_id || null,
        product_id: item.product_id || item.productId || null,
        name: item.productName || item.product_name || item.name || "",
        productName: item.productName || item.product_name || item.name || "",
        product_name: item.product_name || item.productName || item.name || "",
        quantity: toNumber(item.quantity),
        price: toNumber(item.unitPrice ?? item.unit_price),
        unitPrice: toNumber(item.unitPrice ?? item.unit_price),
        unit_price: toNumber(item.unit_price ?? item.unitPrice),
        subtotal: toNumber(item.subtotal),
        technicalSheetId: item.technicalSheetId || item.technical_sheet_id || null,
        technical_sheet_id: item.technical_sheet_id || item.technicalSheetId || null,
      }))
    : legacyItems;

  return {
    ...legacy,
    ...sale,
    id: sale.id,
    canonical_id: sale.id,
    legacy_id: legacy?.id || null,
    collection: "sales",
    business_id: sale.business_id || sale.businessId || legacy?.business_id || "",
    businessId: sale.businessId || sale.business_id || legacy?.businessId || "",
    sale_id: sale.id,
    saleId: sale.id,
    table_id: sale.table_id || sale.tableId || legacy?.table_id || null,
    tableId: sale.tableId || sale.table_id || legacy?.tableId || null,
    table_name: sale.table_name || sale.tableName || legacy?.table_name || "",
    tableName: sale.tableName || sale.table_name || legacy?.tableName || "",
    customer_id: sale.customer_id || sale.customerId || legacy?.customer_id || null,
    customerId: sale.customerId || sale.customer_id || legacy?.customerId || null,
    customer_name: sale.customer_name || sale.customerName || legacy?.customer_name || "",
    customerName: sale.customerName || sale.customer_name || legacy?.customerName || "",
    closing_id: sale.cash_session_id || sale.cashSessionId || legacy?.closing_id || null,
    cash_session_id: sale.cash_session_id || sale.cashSessionId || legacy?.closing_id || null,
    order_id: sale.order_id || sale.orderId || legacy?.order_id || null,
    orderId: sale.orderId || sale.order_id || legacy?.orderId || null,
    closed_at: sale.closed_at || sale.closedAt || sale.createdAt || legacy?.closed_at || legacy?.createdAt,
    total: toNumber(sale.total ?? legacy?.total),
    subtotal: toNumber(sale.subtotal ?? legacy?.subtotal),
    paid_amount: toNumber(sale.paid_amount ?? sale.paidAmount ?? legacy?.paid_amount),
    pending_debt_remaining: toNumber(sale.pending_amount ?? sale.pendingAmount ?? legacy?.pending_debt_remaining ?? legacy?.debt_amount),
    debt_amount: toNumber(sale.pending_amount ?? sale.pendingAmount ?? legacy?.debt_amount),
    payment_method: paymentMethod,
    payment_label: paymentMethod === "split" ? "Pago dividido" : paymentMethod,
    payment_breakdown: paymentBreakdown,
    payment_status: sale.payment_status || sale.paymentStatus || legacy?.payment_status || sale.status || "paid",
    type: "income",
    items: normalizedItems,
    source: "canonical",
  };
}

function buildLegacyOnlySale(sale) {
  return {
    ...sale,
    collection: "sales_history",
    canonical_id: null,
    legacy_id: sale.id,
    sale_id: sale.sale_id || sale.id,
    saleId: sale.sale_id || sale.id,
    source: "legacy",
  };
}

export function buildSalesLedger({ sales = [], saleItems = [], payments = [], legacySales = [] } = {}) {
  const itemsBySale = indexBySaleId(saleItems);
  const paymentsBySale = indexBySaleId(payments);
  const legacyByCanonicalSale = legacySales.reduce((index, sale) => {
    const canonicalSaleId = normalizeText(sale.sale_id || sale.saleId);
    if (canonicalSaleId) index.set(canonicalSaleId, sale);
    return index;
  }, new Map());
  const canonicalIds = new Set(sales.map((sale) => sale.id));
  const canonicalRows = sales
    .filter((sale) => normalizeText(sale.status).toLowerCase() !== "canceled")
    .map((sale) =>
      buildCanonicalSale(sale, {
        items: itemsBySale.get(sale.id) || [],
        payments: paymentsBySale.get(sale.id) || [],
        legacy: legacyByCanonicalSale.get(sale.id) || null,
      })
    );
  const legacyRows = legacySales
    .filter((sale) => !canonicalIds.has(normalizeText(sale.sale_id || sale.saleId)))
    .filter((sale) => normalizeText(sale.type || "income") === "income")
    .map(buildLegacyOnlySale);

  return [...canonicalRows, ...legacyRows].sort(
    (left, right) => getTimestampMillis(right.closed_at || right.createdAt) - getTimestampMillis(left.closed_at || left.createdAt)
  );
}

export async function getSalesLedger(businessId) {
  return getSupabaseSalesLedger(businessId);

}

export function subscribeToSalesLedger(businessId, callback) {
  return subscribeToAppSalesLedger(businessId, callback);

}

export function subscribeToSalesHistory(businessId, callback) {
  return subscribeToSalesLedger(businessId, callback);
}

export async function updateSaleHistoryEntry(saleId, updates = {}) {
  const normalizedSaleId = normalizeText(saleId);
  if (!normalizedSaleId) {
    throw new Error("La venta a editar es obligatoria.");
  }

  const client = getSupabaseClient();
  const nextTotal = Number(updates.total);
  const nextMethod = normalizeText(updates.paymentMethod);
  const payload = {};

  if (Number.isFinite(nextTotal) && nextTotal >= 0) {
    payload.total = nextTotal;
    payload.paid_amount = nextTotal;
    payload.pending_amount = 0;
  }

  if (normalizeText(updates.concept)) {
    payload.metadata = {
      firebase: {
        concept: normalizeText(updates.concept),
      },
    };
  }

  if (Object.keys(payload).length) {
    const { error } = await client.from("sales").update(payload).eq("id", normalizedSaleId);
    if (error) throw error;
  }

  if (nextMethod) {
    const { data: payments, error: paymentReadError } = await client
      .from("payments")
      .select("id")
      .eq("sale_id", normalizedSaleId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (paymentReadError) throw paymentReadError;

    const paymentId = payments?.[0]?.id;
    if (paymentId) {
      const paymentPayload = { method: nextMethod };
      if (Number.isFinite(nextTotal) && nextTotal >= 0) {
        paymentPayload.amount = nextTotal;
      }

      const { error: paymentError } = await client
        .from("payments")
        .update(paymentPayload)
        .eq("id", paymentId);

      if (paymentError) throw paymentError;
    }
  }
}
