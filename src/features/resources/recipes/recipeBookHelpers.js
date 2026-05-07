import {
  calculateTechnicalSheetCosting,
  calculateUsefulYield,
} from "./technicalSheetCalculations";
import {
  getSupplyBaseUnit,
  getSupplyCostPerBaseUnit,
} from "../inventory/supplyCalculations";

export const TECHNICAL_SHEET_TYPES = [
  { value: "base", label: "Insumo base / produccion base" },
  { value: "final_product", label: "Producto final" },
  { value: "production", label: "Produccion / mise en place" },
  { value: "plating", label: "Montaje / emplatado" },
  { value: "costing", label: "Costeo y rentabilidad" },
];

export const TECHNICAL_SHEET_STATUSES = [
  { value: "draft", label: "Borrador" },
  { value: "active", label: "Activa" },
  { value: "inactive", label: "Inactiva" },
];

export const YIELD_UNITS = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "L", label: "L" },
  { value: "unidad", label: "unidad" },
  { value: "porcion", label: "porcion" },
];

export const MENU_CLASSIFICATIONS = [
  { value: "", label: "Sin clasificar" },
  { value: "star", label: "Estrella" },
  { value: "workhorse", label: "Caballo de batalla" },
  { value: "puzzle", label: "Rompecabezas" },
  { value: "dog", label: "Perro" },
];

export const MODAL_TABS = [
  { id: "general", label: "Datos generales" },
  { id: "yield", label: "Rendimiento" },
  { id: "components", label: "Componentes" },
  { id: "procedure", label: "Procedimiento" },
  { id: "plating", label: "Montaje" },
  { id: "costing", label: "Costeo" },
];

export const TYPE_LABELS = TECHNICAL_SHEET_TYPES.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

export const STATUS_LABELS = TECHNICAL_SHEET_STATUSES.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

export function createEmptyComponent() {
  return {
    id: crypto.randomUUID?.() || `component-${Date.now()}`,
    sourceType: "raw_item",
    sourceId: "",
    name: "",
    quantity: "",
    unit: "g",
    unitCost: "",
    totalCost: 0,
    wastePercent: "",
    notes: "",
  };
}

export function createEmptyRecipeForm() {
  return {
    name: "",
    code: "",
    type: "final_product",
    category: "",
    status: "draft",
    description: "",
    responsible: "",
    productId: "",
    yieldQuantity: "1",
    yieldUnit: "porcion",
    portions: "1",
    portionSize: "1",
    portionUnit: "porcion",
    wastePercent: "0",
    usefulYield: "1",
    shelfLife: "",
    storageConditions: "",
    components: [],
    procedureSteps: "",
    estimatedTime: "",
    temperature: "",
    equipment: "",
    procedureNotes: "",
    platingInstructions: "",
    plateware: "",
    decoration: "",
    visualNotes: "",
    imageUrl: "",
    currentSalePrice: "",
    targetFoodCost: "30",
    popularity: "",
    profitability: "",
    menuClassification: "",
  };
}

export const EMPTY_RECIPE_FORM = createEmptyRecipeForm();

function stringifyFormNumber(value, fallback = "") {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? String(numericValue) : fallback;
}

function getLegacyYield(recipeBook) {
  return recipeBook?.yield || {
    quantity: recipeBook?.yield_quantity ?? recipeBook?.portions ?? 1,
    unit: recipeBook?.yield_unit || "porcion",
    portions: recipeBook?.portions ?? 1,
    portionSize: recipeBook?.portion_size ?? 1,
    portionUnit: recipeBook?.portion_unit || "porcion",
    wastePercent: recipeBook?.waste_pct ?? recipeBook?.wastePercent ?? 0,
    usefulYield: recipeBook?.useful_yield,
    shelfLife: recipeBook?.shelf_life || "",
    storageConditions: recipeBook?.storage_conditions || "",
  };
}

function getLegacyProcedure(recipeBook) {
  return recipeBook?.procedure || {
    steps: Array.isArray(recipeBook?.preparation_steps)
      ? recipeBook.preparation_steps.map((step, index) => ({
          order: index + 1,
          description: step,
        }))
      : [],
    estimatedTime: recipeBook?.prep_time_minutes ?? 0,
    temperature: "",
    equipment: "",
    notes: "",
  };
}

function getLegacyPlating(recipeBook) {
  return recipeBook?.plating || {
    instructions: "",
    plateware: "",
    decoration: "",
    visualNotes: "",
    imageUrl: recipeBook?.plating_photo_url || "",
  };
}

