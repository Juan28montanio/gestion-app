import {
  addDoc,
  collection,
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
  calculateComponentCost,
  calculateTechnicalSheetCosting,
  calculateUsefulYield,
} from "../features/resources/recipes/technicalSheetCalculations";

const recipeBooksCollection = collection(db, "recipeBooks");
const ingredientsCollection = collection(db, "ingredients");

function sortByLabel(items = [], field = "name") {
  return [...items].sort((left, right) =>
    String(left?.[field] || left?.product_name || "").localeCompare(
      String(right?.[field] || right?.product_name || ""),
      "es",
      { sensitivity: "base" }
    )
  );
}

function normalizeNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeRecipeIngredients(ingredients) {
  if (!Array.isArray(ingredients)) {
    return [];
  }

  return ingredients
    .map((ingredient) => {
      const ingredientId = normalizeText(ingredient?.ingredient_id || ingredient?.ingredientId);
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

function getRecipeName(recipeBook) {
  return normalizeText(recipeBook?.name || recipeBook?.product_name || recipeBook?.productName);
}

function getYieldData(recipeBook) {
  const source = recipeBook?.yield || {};
  const quantity = normalizeNumber(source.quantity ?? recipeBook?.yield_quantity, 1);
  const wastePercent = normalizeNumber(
    source.wastePercent ?? source.waste_percent ?? recipeBook?.waste_pct,
    0
  );

  return {
    quantity,
    unit: normalizeText(source.unit || recipeBook?.yield_unit) || "porcion",
    portions: normalizeNumber(source.portions ?? recipeBook?.portions, 1),
    portionSize: normalizeNumber(source.portionSize ?? source.portion_size, 1),
    portionUnit: normalizeText(source.portionUnit || source.portion_unit) || "porcion",
    wastePercent,
    usefulYield:
      normalizeNumber(source.usefulYield ?? source.useful_yield, 0) ||
      calculateUsefulYield({ quantity, wastePercent }),
    shelfLife: normalizeText(source.shelfLife || source.shelf_life),
    storageConditions: normalizeText(source.storageConditions || source.storage_conditions),
  };
}

function normalizeLegacyComponents(recipeBook, inventory) {
  const legacyIngredients = recipeBook?.direct_ingredients ?? recipeBook?.ingredients;

  if (!Array.isArray(legacyIngredients)) {
    return [];
  }

  return legacyIngredients.map((ingredient, index) => {
    const sourceId = normalizeText(ingredient.ingredient_id || ingredient.ingredientId);
    const supply = inventory.find((item) => item.id === sourceId);
    const quantity = normalizeNumber(ingredient.quantity, 0);
    const unitCost = normalizeNumber(
      ingredient.unitCost ?? ingredient.unit_cost ?? supply?.average_cost ?? supply?.last_purchase_cost,
      0
    );

    return {
      id: normalizeText(ingredient.id) || `legacy-${index}`,
      sourceType: "raw_item",
      sourceId,
      name: normalizeText(ingredient.name || ingredient.ingredient_name || supply?.name),
      quantity,
      unit: normalizeText(ingredient.unit || supply?.unit) || "und",
      unitCost,
      totalCost: normalizeNumber(ingredient.totalCost ?? ingredient.total_cost, quantity * unitCost),
      wastePercent: normalizeNumber(ingredient.wastePercent ?? ingredient.waste_percent, 0),
      notes: normalizeText(ingredient.notes),
    };
  });
}

function normalizeComponents(recipeBook, inventory, existingRecipeBooks) {
  const rawComponents = Array.isArray(recipeBook?.components)
    ? recipeBook.components
    : normalizeLegacyComponents(recipeBook, inventory);

  return rawComponents
    .map((component, index) => {
      const sourceType = normalizeText(component.sourceType || component.source_type) || "raw_item";
      const sourceId = normalizeText(
        component.sourceId || component.source_id || component.ingredient_id
      );
      const source =
        sourceType === "technical_sheet"
          ? existingRecipeBooks.find((item) => item.id === sourceId)
          : inventory.find((item) => item.id === sourceId);
      const quantity = normalizeNumber(component.quantity, 0);
      const sourceYield = sourceType === "technical_sheet" ? getYieldData(source) : null;
      const sourceCosting = source?.costing || {};
      const sourceTotalCost = normalizeNumber(sourceCosting.totalCost ?? source?.real_cost, 0);
      const sourceUsefulYield =
        normalizeNumber(sourceYield?.usefulYield, 0) ||
        normalizeNumber(sourceYield?.portions, 1);
      const fallbackUnitCost =
        sourceType === "technical_sheet"
          ? sourceTotalCost / Math.max(sourceUsefulYield, 0.0001)
          : normalizeNumber(source?.average_cost ?? source?.last_purchase_cost ?? source?.cost_per_unit, 0);
      const unitCost = normalizeNumber(component.unitCost ?? component.unit_cost, fallbackUnitCost);
      const normalized = {
        id: normalizeText(component.id) || `component-${index}`,
        sourceType,
        sourceId,
        name: normalizeText(component.name || source?.name || source?.product_name),
        quantity,
        unit: normalizeText(component.unit || source?.unit || sourceYield?.unit) || "und",
        unitCost,
        totalCost: normalizeNumber(component.totalCost ?? component.total_cost, 0),
        wastePercent: normalizeNumber(component.wastePercent ?? component.waste_percent, 0),
        notes: normalizeText(component.notes),
      };

      return {
        ...normalized,
        totalCost: calculateComponentCost(normalized),
      };
    })
    .filter((component) => component.sourceId && component.quantity > 0);
}

function mergeIngredientMap(map, ingredientId, quantity) {
  if (!ingredientId || !Number.isFinite(quantity) || quantity <= 0) {
    return;
  }

  map.set(ingredientId, (map.get(ingredientId) || 0) + quantity);
}

function buildExpandedIngredients(components, existingRecipeBooks, visited = new Set()) {
  const ingredientMap = new Map();

  components.forEach((component) => {
    if (component.sourceType === "raw_item") {
      mergeIngredientMap(ingredientMap, component.sourceId, component.quantity);
      return;
    }

    const sourceRecipe = existingRecipeBooks.find((recipeBook) => recipeBook.id === component.sourceId);
    if (!sourceRecipe || visited.has(sourceRecipe.id)) {
      return;
    }

    const sourceYield = getYieldData(sourceRecipe);
    const outputQuantity =
      normalizeNumber(sourceYield.usefulYield, 0) || normalizeNumber(sourceYield.portions, 1);
    const multiplier = component.quantity / Math.max(outputQuantity, 0.0001);
    const nextVisited = new Set([...visited, sourceRecipe.id]);
    const sourceIngredients = Array.isArray(sourceRecipe.components)
      ? buildExpandedIngredients(sourceRecipe.components, existingRecipeBooks, nextVisited)
      : normalizeRecipeIngredients(sourceRecipe.ingredients);

    sourceIngredients.forEach((ingredient) => {
      mergeIngredientMap(
        ingredientMap,
        ingredient.ingredient_id,
        Number(ingredient.quantity || 0) * multiplier
      );
    });
  });

  return Array.from(ingredientMap.entries()).map(([ingredient_id, quantity]) => ({
    ingredient_id,
    quantity,
  }));
}

function getProcedure(recipeBook) {
  const procedure = recipeBook?.procedure || {};
  const legacySteps = Array.isArray(recipeBook?.preparation_steps)
    ? recipeBook.preparation_steps
    : [];
  const steps = Array.isArray(procedure.steps)
    ? procedure.steps
    : legacySteps.map((description, index) => ({ order: index + 1, description }));

  return {
    steps: steps
      .map((step, index) => ({
        order: normalizeNumber(step.order, index + 1),
        description: normalizeText(step.description || step),
      }))
      .filter((step) => step.description),
    estimatedTime: normalizeNumber(procedure.estimatedTime ?? procedure.estimated_time ?? recipeBook?.prep_time_minutes, 0),
    temperature: normalizeText(procedure.temperature),
    equipment: normalizeText(procedure.equipment),
    notes: normalizeText(procedure.notes),
  };
}

function getPlating(recipeBook) {
  const plating = recipeBook?.plating || {};

  return {
    instructions: normalizeText(plating.instructions),
    plateware: normalizeText(plating.plateware),
    decoration: normalizeText(plating.decoration),
    visualNotes: normalizeText(plating.visualNotes || plating.visual_notes),
    imageUrl: normalizeText(plating.imageUrl || plating.image_url || recipeBook?.plating_photo_url),
  };
}

function getBi(recipeBook) {
  const bi = recipeBook?.bi || {};

  return {
    popularity: normalizeText(bi.popularity),
    profitability: normalizeText(bi.profitability),
    menuClassification: normalizeText(bi.menuClassification || bi.menu_classification),
  };
}

function getProfitabilityStatus(costing) {
  if (costing.grossMarginPercent >= 65) {
    return "healthy";
  }

  if (costing.grossMarginPercent > 0 && costing.grossMarginPercent < 30) {
    return "critical";
  }

  return "warning";
}

function normalizeRecipeBookPayload(recipeBook, inventory, existingRecipeBooks = []) {
  const businessId = normalizeText(recipeBook?.business_id || recipeBook?.businessId);
  const productId = normalizeText(recipeBook?.product_id || recipeBook?.productId);
  const name = getRecipeName(recipeBook);
  const type = normalizeText(recipeBook?.type) || (productId ? "final_product" : "base");
  const category = normalizeText(recipeBook?.category) || "General";
  const status = normalizeText(recipeBook?.status) || "active";
  const yieldData = getYieldData(recipeBook);
  const components = normalizeComponents(recipeBook, inventory, existingRecipeBooks);
  const expandedIngredients = buildExpandedIngredients(components, existingRecipeBooks);
  const costing = calculateTechnicalSheetCosting({
    components,
    yieldData,
    costing: {
      currentSalePrice: normalizeNumber(
        recipeBook?.costing?.currentSalePrice ??
          recipeBook?.costing?.current_sale_price ??
          recipeBook?.sale_price,
        0
      ),
      targetFoodCost: normalizeNumber(
        recipeBook?.costing?.targetFoodCost ??
          recipeBook?.costing?.target_food_cost ??
          recipeBook?.target_food_cost ??
          (recipeBook?.target_margin_pct !== undefined
            ? 100 - Number(recipeBook.target_margin_pct || 0)
            : undefined),
        30
      ),
    },
  });
  if (!businessId) {
    throw new Error("El business_id de la ficha tecnica es obligatorio.");
  }

  if (!name) {
    throw new Error("El nombre de la ficha tecnica es obligatorio.");
  }

  return {
    business_id: businessId,
    name,
    code: normalizeText(recipeBook?.code),
    type,
    category,
    status,
    description: normalizeText(recipeBook?.description),
    responsible: normalizeText(recipeBook?.responsible),
    product_id: productId,
    product_name: normalizeText(recipeBook?.product_name || recipeBook?.productName) || name,
    recipe_mode: "direct",
    sale_price: costing.currentSalePrice,
    yield: yieldData,
    components,
    procedure: getProcedure(recipeBook),
    plating: getPlating(recipeBook),
    costing,
    bi: getBi(recipeBook),
    direct_ingredients: expandedIngredients,
    ingredients: expandedIngredients,
    waste_pct: yieldData.wastePercent,
    target_margin_pct: 100 - costing.targetFoodCost * 100,
    prep_time_minutes: getProcedure(recipeBook).estimatedTime,
    plating_photo_url: getPlating(recipeBook).imageUrl,
    preparation_steps: getProcedure(recipeBook).steps.map((step) => step.description),
    base_cost: costing.totalCost,
    real_cost: costing.totalCost,
    cost_per_portion: costing.costPerPortion,
    current_margin_pct: costing.grossMarginPercent,
    suggested_price: costing.suggestedPrice,
    food_cost_percent: costing.foodCostPercent,
    gross_margin: costing.grossMargin,
    profitability_status: getProfitabilityStatus(costing),
  };
}

export function subscribeToRecipeBooks(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const recipeBooksQuery = query(
    recipeBooksCollection,
    where("business_id", "==", businessId)
  );

  return onSnapshot(recipeBooksQuery, (snapshot) => {
    callback(
      sortByLabel(
        snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })),
        "name"
      )
    );
  }, createSubscriptionErrorHandler({
    scope: "recipeBooks:subscribeToRecipeBooks",
    callback,
    emptyValue: [],
  }));
}

