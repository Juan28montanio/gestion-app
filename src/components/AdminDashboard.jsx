import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  Landmark,
  Search,
  Wallet,
} from "lucide-react";
import { subscribeToSalesHistory } from "../services/financeService";
import { subscribeToPurchases } from "../services/purchaseService";
import { formatCOP } from "../utils/formatters";

const RANGE_OPTIONS = [
  { value: "daily", label: "Diario" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "annual", label: "Anual" },
  { value: "custom", label: "Fecha puntual" },
];

const PAYMENT_METHOD_LABELS = {
  all: "Todos",
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  nequi: "Nequi",
  daviplata: "Daviplata",
};

const PAYMENT_METHOD_STYLES = {
  all: "from-slate-900 to-slate-700 text-white ring-slate-900/10",
  cash: "from-emerald-500 to-emerald-600 text-white ring-emerald-500/20",
  card: "from-sky-500 to-sky-600 text-white ring-sky-500/20",
  transfer: "from-indigo-500 to-indigo-600 text-white ring-indigo-500/20",
  nequi: "from-fuchsia-500 to-fuchsia-600 text-white ring-fuchsia-500/20",
  daviplata: "from-rose-500 to-pink-600 text-white ring-rose-500/20",
};

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (value?.toDate) {
    return value.toDate();
  }

  return null;
}

function isInRange(date, range, selectedDate) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return false;
  }

  const base = selectedDate ? new Date(selectedDate) : new Date();
  const current = new Date(date);
  const sameDay = current.toDateString() === base.toDateString();

  if (range === "custom" || range === "daily") {
    return sameDay;
  }

  if (range === "weekly") {
    const start = new Date(base);
    start.setDate(base.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const end = new Date(base);
    end.setHours(23, 59, 59, 999);
    return current >= start && current <= end;
  }

  if (range === "monthly") {
    return (
      current.getFullYear() === base.getFullYear() &&
      current.getMonth() === base.getMonth()
    );
  }

  if (range === "annual") {
    return current.getFullYear() === base.getFullYear();
  }

  return true;
}

