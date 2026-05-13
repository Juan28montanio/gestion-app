import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { refreshRecipeBooksForIngredients } from "./recipeBookService";
import { buildSupplySearchKey, listSupplies } from "./supplyService";
import { resolvePurchasePaymentMethod } from "../utils/payments";
import { getCurrentOpenCashSession } from "./cashClosingService";
import { createSubscriptionErrorHandler } from "./subscriptionService";
import {
  calculateConversionFactor,
  calculateCostPerBaseUnit,
  calculateUsefulYield,
  normalizeUnit,
  toFiniteNumber,
} from "../features/resources/inventory/supplyCalculations";

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

const purchasesCollection = collection(db, "purchases");
const movementsCollection = collection(db, "inventoryMovements");

function getCurrentUserId() {
  return auth.currentUser?.uid || "system";
}

function normalizeText(value) {
  return String(value || "").trim();
}

function toNumber(value, fallback = NaN) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value) {
  if (typeof value === "string") {
    return value === "true";
  }
  return Boolean(value);
}

function getPurchaseDate(purchase) {
  return normalizeText(purchase?.purchaseDate || purchase?.purchase_date);
}

function getPurchaseStatus(purchase) {
  const status = normalizeText(purchase?.status).toLowerCase();
  return Object.values(PURCHASE_STATUS).includes(status) ? status : PURCHASE_STATUS.DRAFT;
}

function getPurchaseNumber(purchase) {
  return normalizeText(
    purchase?.purchaseNumber || purchase?.purchase_number || purchase?.invoice_number || purchase?.invoiceNumber
  );
}

function sortPurchases(items = []) {
  return [...items].sort((left, right) => {
    const rightDate = String(right?.purchase_date || right?.purchaseDate || "");
    const leftDate = String(left?.purchase_date || left?.purchaseDate || "");
    const byDate = rightDate.localeCompare(leftDate, "es", { sensitivity: "base" });
    if (byDate !== 0) {
      return byDate;
    }
    return String(right?.createdAt?.seconds || "").localeCompare(String(left?.createdAt?.seconds || ""));
  });
}

export function calculatePurchaseTotals(items = []) {
  return items.reduce(
    (totals, item) => {
      const subtotal = toNumber(item?.subtotal ?? item?.line_total ?? item?.lineTotal ?? item?.total_cost, 0);
      const taxes = toNumber(item?.taxes ?? item?.tax ?? 0, 0);
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
  const stock = toFiniteNumber(currentStock, 0);
  const averageCost = toFiniteNumber(currentAverageCost, 0);
  const quantity = toFiniteNumber(incomingQuantity, 0);
  const cost = toFiniteNumber(incomingCost, 0);
  const nextStock = stock + quantity;

  if (quantity === 0) {
    return averageCost;
  }

  if (quantity > 0) {
    return nextStock > 0 ? (stock * averageCost + quantity * cost) / nextStock : cost;
  }

  return nextStock > 0 ? Math.max((stock * averageCost + quantity * cost) / nextStock, 0) : 0;
}

function normalizePurchaseItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("La compra debe incluir al menos un item.");
  }

  return items.map((item, index) => {
    const inventoryItemId = normalizeText(
      item?.inventoryItemId || item?.inventory_item_id || item?.ingredient_id || item?.ingredientId
    );
    const inventoryItemName = normalizeText(
      item?.inventoryItemName ||
        item?.inventory_item_name ||
        item?.ingredient_name ||
        item?.ingredientName ||
        item?.manual_name ||
        item?.manualName
    );
    const quantity = toNumber(item?.quantity);
    const unit = normalizeUnit(item?.unit || "");
    const category = normalizeText(item?.category);
    const explicitSubtotal = toNumber(item?.subtotal ?? item?.line_total ?? item?.lineTotal ?? item?.total_cost);
    const rawUnitCost = toNumber(item?.unitCost ?? item?.unit_cost ?? item?.unit_price ?? item?.unitPrice);
    const applyIva = toBoolean(item?.apply_iva ?? item?.applyIva);
    const ivaPct = applyIva ? toNumber(item?.iva_pct ?? item?.ivaPct ?? 0, 0) : 0;

    if (!inventoryItemId && !inventoryItemName) {
      throw new Error(`El item ${index + 1} debe seleccionar o crear un insumo.`);
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Cada item de compra debe incluir una cantidad valida.");
    }

    if (!unit) {
      throw new Error("Cada item de compra debe incluir una unidad de medida.");
    }

    if (!Number.isFinite(ivaPct) || ivaPct < 0) {
      throw new Error("Cada item de compra debe incluir un impuesto valido.");
    }

    const subtotal = Number.isFinite(explicitSubtotal)
      ? explicitSubtotal
      : Number.isFinite(rawUnitCost)
        ? quantity * rawUnitCost
        : NaN;

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      throw new Error("Cada item de compra debe incluir un subtotal valido.");
    }

    const taxes = applyIva ? subtotal * (ivaPct / 100) : toNumber(item?.taxes ?? item?.tax, 0);
    const unitCost = Number.isFinite(rawUnitCost) ? rawUnitCost : subtotal / quantity;

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      throw new Error("Cada item de compra debe incluir un costo unitario valido.");
    }

    return {
      inventoryItemId,
      inventoryItemName,
      ingredient_id: inventoryItemId,
      ingredient_name: inventoryItemName,
      search_name: buildSupplySearchKey(inventoryItemName),
      quantity,
      unit,
      category,
      unitCost,
      unit_cost: unitCost,
      unit_price: unitCost,
      subtotal,
      taxes,
      total: subtotal + taxes,
      line_total: subtotal,
      total_cost: subtotal + taxes,
      landed_unit_cost: (subtotal + taxes) / quantity,
      apply_iva: applyIva,
      iva_pct: applyIva ? ivaPct : 0,
      batch: normalizeText(item?.batch),
      expirationDate: normalizeText(item?.expirationDate || item?.expiration_date),
      notes: normalizeText(item?.notes),
    };
  });
}

