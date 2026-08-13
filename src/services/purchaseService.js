import { getSupabaseClient } from "../lib/supabaseClient";

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

function normalizeText(value) {
  return String(value || "").trim();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function calculatePurchaseTotals(items = []) {
  return items.reduce(
    (totals, item) => {
      const subtotal = Number(item?.subtotal ?? item?.line_total ?? item?.lineTotal ?? item?.total_cost ?? 0);
      const taxes = Number(item?.taxes ?? item?.tax_total ?? item?.tax ?? 0);
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

function normalizePurchaseItem(item = {}) {
  const quantity = toNumber(item.quantity);
  const unitCost = toNumber(item.unitCost ?? item.unit_cost ?? item.unit_price);
  const subtotal = toNumber(item.subtotal ?? item.line_total ?? quantity * unitCost);
  const taxTotal = toNumber(item.taxes ?? item.tax_total ?? item.tax);
  const name = normalizeText(item.inventoryItemName || item.ingredient_name || item.item_name || item.manualName);

  if (!name) {
    throw new Error("Cada linea de compra debe tener nombre de insumo o producto.");
  }

  if (quantity <= 0 || unitCost < 0) {
    throw new Error("Cada linea debe tener cantidad mayor a cero y costo unitario valido.");
  }

  return {
    product_id: normalizeText(item.product_id || item.productId) || null,
    inventory_item_id: normalizeText(item.inventoryItemId || item.inventory_item_id || item.ingredient_id) || null,
    item_name: name,
    category: normalizeText(item.category) || null,
    quantity,
    unit: normalizeText(item.unit || "und") || "und",
    unit_cost: unitCost,
    subtotal,
    tax_total: taxTotal,
    batch: normalizeText(item.batch) || null,
    expiration_date: normalizeText(item.expirationDate || item.expiration_date) || null,
    notes: normalizeText(item.notes) || null,
    metadata: {
      client_payload: item,
    },
  };
}

function normalizePurchasePayload(purchase = {}) {
  const businessId = normalizeText(purchase.business_id || purchase.businessId);
  const supplierId = normalizeText(purchase.supplier_id || purchase.supplierId);
  const items = (purchase.items || []).map(normalizePurchaseItem);
  const totals = calculatePurchaseTotals(items);

  if (!businessId) {
    throw new Error("El negocio activo es obligatorio para registrar la compra.");
  }

  if (!supplierId) {
    throw new Error("Selecciona un proveedor.");
  }

  if (!items.length) {
    throw new Error("Agrega al menos un producto comprado.");
  }

  return {
    header: {
      business_id: businessId,
      supplier_id: supplierId,
      supplier_name: normalizeText(purchase.supplier_name || purchase.supplierName),
      purchase_number: normalizeText(purchase.purchaseNumber || purchase.purchase_number) || null,
      purchase_date: normalizeText(purchase.purchase_date || purchase.purchaseDate) || new Date().toISOString().slice(0, 10),
      status: PURCHASE_STATUS.DRAFT,
      payment_status: "pending",
      payment_method: "credit",
      subtotal: totals.subtotal,
      tax_total: totals.taxes,
      total: totals.total,
      paid_amount: 0,
      pending_amount: totals.total,
      notes: normalizeText(purchase.notes) || null,
      metadata: {
        client_payload: purchase,
        supplier_payment_terms: normalizeText(purchase.supplier_payment_terms || purchase.supplierPaymentTerms || "Contado"),
      },
    },
    items,
    requestedStatus: purchase.status || PURCHASE_STATUS.DRAFT,
  };
}

function adaptPurchase(row = {}) {
  const items = (row.purchase_items || row.items || []).map((item) => ({
    id: item.id,
    inventoryItemId: item.inventory_item_id || "",
    inventoryItemName: item.item_name || "",
    ingredient_id: item.inventory_item_id || "",
    ingredient_name: item.item_name || "",
    product_id: item.product_id || null,
    category: item.category || "",
    quantity: toNumber(item.quantity),
    unit: item.unit || "und",
    unitCost: toNumber(item.unit_cost),
    unit_cost: toNumber(item.unit_cost),
    subtotal: toNumber(item.subtotal),
    taxes: toNumber(item.tax_total),
    tax_total: toNumber(item.tax_total),
    batch: item.batch || "",
    expirationDate: item.expiration_date || "",
    expiration_date: item.expiration_date || "",
    notes: item.notes || "",
  }));

  return {
    id: row.id,
    business_id: row.business_id,
    supplierId: row.supplier_id || "",
    supplier_id: row.supplier_id || "",
    supplierName: row.supplier_name || "",
    supplier_name: row.supplier_name || "",
    purchaseNumber: row.purchase_number || row.id,
    purchase_number: row.purchase_number || row.id,
    invoice_number: row.purchase_number || row.id,
    purchaseDate: row.purchase_date || "",
    purchase_date: row.purchase_date || "",
    status: row.status || PURCHASE_STATUS.DRAFT,
    payment_status: row.payment_status || "pending",
    payment_method: row.payment_method || "credit",
    subtotal: toNumber(row.subtotal),
    tax_total: toNumber(row.tax_total),
    total: toNumber(row.total),
    paid_amount: toNumber(row.paid_amount),
    pending_amount: toNumber(row.pending_amount),
    notes: row.notes || "",
    items,
    audit: {
      createdBy: row.created_by || "",
      confirmedBy: row.confirmed_by || "",
      canceledBy: row.cancelled_by || "",
      cancelReason: row.metadata?.cancel_reason || "",
    },
    history: row.metadata?.history || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function adaptInventoryMovement(row = {}) {
  return {
    ...row,
    sourceId: row.source_id,
    source_id: row.source_id,
    sourceType: row.source_type,
    source_type: row.source_type,
    movementType: row.movement_type,
    movement_type: row.movement_type,
    inventoryItemName: row.metadata?.item_name || row.metadata?.inventory_item_id || "",
    inventory_item_id: row.metadata?.inventory_item_id || "",
    totalCost: toNumber(row.quantity) * toNumber(row.unit_cost),
    createdAt: row.created_at,
  };
}

export async function listPurchases(businessId) {
  const normalizedBusinessId = normalizeText(businessId);
  if (!normalizedBusinessId) return [];

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("purchases")
    .select("*, purchase_items(*)")
    .eq("business_id", normalizedBusinessId)
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(adaptPurchase);
}

export async function createPurchase(purchase) {
  const client = getSupabaseClient();
  const payload = normalizePurchasePayload(purchase);

  const { data, error } = await client.rpc("save_purchase", {
    p_business_id: payload.header.business_id,
    p_purchase_id: null,
    p_purchase: payload.header,
    p_items: payload.items,
    p_confirm: payload.requestedStatus === PURCHASE_STATUS.CONFIRMED,
    p_notes: "Registro desde modulo de compras",
  });

  if (error) throw error;
  return data?.purchase_id || data;
}

export async function confirmPurchase(purchaseId) {
  const normalizedPurchaseId = normalizeText(purchaseId);
  if (!normalizedPurchaseId) {
    throw new Error("La compra a confirmar es obligatoria.");
  }

  const client = getSupabaseClient();
  const { data: purchase, error: readError } = await client
    .from("purchases")
    .select("business_id")
    .eq("id", normalizedPurchaseId)
    .single();

  if (readError) throw readError;

  const { data, error } = await client.rpc("confirm_purchase", {
    p_business_id: purchase.business_id,
    p_purchase_id: normalizedPurchaseId,
    p_notes: "Confirmacion desde modulo de compras",
  });

  if (error) throw error;
  return data;
}

export async function cancelPurchase(purchaseId, reason = "") {
  const normalizedPurchaseId = normalizeText(purchaseId);
  const normalizedReason = normalizeText(reason);
  if (!normalizedPurchaseId || !normalizedReason) {
    throw new Error("La compra y el motivo de anulacion son obligatorios.");
  }

  const client = getSupabaseClient();
  const { error } = await client.rpc("cancel_purchase", {
    p_purchase_id: normalizedPurchaseId,
    p_reason: normalizedReason,
  });

  if (error) throw error;
}

export function calculateInventoryDifference() {
  return { touchedIngredientIds: [], impactLines: [] };
}

export async function updatePurchase(purchaseId, purchase) {
  const normalizedPurchaseId = normalizeText(purchaseId);
  if (!normalizedPurchaseId) {
    throw new Error("Editar compras requiere una compra valida.");
  }

  const client = getSupabaseClient();
  const payload = normalizePurchasePayload(purchase);
  const { error } = await client.rpc("save_purchase", {
    p_business_id: payload.header.business_id,
    p_purchase_id: normalizedPurchaseId,
    p_purchase: payload.header,
    p_items: payload.items,
    p_confirm: payload.requestedStatus === PURCHASE_STATUS.CONFIRMED,
    p_notes: "Edicion desde modulo de compras",
  });

  if (error) throw error;
}

export async function registerPurchaseReturn() {
  throw new Error("Devoluciones de compra requieren una RPC Supabase antes de habilitarse.");
}

export function subscribeToPurchases(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  const publish = () => {
    listPurchases(businessId).then(callback).catch((error) => {
      console.error("[purchases]", error);
      callback([]);
    });
  };

  const channels = ["purchases", "purchase_items", "accounts_payable"].map((table) =>
    client
      .channel(`purchases:${table}:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `business_id=eq.${businessId}`,
        },
        publish
      )
      .subscribe()
  );

  publish();
  return () => {
    channels.forEach((channel) => client.removeChannel(channel));
  };
}

export function subscribeToInventoryMovements(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  const publish = async () => {
    const { data, error } = await client
      .from("inventory_movements")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[inventoryMovements]", error);
      callback([]);
      return;
    }

    callback((data || []).map(adaptInventoryMovement));
  };

  const channel = client
    .channel(`inventory_movements:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "inventory_movements",
        filter: `business_id=eq.${businessId}`,
      },
      publish
    )
    .subscribe();

  publish();
  return () => {
    client.removeChannel(channel);
  };
}

export async function getIngredientPriceHistory() {
  return [];
}

export async function updatePurchaseMovement() {
  throw new Error("La edicion de compras desde Caja requiere una RPC de auditoria en Supabase.");
}
