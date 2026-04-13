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

const suppliesCollection = collection(db, "supplies");

function normalizeSupplyPayload(supply, businessId) {
  const name = String(supply?.name || "").trim();
  const unit = String(supply?.unit || "").trim().toLowerCase();
  const costPerUnit = Number(supply?.cost_per_unit ?? supply?.costPerUnit);
  const stock = Number(supply?.stock);
  const normalizedBusinessId = String(supply?.business_id || businessId || "").trim();

  if (!name) {
    throw new Error("El nombre del insumo es obligatorio.");
  }

  if (!unit) {
    throw new Error("La unidad de medida del insumo es obligatoria.");
  }

  if (!normalizedBusinessId) {
    throw new Error("El business_id del insumo es obligatorio.");
  }

  if (!Number.isFinite(costPerUnit) || costPerUnit < 0) {
    throw new Error("El costo por unidad debe ser un numero valido mayor o igual a 0.");
  }

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("El stock del insumo debe ser un numero valido mayor o igual a 0.");
  }

  return {
    name,
    unit,
    cost_per_unit: costPerUnit,
    stock,
    business_id: normalizedBusinessId,
  };
}

export function subscribeToSupplies(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const suppliesQuery = query(
    suppliesCollection,
    where("business_id", "==", businessId),
    orderBy("name", "asc")
  );

  return onSnapshot(suppliesQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  });
}

export async function createSupply(businessId, supply) {
  const payload = normalizeSupplyPayload(supply, businessId);

  const createdSupply = await addDoc(suppliesCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return createdSupply.id;
}

export async function updateSupply(supplyId, businessId, supply) {
  if (!supplyId) {
    throw new Error("El id del insumo es obligatorio para actualizar.");
  }

  const payload = normalizeSupplyPayload(supply, businessId);

  await updateDoc(doc(db, "supplies", supplyId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSupply(supplyId) {
  if (!supplyId) {
    throw new Error("El id del insumo es obligatorio para eliminar.");
  }

  await deleteDoc(doc(db, "supplies", supplyId));
}
