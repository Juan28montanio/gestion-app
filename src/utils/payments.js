export const PAYMENT_METHOD_LABELS = {
  all: "Todos",
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  nequi: "Nequi",
  daviplata: "Daviplata",
  ticket_wallet: "Tiquetera",
  split: "Pago dividido",
  expense: "Compra",
};

export function createEmptyPaymentTotals() {
  return {
    cash: 0,
    card: 0,
    transfer: 0,
    nequi: 0,
    daviplata: 0,
    ticket_wallet: 0,
  };
}

function normalizeMethod(method) {
  const normalized = String(method || "").trim().toLowerCase();
  return normalized || "cash";
}

function roundCurrency(value) {
  return Number(Number(value || 0).toFixed(2));
}

export function normalizePaymentBreakdown(paymentBreakdown = [], fallbackMethod = "cash", fallbackAmount = 0) {
  const lines = Array.isArray(paymentBreakdown)
    ? paymentBreakdown
        .map((line) => ({
          method: normalizeMethod(line?.method || line?.paymentMethod),
          amount: roundCurrency(line?.amount),
        }))
        .filter((line) => line.method && line.amount > 0)
    : [];

  if (lines.length > 0) {
    return lines;
  }

  const amount = roundCurrency(fallbackAmount);
  const method = normalizeMethod(fallbackMethod);

  if (amount <= 0 && method !== "ticket_wallet") {
    return [];
  }

  return [{ method, amount }];
}

export function getPrimaryPaymentMethod(paymentBreakdown = [], fallbackMethod = "cash", fallbackAmount = 0) {
  const normalized = normalizePaymentBreakdown(paymentBreakdown, fallbackMethod, fallbackAmount);
  if (normalized.length > 1) {
    return "split";
  }

  return normalized[0]?.method || normalizeMethod(fallbackMethod);
}

export function accumulatePaymentBreakdown(
  totals,
  paymentBreakdown = [],
  fallbackMethod = "cash",
  fallbackAmount = 0
) {
  const target = totals || createEmptyPaymentTotals();
  const normalized = normalizePaymentBreakdown(paymentBreakdown, fallbackMethod, fallbackAmount);

  normalized.forEach((line) => {
    target[line.method] = roundCurrency((target[line.method] || 0) + line.amount);
  });

  return target;
}

export function paymentBreakdownIncludesMethod(
  paymentBreakdown = [],
  method,
  fallbackMethod = "cash",
  fallbackAmount = 0
) {
  if (!method || method === "all") {
    return true;
  }

  return normalizePaymentBreakdown(paymentBreakdown, fallbackMethod, fallbackAmount).some(
    (line) => line.method === method
  );
}
