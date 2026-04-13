import {
  Timestamp,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const startOfDay = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(date);
};

async function decrementIngredientsForSale(businessId, orderItems) {
  const normalizedBusinessId = String(businessId || "").trim();

  if (!normalizedBusinessId || !Array.isArray(orderItems) || orderItems.length === 0) {
    return;
  }

  const productIds = orderItems
    .map((item) => String(item?.id || item?.productId || "").trim())
    .filter(Boolean);

  if (!productIds.length) {
    return;
  }

  const recipeBooksSnapshot = await getDocs(
    query(collection(db, "recipeBooks"), where("business_id", "==", normalizedBusinessId))
  );

  const recipeBooks = recipeBooksSnapshot.docs
    .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
    .filter((recipeBook) => productIds.includes(String(recipeBook.product_id || "").trim()));

  if (!recipeBooks.length) {
    return;
  }

  await runTransaction(db, async (transaction) => {
    const ingredientAdjustments = new Map();

    orderItems.forEach((item) => {
      const productId = String(item?.id || item?.productId || "").trim();
      const quantitySold = Number(item?.quantity || 0);
      const recipeBook = recipeBooks.find(
        (candidate) => String(candidate.product_id || "").trim() === productId
      );

      if (!recipeBook || !Array.isArray(recipeBook.ingredients)) {
        return;
      }

      recipeBook.ingredients.forEach((ingredient) => {
        const ingredientId = String(ingredient?.ingredient_id || "").trim();
        const recipeQuantity = Number(ingredient?.quantity || 0);

        if (!ingredientId || !Number.isFinite(recipeQuantity) || recipeQuantity <= 0) {
          return;
        }

        ingredientAdjustments.set(
          ingredientId,
          (ingredientAdjustments.get(ingredientId) || 0) + recipeQuantity * quantitySold
        );
      });
    });

    for (const [ingredientId, quantityToDiscount] of ingredientAdjustments.entries()) {
      const ingredientRef = doc(db, "ingredients", ingredientId);
      const ingredientSnapshot = await transaction.get(ingredientRef);

      if (!ingredientSnapshot.exists()) {
        continue;
      }

      const ingredientData = ingredientSnapshot.data();
      const currentStock = Number(ingredientData.stock || 0);

      transaction.update(ingredientRef, {
        stock: Math.max(currentStock - quantityToDiscount, 0),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export async function closeOrderAndLogSale(orderId, paymentMethod, options = {}) {
  const normalizedOrderId = String(orderId || "").trim();
  const normalizedPaymentMethod = String(paymentMethod || "").trim();

  if (!normalizedOrderId) {
    throw new Error("El id de la orden es obligatorio.");
  }

  if (!normalizedPaymentMethod) {
    throw new Error("El metodo de pago es obligatorio.");
  }

  const orderRef = doc(db, "orders", normalizedOrderId);
  const salesCollection = collection(db, "sales_history");
  let orderItemsForInventory = [];
  let businessIdForInventory = "";

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error("La orden indicada no existe.");
    }

    const orderData = orderSnapshot.data();
    const resolvedTableId = String(options.tableId || orderData.table_id || "").trim();
    const resolvedBusinessId = String(options.businessId || orderData.business_id || "").trim();

    if (!resolvedTableId) {
      throw new Error("No fue posible determinar la mesa asociada a la orden.");
    }

    if (!resolvedBusinessId) {
      throw new Error("No fue posible determinar el negocio asociado a la orden.");
    }

    const tableRef = doc(db, "tables", resolvedTableId);
    const tableSnapshot = await transaction.get(tableRef);

    if (!tableSnapshot.exists()) {
      throw new Error("La mesa asociada a la orden no existe.");
    }

    transaction.update(orderRef, {
      status: "pagada",
      payment_method: normalizedPaymentMethod,
      closed_at: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(doc(salesCollection), {
      business_id: resolvedBusinessId,
      order_id: normalizedOrderId,
      table_id: resolvedTableId,
      items: orderData.items || [],
      total: Number(orderData.total) || 0,
      payment_method: normalizedPaymentMethod,
      closed_at: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    transaction.update(tableRef, {
      status: "disponible",
      current_order_id: null,
      updatedAt: serverTimestamp(),
    });

    orderItemsForInventory = orderData.items || [];
    businessIdForInventory = resolvedBusinessId;
  });

  await decrementIngredientsForSale(businessIdForInventory, orderItemsForInventory);
}

export function subscribeToDailySales(businessId, callback) {
  const salesQuery = query(
    collection(db, "sales_history"),
    where("business_id", "==", businessId),
    where("closed_at", ">=", startOfDay())
  );

  return onSnapshot(salesQuery, (snapshot) => {
    const sales = snapshot.docs.map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
    }));

    const byMethod = sales.reduce(
      (accumulator, sale) => {
        const method = sale.payment_method || sale.method || "unknown";
        accumulator[method] = (accumulator[method] || 0) + (Number(sale.total) || 0);
        return accumulator;
      },
      { cash: 0, transfer: 0, card: 0, nequi: 0, daviplata: 0 }
    );

    callback({
      sales,
      total: sales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0),
      byMethod,
    });
  });
}
