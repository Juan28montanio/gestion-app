import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { createSubscriptionErrorHandler } from "./subscriptionService";

const suppliersCollection = collection(db, "suppliers");

function sortSuppliers(items = []) {
  return [...items].sort((left, right) =>
    String(left?.name || "").localeCompare(String(right?.name || ""), "es", {
      sensitivity: "base",
    })
  );
}

function normalizeSupplierPayload(supplier, businessId) {
  const name = String(supplier?.name || "").trim();
  const nit = String(supplier?.nit || "").trim();
  const category = String(supplier?.category || "").trim();
  const contactName = String(
    supplier?.contact_name || supplier?.contactName || supplier?.contact || ""
  ).trim();
  const phone = String(supplier?.phone || "").trim();
  const mobile = String(supplier?.mobile || "").trim();
  const email = String(supplier?.email || "").trim();
  const address = String(supplier?.address || "").trim();
  const paymentTerms = String(supplier?.payment_terms || supplier?.paymentTerms || "").trim();
  const normalizedBusinessId = String(supplier?.business_id || businessId || "").trim();

  if (!name) {
    throw new Error("El nombre del proveedor es obligatorio.");
  }

  if (!normalizedBusinessId) {
    throw new Error("El business_id del proveedor es obligatorio.");
  }

  return {
    name,
    nit,
    category,
    contact_name: contactName,
    contact: contactName,
    phone,
    mobile,
    email,
    address,
    payment_terms: paymentTerms || "Contado",
    business_id: normalizedBusinessId,
  };
}

export function subscribeToSuppliers(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const suppliersQuery = query(
    suppliersCollection,
    where("business_id", "==", businessId)
  );

  return onSnapshot(suppliersQuery, (snapshot) => {
    callback(
      sortSuppliers(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })))
    );
  }, createSubscriptionErrorHandler({
    scope: "suppliers:subscribeToSuppliers",
    callback,
    emptyValue: [],
  }));
}

export async function createSupplier(businessId, supplier) {
  const payload = normalizeSupplierPayload(supplier, businessId);

  const createdSupplier = await addDoc(suppliersCollection, {
    ...payload,
    total_purchases_value: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return createdSupplier.id;
}

export async function updateSupplier(supplierId, businessId, supplier) {
  if (!supplierId) {
    throw new Error("El id del proveedor es obligatorio para actualizar.");
  }

  const payload = normalizeSupplierPayload(supplier, businessId);

  await updateDoc(doc(db, "suppliers", supplierId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSupplier(supplierId) {
  if (!supplierId) {
    throw new Error("El id del proveedor es obligatorio para eliminar.");
  }

  await deleteDoc(doc(db, "suppliers", supplierId));
}
