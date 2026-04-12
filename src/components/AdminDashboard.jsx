import { useEffect, useState } from "react";
import { subscribeToDailySales } from "../services/financeService";
import { formatCOP } from "../utils/formatters";

const PAYMENT_LABELS = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  nequi: "Nequi",
  daviplata: "Daviplata",
};

export default function AdminDashboard({ businessId }) {
  const [summary, setSummary] = useState({
    total: 0,
    byMethod: { cash: 0, transfer: 0, card: 0 },
    sales: [],
  });

  useEffect(() => {
    const unsubscribe = subscribeToDailySales(businessId, setSummary);
    return () => unsubscribe();
  }, [businessId]);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Resumen Financiero</h2>
        <p className="text-sm text-slate-500">
          Ventas del día calculadas desde <code>sales_history</code>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-sm text-slate-300">Total del día</p>
          <h3 className="mt-2 text-2xl font-bold">{formatCOP(summary.total)}</h3>
        </article>

        {Object.entries(summary.byMethod).map(([method, amount]) => (
          <article key={method} className="rounded-2xl bg-slate-100 p-5">
            <p className="text-sm text-slate-500">{PAYMENT_LABELS[method] || method}</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{formatCOP(amount)}</h3>
          </article>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-3 pr-4">Orden</th>
              <th className="py-3 pr-4">Método</th>
              <th className="py-3 pr-4">Total</th>
            </tr>
          </thead>
          <tbody>
            {summary.sales.map((sale) => (
              <tr key={sale.id} className="border-b border-slate-100 text-slate-700">
                <td className="py-3 pr-4">{sale.order_id || sale.orderId}</td>
                <td className="py-3 pr-4">
                  {PAYMENT_LABELS[sale.payment_method] ||
                    PAYMENT_LABELS[sale.method] ||
                    sale.payment_method ||
                    sale.method}
                </td>
                <td className="py-3 pr-4">{formatCOP(sale.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
