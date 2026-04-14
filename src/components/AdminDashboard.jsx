import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  Landmark,
  Printer,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";
import { subscribeToSalesHistory } from "../services/financeService";
import { subscribeToPurchases } from "../services/purchaseService";
import {
  buildCashClosingReportHtml,
  closeCashSession,
  getCashSessionLockInfo,
  getLocalDateKey,
  openCashSession,
  settlePendingDebtSale,
  subscribeToCashClosings,
  subscribeToOpenCashSession,
} from "../services/cashClosingService";
import ModalWrapper from "./ModalWrapper";
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
  ticket_wallet: "Tiquetera",
};

const PAYMENT_METHOD_STYLES = {
  all: "from-slate-900 to-slate-700 text-white ring-slate-900/10",
  cash: "from-emerald-500 to-emerald-600 text-white ring-emerald-500/20",
  card: "from-sky-500 to-sky-600 text-white ring-sky-500/20",
  transfer: "from-indigo-500 to-indigo-600 text-white ring-indigo-500/20",
  nequi: "from-fuchsia-500 to-fuchsia-600 text-white ring-fuchsia-500/20",
  daviplata: "from-rose-500 to-pink-600 text-white ring-rose-500/20",
  ticket_wallet: "from-amber-500 to-[#d4a72c] text-white ring-[#d4a72c]/20",
};

function getLocalDateInputValue(date = new Date()) {
  return getLocalDateKey(date);
}

function parseLocalDateInput(value) {
  if (!value || typeof value !== "string") {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date(value);
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const [year, month, day] = value.split("-").map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }

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

  const base = selectedDate ? parseLocalDateInput(selectedDate) : new Date();
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
    return current.getFullYear() === base.getFullYear() && current.getMonth() === base.getMonth();
  }

  if (range === "annual") {
    return current.getFullYear() === base.getFullYear();
  }

  return true;
}

function summarizeMovements(movements) {
  return movements.reduce(
    (accumulator, movement) => {
      if (movement.type === "income") {
        accumulator.income += movement.amount;
      } else {
        accumulator.expense += movement.amount;
      }
      return accumulator;
    },
    { income: 0, expense: 0 }
  );
}

function openPrintableReport(report) {
  const html = buildCashClosingReportHtml(report);
  const reportWindow = window.open("", "_blank", "width=960,height=720");

  if (!reportWindow) {
    return;
  }

  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
  reportWindow.focus();
  window.setTimeout(() => reportWindow.print(), 300);
}

