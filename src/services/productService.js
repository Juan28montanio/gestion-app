import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { createSubscriptionErrorHandler } from "./subscriptionService";

const productsCollection = collection(db, "products");
const categoriesCollection = collection(db, "productCategories");
const modifiersCollection = collection(db, "productModifiers");
const combosCollection = collection(db, "productCombos");

export const PRODUCT_TYPES = [
  "standard",
  "final_product",
  "base_preparation",
  "combo",
  "variable",
  "weighted",
  "ticket_wallet",
];

export const PRODUCT_STATUSES = [
  "active",
  "inactive",
  "sold_out",
  "hidden",
  "temporary",
  "archived",
];

export const INVENTORY_IMPACT_MODES = ["none", "technical_sheet", "direct_item", "combo"];

export const DEFAULT_KITCHEN_STATIONS = [
  { id: "kitchen", name: "Cocina" },
  { id: "bar", name: "Barra" },
  { id: "desserts", name: "Postres" },
  { id: "cashier", name: "Caja" },
  { id: "none", name: "No requiere preparacion" },
];

export const DEFAULT_PRODUCT_CATEGORIES = [
  { name: "Cafes", description: "Bebidas calientes de cafe", color: "#92400e", icon: "coffee", sortOrder: 10 },
  { name: "Bebidas frias", description: "Jugos, sodas y bebidas listas", color: "#0284c7", icon: "glass-water", sortOrder: 20 },
  { name: "Brunch", description: "Platos de brunch y desayunos extendidos", color: "#be123c", icon: "utensils", sortOrder: 30 },
  { name: "Almuerzos", description: "Menu ejecutivo y platos del dia", color: "#059669", icon: "chef-hat", sortOrder: 40 },
  { name: "Postres", description: "Dulces, tortas y sobremesas", color: "#db2777", icon: "cake", sortOrder: 50 },
  { name: "Panaderia", description: "Productos horneados", color: "#ca8a04", icon: "croissant", sortOrder: 60 },
  { name: "Entradas", description: "Entradas y acompanamientos", color: "#7c3aed", icon: "salad", sortOrder: 70 },
  { name: "Cocina", description: "Productos enviados a cocina", color: "#16a34a", icon: "cooking-pot", sortOrder: 80 },
  { name: "Barra", description: "Productos preparados en barra", color: "#2563eb", icon: "martini", sortOrder: 90 },
  { name: "Combos", description: "Productos compuestos y promociones agrupadas", color: "#ea580c", icon: "package-plus", sortOrder: 100 },
];

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean);
  }

  return normalizeText(value)
    .split(",")
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function getCategoryName(product) {
  return normalizeText(product?.categoryName || product?.category || "General");
}

function getBasePrice(product) {
  return normalizeNumber(product?.pricing?.basePrice ?? product?.basePrice ?? product?.price, 0);
}

function getProductStatus(product) {
  const rawStatus = normalizeText(product?.status);
  if (PRODUCT_STATUSES.includes(rawStatus)) {
    return rawStatus;
  }

  if (product?.is_available === false) {
    return "inactive";
  }

  return "active";
}

function getProductType(product) {
  const rawType = normalizeText(product?.type || product?.product_type || product?.productType || "final_product");
  return PRODUCT_TYPES.includes(rawType) ? rawType : "final_product";
}

function getTechnicalSheetId(product) {
  return normalizeText(
    product?.costing?.linkedTechnicalSheetId ||
      product?.inventory?.linkedTechnicalSheetId ||
      product?.linkedTechnicalSheetId ||
      product?.technical_sheet_id ||
      product?.recipeBookId
  );
}

export function calculateFoodCostPercent(cost, price) {
  const normalizedCost = normalizeNumber(cost, 0);
  const normalizedPrice = normalizeNumber(price, 0);
  return normalizedPrice > 0 ? Number(((normalizedCost / normalizedPrice) * 100).toFixed(2)) : 0;
}

export function calculateGrossMargin(price, cost) {
  return Number((normalizeNumber(price, 0) - normalizeNumber(cost, 0)).toFixed(2));
}

export function calculateGrossMarginPercent(price, cost) {
  const normalizedPrice = normalizeNumber(price, 0);
  return normalizedPrice > 0
    ? Number(((calculateGrossMargin(normalizedPrice, cost) / normalizedPrice) * 100).toFixed(2))
    : 0;
}

