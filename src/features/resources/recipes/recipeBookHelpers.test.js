import { describe, expect, it } from "vitest";
import { buildPayloadFromForm, createEmptyComponent, createEmptyRecipeForm, validateRecipeForm } from "./recipeBookHelpers";

describe("recipeBookHelpers", () => {
  it("builds the RPC payload required by create_or_update_technical_sheet", () => {
    const component = {
      ...createEmptyComponent(),
      sourceType: "raw_item",
      sourceId: "32000000-0000-0000-0000-000000000001",
      name: "Harina",
      quantity: "100",
      unit: "g",
      unitCost: "10",
      wastePercent: "10",
    };
    const form = {
      ...createEmptyRecipeForm(),
      name: "Arepa rentable",
      type: "final_product",
      category: "Almuerzos",
      status: "active",
      productId: "33000000-0000-0000-0000-000000000001",
      yieldQuantity: "2",
      yieldUnit: "porcion",
      portions: "2",
      currentSalePrice: "5000",
      targetFoodCost: "30",
      components: [component],
    };

    const payload = buildPayloadFromForm({
      form,
      businessId: "22000000-0000-0000-0000-000000000001",
      products: [{ id: form.productId, name: "Arepa", price: 5000 }],
    });

    expect(payload).toEqual(
      expect.objectContaining({
        business_id: "22000000-0000-0000-0000-000000000001",
        product_id: form.productId,
        product_name: "Arepa",
        status: "active",
        sale_price: 5000,
      })
    );
    expect(payload.yield).toEqual(expect.objectContaining({ portions: 2, unit: "porcion" }));
    expect(payload.components).toHaveLength(1);
    expect(payload.components[0]).toEqual(
      expect.objectContaining({
        sourceType: "raw_item",
        sourceId: component.sourceId,
        quantity: 100,
        unit: "g",
        unitCost: 10,
        wastePercent: 10,
      })
    );
    expect(payload.costing.costPerPortion).toBeCloseTo(555.56, 2);
    expect(payload.costing.foodCostPercent).toBeCloseTo(11.11, 2);
    expect(payload.costing.grossMargin).toBeCloseTo(4444.44, 2);
  });

  it("blocks technical sheets without valid components before calling Supabase", () => {
    const form = {
      ...createEmptyRecipeForm(),
      name: "Ficha incompleta",
      type: "final_product",
      category: "Almuerzos",
      portions: "1",
      currentSalePrice: "5000",
      targetFoodCost: "30",
      components: [{ ...createEmptyComponent(), name: "Harina", quantity: "0" }],
    };

    expect(validateRecipeForm(form)).toBe(
      "Cada componente debe tener origen, nombre y cantidad mayor a cero."
    );
  });
});
