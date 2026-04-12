import {
  addDoc,
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

const ordersCollection = collection(db, "orders");

export function subscribeToActiveOrder(businessId, tableId, callback) {
  if (!tableId) {
    return () => {};
  }

  const orderQuery = query(
    ordersCollection,
    where("business_id", "==", businessId),
    where("table_id", "==", tableId),
    where("status", "in", ["open", "requested_bill"])
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
  const payload = {
    business_id: businessId,
    table_id: table.id,
    status: table.status === "requested_bill" ? "requested_bill" : "open",
    items,
    total,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (orderId) {
    await updateDoc(doc(db, "orders", orderId), payload);
    await updateDoc(doc(db, "tables", table.id), {
      status: "occupied",
      active_order_id: orderId,
      updatedAt: serverTimestamp(),
    });
    return orderId;
  }

  const createdOrder = await addDoc(ordersCollection, payload);
  await updateDoc(doc(db, "tables", table.id), {
    status: "occupied",
    active_order_id: createdOrder.id,
    updatedAt: serverTimestamp(),
  });
  return createdOrder.id;
}

export async function requestPayment({
  businessId,
  tableId,
  orderId,
  paymentMethod,
}) {
  const orderRef = doc(db, "orders", orderId);
  const tableRef = doc(db, "tables", tableId);
  const salesCollection = collection(db, "sales_history");

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    const tableSnapshot = await transaction.get(tableRef);

    if (!orderSnapshot.exists()) {
      throw new Error("The active order does not exist.");
    }

    if (!tableSnapshot.exists()) {
      throw new Error("The selected table does not exist.");
    }

    const orderData = orderSnapshot.data();

    transaction.update(orderRef, {
      status: "paid",
      paidAt: serverTimestamp(),
      paymentMethod,
      updatedAt: serverTimestamp(),
    });

    transaction.update(tableRef, {
      status: "paid",
      active_order_id: null,
      updatedAt: serverTimestamp(),
    });

    transaction.set(doc(salesCollection), {
      business_id: businessId,
      orderId,
      table_id: tableId,
      total: orderData.total,
      method: paymentMethod,
      date: serverTimestamp(),
      items: orderData.items,
      createdAt: serverTimestamp(),
    });
  });
}
