import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { refreshRecipeBooksForIngredients } from "./recipeBookService";

const purchasesCollection = collection(db, "purchases");

function normalizePurchaseItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("La compra debe incluir al menos un item.");
  }

  return items.map((item) => {
    const ingredientId = String(item?.ingredient_id || item?.ingredientId || "").trim();
    const ingredientName = String(item?.ingredient_name || item?.ingredientName || "").trim();
    const quantity = Number(item?.quantity);
    const unitPrice = Number(item?.unit_price ?? item?.unitPrice);
    const ivaPct = Number(item?.iva_pct ?? item?.ivaPct ?? 0);
    const category = String(item?.category || "").trim();
    const unit = String(item?.unit || "").trim();

    if (!ingredientId) {
      throw new Error("Cada item de compra debe vincular un insumo.");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Cada item de compra debe incluir una cantidad valida.");
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error("Cada item de compra debe incluir un precio unitario valido.");
    }

    if (!Number.isFinite(ivaPct) || ivaPct < 0) {
      throw new Error("Cada item de compra debe incluir un IVA valido.");
    }

    return {
      ingredient_id: ingredientId,
      ingredient_name: ingredientName,
      quantity,
      unit,
      unit_price: unitPrice,
      iva_pct: ivaPct,
      category,
      total_cost: quantity * unitPrice * (1 + ivaPct / 100),
      landed_unit_cost: unitPrice * (1 + ivaPct / 100),
    };
  });
}

function buildPurchasePayload(purchase, items) {
  const businessId = String(purchase?.business_id || purchase?.businessId || "").trim();
  const supplierId = String(purchase?.supplier_id || purchase?.supplierId || "").trim();
  const supplierName = String(purchase?.supplier_name || purchase?.supplierName || "").trim();
  const invoiceNumber = String(purchase?.invoice_number || purchase?.invoiceNumber || "").trim();
  const purchaseDate = String(purchase?.purchase_date || purchase?.purchaseDate || "").trim();

  if (!businessId) {
    throw new Error("El business_id de la compra es obligatorio.");
  }

  if (!supplierId) {
    throw new Error("Debes seleccionar un proveedor para registrar la compra.");
  }

  if (!invoiceNumber) {
    throw new Error("El numero de factura es obligatorio.");
  }

  if (!purchaseDate) {
    throw new Error("La fecha de la compra es obligatoria.");
  }

  return {
    business_id: businessId,
    supplier_id: supplierId,
    supplier_name: supplierName,
    invoice_number: invoiceNumber,
    purchase_date: purchaseDate,
    items,
    total: items.reduce((sum, item) => sum + Number(item.total_cost || 0), 0),
    type: "expense",
    concept: `Compra ${invoiceNumber}`,
  };
}

export function subscribeToPurchases(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const purchasesQuery = query(
    purchasesCollection,
    where("business_id", "==", businessId),
    orderBy("purchase_date", "desc")
  );

  return onSnapshot(purchasesQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  });
}

export async function createPurchase(purchase) {
  const normalizedItems = normalizePurchaseItems(purchase?.items);
  const payload = buildPurchasePayload(purchase, normalizedItems);

  const touchedIngredientIds = [];

  const createdPurchaseId = await runTransaction(db, async (transaction) => {
    const supplierRef = doc(db, "suppliers", payload.supplier_id);
    const supplierSnapshot = await transaction.get(supplierRef);

    if (!supplierSnapshot.exists()) {
      throw new Error("El proveedor seleccionado no existe.");
    }

    const createdPurchaseRef = doc(purchasesCollection);

    transaction.set(createdPurchaseRef, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    for (const item of payload.items) {
      const ingredientRef = doc(db, "ingredients", item.ingredient_id);
      touchedIngredientIds.push(item.ingredient_id);
      const ingredientSnapshot = await transaction.get(ingredientRef);

      if (!ingredientSnapshot.exists()) {
        throw new Error("Uno de los insumos de la factura no existe.");
      }

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
        updatedAt: serverTimestamp(),
      });
    }

    const currentSupplier = supplierSnapshot.data();
    transaction.update(supplierRef, {
      total_purchases_value:
        Number(currentSupplier.total_purchases_value || 0) + Number(payload.total || 0),
      updatedAt: serverTimestamp(),
    });

    return createdPurchaseRef.id;
  });

  await refreshRecipeBooksForIngredients(payload.business_id, touchedIngredientIds);
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
    where("business_id", "==", normalizedBusinessId),
    orderBy("purchase_date", "desc")
  );

  const snapshot = await getDocs(purchasesQuery);

  return snapshot.docs
    .flatMap((purchaseDoc) => {
      const purchase = purchaseDoc.data();
      return (purchase.items || [])
        .filter((item) => item.ingredient_id === normalizedIngredientId)
        .map((item) => ({
          purchase_id: purchaseDoc.id,
          purchase_date: purchase.purchase_date,
          invoice_number: purchase.invoice_number,
          unit_price: item.unit_price,
          landed_unit_cost: item.landed_unit_cost,
          supplier_name: purchase.supplier_name,
        }));
    })
    .slice(0, 12);
}
