import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { refreshRecipeBooksForPreparations } from "./recipeBookService";
import { createSubscriptionErrorHandler } from "./subscriptionService";

const preparationsCollection = collection(db, "preparations");
const ingredientsCollection = collection(db, "ingredients");

function normalizePreparationIngredients(ingredients) {
  if (!Array.isArray(ingredients)) {
    return [];
  }

  return ingredients
    .map((ingredient) => {
      const ingredientId = String(
        ingredient?.ingredient_id || ingredient?.ingredientId || ""
      ).trim();
      const quantity = Number(ingredient?.quantity);

      if (!ingredientId || !Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      return {
        ingredient_id: ingredientId,
        quantity,
      };
    })
    .filter(Boolean);
}

function sortByName(items = []) {
  return [...items].sort((left, right) =>
    String(left?.name || "").localeCompare(String(right?.name || ""), "es", {
      sensitivity: "base",
    })
  );
}

function computePreparationMetrics({ ingredients, inventory, wastePct, yieldQuantity }) {
  const baseCost = ingredients.reduce((sum, ingredient) => {
    const inventoryItem = inventory.find((item) => item.id === ingredient.ingredient_id);
    return sum + Number(inventoryItem?.average_cost || 0) * Number(ingredient.quantity || 0);
  }, 0);

  const normalizedWastePct =
    Number.isFinite(wastePct) && wastePct >= 0 && wastePct < 100 ? wastePct : 0;
  const normalizedYieldQuantity =
    Number.isFinite(yieldQuantity) && yieldQuantity > 0 ? yieldQuantity : 1;
  const realCost =
    normalizedWastePct > 0 ? baseCost / (1 - normalizedWastePct / 100) : baseCost;
  const costPerOutputUnit = realCost / normalizedYieldQuantity;

  return {
    baseCost,
    realCost,
    costPerOutputUnit,
  };
}

export function calculatePreparationMetricsPreview({
  ingredients = [],
  inventory = [],
  wastePct = 0,
  yieldQuantity = 1,
}) {
  return computePreparationMetrics({
    ingredients: normalizePreparationIngredients(ingredients),
    inventory,
    wastePct: Number(wastePct),
    yieldQuantity: Number(yieldQuantity),
  });
}

function getPreparationReadiness({ ingredients, prepTimeMinutes, preparationSteps }) {
  const hasIngredients = ingredients.length > 0;
  const hasOperations =
    Number.isFinite(prepTimeMinutes) &&
    prepTimeMinutes > 0 &&
    Array.isArray(preparationSteps) &&
    preparationSteps.length > 0;

  if (hasIngredients && hasOperations) {
    return "ready";
  }

  if (hasIngredients || hasOperations) {
    return "in_progress";
  }

  return "draft";
}

function normalizePreparationPayload(preparation, inventory) {
  const businessId = String(preparation?.business_id || preparation?.businessId || "").trim();
  const name = String(preparation?.name || "").trim();
  const category = String(preparation?.category || "").trim();
  const outputUnit = String(preparation?.output_unit || preparation?.outputUnit || "porcion").trim();
  const yieldQuantity = Number(
    preparation?.yield_quantity ?? preparation?.yieldQuantity ?? 1
  );
  const wastePct = Number(preparation?.waste_pct ?? preparation?.wastePct ?? 0);
  const prepTimeMinutes = Number(
    preparation?.prep_time_minutes ?? preparation?.prepTimeMinutes ?? 0
  );
  const preparationSteps = Array.isArray(preparation?.preparation_steps)
    ? preparation.preparation_steps
    : String(preparation?.preparationSteps || "")
        .split("\n")
        .map((step) => step.trim())
        .filter(Boolean);
  const normalizedIngredients = normalizePreparationIngredients(preparation?.ingredients);

  if (!businessId) {
    throw new Error("El business_id de la preparacion es obligatorio.");
  }

  if (!name) {
    throw new Error("El nombre de la preparacion es obligatorio.");
  }

  if (!outputUnit) {
    throw new Error("La unidad de salida es obligatoria.");
  }

  if (!Number.isFinite(yieldQuantity) || yieldQuantity <= 0) {
    throw new Error("El rendimiento debe ser mayor a 0.");
  }

  if (!Number.isFinite(wastePct) || wastePct < 0 || wastePct >= 100) {
    throw new Error("La merma debe estar entre 0 y 99.");
  }

  if (!Number.isFinite(prepTimeMinutes) || prepTimeMinutes < 0) {
    throw new Error("El tiempo de preparacion debe ser un numero valido.");
  }

  const metrics = computePreparationMetrics({
    ingredients: normalizedIngredients,
    inventory,
    wastePct,
    yieldQuantity,
  });

  return {
    business_id: businessId,
    name,
    category,
    output_unit: outputUnit,
    yield_quantity: yieldQuantity,
    waste_pct: wastePct,
    prep_time_minutes: prepTimeMinutes,
    preparation_steps: preparationSteps,
    ingredients: normalizedIngredients,
    base_cost: metrics.baseCost,
    real_cost: metrics.realCost,
    cost_per_output_unit: metrics.costPerOutputUnit,
    readiness_status: getPreparationReadiness({
      ingredients: normalizedIngredients,
      prepTimeMinutes,
      preparationSteps,
    }),
  };
}

async function loadInventory(businessId) {
  const inventoryQuery = query(ingredientsCollection, where("business_id", "==", businessId));
  const snapshot = await getDocs(inventoryQuery);
  return sortByName(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
}

export function subscribeToPreparations(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const preparationsQuery = query(preparationsCollection, where("business_id", "==", businessId));

  return onSnapshot(preparationsQuery, (snapshot) => {
    callback(
      sortByName(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })))
    );
  }, createSubscriptionErrorHandler({
    scope: "preparations:subscribeToPreparations",
    callback,
    emptyValue: [],
  }));
}

