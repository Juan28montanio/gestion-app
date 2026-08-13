import { describe, expect, it } from "vitest";
import { buildSaleRpcPayload } from "./sales";

describe("buildSaleRpcPayload", () => {
  it("preserves prepared-product identifiers for inventory explosion", () => {
    const payload = buildSaleRpcPayload({
      businessId: "22000000-0000-0000-0000-000000000001",
      cashSessionId: "44000000-0000-0000-0000-000000000001",
      tableId: "quick-sale",
      tableName: "Venta rapida",
      items: [
        {
          productId: "33000000-0000-0000-0000-000000000001",
          productName: "Arepa rentable",
          quantity: 2,
          price: 5000,
          subtotal: 10000,
          technicalSheetId: "55000000-0000-0000-0000-000000000001",
        },
      ],
      subtotal: 10000,
      chargedTotal: 10000,
      paymentMethod: "cash",
    });

    expect(payload.p_business_id).toBe("22000000-0000-0000-0000-000000000001");
    expect(payload.p_sale).toEqual(
      expect.objectContaining({
        cash_session_id: "44000000-0000-0000-0000-000000000001",
        source_type: "quick_sale",
        subtotal: 10000,
        total: 10000,
      })
    );
    expect(payload.p_items).toEqual([
      expect.objectContaining({
        product_id: "33000000-0000-0000-0000-000000000001",
        product_name: "Arepa rentable",
        quantity: 2,
        unit_price: 5000,
        subtotal: 10000,
        technical_sheet_id: "55000000-0000-0000-0000-000000000001",
      }),
    ]);
    expect(payload.p_payments).toEqual([{ method: "cash", amount: 10000, reference: "" }]);
  });
});
