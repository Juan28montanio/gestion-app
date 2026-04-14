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

const DEFAULT_METHODS = { cash: 0, transfer: 0, card: 0, nequi: 0, daviplata: 0 };

const startOfDay = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(date);
};

export async function handleStockReduction(businessId, orderItems) {
  const normalizedBusinessId = String(businessId || "").trim();

  if (!normalizedBusinessId || !Array.isArray(orderItems) || orderItems.length === 0) {
    return;
  }

  const productAdjustments = new Map();
  const productIds = [];

  orderItems.forEach((item) => {
    const productId = String(item?.id || item?.productId || "").trim();
    const quantity = Number(item?.quantity || 0);

    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      return;
    }

    productIds.push(productId);
    productAdjustments.set(productId, (productAdjustments.get(productId) || 0) + quantity);
  });

  const recipeBooksSnapshot = await getDocs(
    query(collection(db, "recipeBooks"), where("business_id", "==", normalizedBusinessId))
  );

  const recipeBooks = recipeBooksSnapshot.docs
    .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }))
    .filter((recipeBook) => productIds.includes(String(recipeBook.product_id || "").trim()));

  await runTransaction(db, async (transaction) => {
    const ingredientAdjustments = new Map();

    for (const [productId, quantitySold] of productAdjustments.entries()) {
      const productRef = doc(db, "products", productId);
      const productSnapshot = await transaction.get(productRef);

      if (productSnapshot.exists()) {
        const productData = productSnapshot.data();
        const currentStock = Number(productData.stock || 0);

        transaction.update(productRef, {
          stock: Math.max(currentStock - quantitySold, 0),
          updatedAt: serverTimestamp(),
        });
      }

      const recipeBook = recipeBooks.find(
        (candidate) => String(candidate.product_id || "").trim() === productId
      );

      if (!recipeBook || !Array.isArray(recipeBook.ingredients)) {
        continue;
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
    }

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
    const subtotal = Number(options.subtotal ?? orderData.subtotal ?? orderData.total ?? 0);
    const chargedTotalCandidate = Number(options.chargedTotal);
    const chargedTotal =
      Number.isFinite(chargedTotalCandidate) && chargedTotalCandidate >= 0
        ? chargedTotalCandidate
        : subtotal;
    const adjustmentAmount = chargedTotal - subtotal;
    const adjustmentPct = subtotal > 0 ? (adjustmentAmount / subtotal) * 100 : 0;
    const customerId = String(
      options.customer?.id || orderData.customer_id || options.customerId || ""
    ).trim();
    const customerName = String(
      options.customer?.name || orderData.customer_name || options.customerName || ""
    ).trim();
    const debtAmount =
      customerId && subtotal > chargedTotal ? Number((subtotal - chargedTotal).toFixed(2)) : 0;

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

    const tableData = tableSnapshot.data();

    transaction.update(orderRef, {
      status: "pagada",
      payment_method: normalizedPaymentMethod,
      customer_id: customerId || null,
      customer_name: customerName || "",
      subtotal,
      total: chargedTotal,
      adjustment_amount: adjustmentAmount,
      adjustment_pct: adjustmentPct,
      debt_amount: debtAmount,
      closed_at: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(doc(salesCollection), {
      business_id: resolvedBusinessId,
      order_id: normalizedOrderId,
      table_id: resolvedTableId,
      table_name: tableData.name || `Mesa ${tableData.number || ""}`.trim(),
      customer_id: customerId || null,
      customer_name: customerName || "",
      items: orderData.items || [],
      subtotal,
      total: chargedTotal,
      adjustment_amount: adjustmentAmount,
      adjustment_pct: adjustmentPct,
      debt_amount: debtAmount,
      payment_method: normalizedPaymentMethod,
      concept: `Venta ${tableData.name || `Mesa ${tableData.number || ""}`.trim()}`,
      type: "income",
      closed_at: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    if (customerId) {
      const customerRef = doc(db, "customers", customerId);
      const customerSnapshot = await transaction.get(customerRef);

      if (customerSnapshot.exists()) {
        const customerData = customerSnapshot.data();
        transaction.update(customerRef, {
          debt_balance: Number(customerData.debt_balance || 0) + debtAmount,
          pendingDebt: Number(customerData.pendingDebt || customerData.debt_balance || 0) + debtAmount,
          last_order_at: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    transaction.update(tableRef, {
      status: "disponible",
      current_order_id: null,
      current_order_summary: "",
      current_total: 0,
      updatedAt: serverTimestamp(),
    });

    orderItemsForInventory = orderData.items || [];
    businessIdForInventory = resolvedBusinessId;
  });

  await handleStockReduction(businessIdForInventory, orderItemsForInventory);
}

export function subscribeToSalesHistory(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const salesQuery = query(collection(db, "sales_history"), where("business_id", "==", businessId));

  return onSnapshot(salesQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  });
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

    const byMethod = sales.reduce((accumulator, sale) => {
      const method = sale.payment_method || sale.method || "unknown";
      accumulator[method] = (accumulator[method] || 0) + (Number(sale.total) || 0);
      return accumulator;
    }, { ...DEFAULT_METHODS });

    callback({
      sales,
      total: sales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0),
      byMethod,
    });
  });
}
