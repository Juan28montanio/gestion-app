export {
  getSalesLedger,
  subscribeToSalesHistory,
  subscribeToSalesLedger,
  updateSaleHistoryEntry,
} from "./salesLedgerService";

export async function handleStockReduction() {
  return;
}

export async function closeOrderAndLogSale() {
  throw new Error("El cierre de ordenes de mesa debe ejecutarse con las RPC operativas de Supabase.");
}

export function subscribeToDailySales(businessId, callback) {
  if (!businessId) {
    callback({ sales: [], total: 0, byMethod: {} });
    return () => {};
  }

  return import("./salesLedgerService").then(({ subscribeToSalesLedger }) =>
    subscribeToSalesLedger(businessId, (sales) => {
      const today = new Date().toISOString().slice(0, 10);
      const todaySales = sales.filter((sale) =>
        String(sale.closed_at || sale.created_at || sale.createdAt || "").startsWith(today)
      );
      callback({
        sales: todaySales,
        total: todaySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
        byMethod: todaySales.reduce((acc, sale) => {
          const method = sale.payment_method || "cash";
          acc[method] = (acc[method] || 0) + Number(sale.total || 0);
          return acc;
        }, {}),
      });
    })
  );
}