export async function createPreparation(preparation) {
  const businessId = String(preparation?.business_id || preparation?.businessId || "").trim();
  const inventory = await loadInventory(businessId);
  const payload = normalizePreparationPayload(preparation, inventory);

  const createdPreparation = await addDoc(preparationsCollection, {
    ...payload,
    cost_reference_updated_at: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await refreshRecipeBooksForPreparations(payload.business_id, [createdPreparation.id]);
  return createdPreparation.id;
}

export async function updatePreparation(preparationId, preparation) {
  if (!preparationId) {
    throw new Error("El id de la preparacion es obligatorio para actualizar.");
  }

  const businessId = String(preparation?.business_id || preparation?.businessId || "").trim();
  const inventory = await loadInventory(businessId);
  const payload = normalizePreparationPayload(preparation, inventory);

  await updateDoc(doc(db, "preparations", preparationId), {
    ...payload,
    cost_reference_updated_at: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await refreshRecipeBooksForPreparations(payload.business_id, [preparationId]);
}

export async function deletePreparation(preparationId) {
  if (!preparationId) {
    throw new Error("El id de la preparacion es obligatorio para eliminar.");
  }

  const preparationRef = doc(db, "preparations", preparationId);
  const preparationSnapshot = await getDoc(preparationRef);
  const businessId = preparationSnapshot.exists()
    ? String(preparationSnapshot.data().business_id || "").trim()
    : "";

  await deleteDoc(preparationRef);

  if (businessId) {
    await refreshRecipeBooksForPreparations(businessId, [preparationId]);
  }
}

export async function refreshPreparationsForIngredients(businessId, ingredientIds = []) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) {
    return;
  }

  const inventory = await loadInventory(normalizedBusinessId);
  const preparationsQuery = query(
    preparationsCollection,
    where("business_id", "==", normalizedBusinessId)
  );
  const snapshot = await getDocs(preparationsQuery);

  const affectedDocs = snapshot.docs.filter((preparationDoc) => {
    if (!ingredientIds.length) {
      return true;
    }

    const preparation = preparationDoc.data();
    return (preparation.ingredients || []).some((ingredient) =>
      ingredientIds.includes(ingredient.ingredient_id)
    );
  });

  await Promise.all(
    affectedDocs.map(async (preparationDoc) => {
      const preparation = preparationDoc.data();
      const payload = normalizePreparationPayload(preparation, inventory);

      await updateDoc(doc(db, "preparations", preparationDoc.id), {
        ...payload,
        cost_reference_updated_at: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    })
  );
}
