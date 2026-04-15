import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { getCurrentOpenCashSession } from "./cashClosingService";
import { QUICK_SALE_TABLE } from "../utils/posConstants";
import { getTicketWalletState } from "./customerService";
import {
  accumulatePaymentBreakdown,
  createEmptyPaymentTotals,
  getPrimaryPaymentMethod,
  normalizePaymentBreakdown,
} from "../utils/payments";

function getTicketProductGrant(items = []) {
  return items.reduce(
    (sum, item) =>
      sum +
      (String(item?.product_type || item?.productType || "").trim() === "ticket_wallet"
        ? Number(item?.ticket_units || 0) * Number(item?.quantity || 0)
        : 0),
    0
  );
}

function getTicketConsumption(items = [], ticketConsumption = {}) {
  const requestedUnits = Number(ticketConsumption?.units || 0);
  const requestedCoveredAmount = Number(ticketConsumption?.coveredAmount || 0);

  if (requestedUnits > 0 || requestedCoveredAmount > 0) {
    return {
      units: Math.max(requestedUnits, 0),
      coveredAmount: Math.max(requestedCoveredAmount, 0),
    };
  }

  const units = items.reduce(
    (sum, item) =>
      sum +
      (Boolean(item?.useTicket) ? Number(item?.quantity || 0) : 0),
    0
  );
  const coveredAmount = items.reduce(
    (sum, item) =>
      sum +
      (Boolean(item?.useTicket)
        ? Number(item?.price || 0) * Number(item?.quantity || 0)
        : 0),
    0
  );

  return { units, coveredAmount };
}

const startOfDay = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(date);
};

