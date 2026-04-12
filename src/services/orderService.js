import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { closeOrderAndLogSale } from "./financeService";

const ordersCollection = collection(db, "orders");
const tablesCollection = collection(db, "tables");

function normalizeOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("La orden debe incluir al menos un item.");
  }

  return items.map((item, index) => {
    const quantity = Number(item?.quantity);
    const price = Number(item?.price);
    const name = String(item?.name || "").trim();
    const id = String(item?.id || item?.productId || `item-${index + 1}`).trim();

    if (!name) {
      throw new Error("Cada item debe incluir nombre.");
    }

    if (!id) {
      throw new Error("Cada item debe incluir id.");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Cada item debe incluir una cantidad valida.");
    }

    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Cada item debe incluir un precio valido.");
    }

    return {
      id,
      name,
      quantity,
      price,
    };
  });
}

function calculateOrderTotal(items) {
  return items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
}

export async function createOrder(businessId, tableId, items) {
  const normalizedBusinessId = String(businessId || "").trim();
  const normalizedTableId = String(tableId || "").trim();
  const normalizedItems = normalizeOrderItems(items);
  const total = calculateOrderTotal(normalizedItems);

  if (!normalizedBusinessId) {
    throw new Error("El business_id de la orden es obligatorio.");
  }

  if (!normalizedTableId) {
    throw new Error("El table_id de la orden es obligatorio.");
  }

  return runTransaction(db, async (transaction) => {
    const tableRef = doc(tablesCollection, normalizedTableId);
    const tableSnapshot = await transaction.get(tableRef);

    if (!tableSnapshot.exists()) {
      throw new Error("La mesa seleccionada no existe.");
    }

    const createdOrderRef = doc(ordersCollection);

    transaction.set(createdOrderRef, {
      business_id: normalizedBusinessId,
      table_id: normalizedTableId,
      items: normalizedItems,
      total,
      status: "preparando",
      created_at: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(tableRef, {
      status: "ocupada",
      current_order_id: createdOrderRef.id,
      updatedAt: serverTimestamp(),
    });

    return createdOrderRef.id;
  });
}

export function subscribeToActiveOrder(businessId, tableId, callback) {
  if (!tableId) {
    return () => {};
  }

  const orderQuery = query(
    ordersCollection,
    where("business_id", "==", businessId),
    where("table_id", "==", tableId),
    where("status", "in", ["preparando", "cuenta_solicitada", "open", "requested_bill"])
  );

  return onSnapshot(orderQuery, (snapshot) => {
    const activeOrder = snapshot.docs[0];
    callback(activeOrder ? { id: activeOrder.id, ...activeOrder.data() } : null);
  });
}

export async function submitOrder({
  businessId,
  table,
  items,
  total,
  orderId,
}) {
  const normalizedItems = normalizeOrderItems(items);
  const payload = {
    business_id: String(businessId || "").trim(),
    table_id: String(table?.id || "").trim(),
    status:
      table?.status === "cuenta_solicitada" || table?.status === "requested_bill"
        ? "cuenta_solicitada"
        : "preparando",
    items: normalizedItems,
    total: Number(total) || calculateOrderTotal(normalizedItems),
    updatedAt: serverTimestamp(),
  };

  if (!payload.business_id || !payload.table_id) {
    throw new Error("La orden requiere business_id y table_id.");
  }

  if (orderId) {
    await updateDoc(doc(db, "orders", orderId), payload);
    await updateDoc(doc(db, "tables", table.id), {
      status: "ocupada",
      current_order_id: orderId,
      updatedAt: serverTimestamp(),
    });
    return orderId;
  }

  return createOrder(payload.business_id, payload.table_id, normalizedItems);
}

export async function requestPayment({
  businessId,
  tableId,
  orderId,
  paymentMethod,
}) {
  await closeOrderAndLogSale(orderId, paymentMethod, {
    businessId,
    tableId,
  });
}

export async function cancelOrder({ tableId, orderId }) {
  const normalizedOrderId = String(orderId || "").trim();
  const normalizedTableId = String(tableId || "").trim();

  if (!normalizedOrderId || !normalizedTableId) {
    throw new Error("Para cancelar se requiere orderId y tableId.");
  }

  const orderRef = doc(db, "orders", normalizedOrderId);
  const tableRef = doc(db, "tables", normalizedTableId);

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    const tableSnapshot = await transaction.get(tableRef);

    if (!orderSnapshot.exists()) {
      throw new Error("La orden indicada no existe.");
    }

    if (!tableSnapshot.exists()) {
      throw new Error("La mesa indicada no existe.");
    }

    transaction.update(orderRef, {
      status: "cancelada",
      cancelled_at: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(tableRef, {
      status: "disponible",
      current_order_id: null,
      updatedAt: serverTimestamp(),
    });
  });
}
