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
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { createSubscriptionErrorHandler } from "./subscriptionService";
import {
  calculateConversionFactor,
  calculateCostPerBaseUnit,
  calculateRealCost,
  calculateReorderPoint,
  calculateUsefulYield,
  normalizeUnit,
  toFiniteNumber,
} from "../features/resources/inventory/supplyCalculations";

const ingredientsCollection = collection(db, "ingredients");

function sortSupplies(items = []) {
  return [...items].sort((left, right) =>
    String(left?.name || "").localeCompare(String(right?.name || ""), "es", {
      sensitivity: "base",
    })
  );
}

export function buildSupplySearchKey(name) {
  return String(name || "").trim().toLocaleLowerCase("es");
}

function normalizeSupplyPayload(supply, businessId) {
  const name = String(supply?.name || "").trim();
  const unit = normalizeUnit(supply?.unit || supply?.baseUnit || supply?.base_unit || "g");
  const stock = Number(supply?.inventory?.currentStock ?? supply?.stock);
  const stockMinAlert = Number(
    supply?.inventory?.minimumStock ?? supply?.stock_min_alert ?? supply?.stockMinAlert ?? 0
  );
  const currentCost = toFiniteNumber(
    supply?.costs?.currentCost ?? supply?.currentCost ?? supply?.average_cost ?? supply?.cost_per_unit,
    0
  );
  const averageCost = toFiniteNumber(
    supply?.costs?.averageCost ?? supply?.average_cost ?? supply?.cost_per_unit ?? supply?.costPerUnit ?? currentCost,
    0
  );
  const lastPurchaseCost = toFiniteNumber(
    supply?.costs?.lastCost ?? supply?.last_purchase_cost ?? supply?.lastPurchaseCost ?? currentCost ?? averageCost,
    0
  );
  const category = String(supply?.category || "").trim();
  const normalizedBusinessId = String(supply?.business_id || businessId || "").trim();
  const type = String(supply?.type || "raw_material").trim();
  const status = String(supply?.status || "active").trim();
  const purchaseUnit = normalizeUnit(supply?.conversion?.purchaseUnit ?? supply?.purchaseUnit ?? unit);
  const purchaseQuantity = toFiniteNumber(
    supply?.conversion?.purchaseQuantity ?? supply?.purchaseQuantity ?? 1,
    1
  );
  const conversionFactor = calculateConversionFactor({
    purchaseUnit,
    baseUnit: unit,
    purchaseQuantity,
    conversionFactor: supply?.conversion?.conversionFactor ?? supply?.conversionFactor,
  });
  const costPerBaseUnit = calculateCostPerBaseUnit({
    currentCost,
    purchaseQuantity,
    conversionFactor,
  });
  const idealStock = toFiniteNumber(supply?.inventory?.idealStock ?? supply?.idealStock, 0);
  const reorderPoint =
    toFiniteNumber(supply?.inventory?.reorderPoint ?? supply?.reorderPoint, 0) ||
    calculateReorderPoint({ minimumStock: stockMinAlert, idealStock });
  const wastePercent = toFiniteNumber(supply?.waste?.wastePercent ?? supply?.wastePercent, 0);
  const usefulYield =
    toFiniteNumber(supply?.waste?.usefulYield ?? supply?.usefulYield, 0) ||
    calculateUsefulYield(purchaseQuantity * conversionFactor, wastePercent);
  const realCost = calculateRealCost({ currentCost, usefulYield });

  if (!name) {
    throw new Error("El nombre del insumo es obligatorio.");
  }

  if (!category) {
    throw new Error("La categoria del insumo es obligatoria.");
  }

  if (!unit) {
    throw new Error("La unidad base del insumo es obligatoria.");
  }

  if (!normalizedBusinessId) {
    throw new Error("El business_id del insumo es obligatorio.");
  }

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("El stock del insumo debe ser un numero valido mayor o igual a 0.");
  }

  if (!Number.isFinite(stockMinAlert) || stockMinAlert < 0) {
    throw new Error("El stock minimo debe ser un numero valido mayor o igual a 0.");
  }

  if (!Number.isFinite(averageCost) || averageCost < 0) {
    throw new Error("El costo promedio debe ser un numero valido mayor o igual a 0.");
  }

  if (!Number.isFinite(lastPurchaseCost) || lastPurchaseCost < 0) {
    throw new Error("El ultimo costo de compra debe ser un numero valido mayor o igual a 0.");
  }

  if (wastePercent < 0 || wastePercent > 100) {
    throw new Error("La merma debe estar entre 0 y 100.");
  }

  if (!Number.isFinite(purchaseQuantity) || purchaseQuantity <= 0 || conversionFactor <= 0) {
    throw new Error("La conversion del insumo debe ser valida y mayor a cero.");
  }

  return {
    name,
    search_name: buildSupplySearchKey(name),
    code: String(supply?.code || "").trim(),
    subcategory: String(supply?.subcategory || "").trim(),
    description: String(supply?.description || "").trim(),
    type,
    status,
    unit,
    base_unit: unit,
    baseUnit: unit,
    stock,
    stock_min_alert: stockMinAlert,
    cost_per_base_unit: costPerBaseUnit,
    average_cost: averageCost,
    cost_per_unit: costPerBaseUnit || averageCost,
    last_purchase_cost: lastPurchaseCost,
    category,
    conversion: {
      purchaseUnit,
      purchaseQuantity,
      conversionFactor,
    },
    costs: {
      currentCost,
      averageCost,
      lastCost: lastPurchaseCost,
      costPerBaseUnit,
      realCost,
    },
    inventory: {
      currentStock: stock,
      minimumStock: stockMinAlert,
      idealStock,
      reorderPoint,
      inventoryUnit: normalizeUnit(supply?.inventory?.inventoryUnit ?? supply?.inventoryUnit ?? unit),
      location: String(supply?.inventory?.location ?? supply?.location ?? "").trim(),
    },
    waste: {
      wastePercent,
      usefulYield,
      notes: String(supply?.waste?.notes ?? supply?.wasteNotes ?? "").trim(),
    },
    storage: {
      type: String(supply?.storage?.type ?? supply?.storageType ?? "").trim(),
      shelfLifeClosed: toFiniteNumber(
        supply?.storage?.shelfLifeClosed ?? supply?.shelfLifeClosed,
        0
      ),
      shelfLifeOpened: toFiniteNumber(
        supply?.storage?.shelfLifeOpened ?? supply?.shelfLifeOpened,
        0
      ),
      timeUnit: String(supply?.storage?.timeUnit ?? supply?.timeUnit ?? "days").trim(),
    },
    supplier: {
      supplierId: String(supply?.supplier?.supplierId ?? supply?.supplier_id ?? "").trim(),
      supplierName: String(supply?.supplier?.supplierName ?? supply?.supplier_name ?? "").trim(),
    },
    notes: String(supply?.notes ?? "").trim(),
    analytics: {
      monthlyConsumption: toFiniteNumber(supply?.analytics?.monthlyConsumption, 0),
      rotation: toFiniteNumber(supply?.analytics?.rotation, 0),
      averageUsage: toFiniteNumber(supply?.analytics?.averageUsage, 0),
    },
    traceability: {
      purchasesEnabled: true,
      movementsEnabled: false,
      consumptionEnabled: false,
      productionEnabled: false,
      wasteEnabled: false,
    },
    business_id: normalizedBusinessId,
  };
}

export function subscribeToSupplies(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const ingredientsQuery = query(
    ingredientsCollection,
    where("business_id", "==", businessId)
  );

  return onSnapshot(ingredientsQuery, (snapshot) => {
    callback(
      sortSupplies(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })))
    );
  }, createSubscriptionErrorHandler({
    scope: "ingredients:subscribeToSupplies",
    callback,
    emptyValue: [],
  }));
}

export async function createSupply(businessId, supply) {
  const payload = normalizeSupplyPayload(supply, businessId);

  const createdSupply = await addDoc(ingredientsCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return createdSupply.id;
}

export async function updateSupply(supplyId, businessId, supply) {
  if (!supplyId) {
    throw new Error("El id del insumo es obligatorio para actualizar.");
  }

  const payload = normalizeSupplyPayload(supply, businessId);

  await updateDoc(doc(db, "ingredients", supplyId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function listSupplies(businessId) {
  const normalizedBusinessId = String(businessId || "").trim();

  if (!normalizedBusinessId) {
    return [];
  }

  const ingredientsQuery = query(ingredientsCollection, where("business_id", "==", normalizedBusinessId));
  const snapshot = await getDocs(ingredientsQuery);
  return sortSupplies(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
}
