export const POS_PAYMENT_METHODS = {
  cash: {
    name: "Efectivo",
    methodKey: "cash",
    type: "physical_cash",
    affectsCashRegister: true,
    requiresReference: false,
    requiresCustomer: false,
    isDigital: false,
    isCredit: false,
    isNonCashConsumption: false,
    active: true,
  },
  debit_card: {
    name: "Tarjeta debito",
    methodKey: "debit_card",
    type: "card",
    affectsCashRegister: true,
    requiresReference: true,
    requiresCustomer: false,
    isDigital: true,
    isCredit: false,
    isNonCashConsumption: false,
    active: true,
  },
  credit_card: {
    name: "Tarjeta credito",
    methodKey: "credit_card",
    type: "card",
    affectsCashRegister: true,
    requiresReference: true,
    requiresCustomer: false,
    isDigital: true,
    isCredit: false,
    isNonCashConsumption: false,
    active: true,
  },
  card: {
    name: "Tarjeta",
    methodKey: "card",
    type: "card",
    affectsCashRegister: true,
    requiresReference: false,
    requiresCustomer: false,
    isDigital: true,
    isCredit: false,
    isNonCashConsumption: false,
    active: true,
  },
  transfer: {
    name: "Transferencia",
    methodKey: "transfer",
    type: "bank_transfer",
    affectsCashRegister: true,
    requiresReference: true,
    requiresCustomer: false,
    isDigital: true,
    isCredit: false,
    isNonCashConsumption: false,
    active: true,
  },
  nequi: {
    name: "Nequi",
    methodKey: "nequi",
    type: "wallet",
    affectsCashRegister: true,
    requiresReference: true,
    requiresCustomer: false,
    isDigital: true,
    isCredit: false,
    isNonCashConsumption: false,
    active: true,
  },
  daviplata: {
    name: "Daviplata",
    methodKey: "daviplata",
    type: "wallet",
    affectsCashRegister: true,
    requiresReference: true,
    requiresCustomer: false,
    isDigital: true,
    isCredit: false,
    isNonCashConsumption: false,
    active: true,
  },
  qr: {
    name: "QR",
    methodKey: "qr",
    type: "wallet",
    affectsCashRegister: true,
    requiresReference: true,
    requiresCustomer: false,
    isDigital: true,
    isCredit: false,
    isNonCashConsumption: false,
    active: true,
  },
  ticket: {
    name: "Tiquetera",
    methodKey: "ticket",
    type: "prepaid_consumption",
    affectsCashRegister: false,
    requiresReference: false,
    requiresCustomer: true,
    isDigital: false,
    isCredit: false,
    isNonCashConsumption: true,
    active: true,
  },
  ticket_wallet: {
    name: "Tiquetera",
    methodKey: "ticket_wallet",
    type: "prepaid_consumption",
    affectsCashRegister: false,
    requiresReference: false,
    requiresCustomer: true,
    isDigital: false,
    isCredit: false,
    isNonCashConsumption: true,
    active: true,
  },
  courtesy: {
    name: "Cortesia",
    methodKey: "courtesy",
    type: "courtesy",
    affectsCashRegister: false,
    requiresReference: false,
    requiresCustomer: false,
    isDigital: false,
    isCredit: false,
    isNonCashConsumption: true,
    active: true,
  },
  customer_credit: {
    name: "Cuenta por cobrar",
    methodKey: "customer_credit",
    type: "receivable",
    affectsCashRegister: false,
    requiresReference: false,
    requiresCustomer: true,
    isDigital: false,
    isCredit: true,
    isNonCashConsumption: true,
    active: true,
  },
  account_credit: {
    name: "Cuenta por cobrar",
    methodKey: "account_credit",
    type: "receivable",
    affectsCashRegister: false,
    requiresReference: false,
    requiresCustomer: true,
    isDigital: false,
    isCredit: true,
    isNonCashConsumption: true,
    active: true,
  },
};

export function roundCurrency(value) {
  return Number(Number(value || 0).toFixed(2));
}

export function normalizePosPaymentMethod(method) {
  const normalized = String(method || "").trim().toLowerCase();
  return normalized || "cash";
}