export async function handleStockReduction(businessId, orderItems) {
  const normalizedBusinessId = String(businessId || "").trim();

  if (!normalizedBusinessId || !Array.isArray(orderItems) || orderItems.length === 0) {
    return;
  }

  const productAdjustments = new Map();
  const productIds = [];

  orderItems.forEach((item) => {
    const productId = String(item?.id || item?.productId || "").trim();
    const quantity = Number(item?.quantity || 0);

    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      return;
    }

    productIds.push(productId);
    productAdjustments.set(productId, (productAdjustments.get(productId) || 0) + quantity);
  });

  const recipeBooksSnapshot = await getDocs(
    query(collection(db, "recipeBooks"), where("business_id", "==", normalizedBusinessId))
  );

  const recipeBooks = recipeBooksSnapshot.docs
    .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
    .filter((recipeBook) => productIds.includes(String(recipeBook.product_id || "").trim()));

  await runTransaction(db, async (transaction) => {
    const ingredientAdjustments = new Map();

    for (const [productId, quantitySold] of productAdjustments.entries()) {
      const productRef = doc(db, "products", productId);
      const productSnapshot = await transaction.get(productRef);

      if (productSnapshot.exists()) {
        const productData = productSnapshot.data();
        const isTicketWalletProduct =
          String(productData.product_type || "").trim() === "ticket_wallet";

        if (!isTicketWalletProduct) {
          const currentStock = Number(productData.stock || 0);

          transaction.update(productRef, {
            stock: Math.max(currentStock - quantitySold, 0),
            updatedAt: serverTimestamp(),
          });
        }
      }

      const recipeBook = recipeBooks.find(
        (candidate) => String(candidate.product_id || "").trim() === productId
      );

      if (!recipeBook || !Array.isArray(recipeBook.ingredients)) {
        continue;
      }

      recipeBook.ingredients.forEach((ingredient) => {
        const ingredientId = String(ingredient?.ingredient_id || "").trim();
        const recipeQuantity = Number(ingredient?.quantity || 0);

        if (!ingredientId || !Number.isFinite(recipeQuantity) || recipeQuantity <= 0) {
          return;
        }

        ingredientAdjustments.set(
          ingredientId,
          (ingredientAdjustments.get(ingredientId) || 0) + recipeQuantity * quantitySold
        );
      });
    }

    for (const [ingredientId, quantityToDiscount] of ingredientAdjustments.entries()) {
      const ingredientRef = doc(db, "ingredients", ingredientId);
      const ingredientSnapshot = await transaction.get(ingredientRef);

      if (!ingredientSnapshot.exists()) {
        continue;
      }

      const ingredientData = ingredientSnapshot.data();
      const currentStock = Number(ingredientData.stock || 0);

      transaction.update(ingredientRef, {
        stock: Math.max(currentStock - quantityToDiscount, 0),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export async function closeOrderAndLogSale(orderId, paymentMethod, options = {}) {
  const normalizedOrderId = String(orderId || "").trim();
  const normalizedPaymentMethod = String(paymentMethod || "").trim();

  if (!normalizedOrderId) {
    throw new Error("El id de la orden es obligatorio.");
  }

  if (!normalizedPaymentMethod) {
    throw new Error("El metodo de pago es obligatorio.");
  }

  const orderRef = doc(db, "orders", normalizedOrderId);
  const salesCollection = collection(db, "sales_history");
  let orderItemsForInventory = [];
  let businessIdForInventory = "";
  const preloadedOrderSnapshot = await getDoc(orderRef);

  if (!preloadedOrderSnapshot.exists()) {
    throw new Error("La orden indicada no existe.");
  }

  const preloadedOrderData = preloadedOrderSnapshot.data();
  const openCashSession = await getCurrentOpenCashSession(preloadedOrderData.business_id);

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error("La orden indicada no existe.");
    }

    const orderData = orderSnapshot.data();
    const resolvedTableId = String(options.tableId || orderData.table_id || "").trim();
    const resolvedBusinessId = String(options.businessId || orderData.business_id || "").trim();
    const subtotal = Number(options.subtotal ?? orderData.subtotal ?? orderData.total ?? 0);
    const chargedTotalCandidate = Number(options.chargedTotal);
    const chargedTotal =
      Number.isFinite(chargedTotalCandidate) && chargedTotalCandidate >= 0
        ? chargedTotalCandidate
        : subtotal;
    const adjustmentAmount = chargedTotal - subtotal;
    const adjustmentPct = subtotal > 0 ? (adjustmentAmount / subtotal) * 100 : 0;
    const customerId = String(
      options.customer?.id || orderData.customer_id || options.customerId || ""
    ).trim();
    const customerName = String(
      options.customer?.name || orderData.customer_name || options.customerName || ""
    ).trim();
    const isTicketWalletPayment = normalizedPaymentMethod === "ticket_wallet";
    const debtAmount =
      !isTicketWalletPayment && customerId && subtotal > chargedTotal
        ? Number((subtotal - chargedTotal).toFixed(2))
        : 0;
    const ticketGrantUnits = getTicketProductGrant(orderData.items || []);
    const ticketConsumption = getTicketConsumption(
      orderData.items || [],
      options.ticketConsumption || {}
    );
    const paymentBreakdown = normalizePaymentBreakdown(
      options.splitPayments || [],
      normalizedPaymentMethod,
      chargedTotal
    );
    const paymentBreakdownTotal = paymentBreakdown.reduce(
      (sum, line) => sum + Number(line.amount || 0),
      0
    );
    const primaryPaymentMethod = getPrimaryPaymentMethod(
      paymentBreakdown,
      normalizedPaymentMethod,
      chargedTotal
    );
    const paymentLabel =
      primaryPaymentMethod === "split"
        ? "Pago dividido"
        : isTicketWalletPayment
          ? "Tiquetera"
          : primaryPaymentMethod;

    if (!resolvedTableId) {
      throw new Error("No fue posible determinar la mesa asociada a la orden.");
    }

    if (!resolvedBusinessId) {
      throw new Error("No fue posible determinar el negocio asociado a la orden.");
    }

    if (isTicketWalletPayment && !customerId) {
      throw new Error("Debes seleccionar un cliente para consumir una tiquetera.");
    }

    if (ticketConsumption.units > 0 && !customerId) {
      throw new Error("Debes seleccionar un cliente para aplicar tickets en esta venta.");
    }

    if (paymentBreakdown.length > 1 && Math.abs(paymentBreakdownTotal - chargedTotal) > 1) {
      throw new Error("La suma del pago dividido debe coincidir con el valor final cobrado.");
    }

    const isQuickSale = resolvedTableId === QUICK_SALE_TABLE.id;
    const tableRef = isQuickSale ? null : doc(db, "tables", resolvedTableId);
    const tableSnapshot = tableRef ? await transaction.get(tableRef) : null;
    const customerRef = customerId ? doc(db, "customers", customerId) : null;
    const customerSnapshot = customerRef ? await transaction.get(customerRef) : null;

    if (!isQuickSale && !tableSnapshot?.exists()) {
      throw new Error("La mesa asociada a la orden no existe.");
    }

    const tableData = isQuickSale ? QUICK_SALE_TABLE : tableSnapshot.data();

    transaction.update(orderRef, {
      status: "pagada",
      payment_method: primaryPaymentMethod,
      payment_label: paymentLabel,
      payment_breakdown: paymentBreakdown,
      customer_id: customerId || null,
      customer_name: customerName || "",
      closing_id: openCashSession?.id || null,
      subtotal,
      total: chargedTotal,
      adjustment_amount: adjustmentAmount,
      adjustment_pct: adjustmentPct,
      debt_amount: debtAmount,
      pending_debt_remaining: debtAmount,
      settled_amount: 0,
      payment_kind:
        primaryPaymentMethod === "split"
          ? "split_cashflow"
          : isTicketWalletPayment
            ? "prepaid_ticket"
            : "cashflow",
      ticket_units_consumed: ticketConsumption.units,
      ticket_units_granted: ticketGrantUnits,
      ticket_covered_amount: ticketConsumption.coveredAmount,
      closed_at: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(doc(salesCollection), {
      business_id: resolvedBusinessId,
      order_id: normalizedOrderId,
      table_id: resolvedTableId,
      table_name: tableData.name || `Mesa ${tableData.number || ""}`.trim(),
      customer_id: customerId || null,
      customer_name: customerName || "",
      items: orderData.items || [],
      subtotal,
      total: chargedTotal,
      adjustment_amount: adjustmentAmount,
      adjustment_pct: adjustmentPct,
      debt_amount: debtAmount,
      pending_debt_remaining: debtAmount,
      settled_amount: 0,
      payment_method: primaryPaymentMethod,
      payment_label: paymentLabel,
      payment_breakdown: paymentBreakdown,
      concept: `Venta ${tableData.name || `Mesa ${tableData.number || ""}`.trim()}`,
      type: "income",
      income_kind:
        ticketConsumption.units > 0
          ? isTicketWalletPayment
            ? "ticket_wallet"
            : "mixed_ticket"
          : "cash",
      ticket_units_consumed: ticketConsumption.units,
      ticket_units_granted: ticketGrantUnits,
      ticket_covered_amount: ticketConsumption.coveredAmount,
      closing_id: openCashSession?.id || null,
      closed_at: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    if (customerRef && customerSnapshot?.exists()) {
        const customerData = customerSnapshot.data();
        const ticketState = getTicketWalletState(customerData);
        if (ticketConsumption.units > 0 && ticketState.balance < ticketConsumption.units) {
          throw new Error("El cliente no tiene suficientes tickets disponibles.");
        }
        const nextTicketBalance =
          ticketState.balance +
          ticketGrantUnits -
          ticketConsumption.units;
        const currentExpiry = customerData.ticket_expires_at || null;
        const validityDays =
          (orderData.items || []).reduce((maxDays, item) => {
            const itemType = String(item?.product_type || item?.productType || "").trim();
            if (itemType !== "ticket_wallet") {
              return maxDays;
            }
            return Math.max(maxDays, Number(item?.ticket_validity_days || 30));
          }, 0) || 0;
        const nextExpiry =
          ticketGrantUnits > 0
            ? new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000)
            : currentExpiry;
        transaction.update(customerRef, {
          debt_balance: Number(customerData.debt_balance || 0) + debtAmount,
          pendingDebt: Number(customerData.pendingDebt || customerData.debt_balance || 0) + debtAmount,
          ticket_balance_units: Math.max(nextTicketBalance, 0),
          ticket_total_purchased:
            Number(customerData.ticket_total_purchased || 0) + ticketGrantUnits,
          ticket_last_used_at:
            ticketConsumption.units > 0 ? serverTimestamp() : customerData.ticket_last_used_at || null,
          ticket_expires_at: nextExpiry,
          last_order_at: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
    }

    if (tableRef) {
      transaction.update(tableRef, {
        status: "disponible",
        current_order_id: null,
        current_order_summary: "",
        current_total: 0,
        updatedAt: serverTimestamp(),
      });
    }

    orderItemsForInventory = orderData.items || [];
    businessIdForInventory = resolvedBusinessId;
  });

  await handleStockReduction(businessIdForInventory, orderItemsForInventory);
}

export function subscribeToSalesHistory(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const salesQuery = query(collection(db, "sales_history"), where("business_id", "==", businessId));

  return onSnapshot(salesQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  });
}

export function subscribeToDailySales(businessId, callback) {
  const salesQuery = query(
    collection(db, "sales_history"),
    where("business_id", "==", businessId),
    where("closed_at", ">=", startOfDay())
  );

  return onSnapshot(salesQuery, (snapshot) => {
    const sales = snapshot.docs.map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
    }));

    const byMethod = sales.reduce((accumulator, sale) => {
      accumulatePaymentBreakdown(
        accumulator,
        sale.payment_breakdown,
        sale.payment_method || sale.method || "cash",
        Number(sale.total) || 0
      );
      return accumulator;
    }, createEmptyPaymentTotals());

    callback({
      sales,
      total: sales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0),
      byMethod,
    });
  });
}
