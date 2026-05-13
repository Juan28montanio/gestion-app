import { describe, expect, it } from "vitest";
import {
  calculatePaidAmount,
  calculatePendingAmount,
  createAccountsReceivable,
  createCashMovementsFromPayments,
  reverseSale,
} from "./posFinance";

describe("posFinance", () => {
  it("calcula pagos reales excluyendo credito y pagos anulados", () => {
    const payments = [
      { method: "cash", amount: 12000, status: "completed" },
      { method: "customer_credit", amount: 5000, status: "pending" },
      { method: "transfer", amount: 3000, status: "canceled" },
    ];

    expect(calculatePaidAmount(payments)).toBe(12000);
    expect(calculatePendingAmount(17000, calculatePaidAmount(payments))).toBe(5000);
  });

  it("crea cartera solo cuando queda saldo pendiente", () => {
    const receivable = createAccountsReceivable({
      businessId: "business_test",
      customerId: "customer_1",
      customerName: "Cliente demo",
      saleId: "sale_1",
      originalAmount: 20000,
      paidAmount: 12000,
    });

    expect(receivable.pendingAmount).toBe(8000);
    expect(receivable.business_id).toBe("business_test");
    expect(createAccountsReceivable({ originalAmount: 10000, paidAmount: 10000 })).toBeNull();
  });

  it("crea movimientos de caja solo para medios que afectan caja", () => {
    const movements = createCashMovementsFromPayments({
      businessId: "business_test",
      cashSessionId: "cash_1",
      saleId: "sale_1",
      payments: [
        { method: "cash", amount: 10000, id: "payment_1" },
        { method: "ticket_wallet", amount: 8000, id: "payment_2" },
      ],
    });

    expect(movements).toHaveLength(1);
    expect(movements[0].sale_id).toBe("sale_1");
    expect(movements[0].payment_id).toBe("payment_1");
  });

  it("exige motivo para anular una venta", () => {
    expect(() => reverseSale({ reason: "" })).toThrow("motivo");
    expect(reverseSale({ reason: "Error de mesa", userId: "u1" }).status).toBe("canceled");
  });
});