export function calculateSuggestedPrice(cost, targetFoodCost = 30) {
  const normalizedCost = normalizeNumber(cost, 0);
  const normalizedTarget = normalizeNumber(targetFoodCost, 30);
  const decimalTarget = normalizedTarget > 1 ? normalizedTarget / 100 : normalizedTarget;
  return decimalTarget > 0 ? Math.ceil(normalizedCost / decimalTarget) : 0;
}

export function calculateProductCost(product, technicalSheet) {
  return normalizeNumber(
    technicalSheet?.real_cost ??
      technicalSheet?.costing?.totalCost ??
      product?.costing?.estimatedCost ??
      product?.estimatedCost,
    0
  );
}

export function syncProductCostFromTechnicalSheet(product, technicalSheet) {
  const basePrice = getBasePrice(product);
  const estimatedCost = calculateProductCost(product, technicalSheet);
  const targetFoodCost = normalizeNumber(
    product?.pricing?.targetFoodCost ?? technicalSheet?.costing?.targetFoodCost,
    30
  );

  return {
    ...product,
    costing: {
      ...(product?.costing || {}),
      linkedTechnicalSheetId: technicalSheet?.id || getTechnicalSheetId(product),
      estimatedCost,
      foodCostPercent: calculateFoodCostPercent(estimatedCost, basePrice),
      grossMargin: calculateGrossMargin(basePrice, estimatedCost),
      grossMarginPercent: calculateGrossMarginPercent(basePrice, estimatedCost),
      suggestedPrice: normalizeNumber(technicalSheet?.suggested_price, 0) || calculateSuggestedPrice(estimatedCost, targetFoodCost),
      targetFoodCost,
      lastCostUpdateAt: technicalSheet?.cost_reference_updated_at || technicalSheet?.updatedAt || product?.costing?.lastCostUpdateAt || null,
    },
  };
}

export function getProductAvailability(product) {
  const status = getProductStatus(product);
  if (status === "archived") return { visible: false, sellable: false, reason: "Archivado" };
  if (status === "hidden") return { visible: false, sellable: false, reason: "Oculto" };
  if (status === "inactive") return { visible: true, sellable: false, reason: "Inactivo" };
  if (status === "sold_out") return { visible: true, sellable: false, reason: "Agotado" };
  return { visible: true, sellable: true, reason: "" };
}

export function canSellProduct(product) {
  const availability = getProductAvailability(product);
  return availability.visible && availability.sellable && product?.operation?.visibleInPOS !== false;
}

export function canUseWithTicket(product, ticketPlan = null) {
  const tickets = product?.tickets || {};
  if (!tickets.eligibleForTicket && product?.ticket_eligible !== true) {
    return { allowed: false, reason: "Producto no valido para tiquetera." };
  }

  const allowedPlans = Array.isArray(tickets.allowedTicketPlans) ? tickets.allowedTicketPlans : [];
  if (ticketPlan?.id && allowedPlans.length && !allowedPlans.includes(ticketPlan.id)) {
    return { allowed: false, reason: "La tiquetera no cubre este producto." };
  }

  return { allowed: true, reason: "" };
}

export function normalizeProductForPOS(product) {
  const normalized = normalizeProductDocument(product);
  return {
    ...normalized,
    availableForSale: canSellProduct(normalized),
  };
}

export function normalizeProductForOrder(product) {
  const normalized = normalizeProductDocument(product);
  return {
    productId: normalized.id,
    id: normalized.id,
    productName: normalized.name,
    name: normalized.name,
    category: normalized.category,
    categoryId: normalized.categoryId,
    quantity: 1,
    unitPrice: normalized.price,
    price: normalized.price,
    subtotal: normalized.price,
    modifiers: [],
    notes: "",
    note: "",
    status: "draft",
    product_type: normalized.product_type,
    recipe_mode: normalized.recipe_mode,
    technicalSheetId: normalized.costing.linkedTechnicalSheetId || "",
    kitchenStationId: normalized.operation.kitchenStationId,
    kitchenStationName: normalized.operation.kitchenStationName,
    requiresKitchen: normalized.operation.requiresKitchen,
    ticket_units: normalized.ticket_units,
    ticket_validity_days: normalized.ticket_validity_days,
    ticket_eligible: normalized.ticket_eligible,
    useTicket: false,
  };
}

