import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { refreshPreparationsForIngredients } from "./preparationService";
import { refreshRecipeBooksForIngredients } from "./recipeBookService";
import { buildSupplySearchKey, listSupplies } from "./supplyService";
import { resolvePurchasePaymentMethod } from "../utils/payments";
import { createSubscriptionErrorHandler } from "./subscriptionService";

const purchasesCollection = collection(db, "purchases");

function sortPurchases(items = []) {
  return [...items].sort((left, right) =>
    String(right?.purchase_date || "").localeCompare(String(left?.purchase_date || ""), "es", {
      sensitivity: "base",
    })
  );
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function toBoolean(value) {
  if (typeof value === "string") {
    return value === "true";
  }
  return Boolean(value);
}

function normalizePurchaseItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("La compra debe incluir al menos un item.");
  }

  return items.map((item, index) => {
    const ingredientId = String(item?.ingredient_id || item?.ingredientId || "").trim();
    const ingredientName = String(
      item?.ingredient_name || item?.ingredientName || item?.manual_name || item?.manualName || ""
    ).trim();
    const quantity = toNumber(item?.quantity);
    const explicitLineTotal = toNumber(item?.line_total ?? item?.lineTotal ?? item?.total_cost);
    const rawUnitPrice = toNumber(item?.unit_price ?? item?.unitPrice);
    const applyIva = toBoolean(item?.apply_iva ?? item?.applyIva);
    const ivaPct = applyIva ? toNumber(item?.iva_pct ?? item?.ivaPct ?? 0) : 0;
    const category = String(item?.category || "").trim();
    const unit = String(item?.unit || "").trim().toLowerCase();

    if (!ingredientId && !ingredientName) {
      throw new Error(`El item ${index + 1} debe seleccionar o crear un insumo.`);
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Cada item de compra debe incluir una cantidad valida.");
    }

    if (!unit) {
      throw new Error("Cada item de compra debe incluir una unidad de medida.");
    }

    if (!Number.isFinite(ivaPct) || ivaPct < 0) {
      throw new Error("Cada item de compra debe incluir un IVA valido.");
    }

    const lineTotal = Number.isFinite(explicitLineTotal)
      ? explicitLineTotal
      : Number.isFinite(rawUnitPrice)
        ? quantity * rawUnitPrice * (1 + (applyIva ? ivaPct : 0) / 100)
        : NaN;

    if (!Number.isFinite(lineTotal) || lineTotal <= 0) {
      throw new Error("Cada item de compra debe incluir un valor valido.");
    }

    const netTotal = applyIva ? lineTotal / (1 + ivaPct / 100) : lineTotal;
    const netUnitCost = netTotal / quantity;
    const landedUnitCost = lineTotal / quantity;

    return {
      ingredient_id: ingredientId,
      ingredient_name: ingredientName,
      search_name: buildSupplySearchKey(ingredientName),
      quantity,
      unit,
      category,
      apply_iva: applyIva,
      iva_pct: applyIva ? ivaPct : 0,
      line_total: lineTotal,
      unit_price: netUnitCost,
      total_cost: lineTotal,
      landed_unit_cost: landedUnitCost,
    };
  });
}

function buildPurchasePayload(purchase, items) {
  const businessId = String(purchase?.business_id || purchase?.businessId || "").trim();
  const supplierId = String(purchase?.supplier_id || purchase?.supplierId || "").trim();
  const supplierName = String(purchase?.supplier_name || purchase?.supplierName || "").trim();
  const supplierPaymentTerms = String(
    purchase?.supplier_payment_terms || purchase?.supplierPaymentTerms || "Contado"
  ).trim();
  const invoiceNumber = String(purchase?.invoice_number || purchase?.invoiceNumber || "").trim();
  const purchaseDate = String(purchase?.purchase_date || purchase?.purchaseDate || "").trim();

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
    business_id: businessId,
    supplier_id: supplierId,
    supplier_name: supplierName,
    supplier_payment_terms: supplierPaymentTerms || "Contado",
    payment_method: resolvePurchasePaymentMethod(
      purchase?.payment_method || purchase?.paymentMethod,
      supplierPaymentTerms
    ),
    invoice_number: invoiceNumber || `COMP-${Date.now()}`,
    purchase_date: purchaseDate,
    items,
    total: items.reduce((sum, item) => sum + Number(item.total_cost || 0), 0),
    type: "expense",
    concept: `Compra ${invoiceNumber || "sin consecutivo"}`,
  };
}

