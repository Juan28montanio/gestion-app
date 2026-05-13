import { describe, expect, it } from "vitest";
import { buildSalesLedger } from "./salesLedgerService";

describe("salesLedgerService", () => {
  it("prioriza sales y enriquece con pagos, items y legacy sin duplicar", () => {
    const ledger = buildSalesLedger({
      sales: [
        {
          id: "sale_1",
          business_id: "business_1",
          total: 30000,
          status: "paid",
          cash_session_id: "cash_1",
          createdAt: "2026-05-13T10:00:00.000Z",
        },
      ],
      saleItems: [
        {
          id: "item_1",
          sale_id: "sale_1",
          business_id: "business_1",
          product_name: "Menu ejecutivo",
          quantity: 2,
          unit_price: 15000,
        },
      ],
      payments: [
        {
          id: "payment_1",
          sale_id: "sale_1",
          business_id: "business_1",
          method: "cash",
          amount: 20000,
          status: "completed",
        },
        {
          id: "payment_2",
          sale_id: "sale_1",
          business_id: "business_1",
          method: "transfer",
          amount: 10000,
          status: "completed",
        },
      ],
      legacySales: [
        {
          id: "legacy_1",
          business_id: "business_1",
          sale_id: "sale_1",
          table_name: "Mesa 1",
          total: 30000,
          type: "income",
        },
      ],
    });

    expect(ledger).toHaveLength(1);
    expect(ledger[0].source).toBe("canonical");
    expect(ledger[0].table_name).toBe("Mesa 1");
    expect(ledger[0].payment_method).toBe("split");
    expect(ledger[0].payment_breakdown).toHaveLength(2);
    expect(ledger[0].items[0].name).toBe("Menu ejecutivo");
  });

  it("conserva ventas legacy sin venta canonica", () => {
    const ledger = buildSalesLedger({
      sales: [],
      saleItems: [],
      payments: [],
      legacySales: [
        {
          id: "legacy_only",
          business_id: "business_1",
          total: 12000,
          type: "income",
          payment_method: "cash",
        },
      ],
    });

    expect(ledger).toHaveLength(1);
    expect(ledger[0].source).toBe("legacy");
    expect(ledger[0].sale_id).toBe("legacy_only");
  });
});
