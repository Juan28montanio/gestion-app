import { getSupabaseClient } from "../../lib/supabaseClient";

const ACTIVE_SESSION_STATUSES = ["waiting_order", "occupied", "order_sent", "preparing", "ready", "waiting_payment"];
const ACTIVE_ORDER_STATUSES = ["sent", "preparing", "ready", "cuenta_solicitada", "waiting_payment"];
const ACTIVE_TICKET_STATUSES = ["pending", "preparing", "ready"];

function normalizeDateSort(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function mapTable(row = {}) {
  return {
    ...row,
    businessId: row.business_id,
    isActive: row.is_active,
    current_session_id: row.current_session_id,
    current_order_id: row.current_order_id,
    current_order_summary: row.current_order_summary || "",
    current_total: Number(row.current_total || 0),
    guests_count: Number(row.guests_count || 0),
    deletedAt: null,
    disabledAt: row.disabled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSession(row = {}) {
  return {
    ...row,
    businessId: row.business_id,
    tableId: row.table_id,
    customerId: row.customer_id,
    waiterId: row.waiter_id,
    tableName: row.table_name,
    waiterName: row.waiter_name,
    customerName: row.customer_name,
    guestsCount: Number(row.guests_count || 0),
    totalItems: Number(row.total_items || 0),
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    lastActivityAt: row.last_activity_at,
    paymentRequestedAt: row.payment_requested_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrder(row = {}) {
  return {
    ...row,
    businessId: row.business_id,
    tableId: row.table_id,
    table_id: row.table_id,
    sessionId: row.session_id,
    session_id: row.session_id,
    customerId: row.customer_id,
    customer_id: row.customer_id,
    tableName: row.table_name,
    table_name: row.table_name,
    customerName: row.customer_name,
    customer_name: row.customer_name,
    waiterId: row.waiter_id,
    waiter_id: row.waiter_id,
    kitchenStatus: row.kitchen_status,
    kitchen_status: row.kitchen_status,
    items: Array.isArray(row.items) ? row.items : [],
    itemsCount: Number(row.items_count || 0),
    items_count: Number(row.items_count || 0),
    sentAt: row.sent_at,
    sent_at: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapKitchenTicket(row = {}) {
  return {
    ...row,
    businessId: row.business_id,
    tableId: row.table_id,
    table_id: row.table_id,
    sessionId: row.session_id,
    session_id: row.session_id,
    orderId: row.order_id,
    order_id: row.order_id,
    tableName: row.table_name,
    table_name: row.table_name,
    items: Array.isArray(row.items) ? row.items : [],
    sentAt: row.sent_at,
    sent_at: row.sent_at,
    startedAt: row.started_at,
    readyAt: row.ready_at,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvent(row = {}) {
  return {
    ...row,
    businessId: row.business_id,
    tableId: row.table_id,
    table_id: row.table_id,
    sessionId: row.session_id,
    session_id: row.session_id,
    orderId: row.order_id,
    order_id: row.order_id,
    eventType: row.event_type,
    event_type: row.event_type,
    previousValue: row.previous_value,
    newValue: row.new_value,
    createdBy: row.created_by,
    created_by: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    created_at: row.created_at,
  };
}

function isMissingRelation(error) {
  const message = String(error?.message || "");
  return error?.code === "42P01" || error?.code === "PGRST205" || message.includes("Could not find the table");
}

async function safeQuery(queryBuilder, fallback = []) {
  const { data, error } = await queryBuilder;
  if (error) {
    if (isMissingRelation(error)) return fallback;
    throw error;
  }
  return data || fallback;
}

function subscribeToTable(client, { businessId, table, filter = "", event = "*" }, publish) {
  const channel = client
    .channel(`salon_${table}:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event,
        schema: "public",
        table,
        filter: filter || `business_id=eq.${businessId}`,
      },
      publish
    )
    .subscribe();

  return () => client.removeChannel(channel);
}

export async function listTables(businessId) {
  const client = getSupabaseClient();
  const rows = await safeQuery(
    client.from("tables").select("*").eq("business_id", businessId).order("number", { ascending: true })
  );
  return rows.map(mapTable);
}

export function subscribeTables(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  const publish = () => listTables(businessId).then(callback).catch((error) => {
    console.error("supabase tables", error);
    callback([]);
  });

  publish();
  return subscribeToTable(client, { businessId, table: "tables" }, publish);
}

export async function createTableRow(businessId, tableInput) {
  const client = getSupabaseClient();
  const payload = {
    business_id: businessId,
    number: Number(tableInput.number),
    name: String(tableInput.name || `Mesa ${tableInput.number}`).trim(),
    capacity: Number(tableInput.capacity || 2),
    zone: String(tableInput.zone || "Salon principal").trim(),
    status: String(tableInput.status || "free").trim(),
    icon: String(tableInput.icon || "UtensilsCrossed").trim(),
    code: String(tableInput.code || "").trim(),
    shape: String(tableInput.shape || "square").trim(),
    size: String(tableInput.size || "md").trim(),
    position: tableInput.position || { x: Number(tableInput.x || 0), y: Number(tableInput.y || 0) },
    is_active: tableInput.isActive ?? tableInput.is_active ?? true,
  };

  const { data, error } = await client.from("tables").insert(payload).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function updateTableRow(tableId, businessId, tableInput) {
  const client = getSupabaseClient();
  const payload = {
    number: Number(tableInput.number),
    name: String(tableInput.name || `Mesa ${tableInput.number}`).trim(),
    capacity: Number(tableInput.capacity || 2),
    zone: String(tableInput.zone || "Salon principal").trim(),
    status: String(tableInput.status || "free").trim(),
    icon: String(tableInput.icon || "UtensilsCrossed").trim(),
    code: String(tableInput.code || "").trim(),
    shape: String(tableInput.shape || "square").trim(),
    size: String(tableInput.size || "md").trim(),
    position: tableInput.position || { x: Number(tableInput.x || 0), y: Number(tableInput.y || 0) },
    is_active: tableInput.isActive ?? tableInput.is_active ?? true,
  };

  const { error } = await client.from("tables").update(payload).eq("id", tableId).eq("business_id", businessId);
  if (error) throw error;
}

export async function disableTableRow(tableId) {
  const client = getSupabaseClient();
  const { error } = await client
    .from("tables")
    .update({ status: "disabled", is_active: false, disabled_at: new Date().toISOString() })
    .eq("id", tableId);
  if (error) throw error;
}

export async function deleteTableRow(tableId) {
  const client = getSupabaseClient();
  const { error } = await client.from("tables").delete().eq("id", tableId);
  if (error) throw error;
}

export async function updateTableRowState(tableId, updates) {
  const client = getSupabaseClient();
  const payload = {
    ...updates,
    is_active: updates.isActive ?? updates.is_active,
  };
  delete payload.isActive;
  const { error } = await client.from("tables").update(payload).eq("id", tableId);
  if (error) throw error;
}

export async function listActiveTableSessions(businessId) {
  const client = getSupabaseClient();
  const rows = await safeQuery(
    client.from("table_sessions").select("*").eq("business_id", businessId).in("status", ACTIVE_SESSION_STATUSES)
  );
  return rows.map(mapSession);
}

export function subscribeActiveTableSessions(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }
  const client = getSupabaseClient();
  const publish = () => listActiveTableSessions(businessId).then(callback).catch((error) => {
    console.error("supabase table_sessions", error);
    callback([]);
  });
  publish();
  return subscribeToTable(client, { businessId, table: "table_sessions" }, publish);
}

export async function listActiveTableOrders(businessId) {
  const client = getSupabaseClient();
  const rows = await safeQuery(
    client.from("table_orders").select("*").eq("business_id", businessId).in("status", ACTIVE_ORDER_STATUSES)
  );
  return rows.map(mapOrder).sort((a, b) => normalizeDateSort(b.updated_at) - normalizeDateSort(a.updated_at));
}

export function subscribeActiveTableOrders(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }
  const client = getSupabaseClient();
  const publish = () => listActiveTableOrders(businessId).then(callback).catch((error) => {
    console.error("supabase table_orders", error);
    callback([]);
  });
  publish();
  return subscribeToTable(client, { businessId, table: "table_orders" }, publish);
}

export async function listKitchenTickets(businessId) {
  const client = getSupabaseClient();
  const rows = await safeQuery(
    client.from("kitchen_tickets").select("*").eq("business_id", businessId).in("status", ACTIVE_TICKET_STATUSES)
  );
  return rows.map(mapKitchenTicket).sort((a, b) => normalizeDateSort(b.updated_at) - normalizeDateSort(a.updated_at));
}

export function subscribeKitchenTickets(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }
  const client = getSupabaseClient();
  const publish = () => listKitchenTickets(businessId).then(callback).catch((error) => {
    console.error("supabase kitchen_tickets", error);
    callback([]);
  });
  publish();
  return subscribeToTable(client, { businessId, table: "kitchen_tickets" }, publish);
}

export async function listTableEvents(businessId, tableId) {
  const client = getSupabaseClient();
  const rows = await safeQuery(
    client
      .from("table_events")
      .select("*")
      .eq("business_id", businessId)
      .eq("table_id", tableId)
      .order("created_at", { ascending: false })
      .limit(30)
  );
  return rows.map(mapEvent);
}

export function subscribeTableEvents(businessId, tableId, callback) {
  if (!businessId || !tableId) {
    callback([]);
    return () => {};
  }
  const client = getSupabaseClient();
  const publish = () => listTableEvents(businessId, tableId).then(callback).catch((error) => {
    console.error("supabase table_events", error);
    callback([]);
  });
  publish();
  return subscribeToTable(client, { businessId, table: "table_events", filter: `table_id=eq.${tableId}` }, publish);
}

export async function callOpenTableSession({ businessId, table, waiter, guestsCount, customer, notes }) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("open_table_session", {
    p_business_id: businessId,
    p_table_id: table.id,
    p_waiter_name: waiter?.displayName || waiter?.display_name || waiter?.name || waiter?.email || "Usuario",
    p_guests_count: Number(guestsCount || 1),
    p_customer_id: customer?.id || null,
    p_customer_name: customer?.name || "",
    p_notes: String(notes || "").trim(),
  });
  if (error) throw error;
  return data;
}

export async function callSendOrderToKitchen({ businessId, table, session, currentOrder, items, customer }) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("send_order_to_kitchen", {
    p_business_id: businessId,
    p_table_id: table.id,
    p_session_id: session.id,
    p_order_id: currentOrder?.id || null,
    p_items: items,
    p_customer_id: customer?.id || null,
    p_customer_name: customer?.name || "",
  });
  if (error) throw error;
  return data;
}

export async function callUpdateKitchenTicketStatus({ businessId, ticket, status }) {
  const client = getSupabaseClient();
  const { error } = await client.rpc("update_kitchen_ticket_status", {
    p_business_id: businessId,
    p_ticket_id: ticket.id,
    p_status: status,
  });
  if (error) throw error;
}

export async function callRequestTableBill({ businessId, table, session, order }) {
  const client = getSupabaseClient();
  const { error } = await client.rpc("request_table_bill", {
    p_business_id: businessId,
    p_table_id: table.id,
    p_session_id: session.id,
    p_order_id: order.id,
  });
  if (error) throw error;
}

export async function callReleaseCleanTable({ businessId, table }) {
  const client = getSupabaseClient();
  const { error } = await client.rpc("release_clean_table", {
    p_business_id: businessId,
    p_table_id: table.id,
  });
  if (error) throw error;
}

export async function callTransferTableSession({ businessId, sourceTable, targetTable, session, order }) {
  const client = getSupabaseClient();
  const { error } = await client.rpc("transfer_table_session", {
    p_business_id: businessId,
    p_source_table_id: sourceTable.id,
    p_target_table_id: targetTable.id,
    p_session_id: session.id,
    p_order_id: order?.id || null,
  });
  if (error) throw error;
}

export async function callCancelOrderItem({ businessId, table, session, order, lineId, reason }) {
  const client = getSupabaseClient();
  const { error } = await client.rpc("cancel_table_order_item", {
    p_business_id: businessId,
    p_table_id: table?.id || null,
    p_session_id: session?.id || null,
    p_order_id: order?.id,
    p_line_id: lineId,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function callReassignWaiter({ businessId, table, session, waiter }) {
  const client = getSupabaseClient();
  const { error } = await client.rpc("reassign_table_waiter", {
    p_business_id: businessId,
    p_table_id: table?.id || session?.table_id,
    p_session_id: session?.id,
    p_waiter_name: waiter?.displayName || waiter?.display_name || waiter?.name || waiter?.email || "Usuario",
  });
  if (error) throw error;
}

export async function fetchActiveOrderForTableSession(businessId, sessionId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("table_orders")
    .select("*")
    .eq("business_id", businessId)
    .eq("session_id", sessionId)
    .in("status", ACTIVE_ORDER_STATUSES)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }

  return data ? mapOrder(data) : null;
}

export async function forceTableCleaningState(tableId) {
  const client = getSupabaseClient();
  const { error } = await client.from("tables").update({ status: "cleaning" }).eq("id", tableId);
  if (error) throw error;
}