function resolveIngredientDrafts(payload, supplies) {
  const supplyById = new Map(supplies.map((supply) => [supply.id, supply]));
  const supplyByName = new Map(
    supplies.map((supply) => [buildSupplySearchKey(supply.name), supply])
  );

  return payload.items.map((item) => {
    const byId = item.ingredient_id ? supplyById.get(item.ingredient_id) : null;
    const byName = !byId && item.search_name ? supplyByName.get(item.search_name) : null;
    const resolvedSupply = byId || byName || null;

    if (resolvedSupply) {
      return {
        ...item,
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

export function subscribeToPurchases(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const purchasesQuery = query(
    purchasesCollection,
    where("business_id", "==", businessId)
  );

  return onSnapshot(purchasesQuery, (snapshot) => {
    callback(
      sortPurchases(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })))
    );
  }, createSubscriptionErrorHandler({
    scope: "purchases:subscribeToPurchases",
    callback,
    emptyValue: [],
  }));
}

export async function createPurchase(purchase) {
  const normalizedItems = normalizePurchaseItems(purchase?.items);
  const payload = buildPurchasePayload(purchase, normalizedItems);
  const supplies = await listSupplies(payload.business_id);
  const resolvedItems = resolveIngredientDrafts(payload, supplies);
  const touchedIngredientIds = [];

  const createdPurchaseId = await runTransaction(db, async (transaction) => {
    const supplierRef = doc(db, "suppliers", payload.supplier_id);
    const supplierSnapshot = await transaction.get(supplierRef);

    if (!supplierSnapshot.exists()) {
      throw new Error("El proveedor seleccionado no existe.");
    }

    const ingredientRefsById = new Map();
    const ingredientSnapshots = new Map();

    for (const item of resolvedItems) {
      if (item.is_new_supply) {
        continue;
      }

      const ingredientRef = doc(db, "ingredients", item.ingredient_id);
      ingredientRefsById.set(item.ingredient_id, ingredientRef);

      const ingredientSnapshot = await transaction.get(ingredientRef);
      if (!ingredientSnapshot.exists()) {
        throw new Error(`El insumo ${item.ingredient_name || item.ingredient_id} no existe.`);
      }

      ingredientSnapshots.set(item.ingredient_id, ingredientSnapshot);
    }

    const createdPurchaseRef = doc(purchasesCollection);

    for (const item of resolvedItems) {
      if (item.is_new_supply) {
        const ingredientRef = doc(collection(db, "ingredients"));
        item.ingredient_id = ingredientRef.id;
        touchedIngredientIds.push(ingredientRef.id);

        transaction.set(ingredientRef, {
          business_id: payload.business_id,
          name: item.ingredient_name,
          search_name: item.search_name,
          category: item.category,
          unit: item.unit,
          base_unit: item.unit,
          stock: item.quantity,
          stock_min_alert: 0,
          average_cost: item.landed_unit_cost,
          cost_per_unit: item.landed_unit_cost,
          last_purchase_cost: item.landed_unit_cost,
          supplier_id: payload.supplier_id,
          supplier_name: payload.supplier_name,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        continue;
      }

      touchedIngredientIds.push(item.ingredient_id);
      const ingredientSnapshot = ingredientSnapshots.get(item.ingredient_id);
      const ingredientRef = ingredientRefsById.get(item.ingredient_id);
      const ingredientData = ingredientSnapshot.data();
      const previousStock = Number(ingredientData.stock || 0);
      const previousAverageCost = Number(
        ingredientData.average_cost ?? ingredientData.cost_per_unit ?? 0
      );
      const incomingStock = Number(item.quantity || 0);
      const incomingCost = Number(item.landed_unit_cost || 0);
      const newStock = previousStock + incomingStock;
      const weightedAverageCost =
        newStock > 0
          ? (previousStock * previousAverageCost + incomingStock * incomingCost) / newStock
          : incomingCost;

      transaction.update(ingredientRef, {
        stock: newStock,
        average_cost: weightedAverageCost,
        cost_per_unit: weightedAverageCost,
        last_purchase_cost: incomingCost,
        category: item.category || ingredientData.category || "",
        unit: item.unit || ingredientData.unit || "und",
        base_unit: item.unit || ingredientData.base_unit || ingredientData.unit || "und",
        supplier_id: payload.supplier_id,
        supplier_name: payload.supplier_name,
        updatedAt: serverTimestamp(),
      });
    }

    transaction.set(createdPurchaseRef, {
      ...payload,
      items: resolvedItems.map((item) => ({
        ingredient_id: item.ingredient_id,
        ingredient_name: item.ingredient_name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        apply_iva: item.apply_iva,
        iva_pct: item.iva_pct,
        line_total: item.line_total,
        unit_price: item.unit_price,
        total_cost: item.total_cost,
        landed_unit_cost: item.landed_unit_cost,
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const currentSupplier = supplierSnapshot.data();
    transaction.update(supplierRef, {
      total_purchases_value:
        Number(currentSupplier.total_purchases_value || 0) + Number(payload.total || 0),
      updatedAt: serverTimestamp(),
    });

    return createdPurchaseRef.id;
  });

  await Promise.all([
    refreshRecipeBooksForIngredients(payload.business_id, touchedIngredientIds),
    refreshPreparationsForIngredients(payload.business_id, touchedIngredientIds),
  ]);
  return createdPurchaseId;
}

export async function getIngredientPriceHistory(businessId, ingredientId) {
  const normalizedBusinessId = String(businessId || "").trim();
  const normalizedIngredientId = String(ingredientId || "").trim();

  if (!normalizedBusinessId || !normalizedIngredientId) {
    return [];
  }

  const purchasesQuery = query(
    purchasesCollection,
    where("business_id", "==", normalizedBusinessId)
  );

  const snapshot = await getDocs(purchasesQuery);

  return sortPurchases(
    snapshot.docs.map((purchaseDoc) => ({ id: purchaseDoc.id, ...purchaseDoc.data() }))
  )
    .flatMap((purchaseDoc) => {
      const purchase = purchaseDoc;
      return (purchase.items || [])
        .filter((item) => item.ingredient_id === normalizedIngredientId)
        .map((item) => ({
          purchase_id: purchase.id,
          purchase_date: purchase.purchase_date,
          invoice_number: purchase.invoice_number,
          unit_price: item.unit_price,
          landed_unit_cost: item.landed_unit_cost,
          supplier_name: purchase.supplier_name,
        }));
    })
    .slice(0, 12);
}

export async function updatePurchaseMovement(purchaseId, updates = {}) {
  const normalizedPurchaseId = String(purchaseId || "").trim();
  if (!normalizedPurchaseId) {
    throw new Error("La compra a editar es obligatoria.");
  }

  const nextTotal = Number(updates.total);
  const payload = {
    concept: String(updates.concept || "").trim(),
    updatedAt: serverTimestamp(),
  };

  if (Number.isFinite(nextTotal) && nextTotal >= 0) {
    payload.total = nextTotal;
  }

  await updateDoc(doc(db, "purchases", normalizedPurchaseId), payload);
}
