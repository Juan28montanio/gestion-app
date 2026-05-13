import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { createSubscriptionErrorHandler } from "./subscriptionService";
import { calculateItemsCount, calculateOrderTotal, canOpenTable } from "../utils/salon";

const tablesCollection = collection(db, "tables");
const sessionsCollection = collection(db, "tableSessions");
const ordersCollection = collection(db, "orders");
const orderItemsCollection = collection(db, "orderItems");
const kitchenTicketsCollection = collection(db, "kitchenTickets");
const eventsCollection = collection(db, "tableEvents");

function createLineId(prefix = "line") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function byUpdatedAtDesc(items = []) {
  return [...items].sort((left, right) => {
    const leftTime = Number(left?.updatedAt?.seconds || left?.createdAt?.seconds || 0);
    const rightTime = Number(right?.updatedAt?.seconds || right?.createdAt?.seconds || 0);
    return rightTime - leftTime;
  });
}

function getUserName(user) {
  return user?.display_name || user?.displayName || user?.name || user?.email || "Usuario";
}

function buildEvent({
  businessId,
  tableId,
  sessionId = null,
  orderId = null,
  eventType,
  description,
  previousValue = null,
  newValue = null,
  createdBy,
}) {
  return {
    business_id: businessId,
    businessId,
    tableId,
    table_id: tableId,
    sessionId,
    session_id: sessionId,
    orderId,
    order_id: orderId,
    eventType,
    event_type: eventType,
    description,
    previousValue,
    previous_value: previousValue,
    newValue,
    new_value: newValue,
    createdBy: createdBy?.uid || createdBy?.id || null,
    created_by: createdBy?.uid || createdBy?.id || null,
    createdByName: getUserName(createdBy),
    createdAt: serverTimestamp(),
    created_at: serverTimestamp(),
  };
}

function normalizeOrderItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Agrega al menos un producto antes de enviar a cocina.");
  }

  return items.map((item, index) => {
    const productId = String(item?.productId || item?.id || "").trim();
    const productName = String(item?.productName || item?.name || "").trim();
    const quantity = Number(item?.quantity || 0);
    const unitPrice = Number(item?.unitPrice ?? item?.price ?? 0);

    if (!productId) {
      throw new Error("Cada item debe conservar el producto original del catalogo.");
    }

    if (!productName) {
      throw new Error("Cada item debe tener nombre.");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("La cantidad de cada item debe ser mayor a 0.");
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error("El precio de cada item debe ser valido.");
    }

    const modifiers = Array.isArray(item?.modifiers) ? item.modifiers : [];
    const modifiersTotal = modifiers.reduce((sum, modifier) => sum + Number(modifier?.price || 0), 0);

    return {
      lineId: item?.lineId || createLineId(`item-${index + 1}`),
      id: productId,
      productId,
      productName,
      name: productName,
      category: String(item?.category || "").trim(),
      quantity,
      unitPrice,
      price: unitPrice,
      subtotal: quantity * (unitPrice + modifiersTotal),
      modifiers,
      notes: String(item?.notes || item?.note || "").trim(),
      note: String(item?.notes || item?.note || "").trim(),
      status: "sent",
      product_type: String(item?.product_type || item?.productType || "standard").trim(),
      recipe_mode: String(item?.recipe_mode || item?.recipeMode || "direct").trim(),
      ticket_units: Number(item?.ticket_units || item?.ticketUnits || 0),
      ticket_validity_days: Number(item?.ticket_validity_days || item?.ticketValidityDays || 30),
      ticket_eligible: Boolean(item?.ticket_eligible),
      useTicket: Boolean(item?.useTicket),
      sentAt: new Date().toISOString(),
    };
  });
}

function buildOrderSummary(items = []) {
  return items
    .filter((item) => String(item.status || "") !== "canceled")
    .slice(0, 3)
    .map((item) => `${Number(item.quantity || 0)}x ${item.productName || item.name}`)
    .join(", ");
}

