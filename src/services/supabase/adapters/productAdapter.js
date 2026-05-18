function normalizeText(value) {
  return String(value || "").trim();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeStatus(status) {
  const value = normalizeText(status || "active");
  return value === "archived" || value === "inactive" ? value : "active";
}

function getFirebaseMetadata(row = {}) {
  return row.metadata?.firebase && typeof row.metadata.firebase === "object"
    ? row.metadata.firebase
    : {};
}

export function adaptSupabaseProduct(row = {}) {
  const firebase = getFirebaseMetadata(row);
  const category = row.product_categories || {};
  const categoryName = normalizeText(category.name || firebase.categoryName || firebase.category || "General");
  const price = toNumber(row.price ?? firebase.price ?? firebase.pricing?.basePrice, 0);
  const cost = toNumber(row.cost ?? firebase.cost ?? firebase.costing?.estimatedCost, 0);
  const productType = normalizeText(row.product_type || firebase.product_type || firebase.type || "standard");
  const status = normalizeStatus(row.status || firebase.status);
  const inventory = {
    ...(firebase.inventory || {}),
    ...(row.inventory || {}),
  };
  const operation = firebase.operation || {};
  const tickets = firebase.tickets || {};

  return {
    ...firebase,
    id: row.id,
    legacy_firebase_id: row.legacy_firebase_id || firebase.id || "",
    business_id: row.business_id,
    businessId: row.business_id,
    name: normalizeText(row.name || firebase.name),
    code: normalizeText(row.code || firebase.code),
    description: normalizeText(row.description || firebase.description),
    categoryId: row.category_id || firebase.categoryId || "",
    categoryName,
    category: categoryName,
    imageUrl: normalizeText(firebase.imageUrl || firebase.image_url || ""),
    image_url: normalizeText(firebase.image_url || firebase.imageUrl || ""),
    type: productType,
    product_type: productType,
    status,
    is_available: status === "active",
    stock: toNumber(row.stock ?? firebase.stock, 0),
    price,
    recipe_mode: normalizeText(firebase.recipe_mode || (productType === "combo" ? "composed" : "direct")),
    pricing: {
      ...(firebase.pricing || {}),
      basePrice: price,
      taxRate: toNumber(row.tax_rate ?? firebase.pricing?.taxRate ?? firebase.tax_rate, 0),
      targetFoodCost: toNumber(firebase.pricing?.targetFoodCost ?? firebase.targetFoodCost, 30),
      suggestedPrice: toNumber(firebase.pricing?.suggestedPrice ?? firebase.suggested_price, 0),
    },
    costing: {
      ...(firebase.costing || {}),
      estimatedCost: cost,
    },
    inventory,
    operation: {
      availableForTables: operation.availableForTables ?? true,
      availableForQuickSale: operation.availableForQuickSale ?? true,
      availableForDelivery: operation.availableForDelivery ?? false,
      color: normalizeText(operation.color),
      icon: normalizeText(operation.icon),
      isFavorite: Boolean(operation.isFavorite),
      kitchenStationId: normalizeText(operation.kitchenStationId || "none"),
      kitchenStationName: normalizeText(operation.kitchenStationName || "No requiere preparacion"),
      preparationTime: toNumber(operation.preparationTime, 0),
      requiresKitchen: Boolean(operation.requiresKitchen),
      sortOrder: toNumber(operation.sortOrder, 0),
      visibleInMenu: operation.visibleInMenu ?? true,
      visibleInPOS: operation.visibleInPOS ?? true,
    },
    tickets: {
      eligibleForTicket: Boolean(tickets.eligibleForTicket ?? firebase.ticket_eligible),
      ticketEligibilityType: normalizeText(tickets.ticketEligibilityType || "meal"),
      ticketValueReference: normalizeText(tickets.ticketValueReference || "unit"),
      allowedTicketPlans: Array.isArray(tickets.allowedTicketPlans) ? tickets.allowedTicketPlans : [],
      restrictions: tickets.restrictions || {},
    },
    ticket_eligible: Boolean(firebase.ticket_eligible ?? tickets.eligibleForTicket),
    ticket_units: toNumber(firebase.ticket_units, 0),
    ticket_validity_days: toNumber(firebase.ticket_validity_days, 30),
    createdAt: row.created_at || firebase.createdAt || null,
    updatedAt: row.updated_at || firebase.updatedAt || null,
    created_at: row.created_at || firebase.created_at || null,
    updated_at: row.updated_at || firebase.updated_at || null,
    _source: "supabase",
  };
}

export function adaptSupabaseProducts(rows = []) {
  return rows.map(adaptSupabaseProduct);
}
