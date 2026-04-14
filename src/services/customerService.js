import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const customersCollection = collection(db, "customers");

function normalizeCustomerPayload(customer, businessId) {
  const normalizedBusinessId = String(customer?.business_id || businessId || "").trim();
  const name = String(customer?.name || "").trim();
  const phone = String(customer?.phone || "").trim();
  const email = String(customer?.email || "").trim();
  const notes = String(customer?.notes || "").trim();

  if (!normalizedBusinessId) {
    throw new Error("El business_id del cliente es obligatorio.");
  }

  if (!name) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  return {
    business_id: normalizedBusinessId,
    name,
    phone,
    email,
    notes,
    debt_balance: Number(
      customer?.debt_balance ?? customer?.debtBalance ?? customer?.pendingDebt ?? 0
    ),
    pendingDebt: Number(
      customer?.pendingDebt ?? customer?.debt_balance ?? customer?.debtBalance ?? 0
    ),
  };
}

export function subscribeToCustomers(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const customersQuery = query(
    customersCollection,
    where("business_id", "==", businessId),
    orderBy("name", "asc")
  );

  return onSnapshot(customersQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  });
}

export async function createCustomer(businessId, customer) {
  const payload = normalizeCustomerPayload(customer, businessId);
  const createdCustomer = await addDoc(customersCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return createdCustomer.id;
}

export async function updateCustomer(customerId, businessId, customer) {
  if (!customerId) {
    throw new Error("El id del cliente es obligatorio para editar.");
  }

  const payload = normalizeCustomerPayload(customer, businessId);
  await updateDoc(doc(db, "customers", customerId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCustomer(customerId) {
  if (!customerId) {
    throw new Error("El id del cliente es obligatorio para eliminar.");
  }

  await deleteDoc(doc(db, "customers", customerId));
}