export function subscribeToActiveTableSessions(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const sessionsQuery = query(
    sessionsCollection,
    where("business_id", "==", businessId),
    where("status", "in", ["open", "waiting_order", "order_sent", "waiting_payment"])
  );

  return onSnapshot(
    sessionsQuery,
    (snapshot) => callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))),
    createSubscriptionErrorHandler({
      scope: "salon:subscribeToActiveTableSessions",
      callback,
      emptyValue: [],
    })
  );
}

export function subscribeToKitchenTickets(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const ticketsQuery = query(
    kitchenTicketsCollection,
    where("business_id", "==", businessId),
    where("status", "in", ["pending", "preparing", "ready"])
  );

  return onSnapshot(
    ticketsQuery,
    (snapshot) => callback(byUpdatedAtDesc(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })))),
    createSubscriptionErrorHandler({
      scope: "salon:subscribeToKitchenTickets",
      callback,
      emptyValue: [],
    })
  );
}

export function subscribeToTableEvents(businessId, tableId, callback) {
  if (!businessId || !tableId) {
    callback([]);
    return () => {};
  }

  const eventsQuery = query(
    eventsCollection,
    where("business_id", "==", businessId),
    where("table_id", "==", tableId)
  );

  return onSnapshot(
    eventsQuery,
    (snapshot) => callback(byUpdatedAtDesc(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })))),
    createSubscriptionErrorHandler({
      scope: "salon:subscribeToTableEvents",
      callback,
      emptyValue: [],
    })
  );
}