async function loadInventory(businessId) {
  const inventoryQuery = query(ingredientsCollection, where("business_id", "==", businessId));
  const snapshot = await getDocs(inventoryQuery);
  return sortByLabel(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
}

async function loadRecipeBooks(businessId) {
  const recipeBooksQuery = query(recipeBooksCollection, where("business_id", "==", businessId));
  const snapshot = await getDocs(recipeBooksQuery);
  return sortByLabel(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
}

async function loadReferences(businessId) {
  return Promise.all([
    loadInventory(businessId),
    loadRecipeBooks(businessId),
  ]);
}

export async function createRecipeBook(recipeBook) {
  const businessId = normalizeText(recipeBook?.business_id || recipeBook?.businessId);
  const [inventory, existingRecipeBooks] = await loadReferences(businessId);
  const payload = normalizeRecipeBookPayload(recipeBook, inventory, existingRecipeBooks);

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

  const businessId = normalizeText(recipeBook?.business_id || recipeBook?.businessId);
  const [inventory, existingRecipeBooks] = await loadReferences(businessId);
  const payload = normalizeRecipeBookPayload(
    recipeBook,
    inventory,
    existingRecipeBooks.filter((item) => item.id !== recipeBookId)
  );

  await updateDoc(doc(db, "recipeBooks", recipeBookId), {
    ...payload,
    cost_reference_updated_at: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deactivateRecipeBook(recipeBookId) {
  if (!recipeBookId) {
    throw new Error("El id de la ficha tecnica es obligatorio para desactivar.");
  }

  await updateDoc(doc(db, "recipeBooks", recipeBookId), {
    status: "inactive",
    updatedAt: serverTimestamp(),
  });
}

export async function refreshRecipeBooksForIngredients(businessId, ingredientIds = []) {
  const normalizedBusinessId = normalizeText(businessId);
  if (!normalizedBusinessId) {
    return;
  }

  const [inventory, recipeBooks] = await loadReferences(normalizedBusinessId);
  const affectedDocs = recipeBooks.filter((recipeBook) => {
    if (!ingredientIds.length) {
      return true;
    }

    return (recipeBook.ingredients || []).some((ingredient) =>
      ingredientIds.includes(ingredient.ingredient_id)
    );
  });

  await Promise.all(
    affectedDocs.map(async (recipeBook) => {
      const payload = normalizeRecipeBookPayload(recipeBook, inventory, recipeBooks);

      await updateDoc(doc(db, "recipeBooks", recipeBook.id), {
        ...payload,
        cost_reference_updated_at: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    })
  );
}
