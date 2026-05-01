export function createEmptyRecipeForm() {
  return {
    productId: "",
    wastePct: "0",
    targetMarginPct: "30",
    prepTimeMinutes: "",
    platingPhotoUrl: "",
    preparationSteps: "",
    ingredients: [],
  };
}

export const EMPTY_RECIPE_FORM = createEmptyRecipeForm();

export const MODAL_TABS = [
  { id: "costing", label: "Costeo" },
  { id: "operations", label: "Operacion" },
];

export function buildRecipeForm(recipeBook) {
  if (!recipeBook) {
    return createEmptyRecipeForm();
  }

  return {
    productId: recipeBook.product_id || "",
    wastePct: String(recipeBook.waste_pct ?? 0),
    targetMarginPct: String(recipeBook.target_margin_pct ?? 30),
    prepTimeMinutes: String(recipeBook.prep_time_minutes ?? ""),
    platingPhotoUrl: recipeBook.plating_photo_url || "",
    preparationSteps: Array.isArray(recipeBook.preparation_steps)
      ? recipeBook.preparation_steps.join("\n")
      : "",
    ingredients: Array.isArray(recipeBook.ingredients)
      ? recipeBook.ingredients.map((ingredient) => ({
          ingredientId: ingredient.ingredient_id || "",
          quantity: String(ingredient.quantity ?? ""),
        }))
      : [],
  };
}

export function buildSupplyReferenceMap(supplies = []) {
  return supplies.reduce((accumulator, supply) => {
    accumulator[supply.id] = supply;
    return accumulator;
  }, {});
}

export function getRecipeReadiness(form) {
  const hasProduct = Boolean(form.productId);
  const hasIngredients = Array.isArray(form.ingredients) && form.ingredients.length > 0;
  const hasOperations =
    Number(form.prepTimeMinutes || 0) > 0 || String(form.preparationSteps || "").trim().length > 0;

  if (hasProduct && hasIngredients && hasOperations) {
    return {
      title: "Ficha lista para operar",
      body: "Ya conecta producto, receta y una base operativa util para cocina.",
    };
  }

  if (hasProduct && hasIngredients) {
    return {
      title: "Falta documentar la operacion",
      body: "La ficha ya costea, pero todavia necesita tiempo o pasos para servir como guia.",
    };
  }

  if (hasProduct) {
    return {
      title: "Falta cargar la receta",
      body: "Seleccionaste el producto, pero aun no definiste sus insumos reales.",
    };
  }

  return {
    title: "Empieza conectando el producto",
    body: "Primero elige el plato y luego carga la receta con cantidades reales.",
  };
}

export function buildRecipeSummary(recipeBooks = []) {
  const healthy = recipeBooks.filter(
    (recipeBook) => recipeBook.profitability_status === "healthy"
  ).length;
  const warning = recipeBooks.filter(
    (recipeBook) => recipeBook.profitability_status === "warning"
  ).length;
  const critical = recipeBooks.filter(
    (recipeBook) => recipeBook.profitability_status === "critical"
  ).length;
  const incomplete = recipeBooks.filter(
    (recipeBook) => !Array.isArray(recipeBook.ingredients) || recipeBook.ingredients.length === 0
  ).length;

  return { healthy, warning, critical, incomplete };
}

export function buildRecipeOperationalSummary(recipeBooks = [], supplies = []) {
  const criticalSupplyIds = new Set(
    supplies
      .filter((supply) => {
        const stock = Number(supply.stock || 0);
        const min = Number(supply.stock_min_alert || 0);
        return stock <= 0 || (min > 0 && stock <= min);
      })
      .map((supply) => supply.id)
  );

  const atRisk = recipeBooks.filter((recipeBook) =>
    (recipeBook.ingredients || []).some((ingredient) =>
      criticalSupplyIds.has(ingredient.ingredient_id)
    )
  ).length;
  const undocumentedOps = recipeBooks.filter(
    (recipeBook) =>
      !Array.isArray(recipeBook.preparation_steps) ||
      recipeBook.preparation_steps.length === 0 ||
      Number(recipeBook.prep_time_minutes || 0) <= 0
  ).length;
  const averagePrepMinutes = recipeBooks.length
    ? recipeBooks.reduce(
        (sum, recipeBook) => sum + Number(recipeBook.prep_time_minutes || 0),
        0
      ) / recipeBooks.length
    : 0;

  return {
    atRisk,
    undocumentedOps,
    averagePrepMinutes,
  };
}
