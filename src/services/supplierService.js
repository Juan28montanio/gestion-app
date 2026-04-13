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

const suppliersCollection = collection(db, "suppliers");

function normalizeSupplierPayload(supplier, businessId) {
  const name = String(supplier?.name || "").trim();
  const nit = String(supplier?.nit || "").trim();
  const category = String(supplier?.category || "").trim();
  const contact = String(supplier?.contact || "").trim();
  const phone = String(supplier?.phone || "").trim();
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
    contact,
    phone,
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
    where("business_id", "==", businessId),
    orderBy("name", "asc")
  );

  return onSnapshot(suppliersQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  });
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