export function getTechnicalSheetName(recipeBook) {
  return recipeBook?.name || recipeBook?.product_name || "Ficha sin nombre";
}

export function getTechnicalSheetType(recipeBook) {
  return recipeBook?.type || (recipeBook?.product_id ? "final_product" : "base");
}

export function getTechnicalSheetStatus(recipeBook) {
  return recipeBook?.status || "active";
}

export function getTechnicalSheetCosting(recipeBook) {
  const costing = recipeBook?.costing || {};
  const legacyTargetFoodCost =
    recipeBook?.target_food_cost ??
    (recipeBook?.target_margin_pct !== undefined
      ? 100 - Number(recipeBook.target_margin_pct || 0)
      : 30);

  return {
    totalCost: Number(costing.totalCost ?? recipeBook?.total_cost ?? recipeBook?.real_cost ?? 0),
    costPerPortion: Number(
      costing.costPerPortion ?? recipeBook?.cost_per_portion ?? recipeBook?.real_cost ?? 0
    ),
    currentSalePrice: Number(
      costing.currentSalePrice ?? recipeBook?.sale_price ?? recipeBook?.current_sale_price ?? 0
    ),
    targetFoodCost: Number(
      costing.targetFoodCost ?? costing.target_food_cost ?? legacyTargetFoodCost
    ),
    suggestedPrice: Number(costing.suggestedPrice ?? recipeBook?.suggested_price ?? 0),
    foodCostPercent: Number(costing.foodCostPercent ?? recipeBook?.food_cost_percent ?? 0),
    grossMargin: Number(costing.grossMargin ?? recipeBook?.gross_margin ?? 0),
    grossMarginPercent: Number(
      costing.grossMarginPercent ?? recipeBook?.current_margin_pct ?? 0
    ),
  };
}

export function buildRecipeForm(recipeBook) {
  if (!recipeBook) {
    return createEmptyRecipeForm();
  }

  const yieldData = getLegacyYield(recipeBook);
  const procedure = getLegacyProcedure(recipeBook);
  const plating = getLegacyPlating(recipeBook);
  const costing = getTechnicalSheetCosting(recipeBook);
  const components = Array.isArray(recipeBook.components)
    ? recipeBook.components
    : Array.isArray(recipeBook.direct_ingredients ?? recipeBook.ingredients)
      ? (recipeBook.direct_ingredients ?? recipeBook.ingredients).map((ingredient, index) => ({
          id: ingredient.id || `legacy-${index}`,
          sourceType: "raw_item",
          sourceId: ingredient.ingredient_id || "",
          name: ingredient.ingredient_name || "",
          quantity: ingredient.quantity ?? "",
          unit: ingredient.unit || "",
          unitCost: ingredient.unit_cost ?? ingredient.unitCost ?? "",
          totalCost: ingredient.total_cost ?? ingredient.totalCost ?? 0,
          wastePercent: ingredient.waste_percent ?? ingredient.wastePercent ?? "",
          notes: ingredient.notes || "",
        }))
      : [];

  return {
    name: getTechnicalSheetName(recipeBook),
    code: recipeBook.code || "",
    type: getTechnicalSheetType(recipeBook),
    category: recipeBook.category || "",
    status: getTechnicalSheetStatus(recipeBook),
    description: recipeBook.description || "",
    responsible: recipeBook.responsible || "",
    productId: recipeBook.product_id || "",
    yieldQuantity: stringifyFormNumber(yieldData.quantity, "1"),
    yieldUnit: yieldData.unit || "porcion",
    portions: stringifyFormNumber(yieldData.portions, "1"),
    portionSize: stringifyFormNumber(yieldData.portionSize ?? yieldData.portion_size, "1"),
    portionUnit: yieldData.portionUnit || yieldData.portion_unit || "porcion",
    wastePercent: stringifyFormNumber(yieldData.wastePercent ?? yieldData.waste_percent, "0"),
    usefulYield: stringifyFormNumber(yieldData.usefulYield ?? yieldData.useful_yield, ""),
    shelfLife: yieldData.shelfLife || yieldData.shelf_life || "",
    storageConditions: yieldData.storageConditions || yieldData.storage_conditions || "",
    components: components.map((component, index) => ({
      id: component.id || `component-${index}`,
      sourceType: component.sourceType || component.source_type || "raw_item",
      sourceId: component.sourceId || component.source_id || component.ingredient_id || "",
      name: component.name || component.ingredient_name || "",
      quantity: stringifyFormNumber(component.quantity, ""),
      unit: component.unit || "g",
      unitCost: stringifyFormNumber(component.unitCost ?? component.unit_cost, ""),
      totalCost: Number(component.totalCost ?? component.total_cost ?? 0),
      wastePercent: stringifyFormNumber(component.wastePercent ?? component.waste_percent, ""),
      notes: component.notes || "",
    })),
    procedureSteps: Array.isArray(procedure.steps)
      ? procedure.steps
          .sort((left, right) => Number(left.order || 0) - Number(right.order || 0))
          .map((step) => step.description)
          .join("\n")
      : "",
    estimatedTime: stringifyFormNumber(procedure.estimatedTime ?? procedure.estimated_time, ""),
    temperature: procedure.temperature || "",
    equipment: Array.isArray(procedure.equipment)
      ? procedure.equipment.join(", ")
      : procedure.equipment || "",
    procedureNotes: procedure.notes || "",
    platingInstructions: plating.instructions || "",
    plateware: plating.plateware || "",
    decoration: plating.decoration || "",
    visualNotes: plating.visualNotes || plating.visual_notes || "",
    imageUrl: plating.imageUrl || plating.image_url || "",
    currentSalePrice: stringifyFormNumber(costing.currentSalePrice, ""),
    targetFoodCost: stringifyFormNumber(costing.targetFoodCost > 1 ? costing.targetFoodCost : costing.targetFoodCost * 100, "30"),
    popularity: recipeBook.bi?.popularity || "",
    profitability: recipeBook.bi?.profitability || "",
    menuClassification: recipeBook.bi?.menuClassification || recipeBook.bi?.menu_classification || "",
  };
}

