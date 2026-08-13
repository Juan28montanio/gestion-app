import { getSupabaseClient } from "../lib/supabaseClient";

function normalizeText(value) {
  return String(value || "").trim();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildSupplySearchKey(name) {
  return normalizeText(name).toLocaleLowerCase("es");
}

function normalizeSupplyPayload(supply = {}, businessId = "") {
  const normalizedBusinessId = normalizeText(supply.business_id || supply.businessId || businessId);
  const name = normalizeText(supply.name);
  const unit = normalizeText(supply.unit || "und") || "und";
  const category = normalizeText(supply.category || supply.category_name || "");

  if (!normalizedBusinessId) {
    throw new Error("El negocio activo es obligatorio para guardar el insumo.");
  }

  if (!name) {
    throw new Error("El nombre del insumo es obligatorio.");
  }

  return {
    business_id: normalizedBusinessId,
    category_id: normalizeText(supply.category_id || supply.categoryId) || null,
    supplier_id: normalizeText(supply.supplier_id || supply.supplierId) || null,
    name,
    category,
    unit,
    status: normalizeText(supply.status || "active") || "active",
    current_stock: Math.max(toNumber(supply.current_stock ?? supply.currentStock ?? supply.stock, 0), 0),
    minimum_stock: Math.max(toNumber(supply.minimum_stock ?? supply.minimumStock ?? supply.min_stock, 0), 0),
    average_cost: Math.max(toNumber(supply.average_cost ?? supply.averageCost, 0), 0),
    last_purchase_cost: Math.max(toNumber(supply.last_purchase_cost ?? supply.lastPurchaseCost, 0), 0),
    metadata: {
      client_payload: supply,
      search_key: buildSupplySearchKey(name),
      code: normalizeText(supply.code),
      subcategory: normalizeText(supply.subcategory),
      description: normalizeText(supply.description),
      type: normalizeText(supply.type || "raw_material") || "raw_material",
      notes: normalizeText(supply.notes),
      conversion: {
        purchaseUnit: normalizeText(supply.purchaseUnit || supply.purchase_unit || unit) || unit,
        purchaseQuantity: Math.max(toNumber(supply.purchaseQuantity ?? supply.purchase_quantity, 1), 0),
        conversionFactor: Math.max(toNumber(supply.conversionFactor ?? supply.conversion_factor, 1), 0),
      },
      costs: {
        currentCost: Math.max(toNumber(supply.currentCost ?? supply.current_cost ?? supply.averageCost ?? supply.average_cost, 0), 0),
        averageCost: Math.max(toNumber(supply.averageCost ?? supply.average_cost, 0), 0),
        lastCost: Math.max(toNumber(supply.lastCost ?? supply.lastPurchaseCost ?? supply.last_purchase_cost, 0), 0),
      },
      inventory: {
        currentStock: Math.max(toNumber(supply.stock ?? supply.currentStock ?? supply.current_stock, 0), 0),
        minimumStock: Math.max(toNumber(supply.stockMinAlert ?? supply.minimumStock ?? supply.minimum_stock, 0), 0),
        idealStock: Math.max(toNumber(supply.idealStock ?? supply.ideal_stock, 0), 0),
        reorderPoint: Math.max(toNumber(supply.reorderPoint ?? supply.reorder_point, 0), 0),
        inventoryUnit: normalizeText(supply.inventoryUnit || supply.inventory_unit || unit) || unit,
        location: normalizeText(supply.location),
      },
      waste: {
        wastePercent: Math.max(toNumber(supply.wastePercent ?? supply.waste_percent, 0), 0),
        usefulYield: Math.max(toNumber(supply.usefulYield ?? supply.useful_yield, 0), 0),
        notes: normalizeText(supply.wasteNotes || supply.waste_notes),
      },
      storage: {
        type: normalizeText(supply.storageType || supply.storage_type),
        shelfLifeClosed: Math.max(toNumber(supply.shelfLifeClosed ?? supply.shelf_life_closed, 0), 0),
        shelfLifeOpened: Math.max(toNumber(supply.shelfLifeOpened ?? supply.shelf_life_opened, 0), 0),
        timeUnit: normalizeText(supply.timeUnit || supply.time_unit || "days") || "days",
      },
      supplier: {
        supplierName: normalizeText(supply.supplierName || supply.supplier_name),
      },
    },
  };
}

function adaptSupply(row = {}) {
  const metadata = row.metadata || {};
  const inventory = {
    ...(metadata.inventory || {}),
    currentStock: toNumber(row.current_stock),
    minimumStock: toNumber(row.minimum_stock),
    inventoryUnit: metadata.inventory?.inventoryUnit || row.unit,
  };
  const costs = {
    ...(metadata.costs || {}),
    averageCost: toNumber(row.average_cost),
    lastCost: toNumber(row.last_purchase_cost),
    currentCost: toNumber(metadata.costs?.currentCost ?? row.average_cost),
  };

  return {
    ...row,
    businessId: row.business_id,
    code: metadata.code || "",
    subcategory: metadata.subcategory || "",
    description: metadata.description || "",
    type: metadata.type || "raw_material",
    notes: metadata.notes || "",
    categoryId: row.category_id || "",
    category_id: row.category_id || null,
    supplierId: row.supplier_id || "",
    supplier_id: row.supplier_id || null,
    currentStock: toNumber(row.current_stock),
    current_stock: toNumber(row.current_stock),
    stock: toNumber(row.current_stock),
    minimumStock: toNumber(row.minimum_stock),
    minimum_stock: toNumber(row.minimum_stock),
    min_stock: toNumber(row.minimum_stock),
    averageCost: toNumber(row.average_cost),
    average_cost: toNumber(row.average_cost),
    lastPurchaseCost: toNumber(row.last_purchase_cost),
    last_purchase_cost: toNumber(row.last_purchase_cost),
    stock_min_alert: toNumber(row.minimum_stock),
    conversion: metadata.conversion || { purchaseUnit: row.unit, purchaseQuantity: 1, conversionFactor: 1 },
    inventory,
    costs,
    waste: metadata.waste || {},
    storage: metadata.storage || {},
    supplier: metadata.supplier || {},
    supplier_name: metadata.supplier?.supplierName || "",
    searchKey: row.metadata?.search_key || buildSupplySearchKey(row.name),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sortSupplies(items = []) {
  return [...items].sort((left, right) =>
    String(left?.name || "").localeCompare(String(right?.name || ""), "es", { sensitivity: "base" })
  );
}

export async function listSupplies(businessId) {
  const normalizedBusinessId = normalizeText(businessId);
  if (!normalizedBusinessId) return [];

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("supplies")
    .select("*")
    .eq("business_id", normalizedBusinessId)
    .neq("status", "archived")
    .order("name", { ascending: true });

  if (error) throw error;
  return sortSupplies((data || []).map(adaptSupply));
}

export function subscribeToSupplies(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  const publish = () => {
    listSupplies(businessId).then(callback).catch((error) => {
      console.error("[supplies]", error);
      callback([]);
    });
  };

  const channel = client
    .channel(`supplies:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "supplies",
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

export async function createSupply(businessId, supply) {
  const client = getSupabaseClient();
  const payload = normalizeSupplyPayload(supply, businessId);
  const { data, error } = await client.from("supplies").insert(payload).select("*").single();

  if (error) throw error;
  return data.id;
}

export async function updateSupply(supplyId, businessId, supply) {
  const normalizedSupplyId = normalizeText(supplyId);
  if (!normalizedSupplyId) {
    throw new Error("El insumo a editar es obligatorio.");
  }

  const client = getSupabaseClient();
  const payload = normalizeSupplyPayload(supply, businessId);
  const { error } = await client
    .from("supplies")
    .update(payload)
    .eq("id", normalizedSupplyId)
    .eq("business_id", payload.business_id);

  if (error) throw error;
}

export async function deleteSupply(supplyId) {
  const normalizedSupplyId = normalizeText(supplyId);
  if (!normalizedSupplyId) {
    throw new Error("El insumo a archivar es obligatorio.");
  }

  const client = getSupabaseClient();
  const { error } = await client
    .from("supplies")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", normalizedSupplyId);

  if (error) throw error;
}