function buildPurchasePayload(purchase, items) {
  const businessId = normalizeText(purchase?.businessId || purchase?.business_id);
  const userId = normalizeText(purchase?.userId || purchase?.user_id || getCurrentUserId());
  const supplierId = normalizeText(purchase?.supplierId || purchase?.supplier_id || purchase?.supplier?.supplierId);
  const supplierName = normalizeText(
    purchase?.supplierName || purchase?.supplier_name || purchase?.supplier?.supplierName
  );
  const supplierPaymentTerms = normalizeText(
    purchase?.supplierPaymentTerms || purchase?.supplier_payment_terms || "Contado"
  );
  const purchaseDate = getPurchaseDate(purchase);
  const purchaseNumber = getPurchaseNumber(purchase) || `COMP-${Date.now()}`;
  const status = getPurchaseStatus(purchase);
  const totals = calculatePurchaseTotals(items);

  if (!businessId) {
    throw new Error("El business_id de la compra es obligatorio.");
  }

  if (!supplierId) {
    throw new Error("Debes seleccionar un proveedor para registrar la compra.");
  }

  if (!purchaseDate) {
    throw new Error("La fecha de la compra es obligatoria.");
  }

  return {
    businessId,
    business_id: businessId,
    userId,
    user_id: userId,
    purchaseNumber,
    purchase_number: purchaseNumber,
    invoice_number: purchaseNumber,
    supplier: {
      supplierId,
      supplierName,
    },
    supplierId,
    supplierName,
    supplier_id: supplierId,
    supplier_name: supplierName,
    supplier_payment_terms: supplierPaymentTerms || "Contado",
    payment_method: resolvePurchasePaymentMethod(
      purchase?.paymentMethod || purchase?.payment_method,
      supplierPaymentTerms
    ),
    purchaseDate,
    purchase_date: purchaseDate,
    status,
    subtotal: totals.subtotal,
    taxes: totals.taxes,
    total: totals.total,
    type: "expense",
    concept: `Compra ${purchaseNumber}`,
    notes: normalizeText(purchase?.notes),
    supportDocuments: Array.isArray(purchase?.supportDocuments) ? purchase.supportDocuments : [],
    alerts: {
      priceVarianceChecked: false,
      suspiciousPurchaseChecked: false,
    },
    items,
  };
}

function resolveIngredientDrafts(payload, supplies) {
  const supplyById = new Map(supplies.map((supply) => [supply.id, supply]));
  const supplyByName = new Map(supplies.map((supply) => [buildSupplySearchKey(supply.name), supply]));

  return payload.items.map((item) => {
    const byId = item.inventoryItemId ? supplyById.get(item.inventoryItemId) : null;
    const byName = !byId && item.search_name ? supplyByName.get(item.search_name) : null;
    const resolvedSupply = byId || byName || null;

    if (resolvedSupply) {
      return {
        ...item,
        inventoryItemId: resolvedSupply.id,
        inventoryItemName: resolvedSupply.name,
        ingredient_id: resolvedSupply.id,
        ingredient_name: resolvedSupply.name,
        category: item.category || resolvedSupply.category || "",
        unit: item.unit || resolvedSupply.unit || "und",
        is_new_supply: false,
      };
    }

    return {
      ...item,
      is_new_supply: true,
    };
  });
}

function buildStoredItem(item) {
  return {
    inventoryItemId: item.inventoryItemId,
    inventoryItemName: item.inventoryItemName,
    ingredient_id: item.inventoryItemId,
    ingredient_name: item.inventoryItemName,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    unitCost: item.unitCost,
    unit_cost: item.unitCost,
    unit_price: item.unitCost,
    subtotal: item.subtotal,
    taxes: item.taxes,
    total: item.total,
    line_total: item.subtotal,
    total_cost: item.total,
    landed_unit_cost: item.landed_unit_cost,
    apply_iva: item.apply_iva,
    iva_pct: item.iva_pct,
    batch: item.batch,
    expirationDate: item.expirationDate,
    expiration_date: item.expirationDate,
    notes: item.notes,
  };
}

function getSupplyCostSnapshot(supply) {
  return {
    currentStock: toFiniteNumber(supply?.inventory?.currentStock ?? supply?.stock, 0),
    averageCost: toFiniteNumber(
      supply?.costs?.averageCost ?? supply?.average_cost ?? supply?.cost_per_base_unit ?? supply?.cost_per_unit,
      0
    ),
    currentCost: toFiniteNumber(supply?.costs?.currentCost ?? supply?.last_purchase_cost, 0),
    baseUnit: normalizeUnit(supply?.base_unit || supply?.baseUnit || supply?.unit || "und"),
  };
}

