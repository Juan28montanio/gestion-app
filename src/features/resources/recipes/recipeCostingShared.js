import { formatCOP } from "../../../utils/formatters";

export const STATUS_META = {
  healthy: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-100 text-amber-700 ring-amber-200",
  critical: "bg-rose-100 text-rose-700 ring-rose-200",
};

export const STATUS_LABELS = {
  healthy: "Rentable",
  warning: "Ajustar precio",
  critical: "Margen critico",
};

export function getProfitabilityClasses(status) {
  return STATUS_META[status] || STATUS_META.warning;
}

export function getProfitabilityLabel(status) {
  return STATUS_LABELS[status] || STATUS_LABELS.warning;
}

export function getRecipeAction(recipeBook) {
  const profitabilityStatus = recipeBook?.profitability_status || "warning";

  if (profitabilityStatus === "healthy") {
    return "Mantener el precio actual y vigilar cambios de insumo.";
  }

  if (profitabilityStatus === "critical") {
    return "Subir precio o revisar cantidades y merma cuanto antes.";
  }

  return "Revisar margen objetivo y validar el costo real antes de seguir vendiendo.";
}

export function getSuggestedDeltaLabel(currentPrice, suggestedPrice) {
  const current = Number(currentPrice || 0);
  const suggested = Number(suggestedPrice || 0);
  const delta = suggested - current;

  if (!current || Math.abs(delta) < 1) {
    return "El precio actual ya esta alineado.";
  }

  if (delta > 0) {
    return `Conviene subir ${formatCOP(delta)} para llegar al precio recomendado.`;
  }

  return `Hay espacio para bajar ${formatCOP(Math.abs(delta))} si quieres ganar competitividad.`;
}

export function buildProductFlowSummary({ product, recipeBook }) {
  return {
    compact: recipeBook ? "Ficha conectada" : "Sin ficha conectada",
    detail: recipeBook
      ? "Este producto ya conecta precio, costo real y rentabilidad."
      : "Aun no tiene ficha tecnica conectada para leer utilidad real.",
    badge: "Directo",
  };
}

export function buildRecipeCostSnapshot(recipeBook, fallbackPrice = 0) {
  if (!recipeBook) {
    return {
      realCost: 0,
      currentMarginPct: 0,
      suggestedPrice: Number(fallbackPrice || 0),
    ingredientsCount: 0,
      profitabilityStatus: "warning",
    };
  }

  return {
    realCost: Number(recipeBook.real_cost || 0),
    currentMarginPct: Number(recipeBook.current_margin_pct || 0),
    suggestedPrice: Number(recipeBook.suggested_price || fallbackPrice || 0),
    ingredientsCount: Array.isArray(recipeBook.ingredients) ? recipeBook.ingredients.length : 0,
    profitabilityStatus: recipeBook.profitability_status || "warning",
  };
}
