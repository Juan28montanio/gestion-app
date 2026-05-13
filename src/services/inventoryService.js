import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function normalizeText(value) {
  return String(value || "").trim();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getSaleBusinessId(sale = {}) {
  return normalizeText(sale.business_id || sale.businessId);
}

function getSaleInventoryStatus(sale = {}) {
  return normalizeText(sale.inventoryImpactStatus || sale.inventory_impact_status || "pending");
}

function createSaleMovement(transaction, movement) {
  const movementRef = doc(collection(db, "inventoryMovements"));
  const quantity = Math.abs(toNumber(movement.quantity));
  const unitCost = toNumber(movement.unitCost);

  transaction.set(movementRef, {
    businessId: movement.businessId,
    business_id: movement.businessId,
    type: movement.type || "sale_out",
    movementType: movement.type || "sale_out",
    movement_type: movement.type || "sale_out",
    direction: movement.direction || "out",
    sourceType: "sale",
    source_type: "sale",
    sourceId: movement.saleId,
    source_id: movement.saleId,
    saleId: movement.saleId,
    sale_id: movement.saleId,
    orderId: movement.orderId || null,
    order_id: movement.orderId || null,
    inventoryItemId: movement.inventoryItemId,
    inventory_item_id: movement.inventoryItemId,
    inventoryItemName: movement.inventoryItemName,
    inventory_item_name: movement.inventoryItemName,
    productId: movement.productId || null,
    product_id: movement.productId || null,
    productName: movement.productName || "",
    product_name: movement.productName || "",
    quantity,
    unit: movement.unit || "und",
    unitCost,
    totalCost: quantity * unitCost,
    stockBefore: toNumber(movement.stockBefore),
    stock_before: toNumber(movement.stockBefore),
    stockAfter: toNumber(movement.stockAfter),
    stock_after: toNumber(movement.stockAfter),
    reason: movement.reason || "Impacto automatico por venta",
    status: "valid",
    reversalOf: movement.reversalOf || null,
    reversal_of: movement.reversalOf || null,
    createdAt: serverTimestamp(),
    createdBy: movement.createdBy || "system",
    created_by: movement.createdBy || "system",
  });
}

async function getSaleItems(saleId, businessId) {
  const snapshot = await getDocs(
    query(
      collection(db, "saleItems"),
      where("business_id", "==", businessId),
      where("sale_id", "==", saleId)
    )
  );
  return snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
}

async function getRecipeBooksForSaleItems(businessId, saleItems) {
  const productIds = new Set(saleItems.map((item) => normalizeText(item.product_id || item.productId)).filter(Boolean));
  const sheetIds = new Set(saleItems.map((item) => normalizeText(item.technical_sheet_id || item.technicalSheetId)).filter(Boolean));

  if (!productIds.size && !sheetIds.size) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "recipeBooks"), where("business_id", "==", businessId))
  );

  return snapshot.docs
    .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
    .filter((recipeBook) => productIds.has(normalizeText(recipeBook.product_id)) || sheetIds.has(normalizeText(recipeBook.id)));
}

function buildIngredientAdjustments(saleItems, recipeBooks) {
  const adjustments = new Map();

  saleItems.forEach((item) => {
    const productId = normalizeText(item.product_id || item.productId);
    const technicalSheetId = normalizeText(item.technical_sheet_id || item.technicalSheetId);
    const quantitySold = toNumber(item.quantity);
    if (quantitySold <= 0) return;

    const recipeBook = recipeBooks.find(
      (candidate) =>
        normalizeText(candidate.product_id) === productId ||
        normalizeText(candidate.id) === technicalSheetId
    );
    if (!recipeBook || !Array.isArray(recipeBook.ingredients)) return;

    recipeBook.ingredients.forEach((ingredient) => {
      const ingredientId = normalizeText(ingredient.ingredient_id);
      const recipeQuantity = toNumber(ingredient.quantity);
      if (!ingredientId || recipeQuantity <= 0) return;

      const current = adjustments.get(ingredientId) || {
        quantity: 0,
        saleItem: item,
      };
      current.quantity += recipeQuantity * quantitySold;
      adjustments.set(ingredientId, current);
    });
  });

  return adjustments;
}

