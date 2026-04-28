import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const recipeBooksCollection = collection(db, "recipeBooks");
const ingredientsCollection = collection(db, "ingredients");
const preparationsCollection = collection(db, "preparations");

function normalizeRecipeIngredients(ingredients) {
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

function normalizePreparationItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const preparationId = String(item?.preparation_id || item?.preparationId || "").trim();
      const quantity = Number(item?.quantity);

      if (!preparationId || !Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      return {
        preparation_id: preparationId,
        preparation_name: String(item?.preparation_name || item?.preparationName || "").trim(),
        output_unit: String(item?.output_unit || item?.outputUnit || "").trim(),
        quantity,
      };
    })
    .filter(Boolean);
}

function buildIngredientsFromPreparations(preparationItems, preparations) {
  const ingredientMap = new Map();

  preparationItems.forEach((item) => {
    const preparation = preparations.find((candidate) => candidate.id === item.preparation_id);
    if (!preparation) {
      return;
    }

    const yieldQuantity = Number(preparation.yield_quantity || 1);
    const wastePct = Number(preparation.waste_pct || 0);
    const wasteFactor =
      Number.isFinite(wastePct) && wastePct >= 0 && wastePct < 100
        ? 1 / Math.max(1 - wastePct / 100, 0.01)
        : 1;
    const multiplier = (Number(item.quantity || 0) / Math.max(yieldQuantity, 0.0001)) * wasteFactor;

    (preparation.ingredients || []).forEach((ingredient) => {
      const ingredientId = String(ingredient?.ingredient_id || "").trim();
      const quantity = Number(ingredient?.quantity || 0);

      if (!ingredientId || !Number.isFinite(quantity) || quantity <= 0) {
        return;
      }

      ingredientMap.set(
        ingredientId,
        (ingredientMap.get(ingredientId) || 0) + quantity * multiplier
      );
    });
  });

  return Array.from(ingredientMap.entries()).map(([ingredient_id, quantity]) => ({
    ingredient_id,
    quantity,
  }));
}

function computeRecipeMetrics({ ingredients, inventory, wastePct, salePrice, targetMarginPct }) {
  const baseCost = ingredients.reduce((sum, ingredient) => {
    const inventoryItem = inventory.find((item) => item.id === ingredient.ingredient_id);
    return sum + (Number(inventoryItem?.average_cost || 0) * Number(ingredient.quantity || 0));
  }, 0);

  const normalizedWastePct =
    Number.isFinite(wastePct) && wastePct >= 0 && wastePct < 100 ? wastePct : 0;
  const realCost =
    normalizedWastePct > 0 ? baseCost / (1 - normalizedWastePct / 100) : baseCost;
  const normalizedSalePrice = Number.isFinite(salePrice) && salePrice > 0 ? salePrice : 0;
  const normalizedTargetMargin =
    Number.isFinite(targetMarginPct) && targetMarginPct >= 0 ? targetMarginPct : 30;
  const currentMarginPct =
    normalizedSalePrice > 0 ? ((normalizedSalePrice - realCost) / normalizedSalePrice) * 100 : 0;
  const suggestedPrice =
    normalizedTargetMargin >= 100
      ? realCost
      : realCost / Math.max(1 - normalizedTargetMargin / 100, 0.01);

  let profitabilityStatus = "warning";

  if (currentMarginPct >= normalizedTargetMargin) {
    profitabilityStatus = "healthy";
  } else if (currentMarginPct < Math.max(normalizedTargetMargin - 10, 0)) {
    profitabilityStatus = "critical";
  }

  return {
    baseCost,
    realCost,
    currentMarginPct,
    suggestedPrice,
    profitabilityStatus,
  };
}

export function calculateRecipeMetricsPreview({
  ingredients = [],
  inventory = [],
  wastePct = 0,
  salePrice = 0,
  targetMarginPct = 30,
}) {
  return computeRecipeMetrics({
    ingredients: normalizeRecipeIngredients(ingredients),
    inventory,
    wastePct: Number(wastePct),
    salePrice: Number(salePrice),
    targetMarginPct: Number(targetMarginPct),
  });
}