export function buildSupplyReferenceMap(supplies = []) {
  return supplies.reduce((accumulator, supply) => {
    accumulator[supply.id] = supply;
    return accumulator;
  }, {});
}

export function buildRecipeReferenceMap(recipeBooks = []) {
  return recipeBooks.reduce((accumulator, recipeBook) => {
    accumulator[recipeBook.id] = recipeBook;
    return accumulator;
  }, {});
}

export function buildComponentSourceOptions({ supplies = [], recipeBooks = [], editingId = "" }) {
  return [
    ...supplies.map((supply) => ({
      id: supply.id,
      sourceType: "raw_item",
      label: `${supply.name} (${getSupplyBaseUnit(supply)})`,
      name: supply.name || "",
      unit: getSupplyBaseUnit(supply),
      unitCost: getSupplyCostPerBaseUnit(supply),
    })),
    ...recipeBooks
      .filter((recipeBook) => recipeBook.id !== editingId && getTechnicalSheetStatus(recipeBook) !== "inactive")
      .map((recipeBook) => {
        const yieldData = getLegacyYield(recipeBook);
        const costing = getTechnicalSheetCosting(recipeBook);
        const usefulYield = Number(yieldData.usefulYield ?? yieldData.useful_yield) || calculateUsefulYield(yieldData) || Number(yieldData.portions || 1);
        return {
          id: recipeBook.id,
          sourceType: "technical_sheet",
          label: `${getTechnicalSheetName(recipeBook)} (${TYPE_LABELS[getTechnicalSheetType(recipeBook)] || "Ficha"})`,
          name: getTechnicalSheetName(recipeBook),
          unit: yieldData.unit || yieldData.portionUnit || "porcion",
          unitCost: usefulYield > 0 ? costing.totalCost / usefulYield : costing.costPerPortion,
        };
      }),
  ];
}

export function buildRecipeSummary(recipeBooks = []) {
  return recipeBooks.reduce(
    (summary, recipeBook) => {
      summary.total += 1;
      summary[getTechnicalSheetStatus(recipeBook)] += 1;
      if (getTechnicalSheetCosting(recipeBook).grossMarginPercent < 30) {
        summary.lowMargin += 1;
      }
      return summary;
    },
    { total: 0, active: 0, draft: 0, inactive: 0, lowMargin: 0 }
  );
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
  const undocumentedOps = recipeBooks.filter((recipeBook) => {
    const procedure = getLegacyProcedure(recipeBook);
    return !Array.isArray(procedure.steps) || procedure.steps.length === 0;
  }).length;
  const averageMargin = recipeBooks.length
    ? recipeBooks.reduce(
        (sum, recipeBook) => sum + getTechnicalSheetCosting(recipeBook).grossMarginPercent,
        0
      ) / recipeBooks.length
    : 0;

  return {
    atRisk,
    undocumentedOps,
    averageMargin,
  };
}