export function getProductsByCategory(products = [], categoryIdOrName = "") {
  const key = normalizeText(categoryIdOrName).toLowerCase();
  return products.filter(
    (product) =>
      normalizeText(product.categoryId).toLowerCase() === key ||
      normalizeText(product.category).toLowerCase() === key
  );
}

export function getFavoriteProducts(products = []) {
  return products.filter((product) => product?.operation?.isFavorite || product?.isFavorite);
}

export function normalizeProductDocument(product = {}) {
  const basePrice = getBasePrice(product);
  const status = getProductStatus(product);
  const categoryName = getCategoryName(product);
  const type = getProductType(product);
  const linkedTechnicalSheetId = getTechnicalSheetId(product);
  const estimatedCost = normalizeNumber(product?.costing?.estimatedCost ?? product?.estimatedCost, 0);
  const targetFoodCost = normalizeNumber(product?.pricing?.targetFoodCost ?? product?.targetFoodCost, 30);
  const operation = product?.operation || {};
  const tickets = product?.tickets || {};
  const inventory = product?.inventory || {};
  const requiresKitchen = Boolean(operation.requiresKitchen ?? product?.requiresKitchen ?? linkedTechnicalSheetId);
  const kitchenStationId = normalizeText(operation.kitchenStationId || product?.kitchenStationId || (requiresKitchen ? "kitchen" : "none"));
  const kitchenStationName = normalizeText(
    operation.kitchenStationName ||
      product?.kitchenStationName ||
      DEFAULT_KITCHEN_STATIONS.find((station) => station.id === kitchenStationId)?.name ||
      "Cocina"
  );
  const eligibleForTicket = Boolean(tickets.eligibleForTicket ?? product?.ticket_eligible ?? type === "ticket_wallet");
  const inventoryImpactMode = normalizeText(inventory.inventoryImpactMode || product?.inventoryImpactMode || (linkedTechnicalSheetId ? "technical_sheet" : "none"));

  return {
    ...product,
    businessId: normalizeText(product.businessId || product.business_id),
    business_id: normalizeText(product.business_id || product.businessId),
    name: normalizeText(product.name),
    code: normalizeText(product.code),
    description: normalizeText(product.description),
    categoryId: normalizeText(product.categoryId),
    categoryName,
    category: categoryName,
    imageUrl: normalizeText(product.imageUrl || product.image_url),
    type,
    product_type: type === "final_product" ? "standard" : type,
    status,
    is_available: status === "active" || status === "temporary",
    stock: normalizeNumber(product.stock, 0),
    price: basePrice,
    recipe_mode: type === "combo" ? "composed" : "direct",
    pricing: {
      ...(product.pricing || {}),
      basePrice,
      taxRate: normalizeNumber(product?.pricing?.taxRate ?? product?.taxRate, 0),
      targetFoodCost,
      suggestedPrice: normalizeNumber(product?.pricing?.suggestedPrice ?? product?.suggested_price, 0),
    },
    costing: {
      ...(product.costing || {}),
      linkedTechnicalSheetId,
      estimatedCost,
      foodCostPercent: normalizeNumber(product?.costing?.foodCostPercent, calculateFoodCostPercent(estimatedCost, basePrice)),
      grossMargin: normalizeNumber(product?.costing?.grossMargin, calculateGrossMargin(basePrice, estimatedCost)),
      grossMarginPercent: normalizeNumber(product?.costing?.grossMarginPercent, calculateGrossMarginPercent(basePrice, estimatedCost)),
      suggestedPrice: normalizeNumber(product?.costing?.suggestedPrice ?? product?.suggested_price, calculateSuggestedPrice(estimatedCost, targetFoodCost)),
      targetFoodCost,
      lastCostUpdateAt: product?.costing?.lastCostUpdateAt || product?.lastCostUpdateAt || null,
    },
    inventory: {
      consumesInventory: Boolean(inventory.consumesInventory ?? product?.consumesInventory ?? linkedTechnicalSheetId),
      inventoryImpactMode: INVENTORY_IMPACT_MODES.includes(inventoryImpactMode) ? inventoryImpactMode : "none",
      linkedTechnicalSheetId,
      linkedInventoryItemId: normalizeText(inventory.linkedInventoryItemId || product?.linkedInventoryItemId),
      allowSaleWhenStockLow: Boolean(inventory.allowSaleWhenStockLow ?? product?.allowSaleWhenStockLow ?? true),
      stockStatus: normalizeText(inventory.stockStatus || product?.stockStatus),
    },
    operation: {
      requiresKitchen,
      kitchenStationId,
      kitchenStationName,
      preparationTime: normalizeNumber(operation.preparationTime ?? product?.preparationTime, 0),
      availableForTables: operation.availableForTables ?? product?.availableForTables ?? true,
      availableForQuickSale: operation.availableForQuickSale ?? product?.availableForQuickSale ?? true,
      availableForDelivery: operation.availableForDelivery ?? product?.availableForDelivery ?? false,
      isFavorite: Boolean(operation.isFavorite ?? product?.isFavorite),
      visibleInPOS: operation.visibleInPOS ?? product?.visibleInPOS ?? status !== "hidden",
      visibleInMenu: operation.visibleInMenu ?? product?.visibleInMenu ?? true,
      sortOrder: normalizeNumber(operation.sortOrder ?? product?.sortOrder, 0),
      color: normalizeText(operation.color || product?.color),
      icon: normalizeText(operation.icon || product?.icon),
    },
    tickets: {
      eligibleForTicket,
      ticketEligibilityType: normalizeText(tickets.ticketEligibilityType || product?.ticketEligibilityType || (eligibleForTicket ? "meal" : "")),
      ticketValueReference: normalizeText(tickets.ticketValueReference || product?.ticketValueReference || "unit"),
      allowedTicketPlans: Array.isArray(tickets.allowedTicketPlans)
        ? tickets.allowedTicketPlans
        : normalizeArray(product?.allowedTicketPlans),
      restrictions: tickets.restrictions || product?.ticketRestrictions || {},
    },
    ticket_eligible: eligibleForTicket,
    ticket_units: normalizeNumber(product.ticket_units ?? product.ticketUnits, type === "ticket_wallet" ? 10 : 0),
    ticket_validity_days: normalizeNumber(product.ticket_validity_days ?? product.ticketValidityDays, 30),
    tags: normalizeArray(product.tags),
  };
}