export function getPaymentMethodConfig(method) {
  return POS_PAYMENT_METHODS[normalizePosPaymentMethod(method)] || {
    name: normalizePosPaymentMethod(method),
    methodKey: normalizePosPaymentMethod(method),
    type: "other",
    affectsCashRegister: true,
    requiresReference: false,
    requiresCustomer: false,
    isDigital: false,
    isCredit: false,
    isNonCashConsumption: false,
    active: true,
  };
}

export function calculateSaleTotals(items = [], adjustments = {}) {
  const subtotal = roundCurrency(
    items.reduce((sum, item) => {
      const quantity = Number(item?.quantity || 0);
      const unitPrice = Number(item?.price ?? item?.unitPrice ?? 0);
      return sum + quantity * unitPrice;
    }, 0)
  );
  const discounts = roundCurrency(adjustments.discounts || 0);
  const taxes = roundCurrency(adjustments.taxes || 0);
  const total = Math.max(roundCurrency(subtotal - discounts + taxes), 0);

  return { subtotal, discounts, taxes, total };
}

export function calculatePaidAmount(payments = []) {
  return roundCurrency(
    payments
      .filter((payment) => {
        const config = getPaymentMethodConfig(payment?.method);
        return !config.isCredit && payment?.status !== "canceled" && payment?.status !== "refunded";
      })
      .reduce((sum, payment) => sum + Number(payment?.amount || 0), 0)
  );
}

export function calculatePendingAmount(total, paidAmount) {
  return Math.max(roundCurrency(Number(total || 0) - Number(paidAmount || 0)), 0);
}

export function calculateChange(total, payments = []) {
  const cashTendered = payments
    .filter((payment) => normalizePosPaymentMethod(payment?.method) === "cash")
    .reduce((sum, payment) => sum + Number(payment?.receivedAmount ?? payment?.cashReceived ?? payment?.amount ?? 0), 0);
  const paidAmount = calculatePaidAmount(payments);
  return Math.max(roundCurrency(cashTendered - Math.min(Number(total || 0), paidAmount)), 0);
}

export function splitPaymentByAmount(lines = []) {
  return lines
    .map((line) => ({
      ...line,
      method: normalizePosPaymentMethod(line?.method || line?.paymentMethod),
      amount: roundCurrency(line?.amount),
      status: line?.status || "completed",
    }))
    .filter((line) => line.method && line.amount > 0);
}

export function applyTicketPayment({ units = 0, coveredAmount = 0, customerId = "" } = {}) {
  const amount = roundCurrency(coveredAmount);
  if (amount <= 0 && Number(units || 0) <= 0) {
    return null;
  }

  return {
    method: "ticket_wallet",
    amount,
    ticketUnits: Number(units || 0),
    customerId,
    status: "completed",
  };
}

export function validatePayments({
  total = 0,
  payments = [],
  customerId = "",
  allowDebt = false,
  courtesyReason = "",
} = {}) {
  const normalizedPayments = splitPaymentByAmount(payments);
  const errors = [];
  const paidAmount = calculatePaidAmount(normalizedPayments);
  const pendingAmount = calculatePendingAmount(total, paidAmount);
  const hasCash = normalizedPayments.some((payment) => payment.method === "cash");

  normalizedPayments.forEach((payment) => {
    const config = getPaymentMethodConfig(payment.method);
    if (config.requiresCustomer && !customerId && !payment.customerId) {
      errors.push(`${config.name} requiere cliente asociado.`);
    }

    if (payment.method === "courtesy" && !courtesyReason) {
      errors.push("La cortesia requiere motivo.");
    }

    if (config.requiresReference && payment.requiresReference === true && !payment.reference) {
      errors.push(`${config.name} requiere referencia.`);
    }
  });

  if (pendingAmount > 0 && !allowDebt) {
    errors.push("La venta tiene saldo pendiente sin marcar deuda.");
  }

  if (pendingAmount > 0 && allowDebt && !customerId) {
    errors.push("La deuda requiere cliente asociado.");
  }

  if (paidAmount > Number(total || 0) && !hasCash) {
    errors.push("Solo el efectivo puede superar el total para generar cambio.");
  }

  return {
    ok: errors.length === 0,
    errors,
    paidAmount,
    pendingAmount,
    changeAmount: calculateChange(total, normalizedPayments),
  };
}

