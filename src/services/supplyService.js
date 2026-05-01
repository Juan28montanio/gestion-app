import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { createSubscriptionErrorHandler } from "./subscriptionService";

const ingredientsCollection = collection(db, "ingredients");

function sortSupplies(items = []) {
  return [...items].sort((left, right) =>
    String(left?.name || "").localeCompare(String(right?.name || ""), "es", {
      sensitivity: "base",
    })
  );
}

export function buildSupplySearchKey(name) {
  return String(name || "").trim().toLocaleLowerCase("es");
}

function normalizeSupplyPayload(supply, businessId) {
  const name = String(supply?.name || "").trim();
  const unit = String(supply?.unit || supply?.base_unit || "").trim().toLowerCase();
  const stock = Number(supply?.stock);
  const stockMinAlert = Number(supply?.stock_min_alert ?? supply?.stockMinAlert ?? 0);
  const averageCost =
    Number(supply?.average_cost ?? supply?.cost_per_unit ?? supply?.costPerUnit) || 0;
  const lastPurchaseCost =
    Number(supply?.last_purchase_cost ?? supply?.lastPurchaseCost ?? averageCost) || 0;
  const category = String(supply?.category || "").trim();
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

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("El stock del insumo debe ser un numero valido mayor o igual a 0.");
  }

  if (!Number.isFinite(stockMinAlert) || stockMinAlert < 0) {
    throw new Error("El stock minimo debe ser un numero valido mayor o igual a 0.");
  }

  if (!Number.isFinite(averageCost) || averageCost < 0) {
    throw new Error("El costo promedio debe ser un numero valido mayor o igual a 0.");
  }

  if (!Number.isFinite(lastPurchaseCost) || lastPurchaseCost < 0) {
    throw new Error("El ultimo costo de compra debe ser un numero valido mayor o igual a 0.");
  }

  return {
    name,
    search_name: buildSupplySearchKey(name),
    unit,
    base_unit: unit,
    stock,
    stock_min_alert: stockMinAlert,
    average_cost: averageCost,
    cost_per_unit: averageCost,
    last_purchase_cost: lastPurchaseCost,
    category,
    business_id: normalizedBusinessId,
  };
}

export function subscribeToSupplies(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const ingredientsQuery = query(
    ingredientsCollection,
    where("business_id", "==", businessId)
  );

  return onSnapshot(ingredientsQuery, (snapshot) => {
    callback(
      sortSupplies(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })))
    );
  }, createSubscriptionErrorHandler({
    scope: "ingredients:subscribeToSupplies",
    callback,
    emptyValue: [],
  }));
}

export async function createSupply(businessId, supply) {
  const payload = normalizeSupplyPayload(supply, businessId);

  const createdSupply = await addDoc(ingredientsCollection, {
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

  await updateDoc(doc(db, "ingredients", supplyId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSupply(supplyId) {
  if (!supplyId) {
    throw new Error("El id del insumo es obligatorio para eliminar.");
  }

  await deleteDoc(doc(db, "ingredients", supplyId));
}

export async function listSupplies(businessId) {
  const normalizedBusinessId = String(businessId || "").trim();

  if (!normalizedBusinessId) {
    return [];
  }

  const ingredientsQuery = query(ingredientsCollection, where("business_id", "==", normalizedBusinessId));
  const snapshot = await getDocs(ingredientsQuery);
  return sortSupplies(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
}
