import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { createSubscriptionErrorHandler } from "./subscriptionService";
import { getCurrentOpenCashSession } from "./cashClosingService";
import { getPaymentMethodConfig, roundCurrency } from "../utils/posFinance";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeActor(actor = {}) {
  const id = normalizeText(actor.id || actor.uid || actor.userId);
  const email = normalizeText(actor.email);
  const name = normalizeText(actor.name || actor.displayName || actor.display_name || email || "Operador SmartProfit");
  return { id, name, email };
}

function sortByCreatedAt(items = []) {
  return [...items].sort((left, right) => {
    const leftTime = left.createdAt?.toMillis?.() || left.created_at?.toMillis?.() || 0;
    const rightTime = right.createdAt?.toMillis?.() || right.created_at?.toMillis?.() || 0;
    return rightTime - leftTime;
  });
}

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

export function summarizeCashSession(session, movements = []) {
  const validMovements = movements.filter((movement) => {
    const status = normalizeText(movement.status || "valid").toLowerCase();
    return !["canceled", "cancelled", "reversed"].includes(status);
  });
  const openingAmount = Number(session?.openingAmount ?? session?.opening_amount ?? 0);
  const cashIncome = validMovements
    .filter((movement) => movement.method === "cash" && ["sale_income", "debt_payment_income", "manual_income"].includes(movement.type))
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const digitalIncome = validMovements
    .filter((movement) => movement.method !== "cash" && ["sale_income", "debt_payment_income", "manual_income"].includes(movement.type))
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const cashExpense = validMovements
    .filter((movement) => movement.method === "cash" && ["purchase_expense", "supplier_payment", "operational_expense"].includes(movement.type))
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const digitalExpense = validMovements
    .filter((movement) => movement.method !== "cash" && ["purchase_expense", "supplier_payment", "operational_expense"].includes(movement.type))
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
    cashExpense,
    digitalExpense,
    refunds,
    withdrawals,
    adjustments,
    expectedCash,
    byMethod: groupMovementsByMethod(validMovements),
    movementCount: validMovements.length,
  };
}

export function subscribeToCashMovements(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const movementsQuery = query(collection(db, "cashMovements"), where("business_id", "==", businessId));
  return onSnapshot(movementsQuery, (snapshot) => {
    callback(sortByCreatedAt(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))));
  }, createSubscriptionErrorHandler({
    scope: "cashMovements:subscribeToCashMovements",
    callback,
    emptyValue: [],
  }));
}

export function subscribeToAccountsReceivable(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const receivablesQuery = query(collection(db, "accountsReceivable"), where("business_id", "==", businessId));
  return onSnapshot(receivablesQuery, (snapshot) => {
    callback(sortByCreatedAt(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))));
  }, createSubscriptionErrorHandler({
    scope: "accountsReceivable:subscribeToAccountsReceivable",
    callback,
    emptyValue: [],
  }));
}

