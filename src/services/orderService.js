import { closePosSale } from "./app/salesGateway";
import {
  listActiveTableOrders,
  subscribeActiveTableOrders,
} from "./supabase/salonService";
import { QUICK_SALE_TABLE } from "../utils/posConstants";

function normalizeOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("La orden debe incluir al menos un item.");
  }

  return items.map((item, index) => ({
    ...item,
    id: String(item?.id || item?.productId || `item-${index + 1}`).trim(),
    productId: String(item?.productId || item?.id || `item-${index + 1}`).trim(),
    name: String(item?.name || item?.productName || "").trim(),
    productName: String(item?.productName || item?.name || "").trim(),
    quantity: Number(item?.quantity || 0),
    price: Number(item?.price ?? item?.unitPrice ?? 0),
    unitPrice: Number(item?.unitPrice ?? item?.price ?? 0),
  }));
}

function sortOrders(items = []) {
  return [...items].sort((left, right) =>
    String(right?.updated_at || right?.updatedAt || right?.created_at || "").localeCompare(
      String(left?.updated_at || left?.updatedAt || left?.created_at || ""),
      "es",
      { sensitivity: "base" }
    )
  );
}

export async function createOrder() {
  throw new Error("La creacion directa de ordenes usa la capa operativa de Salon en Supabase. Usa enviar a cocina.");
}

export function subscribeToActiveOrders(businessId, callback) {
  return subscribeActiveTableOrders(businessId, callback);
}

export function subscribeToOrderHistory(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  let cancelled = false;
  listActiveTableOrders(businessId)
    .then((orders) => {
      if (!cancelled) callback(sortOrders(orders));
    })
    .catch((error) => {
      console.error("orders history", error);
      if (!cancelled) callback([]);
    });

  return () => {
    cancelled = true;
  };
}

export function subscribeToActiveOrder(businessId, tableId, callback) {
  if (!businessId || !tableId) {
    callback(null);
    return () => {};
  }

  return subscribeActiveTableOrders(businessId, (orders) => {
    callback(orders.find((order) => order.table_id === tableId || order.tableId === tableId) || null);
  });
}

export async function submitOrder() {
  throw new Error("Enviar/editar ordenes de mesa debe hacerse desde Salon con las RPC operativas de Supabase.");
}

export async function requestPayment({
  businessId,
  tableId,
  paymentMethod,
  chargedTotal,
  subtotal,
  ticketConsumption,
  splitPayments,
  customer,
  actor,
  items = [],
  table = null,
}) {
  const normalizedItems = normalizeOrderItems(items);
  if (tableId !== QUICK_SALE_TABLE.id && table?.id !== QUICK_SALE_TABLE.id) {
    throw new Error("El cobro de mesas requiere cerrar la orden desde Salon con RPC Supabase.");
  }

  await closePosSale({
    businessId,
    table: table || QUICK_SALE_TABLE,
    items: normalizedItems,
    subtotal,
    chargedTotal,
    paymentMethod,
    splitPayments,
    customer,
    actor,
    ticketConsumption,
  });
}

export async function cancelOrder() {
  throw new Error("Cancelar ordenes requiere una RPC operativa en Supabase.");
}