export function createCashMovementsFromPayments({
  businessId,
  cashSessionId,
  saleId,
  payments = [],
  createdBy,
  description = "Venta POS",
} = {}) {
  return payments
    .filter((payment) => getPaymentMethodConfig(payment.method).affectsCashRegister)
    .map((payment) => ({
      businessId,
      business_id: businessId,
      cashSessionId: cashSessionId || null,
      cash_session_id: cashSessionId || null,
      saleId,
      sale_id: saleId,
      paymentId: payment.id || null,
      payment_id: payment.id || null,
      type: "sale_income",
      method: payment.method,
      amount: roundCurrency(payment.amount),
      description,
      sourceType: "sale",
      source_type: "sale",
      sourceId: saleId,
      source_id: saleId,
      status: "valid",
      createdBy: createdBy || null,
      created_by: createdBy || null,
    }));
}

export function createAccountsReceivable({
  businessId,
  customerId,
  customerName,
  saleId,
  originalAmount,
  paidAmount,
  dueDate = null,
  notes = "",
} = {}) {
  const pendingAmount = calculatePendingAmount(originalAmount, paidAmount);
  if (pendingAmount <= 0) {
    return null;
  }

  if (!customerId) {
    throw new Error("No se puede crear cartera sin cliente.");
  }

  return {
    businessId,
    business_id: businessId,
    customerId,
    customer_id: customerId,
    customerName: customerName || "",
    customer_name: customerName || "",
    saleId,
    sale_id: saleId,
    originalAmount: roundCurrency(originalAmount),
    original_amount: roundCurrency(originalAmount),
    paidAmount: roundCurrency(paidAmount),
    paid_amount: roundCurrency(paidAmount),
    pendingAmount,
    pending_amount: pendingAmount,
    status: paidAmount > 0 ? "partial" : "pending",
    dueDate,
    due_date: dueDate,
    notes,
  };
}

export function registerDebtPayment({ pendingAmount, amount } = {}) {
  const normalizedPending = roundCurrency(pendingAmount);
  const normalizedAmount = roundCurrency(amount);

  if (normalizedAmount <= 0) {
    throw new Error("El abono debe ser mayor a cero.");
  }

  if (normalizedAmount > normalizedPending) {
    throw new Error("El abono no puede superar el saldo pendiente.");
  }

  const nextPending = roundCurrency(normalizedPending - normalizedAmount);
  return {
    paidAmount: normalizedAmount,
    pendingAmount: nextPending,
    status: nextPending <= 0 ? "paid" : "partial",
  };
}

export function applyInventoryFromSale() {
  return { inventoryImpactStatus: "pending" };
}

export function reverseSale({ reason = "", userId = "" } = {}) {
  if (!String(reason || "").trim()) {
    throw new Error("El motivo de anulacion es obligatorio.");
  }

  return {
    status: "canceled",
    cancelReason: reason,
    cancel_reason: reason,
    canceledBy: userId || null,
    canceled_by: userId || null,
  };
}

export function reversePayment({ reason = "", userId = "" } = {}) {
  if (!String(reason || "").trim()) {
    throw new Error("El motivo de anulacion del pago es obligatorio.");
  }

  return {
    status: "canceled",
    cancelReason: reason,
    cancel_reason: reason,
    canceledBy: userId || null,
    canceled_by: userId || null,
  };
}

export function canConfirmSale({ items = [], total = 0, payments = [], customerId = "", allowDebt = false } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, reason: "La venta debe tener al menos un item." };
  }

  if (Number(total || 0) < 0) {
    return { ok: false, reason: "El total no puede ser negativo." };
  }

  const validation = validatePayments({ total, payments, customerId, allowDebt });
  if (!validation.ok) {
    return { ok: false, reason: validation.errors[0] };
  }

  return { ok: true, reason: "" };
}

export function canCancelSale(sale) {
  const status = String(sale?.status || "").trim().toLowerCase();
  if (["canceled", "refunded"].includes(status)) {
    return { ok: false, reason: "La venta ya fue anulada o reembolsada." };
  }

  return { ok: true, reason: "" };
}