function normalizeProductPayload(product, businessId) {
  const base = normalizeProductDocument({ ...product, businessId });
  const normalizedBusinessId = normalizeText(base.business_id || businessId);

  if (!base.name) throw new Error("El nombre del producto es obligatorio.");
  if (!base.category) throw new Error("La categoria del producto es obligatoria.");
  if (!normalizedBusinessId) throw new Error("El business_id del producto es obligatorio.");
  if (!Number.isFinite(base.price) || base.price < 0) throw new Error("El precio debe ser un numero valido mayor o igual a 0.");
  if (!PRODUCT_STATUSES.includes(base.status)) throw new Error("El estado del producto no es valido.");
  if (!PRODUCT_TYPES.includes(base.type)) throw new Error("El tipo de producto no es valido.");
  if (base.inventory.consumesInventory && !base.inventory.inventoryImpactMode) throw new Error("Define como impacta inventario este producto.");
  if (base.inventory.inventoryImpactMode === "technical_sheet" && !base.inventory.linkedTechnicalSheetId) throw new Error("Asocia una ficha tecnica para descontar inventario por ficha.");
  if (base.operation.requiresKitchen && !base.operation.kitchenStationId) throw new Error("Define la estacion de preparacion.");
  if (base.tickets.eligibleForTicket && !base.tickets.ticketEligibilityType) throw new Error("Define el tipo de elegibilidad para tiquetera.");

  return {
    business_id: normalizedBusinessId,
    businessId: normalizedBusinessId,
    name: base.name,
    code: base.code,
    description: base.description,
    categoryId: base.categoryId,
    categoryName: base.categoryName,
    category: base.categoryName,
    imageUrl: base.imageUrl,
    type: base.type,
    status: base.status,
    price: base.price,
    stock: base.stock,
    is_available: base.is_available,
    product_type: base.product_type,
    recipe_mode: base.recipe_mode,
    ticket_eligible: base.ticket_eligible,
    ticket_units: base.ticket_units,
    ticket_validity_days: base.ticket_validity_days,
    pricing: base.pricing,
    costing: base.costing,
    inventory: base.inventory,
    operation: base.operation,
    tickets: base.tickets,
    tags: base.tags,
  };
}