function buildSupplyPatch(supply, item, quantityDelta, costPerBaseUnit) {
  const snapshot = getSupplyCostSnapshot(supply);
  const nextStock = Math.max(snapshot.currentStock + quantityDelta, 0);
  const nextAverageCost = calculateAverageCost({
    currentStock: snapshot.currentStock,
    currentAverageCost: snapshot.averageCost,
    incomingQuantity: quantityDelta,
    incomingCost: costPerBaseUnit,
  });
  const incomingCost = toFiniteNumber(item.landed_unit_cost ?? item.unitCost, 0);
  const wastePercent = toFiniteNumber(supply?.waste?.wastePercent ?? supply?.waste_percent, 0);
  const usefulYield = calculateUsefulYield(Math.abs(quantityDelta) || 1, wastePercent) || 1;

  return {
    stock: nextStock,
    average_cost: nextAverageCost,
    cost_per_unit: costPerBaseUnit,
    cost_per_base_unit: costPerBaseUnit,
    last_purchase_cost: incomingCost,
    category: item.category || supply?.category || "",
    unit: snapshot.baseUnit,
    base_unit: snapshot.baseUnit,
    baseUnit: snapshot.baseUnit,
    costs: {
      ...(supply?.costs || {}),
      currentCost: incomingCost,
      averageCost: nextAverageCost,
      lastCost: incomingCost,
      costPerBaseUnit,
      realCost: usefulYield > 0 ? incomingCost / usefulYield : costPerBaseUnit,
    },
    inventory: {
      ...(supply?.inventory || {}),
      currentStock: nextStock,
      inventoryUnit: snapshot.baseUnit,
    },
    waste: {
      ...(supply?.waste || {}),
      wastePercent,
      usefulYield: supply?.waste?.usefulYield ?? usefulYield,
    },
    updatedAt: serverTimestamp(),
  };
}

