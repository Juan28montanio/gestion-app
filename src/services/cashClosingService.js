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
import {
  accumulatePaymentBreakdown,
  createEmptyPaymentTotals,
  expenseAffectsCash,
  PAYMENT_METHOD_LABELS,
  resolvePurchasePaymentMethod,
} from "../utils/payments";
import { buildOperationalSaleItemDetail } from "../utils/sales";

const cashClosingsCollection = collection(db, "cash_closings");
const salesHistoryCollection = collection(db, "sales_history");
const purchasesCollection = collection(db, "purchases");
const operatingExpensesCollection = collection(db, "operating_expenses");
const ordersCollection = collection(db, "orders");

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

function formatCOP(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function buildClosingCode(closedAt = new Date(), sequence = 1) {
  const month = `${closedAt.getMonth() + 1}`.padStart(2, "0");
  const day = `${closedAt.getDate()}`.padStart(2, "0");
  const year = `${closedAt.getFullYear()}`.slice(-2);
  return `CIERRE-${month}${day}${year}-${String(sequence || 1).padStart(3, "0")}`;
}

function buildPurchaseSummary(purchases, salesTotal) {
  const total = purchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);
  const supplierTotals = purchases.reduce((accumulator, purchase) => {
    const key = String(purchase.supplier_name || "Sin proveedor").trim();
    accumulator[key] = (accumulator[key] || 0) + Number(purchase.total || 0);
    return accumulator;
  }, {});
  const categoryTotals = purchases.reduce((accumulator, purchase) => {
    (purchase.items || []).forEach((item) => {
      const key = String(item.category || "Sin categoria").trim();
      accumulator[key] = (accumulator[key] || 0) + Number(item.total_cost || item.line_total || 0);
    });
    return accumulator;
  }, {});

  const topSupplier = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1])[0];
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const topSuppliers = Object.entries(supplierTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, supplierTotal]) => ({
      name,
      total: Number(supplierTotal || 0),
    }));
  const highlightedPurchases = purchases
    .slice()
    .sort((a, b) => Number(b.total || 0) - Number(a.total || 0))
    .slice(0, 3)
    .map((purchase) => ({
      supplierName: String(purchase.supplier_name || "Sin proveedor").trim(),
      invoiceNumber: String(purchase.invoice_number || "Sin consecutivo").trim(),
      total: Number(purchase.total || 0),
      date: purchase.purchase_date || "",
      itemsCount: Array.isArray(purchase.items) ? purchase.items.length : 0,
    }));

  return {
    count: purchases.length,
    total,
    shareOfSalesPct: salesTotal > 0 ? (total / salesTotal) * 100 : null,
    topSupplierName: topSupplier?.[0] || "",
    topSupplierTotal: Number(topSupplier?.[1] || 0),
    topCategoryName: topCategory?.[0] || "",
    topCategoryTotal: Number(topCategory?.[1] || 0),
    topSuppliers,
    highlightedPurchases,
  };
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
  const cashierName = String(options.cashierName || "Operador SmartProfit").trim();
  const cashierEmail = String(options.cashierEmail || "").trim().toLowerCase();
  const now = new Date();
  const openedDateKey = getLocalDateKey(now);
  const previousSessionsSnapshot = await getDocs(
    query(
      cashClosingsCollection,
      where("business_id", "==", normalizedBusinessId),
      where("opened_date_key", "==", openedDateKey)
    )
  );
  const dailySequence = previousSessionsSnapshot.size + 1;
  const createdRef = await addDoc(cashClosingsCollection, {
    business_id: normalizedBusinessId,
    status: "open",
    opening_amount: openingAmount,
    cashier_name: cashierName,
    cashier_email: cashierEmail,
    opened_at: serverTimestamp(),
    opened_date_key: openedDateKey,
    daily_sequence: dailySequence,
    notification_sent: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return createdRef.id;
}

export async function closeCashSession({ businessId, closingId, cashCounted, context = {} }) {
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

  const [salesSnapshot, purchasesSnapshot, operatingExpensesSnapshot, ordersSnapshot] = await Promise.all([
    getDocs(query(salesHistoryCollection, where("business_id", "==", normalizedBusinessId))),
    getDocs(query(purchasesCollection, where("business_id", "==", normalizedBusinessId))),
    getDocs(query(operatingExpensesCollection, where("business_id", "==", normalizedBusinessId))),
    getDocs(query(ordersCollection, where("business_id", "==", normalizedBusinessId))),
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

  const relevantOperatingExpenses = operatingExpensesSnapshot.docs
    .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
    .filter((expense) => {
      const expenseDate = normalizeDate(expense.expense_date);
      return expenseDate && expenseDate >= openedAt && expenseDate <= now;
    });

  const relevantOrders = ordersSnapshot.docs
    .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
    .filter((order) => {
      const activityDate = normalizeDate(
        order.cancelled_at || order.closed_at || order.updatedAt || order.created_at || order.createdAt
      );
      return activityDate && activityDate >= openedAt && activityDate <= now;
    });

  const byMethod = relevantSales.reduce((accumulator, sale) => {
    accumulatePaymentBreakdown(
      accumulator,
      sale.payment_breakdown,
      sale.payment_method || "cash",
      Number(sale.total) || 0
    );
    return accumulator;
  }, createEmptyPaymentTotals());
  const ticketWalletUnits = relevantSales.reduce(
    (sum, sale) => sum + Number(sale.ticket_units_consumed || 0),
    0
  );

  const totalSales = relevantSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const purchaseExpensesTotal = relevantPurchases.reduce(
    (sum, purchase) => sum + Number(purchase.total || 0),
    0
  );
  const operatingExpensesTotal = relevantOperatingExpenses.reduce(
    (sum, expense) => sum + Number(expense.total || expense.amount || 0),
    0
  );
  const totalExpenses = purchaseExpensesTotal + operatingExpensesTotal;
  const purchaseSummary = buildPurchaseSummary(relevantPurchases, totalSales);
  const cashPurchaseExpenses = relevantPurchases.reduce((sum, purchase) => {
    return expenseAffectsCash({
      source: "purchase",
      paymentMethod: purchase.payment_method,
      supplierPaymentTerms: purchase.supplier_payment_terms,
    })
      ? sum + Number(purchase.total || 0)
      : sum;
  }, 0);
  const cashOperatingExpenses = relevantOperatingExpenses.reduce((sum, expense) => {
    return expenseAffectsCash({
      source: "operating_expense",
      paymentMethod: expense.payment_method,
    })
      ? sum + Number(expense.total || expense.amount || 0)
      : sum;
  }, 0);
  const expectedCash =
    Number(closingData.opening_amount || 0) +
    Number(byMethod.cash || 0) -
    cashPurchaseExpenses -
    cashOperatingExpenses;
  const countedCash = Number(cashCounted || 0);
  const cashDifference = countedCash - expectedCash;
  const totalCollected = Object.values(byMethod).reduce(
    (sum, amount) => sum + Number(amount || 0),
    0
  );
  const auditEntries = relevantOrders
    .filter((order) => {
      const status = String(order.status || "").trim().toLowerCase();
      return status === "cancelada" || status === "anulada";
    })
    .map((order) => ({
      id: order.id,
      type: "Orden anulada",
      tableName: order.table_name || order.table_id || "Salon",
      detail:
        (order.items || [])
          .map((item) => `${item.quantity}x ${item.name}`)
          .join(", ") || "Sin detalle",
      at: normalizeDate(order.cancelled_at || order.updatedAt || order.created_at || order.createdAt),
    }));
  const closingCode = buildClosingCode(now, Number(closingData.daily_sequence || 1));
  const cashierName = String(
    closingData.cashier_name || closingData.opened_by_name || "Operador SmartProfit"
  ).trim();
  const cashierEmail = String(
    context.cashierEmail || closingData.cashier_email || ""
  ).trim();
  const operatorName = String(context.operatorName || cashierName).trim();
  const businessName = String(context.businessName || "").trim();
  const movementEntries = [
    ...relevantSales.map((sale) => ({
      type: "Ingreso",
      concept:
        sale.concept ||
        (sale.customer_name
          ? `${sale.table_name || sale.table_id || "Mesa"} - ${sale.customer_name}`
          : sale.table_name || sale.table_id || "Venta POS"),
      detail: (sale.items || []).map(buildOperationalSaleItemDetail).join(", ") || "Sin detalle",
      paymentMethod: sale.payment_method || "cash",
      operationalType: (sale.items || []).some(
        (item) => String(item?.recipe_mode || item?.recipeMode || "direct") === "composed"
      )
        ? "Venta compuesta"
        : "Venta directa",
      amount: Number(sale.total || 0),
      at: normalizeDate(sale.closed_at || sale.createdAt),
    })),
    ...relevantPurchases.map((purchase) => ({
      type: "Egreso",
      concept: purchase.concept || purchase.supplier_name || purchase.invoice_number || "Compra",
      detail:
        (purchase.items || [])
          .map((item) => `${item.quantity}x ${item.ingredient_name || item.manual_name || "Insumo"}`)
          .join(", ") || "Sin detalle",
      paymentMethod: resolvePurchasePaymentMethod(
        purchase.payment_method,
        purchase.supplier_payment_terms
      ),
      amount: Number(purchase.total || 0),
      at: normalizeDate(purchase.purchase_date),
    })),
    ...relevantOperatingExpenses.map((expense) => ({
      type: "Egreso",
      concept: expense.concept || "Gasto operativo",
      detail: expense.notes || expense.vendor_name || expense.category || "Sin detalle",
      paymentMethod: expense.payment_method || "cash",
      amount: Number(expense.total || expense.amount || 0),
      at: normalizeDate(expense.expense_date),
    })),
  ].sort((left, right) => (right.at?.getTime?.() || 0) - (left.at?.getTime?.() || 0));

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
    closing_code: closingCode,
    cashier_name: cashierName,
    sales_total: totalSales,
    expenses_total: totalExpenses,
    net_balance: totalSales - totalExpenses,
    total_collected: totalCollected,
    by_method: byMethod,
    ticket_wallet_units: ticketWalletUnits,
    cash_expected: expectedCash,
    cash_counted: countedCash,
    cash_difference: cashDifference,
    operating_expenses_total: operatingExpensesTotal,
    purchase_expenses_total: purchaseExpensesTotal,
    total_sales_count: relevantSales.length,
    audit_count: auditEntries.length,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  return {
    id: normalizedClosingId,
    openedAt,
    closedAt: now,
    closingCode,
    cashierName,
    cashierEmail,
    operatorName,
    businessName,
    openingAmount: Number(closingData.opening_amount || 0),
    salesTotal: totalSales,
    expensesTotal: totalExpenses,
    netBalance: totalSales - totalExpenses,
    totalCollected,
    byMethod,
    ticketWalletUnits,
    cashExpected: expectedCash,
    cashCounted: countedCash,
    cashDifference,
    operatingExpensesTotal,
    purchaseExpensesTotal,
    cashPurchaseExpenses,
    totalSalesCount: relevantSales.length,
    auditEntries,
    movementEntries,
    purchaseSummary,
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
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${PAYMENT_METHOD_LABELS[method] || method}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCOP(total)}</td></tr>`
    )
    .join("");
  const auditRows = (report.auditEntries || [])
    .map(
      (entry) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.type}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.tableName}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.detail}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${entry.at ? entry.at.toLocaleString("es-CO") : "-"}</td></tr>`
    )
    .join("");
  const movementRows = (report.movementEntries || [])
    .map(
      (entry) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.type}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.concept}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.detail}${entry.operationalType ? `<div style="margin-top:6px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${entry.operationalType === "Venta compuesta" ? "#946200" : "#64748b"};">${entry.operationalType}</div>` : ""}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${PAYMENT_METHOD_LABELS[entry.paymentMethod] || entry.paymentMethod || "-"}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${entry.at ? entry.at.toLocaleString("es-CO") : "-"}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${formatCOP(entry.amount)}</td></tr>`
    )
    .join("");
  const purchaseSummary = report.purchaseSummary || {};
  const purchaseNarrative = purchaseSummary.count
    ? `Se registraron ${purchaseSummary.count} compra(s) por ${formatCOP(purchaseSummary.total || 0)} dentro del periodo del cierre.`
    : "No se registraron compras dentro del periodo del cierre.";
  const purchaseContext = purchaseSummary.count
    ? [
        purchaseSummary.shareOfSalesPct !== null
          ? `Estas compras equivalen al ${purchaseSummary.shareOfSalesPct.toFixed(0)}% de las ventas del turno.`
          : "",
        purchaseSummary.topSupplierName
          ? `Proveedor de mayor peso: ${purchaseSummary.topSupplierName} con ${formatCOP(purchaseSummary.topSupplierTotal || 0)}.`
          : "",
        purchaseSummary.topCategoryName
          ? `Categoria de mayor gasto: ${purchaseSummary.topCategoryName} con ${formatCOP(purchaseSummary.topCategoryTotal || 0)}.`
          : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "El documento resume principalmente recaudo, arqueo y movimientos del turno.";
  const topSupplierRows = (purchaseSummary.topSuppliers || [])
    .map(
      (entry) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.name}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${formatCOP(entry.total)}</td></tr>`
    )
    .join("");
  const highlightedPurchaseRows = (purchaseSummary.highlightedPurchases || [])
    .map(
      (entry) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.supplierName}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.invoiceNumber}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${entry.date || "-"}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${entry.itemsCount}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${formatCOP(entry.total)}</td></tr>`
    )
    .join("");

  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Reporte de cierre SmartProfit</title>
      <style>
        body { font-family: "Segoe UI", Arial, sans-serif; padding: 32px; color: #0f172a; background: #f3f4f6; }
        .sheet { max-width: 1120px; margin: 0 auto; background: white; border-radius: 24px; padding: 36px; box-shadow: 0 20px 60px rgba(15,23,42,.12); }
        .topbar { display:flex; justify-content:space-between; gap:24px; align-items:flex-start; margin-bottom:24px; }
        .brand { display:flex; flex-direction:column; gap:6px; }
        .pill { display:inline-flex; align-items:center; border-radius:999px; padding:8px 14px; font-size:12px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; background:#f8fafc; color:#334155; border:1px solid #cbd5e1; }
        .grid { display:grid; gap:16px; }
        .grid-3 { grid-template-columns: repeat(3, minmax(0,1fr)); }
        .card { border:1px solid #e2e8f0; border-radius:24px; padding:20px; background:#fff; }
        .card.dark { background: linear-gradient(135deg,#0f172a 0%,#1e293b 100%); color:#fff; border:none; }
        .eyebrow { font-size:12px; letter-spacing:.18em; text-transform:uppercase; font-weight:700; color:#94a3b8; }
        .value { font-size:28px; font-weight:800; margin-top:10px; }
        .band { margin:28px 0; border:1px solid #e2e8f0; border-radius:24px; padding:20px; background:linear-gradient(135deg,#ffffff 0%,#f8fafc 100%); }
        .band-title { font-size:12px; letter-spacing:.18em; text-transform:uppercase; font-weight:700; color:#64748b; }
        .band-body { margin-top:10px; font-size:14px; line-height:1.7; color:#334155; }
        table { width:100%; border-collapse: collapse; }
        th { text-align:left; font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:#64748b; padding:10px 12px; border-bottom:1px solid #cbd5e1; }
        .section-title { font-size:18px; font-weight:700; margin:28px 0 14px; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="topbar">
          <div class="brand">
            <h1 style="margin:0;font-size:22px;">${report.businessName || "SmartProfit"}</h1>
            <p style="margin:0;color:#64748b;">Reporte operativo y financiero de cierre</p>
            <h2 style="margin:18px 0 0;font-size:32px;">Reporte de cierre de caja</h2>
          </div>
          <div style="text-align:right;">
            <span class="pill">${report.closingCode || buildClosingCode(report.closedAt, 1)}</span>
            <p style="margin:16px 0 0;"><strong>Operador:</strong> ${report.operatorName || report.cashierName || "Operador SmartProfit"}</p>
            <p style="margin:6px 0 0;"><strong>Cuenta:</strong> ${report.cashierEmail || "Sin correo"}</p>
            <p style="margin:6px 0 0;"><strong>Apertura:</strong> ${report.openedAt.toLocaleString("es-CO")}</p>
            <p style="margin:6px 0 0;"><strong>Cierre:</strong> ${report.closedAt.toLocaleString("es-CO")}</p>
          </div>
        </div>

        <div class="grid grid-3">
          <div class="card">
            <div class="eyebrow">Ventas del turno</div>
            <div class="value">${formatCOP(report.salesTotal)}</div>
          </div>
          <div class="card">
            <div class="eyebrow">Gastos del turno</div>
            <div class="value">${formatCOP(report.expensesTotal)}</div>
            <p style="margin:10px 0 0;color:#64748b;">Compras: ${formatCOP(report.purchaseExpensesTotal || 0)} · Operativos: ${formatCOP(report.operatingExpensesTotal || 0)}</p>
          </div>
          <div class="card dark">
            <div class="eyebrow" style="color:#cbd5e1;">Balance neto</div>
            <div class="value">${formatCOP(report.netBalance)}</div>
          </div>
        </div>

        <div class="band">
          <div class="band-title">Lectura ejecutiva del cierre</div>
          <div class="band-body">
            ${purchaseNarrative}
            ${purchaseContext}
          </div>
        </div>

        <div class="section-title">Resumen de medios</div>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th style="text-align:right;">Esperado en sistema</th>
              <th style="text-align:right;">Declarado por cajero</th>
              <th style="text-align:right;">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;">Efectivo</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCOP(report.cashExpected)}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCOP(report.cashCounted)}</td>
              <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCOP(report.cashDifference)}</td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">Movimientos del turno</div>
        <div class="grid grid-3">
          <div class="card">
            <div class="eyebrow">Total recaudado</div>
            <div class="value">${formatCOP(report.totalCollected)}</div>
          </div>
          <div class="card">
            <div class="eyebrow">Ventas registradas</div>
            <div class="value">${report.totalSalesCount || 0}</div>
          </div>
          <div class="card">
            <div class="eyebrow">Servicios por tiquetera</div>
            <div class="value">${report.ticketWalletUnits || 0} uds</div>
          </div>
        </div>

        <div class="section-title">Resumen por canal</div>
        <table>
          <thead>
            <tr>
              <th>Canal</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${byMethodRows}</tbody>
        </table>

        <div class="section-title">Proveedores y compras destacadas</div>
        ${
          purchaseSummary.count
            ? `<div class="grid grid-3">
                <div class="card">
                  <div class="eyebrow">Proveedor principal</div>
                  <div class="value" style="font-size:22px;">${purchaseSummary.topSupplierName || "Sin dato"}</div>
                  <p style="margin:10px 0 0;color:#64748b;">${formatCOP(purchaseSummary.topSupplierTotal || 0)}</p>
                </div>
                <div class="card">
                  <div class="eyebrow">Categoria dominante</div>
                  <div class="value" style="font-size:22px;">${purchaseSummary.topCategoryName || "Sin categoria"}</div>
                  <p style="margin:10px 0 0;color:#64748b;">${formatCOP(purchaseSummary.topCategoryTotal || 0)}</p>
                </div>
                <div class="card">
                  <div class="eyebrow">Compras registradas</div>
                  <div class="value">${purchaseSummary.count || 0}</div>
                  <p style="margin:10px 0 0;color:#64748b;">${formatCOP(purchaseSummary.total || 0)} en total</p>
                </div>
              </div>
              <div style="display:grid;gap:16px;grid-template-columns:1fr 1.2fr;margin-top:16px;">
                <div class="card">
                  <div class="eyebrow">Top proveedores del periodo</div>
                  ${
                    topSupplierRows
                      ? `<table style="margin-top:14px;">
                          <thead>
                            <tr>
                              <th>Proveedor</th>
                              <th style="text-align:right;">Total</th>
                            </tr>
                          </thead>
                          <tbody>${topSupplierRows}</tbody>
                        </table>`
                      : `<p style="margin-top:14px;color:#64748b;">No hay proveedores destacados para este cierre.</p>`
                  }
                </div>
                <div class="card">
                  <div class="eyebrow">Compras mas relevantes</div>
                  ${
                    highlightedPurchaseRows
                      ? `<table style="margin-top:14px;">
                          <thead>
                            <tr>
                              <th>Proveedor</th>
                              <th>Factura</th>
                              <th>Fecha</th>
                              <th style="text-align:right;">Items</th>
                              <th style="text-align:right;">Total</th>
                            </tr>
                          </thead>
                          <tbody>${highlightedPurchaseRows}</tbody>
                        </table>`
                      : `<p style="margin-top:14px;color:#64748b;">No hay compras relevantes para detallar en este cierre.</p>`
                  }
                </div>
              </div>`
            : `<div class="card" style="background:#f8fafc;">No hubo compras en el periodo, por lo que no hay proveedores ni facturas destacadas para este cierre.</div>`
        }

        <div class="section-title">Detalle resumido de movimientos</div>
        ${
          movementRows
            ? `<table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Concepto</th>
                    <th>Detalle</th>
                    <th>Canal</th>
                    <th style="text-align:right;">Hora</th>
                    <th style="text-align:right;">Valor</th>
                  </tr>
                </thead>
                <tbody>${movementRows}</tbody>
              </table>`
            : `<div class="card" style="background:#f8fafc;">No se registraron movimientos dentro del periodo de cierre.</div>`
        }

        <div class="section-title">Auditoria del turno</div>
        ${
          auditRows
            ? `<table>
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Mesa</th>
                    <th>Detalle</th>
                    <th style="text-align:right;">Hora</th>
                  </tr>
                </thead>
                <tbody>${auditRows}</tbody>
              </table>`
            : `<div class="card" style="background:#f8fafc;">No se registraron ordenes anuladas ni ajustes auditables en este turno.</div>`
        }
      </div>
    </body>
  </html>`;
}