function sortByOrderAndName(items = []) {
  return [...items].sort((left, right) => {
    const leftOrder = Number(left?.operation?.sortOrder ?? left?.sortOrder ?? 0);
    const rightOrder = Number(right?.operation?.sortOrder ?? right?.sortOrder ?? 0);
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return String(left?.name || "").localeCompare(String(right?.name || ""), "es", { sensitivity: "base" });
  });
}

function normalizeCategoryPayload(category, businessId) {
  const normalizedBusinessId = normalizeText(category?.businessId || category?.business_id || businessId);
  const name = normalizeText(category?.name);
  if (!normalizedBusinessId) throw new Error("El business_id de la categoria es obligatorio.");
  if (!name) throw new Error("El nombre de la categoria es obligatorio.");

  return {
    businessId: normalizedBusinessId,
    business_id: normalizedBusinessId,
    name,
    description: normalizeText(category?.description),
    color: normalizeText(category?.color),
    icon: normalizeText(category?.icon),
    sortOrder: normalizeNumber(category?.sortOrder, 0),
    active: category?.active ?? true,
    visibleInPOS: category?.visibleInPOS ?? true,
    visibleInReports: category?.visibleInReports ?? true,
  };
}

function normalizeModifierPayload(modifier, businessId, productId = "") {
  const normalizedBusinessId = normalizeText(modifier?.businessId || modifier?.business_id || businessId);
  const normalizedProductId = normalizeText(modifier?.productId || modifier?.product_id || productId);
  const name = normalizeText(modifier?.name);
  const priceDelta = normalizeNumber(modifier?.priceDelta ?? modifier?.price_delta, 0);
  const affectsInventory = Boolean(modifier?.affectsInventory ?? modifier?.affects_inventory);

  if (!normalizedBusinessId) throw new Error("El business_id del modificador es obligatorio.");
  if (!normalizedProductId) throw new Error("El producto del modificador es obligatorio.");
  if (!name) throw new Error("El nombre del modificador es obligatorio.");
  if (!Number.isFinite(priceDelta)) throw new Error("El delta de precio debe ser numerico.");
  if (affectsInventory && !modifier?.linkedInventoryItemId && !modifier?.linkedTechnicalSheetId) {
    throw new Error("Un modificador que afecta inventario requiere insumo o ficha asociada.");
  }

  return {
    businessId: normalizedBusinessId,
    business_id: normalizedBusinessId,
    productId: normalizedProductId,
    product_id: normalizedProductId,
    name,
    priceDelta,
    price_delta: priceDelta,
    affectsInventory,
    affects_inventory: affectsInventory,
    linkedInventoryItemId: normalizeText(modifier?.linkedInventoryItemId || modifier?.linked_inventory_item_id),
    linkedTechnicalSheetId: normalizeText(modifier?.linkedTechnicalSheetId || modifier?.linked_technical_sheet_id),
    stationImpact: normalizeText(modifier?.stationImpact || modifier?.station_impact),
    active: modifier?.active ?? true,
  };
}

export function subscribeToProducts(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const productsQuery = query(productsCollection, where("business_id", "==", businessId));

  return onSnapshot(productsQuery, (snapshot) => {
    callback(sortByOrderAndName(snapshot.docs.map((snapshotDoc) => normalizeProductDocument({ id: snapshotDoc.id, ...snapshotDoc.data() }))));
  }, createSubscriptionErrorHandler({ scope: "products:subscribeToProducts", callback, emptyValue: [] }));
}

export function subscribeToAvailableProducts(businessId, callback) {
  return subscribeToProducts(businessId, (products) => {
    callback(products.filter((product) => canSellProduct(product)).map(normalizeProductForPOS));
  });
}

export function subscribeToProductCategories(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const categoriesQuery = query(categoriesCollection, where("business_id", "==", businessId));
  return onSnapshot(categoriesQuery, (snapshot) => {
    callback(sortByOrderAndName(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))));
  }, createSubscriptionErrorHandler({ scope: "products:subscribeToProductCategories", callback, emptyValue: [] }));
}

export function subscribeToProductModifiers(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const modifiersQuery = query(modifiersCollection, where("business_id", "==", businessId));
  return onSnapshot(modifiersQuery, (snapshot) => {
    callback(sortByOrderAndName(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))));
  }, createSubscriptionErrorHandler({ scope: "products:subscribeToProductModifiers", callback, emptyValue: [] }));
}

export function subscribeToProductCombos(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const combosQuery = query(combosCollection, where("business_id", "==", businessId));
  return onSnapshot(combosQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  }, createSubscriptionErrorHandler({ scope: "products:subscribeToProductCombos", callback, emptyValue: [] }));
}

