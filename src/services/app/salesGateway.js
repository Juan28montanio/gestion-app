import { buildSaleRpcPayload } from "../../domain/sales";
import { closeSaleWithRpc, subscribeToSalesLedger as subscribeToSupabaseSalesLedger } from "../supabase/salesService";
import { getCurrentOpenCashSession } from "./cashGateway";

export function subscribeToSalesLedger(businessId, callback) {
  return subscribeToSupabaseSalesLedger(businessId, callback);
}

export async function closePosSale({
  businessId,
  table,
  items,
  subtotal,
  chargedTotal,
  paymentMethod,
  splitPayments,
  customer,
  actor,
  ticketConsumption,
}) {
  const cashSession = await getCurrentOpenCashSession(businessId);
  if (!cashSession?.id) {
    throw new Error("Debes abrir caja antes de registrar una venta en Supabase.");
  }

  const payload = buildSaleRpcPayload({
    businessId,
    cashSessionId: cashSession.id,
    tableId: table?.id || "quick-sale",
    tableName: table?.name || "Venta rapida",
    items,
    subtotal,
    chargedTotal,
    paymentMethod,
    splitPayments,
    customer,
    actor,
    ticketConsumption,
  });

  return closeSaleWithRpc(payload);
}