export async function applySaleInventoryImpact(saleId, options = {}) {
  const normalizedSaleId = normalizeText(saleId);
  if (!normalizedSaleId) {
    throw new Error("La venta es obligatoria para impactar inventario.");
  }

  const saleRef = doc(db, "sales", normalizedSaleId);
  const saleSnapshot = options.preloadedSaleSnapshot || await getDoc(saleRef);
  const saleData = saleSnapshot?.exists?.() ? saleSnapshot.data() : null;
  const fallbackBusinessId = normalizeText(options.businessId);
  const businessId = getSaleBusinessId(saleData || {}) || fallbackBusinessId;

  if (!businessId) {
    throw new Error("No se encontro el negocio de la venta para impactar inventario.");
  }

  const saleItems = Array.isArray(options.saleItems) ? options.saleItems : await getSaleItems(normalizedSaleId, businessId);
  const recipeBooks = await getRecipeBooksForSaleItems(businessId, saleItems);

  return runTransaction(db, async (transaction) => {
    const currentSaleSnapshot = await transaction.get(saleRef);
    if (!currentSaleSnapshot.exists()) {
      throw new Error("La venta no existe para impactar inventario.");
    }

    const currentSale = currentSaleSnapshot.data();
    const currentBusinessId = getSaleBusinessId(currentSale);
    if (currentBusinessId !== businessId) {
      throw new Error("La venta no pertenece al negocio activo.");
    }

    const currentStatus = getSaleInventoryStatus(currentSale);
    if (currentStatus === "applied" || currentStatus === "not_applicable") {
      return { status: currentStatus, movements: 0, skipped: true };
    }
    if (currentStatus === "reversed") {
      throw new Error("La venta ya tiene inventario reversado; no se puede aplicar de nuevo.");
    }

    const productImpacts = [];
    for (const item of saleItems) {
      const productId = normalizeText(item.product_id || item.productId);
      const quantitySold = toNumber(item.quantity);
      if (!productId || quantitySold <= 0) continue;

      const productRef = doc(db, "products", productId);
      const productSnapshot = await transaction.get(productRef);
      if (!productSnapshot.exists()) continue;

      const productData = productSnapshot.data();
      if (getSaleBusinessId(productData) !== businessId) continue;

      const isTicketWalletProduct = normalizeText(productData.product_type || productData.productType) === "ticket_wallet";
      const inventoryImpactMode = normalizeText(
        item.inventoryImpactMode ||
          item.inventory_impact_mode ||
          productData.inventory?.inventoryImpactMode ||
          productData.inventory_impact_mode ||
          (productData.inventory?.linkedTechnicalSheetId ? "technical_sheet" : "")
      );
      const consumesInventory = Boolean(productData.inventory?.consumesInventory ?? productData.consumesInventory);
      const shouldDiscountProductStock =
        !isTicketWalletProduct &&
        consumesInventory &&
        ["direct_item", "combo"].includes(inventoryImpactMode);

      if (!shouldDiscountProductStock) continue;

      const currentStock = toNumber(productData.stock);
      const nextStock = Math.max(currentStock - quantitySold, 0);
      productImpacts.push({
        ref: productRef,
        patch: { stock: nextStock, updatedAt: serverTimestamp() },
        movement: {
          businessId,
          saleId: normalizedSaleId,
          orderId: currentSale.order_id || currentSale.orderId || "",
          inventoryItemId: productId,
          inventoryItemName: productData.name || item.product_name || productId,
          productId,
          productName: productData.name || item.product_name || "",
          quantity: quantitySold,
          unit: productData.unit || "und",
          unitCost: productData.costing?.estimatedCost || productData.cost || 0,
          stockBefore: currentStock,
          stockAfter: nextStock,
          reason: "Descuento automatico por venta",
        },
      });
    }

    const ingredientImpacts = [];
    const ingredientAdjustments = buildIngredientAdjustments(saleItems, recipeBooks);
    for (const [ingredientId, adjustment] of ingredientAdjustments.entries()) {
      const ingredientRef = doc(db, "ingredients", ingredientId);
      const ingredientSnapshot = await transaction.get(ingredientRef);
      if (!ingredientSnapshot.exists()) continue;

      const ingredientData = ingredientSnapshot.data();
      if (getSaleBusinessId(ingredientData) !== businessId) continue;

      const currentStock = toNumber(ingredientData.stock);
      const quantityToDiscount = toNumber(adjustment.quantity);
      const nextStock = Math.max(currentStock - quantityToDiscount, 0);
      ingredientImpacts.push({
        ref: ingredientRef,
        patch: {
          stock: nextStock,
          inventory: {
            ...(ingredientData.inventory || {}),
            currentStock: nextStock,
          },
          updatedAt: serverTimestamp(),
        },
        movement: {
          businessId,
          saleId: normalizedSaleId,
          orderId: currentSale.order_id || currentSale.orderId || "",
          inventoryItemId: ingredientId,
          inventoryItemName: ingredientData.name || ingredientId,
          productId: adjustment.saleItem.product_id || adjustment.saleItem.productId || null,
          productName: adjustment.saleItem.product_name || adjustment.saleItem.productName || "",
          quantity: quantityToDiscount,
          unit: ingredientData.base_unit || ingredientData.baseUnit || ingredientData.unit || "und",
          unitCost:
            ingredientData.costs?.averageCost ||
            ingredientData.average_cost ||
            ingredientData.cost_per_base_unit ||
            ingredientData.cost_per_unit ||
            0,
          stockBefore: currentStock,
          stockAfter: nextStock,
          reason: "Descuento automatico por ficha tecnica vendida",
        },
      });
    }

    productImpacts.forEach((impact) => {
      transaction.update(impact.ref, impact.patch);
      createSaleMovement(transaction, impact.movement);
    });
    ingredientImpacts.forEach((impact) => {
      transaction.update(impact.ref, impact.patch);
      createSaleMovement(transaction, impact.movement);
    });

    const movementCount = productImpacts.length + ingredientImpacts.length;
    const nextStatus = movementCount > 0 ? "applied" : "not_applicable";
    transaction.update(saleRef, {
      inventoryImpactStatus: nextStatus,
      inventory_impact_status: nextStatus,
      inventoryAppliedAt: movementCount > 0 ? serverTimestamp() : null,
      inventory_applied_at: movementCount > 0 ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });

    return { status: nextStatus, movements: movementCount, skipped: false };
  });
}