function normalizeRecipeBookPayload(recipeBook, inventory, preparations = []) {
  const businessId = String(recipeBook?.business_id || recipeBook?.businessId || "").trim();
  const productId = String(recipeBook?.product_id || recipeBook?.productId || "").trim();
  const productName = String(recipeBook?.product_name || recipeBook?.productName || "").trim();
  const recipeMode = String(recipeBook?.recipe_mode || recipeBook?.recipeMode || "direct").trim();
  const salePrice = Number(recipeBook?.sale_price ?? recipeBook?.salePrice ?? 0);
  const wastePct = Number(recipeBook?.waste_pct ?? recipeBook?.wastePct ?? 0);
  const targetMarginPct = Number(
    recipeBook?.target_margin_pct ?? recipeBook?.targetMarginPct ?? 30
  );
  const prepTimeMinutes = Number(
    recipeBook?.prep_time_minutes ?? recipeBook?.prepTimeMinutes ?? 0
  );
  const platingPhotoUrl = String(
    recipeBook?.plating_photo_url || recipeBook?.platingPhotoUrl || ""
  ).trim();
  const preparationSteps = Array.isArray(recipeBook?.preparation_steps)
    ? recipeBook.preparation_steps
    : String(recipeBook?.preparationSteps || "")
        .split("\n")
        .map((step) => step.trim())
        .filter(Boolean);
  const directIngredients = normalizeRecipeIngredients(
    recipeBook?.direct_ingredients ?? recipeBook?.directIngredients ?? recipeBook?.ingredients
  );
  const normalizedPreparationItems = normalizePreparationItems(
    recipeBook?.preparation_items ?? recipeBook?.preparationItems
  );
  const normalizedIngredients =
    recipeMode === "composed"
      ? buildIngredientsFromPreparations(normalizedPreparationItems, preparations)
      : directIngredients;

  if (!businessId) {
    throw new Error("El business_id de la ficha tecnica es obligatorio.");
  }

  if (!productId) {
    throw new Error("Debes vincular la ficha tecnica a un producto.");
  }

  if (!productName) {
    throw new Error("El nombre del producto vinculado es obligatorio.");
  }

  const metrics = computeRecipeMetrics({
    ingredients: normalizedIngredients,
    inventory,
    wastePct,
    salePrice,
    targetMarginPct,
  });

  return {
    business_id: businessId,
    product_id: productId,
    product_name: productName,
    recipe_mode: recipeMode === "composed" ? "composed" : "direct",
    sale_price: Number.isFinite(salePrice) ? salePrice : 0,
    waste_pct: Number.isFinite(wastePct) ? wastePct : 0,
    target_margin_pct: Number.isFinite(targetMarginPct) ? targetMarginPct : 30,
    prep_time_minutes: Number.isFinite(prepTimeMinutes) ? prepTimeMinutes : 0,
    plating_photo_url: platingPhotoUrl,
    preparation_steps: preparationSteps,
    direct_ingredients: recipeMode === "composed" ? [] : directIngredients,
    preparation_items: recipeMode === "composed" ? normalizedPreparationItems : [],
    ingredients: normalizedIngredients,
    base_cost: metrics.baseCost,
    real_cost: metrics.realCost,
    current_margin_pct: metrics.currentMarginPct,
    suggested_price: metrics.suggestedPrice,
    profitability_status: metrics.profitabilityStatus,
  };
}

export function subscribeToRecipeBooks(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const recipeBooksQuery = query(
    recipeBooksCollection,
    where("business_id", "==", businessId),
    orderBy("product_name", "asc")
  );

  return onSnapshot(recipeBooksQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  });
}

async function loadInventory(businessId) {
  const inventoryQuery = query(
    ingredientsCollection,
    where("business_id", "==", businessId),
    orderBy("name", "asc")
  );
  const snapshot = await getDocs(inventoryQuery);
  return snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
}