export function buildPayloadFromForm({ form, businessId, products = [] }) {
  const selectedProduct = products.find((product) => product.id === form.productId);
  const yieldData = {
    quantity: Number(form.yieldQuantity || 0),
    unit: form.yieldUnit,
    portions: Number(form.portions || 0),
    portionSize: Number(form.portionSize || 0),
    portionUnit: form.portionUnit,
    wastePercent: Number(form.wastePercent || 0),
    usefulYield:
      Number(form.usefulYield || 0) ||
      calculateUsefulYield({
        quantity: Number(form.yieldQuantity || 0),
        wastePercent: Number(form.wastePercent || 0),
      }),
    shelfLife: String(form.shelfLife || "").trim(),
    storageConditions: String(form.storageConditions || "").trim(),
  };
  const components = form.components.map((component) => ({
    id: component.id,
    sourceType: component.sourceType,
    sourceId: component.sourceId,
    name: String(component.name || "").trim(),
    quantity: Number(component.quantity || 0),
    unit: component.unit,
    unitCost: Number(component.unitCost || 0),
    totalCost: Number(component.totalCost || 0),
    wastePercent: component.wastePercent === "" ? 0 : Number(component.wastePercent || 0),
    notes: String(component.notes || "").trim(),
  }));
  const costing = calculateTechnicalSheetCosting({
    components,
    yieldData,
    costing: {
      currentSalePrice: Number(form.currentSalePrice || selectedProduct?.price || 0),
      targetFoodCost: Number(form.targetFoodCost || 30),
    },
  });

  return {
    business_id: businessId,
    name: String(form.name || "").trim(),
    code: String(form.code || "").trim(),
    type: form.type,
    category: String(form.category || "").trim(),
    status: form.status,
    description: String(form.description || "").trim(),
    responsible: String(form.responsible || "").trim(),
    product_id: form.productId,
    product_name: selectedProduct?.name || String(form.name || "").trim(),
    sale_price: costing.currentSalePrice,
    yield: yieldData,
    components,
    procedure: {
      steps: String(form.procedureSteps || "")
        .split("\n")
        .map((description) => description.trim())
        .filter(Boolean)
        .map((description, index) => ({ order: index + 1, description })),
      estimatedTime: Number(form.estimatedTime || 0),
      temperature: String(form.temperature || "").trim(),
      equipment: String(form.equipment || "").trim(),
      notes: String(form.procedureNotes || "").trim(),
    },
    plating: {
      instructions: String(form.platingInstructions || "").trim(),
      plateware: String(form.plateware || "").trim(),
      decoration: String(form.decoration || "").trim(),
      visualNotes: String(form.visualNotes || "").trim(),
      imageUrl: String(form.imageUrl || "").trim(),
    },
    costing,
    bi: {
      popularity: form.popularity || "",
      profitability: form.profitability || "",
      menuClassification: form.menuClassification || "",
    },
  };
}

export function validateRecipeForm(form) {
  if (!String(form.name || "").trim()) {
    return "El nombre de la ficha tecnica es obligatorio.";
  }

  if (!form.type) {
    return "Selecciona el tipo de ficha tecnica.";
  }

  if (!String(form.category || "").trim()) {
    return "La categoria es obligatoria.";
  }

  if (!Number.isFinite(Number(form.portions)) || Number(form.portions) <= 0) {
    return "El numero de porciones debe ser mayor a cero.";
  }

  if (Number(form.currentSalePrice || 0) < 0) {
    return "El precio de venta debe ser mayor o igual a cero.";
  }

  const targetFoodCost = Number(form.targetFoodCost);
  if (!Number.isFinite(targetFoodCost) || targetFoodCost <= 0 || targetFoodCost > 100) {
    return "El food cost objetivo debe estar entre 0 y 100.";
  }

  const invalidComponent = form.components.some(
    (component) =>
      !component.name ||
      !component.sourceId ||
      !Number.isFinite(Number(component.quantity)) ||
      Number(component.quantity) <= 0
  );

  if (invalidComponent) {
    return "Cada componente debe tener origen, nombre y cantidad mayor a cero.";
  }

  return "";
}