export async function seedDefaultProductCategories(businessId) {
  const normalizedBusinessId = normalizeText(businessId);
  if (!normalizedBusinessId) return;

  const snapshot = await getDocs(query(categoriesCollection, where("business_id", "==", normalizedBusinessId)));
  if (!snapshot.empty) return;

  const batch = writeBatch(db);
  DEFAULT_PRODUCT_CATEGORIES.forEach((category) => {
    const categoryRef = doc(categoriesCollection);
    batch.set(categoryRef, {
      ...normalizeCategoryPayload(category, normalizedBusinessId),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function createProduct(businessId, product) {
  const payload = normalizeProductPayload(product, businessId);
  const createdProduct = await addDoc(productsCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return createdProduct.id;
}

export async function updateProduct(productId, businessId, product) {
  if (!productId) throw new Error("El id del producto es obligatorio para actualizar.");
  const payload = normalizeProductPayload(product, businessId);
  await updateDoc(doc(db, "products", productId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function archiveProduct(productId) {
  if (!productId) throw new Error("El id del producto es obligatorio para archivar.");
  await updateDoc(doc(db, "products", productId), {
    status: "archived",
    is_available: false,
    updatedAt: serverTimestamp(),
  });
}

export async function updateProductStatus(productId, status) {
  if (!productId) throw new Error("El id del producto es obligatorio.");
  if (!PRODUCT_STATUSES.includes(status)) throw new Error("El estado del producto no es valido.");
  await updateDoc(doc(db, "products", productId), {
    status,
    is_available: status === "active" || status === "temporary",
    updatedAt: serverTimestamp(),
  });
}

export async function createProductCategory(businessId, category, existingCategories = []) {
  const payload = normalizeCategoryPayload(category, businessId);
  const duplicated = existingCategories.some(
    (item) => normalizeText(item.name).toLowerCase() === payload.name.toLowerCase()
  );
  if (duplicated) throw new Error("Ya existe una categoria con ese nombre en este negocio.");
  const createdCategory = await addDoc(categoriesCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return createdCategory.id;
}

export async function updateProductCategory(categoryId, businessId, category, existingCategories = []) {
  if (!categoryId) throw new Error("El id de la categoria es obligatorio.");
  const payload = normalizeCategoryPayload(category, businessId);
  const duplicated = existingCategories.some(
    (item) => item.id !== categoryId && normalizeText(item.name).toLowerCase() === payload.name.toLowerCase()
  );
  if (duplicated) throw new Error("Ya existe una categoria con ese nombre en este negocio.");
  await updateDoc(doc(db, "productCategories", categoryId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function createProductModifier(businessId, productId, modifier) {
  const payload = normalizeModifierPayload(modifier, businessId, productId);
  const createdModifier = await addDoc(modifiersCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return createdModifier.id;
}

export async function updateProductModifier(modifierId, businessId, productId, modifier) {
  if (!modifierId) throw new Error("El id del modificador es obligatorio.");
  const payload = normalizeModifierPayload(modifier, businessId, productId);
  await updateDoc(doc(db, "productModifiers", modifierId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function upsertProductCombo(businessId, productId, items = []) {
  const normalizedBusinessId = normalizeText(businessId);
  const normalizedProductId = normalizeText(productId);
  if (!normalizedBusinessId || !normalizedProductId) throw new Error("El combo requiere negocio y producto.");

  const payload = {
    businessId: normalizedBusinessId,
    business_id: normalizedBusinessId,
    productId: normalizedProductId,
    product_id: normalizedProductId,
    items: items
      .map((item) => ({
        childProductId: normalizeText(item.childProductId || item.child_product_id),
        childProductName: normalizeText(item.childProductName || item.child_product_name),
        quantity: normalizeNumber(item.quantity, 1),
      }))
      .filter((item) => item.childProductId && item.quantity > 0),
    updatedAt: serverTimestamp(),
  };

  const existing = await getDocs(query(combosCollection, where("business_id", "==", normalizedBusinessId), where("product_id", "==", normalizedProductId)));
  if (existing.empty) {
    const createdRef = await addDoc(combosCollection, {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return createdRef.id;
  }

  await updateDoc(doc(db, "productCombos", existing.docs[0].id), payload);
  return existing.docs[0].id;
}