export async function reverseSaleInventoryImpact(saleId, options = {}) {
  const normalizedSaleId = normalizeText(saleId);
  const reason = normalizeText(options.reason);
  if (!normalizedSaleId || !reason) {
    throw new Error("La venta y el motivo son obligatorios para reversar inventario.");
  }

  const movementsSnapshot = await getDocs(
    query(
      collection(db, "inventoryMovements"),
      where("sale_id", "==", normalizedSaleId),
      where("source_type", "==", "sale")
    )
  );
  const saleMovements = movementsSnapshot.docs
    .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
    .filter((movement) => normalizeText(movement.status || "valid") === "valid" && normalizeText(movement.direction) === "out");

  const saleRef = doc(db, "sales", normalizedSaleId);
  return runTransaction(db, async (transaction) => {
    const saleSnapshot = await transaction.get(saleRef);
    if (!saleSnapshot.exists()) {
      throw new Error("La venta no existe para reversar inventario.");
    }

    const sale = saleSnapshot.data();
    const businessId = getSaleBusinessId(sale);
    const currentStatus = getSaleInventoryStatus(sale);
    if (currentStatus === "reversed") {
      return { status: "reversed", movements: 0, skipped: true };
    }
    if (currentStatus !== "applied") {
      transaction.update(saleRef, {
        inventoryImpactStatus: "not_applicable",
        inventory_impact_status: "not_applicable",
        updatedAt: serverTimestamp(),
      });
      return { status: "not_applicable", movements: 0, skipped: true };
    }

    const stockReads = [];
    for (const movement of saleMovements) {
      const inventoryItemId = normalizeText(movement.inventory_item_id || movement.inventoryItemId);
      if (!inventoryItemId) continue;

      const productRef = doc(db, "products", inventoryItemId);
      const productSnapshot = await transaction.get(productRef);
      if (productSnapshot.exists() && getSaleBusinessId(productSnapshot.data()) === businessId) {
        stockReads.push({ movement, ref: productRef, data: productSnapshot.data(), kind: "product" });
        continue;
      }

      const ingredientRef = doc(db, "ingredients", inventoryItemId);
      const ingredientSnapshot = await transaction.get(ingredientRef);
      if (ingredientSnapshot.exists() && getSaleBusinessId(ingredientSnapshot.data()) === businessId) {
        stockReads.push({ movement, ref: ingredientRef, data: ingredientSnapshot.data(), kind: "ingredient" });
      }
    }

    stockReads.forEach(({ movement, ref, data, kind }) => {
      const quantity = toNumber(movement.quantity);
      const stockBefore = toNumber(data.stock);
      const stockAfter = stockBefore + quantity;
      const patch = kind === "ingredient"
        ? {
            stock: stockAfter,
            inventory: { ...(data.inventory || {}), currentStock: stockAfter },
            updatedAt: serverTimestamp(),
          }
        : { stock: stockAfter, updatedAt: serverTimestamp() };

      transaction.update(ref, patch);
      createSaleMovement(transaction, {
        businessId,
        saleId: normalizedSaleId,
        orderId: movement.order_id || movement.orderId || "",
        inventoryItemId: movement.inventory_item_id || movement.inventoryItemId,
        inventoryItemName: movement.inventory_item_name || movement.inventoryItemName || "",
        productId: movement.product_id || movement.productId || null,
        productName: movement.product_name || movement.productName || "",
        quantity,
        unit: movement.unit || "und",
        unitCost: movement.unitCost || movement.unit_cost || 0,
        stockBefore,
        stockAfter,
        direction: "in",
        type: "sale_reversal",
        reason,
        reversalOf: movement.id,
        createdBy: options.actor?.id || "system",
      });
      transaction.update(doc(db, "inventoryMovements", movement.id), {
        status: "reversed",
        reversedAt: serverTimestamp(),
        reversed_at: serverTimestamp(),
        reverseReason: reason,
        reverse_reason: reason,
      });
    });

    transaction.update(saleRef, {
      inventoryImpactStatus: "reversed",
      inventory_impact_status: "reversed",
      inventoryReversedAt: serverTimestamp(),
      inventory_reversed_at: serverTimestamp(),
      inventoryReverseReason: reason,
      inventory_reverse_reason: reason,
      updatedAt: serverTimestamp(),
    });

    return { status: "reversed", movements: stockReads.length, skipped: false };
  });
}
