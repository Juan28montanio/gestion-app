export const UNIT_LABELS = {
  g: "g",
  kg: "kg",
  ml: "ml",
  L: "L",
  l: "L",
  und: "und",
  unidad: "und",
  unidades: "und",
  caja: "caja",
  paquete: "paquete",
};

const STANDARD_FACTORS = {
  "kg:g": 1000,
  "g:kg": 0.001,
  "L:ml": 1000,
  "l:ml": 1000,
  "ml:L": 0.001,
  "ml:l": 0.001,
  "und:und": 1,
  "g:g": 1,
  "kg:kg": 1,
  "ml:ml": 1,
  "L:L": 1,
  "l:l": 1,
};

export function normalizeUnit(unit, fallback = "und") {
  const value = String(unit || "").trim();
  return UNIT_LABELS[value] || value || fallback;
}

export function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizePercent(value, fallback = 0) {
  const number = toFiniteNumber(value, fallback);
  if (number < 0) {
    return fallback;
  }
  return number > 1 ? number / 100 : number;
}

export function calculateConversionFactor({ purchaseUnit, baseUnit, purchaseQuantity, conversionFactor } = {}) {
  const explicitFactor = toFiniteNumber(conversionFactor, 0);
  if (explicitFactor > 0) {
    return explicitFactor;
  }

  const normalizedPurchaseUnit = normalizeUnit(purchaseUnit);
  const normalizedBaseUnit = normalizeUnit(baseUnit);
  const standardFactor = STANDARD_FACTORS[`${normalizedPurchaseUnit}:${normalizedBaseUnit}`];
  if (standardFactor) {
    return standardFactor;
  }

  const quantity = toFiniteNumber(purchaseQuantity, 0);
  return quantity > 0 ? quantity : 1;
}

export function calculateCostPerBaseUnit({ currentCost, purchaseQuantity, conversionFactor } = {}) {
  const cost = toFiniteNumber(currentCost, 0);
  const quantity = toFiniteNumber(purchaseQuantity, 0);
  const factor = toFiniteNumber(conversionFactor, 0);
  const baseQuantity = quantity > 0 && factor > 0 ? quantity * factor : factor;

  if (cost < 0 || baseQuantity <= 0) {
    return 0;
  }

  return cost / baseQuantity;
}

export function calculateUsefulYield(quantity, wastePercent = 0) {
  const baseQuantity = toFiniteNumber(quantity, 0);
  const wasteRatio = normalizePercent(wastePercent, 0);

  if (baseQuantity <= 0) {
    return 0;
  }

  return baseQuantity * Math.max(1 - wasteRatio, 0);
}

export function calculateRealCost({ currentCost, usefulYield } = {}) {
  const cost = toFiniteNumber(currentCost, 0);
  const yieldQuantity = toFiniteNumber(usefulYield, 0);

  if (cost < 0 || yieldQuantity <= 0) {
    return 0;
  }

  return cost / yieldQuantity;
}

export function calculateStockStatus({ currentStock, minimumStock, reorderPoint } = {}) {
  const stock = toFiniteNumber(currentStock, 0);
  const minimum = toFiniteNumber(minimumStock, 0);
  const reorder = toFiniteNumber(reorderPoint, minimum, 0);

  if (stock <= 0) {
    return {
      key: "depleted",
      label: "Agotado",
      classes: "bg-rose-100 text-rose-700 ring-rose-200",
    };
  }

  if ((minimum > 0 && stock <= minimum) || (reorder > 0 && stock <= reorder * 0.5)) {
    return {
      key: "critical",
      label: "Stock critico",
      classes: "bg-rose-100 text-rose-700 ring-rose-200",
    };
  }

  if (reorder > 0 && stock <= reorder) {
    return {
      key: "low",
      label: "Bajo stock",
      classes: "bg-amber-100 text-amber-700 ring-amber-200",
    };
  }

  return {
    key: "healthy",
    label: "Saludable",
    classes: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  };
}

export function calculateReorderPoint({ minimumStock, idealStock } = {}) {
  const minimum = toFiniteNumber(minimumStock, 0);
  const ideal = toFiniteNumber(idealStock, 0);

  if (ideal > minimum) {
    return minimum + (ideal - minimum) * 0.35;
  }

  return minimum;
}

export function getSupplyCostPerBaseUnit(supply = {}) {
  return toFiniteNumber(
    supply?.costs?.costPerBaseUnit ??
      supply?.cost_per_base_unit ??
      supply?.cost_per_unit ??
      supply?.average_cost ??
      supply?.last_purchase_cost,
    0
  );
}

export function getSupplyBaseUnit(supply = {}) {
  return normalizeUnit(supply?.baseUnit ?? supply?.base_unit ?? supply?.unit, "und");
}

export function getSupplyCurrentStock(supply = {}) {
  return toFiniteNumber(supply?.inventory?.currentStock ?? supply?.stock, 0);
}

export function getSupplyMinimumStock(supply = {}) {
  return toFiniteNumber(supply?.inventory?.minimumStock ?? supply?.stock_min_alert, 0);
}

export function getSupplyReorderPoint(supply = {}) {
  return toFiniteNumber(
    supply?.inventory?.reorderPoint ?? calculateReorderPoint({
      minimumStock: getSupplyMinimumStock(supply),
      idealStock: supply?.inventory?.idealStock,
    }),
    0
  );
}

export function getSupplyWastePercent(supply = {}) {
  return toFiniteNumber(supply?.waste?.wastePercent ?? supply?.waste_percent, 0);
}

export function getSupplyUsefulYield(supply = {}) {
  return toFiniteNumber(
    supply?.waste?.usefulYield ??
      supply?.useful_yield ??
      calculateUsefulYield(
        supply?.conversion?.purchaseQuantity ?? 1,
        getSupplyWastePercent(supply)
      ),
    0
  );
}