async function loadPreparations(businessId) {
  const preparationsQuery = query(
    preparationsCollection,
    where("business_id", "==", businessId),
    orderBy("name", "asc")
  );
  const snapshot = await getDocs(preparationsQuery);
  return snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
}

export async function createRecipeBook(recipeBook) {
  const businessId = String(recipeBook?.business_id || recipeBook?.businessId || "").trim();
  const [inventory, preparations] = await Promise.all([
    loadInventory(businessId),
    loadPreparations(businessId),
  ]);
  const payload = normalizeRecipeBookPayload(recipeBook, inventory, preparations);

  const createdRecipeBook = await addDoc(recipeBooksCollection, {
    ...payload,
    cost_reference_updated_at: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return createdRecipeBook.id;
}

export async function updateRecipeBook(recipeBookId, recipeBook) {
  if (!recipeBookId) {
    throw new Error("El id de la ficha tecnica es obligatorio para actualizar.");
  }

  const businessId = String(recipeBook?.business_id || recipeBook?.businessId || "").trim();
  const [inventory, preparations] = await Promise.all([
    loadInventory(businessId),
    loadPreparations(businessId),
  ]);
  const payload = normalizeRecipeBookPayload(recipeBook, inventory, preparations);

  await updateDoc(doc(db, "recipeBooks", recipeBookId), {
    ...payload,
    cost_reference_updated_at: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRecipeBook(recipeBookId) {
  if (!recipeBookId) {
    throw new Error("El id de la ficha tecnica es obligatorio para eliminar.");
  }

  await deleteDoc(doc(db, "recipeBooks", recipeBookId));
}

export async function refreshRecipeBooksForIngredients(businessId, ingredientIds = []) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) {
    return;
  }

  const [inventory, preparations] = await Promise.all([
    loadInventory(normalizedBusinessId),
    loadPreparations(normalizedBusinessId),
  ]);
  const recipeBooksQuery = query(recipeBooksCollection, where("business_id", "==", normalizedBusinessId));
  const snapshot = await getDocs(recipeBooksQuery);

  const affectedDocs = snapshot.docs.filter((recipeBookDoc) => {
    if (!ingredientIds.length) {
      return true;
    }

    const recipeBook = recipeBookDoc.data();
    return (recipeBook.ingredients || []).some((ingredient) =>
      ingredientIds.includes(ingredient.ingredient_id)
    );
  });

  await Promise.all(
    affectedDocs.map(async (recipeBookDoc) => {
      const recipeBook = recipeBookDoc.data();
      const payload = normalizeRecipeBookPayload(recipeBook, inventory, preparations);

      await updateDoc(doc(db, "recipeBooks", recipeBookDoc.id), {
        ...payload,
        cost_reference_updated_at: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    })
  );
}

export async function refreshRecipeBooksForPreparations(businessId, preparationIds = []) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) {
    return;
  }

  const [inventory, preparations] = await Promise.all([
    loadInventory(normalizedBusinessId),
    loadPreparations(normalizedBusinessId),
  ]);
  const recipeBooksQuery = query(recipeBooksCollection, where("business_id", "==", normalizedBusinessId));
  const snapshot = await getDocs(recipeBooksQuery);

  const affectedDocs = snapshot.docs.filter((recipeBookDoc) => {
    const recipeBook = recipeBookDoc.data();
    if (String(recipeBook.recipe_mode || "direct") !== "composed") {
      return false;
    }

    if (!preparationIds.length) {
      return true;
    }

    return (recipeBook.preparation_items || []).some((item) =>
      preparationIds.includes(String(item.preparation_id || "").trim())
    );
  });

  await Promise.all(
    affectedDocs.map(async (recipeBookDoc) => {
      const recipeBook = recipeBookDoc.data();
      const payload = normalizeRecipeBookPayload(recipeBook, inventory, preparations);

      await updateDoc(doc(db, "recipeBooks", recipeBookDoc.id), {
        ...payload,
        cost_reference_updated_at: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    })
  );
}
