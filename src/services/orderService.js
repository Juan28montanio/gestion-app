import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { closeOrderAndLogSale } from "./financeService";
import { QUICK_SALE_TABLE } from "../utils/posConstants";
import { createSubscriptionErrorHandler } from "./subscriptionService";

const ordersCollection = collection(db, "orders");
const tablesCollection = collection(db, "tables");

function sortOrders(items = []) {
  return [...items].sort((left, right) => {
    const leftTime = String(left?.updatedAt?.seconds || left?.updatedAt || left?.created_at?.seconds || 0);
    const rightTime = String(right?.updatedAt?.seconds || right?.updatedAt || right?.created_at?.seconds || 0);
    return rightTime.localeCompare(leftTime, "es", { sensitivity: "base" });
  });
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("La orden debe incluir al menos un item.");
  }

  return items.map((item, index) => {
    const quantity = Number(item?.quantity);
    const price = Number(item?.price);
    const name = String(item?.name || "").trim();
    const id = String(item?.id || item?.productId || `item-${index + 1}`).trim();
    const note = String(item?.note || "").trim();

    if (!name) {
      throw new Error("Cada item debe incluir nombre.");
    }

    if (!id) {
      throw new Error("Cada item debe incluir id.");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Cada item debe incluir una cantidad valida.");
    }

    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Cada item debe incluir un precio valido.");
    }

    const modifiers = Array.isArray(item?.modifiers)
      ? item.modifiers.map((modifier) => ({
          id: String(modifier?.id || "").trim(),
          name: String(modifier?.name || "").trim(),
          priceDelta: Number(modifier?.priceDelta ?? modifier?.price_delta ?? modifier?.price ?? 0) || 0,
          affectsInventory: Boolean(modifier?.affectsInventory ?? modifier?.affects_inventory),
          linkedInventoryItemId: String(modifier?.linkedInventoryItemId || "").trim(),
          linkedTechnicalSheetId: String(modifier?.linkedTechnicalSheetId || "").trim(),
          stationImpact: String(modifier?.stationImpact || "").trim(),
        }))
      : [];

    return {
      id,
      productId: id,
      name,
      productName: name,
      quantity,
      price,
      unitPrice: price,
      note,
      notes: note,
      category: String(item?.category || "").trim(),
      categoryId: String(item?.categoryId || "").trim(),
      product_type: String(item?.product_type || item?.productType || "standard").trim(),
      recipe_mode: String(item?.recipe_mode || item?.recipeMode || "direct").trim(),
      inventoryImpactMode: String(item?.inventoryImpactMode || item?.inventory_impact_mode || "").trim(),
      technicalSheetId: String(item?.technicalSheetId || item?.technical_sheet_id || "").trim(),
      kitchenStationId: String(item?.kitchenStationId || item?.kitchen_station_id || "").trim(),
      kitchenStationName: String(item?.kitchenStationName || item?.kitchen_station_name || "").trim(),
      requiresKitchen: Boolean(item?.requiresKitchen ?? item?.requires_kitchen),
      modifiers,
      ticket_units: Number(item?.ticket_units || item?.ticketUnits || 0),
      ticket_validity_days: Number(item?.ticket_validity_days || item?.ticketValidityDays || 30),
      ticket_eligible: Boolean(item?.ticket_eligible),
      useTicket: Boolean(item?.useTicket),
    };
  });
}

function calculateOrderTotal(items) {
  return items.reduce(
    (sum, item) => {
      const modifiersTotal = (item.modifiers || []).reduce(
        (modifierSum, modifier) => modifierSum + Number(modifier.priceDelta || 0),
        0
      );
      return sum + (Number(item.price || 0) + modifiersTotal) * Number(item.quantity || 0);
    },
    0
  );
}

function buildOrderSummary(items) {
  return items
    .slice(0, 3)
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(", ");
}

export async function createOrder(businessId, tableId, items, options = {}) {
  const normalizedBusinessId = String(businessId || "").trim();
  const normalizedTableId = String(tableId || "").trim();
  const normalizedItems = normalizeOrderItems(items);
  const total = calculateOrderTotal(normalizedItems);
  const currentOrderSummary = buildOrderSummary(normalizedItems);
  const customerId = String(options.customer?.id || options.customerId || "").trim();
  const customerName = String(options.customer?.name || options.customerName || "").trim();

  if (!normalizedBusinessId) {
    throw new Error("El business_id de la orden es obligatorio.");
  }

  if (!normalizedTableId) {
    throw new Error("El table_id de la orden es obligatorio.");
  }

  if (normalizedTableId === QUICK_SALE_TABLE.id) {
    const createdOrderRef = doc(ordersCollection);
    await setDoc(createdOrderRef, {
      business_id: normalizedBusinessId,
      table_id: normalizedTableId,
      table_name: QUICK_SALE_TABLE.name,
      items: normalizedItems,
      customer_id: customerId || null,
      customer_name: customerName || "",
      subtotal: total,
      total,
      status: "preparando",
      created_at: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return createdOrderRef.id;
  }

  return runTransaction(db, async (transaction) => {
    const tableRef = doc(tablesCollection, normalizedTableId);
    const tableSnapshot = await transaction.get(tableRef);

    if (!tableSnapshot.exists()) {
      throw new Error("La mesa seleccionada no existe.");
    }

    const createdOrderRef = doc(ordersCollection);

    transaction.set(createdOrderRef, {
      business_id: normalizedBusinessId,
      table_id: normalizedTableId,
      table_name: tableSnapshot.data().name || `Mesa ${tableSnapshot.data().number || ""}`.trim(),
      items: normalizedItems,
      customer_id: customerId || null,
      customer_name: customerName || "",
      subtotal: total,
      total,
      status: "preparando",
      created_at: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(tableRef, {
      status: "ocupada",
      current_order_id: createdOrderRef.id,
      current_order_summary: currentOrderSummary,
      current_total: total,
      updatedAt: serverTimestamp(),
    });

    return createdOrderRef.id;
  });
}

export function subscribeToActiveOrders(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const ordersQuery = query(
    ordersCollection,
    where("business_id", "==", businessId),
    where("status", "in", ["preparando", "sent", "preparing", "cuenta_solicitada", "open", "requested_bill", "waiting_payment"])
  );

  return onSnapshot(ordersQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  }, createSubscriptionErrorHandler({
    scope: "orders:subscribeToActiveOrders",
    callback,
    emptyValue: [],
  }));
}

export function subscribeToOrderHistory(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const ordersQuery = query(
    ordersCollection,
    where("business_id", "==", businessId)
  );

  return onSnapshot(ordersQuery, (snapshot) => {
    callback(
      sortOrders(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })))
    );
  }, createSubscriptionErrorHandler({
    scope: "orders:subscribeToOrderHistory",
    callback,
    emptyValue: [],
  }));
}

