function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function buildSaleRpcPayload({
  businessId,
  cashSessionId,
  tableId,
  tableName,
  items = [],
  subtotal = 0,
  chargedTotal = 0,
  paymentMethod = "cash",
  splitPayments = [],
  customer = null,
  actor = {},
  ticketConsumption = {},
}) {
  const total = Math.max(toNumber(chargedTotal, subtotal), 0);
  const saleItems = items.map((item) => {
    const quantity = toNumber(item.quantity, 1);
    const unitPrice = toNumber(item.price ?? item.unitPrice, 0);

    return {
      product_id: item.productId || item.id || null,
      product_name: item.productName || item.name || "Producto",
      name: item.name || item.productName || "Producto",
      quantity,
      unit_price: unitPrice,
      price: unitPrice,
      subtotal: toNumber(item.subtotal, unitPrice * quantity),
      category: item.category || "",
      technical_sheet_id: item.technicalSheetId || null,
      use_ticket: Boolean(item.useTicket),
    };
  });

  const payments = splitPayments.length
    ? splitPayments.map((payment) => ({
        method: payment.method || "cash",
        amount: toNumber(payment.amount, 0),
        reference: payment.reference || "",
      }))
    : [
        {
          method: paymentMethod || "cash",
          amount: total,
          reference: "",
        },
      ];

  return {
    p_business_id: businessId,
    p_sale: {
      cash_session_id: cashSessionId || null,
      customer_id: customer?.id || null,
      source_type: tableId === "quick-sale" ? "quick_sale" : "table",
      subtotal: toNumber(subtotal, total),
      total,
      table_id: tableId || "",
      table_name: tableName || "",
      customer_name: customer?.name || "",
      actor,
      ticket_consumption: ticketConsumption || {},
    },
    p_items: saleItems,
    p_payments: payments.filter((payment) => toNumber(payment.amount, 0) > 0),
  };
}