export default function AdminDashboard({ businessId }) {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [cashClosings, setCashClosings] = useState([]);
  const [openSession, setOpenSession] = useState(null);
  const [selectedRange, setSelectedRange] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateInputValue());
  const [search, setSearch] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const [cashCounted, setCashCounted] = useState("");
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [saleToSettle, setSaleToSettle] = useState(null);
  const [settlementMethod, setSettlementMethod] = useState("cash");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const unsubscribeSales = subscribeToSalesHistory(businessId, setSales);
    const unsubscribePurchases = subscribeToPurchases(businessId, setPurchases);
    const unsubscribeClosings = subscribeToCashClosings(businessId, setCashClosings);
    const unsubscribeOpenSession = subscribeToOpenCashSession(businessId, setOpenSession);

    return () => {
      unsubscribeSales();
      unsubscribePurchases();
      unsubscribeClosings();
      unsubscribeOpenSession();
    };
  }, [businessId]);

  const lockInfo = useMemo(() => getCashSessionLockInfo(openSession), [openSession]);

  const paymentMethodTotals = useMemo(() => {
    return sales.reduce(
      (accumulator, sale) => {
        const method = String(sale.payment_method || "cash").trim() || "cash";
        accumulator[method] = (accumulator[method] || 0) + Number(sale.total || 0);
        return accumulator;
      },
      { cash: 0, card: 0, transfer: 0, nequi: 0, daviplata: 0, ticket_wallet: 0 }
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
      return matchesRange && matchesPayment && (!term || searchable.includes(term));
    });
  }, [movements, search, selectedDate, selectedPaymentMethod, selectedRange]);

  const todayKey = getLocalDateKey();
  const todayMovements = useMemo(
    () => movements.filter((movement) => movement.date && getLocalDateKey(movement.date) === todayKey),
    [movements, todayKey]
  );

  const todaySummary = useMemo(() => summarizeMovements(todayMovements), [todayMovements]);
  const accumulatedSummary = useMemo(() => summarizeMovements(movements), [movements]);
  const filteredSummary = useMemo(() => summarizeMovements(filteredMovements), [filteredMovements]);
  const balance = filteredSummary.income - filteredSummary.expense;

  const accountsReceivable = useMemo(() => {
    return sales
      .filter((sale) => Number(sale.pending_debt_remaining ?? sale.debt_amount ?? 0) > 0)
      .sort((a, b) => {
        const aTime = normalizeDate(a.closed_at || a.createdAt)?.getTime?.() || 0;
        const bTime = normalizeDate(b.closed_at || b.createdAt)?.getTime?.() || 0;
        return bTime - aTime;
      });
  }, [sales]);

  const totalReceivable = useMemo(
    () =>
      accountsReceivable.reduce(
        (sum, sale) => sum + Number(sale.pending_debt_remaining ?? sale.debt_amount ?? 0),
        0
      ),
    [accountsReceivable]
  );

  const closingPreview = useMemo(() => {
    if (!openSession) {
      return null;
    }

    const openingAmount = Number(openSession.opening_amount || 0);
    const todayExpenses = todayMovements
      .filter((movement) => movement.type === "expense")
      .reduce((sum, movement) => sum + movement.amount, 0);
    const expectedCash = openingAmount + Number(paymentMethodTotals.cash || 0);
    const countedCash = Number(cashCounted || 0);

    return {
      openingAmount,
      expectedCash,
      countedCash,
      difference: countedCash - expectedCash,
      expenses: todayExpenses,
      ticketWalletUnits: todayMovements.reduce(
        (sum, movement) => sum + Number(movement.raw?.ticket_units_consumed || 0),
        0
      ),
    };
  }, [cashCounted, openSession, paymentMethodTotals.cash, todayMovements]);

  const handleOpenCash = async () => {
    setIsBusy(true);
    try {
      await openCashSession(businessId);
    } finally {
      setIsBusy(false);
    }
  };

  const handleCloseCash = async () => {
    if (!openSession) {
      return;
    }

    setIsBusy(true);
    try {
      const report = await closeCashSession({
        businessId,
        closingId: openSession.id,
        cashCounted: Number(cashCounted || 0),
      });
      setIsCloseModalOpen(false);
      setCashCounted("");
      openPrintableReport(report);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSettleDebt = async () => {
    if (!saleToSettle) {
      return;
    }

    setIsBusy(true);
    try {
      await settlePendingDebtSale(saleToSettle.id, settlementMethod);
      setSaleToSettle(null);
      setSettlementMethod("cash");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <section className="space-y-6">
        <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Dashboard de caja</h2>
              <p className="text-sm text-slate-500">
                Controla la caja del dia, el acumulado historico y las cuentas por cobrar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {openSession ? (
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
                >
                  <ReceiptText size={16} />
                  Cierre de caja
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCash}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
                >
                  <Wallet size={16} />
                  Abrir caja
                </button>
              )}
            </div>
          </div>

          {lockInfo.blocked ? (
            <div className="mb-6 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              {lockInfo.message}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-[28px] bg-emerald-50 p-5 ring-1 ring-emerald-200">
                <p className="text-sm font-semibold text-emerald-700">Ventas hoy</p>
                <p className="mt-2 text-2xl font-black text-emerald-950">{formatCOP(todaySummary.income)}</p>
              </article>
              <article className="rounded-[28px] bg-rose-50 p-5 ring-1 ring-rose-200">
                <p className="text-sm font-semibold text-rose-700">Gastos hoy</p>
                <p className="mt-2 text-2xl font-black text-rose-950">{formatCOP(todaySummary.expense)}</p>
              </article>
              <article className="rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] p-5 text-white ring-1 ring-slate-950/10">
                <p className="text-sm font-semibold text-slate-200">Balance neto hoy</p>
                <p className="mt-2 text-2xl font-black">{formatCOP(todaySummary.income - todaySummary.expense)}</p>
              </article>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-[28px] bg-white p-5 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-500">Ventas acumuladas</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{formatCOP(accumulatedSummary.income)}</p>
              </article>
              <article className="rounded-[28px] bg-white p-5 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-500">Gastos acumulados</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{formatCOP(accumulatedSummary.expense)}</p>
              </article>
              <article className="rounded-[28px] bg-[#fff7df] p-5 ring-1 ring-[#d4a72c]/20">
                <p className="text-sm font-semibold text-[#946200]">Balance acumulado</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {formatCOP(accumulatedSummary.income - accumulatedSummary.expense)}
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Transacciones</h3>
              <p className="text-sm text-slate-500">
                Consulta ventas y compras por calendario, concepto y metodo de pago.
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
                  placeholder="Buscar por concepto, categoria o mesa..."
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-[28px] bg-emerald-50 p-5 ring-1 ring-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Ingresos filtrados</p>
                  <p className="mt-2 text-2xl font-black text-emerald-950">{formatCOP(filteredSummary.income)}</p>
                </div>
                <ArrowUpCircle className="text-emerald-600" size={24} />
              </div>
            </article>

            <article className="rounded-[28px] bg-rose-50 p-5 ring-1 ring-rose-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-rose-700">Egresos filtrados</p>
                  <p className="mt-2 text-2xl font-black text-rose-950">{formatCOP(filteredSummary.expense)}</p>
                </div>
                <ArrowDownCircle className="text-rose-600" size={24} />
              </div>
            </article>

            <article className="rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] p-5 text-white ring-1 ring-slate-950/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Balance filtrado</p>
                  <p className="mt-2 text-2xl font-black">{formatCOP(balance)}</p>
                </div>
                <Landmark className="text-[#d4a72c]" size={24} />
              </div>
            </article>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {["all", "cash", "card", "transfer", "nequi", "daviplata", "ticket_wallet"].map((method) => {
              const isActive = selectedPaymentMethod === method;
              const total = method === "all" ? filteredSummary.income : paymentMethodTotals[method] || 0;
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
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            movement.paymentMethod === "ticket_wallet"
                              ? "bg-[#fff7df] text-[#946200]"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
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
                    <td className={`py-3 pr-4 font-semibold ${movement.type === "income" ? "text-emerald-800" : "text-rose-800"}`}>
                      {movement.type === "income" ? "+" : "-"}
                      {formatCOP(movement.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <article className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Cuentas por cobrar</h3>
              <p className="text-sm text-slate-500">Saldo pendiente de clientes deudores.</p>
            </div>
            <span className="rounded-full bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
              Total por cobrar {formatCOP(totalReceivable)}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {accountsReceivable.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                No hay cartera pendiente.
              </div>
            ) : (
              accountsReceivable.slice(0, 6).map((sale) => (
                <div key={sale.id} className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{sale.customer_name || "Cliente"}</p>
                      <p className="text-xs text-slate-500">
                        {new Intl.DateTimeFormat("es-CO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(normalizeDate(sale.closed_at || sale.createdAt) || new Date())}
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                      {formatCOP(Number(sale.pending_debt_remaining ?? sale.debt_amount ?? 0))}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {(sale.items || []).map((item) => `${item.quantity}x ${item.name}`).join(", ") || sale.concept}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSaleToSettle(sale)}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Wallet size={16} />
                    Liquidar
                  </button>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Historial de cierres</h3>
              <p className="text-sm text-slate-500">Turnos cerrados y resultados por jornada.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {cashClosings.slice(0, 6).map((closing) => (
              <div key={closing.id} className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{closing.opened_date_key || "Jornada"}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                    closing.status === "open"
                      ? "bg-amber-50 text-amber-700 ring-amber-200"
                      : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  }`}>
                    {closing.status === "open" ? "Abierta" : "Cerrada"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-200">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Ventas</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatCOP(closing.sales_total || 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-200">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Gastos</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatCOP(closing.expenses_total || 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-200">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Balance</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatCOP(closing.net_balance || 0)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <ModalWrapper
        open={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        maxWidthClass="max-w-4xl"
        icon={{ main: <ReceiptText size={20} />, close: "X" }}
        title="Cierre de caja"
        description="Sigue el wizard de 3 pasos para cerrar el turno y generar el reporte."
      >
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Paso 1</p>
              <h4 className="mt-2 text-lg font-semibold text-slate-900">Conteo de efectivo</h4>
              <p className="mt-2 text-sm text-slate-500">Ingresa el efectivo fisico disponible al cierre.</p>
              <input
                type="number"
                min="0"
                step="1"
                value={cashCounted}
                onChange={(event) => setCashCounted(event.target.value)}
                className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none ring-1 ring-slate-200"
              />
            </div>

            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Paso 2</p>
              <h4 className="mt-2 text-lg font-semibold text-slate-900">Resumen por canal</h4>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {Object.entries(paymentMethodTotals).map(([method, total]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span>{PAYMENT_METHOD_LABELS[method]}</span>
                    <span className="font-semibold text-slate-900">{formatCOP(total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-[#fff7df] p-5 ring-1 ring-[#d4a72c]/20">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#946200]">Paso 3</p>
              <h4 className="mt-2 text-lg font-semibold text-slate-900">Resultado del cierre</h4>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Efectivo esperado</span>
                  <span className="font-semibold">{formatCOP(closingPreview?.expectedCash || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Efectivo contado</span>
                  <span className="font-semibold">{formatCOP(closingPreview?.countedCash || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Diferencia</span>
                  <span className="font-semibold">{formatCOP(closingPreview?.difference || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Servicios por tiquetera</span>
                  <span className="font-semibold">{closingPreview?.ticketWalletUnits || 0} uds</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsCloseModalOpen(false)}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleCloseCash}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white"
            >
              <Printer size={16} />
              {isBusy ? "Cerrando..." : "Cerrar caja y generar reporte"}
            </button>
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper
        open={Boolean(saleToSettle)}
        onClose={() => setSaleToSettle(null)}
        maxWidthClass="max-w-2xl"
        icon={{ main: <Wallet size={20} />, close: "X" }}
        title="Liquidar cuenta por cobrar"
        description="Selecciona el metodo de pago para mover este saldo pendiente al ingreso del dia."
      >
        <div className="grid gap-6">
          <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-900">{saleToSettle?.customer_name || "Cliente"}</p>
            <p className="mt-1 text-sm text-slate-500">
              Saldo pendiente {formatCOP(Number(saleToSettle?.pending_debt_remaining ?? saleToSettle?.debt_amount ?? 0))}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {["cash", "card", "transfer", "nequi", "daviplata"].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setSettlementMethod(method)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                  settlementMethod === method
                    ? "border-emerald-400 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {PAYMENT_METHOD_LABELS[method]}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSaleToSettle(null)}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSettleDebt}
              disabled={isBusy}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white"
            >
              {isBusy ? "Liquidando..." : "Liquidar saldo"}
            </button>
          </div>
        </div>
      </ModalWrapper>
    </>
  );
}