export function subscribeToActiveOrder(businessId, tableId, callback) {
  if (!tableId) {
    return () => {};
  }

  const orderQuery = query(
    ordersCollection,
    where("business_id", "==", businessId),
    where("table_id", "==", tableId),
    where("status", "in", ["preparando", "sent", "preparing", "cuenta_solicitada", "open", "requested_bill", "waiting_payment"])
  );

  return onSnapshot(orderQuery, (snapshot) => {
    const activeOrder = snapshot.docs[0];
    callback(activeOrder ? { id: activeOrder.id, ...activeOrder.data() } : null);
  }, createSubscriptionErrorHandler({
    scope: "orders:subscribeToActiveOrder",
    callback,
    emptyValue: null,
  }));
}

export async function submitOrder({
  businessId,
  table,
  items,
  total,
  orderId,
  customer,
}) {
  const normalizedItems = normalizeOrderItems(items);
  const customerId = String(customer?.id || "").trim();
  const customerName = String(customer?.name || "").trim();
  const calculatedSubtotal = calculateOrderTotal(normalizedItems);
  const currentOrderSummary = buildOrderSummary(normalizedItems);
  const payload = {
    business_id: String(businessId || "").trim(),
    table_id: String(table?.id || "").trim(),
    table_name: table?.name || `Mesa ${table?.number || ""}`.trim(),
    status:
      table?.status === "cuenta_solicitada" || table?.status === "requested_bill"
        ? "cuenta_solicitada"
        : "preparando",
    items: normalizedItems,
    customer_id: customerId || null,
    customer_name: customerName || "",
    subtotal: calculatedSubtotal,
    total: Number(total) || calculatedSubtotal,
    updatedAt: serverTimestamp(),
  };

  if (!payload.business_id || !payload.table_id) {
    throw new Error("La orden requiere business_id y table_id.");
  }

  if (orderId) {
    await updateDoc(doc(db, "orders", orderId), payload);
    if (table?.id !== QUICK_SALE_TABLE.id) {
      await updateDoc(doc(db, "tables", table.id), {
        status: "ocupada",
        current_order_id: orderId,
        current_order_summary: currentOrderSummary,
        current_total: payload.total,
        updatedAt: serverTimestamp(),
      });
    }
    return orderId;
  }

  return createOrder(payload.business_id, payload.table_id, normalizedItems, {
    customerId,
    customerName,
  });
}

export async function requestPayment({
  businessId,
  tableId,
  orderId,
  paymentMethod,
  chargedTotal,
  cashReceived,
  subtotal,
  ticketConsumption,
  splitPayments,
  customer,
  actor,
  tableSessionId,
  sessionId,
}) {
  await closeOrderAndLogSale(orderId, paymentMethod, {
    businessId,
    tableId,
    tableSessionId,
    sessionId,
    chargedTotal,
    cashReceived,
    subtotal,
    ticketConsumption,
    splitPayments,
    customer,
    actor,
  });
}

export async function cancelOrder({ tableId, orderId }) {
  const normalizedOrderId = String(orderId || "").trim();
  const normalizedTableId = String(tableId || "").trim();

  if (!normalizedOrderId || !normalizedTableId) {
    throw new Error("Para cancelar se requiere orderId y tableId.");
  }

  if (normalizedTableId === QUICK_SALE_TABLE.id) {
    await updateDoc(doc(db, "orders", normalizedOrderId), {
      status: "cancelada",
      cancelled_at: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const orderRef = doc(db, "orders", normalizedOrderId);
  const tableRef = doc(db, "tables", normalizedTableId);

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    const tableSnapshot = await transaction.get(tableRef);

    if (!orderSnapshot.exists()) {
      throw new Error("La orden indicada no existe.");
    }

    if (!tableSnapshot.exists()) {
      throw new Error("La mesa indicada no existe.");
    }

    transaction.update(orderRef, {
      status: "cancelada",
      cancelled_at: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(tableRef, {
      status: "disponible",
      current_order_id: null,
      current_order_summary: "",
      current_total: 0,
      updatedAt: serverTimestamp(),
    });
  });
}
