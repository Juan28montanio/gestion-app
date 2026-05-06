export function normalizePercentRatio(value, fallback = 0) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return fallback;
  }

  return numericValue > 1 ? numericValue / 100 : numericValue;
}

export function calculateComponentCost(component = {}) {
  const quantity = Number(component.quantity || 0);
  const unitCost = Number(component.unitCost ?? component.unit_cost ?? 0);
  const wasteRatio = normalizePercentRatio(component.wastePercent ?? component.waste_percent, 0);

  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitCost) || unitCost < 0) {
    return 0;
  }

  const wasteFactor = wasteRatio > 0 && wasteRatio < 1 ? 1 / Math.max(1 - wasteRatio, 0.01) : 1;
  return quantity * unitCost * wasteFactor;
}

export function calculateTotalCost(components = []) {
  return components.reduce((sum, component) => sum + calculateComponentCost(component), 0);
}

export function calculateCostPerPortion(totalCost, portions) {
  const normalizedPortions = Number(portions);

  if (!Number.isFinite(normalizedPortions) || normalizedPortions <= 0) {
    return 0;
  }

  return Number(totalCost || 0) / normalizedPortions;
}

export function calculateSuggestedPrice(costPerPortion, targetFoodCost) {
  const normalizedTarget = normalizePercentRatio(targetFoodCost, 0.3);

  if (!normalizedTarget || normalizedTarget <= 0) {
    return 0;
  }

  return Number(costPerPortion || 0) / normalizedTarget;
}

export function calculateFoodCostPercent(costPerPortion, currentSalePrice) {
  const normalizedPrice = Number(currentSalePrice || 0);

  if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
    return 0;
  }

  return (Number(costPerPortion || 0) / normalizedPrice) * 100;
}

export function calculateGrossMargin(costPerPortion, currentSalePrice) {
  return Number(currentSalePrice || 0) - Number(costPerPortion || 0);
}

export function calculateGrossMarginPercent(grossMargin, currentSalePrice) {
  const normalizedPrice = Number(currentSalePrice || 0);

  if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
    return 0;
  }

  return (Number(grossMargin || 0) / normalizedPrice) * 100;
}

export function calculateUsefulYield(yieldData = {}) {
  const quantity = Number(yieldData.quantity || 0);
  const wasteRatio = normalizePercentRatio(yieldData.wastePercent ?? yieldData.waste_percent, 0);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 0;
  }

  return quantity * Math.max(1 - wasteRatio, 0);
}

export function calculateTechnicalSheetCosting({ components = [], yieldData = {}, costing = {} }) {
  const totalCost = calculateTotalCost(components);
  const portions = Number(yieldData.portions || 0);
  const costPerPortion = calculateCostPerPortion(totalCost, portions);
  const currentSalePrice = Number(costing.currentSalePrice ?? costing.current_sale_price ?? 0);
  const targetFoodCost = normalizePercentRatio(
    costing.targetFoodCost ?? costing.target_food_cost,
    0.3
  );
  const suggestedPrice = calculateSuggestedPrice(costPerPortion, targetFoodCost);
  const foodCostPercent = calculateFoodCostPercent(costPerPortion, currentSalePrice);
  const grossMargin = calculateGrossMargin(costPerPortion, currentSalePrice);
  const grossMarginPercent = calculateGrossMarginPercent(grossMargin, currentSalePrice);

  return {
    totalCost,
    costPerPortion,
    currentSalePrice: Number.isFinite(currentSalePrice) ? currentSalePrice : 0,
    targetFoodCost,
    suggestedPrice,
    foodCostPercent,
    grossMargin,
    grossMarginPercent,
    utilityEstimate: grossMargin,
  };
}