export function subscribeToAccountsPayable(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const payablesQuery = query(collection(db, "accountsPayable"), where("business_id", "==", businessId));
  return onSnapshot(payablesQuery, (snapshot) => {
    callback(sortByCreatedAt(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))));
  }, createSubscriptionErrorHandler({
    scope: "accountsPayable:subscribeToAccountsPayable",
    callback,
    emptyValue: [],
  }));
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

  const openSession = await getCurrentOpenCashSession(normalizedBusinessId);
  if (!openSession) {
    throw new Error("Debes abrir caja antes de registrar un pago a proveedor.");
  }

  return runTransaction(db, async (transaction) => {
    const payableRef = doc(db, "accountsPayable", normalizedPayableId);
    const payableSnapshot = await transaction.get(payableRef);

    if (!payableSnapshot.exists()) {
      throw new Error("La cuenta por pagar no existe.");
    }

    const payable = payableSnapshot.data();
    if (normalizeText(payable.business_id || payable.businessId) !== normalizedBusinessId) {
      throw new Error("La cuenta por pagar no pertenece al negocio activo.");
    }

    const pendingAmount = Number(payable.pendingAmount ?? payable.pending_amount ?? 0);
    if (paymentAmount > pendingAmount) {
      throw new Error("El pago no puede superar el saldo pendiente.");
    }

    const paidAmount = roundCurrency(Number(payable.paidAmount ?? payable.paid_amount ?? 0) + paymentAmount);
    const nextPending = roundCurrency(pendingAmount - paymentAmount);
    const nextStatus = nextPending <= 0 ? "paid" : "partial";
    const resolvedActor = normalizeActor(actor);
    const payablePaymentRef = doc(collection(db, "payablePayments"));
    const paymentConfig = getPaymentMethodConfig(normalizedMethod);
    const cashMovementRef = paymentConfig.affectsCashRegister ? doc(collection(db, "cashMovements")) : null;

    transaction.update(payableRef, {
      paidAmount,
      paid_amount: paidAmount,
      pendingAmount: nextPending,
      pending_amount: nextPending,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });

    transaction.set(payablePaymentRef, {
      businessId: normalizedBusinessId,
      business_id: normalizedBusinessId,
      accountPayableId: normalizedPayableId,
      account_payable_id: normalizedPayableId,
      supplierId: payable.supplierId || payable.supplier_id || null,
      supplier_id: payable.supplier_id || payable.supplierId || null,
      amount: paymentAmount,
      method: normalizedMethod,
      reference: normalizeText(reference),
      paidBy: resolvedActor,
      paid_by: resolvedActor,
      cashSessionId: openSession.id,
      cash_session_id: openSession.id,
      createdAt: serverTimestamp(),
    });

    if (cashMovementRef) {
      transaction.set(cashMovementRef, {
        businessId: normalizedBusinessId,
        business_id: normalizedBusinessId,
        cashSessionId: openSession.id,
        cash_session_id: openSession.id,
        purchaseId: payable.purchaseId || payable.purchase_id || null,
        purchase_id: payable.purchase_id || payable.purchaseId || null,
        payableId: normalizedPayableId,
        payable_id: normalizedPayableId,
        type: "supplier_payment",
        method: normalizedMethod,
        amount: paymentAmount,
        description: `Pago proveedor ${payable.supplierName || payable.supplier_name || ""}`.trim(),
        sourceType: "account_payable",
        source_type: "account_payable",
        sourceId: normalizedPayableId,
        source_id: normalizedPayableId,
        status: "valid",
        createdBy: resolvedActor,
        created_by: resolvedActor,
        createdAt: serverTimestamp(),
      });
    }

    transaction.set(doc(collection(db, "auditLogs")), {
      business_id: normalizedBusinessId,
      businessId: normalizedBusinessId,
      user_id: resolvedActor.id,
      userId: resolvedActor.id,
      user_name: resolvedActor.name,
      userName: resolvedActor.name,
      module: "finance",
      action: "payable.payment",
      entity_type: "accountsPayable",
      entityType: "accountsPayable",
      entity_id: normalizedPayableId,
      entityId: normalizedPayableId,
      previousValue: payable,
      newValue: { paidAmount, pendingAmount: nextPending, status: nextStatus },
      reason: "Pago a proveedor",
      createdAt: serverTimestamp(),
    });

    return payablePaymentRef.id;
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

  const openSession = await getCurrentOpenCashSession(normalizedBusinessId);
  if (!openSession) {
    throw new Error("Debes abrir caja antes de registrar un abono de cartera.");
  }

  return runTransaction(db, async (transaction) => {
    const receivableRef = doc(db, "accountsReceivable", normalizedReceivableId);
    const receivableSnapshot = await transaction.get(receivableRef);

    if (!receivableSnapshot.exists()) {
      throw new Error("La cuenta por cobrar no existe.");
    }

    const receivable = receivableSnapshot.data();
    if (normalizeText(receivable.business_id || receivable.businessId) !== normalizedBusinessId) {
      throw new Error("La cuenta por cobrar no pertenece al negocio activo.");
    }

    const pendingAmount = Number(receivable.pendingAmount ?? receivable.pending_amount ?? 0);
    if (paymentAmount > pendingAmount) {
      throw new Error("El abono no puede superar el saldo pendiente.");
    }

    const paidAmount = roundCurrency(Number(receivable.paidAmount ?? receivable.paid_amount ?? 0) + paymentAmount);
    const nextPending = roundCurrency(pendingAmount - paymentAmount);
    const nextStatus = nextPending <= 0 ? "paid" : "partial";
    const resolvedActor = normalizeActor(actor);
    const paymentConfig = getPaymentMethodConfig(normalizedMethod);
    const paymentRef = doc(collection(db, "payments"));
    const receivablePaymentRef = doc(collection(db, "receivablePayments"));
    const cashMovementRef = paymentConfig.affectsCashRegister ? doc(collection(db, "cashMovements")) : null;

    transaction.update(receivableRef, {
      paidAmount,
      paid_amount: paidAmount,
      pendingAmount: nextPending,
      pending_amount: nextPending,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });

    transaction.set(paymentRef, {
      businessId: normalizedBusinessId,
      business_id: normalizedBusinessId,
      saleId: receivable.saleId || receivable.sale_id || null,
      sale_id: receivable.sale_id || receivable.saleId || null,
      method: normalizedMethod,
      amount: paymentAmount,
      reference: normalizeText(reference),
      status: "completed",
      affectsCashRegister: paymentConfig.affectsCashRegister,
      affects_cash_register: paymentConfig.affectsCashRegister,
      cashSessionId: paymentConfig.affectsCashRegister ? openSession.id : null,
      cash_session_id: paymentConfig.affectsCashRegister ? openSession.id : null,
      customerId: receivable.customerId || receivable.customer_id || null,
      customer_id: receivable.customer_id || receivable.customerId || null,
      receivedBy: resolvedActor,
      received_by: resolvedActor,
      createdAt: serverTimestamp(),
    });

    transaction.set(receivablePaymentRef, {
      businessId: normalizedBusinessId,
      business_id: normalizedBusinessId,
      accountReceivableId: normalizedReceivableId,
      account_receivable_id: normalizedReceivableId,
      customerId: receivable.customerId || receivable.customer_id || null,
      customer_id: receivable.customer_id || receivable.customerId || null,
      amount: paymentAmount,
      method: normalizedMethod,
      reference: normalizeText(reference),
      receivedBy: resolvedActor,
      received_by: resolvedActor,
      paymentId: paymentRef.id,
      payment_id: paymentRef.id,
      cashSessionId: openSession.id,
      cash_session_id: openSession.id,
      createdAt: serverTimestamp(),
    });

    if (cashMovementRef) {
      transaction.set(cashMovementRef, {
        businessId: normalizedBusinessId,
        business_id: normalizedBusinessId,
        cashSessionId: openSession.id,
        cash_session_id: openSession.id,
        saleId: receivable.saleId || receivable.sale_id || null,
        sale_id: receivable.sale_id || receivable.saleId || null,
        paymentId: paymentRef.id,
        payment_id: paymentRef.id,
        receivableId: normalizedReceivableId,
        receivable_id: normalizedReceivableId,
        type: "debt_payment_income",
        method: normalizedMethod,
        amount: paymentAmount,
        description: `Abono cartera ${receivable.customerName || receivable.customer_name || ""}`.trim(),
        sourceType: "account_receivable",
        source_type: "account_receivable",
        sourceId: normalizedReceivableId,
        source_id: normalizedReceivableId,
        status: "valid",
        createdBy: resolvedActor,
        created_by: resolvedActor,
        createdAt: serverTimestamp(),
      });
    }

    transaction.set(doc(collection(db, "auditLogs")), {
      business_id: normalizedBusinessId,
      businessId: normalizedBusinessId,
      user_id: resolvedActor.id,
      userId: resolvedActor.id,
      user_name: resolvedActor.name,
      userName: resolvedActor.name,
      module: "finance",
      action: "receivable.payment",
      entity_type: "accountsReceivable",
      entityType: "accountsReceivable",
      entity_id: normalizedReceivableId,
      entityId: normalizedReceivableId,
      previousValue: receivable,
      newValue: { paidAmount, pendingAmount: nextPending, status: nextStatus },
      reason: "Abono de cartera",
      createdAt: serverTimestamp(),
    });

    return receivablePaymentRef.id;
  });
}

export async function reverseCashMovement({ movementId, reason, actor = {} }) {
  const normalizedMovementId = normalizeText(movementId);
  const normalizedReason = normalizeText(reason);

  if (!normalizedMovementId || !normalizedReason) {
    throw new Error("El movimiento y el motivo son obligatorios.");
  }

  await runTransaction(db, async (transaction) => {
    const movementRef = doc(db, "cashMovements", normalizedMovementId);
    const movementSnapshot = await transaction.get(movementRef);

    if (!movementSnapshot.exists()) {
      throw new Error("El movimiento de caja no existe.");
    }

    const movement = movementSnapshot.data();
    const resolvedActor = normalizeActor(actor);
    transaction.update(movementRef, {
      status: "reversed",
      reversedAt: serverTimestamp(),
      reversed_at: serverTimestamp(),
      reverseReason: normalizedReason,
      reverse_reason: normalizedReason,
      reversedBy: resolvedActor,
      reversed_by: resolvedActor,
      updatedAt: serverTimestamp(),
    });

    transaction.set(doc(collection(db, "auditLogs")), {
      business_id: movement.business_id || movement.businessId || "",
      businessId: movement.business_id || movement.businessId || "",
      user_id: resolvedActor.id,
      userId: resolvedActor.id,
      user_name: resolvedActor.name,
      userName: resolvedActor.name,
      module: "cash",
      action: "cashMovement.reverse",
      entity_type: "cashMovements",
      entityType: "cashMovements",
      entity_id: normalizedMovementId,
      entityId: normalizedMovementId,
      previousValue: movement,
      newValue: { status: "reversed" },
      reason: normalizedReason,
      createdAt: serverTimestamp(),
    });
  });
}

export async function getAccountPayable(accountPayableId) {
  const normalizedPayableId = normalizeText(accountPayableId);
  if (!normalizedPayableId) return null;

  const snapshot = await getDoc(doc(db, "accountsPayable", normalizedPayableId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}
