import { normalizePaymentBreakdown } from "../../../utils/payments";

function normalizeText(value) {
  return String(value || "").trim();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getTimestampMillis(value) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getFirebaseMetadata(row = {}) {
  return row.metadata?.firebase && typeof row.metadata.firebase === "object"
    ? row.metadata.firebase
    : {};
}

function adaptSaleItem(row = {}) {
  const firebase = getFirebaseMetadata(row);
  return {
    ...firebase,
    id: row.id,
    productId: row.product_id || firebase.productId || firebase.product_id || null,
    product_id: row.product_id || firebase.product_id || firebase.productId || null,
    name: row.product_name || firebase.name || firebase.productName || firebase.product_name || "",
    productName: row.product_name || firebase.productName || firebase.product_name || "",
    product_name: row.product_name || firebase.product_name || firebase.productName || "",
    quantity: toNumber(row.quantity ?? firebase.quantity, 0),
    price: toNumber(row.unit_price ?? firebase.unitPrice ?? firebase.unit_price, 0),
    unitPrice: toNumber(row.unit_price ?? firebase.unitPrice ?? firebase.unit_price, 0),
    unit_price: toNumber(row.unit_price ?? firebase.unit_price ?? firebase.unitPrice, 0),
    subtotal: toNumber(row.subtotal ?? firebase.subtotal, 0),
    technicalSheetId: firebase.technicalSheetId || firebase.technical_sheet_id || null,
    technical_sheet_id: firebase.technical_sheet_id || firebase.technicalSheetId || null,
  };
}

function adaptPayment(row = {}) {
  const firebase = getFirebaseMetadata(row);
  return {
    ...firebase,
    id: row.id,
    sale_id: row.sale_id,
    saleId: row.sale_id,
    method: row.method || firebase.method || "cash",
    amount: toNumber(row.amount ?? firebase.amount, 0),
    reference: row.reference || firebase.reference || "",
    status: row.status || firebase.status || "completed",
    createdAt: row.created_at || firebase.createdAt || row.paid_at || null,
  };
}

function getPrimaryPaymentMethod(paymentBreakdown = [], fallback = "cash") {
  const validLines = paymentBreakdown.filter((line) => toNumber(line.amount) > 0);
  if (validLines.length > 1) return "split";
  return normalizeText(validLines[0]?.method || fallback || "cash") || "cash";
}

export function adaptSupabaseSale(row = {}) {
  const firebase = getFirebaseMetadata(row);
  const items = Array.isArray(row.sale_items) ? row.sale_items.map(adaptSaleItem) : [];
  const payments = Array.isArray(row.payments) ? row.payments.map(adaptPayment) : [];
  const fallbackMethod = firebase.payment_method || firebase.paymentMethod || payments[0]?.method || "cash";
  const paymentBreakdown = payments.length
    ? payments.map((payment) => ({
        method: payment.method || "cash",
        amount: toNumber(payment.amount),
        reference: payment.reference || "",
        status: payment.status || "completed",
      }))
    : normalizePaymentBreakdown(firebase.payment_breakdown || [], fallbackMethod, toNumber(row.total ?? firebase.total));
  const paymentMethod = getPrimaryPaymentMethod(paymentBreakdown, fallbackMethod);

  return {
    ...firebase,
    id: row.id,
    canonical_id: row.id,
    legacy_firebase_id: row.legacy_firebase_id || "",
    legacy_id: row.legacy_firebase_id || null,
    collection: "sales",
    business_id: row.business_id,
    businessId: row.business_id,
    sale_id: row.id,
    saleId: row.id,
    table_id: firebase.table_id || firebase.tableId || null,
    tableId: firebase.tableId || firebase.table_id || null,
    table_name: firebase.table_name || firebase.tableName || "",
    tableName: firebase.tableName || firebase.table_name || "",
    customer_id: row.customer_id || firebase.customer_id || firebase.customerId || null,
    customerId: row.customer_id || firebase.customerId || firebase.customer_id || null,
    customer_name: firebase.customer_name || firebase.customerName || "",
    customerName: firebase.customerName || firebase.customer_name || "",
    closing_id: row.cash_session_id || firebase.closing_id || null,
    cash_session_id: row.cash_session_id || firebase.cash_session_id || firebase.cashSessionId || null,
    cashSessionId: row.cash_session_id || firebase.cashSessionId || firebase.cash_session_id || null,
    order_id: firebase.order_id || firebase.orderId || null,
    orderId: firebase.orderId || firebase.order_id || null,
    closed_at: row.closed_at || firebase.closed_at || firebase.closedAt || row.created_at,
    createdAt: row.created_at || firebase.createdAt || null,
    updatedAt: row.updated_at || firebase.updatedAt || null,
    total: toNumber(row.total ?? firebase.total, 0),
    subtotal: toNumber(row.subtotal ?? firebase.subtotal, 0),
    paid_amount: toNumber(row.paid_amount ?? firebase.paid_amount ?? firebase.paidAmount, 0),
    paidAmount: toNumber(row.paid_amount ?? firebase.paidAmount ?? firebase.paid_amount, 0),
    pending_amount: toNumber(row.pending_amount ?? firebase.pending_amount ?? firebase.pendingAmount, 0),
    pendingAmount: toNumber(row.pending_amount ?? firebase.pendingAmount ?? firebase.pending_amount, 0),
    pending_debt_remaining: toNumber(row.pending_amount ?? firebase.pending_debt_remaining ?? firebase.debt_amount, 0),
    debt_amount: toNumber(row.pending_amount ?? firebase.debt_amount, 0),
    payment_method: paymentMethod,
    payment_label: paymentMethod === "split" ? "Pago dividido" : paymentMethod,
    payment_breakdown: paymentBreakdown,
    payment_status: row.payment_status || firebase.payment_status || firebase.paymentStatus || row.status || "paid",
    status: row.status || firebase.status || "paid",
    type: "income",
    items,
    payments,
    source: "supabase",
    _source: "supabase",
  };
}

export function adaptSupabaseSalesLedger(rows = []) {
  return rows
    .map(adaptSupabaseSale)
    .sort((left, right) => getTimestampMillis(right.closed_at || right.createdAt) - getTimestampMillis(left.closed_at || left.createdAt));
}
