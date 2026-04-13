import { useEffect, useMemo, useState } from "react";
import { CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import { subscribeToDailySales } from "../services/financeService";
import { formatCOP } from "../utils/formatters";

const PAYMENT_METHOD_META = {
  total: {
    label: "Total del dia",
    icon: Wallet,
    classes: "bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] text-white ring-slate-950/10",
    amountClass: "text-white",
    description: "Vista general",
  },
  cash: {
    label: "Efectivo",
    icon: Wallet,
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amountClass: "text-emerald-900",
    description: "Caja inmediata",
  },
  card: {
    label: "Tarjeta",
    icon: CreditCard,
    classes: "bg-sky-50 text-sky-700 ring-sky-200",
    amountClass: "text-sky-900",
    description: "Datafono",
  },
  transfer: {
    label: "Transferencia",
    icon: Landmark,
    classes: "bg-violet-50 text-violet-700 ring-violet-200",
    amountClass: "text-violet-900",
    description: "Banco",
  },
  nequi: {
    label: "Nequi",
    icon: Smartphone,
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amountClass: "text-emerald-900",
    description: "Billetera digital",
  },
  daviplata: {
    label: "Daviplata",
    icon: Smartphone,
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amountClass: "text-emerald-900",
    description: "Pago movil",
  },
};

const EMPTY_SUMMARY = {
  total: 0,
  byMethod: {
    cash: 0,
    transfer: 0,
    card: 0,
    nequi: 0,
    daviplata: 0,
  },
  sales: [],
};

function resolvePaymentLabel(method) {
  return PAYMENT_METHOD_META[method]?.label || method || "Sin metodo";
}

export default function AdminDashboard({ businessId }) {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [selectedMethod, setSelectedMethod] = useState("total");

  useEffect(() => {
    const unsubscribe = subscribeToDailySales(businessId, (nextSummary) => {
      setSummary({
        total: nextSummary?.total || 0,
        byMethod: {
          ...EMPTY_SUMMARY.byMethod,
          ...(nextSummary?.byMethod || {}),
        },
        sales: Array.isArray(nextSummary?.sales) ? nextSummary.sales : [],
      });
    });

    return () => unsubscribe();
  }, [businessId]);

  const financeCards = useMemo(() => {
    const cards = [
      { key: "total", amount: summary.total },
      ...Object.keys(EMPTY_SUMMARY.byMethod).map((method) => ({
        key: method,
        amount: summary.byMethod[method] || 0,
      })),
    ];

    return cards;
  }, [summary]);

  const filteredSales = useMemo(() => {
    if (selectedMethod === "total") {
      return summary.sales;
    }

    return summary.sales.filter((sale) => {
      const method = sale.payment_method || sale.method;
      return method === selectedMethod;
    });
  }, [selectedMethod, summary.sales]);

  return (
    <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Resumen financiero</h2>
          <p className="text-sm text-slate-500">
            Haz clic en una tarjeta para filtrar las transacciones del dia.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {filteredSales.length} movimiento{filteredSales.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {financeCards.map(({ key, amount }) => {
          const meta = PAYMENT_METHOD_META[key];
          const Icon = meta.icon;
          const isSelected = selectedMethod === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedMethod(key)}
              className={`rounded-[28px] p-5 text-left ring-1 transition hover:-translate-y-0.5 hover:shadow-lg ${meta.classes} ${
                isSelected ? "shadow-lg ring-slate-900/10" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <p className="mt-1 text-xs opacity-80">{meta.description}</p>
                </div>
                <div className="rounded-2xl border border-[#d4a72c]/25 bg-[#fff7df]/85 p-3 text-[#946200]">
                  <Icon size={18} />
                </div>
              </div>

              <p className={`mt-6 text-2xl font-bold ${meta.amountClass}`}>
                {formatCOP(amount)}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-[28px] bg-slate-50 p-5 ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Transacciones</h3>
            <p className="text-sm text-slate-500">
              {selectedMethod === "total"
                ? "Vista completa del historial del dia."
                : `Filtrado por ${resolvePaymentLabel(selectedMethod)}.`}
            </p>
          </div>

          {selectedMethod !== "total" ? (
            <button
              type="button"
              onClick={() => setSelectedMethod("total")}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100"
            >
              Ver todo
            </button>
          ) : null}
        </div>

        {filteredSales.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            No hay transacciones para este filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Orden</th>
                  <th className="py-3 pr-4">Metodo</th>
                  <th className="py-3 pr-4">Items</th>
                  <th className="py-3 pr-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      {sale.order_id || sale.orderId || sale.id}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                        {resolvePaymentLabel(sale.payment_method || sale.method)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{sale.items?.length || 0}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {formatCOP(sale.total || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