function createSupplyFromPurchase(transaction, payload, item) {
  const ingredientRef = doc(collection(db, "ingredients"));
  const unit = normalizeUnit(item.unit || "und");
  const cost = toFiniteNumber(item.landed_unit_cost ?? item.unitCost, 0);

  transaction.set(ingredientRef, {
    business_id: payload.business_id,
    name: item.inventoryItemName,
    search_name: item.search_name,
    category: item.category || "Compras",
    type: "raw_material",
    status: "active",
    unit,
    base_unit: unit,
    baseUnit: unit,
    stock: 0,
    stock_min_alert: 0,
    average_cost: cost,
    cost_per_unit: cost,
    cost_per_base_unit: cost,
    last_purchase_cost: cost,
    conversion: {
      purchaseUnit: unit,
      purchaseQuantity: 1,
      conversionFactor: 1,
    },
    costs: {
      currentCost: cost,
      averageCost: cost,
      lastCost: cost,
      costPerBaseUnit: cost,
      realCost: cost,
    },
    inventory: {
      currentStock: 0,
      minimumStock: 0,
      idealStock: 0,
      reorderPoint: 0,
      inventoryUnit: unit,
      location: "",
    },
    waste: {
      wastePercent: 0,
      usefulYield: 1,
      notes: "",
    },
    storage: {
      type: "",
      shelfLifeClosed: 0,
      shelfLifeOpened: 0,
      timeUnit: "days",
    },
    supplier: payload.supplier,
    supplier_id: payload.supplier_id,
    supplier_name: payload.supplier_name,
    analytics: {
      monthlyConsumption: 0,
      rotation: 0,
      averageUsage: 0,
    },
    traceability: {
      purchasesEnabled: true,
      movementsEnabled: true,
      consumptionEnabled: false,
      productionEnabled: false,
      wasteEnabled: false,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ingredientRef;
}

function buildItemImpact(supply, item, direction = 1) {
  const snapshot = getSupplyCostSnapshot(supply);
  const purchaseUnit = normalizeUnit(item.unit || supply?.conversion?.purchaseUnit || snapshot.baseUnit);
  const conversionFactor = calculateConversionFactor({
    purchaseUnit,
    baseUnit: snapshot.baseUnit,
    purchaseQuantity: 1,
    conversionFactor: supply?.conversion?.conversionFactor,
  });
  const baseQuantity = toFiniteNumber(item.quantity, 0) * conversionFactor * direction;
  const costPerBaseUnit =
    calculateCostPerBaseUnit({
      currentCost: toFiniteNumber(item.landed_unit_cost ?? item.unitCost, 0),
      purchaseQuantity: 1,
      conversionFactor,
    }) || toFiniteNumber(item.unitCost, 0);

  return {
    inventoryItemId: item.inventoryItemId,
    inventoryItemName: item.inventoryItemName,
    quantity: item.quantity,
    unit: item.unit,
    baseQuantity,
    baseUnit: snapshot.baseUnit,
    costPerBaseUnit,
    unitCost: item.unitCost,
    subtotal: item.subtotal,
    total: item.total,
    batch: item.batch,
    expirationDate: item.expirationDate,
  };
}

function createInventoryMovement(transaction, payload, purchaseRef, impact, movementType, reason = "") {
  const movementRef = doc(movementsCollection);
  transaction.set(movementRef, {
    businessId: payload.business_id,
    business_id: payload.business_id,
    type: movementType,
    sourceType: "purchase",
    source_type: "purchase",
    sourceId: purchaseRef.id,
    source_id: purchaseRef.id,
    purchaseNumber: payload.purchaseNumber,
    inventoryItemId: impact.inventoryItemId,
    inventory_item_id: impact.inventoryItemId,
    inventoryItemName: impact.inventoryItemName,
    quantity: Math.abs(impact.baseQuantity),
    unit: impact.baseUnit,
    movementType,
    movement_type: movementType,
    direction: impact.baseQuantity >= 0 ? "in" : "out",
    unitCost: impact.costPerBaseUnit,
    totalCost: Math.abs(impact.baseQuantity) * impact.costPerBaseUnit,
    reason,
    createdAt: serverTimestamp(),
    createdBy: getCurrentUserId(),
    created_by: getCurrentUserId(),
  });
  return movementRef.id;
}

function appendHistory(purchase, event) {
  return [
    ...(Array.isArray(purchase?.history) ? purchase.history : []),
    {
      ...event,
      at: new Date().toISOString(),
      by: getCurrentUserId(),
    },
  ];
}

function buildPurchaseFinanceImpact(transaction, purchaseRef, payload, openCashSession = null) {
  const paymentMethod = resolvePurchasePaymentMethod(
    payload.payment_method,
    payload.supplier_payment_terms
  );
  const total = toFiniteNumber(payload.total, 0);

  if (total <= 0) {
    return;
  }

  if (paymentMethod === "supplier_credit") {
    const payableRef = doc(collection(db, "accountsPayable"));
    transaction.set(payableRef, {
      businessId: payload.business_id,
      business_id: payload.business_id,
      supplierId: payload.supplier_id,
      supplier_id: payload.supplier_id,
      supplierName: payload.supplier_name,
      supplier_name: payload.supplier_name,
      purchaseId: purchaseRef.id,
      purchase_id: purchaseRef.id,
      originalAmount: total,
      original_amount: total,
      paidAmount: 0,
      paid_amount: 0,
      pendingAmount: total,
      pending_amount: total,
      status: "pending",
      dueDate: null,
      due_date: null,
      notes: payload.notes || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(doc(collection(db, "auditLogs")), {
      business_id: payload.business_id,
      businessId: payload.business_id,
      user_id: getCurrentUserId(),
      userId: getCurrentUserId(),
      user_name: getCurrentUserId(),
      userName: getCurrentUserId(),
      module: "finance",
      action: "payable.created",
      entity_type: "accountsPayable",
      entityType: "accountsPayable",
      entity_id: payableRef.id,
      entityId: payableRef.id,
      previousValue: null,
      newValue: {
        purchaseId: purchaseRef.id,
        supplierId: payload.supplier_id,
        pendingAmount: total,
      },
      reason: "Compra registrada a credito",
      createdAt: serverTimestamp(),
    });
    return;
  }

  const movementRef = doc(collection(db, "cashMovements"));
  transaction.set(movementRef, {
    businessId: payload.business_id,
    business_id: payload.business_id,
    cashSessionId: openCashSession?.id || null,
    cash_session_id: openCashSession?.id || null,
    purchaseId: purchaseRef.id,
    purchase_id: purchaseRef.id,
    type: "purchase_expense",
    method: paymentMethod || "cash",
    amount: total,
    description: payload.concept || `Compra ${payload.purchaseNumber}`,
    sourceType: "purchase",
    source_type: "purchase",
    sourceId: purchaseRef.id,
    source_id: purchaseRef.id,
    status: "valid",
    createdBy: {
      id: getCurrentUserId(),
      name: getCurrentUserId(),
      email: auth.currentUser?.email || "",
    },
    created_by: {
      id: getCurrentUserId(),
      name: getCurrentUserId(),
      email: auth.currentUser?.email || "",
    },
    createdAt: serverTimestamp(),
  });
  transaction.set(doc(collection(db, "auditLogs")), {
    business_id: payload.business_id,
    businessId: payload.business_id,
    user_id: getCurrentUserId(),
    userId: getCurrentUserId(),
    user_name: getCurrentUserId(),
    userName: getCurrentUserId(),
    module: "cash",
    action: "cashMovement.purchaseExpense",
    entity_type: "cashMovements",
    entityType: "cashMovements",
    entity_id: movementRef.id,
    entityId: movementRef.id,
    previousValue: null,
    newValue: {
      purchaseId: purchaseRef.id,
      amount: total,
      method: paymentMethod || "cash",
    },
    reason: "Compra pagada de contado",
    createdAt: serverTimestamp(),
  });
}

async function applyInventoryDelta(transaction, payload, purchaseRef, items, movementType, reason = "") {
  const touchedIngredientIds = [];
  const impactLines = [];
  const preparedItems = [];
  const ingredientDataById = new Map();

  for (const item of items) {
    const ingredientRef = item.inventoryItemId ? doc(db, "ingredients", item.inventoryItemId) : null;
    const ingredientSnapshot = ingredientRef ? await transaction.get(ingredientRef) : null;

    if (!ingredientSnapshot?.exists()) {
      if (movementType !== INVENTORY_MOVEMENT_TYPES.PURCHASE_IN) {
        throw new Error(`El insumo ${item.inventoryItemName || item.inventoryItemId} no existe.`);
      }
      preparedItems.push({ item, ingredientRef: null, ingredientData: null, shouldCreate: true });
      continue;
    }

    preparedItems.push({
      item,
      ingredientRef,
      ingredientData: ingredientSnapshot.data(),
      shouldCreate: false,
    });
  }

  for (const preparedItem of preparedItems) {
    const item = preparedItem.item;
    let ingredientRef = preparedItem.ingredientRef;
    let ingredientData = preparedItem.ingredientData;

    if (preparedItem.shouldCreate) {
      ingredientRef = createSupplyFromPurchase(transaction, payload, item);
      ingredientData = {
        business_id: payload.business_id,
        stock: 0,
        unit: item.unit,
        base_unit: item.unit,
        average_cost: item.landed_unit_cost,
        costs: {},
        inventory: {},
        waste: {},
      };
      item.inventoryItemId = ingredientRef.id;
      item.ingredient_id = ingredientRef.id;
    } else {
      ingredientData = ingredientDataById.get(ingredientRef.id) || ingredientData;
    }

    if (ingredientData.business_id !== payload.business_id) {
      throw new Error(`El insumo ${item.inventoryItemName || item.inventoryItemId} no pertenece a este negocio.`);
    }

    const direction = movementType === INVENTORY_MOVEMENT_TYPES.PURCHASE_IN ? 1 : -1;
    const impact = buildItemImpact(ingredientData, item, direction);
    if (impact.baseQuantity < 0) {
      const currentStock = getSupplyCostSnapshot(ingredientData).currentStock;
      if (currentStock + impact.baseQuantity < -0.0001) {
        throw new Error(`No hay stock suficiente para revertir ${item.inventoryItemName}.`);
      }
    }

    const patch = buildSupplyPatch(ingredientData, item, impact.baseQuantity, impact.costPerBaseUnit);
    transaction.update(ingredientRef, patch);
    createInventoryMovement(transaction, payload, purchaseRef, impact, movementType, reason);
    touchedIngredientIds.push(ingredientRef.id);
    impactLines.push({ ...impact, inventoryItemId: ingredientRef.id });
    ingredientDataById.set(ingredientRef.id, {
      ...ingredientData,
      ...patch,
      costs: patch.costs,
      inventory: patch.inventory,
      waste: patch.waste,
    });
  }

  return { touchedIngredientIds, impactLines };
}

async function applyInventoryDifferences(transaction, payload, purchaseRef, previousItems, nextItems, reason = "") {
  const touchedIngredientIds = [];
  const impactLines = [];
  const differences = calculateInventoryDifference(previousItems, nextItems);
  const preparedItems = [];
  const ingredientDataById = new Map();

  for (const item of differences) {
    const ingredientId = normalizeText(item.inventoryItemId || item.ingredient_id);
    if (!ingredientId) {
      throw new Error("No puedes crear insumos nuevos al editar una compra confirmada. Crea el insumo y vuelve a editar.");
    }

    const ingredientRef = doc(db, "ingredients", ingredientId);
    const ingredientSnapshot = await transaction.get(ingredientRef);
    if (!ingredientSnapshot.exists()) {
      throw new Error(`El insumo ${item.inventoryItemName || ingredientId} no existe.`);
    }

    preparedItems.push({
      item: {
        ...item,
        inventoryItemId: ingredientId,
        inventoryItemName: item.inventoryItemName || item.ingredient_name,
        quantity: Math.abs(item.quantity),
      },
      originalQuantity: item.quantity,
      ingredientRef,
      ingredientData: ingredientSnapshot.data(),
    });
  }

  for (const preparedItem of preparedItems) {
    const ingredientData =
      ingredientDataById.get(preparedItem.ingredientRef.id) || preparedItem.ingredientData;
    const item = preparedItem.item;

    if (ingredientData.business_id !== payload.business_id) {
      throw new Error(`El insumo ${item.inventoryItemName || item.inventoryItemId} no pertenece a este negocio.`);
    }

    const direction = preparedItem.originalQuantity >= 0 ? 1 : -1;
    const impact = buildItemImpact(ingredientData, item, direction);
    const currentStock = getSupplyCostSnapshot(ingredientData).currentStock;
    if (impact.baseQuantity < 0 && currentStock + impact.baseQuantity < -0.0001) {
      throw new Error(`No hay stock suficiente para ajustar ${item.inventoryItemName}.`);
    }

    const patch = buildSupplyPatch(ingredientData, item, impact.baseQuantity, impact.costPerBaseUnit);
    const movementType =
      impact.baseQuantity >= 0
        ? INVENTORY_MOVEMENT_TYPES.PURCHASE_IN
        : INVENTORY_MOVEMENT_TYPES.PURCHASE_REVERSE;
    transaction.update(preparedItem.ingredientRef, patch);
    createInventoryMovement(transaction, payload, purchaseRef, impact, movementType, reason);
    touchedIngredientIds.push(preparedItem.ingredientRef.id);
    impactLines.push({ ...impact, inventoryItemId: preparedItem.ingredientRef.id });
    ingredientDataById.set(preparedItem.ingredientRef.id, {
      ...ingredientData,
      ...patch,
      costs: patch.costs,
      inventory: patch.inventory,
      waste: patch.waste,
    });
  }

  return { touchedIngredientIds, impactLines };
}

export async function createPurchase(purchase) {
  const normalizedItems = normalizePurchaseItems(purchase?.items);
  const initialPayload = buildPurchasePayload(purchase, normalizedItems);
  const supplies = await listSupplies(initialPayload.business_id);
  const resolvedItems = resolveIngredientDrafts(initialPayload, supplies);
  const payload = buildPurchasePayload(purchase, resolvedItems);
  const shouldConfirm = payload.status === PURCHASE_STATUS.CONFIRMED;
  payload.status = shouldConfirm ? PURCHASE_STATUS.DRAFT : payload.status;

  const createdPurchaseId = await runTransaction(db, async (transaction) => {
    const supplierRef = doc(db, "suppliers", payload.supplier_id);
    const supplierSnapshot = await transaction.get(supplierRef);

    if (!supplierSnapshot.exists()) {
      throw new Error("El proveedor seleccionado no existe.");
    }

    const purchaseRef = doc(purchasesCollection);
    transaction.set(purchaseRef, {
      ...payload,
      items: resolvedItems.map(buildStoredItem),
      inventoryImpact: {
        applied: false,
        appliedAt: null,
        reversedAt: null,
        lines: [],
      },
      audit: {
        createdBy: payload.userId,
        updatedBy: payload.userId,
        confirmedBy: "",
        canceledBy: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        confirmedAt: null,
        canceledAt: null,
        cancelReason: "",
      },
      history: appendHistory({}, { type: "purchase_created", status: payload.status }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return purchaseRef.id;
  });

  if (shouldConfirm) {
    await confirmPurchase(createdPurchaseId);
  }

  return createdPurchaseId;
}

export async function confirmPurchase(purchaseId) {
  const normalizedPurchaseId = normalizeText(purchaseId);
  if (!normalizedPurchaseId) {
    throw new Error("La compra a confirmar es obligatoria.");
  }

  let touchedIngredientIds = [];
  let businessId = "";
  let openCashSession = null;
  const purchaseBeforeConfirm = await getDoc(doc(db, "purchases", normalizedPurchaseId));

  if (purchaseBeforeConfirm.exists()) {
    const purchaseBusinessId = normalizeText(purchaseBeforeConfirm.data().business_id);
    openCashSession = purchaseBusinessId ? await getCurrentOpenCashSession(purchaseBusinessId) : null;
  }

  await runTransaction(db, async (transaction) => {
    const purchaseRef = doc(db, "purchases", normalizedPurchaseId);
    const purchaseSnapshot = await transaction.get(purchaseRef);

    if (!purchaseSnapshot.exists()) {
      throw new Error("La compra seleccionada no existe.");
    }

    const purchase = { id: purchaseSnapshot.id, ...purchaseSnapshot.data() };
    if (purchase.status === PURCHASE_STATUS.CONFIRMED || purchase.inventoryImpact?.applied) {
      throw new Error("Esta compra ya fue confirmada.");
    }

    if (purchase.status === PURCHASE_STATUS.CANCELED) {
      throw new Error("No puedes confirmar una compra anulada.");
    }

    const payload = buildPurchasePayload(purchase, normalizePurchaseItems(purchase.items));
    businessId = payload.business_id;
    const supplierRef = doc(db, "suppliers", payload.supplier_id);
    const supplierSnapshot = await transaction.get(supplierRef);
    const impactResult = await applyInventoryDelta(
      transaction,
      payload,
      purchaseRef,
      payload.items,
      INVENTORY_MOVEMENT_TYPES.PURCHASE_IN,
      "Confirmacion de compra"
    );
    touchedIngredientIds = impactResult.touchedIngredientIds;

    if (supplierSnapshot.exists()) {
      const supplier = supplierSnapshot.data();
      transaction.update(supplierRef, {
        total_purchases_value:
          toFiniteNumber(supplier.total_purchases_value, 0) + toFiniteNumber(payload.total, 0),
        updatedAt: serverTimestamp(),
      });
    }

    buildPurchaseFinanceImpact(transaction, purchaseRef, payload, openCashSession);

    transaction.update(purchaseRef, {
      status: PURCHASE_STATUS.CONFIRMED,
      items: payload.items.map(buildStoredItem),
      inventoryImpact: {
        applied: true,
        appliedAt: serverTimestamp(),
        reversedAt: null,
        lines: impactResult.impactLines,
      },
      audit: {
        ...(purchase.audit || {}),
        updatedBy: getCurrentUserId(),
        confirmedBy: getCurrentUserId(),
        updatedAt: serverTimestamp(),
        confirmedAt: serverTimestamp(),
      },
      history: appendHistory(purchase, { type: "purchase_confirmed", status: PURCHASE_STATUS.CONFIRMED }),
      updatedAt: serverTimestamp(),
    });
  });

  await refreshRecipeBooksForIngredients(businessId, touchedIngredientIds);
}

export async function cancelPurchase(purchaseId, reason) {
  const normalizedPurchaseId = normalizeText(purchaseId);
  const cancelReason = normalizeText(reason);

  if (!normalizedPurchaseId) {
    throw new Error("La compra a anular es obligatoria.");
  }

  if (!cancelReason) {
    throw new Error("El motivo de anulacion es obligatorio.");
  }

  let touchedIngredientIds = [];
  let businessId = "";

  await runTransaction(db, async (transaction) => {
    const purchaseRef = doc(db, "purchases", normalizedPurchaseId);
    const purchaseSnapshot = await transaction.get(purchaseRef);

    if (!purchaseSnapshot.exists()) {
      throw new Error("La compra seleccionada no existe.");
    }

    const purchase = { id: purchaseSnapshot.id, ...purchaseSnapshot.data() };
    if (purchase.status === PURCHASE_STATUS.CANCELED || purchase.inventoryImpact?.reversedAt) {
      throw new Error("Esta compra ya fue anulada.");
    }

    if (!purchase.inventoryImpact?.applied) {
      transaction.update(purchaseRef, {
        status: PURCHASE_STATUS.CANCELED,
        inventoryImpact: {
          ...(purchase.inventoryImpact || {}),
          applied: false,
          reversedAt: null,
        },
        audit: {
          ...(purchase.audit || {}),
          updatedBy: getCurrentUserId(),
          canceledBy: getCurrentUserId(),
          updatedAt: serverTimestamp(),
          canceledAt: serverTimestamp(),
          cancelReason,
        },
        history: appendHistory(purchase, {
          type: "purchase_canceled",
          status: PURCHASE_STATUS.CANCELED,
          reason: cancelReason,
          inventoryImpact: "not_applied",
        }),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const payload = buildPurchasePayload(purchase, normalizePurchaseItems(purchase.items));
    businessId = payload.business_id;
    const supplierRef = doc(db, "suppliers", payload.supplier_id);
    const supplierSnapshot = await transaction.get(supplierRef);

    if (purchase.inventoryImpact?.applied) {
      const impactResult = await applyInventoryDelta(
        transaction,
        payload,
        purchaseRef,
        payload.items,
        INVENTORY_MOVEMENT_TYPES.PURCHASE_REVERSE,
        cancelReason
      );
      touchedIngredientIds = impactResult.touchedIngredientIds;
    }

    if (supplierSnapshot.exists() && purchase.inventoryImpact?.applied) {
      const supplier = supplierSnapshot.data();
      transaction.update(supplierRef, {
        total_purchases_value: Math.max(
          toFiniteNumber(supplier.total_purchases_value, 0) - toFiniteNumber(payload.total, 0),
          0
        ),
        updatedAt: serverTimestamp(),
      });
    }

    transaction.update(purchaseRef, {
      status: PURCHASE_STATUS.CANCELED,
      inventoryImpact: {
        ...(purchase.inventoryImpact || {}),
        applied: false,
        reversedAt: serverTimestamp(),
      },
      audit: {
        ...(purchase.audit || {}),
        updatedBy: getCurrentUserId(),
        canceledBy: getCurrentUserId(),
        updatedAt: serverTimestamp(),
        canceledAt: serverTimestamp(),
        cancelReason,
      },
      history: appendHistory(purchase, {
        type: "purchase_canceled",
        status: PURCHASE_STATUS.CANCELED,
        reason: cancelReason,
      }),
      updatedAt: serverTimestamp(),
    });
  });

  await refreshRecipeBooksForIngredients(businessId, touchedIngredientIds);
}

export function calculateInventoryDifference(previousItems = [], nextItems = []) {
  const totals = new Map();
  const add = (item, multiplier) => {
    const key = normalizeText(item.inventoryItemId || item.ingredient_id);
    if (!key) {
      return;
    }
    const quantity = toFiniteNumber(item.quantity, 0) * multiplier;
    const current = totals.get(key) || { ...item, quantity: 0 };
    totals.set(key, { ...current, ...item, quantity: current.quantity + quantity });
  };

  previousItems.forEach((item) => add(item, -1));
  nextItems.forEach((item) => add(item, 1));
  return Array.from(totals.values()).filter((item) => Math.abs(item.quantity) > 0.0001);
}

export async function updatePurchase(purchaseId, purchase, reason = "") {
  const normalizedPurchaseId = normalizeText(purchaseId);
  if (!normalizedPurchaseId) {
    throw new Error("La compra a editar es obligatoria.");
  }

  const normalizedItems = normalizePurchaseItems(purchase?.items);
  const initialPayload = buildPurchasePayload(purchase, normalizedItems);
  const supplies = await listSupplies(initialPayload.business_id);
  const resolvedItems = resolveIngredientDrafts(initialPayload, supplies);
  const payload = buildPurchasePayload(purchase, resolvedItems);
  const editReason = normalizeText(reason);
  let touchedIngredientIds = [];
  let businessId = payload.business_id;

  await runTransaction(db, async (transaction) => {
    const purchaseRef = doc(db, "purchases", normalizedPurchaseId);
    const purchaseSnapshot = await transaction.get(purchaseRef);

    if (!purchaseSnapshot.exists()) {
      throw new Error("La compra seleccionada no existe.");
    }

    const currentPurchase = { id: purchaseSnapshot.id, ...purchaseSnapshot.data() };
    if (currentPurchase.status === PURCHASE_STATUS.CANCELED) {
      throw new Error("No puedes editar una compra anulada.");
    }

    let inventoryImpact = currentPurchase.inventoryImpact || {
      applied: false,
      appliedAt: null,
      reversedAt: null,
      lines: [],
    };

    if (currentPurchase.inventoryImpact?.applied) {
      if (payload.items.some((item) => !item.inventoryItemId)) {
        throw new Error("No puedes crear insumos nuevos al editar una compra confirmada. Crea el insumo y vuelve a editar.");
      }
      const currentPayload = buildPurchasePayload(
        currentPurchase,
        normalizePurchaseItems(currentPurchase.items)
      );
      const applyResult = await applyInventoryDifferences(
        transaction,
        payload,
        purchaseRef,
        currentPayload.items,
        payload.items,
        editReason || "Ajuste por edicion de compra confirmada"
      );
      touchedIngredientIds = applyResult.touchedIngredientIds;
      inventoryImpact = {
        applied: true,
        appliedAt: currentPurchase.inventoryImpact.appliedAt || serverTimestamp(),
        reversedAt: null,
        lines: applyResult.impactLines,
      };
    }

    transaction.update(purchaseRef, {
      ...payload,
      status: currentPurchase.status,
      items: payload.items.map(buildStoredItem),
      inventoryImpact,
      audit: {
        ...(currentPurchase.audit || {}),
        updatedBy: getCurrentUserId(),
        updatedAt: serverTimestamp(),
        editReason,
      },
      history: appendHistory(currentPurchase, {
        type: "purchase_edited",
        status: currentPurchase.status,
        reason: editReason,
      }),
      updatedAt: serverTimestamp(),
    });
  });

  if (touchedIngredientIds.length) {
    await refreshRecipeBooksForIngredients(businessId, [...new Set(touchedIngredientIds)]);
  }
}

export async function registerPurchaseReturn(purchaseId, returnItems = [], reason = "") {
  const normalizedPurchaseId = normalizeText(purchaseId);
  const returnReason = normalizeText(reason);
  const normalizedItems = normalizePurchaseItems(returnItems);
  let touchedIngredientIds = [];
  let businessId = "";

  if (!normalizedPurchaseId) {
    throw new Error("La compra de origen es obligatoria.");
  }

  if (!returnReason) {
    throw new Error("El motivo de devolucion es obligatorio.");
  }

  await runTransaction(db, async (transaction) => {
    const purchaseRef = doc(db, "purchases", normalizedPurchaseId);
    const purchaseSnapshot = await transaction.get(purchaseRef);

    if (!purchaseSnapshot.exists()) {
      throw new Error("La compra seleccionada no existe.");
    }

    const purchase = { id: purchaseSnapshot.id, ...purchaseSnapshot.data() };
    if (!purchase.inventoryImpact?.applied || purchase.status === PURCHASE_STATUS.CANCELED) {
      throw new Error("Solo puedes devolver compras confirmadas.");
    }

    const payload = buildPurchasePayload(purchase, normalizedItems);
    businessId = payload.business_id;
    const result = await applyInventoryDelta(
      transaction,
      payload,
      purchaseRef,
      payload.items,
      INVENTORY_MOVEMENT_TYPES.PURCHASE_RETURN,
      returnReason
    );
    touchedIngredientIds = result.touchedIngredientIds;

    transaction.update(purchaseRef, {
      status: PURCHASE_STATUS.RETURNED,
      returns: [
        ...(Array.isArray(purchase.returns) ? purchase.returns : []),
        {
          reason: returnReason,
          items: payload.items.map(buildStoredItem),
          createdAt: new Date().toISOString(),
          createdBy: getCurrentUserId(),
        },
      ],
      history: appendHistory(purchase, {
        type: "purchase_returned",
        status: PURCHASE_STATUS.RETURNED,
        reason: returnReason,
      }),
      audit: {
        ...(purchase.audit || {}),
        updatedBy: getCurrentUserId(),
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
  });

  await refreshRecipeBooksForIngredients(businessId, touchedIngredientIds);
}

export function subscribeToPurchases(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const purchasesQuery = query(purchasesCollection, where("business_id", "==", businessId));

  return onSnapshot(
    purchasesQuery,
    (snapshot) => {
      callback(sortPurchases(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))));
    },
    createSubscriptionErrorHandler({
      scope: "purchases:subscribeToPurchases",
      callback,
      emptyValue: [],
    })
  );
}

export function subscribeToInventoryMovements(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const movementsQuery = query(movementsCollection, where("business_id", "==", businessId));
  return onSnapshot(
    movementsQuery,
    (snapshot) => {
      callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
    },
    (error) => {
      const code = String(error?.code || "").toLowerCase();
      const message = String(error?.message || "").toLowerCase();
      const isPermissionError =
        code.includes("permission-denied") ||
        message.includes("missing or insufficient permissions");

      callback([]);

      if (!isPermissionError) {
        console.error("[inventoryMovements:subscribeToInventoryMovements]", error);
      }
    }
  );
}

export async function getIngredientPriceHistory(businessId, ingredientId) {
  const normalizedBusinessId = normalizeText(businessId);
  const normalizedIngredientId = normalizeText(ingredientId);

  if (!normalizedBusinessId || !normalizedIngredientId) {
    return [];
  }

  const purchasesQuery = query(purchasesCollection, where("business_id", "==", normalizedBusinessId));
  const snapshot = await getDocs(purchasesQuery);

  return sortPurchases(snapshot.docs.map((purchaseDoc) => ({ id: purchaseDoc.id, ...purchaseDoc.data() })))
    .filter((purchase) => {
      const status = normalizeText(purchase.status).toLowerCase();
      return ![PURCHASE_STATUS.CANCELED, "cancelada", "canceled", "cancelled"].includes(status);
    })
    .flatMap((purchase) =>
      (purchase.items || [])
        .filter((item) => (item.inventoryItemId || item.ingredient_id) === normalizedIngredientId)
        .map((item) => ({
          purchase_id: purchase.id,
          purchase_date: purchase.purchase_date,
          invoice_number: purchase.invoice_number,
          unit_price: item.unit_price ?? item.unitCost,
          landed_unit_cost: item.landed_unit_cost,
          supplier_name: purchase.supplier_name,
        }))
    )
    .slice(0, 12);
}

export async function updatePurchaseMovement(purchaseId, updates = {}) {
  const normalizedPurchaseId = normalizeText(purchaseId);
  if (!normalizedPurchaseId) {
    throw new Error("La compra a editar es obligatoria.");
  }

  const nextTotal = Number(updates.total);
  const payload = {
    concept: normalizeText(updates.concept),
    updatedAt: serverTimestamp(),
  };

  if (Number.isFinite(nextTotal) && nextTotal >= 0) {
    payload.total = nextTotal;
  }

  await updateDoc(doc(db, "purchases", normalizedPurchaseId), payload);
}
