import {
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const orderPaymentsCollection = collection(db, "order_payments");
const cashMovementsCollection = collection(db, "cash_movements");

export function getOrderPaymentsCollection() {
  return orderPaymentsCollection;
}

export function getCashMovementsCollection() {
  return cashMovementsCollection;
}

export function buildOrderPaymentPayload({
  businessId,
  saleId,
  orderId,
  customerId = null,
  customerName = "",
  tableId = null,
  tableName = "",
  paymentMethod,
  amount,
  closingId = null,
  paymentKind = "order_payment",
  status = "posted",
  affectsCashDrawer = false,
  affectsCashflow = true,
  metadata = {},
}) {
  return {
    business_id: businessId,
    sale_id: saleId || null,
    order_id: orderId || null,
    customer_id: customerId || null,
    customer_name: customerName || "",
    table_id: tableId || null,
    table_name: tableName || "",
    payment_method: String(paymentMethod || "cash").trim() || "cash",
    amount: Number(amount || 0),
    closing_id: closingId || null,
    payment_kind,
    status,
    affects_cash_drawer: Boolean(affectsCashDrawer),
    affects_cashflow: Boolean(affectsCashflow),
    metadata,
    recorded_at: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export function buildCashMovementPayload({
  businessId,
  saleId,
  orderId,
  paymentId,
  customerId = null,
  customerName = "",
  tableId = null,
  tableName = "",
  paymentMethod,
  amount,
  closingId = null,
  sourceType = "order_payment",
  concept = "Movimiento de caja",
  metadata = {},
}) {
  const normalizedMethod = String(paymentMethod || "cash").trim() || "cash";
  return {
    business_id: businessId,
    sale_id: saleId || null,
    order_id: orderId || null,
    payment_id: paymentId || null,
    customer_id: customerId || null,
    customer_name: customerName || "",
    table_id: tableId || null,
    table_name: tableName || "",
    type: "income",
    payment_method: normalizedMethod,
    amount: Number(amount || 0),
    source_type: sourceType,
    concept,
    closing_id: closingId || null,
    affects_cash_drawer: normalizedMethod === "cash",
    metadata,
    occurred_at: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export function subscribeToOrderPayments(orderId, callback) {
  const normalizedOrderId = String(orderId || "").trim();
  if (!normalizedOrderId) {
    callback([]);
    return () => {};
  }

  const paymentsQuery = query(
    orderPaymentsCollection,
    where("order_id", "==", normalizedOrderId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(paymentsQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  });
}

export function subscribeToCashMovements(businessId, callback) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) {
    callback([]);
    return () => {};
  }

  const movementsQuery = query(
    cashMovementsCollection,
    where("business_id", "==", normalizedBusinessId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(movementsQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  });
}
