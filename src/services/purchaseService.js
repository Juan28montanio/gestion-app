export const PURCHASE_STATUS = {
  DRAFT: "borrador",
  CONFIRMED: "confirmada",
  CANCELED: "anulada",
  PARTIAL: "parcial",
  RETURNED: "devuelta",
};

export const INVENTORY_MOVEMENT_TYPES = {
  PURCHASE_IN: "purchase_in",
  PURCHASE_REVERSE: "purchase_reverse",
  ADJUSTMENT: "adjustment",
  PRODUCTION_OUT: "production_out",
  SALE_OUT: "sale_out",
  WASTE_OUT: "waste_out",
  PURCHASE_RETURN: "purchase_return",
};

export function calculatePurchaseTotals(items = []) {
  return items.reduce(
    (totals, item) => {
      const subtotal = Number(item?.subtotal ?? item?.line_total ?? item?.lineTotal ?? item?.total_cost ?? 0);
      const taxes = Number(item?.taxes ?? item?.tax ?? 0);
      return {
        subtotal: totals.subtotal + subtotal,
        taxes: totals.taxes + taxes,
        total: totals.total + subtotal + taxes,
      };
    },
    { subtotal: 0, taxes: 0, total: 0 }
  );
}

export function calculateAverageCost({ currentStock, currentAverageCost, incomingQuantity, incomingCost }) {
  const stock = Number(currentStock || 0);
  const averageCost = Number(currentAverageCost || 0);
  const quantity = Number(incomingQuantity || 0);
  const cost = Number(incomingCost || 0);
  const nextStock = stock + quantity;
  if (quantity === 0) return averageCost;
  return nextStock > 0 ? Math.max((stock * averageCost + quantity * cost) / nextStock, 0) : 0;
}

export async function createPurchase() {
  throw new Error("Compras requiere tablas/RPC Supabase antes de habilitar escrituras.");
}

export async function confirmPurchase() {
  throw new Error("Confirmar compras requiere una RPC Supabase antes de habilitarse.");
}

export async function cancelPurchase() {
  throw new Error("Anular compras requiere una RPC Supabase antes de habilitarse.");
}

export function calculateInventoryDifference() {
  return { touchedIngredientIds: [], impactLines: [] };
}

export async function updatePurchase() {
  throw new Error("Editar compras requiere una RPC Supabase antes de habilitarse.");
}

export async function registerPurchaseReturn() {
  throw new Error("Devoluciones de compra requieren una RPC Supabase antes de habilitarse.");
}

export function subscribeToPurchases(businessId, callback) {
  void businessId;
  callback([]);
  return () => {};
}

export function subscribeToInventoryMovements(businessId, callback) {
  void businessId;
  callback([]);
  return () => {};
}

export async function getIngredientPriceHistory() {
  return [];
}

export async function updatePurchaseMovement() {
  throw new Error("La edicion de compras desde Caja requiere una RPC Supabase antes de habilitarse.");
}