export async function openTableSession({
  businessId,
  table,
  waiter,
  guestsCount,
  customer,
  notes,
  createdBy,
}) {
  const normalizedBusinessId = String(businessId || "").trim();
  const tableId = String(table?.id || "").trim();
  const normalizedGuestsCount = Number(guestsCount || 0);
  const waiterId = String(waiter?.id || waiter?.uid || "").trim();
  const waiterName = getUserName(waiter);

  if (!normalizedBusinessId || !tableId) {
    throw new Error("La apertura requiere negocio y mesa.");
  }

  if (!waiterName) {
    throw new Error("Asigna un mesero para abrir la mesa.");
  }

  if (!Number.isFinite(normalizedGuestsCount) || normalizedGuestsCount <= 0) {
    throw new Error("El numero de personas debe ser mayor a 0.");
  }

  const tableRef = doc(tablesCollection, tableId);
  const sessionRef = doc(sessionsCollection);
  const eventRef = doc(eventsCollection);

  await runTransaction(db, async (transaction) => {
    const tableSnapshot = await transaction.get(tableRef);

    if (!tableSnapshot.exists()) {
      throw new Error("La mesa seleccionada no existe.");
    }

    const tableData = tableSnapshot.data();

    if (!canOpenTable(tableData)) {
      throw new Error("Esta mesa no esta libre para abrir atencion.");
    }

    transaction.set(sessionRef, {
      business_id: normalizedBusinessId,
      businessId: normalizedBusinessId,
      tableId,
      table_id: tableId,
      tableName: tableData.name || `Mesa ${tableData.number || ""}`.trim(),
      table_name: tableData.name || `Mesa ${tableData.number || ""}`.trim(),
      waiterId: waiterId || null,
      waiter_id: waiterId || null,
      waiterName,
      waiter_name: waiterName,
      customerId: customer?.id || null,
      customer_id: customer?.id || null,
      customerName: customer?.name || "",
      customer_name: customer?.name || "",
      guestsCount: normalizedGuestsCount,
      guests_count: normalizedGuestsCount,
      status: "waiting_order",
      openedAt: serverTimestamp(),
      opened_at: serverTimestamp(),
      closedAt: null,
      lastActivityAt: serverTimestamp(),
      paymentRequestedAt: null,
      totalItems: 0,
      total_items: 0,
      subtotal: 0,
      total: 0,
      notes: String(notes || "").trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(tableRef, {
      status: "waiting_order",
      current_session_id: sessionRef.id,
      current_order_id: null,
      current_order_summary: "",
      current_total: 0,
      waiter_name: waiterName,
      guests_count: normalizedGuestsCount,
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      eventRef,
      buildEvent({
        businessId: normalizedBusinessId,
        tableId,
        sessionId: sessionRef.id,
        eventType: "session_opened",
        description: `${waiterName} abrio ${tableData.name || `Mesa ${tableData.number || ""}`.trim()} para ${normalizedGuestsCount} persona(s).`,
        createdBy,
      })
    );
  });

  return sessionRef.id;
}

export async function sendOrderToKitchen({
  businessId,
  table,
  session,
  currentOrder,
  items,
  customer,
  createdBy,
}) {
  const normalizedBusinessId = String(businessId || "").trim();
  const tableId = String(table?.id || session?.tableId || session?.table_id || "").trim();
  const sessionId = String(session?.id || table?.current_session_id || "").trim();
  const newItems = normalizeOrderItems(items);
  const orderRef = currentOrder?.id ? doc(ordersCollection, currentOrder.id) : doc(ordersCollection);
  const ticketRef = doc(kitchenTicketsCollection);
  const tableRef = doc(tablesCollection, tableId);
  const sessionRef = doc(sessionsCollection, sessionId);
  const eventRef = doc(eventsCollection);

  if (!normalizedBusinessId || !tableId || !sessionId) {
    throw new Error("Para enviar pedido se requiere mesa y sesion activa.");
  }

  await runTransaction(db, async (transaction) => {
    const tableSnapshot = await transaction.get(tableRef);
    const sessionSnapshot = await transaction.get(sessionRef);
    const orderSnapshot = currentOrder?.id ? await transaction.get(orderRef) : null;

    if (!tableSnapshot.exists()) {
      throw new Error("La mesa seleccionada no existe.");
    }

    if (!sessionSnapshot.exists()) {
      throw new Error("La sesion de mesa ya no esta activa.");
    }

    const existingItems = orderSnapshot?.exists() ? orderSnapshot.data().items || [] : [];
    const allItems = [...existingItems, ...newItems];
    const subtotal = calculateOrderTotal(allItems);
    const totalItems = calculateItemsCount(allItems);
    const tableName = tableSnapshot.data().name || sessionSnapshot.data().tableName || "Mesa";
    const waiterId = sessionSnapshot.data().waiterId || sessionSnapshot.data().waiter_id || null;
    const orderPayload = {
      business_id: normalizedBusinessId,
      businessId: normalizedBusinessId,
      sessionId,
      session_id: sessionId,
      table_id: tableId,
      tableId,
      table_name: tableName,
      tableName,
      waiterId,
      waiter_id: waiterId,
      status: "sent",
      items: allItems,
      itemsCount: totalItems,
      items_count: totalItems,
      subtotal,
      taxes: 0,
      total: subtotal,
      kitchenStatus: "pending",
      kitchen_status: "pending",
      customer_id: customer?.id || sessionSnapshot.data().customer_id || null,
      customer_name: customer?.name || sessionSnapshot.data().customer_name || "",
      sentAt: serverTimestamp(),
      sent_at: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (orderSnapshot?.exists()) {
      transaction.update(orderRef, orderPayload);
    } else {
      transaction.set(orderRef, {
        ...orderPayload,
        createdAt: serverTimestamp(),
        created_at: serverTimestamp(),
      });
    }

    newItems.forEach((item) => {
      const itemRef = doc(orderItemsCollection);
      transaction.set(itemRef, {
        ...item,
        business_id: normalizedBusinessId,
        businessId: normalizedBusinessId,
        orderId: orderRef.id,
        order_id: orderRef.id,
        sessionId,
        session_id: sessionId,
        tableId,
        table_id: tableId,
        sent_at: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    transaction.set(ticketRef, {
      business_id: normalizedBusinessId,
      businessId: normalizedBusinessId,
      orderId: orderRef.id,
      order_id: orderRef.id,
      sessionId,
      session_id: sessionId,
      tableId,
      table_id: tableId,
      tableName,
      table_name: tableName,
      items: newItems,
      status: "pending",
      sentAt: serverTimestamp(),
      sent_at: serverTimestamp(),
      startedAt: null,
      readyAt: null,
      deliveredAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(sessionRef, {
      status: "order_sent",
      lastActivityAt: serverTimestamp(),
      totalItems,
      total_items: totalItems,
      subtotal,
      total: subtotal,
      updatedAt: serverTimestamp(),
    });

    transaction.update(tableRef, {
      status: "order_sent",
      current_session_id: sessionId,
      current_order_id: orderRef.id,
      current_order_summary: buildOrderSummary(allItems),
      current_total: subtotal,
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      eventRef,
      buildEvent({
        businessId: normalizedBusinessId,
        tableId,
        sessionId,
        orderId: orderRef.id,
        eventType: "order_sent",
        description: `Pedido enviado a cocina/barra con ${calculateItemsCount(newItems)} item(s).`,
        createdBy,
      })
    );
  });

  return orderRef.id;
}

export async function updateKitchenTicketStatus({
  businessId,
  ticket,
  status,
  createdBy,
}) {
  const ticketId = String(ticket?.id || "").trim();
  const nextStatus = String(status || "").trim();

  if (!ticketId || !nextStatus) {
    throw new Error("Indica ticket y estado de cocina.");
  }

  const nowField =
    nextStatus === "preparing"
      ? { startedAt: serverTimestamp(), started_at: serverTimestamp() }
      : nextStatus === "ready"
        ? { readyAt: serverTimestamp(), ready_at: serverTimestamp() }
        : nextStatus === "delivered"
          ? { deliveredAt: serverTimestamp(), delivered_at: serverTimestamp() }
          : {};
  const ticketRef = doc(kitchenTicketsCollection, ticketId);
  const orderRef = ticket.orderId || ticket.order_id ? doc(ordersCollection, ticket.orderId || ticket.order_id) : null;
  const tableRef = ticket.tableId || ticket.table_id ? doc(tablesCollection, ticket.tableId || ticket.table_id) : null;
  const sessionRef = ticket.sessionId || ticket.session_id ? doc(sessionsCollection, ticket.sessionId || ticket.session_id) : null;
  const eventRef = doc(eventsCollection);

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = orderRef ? await transaction.get(orderRef) : null;
    const nextItemStatus = nextStatus === "delivered" ? "delivered" : nextStatus;
    const nextTableStatus = nextStatus === "delivered" ? "occupied" : nextStatus;

    transaction.update(ticketRef, {
      status: nextStatus,
      ...nowField,
      updatedAt: serverTimestamp(),
    });

    if (orderRef && orderSnapshot?.exists()) {
      const ticketLineIds = new Set((ticket.items || []).map((item) => item.lineId).filter(Boolean));
      const nextItems = (orderSnapshot.data().items || []).map((item) =>
        ticketLineIds.has(item.lineId) ? { ...item, status: nextItemStatus } : item
      );
      transaction.update(orderRef, {
        items: nextItems,
        kitchenStatus: nextStatus,
        kitchen_status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    }

    if (tableRef && nextStatus !== "delivered") {
      transaction.update(tableRef, {
        status: nextTableStatus,
        updatedAt: serverTimestamp(),
      });
    }

    if (sessionRef) {
      transaction.update(sessionRef, {
        lastActivityAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    transaction.set(
      eventRef,
      buildEvent({
        businessId: String(businessId || ticket.business_id || "").trim(),
        tableId: ticket.tableId || ticket.table_id,
        sessionId: ticket.sessionId || ticket.session_id || null,
        orderId: ticket.orderId || ticket.order_id || null,
        eventType: nextStatus === "delivered" ? "item_delivered" : "kitchen_status_updated",
        description: `Cocina/barra cambio a ${nextStatus}.`,
        previousValue: ticket.status || null,
        newValue: nextStatus,
        createdBy,
      })
    );
  });
}

export async function requestTableBill({ businessId, table, session, order, createdBy }) {
  const tableId = String(table?.id || "").trim();
  const sessionId = String(session?.id || table?.current_session_id || "").trim();
  const orderId = String(order?.id || table?.current_order_id || "").trim();

  if (!tableId || !sessionId || !orderId) {
    throw new Error("La cuenta requiere mesa, sesion y pedido activo.");
  }

  await runTransaction(db, async (transaction) => {
    transaction.update(doc(tablesCollection, tableId), {
      status: "waiting_payment",
      current_session_id: sessionId,
      current_order_id: orderId,
      updatedAt: serverTimestamp(),
    });
    transaction.update(doc(sessionsCollection, sessionId), {
      status: "waiting_payment",
      paymentRequestedAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.update(doc(ordersCollection, orderId), {
      status: "cuenta_solicitada",
      updatedAt: serverTimestamp(),
    });
    transaction.set(
      doc(eventsCollection),
      buildEvent({
        businessId,
        tableId,
        sessionId,
        orderId,
        eventType: "payment_requested",
        description: "Cuenta solicitada para cierre de mesa.",
        createdBy,
      })
    );
  });
}

export async function cancelOrderItem({ businessId, table, session, order, lineId, reason, createdBy }) {
  const normalizedReason = String(reason || "").trim();
  const orderId = String(order?.id || "").trim();

  if (!orderId || !lineId) {
    throw new Error("Indica el item a cancelar.");
  }

  if (!normalizedReason) {
    throw new Error("El motivo de cancelacion es obligatorio.");
  }

  await runTransaction(db, async (transaction) => {
    const orderRef = doc(ordersCollection, orderId);
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error("La orden indicada no existe.");
    }

    const nextItems = (orderSnapshot.data().items || []).map((item) =>
      item.lineId === lineId
        ? {
            ...item,
            status: "canceled",
            cancelReason: normalizedReason,
            cancel_reason: normalizedReason,
            canceledAt: new Date().toISOString(),
          }
        : item
    );
    const subtotal = calculateOrderTotal(nextItems.filter((item) => item.status !== "canceled"));
    const totalItems = calculateItemsCount(nextItems.filter((item) => item.status !== "canceled"));

    transaction.update(orderRef, {
      items: nextItems,
      subtotal,
      total: subtotal,
      itemsCount: totalItems,
      updatedAt: serverTimestamp(),
    });

    if (session?.id) {
      transaction.update(doc(sessionsCollection, session.id), {
        subtotal,
        total: subtotal,
        totalItems,
        updatedAt: serverTimestamp(),
      });
    }

    if (table?.id) {
      transaction.update(doc(tablesCollection, table.id), {
        current_order_summary: buildOrderSummary(nextItems),
        current_total: subtotal,
        updatedAt: serverTimestamp(),
      });
    }

    transaction.set(
      doc(eventsCollection),
      buildEvent({
        businessId,
        tableId: table?.id || orderSnapshot.data().table_id,
        sessionId: session?.id || orderSnapshot.data().session_id || null,
        orderId,
        eventType: "item_canceled",
        description: `Item cancelado. Motivo: ${normalizedReason}`,
        newValue: { lineId, reason: normalizedReason },
        createdBy,
      })
    );
  });
}

export async function releaseCleanTable({ businessId, table, createdBy }) {
  const tableId = String(table?.id || "").trim();

  if (!tableId) {
    throw new Error("Indica la mesa a liberar.");
  }

  await runTransaction(db, async (transaction) => {
    transaction.update(doc(tablesCollection, tableId), {
      status: "free",
      current_order_id: null,
      current_session_id: null,
      current_order_summary: "",
      current_total: 0,
      waiter_name: "",
      guests_count: 0,
      updatedAt: serverTimestamp(),
    });
    transaction.set(
      doc(eventsCollection),
      buildEvent({
        businessId,
        tableId,
        eventType: "table_released",
        description: "Mesa marcada como limpia y libre.",
        createdBy,
      })
    );
  });
}

export async function reassignWaiter({ businessId, table, session, waiter, createdBy }) {
  const sessionId = String(session?.id || "").trim();
  const tableId = String(table?.id || session?.table_id || "").trim();
  const waiterName = getUserName(waiter);

  if (!sessionId || !tableId) {
    throw new Error("La reasignacion requiere una sesion activa.");
  }

  await runTransaction(db, async (transaction) => {
    transaction.update(doc(sessionsCollection, sessionId), {
      waiterId: waiter?.id || waiter?.uid || null,
      waiter_id: waiter?.id || waiter?.uid || null,
      waiterName,
      waiter_name: waiterName,
      updatedAt: serverTimestamp(),
    });
    transaction.update(doc(tablesCollection, tableId), {
      waiter_name: waiterName,
      updatedAt: serverTimestamp(),
    });
    transaction.set(
      doc(eventsCollection),
      buildEvent({
        businessId,
        tableId,
        sessionId,
        eventType: "waiter_changed",
        description: `Mesero reasignado a ${waiterName}.`,
        previousValue: session?.waiterName || session?.waiter_name || null,
        newValue: waiterName,
        createdBy,
      })
    );
  });
}

export async function transferTableSession({ businessId, sourceTable, targetTable, session, order, createdBy }) {
  const sourceTableId = String(sourceTable?.id || "").trim();
  const targetTableId = String(targetTable?.id || "").trim();
  const sessionId = String(session?.id || "").trim();
  const orderId = String(order?.id || "").trim();

  if (!sourceTableId || !targetTableId || !sessionId) {
    throw new Error("Selecciona mesa origen, mesa destino y sesion activa.");
  }

  await runTransaction(db, async (transaction) => {
    const targetSnapshot = await transaction.get(doc(tablesCollection, targetTableId));

    if (!targetSnapshot.exists() || !canOpenTable(targetSnapshot.data())) {
      throw new Error("La mesa destino no esta disponible.");
    }

    const targetName = targetSnapshot.data().name || `Mesa ${targetSnapshot.data().number || ""}`.trim();

    transaction.update(doc(tablesCollection, sourceTableId), {
      status: "free",
      current_session_id: null,
      current_order_id: null,
      current_order_summary: "",
      current_total: 0,
      updatedAt: serverTimestamp(),
    });
    transaction.update(doc(tablesCollection, targetTableId), {
      status: sourceTable.status || "occupied",
      current_session_id: sessionId,
      current_order_id: orderId || null,
      current_order_summary: sourceTable.current_order_summary || "",
      current_total: Number(sourceTable.current_total || 0),
      updatedAt: serverTimestamp(),
    });
    transaction.update(doc(sessionsCollection, sessionId), {
      tableId: targetTableId,
      table_id: targetTableId,
      tableName: targetName,
      table_name: targetName,
      updatedAt: serverTimestamp(),
    });

    if (orderId) {
      transaction.update(doc(ordersCollection, orderId), {
        tableId: targetTableId,
        table_id: targetTableId,
        tableName: targetName,
        table_name: targetName,
        updatedAt: serverTimestamp(),
      });
    }

    transaction.set(
      doc(eventsCollection),
      buildEvent({
        businessId,
        tableId: sourceTableId,
        sessionId,
        orderId: orderId || null,
        eventType: "table_transferred",
        description: `Sesion transferida a ${targetName}.`,
        previousValue: sourceTableId,
        newValue: targetTableId,
        createdBy,
      })
    );
  });
}

export async function fetchActiveOrderForSession(businessId, sessionId) {
  const snapshot = await getDocs(
    query(
      ordersCollection,
      where("business_id", "==", businessId),
      where("session_id", "==", sessionId),
      where("status", "in", ["sent", "preparando", "preparing", "cuenta_solicitada", "waiting_payment"])
    )
  );

  return snapshot.docs[0] ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } : null;
}

export async function forceTableCleaning({ tableId }) {
  await updateDoc(doc(tablesCollection, tableId), {
    status: "cleaning",
    updatedAt: serverTimestamp(),
  });
}