export default function AdminDashboard({ businessId }) {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [selectedRange, setSelectedRange] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");

  useEffect(() => {
    const unsubscribeSales = subscribeToSalesHistory(businessId, setSales);
    const unsubscribePurchases = subscribeToPurchases(businessId, setPurchases);

    return () => {
      unsubscribeSales();
      unsubscribePurchases();
    };
  }, [businessId]);

  const paymentMethodTotals = useMemo(() => {
    return sales.reduce(
      (accumulator, sale) => {
        const method = String(sale.payment_method || "cash").trim() || "cash";
        accumulator[method] = (accumulator[method] || 0) + Number(sale.total || 0);
        return accumulator;
      },
      { cash: 0, card: 0, transfer: 0, nequi: 0, daviplata: 0 }
    );
  }, [sales]);

  const movements = useMemo(() => {
    const saleMovements = sales.map((sale) => ({
      id: `sale-${sale.id}`,
      type: "income",
      date: normalizeDate(sale.closed_at || sale.createdAt),
      concept: sale.customer_name
        ? `${sale.table_name || sale.table_id || "Mesa"} - ${sale.customer_name}`
        : sale.table_name || sale.table_id || "Venta POS",
      category: (sale.items || []).map((item) => item.category).filter(Boolean).join(", "),
      details: (sale.items || []).map((item) => `${item.quantity}x ${item.name}`).join(", "),
      amount: Number(sale.total || 0),
      paymentMethod: sale.payment_method || "cash",
      raw: sale,
    }));

    const purchaseMovements = purchases.map((purchase) => ({
      id: `purchase-${purchase.id}`,
      type: "expense",
      date: normalizeDate(purchase.purchase_date),
      concept: purchase.supplier_name || purchase.invoice_number || "Compra",
      category: [...new Set((purchase.items || []).map((item) => item.category).filter(Boolean))].join(", "),
      details: (purchase.items || []).map((item) => `${item.quantity}x ${item.ingredient_name}`).join(", "),
      amount: Number(purchase.total || 0),
      paymentMethod: "expense",
      raw: purchase,
    }));

    return [...saleMovements, ...purchaseMovements].sort(
      (a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0)
    );
  }, [purchases, sales]);

  const filteredMovements = useMemo(() => {
    const term = search.trim().toLowerCase();

    return movements.filter((movement) => {
      const matchesRange = isInRange(movement.date, selectedRange, selectedDate);
      const matchesPayment =
        selectedPaymentMethod === "all" ||
        movement.type === "expense" ||
        movement.paymentMethod === selectedPaymentMethod;
      const searchable = `${movement.concept} ${movement.category} ${movement.details}`.toLowerCase();
      const matchesSearch = !term || searchable.includes(term);

      return matchesRange && matchesPayment && matchesSearch;
    });
  }, [movements, search, selectedDate, selectedPaymentMethod, selectedRange]);

  const summary = useMemo(() => {
    return filteredMovements.reduce(
      (acc, movement) => {
        if (movement.type === "income") {
          acc.income += movement.amount;
        } else {
          acc.expense += movement.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredMovements]);

  const balance = summary.income - summary.expense;

  return (
    <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Resumen financiero</h2>
          <p className="text-sm text-slate-500">
            Integra ingresos, compras y balance con filtros activos por fecha, concepto y metodo de pago.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[auto_auto_1fr]">
          <select
            value={selectedRange}
            onChange={(event) => setSelectedRange(event.target.value)}
            className="rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200"
          />

          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
            <Search size={16} className="text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por concepto o categoria..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] bg-emerald-50 p-5 ring-1 ring-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Ingresos</p>
              <p className="mt-2 text-2xl font-black text-emerald-950">{formatCOP(summary.income)}</p>
            </div>
            <ArrowUpCircle className="text-emerald-600" size={24} />
          </div>
        </article>

        <article className="rounded-[28px] bg-rose-50 p-5 ring-1 ring-rose-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-rose-700">Egresos</p>
              <p className="mt-2 text-2xl font-black text-rose-950">{formatCOP(summary.expense)}</p>
            </div>
            <ArrowDownCircle className="text-rose-600" size={24} />
          </div>
        </article>

        <article className="rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] p-5 text-white ring-1 ring-slate-950/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-200">Balance</p>
              <p className="mt-2 text-2xl font-black">{formatCOP(balance)}</p>
            </div>
            <Landmark className="text-[#d4a72c]" size={24} />
          </div>
        </article>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {["all", "cash", "card", "transfer", "nequi", "daviplata"].map((method) => {
          const isActive = selectedPaymentMethod === method;
          const total = method === "all" ? summary.income : paymentMethodTotals[method] || 0;
          const Icon = method === "all" ? Wallet : CreditCard;

          return (
            <button
              key={method}
              type="button"
              onClick={() => setSelectedPaymentMethod(method)}
              className={`rounded-[24px] p-4 text-left ring-1 transition ${
                isActive
                  ? `bg-gradient-to-br ${PAYMENT_METHOD_STYLES[method]} shadow-lg`
                  : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`rounded-2xl p-2 ${isActive ? "bg-white/15" : "bg-white"}`}>
                  <Icon size={16} />
                </span>
                <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isActive ? "text-white/80" : "text-slate-400"}`}>
                  {PAYMENT_METHOD_LABELS[method]}
                </span>
              </div>
              <p className={`mt-4 text-lg font-black ${isActive ? "text-white" : "text-slate-900"}`}>
                {formatCOP(total)}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-[28px] bg-slate-50 p-5 ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Historial de transacciones</h3>
            <p className="text-sm text-slate-500">
              {filteredMovements.length} movimiento{filteredMovements.length === 1 ? "" : "s"} en el filtro actual.
            </p>
          </div>
        </div>

        {filteredMovements.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            No hay movimientos para este filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Tipo</th>
                  <th className="py-3 pr-4">Concepto</th>
                  <th className="py-3 pr-4">Metodo</th>
                  <th className="py-3 pr-4">Categoria</th>
                  <th className="py-3 pr-4">Detalle</th>
                  <th className="py-3 pr-4">Fecha</th>
                  <th className="py-3 pr-4">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((movement) => (
                  <tr key={movement.id} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                          movement.type === "income"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-rose-200"
                        }`}
                      >
                        {movement.type === "income" ? "Ingreso" : "Egreso"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-900">{movement.concept}</td>
                    <td className="py-3 pr-4">
                      {movement.type === "income" ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {PAYMENT_METHOD_LABELS[movement.paymentMethod] || movement.paymentMethod}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          Compra
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">{movement.category || "General"}</td>
                    <td className="py-3 pr-4">{movement.details || "-"}</td>
                    <td className="py-3 pr-4">
                      {movement.date
                        ? new Intl.DateTimeFormat("es-CO", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(movement.date)
                        : "-"}
                    </td>
                    <td
                      className={`py-3 pr-4 font-semibold ${
                        movement.type === "income" ? "text-emerald-800" : "text-rose-800"
                      }`}
                    >
                      {movement.type === "income" ? "+" : "-"}
                      {formatCOP(movement.amount)}
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
