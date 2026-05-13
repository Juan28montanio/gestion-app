import { collection, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import {
  calculatePaidAmount,
  calculatePendingAmount,
  createAccountsReceivable,
  createCashMovementsFromPayments,
  getPaymentMethodConfig,
  roundCurrency,
  splitPaymentByAmount,
} from "../utils/posFinance";

export function normalizeActor(actor = {}) {
  const id = String(actor.id || actor.uid || actor.userId || "").trim();
  const email = String(actor.email || "").trim();
  const name = String(actor.name || actor.displayName || actor.display_name || email || "Operador SmartProfit").trim();

  return { id, name, email };
}

function resolveSourceType({ tableId, paymentMethod, ticketGrantUnits = 0, ticketConsumptionUnits = 0, isDebtPayment = false }) {
  if (isDebtPayment) return "debt_payment";
  if (ticketGrantUnits > 0) return "ticket_sale";
  if (ticketConsumptionUnits > 0 && ["ticket_wallet", "ticket"].includes(paymentMethod)) return "ticket_consumption";
  if (String(tableId || "") === "quick-sale") return "quick_sale";
  return "table";
}

export function buildPosPaymentRecords({
  businessId,
  saleId,
  paymentBreakdown = [],
  paymentMethod,
  chargedTotal = 0,
  paymentAmount = chargedTotal,
  cashReceived = 0,
  ticketConsumption = {},
  customerId = "",
  cashSessionId = "",
  receivedBy = {},
}) {
  const normalized = splitPaymentByAmount(paymentBreakdown);
  const basePayments = normalized.length
    ? normalized
    : splitPaymentByAmount([{ method: paymentMethod, amount: paymentAmount }]);
  const ticketCoveredAmount = roundCurrency(ticketConsumption.coveredAmount || 0);
  const ticketUnits = Number(ticketConsumption.units || 0);
  const payments = [...basePayments];

  if (ticketUnits > 0 && ticketCoveredAmount > 0 && !payments.some((payment) => ["ticket_wallet", "ticket"].includes(payment.method))) {
    payments.push({
      method: "ticket_wallet",
      amount: ticketCoveredAmount,
      ticketUnits,
      status: "completed",
    });
  }

  return payments.map((payment) => {
    const paymentRef = doc(collection(db, "payments"));
    const config = getPaymentMethodConfig(payment.method);
    const status = config.isCredit ? "pending" : payment.status || "completed";

    return {
      id: paymentRef.id,
      ref: paymentRef,
      data: {
        businessId,
        business_id: businessId,
        saleId,
        sale_id: saleId,
        method: payment.method,
        amount: roundCurrency(payment.amount),
        reference: String(payment.reference || "").trim(),
        status,
        affectsCashRegister: config.affectsCashRegister,
        affects_cash_register: config.affectsCashRegister,
        cashSessionId: config.affectsCashRegister ? cashSessionId || null : null,
        cash_session_id: config.affectsCashRegister ? cashSessionId || null : null,
        customerId: payment.customerId || customerId || null,
        customer_id: payment.customerId || customerId || null,
        receivedBy,
        received_by: receivedBy,
        cashReceived: payment.method === "cash" ? roundCurrency(cashReceived || payment.amount) : 0,
        cash_received: payment.method === "cash" ? roundCurrency(cashReceived || payment.amount) : 0,
        changeAmount: payment.method === "cash" ? Math.max(roundCurrency((cashReceived || payment.amount) - payment.amount), 0) : 0,
        change_amount: payment.method === "cash" ? Math.max(roundCurrency((cashReceived || payment.amount) - payment.amount), 0) : 0,
        ticketUnits: Number(payment.ticketUnits || 0),
        ticket_units: Number(payment.ticketUnits || 0),
        createdAt: serverTimestamp(),
      },
    };
  });
}

export function buildPosSaleDocuments({
  businessId,
  orderId,
  orderData,
  tableId,
  tableName,
  tableSessionId,
  paymentMethod,
  paymentBreakdown,
  subtotal,
  chargedTotal,
  paymentAmount,
  cashReceived,
  ticketConsumption,
  ticketGrantUnits,
  customerId,
  customerName,
  cashSessionId,
  actor,
}) {
  const saleRef = doc(collection(db, "sales"));
  const resolvedActor = normalizeActor(actor);
  const sourceType = resolveSourceType({
    tableId,
    paymentMethod,
    ticketGrantUnits,
    ticketConsumptionUnits: Number(ticketConsumption?.units || 0),
  });
  const paymentRecords = buildPosPaymentRecords({
    businessId,
    saleId: saleRef.id,
    paymentBreakdown,
    paymentMethod,
    chargedTotal,
    paymentAmount,
    cashReceived,
    ticketConsumption,
    customerId,
    cashSessionId,
    receivedBy: resolvedActor,
  });
  const paidAmount = calculatePaidAmount(paymentRecords.map((payment) => payment.data));
  const pendingAmount = calculatePendingAmount(chargedTotal, paidAmount);
  const paymentStatus = pendingAmount <= 0 ? "paid" : paidAmount > 0 ? "partial" : "pending";
  const inventoryImpactStatus = ticketGrantUnits > 0 && Number(ticketConsumption?.units || 0) <= 0
    ? "not_applicable"
    : "pending";
  const saleItems = (orderData.items || []).map((item) => {
    const itemRef = doc(collection(db, "saleItems"));
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.price || 0);
    const isTicketSaleItem = String(item.product_type || item.productType || "").trim() === "ticket_wallet";

    return {
      ref: itemRef,
      data: {
        businessId,
        business_id: businessId,
        saleId: saleRef.id,
        sale_id: saleRef.id,
        productId: item.productId || item.id || null,
        product_id: item.productId || item.id || null,
        productName: item.name || "",
        product_name: item.name || "",
        quantity,
        unitPrice,
        unit_price: unitPrice,
        subtotal: roundCurrency(quantity * unitPrice),
        technicalSheetId: item.technicalSheetId || item.technical_sheet_id || null,
        technical_sheet_id: item.technicalSheetId || item.technical_sheet_id || null,
        inventoryImpactStatus: isTicketSaleItem ? "not_applicable" : inventoryImpactStatus,
        inventory_impact_status: isTicketSaleItem ? "not_applicable" : inventoryImpactStatus,
        sourceItemId: item.lineId || item.id || null,
        source_item_id: item.lineId || item.id || null,
        createdAt: serverTimestamp(),
      },
    };
  });
  const receivableData = createAccountsReceivable({
    businessId,
    customerId,
    customerName,
    saleId: saleRef.id,
    originalAmount: chargedTotal,
    paidAmount,
  });
  const receivableRef = receivableData ? doc(collection(db, "accountsReceivable")) : null;
  const paymentRowsForMovements = paymentRecords.map((payment) => ({ ...payment.data, id: payment.id }));
  const movementSeeds = createCashMovementsFromPayments({
    businessId,
    cashSessionId,
    saleId: saleRef.id,
    payments: paymentRowsForMovements,
    createdBy: resolvedActor,
    description: sourceType === "debt_payment" ? "Abono a cartera" : `Venta POS ${tableName || ""}`.trim(),
  });
  const cashMovementPaymentIds = paymentRowsForMovements
    .filter((payment) => getPaymentMethodConfig(payment.method).affectsCashRegister)
    .map((payment) => payment.id);
  const cashMovements = movementSeeds.map((movement, index) => {
    const movementRef = doc(collection(db, "cashMovements"));
    return {
      ref: movementRef,
      data: {
        ...movement,
        paymentId: cashMovementPaymentIds[index] || movement.paymentId || null,
        payment_id: cashMovementPaymentIds[index] || movement.payment_id || null,
        createdAt: serverTimestamp(),
      },
    };
  });

  return {
    saleRef,
    saleData: {
      businessId,
      business_id: businessId,
      sourceType,
      source_type: sourceType,
      sourceId: orderId || null,
      source_id: orderId || null,
      customerId: customerId || null,
      customer_id: customerId || null,
      customerName: customerName || "",
      customer_name: customerName || "",
      tableId: tableId || null,
      table_id: tableId || null,
      tableSessionId: tableSessionId || null,
      table_session_id: tableSessionId || null,
      orderId: orderId || null,
      order_id: orderId || null,
      waiterId: orderData.waiter_id || orderData.waiterId || null,
      waiter_id: orderData.waiter_id || orderData.waiterId || null,
      cashierId: resolvedActor.id || null,
      cashier_id: resolvedActor.id || null,
      status: paymentStatus === "paid" ? "paid" : paymentStatus,
      paymentStatus,
      payment_status: paymentStatus,
      subtotal: roundCurrency(subtotal),
      discounts: Math.max(roundCurrency(subtotal - chargedTotal), 0),
      taxes: 0,
      total: roundCurrency(chargedTotal),
      paidAmount,
      paid_amount: paidAmount,
      pendingAmount,
      pending_amount: pendingAmount,
      changeAmount: Math.max(roundCurrency((cashReceived || 0) - chargedTotal), 0),
      change_amount: Math.max(roundCurrency((cashReceived || 0) - chargedTotal), 0),
      notes: "",
      inventoryImpactStatus,
      inventory_impact_status: inventoryImpactStatus,
      cashSessionId: cashSessionId || null,
      cash_session_id: cashSessionId || null,
      createdBy: resolvedActor,
      created_by: resolvedActor,
      updatedBy: resolvedActor,
      updated_by: resolvedActor,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    saleItems,
    paymentRecords,
    cashMovements,
    receivable: receivableData && {
      ref: receivableRef,
      data: {
        ...receivableData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    },
  };
}

export function writePosSaleDocuments(transaction, documents) {
  transaction.set(documents.saleRef, documents.saleData);
  documents.saleItems.forEach((item) => transaction.set(item.ref, item.data));
  documents.paymentRecords.forEach((payment) => transaction.set(payment.ref, payment.data));
  documents.cashMovements.forEach((movement) => transaction.set(movement.ref, movement.data));
  if (documents.receivable) {
    transaction.set(documents.receivable.ref, documents.receivable.data);
  }
}
