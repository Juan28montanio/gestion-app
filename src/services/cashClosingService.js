import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const cashClosingsCollection = collection(db, "cash_closings");
const salesHistoryCollection = collection(db, "sales_history");
const purchasesCollection = collection(db, "purchases");

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  if (value?.toDate) {
    return value.toDate();
  }

  if (typeof value === "string") {
    const [year, month, day] = value.split("-").map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

export function getCashSessionLockInfo(session) {
  if (!session) {
    return {
      blocked: true,
      reason: "no_open_session",
      message: "Debes abrir caja para comenzar a cobrar en esta jornada.",
    };
  }

  const openedAt = normalizeDate(session.opened_at || session.createdAt);
  const now = new Date();
  const todayKey = getLocalDateKey(now);
  const sessionDateKey = session.opened_date_key || getLocalDateKey(openedAt || now);
  const hoursOpen = openedAt ? (now.getTime() - openedAt.getTime()) / 36e5 : 0;

  if (session.status === "open" && sessionDateKey !== todayKey) {
    return {
      blocked: true,
      reason: "previous_day_open",
      message: "Debe realizar el cierre de caja anterior para iniciar una nueva jornada.",
      hoursOpen,
    };
  }

  if (session.status === "open" && hoursOpen >= 12) {
    return {
      blocked: true,
      reason: "too_long_open",
      message: "Debe realizar el cierre de caja anterior para iniciar una nueva jornada.",
      hoursOpen,
    };
  }

  return {
    blocked: false,
    reason: "ok",
    message: "",
    hoursOpen,
  };
}

export function subscribeToOpenCashSession(businessId, callback) {
  if (!businessId) {
    callback(null);
    return () => {};
  }

  const closingsQuery = query(
    cashClosingsCollection,
    where("business_id", "==", businessId),
    where("status", "==", "open")
  );

  return onSnapshot(closingsQuery, (snapshot) => {
    const sessions = snapshot.docs
      .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
      .sort((a, b) => {
        const aTime = normalizeDate(a.opened_at || a.createdAt)?.getTime?.() || 0;
        const bTime = normalizeDate(b.opened_at || b.createdAt)?.getTime?.() || 0;
        return bTime - aTime;
      });

    callback(sessions[0] || null);
  });
}

export function subscribeToCashClosings(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const closingsQuery = query(cashClosingsCollection, where("business_id", "==", businessId));

  return onSnapshot(closingsQuery, (snapshot) => {
    const closings = snapshot.docs
      .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
      .sort((a, b) => {
        const aTime = normalizeDate(a.closed_at || a.opened_at || a.createdAt)?.getTime?.() || 0;
        const bTime = normalizeDate(b.closed_at || b.opened_at || b.createdAt)?.getTime?.() || 0;
        return bTime - aTime;
      });

    callback(closings);
  });
}

export async function getCurrentOpenCashSession(businessId) {
  const normalizedBusinessId = String(businessId || "").trim();

  if (!normalizedBusinessId) {
    return null;
  }

  const snapshot = await getDocs(
    query(
      cashClosingsCollection,
      where("business_id", "==", normalizedBusinessId),
      where("status", "==", "open")
    )
  );

  const sessions = snapshot.docs
    .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
    .sort((a, b) => {
      const aTime = normalizeDate(a.opened_at || a.createdAt)?.getTime?.() || 0;
      const bTime = normalizeDate(b.opened_at || b.createdAt)?.getTime?.() || 0;
      return bTime - aTime;
    });

  return sessions[0] || null;
}

export async function openCashSession(businessId, options = {}) {
  const normalizedBusinessId = String(businessId || "").trim();

  if (!normalizedBusinessId) {
    throw new Error("El business_id es obligatorio para abrir caja.");
  }

  const existingSession = await getCurrentOpenCashSession(normalizedBusinessId);
  if (existingSession) {
    return existingSession.id;
  }

  const openingAmount = Number(options.openingAmount || 0);
  const now = new Date();
  const createdRef = await addDoc(cashClosingsCollection, {
    business_id: normalizedBusinessId,
    status: "open",
    opening_amount: openingAmount,
    opened_at: serverTimestamp(),
    opened_date_key: getLocalDateKey(now),
    notification_sent: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return createdRef.id;
}

export async function closeCashSession({ businessId, closingId, cashCounted }) {
  const normalizedBusinessId = String(businessId || "").trim();
  const normalizedClosingId = String(closingId || "").trim();

  if (!normalizedBusinessId || !normalizedClosingId) {
    throw new Error("Debes indicar la caja abierta para realizar el cierre.");
  }

  const closingRef = doc(db, "cash_closings", normalizedClosingId);
  const closingSnapshot = await getDoc(closingRef);

  if (!closingSnapshot.exists()) {
    throw new Error("La caja seleccionada no existe.");
  }

  const closingData = closingSnapshot.data();
  const openedAt = normalizeDate(closingData.opened_at || closingData.createdAt) || new Date();
  const now = new Date();

  const [salesSnapshot, purchasesSnapshot] = await Promise.all([
    getDocs(query(salesHistoryCollection, where("business_id", "==", normalizedBusinessId))),
    getDocs(query(purchasesCollection, where("business_id", "==", normalizedBusinessId))),
  ]);

  const relevantSales = salesSnapshot.docs
    .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
    .filter((sale) => {
      const saleDate = normalizeDate(sale.closed_at || sale.createdAt);
      if (!saleDate) {
        return false;
      }

      const belongsToSession = sale.closing_id === normalizedClosingId;
      const isOrphanSale = !sale.closing_id && saleDate >= openedAt && saleDate <= now;
      return sale.type === "income" && (belongsToSession || isOrphanSale);
    });

  const relevantPurchases = purchasesSnapshot.docs
    .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
    .filter((purchase) => {
      const purchaseDate = normalizeDate(purchase.purchase_date);
      return purchaseDate && purchaseDate >= openedAt && purchaseDate <= now;
    });

  const byMethod = relevantSales.reduce(
    (accumulator, sale) => {
      const method = String(sale.payment_method || "cash").trim() || "cash";
      accumulator[method] = (accumulator[method] || 0) + Number(sale.total || 0);
      return accumulator;
    },
    { cash: 0, card: 0, transfer: 0, nequi: 0, daviplata: 0 }
  );

  const totalSales = relevantSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const totalExpenses = relevantPurchases.reduce(
    (sum, purchase) => sum + Number(purchase.total || 0),
    0
  );
  const expectedCash = Number(closingData.opening_amount || 0) + Number(byMethod.cash || 0);
  const countedCash = Number(cashCounted || 0);
  const cashDifference = countedCash - expectedCash;

  const batch = writeBatch(db);

  relevantSales
    .filter((sale) => !sale.closing_id)
    .forEach((sale) => {
      batch.update(doc(db, "sales_history", sale.id), {
        closing_id: normalizedClosingId,
        updatedAt: serverTimestamp(),
      });
    });

  batch.update(closingRef, {
    status: "closed",
    closed_at: serverTimestamp(),
    sales_total: totalSales,
    expenses_total: totalExpenses,
    net_balance: totalSales - totalExpenses,
    by_method: byMethod,
    cash_expected: expectedCash,
    cash_counted: countedCash,
    cash_difference: cashDifference,
    total_sales_count: relevantSales.length,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  return {
    id: normalizedClosingId,
    openedAt,
    closedAt: now,
    openingAmount: Number(closingData.opening_amount || 0),
    salesTotal: totalSales,
    expensesTotal: totalExpenses,
    netBalance: totalSales - totalExpenses,
    byMethod,
    cashExpected: expectedCash,
    cashCounted: countedCash,
    cashDifference,
    totalSalesCount: relevantSales.length,
  };
}

export async function settlePendingDebtSale(saleId, paymentMethod) {
  const normalizedSaleId = String(saleId || "").trim();
  const normalizedPaymentMethod = String(paymentMethod || "").trim();

  if (!normalizedSaleId || !normalizedPaymentMethod) {
    throw new Error("Debes indicar la venta pendiente y el metodo de pago.");
  }

  const saleRef = doc(db, "sales_history", normalizedSaleId);
  const saleSnapshot = await getDoc(saleRef);

  if (!saleSnapshot.exists()) {
    throw new Error("La venta pendiente no existe.");
  }

  const saleData = saleSnapshot.data();
  const pendingAmount = Number(
    saleData.pending_debt_remaining ?? saleData.debt_amount ?? 0
  );

  if (pendingAmount <= 0) {
    throw new Error("Esta venta ya no tiene saldo pendiente.");
  }

  const customerId = String(saleData.customer_id || "").trim();
  const customerRef = customerId ? doc(db, "customers", customerId) : null;
  const openSession = await getCurrentOpenCashSession(saleData.business_id);

  const batch = writeBatch(db);

  batch.update(saleRef, {
    pending_debt_remaining: 0,
    settled_amount: Number(saleData.settled_amount || 0) + pendingAmount,
    settled_at: serverTimestamp(),
    settlement_payment_method: normalizedPaymentMethod,
    updatedAt: serverTimestamp(),
  });

  if (customerRef) {
    const customerSnapshot = await getDoc(customerRef);
    if (customerSnapshot.exists()) {
      const customerData = customerSnapshot.data();
      batch.update(customerRef, {
        debt_balance: Math.max(Number(customerData.debt_balance || 0) - pendingAmount, 0),
        pendingDebt: Math.max(Number(customerData.pendingDebt || customerData.debt_balance || 0) - pendingAmount, 0),
        updatedAt: serverTimestamp(),
      });
    }
  }

  const settlementRef = doc(salesHistoryCollection);
  batch.set(settlementRef, {
    business_id: saleData.business_id,
    type: "income",
    concept: `Abono cartera ${saleData.customer_name || "Cliente"}`,
    customer_id: saleData.customer_id || null,
    customer_name: saleData.customer_name || "",
    linked_sale_id: normalizedSaleId,
    table_id: saleData.table_id || null,
    table_name: saleData.table_name || "Cartera",
    items: [],
    subtotal: pendingAmount,
    total: pendingAmount,
    payment_method: normalizedPaymentMethod,
    debt_amount: 0,
    pending_debt_remaining: 0,
    settlement: true,
    closing_id: openSession?.id || null,
    closed_at: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  return settlementRef.id;
}

export function buildCashClosingReportHtml(report) {
  const byMethodRows = Object.entries(report.byMethod || {})
    .map(
      ([method, total]) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;">${method}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:right;">${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(total)}</td></tr>`
    )
    .join("");

  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Reporte de cierre SmartProfit</title>
    </head>
    <body style="font-family: Arial, sans-serif; padding: 32px; color: #0f172a;">
      <h1 style="margin:0 0 8px;">SmartProfit</h1>
      <p style="margin:0 0 24px;">El control que tu rentabilidad merece</p>
      <h2 style="margin:0 0 16px;">Reporte de cierre de caja</h2>
      <p><strong>Apertura:</strong> ${report.openedAt.toLocaleString("es-CO")}</p>
      <p><strong>Cierre:</strong> ${report.closedAt.toLocaleString("es-CO")}</p>
      <p><strong>Ventas:</strong> ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(report.salesTotal)}</p>
      <p><strong>Gastos:</strong> ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(report.expensesTotal)}</p>
      <p><strong>Balance neto:</strong> ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(report.netBalance)}</p>
      <p><strong>Efectivo esperado:</strong> ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(report.cashExpected)}</p>
      <p><strong>Efectivo contado:</strong> ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(report.cashCounted)}</p>
      <p><strong>Diferencia:</strong> ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(report.cashDifference)}</p>
      <h3 style="margin-top:32px;">Resumen por canal</h3>
      <table style="width:100%; border-collapse:collapse;">${byMethodRows}</table>
    </body>
  </html>`;
}
