import {
  callCancelOrderItem,
  callOpenTableSession,
  callReassignWaiter,
  callReleaseCleanTable,
  callRequestTableBill,
  callSendOrderToKitchen,
  callTransferTableSession,
  callUpdateKitchenTicketStatus,
  fetchActiveOrderForTableSession,
  forceTableCleaningState,
  subscribeActiveTableSessions,
  subscribeKitchenTickets,
  subscribeTableEvents,
} from "./supabase/salonService";

export function subscribeToActiveTableSessions(businessId, callback) {
  return subscribeActiveTableSessions(businessId, callback);
}

export function subscribeToKitchenTickets(businessId, callback) {
  return subscribeKitchenTickets(businessId, callback);
}

export function subscribeToTableEvents(businessId, tableId, callback) {
  return subscribeTableEvents(businessId, tableId, callback);
}

export async function openTableSession(payload) {
  return callOpenTableSession(payload);
}

export async function sendOrderToKitchen(payload) {
  return callSendOrderToKitchen(payload);
}

export async function updateKitchenTicketStatus(payload) {
  return callUpdateKitchenTicketStatus(payload);
}

export async function requestTableBill(payload) {
  return callRequestTableBill(payload);
}

export async function cancelOrderItem(payload) {
  return callCancelOrderItem(payload);
}

export async function releaseCleanTable(payload) {
  return callReleaseCleanTable(payload);
}

export async function reassignWaiter(payload) {
  return callReassignWaiter(payload);
}

export async function transferTableSession(payload) {
  return callTransferTableSession(payload);
}

export async function fetchActiveOrderForSession(businessId, sessionId) {
  return fetchActiveOrderForTableSession(businessId, sessionId);
}

export async function forceTableCleaning({ tableId }) {
  return forceTableCleaningState(tableId);
}
