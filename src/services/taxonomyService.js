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
import {
  INGREDIENT_CATEGORY_DEFAULTS,
  SUPPLIER_CATEGORY_DEFAULTS,
  normalizeOptionLabel,
} from "../utils/resourceOptions";

const taxonomiesCollection = collection(db, "resource_taxonomies");

function sortTaxonomies(items = []) {
  return [...items].sort((left, right) =>
    String(left?.label || "").localeCompare(String(right?.label || ""), "es", {
      sensitivity: "base",
    })
  );
}

function getDefaultsByScope(scope) {
  if (scope === "supplier_categories") {
    return SUPPLIER_CATEGORY_DEFAULTS;
  }

  if (scope === "ingredient_categories") {
    return INGREDIENT_CATEGORY_DEFAULTS;
  }

  return [];
}

function normalizeTaxonomyPayload(businessId, scope, label) {
  const normalizedBusinessId = String(businessId || "").trim();
  const normalizedScope = String(scope || "").trim();
  const normalizedLabel = normalizeOptionLabel(label);

  if (!normalizedBusinessId) {
    throw new Error("El business_id es obligatorio para administrar categorias.");
  }

  if (!normalizedScope) {
    throw new Error("El scope de la categoria es obligatorio.");
  }

  if (!normalizedLabel) {
    throw new Error("La categoria no puede estar vacia.");
  }

  return {
    business_id: normalizedBusinessId,
    scope: normalizedScope,
    label: normalizedLabel,
    search_key: normalizedLabel.toLocaleLowerCase("es"),
  };
}

export async function seedDefaultTaxonomies(businessId, scope) {
  const normalizedBusinessId = String(businessId || "").trim();
  const normalizedScope = String(scope || "").trim();

  if (!normalizedBusinessId || !normalizedScope) {
    return;
  }

  const existingSnapshot = await getDocs(
    query(
      taxonomiesCollection,
      where("business_id", "==", normalizedBusinessId),
      where("scope", "==", normalizedScope)
    )
  );

  const existingLabels = new Set(
    existingSnapshot.docs.map((snapshotDoc) =>
      String(snapshotDoc.data().label || "").trim().toLocaleLowerCase("es")
    )
  );

  const defaults = getDefaultsByScope(normalizedScope)
    .map(normalizeOptionLabel)
    .filter(Boolean)
    .filter((label) => !existingLabels.has(label.toLocaleLowerCase("es")));

  await Promise.all(
    defaults.map((label) =>
      addDoc(taxonomiesCollection, {
        business_id: normalizedBusinessId,
        scope: normalizedScope,
        label,
        search_key: label.toLocaleLowerCase("es"),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  );
}

export function subscribeToTaxonomies(businessId, scope, callback) {
  const normalizedBusinessId = String(businessId || "").trim();
  const normalizedScope = String(scope || "").trim();

  if (!normalizedBusinessId || !normalizedScope) {
    callback([]);
    return () => {};
  }

  const taxonomiesQuery = query(
    taxonomiesCollection,
    where("business_id", "==", normalizedBusinessId),
    where("scope", "==", normalizedScope)
  );

  return onSnapshot(taxonomiesQuery, (snapshot) => {
    callback(
      sortTaxonomies(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })))
    );
  }, createSubscriptionErrorHandler({
    scope: `resource_taxonomies:${normalizedScope}`,
    callback,
    emptyValue: [],
  }));
}

export async function createTaxonomy(businessId, scope, label) {
  const payload = normalizeTaxonomyPayload(businessId, scope, label);
  const snapshot = await getDocs(
    query(
      taxonomiesCollection,
      where("business_id", "==", payload.business_id),
      where("scope", "==", payload.scope),
      where("search_key", "==", payload.search_key)
    )
  );

  if (!snapshot.empty) {
    throw new Error("Esa categoria ya existe.");
  }

  const createdDoc = await addDoc(taxonomiesCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return createdDoc.id;
}

export async function updateTaxonomy(taxonomyId, businessId, scope, label) {
  const normalizedTaxonomyId = String(taxonomyId || "").trim();
  if (!normalizedTaxonomyId) {
    throw new Error("La categoria a editar es obligatoria.");
  }

  const payload = normalizeTaxonomyPayload(businessId, scope, label);
  await updateDoc(doc(db, "resource_taxonomies", normalizedTaxonomyId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTaxonomy(taxonomyId) {
  const normalizedTaxonomyId = String(taxonomyId || "").trim();
  if (!normalizedTaxonomyId) {
    throw new Error("La categoria a eliminar es obligatoria.");
  }

  await deleteDoc(doc(db, "resource_taxonomies", normalizedTaxonomyId));
}
