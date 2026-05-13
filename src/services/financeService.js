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
  updateDoc,
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
import { createSubscriptionErrorHandler } from "./subscriptionService";
import {
  buildPosSaleDocuments,
  writePosSaleDocuments,
} from "./posFinancialService";
import { applySaleInventoryImpact } from "./inventoryService";
import { subscribeToSalesLedger } from "./salesLedgerService";

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
      (item?.useTicket ? Number(item?.quantity || 0) : 0),
    0
  );
  const coveredAmount = items.reduce(
    (sum, item) =>
      sum +
      (item?.useTicket
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

function createSaleInventoryMovement(transaction, {
  businessId,
  saleId = "",
  orderId = "",
  inventoryItemId,
  inventoryItemName,
  productId = "",
  productName = "",
  quantity,
  unit = "und",
  unitCost = 0,
  stockBefore = 0,
  stockAfter = 0,
}) {
  const movementRef = doc(collection(db, "inventoryMovements"));
  transaction.set(movementRef, {
    businessId,
    business_id: businessId,
    type: "sale_out",
    movementType: "sale_out",
    movement_type: "sale_out",
    direction: "out",
    sourceType: "sale",
    source_type: "sale",
    sourceId: saleId || orderId || null,
    source_id: saleId || orderId || null,
    saleId: saleId || null,
    sale_id: saleId || null,
    orderId: orderId || null,
    order_id: orderId || null,
    inventoryItemId,
    inventory_item_id: inventoryItemId,
    inventoryItemName,
    inventory_item_name: inventoryItemName,
    productId: productId || null,
    product_id: productId || null,
    productName,
    product_name: productName,
    quantity: Math.abs(Number(quantity || 0)),
    unit,
    unitCost: Number(unitCost || 0),
    totalCost: Math.abs(Number(quantity || 0)) * Number(unitCost || 0),
    stockBefore: Number(stockBefore || 0),
    stock_before: Number(stockBefore || 0),
    stockAfter: Number(stockAfter || 0),
    stock_after: Number(stockAfter || 0),
    reason: "Descuento automatico por venta",
    status: "valid",
    createdAt: serverTimestamp(),
    createdBy: "system",
    created_by: "system",
  });
}

export async function handleStockReduction(businessId, orderItems, options = {}) {
  const normalizedBusinessId = String(businessId || "").trim();
  const saleId = String(options.saleId || "").trim();
  const orderId = String(options.orderId || "").trim();

  if (!normalizedBusinessId || !Array.isArray(orderItems) || orderItems.length === 0) {
    return;
  }

  const productAdjustments = new Map();
  const orderItemsByProduct = new Map();

  orderItems.forEach((item) => {
    const productId = String(item?.id || item?.productId || "").trim();
    const quantity = Number(item?.quantity || 0);

    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      return;
    }

    productAdjustments.set(productId, (productAdjustments.get(productId) || 0) + quantity);
    orderItemsByProduct.set(productId, item);
  });

  const recipeBooksSnapshot = await getDocs(
    query(collection(db, "recipeBooks"), where("business_id", "==", normalizedBusinessId))
  );

  const recipeBooks = recipeBooksSnapshot.docs
    .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
    .filter((recipeBook) => {
      const productId = String(recipeBook.product_id || "").trim();
      const linkedByOrder = [...orderItemsByProduct.values()].some(
        (item) => String(item?.technicalSheetId || item?.technical_sheet_id || "").trim() === recipeBook.id
      );
      return productAdjustments.has(productId) || linkedByOrder;
    });

  await runTransaction(db, async (transaction) => {
    const ingredientAdjustments = new Map();
    const productStockImpacts = [];

    for (const [productId, quantitySold] of productAdjustments.entries()) {
      const productRef = doc(db, "products", productId);
      const productSnapshot = await transaction.get(productRef);

      if (productSnapshot.exists()) {
        const productData = productSnapshot.data();
        const isTicketWalletProduct =
          String(productData.product_type || "").trim() === "ticket_wallet";
        const orderItem = orderItemsByProduct.get(productId) || {};
        const inventoryImpactMode = String(
          orderItem.inventoryImpactMode ||
            productData.inventory?.inventoryImpactMode ||
            (productData.inventory?.linkedTechnicalSheetId ? "technical_sheet" : "")
        ).trim();

        const consumesInventory = Boolean(productData.inventory?.consumesInventory ?? productData.consumesInventory);
        const shouldDiscountProductStock =
          !isTicketWalletProduct &&
          consumesInventory &&
          ["direct_item", "combo"].includes(inventoryImpactMode);

        if (shouldDiscountProductStock) {
          const currentStock = Number(productData.stock || 0);
          const nextStock = Math.max(currentStock - quantitySold, 0);
          productStockImpacts.push({
            productRef,
            patch: {
              stock: nextStock,
              updatedAt: serverTimestamp(),
            },
            movement: {
            businessId: normalizedBusinessId,
            saleId,
            orderId,
            inventoryItemId: productId,
            inventoryItemName: productData.name || orderItem.name || productId,
            productId,
            productName: productData.name || orderItem.name || "",
            quantity: quantitySold,
            unit: productData.unit || "und",
            unitCost: productData.costing?.estimatedCost || productData.cost || 0,
            stockBefore: currentStock,
            stockAfter: nextStock,
            },
          });
        }
      }

      const recipeBook = recipeBooks.find(
        (candidate) =>
          String(candidate.product_id || "").trim() === productId ||
          String(candidate.id || "").trim() ===
            String(orderItemsByProduct.get(productId)?.technicalSheetId || "").trim()
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

    const ingredientStockImpacts = [];
    for (const [ingredientId, quantityToDiscount] of ingredientAdjustments.entries()) {
      const ingredientRef = doc(db, "ingredients", ingredientId);
      const ingredientSnapshot = await transaction.get(ingredientRef);

      if (!ingredientSnapshot.exists()) {
        continue;
      }

      const ingredientData = ingredientSnapshot.data();
      const currentStock = Number(ingredientData.stock || 0);
      const nextStock = Math.max(currentStock - quantityToDiscount, 0);

      ingredientStockImpacts.push({
        ingredientRef,
        patch: {
          stock: nextStock,
          inventory: {
            ...(ingredientData.inventory || {}),
            currentStock: nextStock,
          },
          updatedAt: serverTimestamp(),
        },
        movement: {
          businessId: normalizedBusinessId,
          saleId,
          orderId,
          inventoryItemId: ingredientId,
          inventoryItemName: ingredientData.name || ingredientId,
          quantity: quantityToDiscount,
          unit: ingredientData.base_unit || ingredientData.baseUnit || ingredientData.unit || "und",
          unitCost:
            ingredientData.costs?.averageCost ||
            ingredientData.average_cost ||
            ingredientData.cost_per_base_unit ||
            ingredientData.cost_per_unit ||
            0,
          stockBefore: currentStock,
          stockAfter: nextStock,
        },
      });
    }

    productStockImpacts.forEach((impact) => {
      transaction.update(impact.productRef, impact.patch);
      createSaleInventoryMovement(transaction, impact.movement);
    });

    ingredientStockImpacts.forEach((impact) => {
      transaction.update(impact.ingredientRef, impact.patch);
      createSaleInventoryMovement(transaction, impact.movement);
    });

    if (saleId) {
      const hasInventoryImpact = productStockImpacts.length > 0 || ingredientStockImpacts.length > 0;
      transaction.update(doc(db, "sales", saleId), {
        inventoryImpactStatus: hasInventoryImpact ? "applied" : "not_applicable",
        inventory_impact_status: hasInventoryImpact ? "applied" : "not_applicable",
        inventoryAppliedAt: serverTimestamp(),
        inventory_applied_at: serverTimestamp(),
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
  let createdSaleId = "";
  const preloadedOrderSnapshot = await getDoc(orderRef);

  if (!preloadedOrderSnapshot.exists()) {
    throw new Error("La orden indicada no existe.");
  }

  const preloadedOrderData = preloadedOrderSnapshot.data();
  const openCashSession = await getCurrentOpenCashSession(preloadedOrderData.business_id);

  if (!openCashSession) {
    throw new Error("Debes abrir caja antes de registrar un cobro en el punto de venta.");
  }

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error("La orden indicada no existe.");
    }

    const orderData = orderSnapshot.data();
    const resolvedTableId = String(options.tableId || orderData.table_id || "").trim();
    const resolvedSessionId = String(
      options.tableSessionId || options.sessionId || orderData.sessionId || orderData.session_id || ""
    ).trim();
    const resolvedBusinessId = String(options.businessId || orderData.business_id || "").trim();
    const subtotal = Number(options.subtotal ?? orderData.subtotal ?? orderData.total ?? 0);
    const chargedTotalCandidate = Number(options.chargedTotal);
    const chargedTotal =
      Number.isFinite(chargedTotalCandidate) && chargedTotalCandidate >= 0
        ? chargedTotalCandidate
        : subtotal;
    const cashReceivedCandidate = Number(options.cashReceived);
    const cashReceived =
      Number.isFinite(cashReceivedCandidate) && cashReceivedCandidate >= 0
        ? cashReceivedCandidate
        : chargedTotal;
    const cashChange = Math.max(Number((cashReceived - chargedTotal).toFixed(2)), 0);
    const adjustmentAmount = chargedTotal - subtotal;
    const adjustmentPct = subtotal > 0 ? (adjustmentAmount / subtotal) * 100 : 0;
    const customerId = String(
      options.customer?.id || orderData.customer_id || options.customerId || ""
    ).trim();
    const customerName = String(
      options.customer?.name || orderData.customer_name || options.customerName || ""
    ).trim();
    const isTicketWalletPayment = normalizedPaymentMethod === "ticket_wallet";
    const ticketGrantUnits = getTicketProductGrant(orderData.items || []);
    const ticketConsumption = getTicketConsumption(
      orderData.items || [],
      options.ticketConsumption || {}
    );
    const debtAmount =
      !isTicketWalletPayment && customerId && subtotal > chargedTotal
        ? Number((subtotal - chargedTotal).toFixed(2))
        : 0;
    const legacyCashflowTotal = normalizedPaymentMethod === "account_credit" ? 0 : chargedTotal;
    const operationalSaleTotal = debtAmount > 0 || normalizedPaymentMethod === "account_credit"
      ? subtotal
      : chargedTotal + ticketConsumption.coveredAmount;
    const paymentAmount = normalizedPaymentMethod === "account_credit" ? operationalSaleTotal : chargedTotal;
    const paymentBreakdown = normalizePaymentBreakdown(
      options.splitPayments || [],
      normalizedPaymentMethod,
      paymentAmount
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
        : primaryPaymentMethod === "account_credit"
          ? "Cuenta por cobrar"
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

    if (paymentBreakdown.length > 1 && Math.abs(paymentBreakdownTotal - paymentAmount) > 1) {
      throw new Error("La suma del pago dividido debe coincidir con el valor final cobrado.");
    }

    if (normalizedPaymentMethod === "cash" && cashReceived < chargedTotal) {
      throw new Error("El efectivo recibido no cubre el valor final cobrado.");
    }

    const isQuickSale = resolvedTableId === QUICK_SALE_TABLE.id;
    const tableRef = isQuickSale ? null : doc(db, "tables", resolvedTableId);
    const tableSessionRef = !isQuickSale && resolvedSessionId ? doc(db, "tableSessions", resolvedSessionId) : null;
    const tableSnapshot = tableRef ? await transaction.get(tableRef) : null;
    const tableSessionSnapshot = tableSessionRef ? await transaction.get(tableSessionRef) : null;
    const customerRef = customerId ? doc(db, "customers", customerId) : null;
    const customerSnapshot = customerRef ? await transaction.get(customerRef) : null;

    if (!isQuickSale && !tableSnapshot?.exists()) {
      throw new Error("La mesa asociada a la orden no existe.");
    }

    const tableData = isQuickSale ? QUICK_SALE_TABLE : tableSnapshot.data();

    const posDocuments = buildPosSaleDocuments({
      businessId: resolvedBusinessId,
      orderId: normalizedOrderId,
      orderData,
      tableId: resolvedTableId,
      tableName: tableData.name || `Mesa ${tableData.number || ""}`.trim(),
      tableSessionId: resolvedSessionId || null,
      paymentMethod: normalizedPaymentMethod === "account_credit" ? "customer_credit" : normalizedPaymentMethod,
      paymentBreakdown: paymentBreakdown.map((line) => ({
        ...line,
        method: line.method === "account_credit" ? "customer_credit" : line.method,
      })),
      subtotal,
      chargedTotal: operationalSaleTotal,
      paymentAmount,
      cashReceived,
      ticketConsumption,
      ticketGrantUnits,
      customerId,
      customerName,
      cashSessionId: openCashSession?.id || "",
      actor: options.actor || options.currentUser || {},
    });
    createdSaleId = posDocuments.saleRef.id;
    writePosSaleDocuments(transaction, posDocuments);

    transaction.update(orderRef, {
      status: "pagada",
      sale_id: posDocuments.saleRef.id,
      saleId: posDocuments.saleRef.id,
      payment_method: primaryPaymentMethod,
      payment_label: paymentLabel,
      payment_breakdown: paymentBreakdown,
      customer_id: customerId || null,
      customer_name: customerName || "",
      table_session_id: resolvedSessionId || null,
      tableSessionId: resolvedSessionId || null,
      closing_id: openCashSession?.id || null,
      subtotal,
      total: operationalSaleTotal,
      cash_received: normalizedPaymentMethod === "cash" ? cashReceived : 0,
      cash_change: normalizedPaymentMethod === "cash" ? cashChange : 0,
      adjustment_amount: adjustmentAmount,
      adjustment_pct: adjustmentPct,
      debt_amount: debtAmount,
      pending_debt_remaining: debtAmount,
      settled_amount: paymentAmount,
      payment_status: debtAmount > 0 ? (paymentAmount > 0 ? "partial" : "pending") : "paid",
      payment_kind:
        primaryPaymentMethod === "split"
          ? "split_cashflow"
          : primaryPaymentMethod === "account_credit"
            ? "receivable"
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
      sale_id: posDocuments.saleRef.id,
      order_id: normalizedOrderId,
      table_session_id: resolvedSessionId || null,
      tableSessionId: resolvedSessionId || null,
      table_id: resolvedTableId,
      table_name: tableData.name || `Mesa ${tableData.number || ""}`.trim(),
      customer_id: customerId || null,
      customer_name: customerName || "",
      items: orderData.items || [],
      subtotal,
      total: legacyCashflowTotal,
      paid_amount: legacyCashflowTotal,
      cash_received: normalizedPaymentMethod === "cash" ? cashReceived : 0,
      cash_change: normalizedPaymentMethod === "cash" ? cashChange : 0,
      adjustment_amount: adjustmentAmount,
      adjustment_pct: adjustmentPct,
      debt_amount: debtAmount,
      pending_debt_remaining: debtAmount,
      settled_amount: paymentAmount,
      payment_status: debtAmount > 0 ? (paymentAmount > 0 ? "partial" : "pending") : "paid",
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
        status: "cleaning",
        current_session_id: null,
        current_order_id: null,
        current_order_summary: "",
        current_total: 0,
        updatedAt: serverTimestamp(),
      });
    }

    if (tableSessionRef && tableSessionSnapshot?.exists()) {
      transaction.update(tableSessionRef, {
        status: "closed",
        saleId: posDocuments.saleRef.id,
        sale_id: posDocuments.saleRef.id,
        orderId: normalizedOrderId,
        order_id: normalizedOrderId,
        closedAt: serverTimestamp(),
        closed_at: serverTimestamp(),
        total: operationalSaleTotal,
        paidAmount: paymentAmount,
        paid_amount: paymentAmount,
        pendingAmount: debtAmount,
        pending_amount: debtAmount,
        updatedAt: serverTimestamp(),
      });
    }

    orderItemsForInventory = orderData.items || [];
    businessIdForInventory = resolvedBusinessId;
  });

  try {
    await applySaleInventoryImpact(createdSaleId, {
      businessId: businessIdForInventory,
      saleItems: orderItemsForInventory.map((item) => ({
        business_id: businessIdForInventory,
        sale_id: createdSaleId,
        product_id: item.productId || item.id || "",
        product_name: item.name || "",
        quantity: Number(item.quantity || 0),
        technical_sheet_id: item.technicalSheetId || item.technical_sheet_id || null,
        inventory_impact_mode: item.inventoryImpactMode || item.inventory_impact_mode || "",
      })),
    });
  } catch (error) {
    if (createdSaleId) {
      await updateDoc(doc(db, "sales", createdSaleId), {
        inventoryImpactStatus: "failed",
        inventory_impact_status: "failed",
        inventoryImpactError: error instanceof Error ? error.message : "No fue posible impactar inventario.",
        inventory_impact_error: error instanceof Error ? error.message : "No fue posible impactar inventario.",
        updatedAt: serverTimestamp(),
      });
    }
    throw error;
  }
}

export function subscribeToSalesHistory(businessId, callback) {
  return subscribeToSalesLedger(businessId, callback);
}

export async function updateSaleHistoryEntry(saleId, updates = {}) {
  const normalizedSaleId = String(saleId || "").trim();
  if (!normalizedSaleId) {
    throw new Error("La venta a editar es obligatoria.");
  }

  const nextTotal = Number(updates.total);
  const nextMethod = String(updates.paymentMethod || "").trim();
  const payload = {
    concept: String(updates.concept || "").trim(),
    updatedAt: serverTimestamp(),
  };

  if (Number.isFinite(nextTotal) && nextTotal >= 0) {
    payload.total = nextTotal;
  }

  if (nextMethod) {
    payload.payment_method = nextMethod;
    payload.payment_label = nextMethod;
    payload.payment_breakdown = normalizePaymentBreakdown([], nextMethod, nextTotal || 0);
  }

  await updateDoc(doc(db, "sales_history", normalizedSaleId), payload);
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
  }, createSubscriptionErrorHandler({
    scope: "sales_history:subscribeToDailySales",
    callback,
    emptyValue: { sales: [], total: 0, byMethod: createEmptyPaymentTotals() },
  }));
}
