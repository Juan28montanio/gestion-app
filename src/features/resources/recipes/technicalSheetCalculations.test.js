import { describe, expect, it } from "vitest";
import {
  calculateComponentCost,
  calculateCostPerPortion,
  calculateFoodCostPercent,
  calculateGrossMargin,
  calculateGrossMarginPercent,
  calculateSuggestedPrice,
  calculateTechnicalSheetCosting,
  calculateTotalCost,
  calculateUsefulYield,
  normalizePercentRatio,
} from "./technicalSheetCalculations";

describe("technicalSheetCalculations", () => {
  it("normaliza porcentajes capturados como enteros o ratios", () => {
    expect(normalizePercentRatio(30)).toBe(0.3);
    expect(normalizePercentRatio(0.25)).toBe(0.25);
    expect(normalizePercentRatio(-10, 0.2)).toBe(0.2);
    expect(normalizePercentRatio("no-valido", 0.15)).toBe(0.15);
  });

  it("calcula el costo de componentes con merma sin aceptar cantidades invalidas", () => {
    expect(
      calculateComponentCost({
        quantity: 2,
        unitCost: 1000,
        wastePercent: 20,
      })
    ).toBe(2500);

    expect(calculateComponentCost({ quantity: 0, unitCost: 1000 })).toBe(0);
    expect(calculateComponentCost({ quantity: 1, unitCost: -1000 })).toBe(0);
  });

  it("calcula costo total, costo por porcion, precio sugerido y margen", () => {
    const totalCost = calculateTotalCost([
      { quantity: 2, unitCost: 1000, wastePercent: 20 },
      { quantity: 1.5, unitCost: 2000, wastePercent: 0 },
    ]);
    const costPerPortion = calculateCostPerPortion(totalCost, 5);
    const suggestedPrice = calculateSuggestedPrice(costPerPortion, 30);
    const foodCostPercent = calculateFoodCostPercent(costPerPortion, 5000);
    const grossMargin = calculateGrossMargin(costPerPortion, 5000);

    expect(totalCost).toBe(5500);
    expect(costPerPortion).toBe(1100);
    expect(suggestedPrice).toBeCloseTo(3666.67, 2);
    expect(foodCostPercent).toBe(22);
    expect(grossMargin).toBe(3900);
    expect(calculateGrossMarginPercent(grossMargin, 5000)).toBe(78);
  });

  it("genera el snapshot de rentabilidad esperado para una ficha tecnica", () => {
    const costing = calculateTechnicalSheetCosting({
      components: [
        { quantity: 3, unitCost: 800, wastePercent: 0 },
        { quantity: 2, unitCost: 600, wastePercent: 25 },
      ],
      yieldData: {
        quantity: 10,
        wastePercent: 10,
        portions: 4,
      },
      costing: {
        currentSalePrice: 4000,
        targetFoodCost: 0.3,
      },
    });

    expect(costing.totalCost).toBe(4000);
    expect(costing.costPerPortion).toBe(1000);
    expect(costing.currentSalePrice).toBe(4000);
    expect(costing.targetFoodCost).toBe(0.3);
    expect(costing.suggestedPrice).toBeCloseTo(3333.33, 2);
    expect(costing.foodCostPercent).toBe(25);
    expect(costing.grossMargin).toBe(3000);
    expect(costing.grossMarginPercent).toBe(75);
    expect(costing.utilityEstimate).toBe(3000);
    expect(calculateUsefulYield({ quantity: 10, wastePercent: 10 })).toBe(9);
  });
});
