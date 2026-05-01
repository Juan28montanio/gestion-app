import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock3,
  CreditCard,
  Pencil,
  Eye,
  Landmark,
  Printer,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";
import { subscribeToSalesHistory, updateSaleHistoryEntry } from "../services/financeService";
import { subscribeToPurchases, updatePurchaseMovement } from "../services/purchaseService";
import {
  createOperatingExpense,
  subscribeToOperatingExpenses,
  updateOperatingExpense,
} from "../services/operatingExpenseService";
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
import { buildOperationalSaleItemDetail } from "../utils/sales";
import {
  accumulatePaymentBreakdown,
  createEmptyPaymentTotals,
  normalizePaymentBreakdown,
  PAYMENT_METHOD_LABELS,
  paymentBreakdownIncludesMethod,
} from "../utils/payments";
import { useDecisionCenter } from "../app/decision-center/DecisionCenterContext";
import {
  buildAccountsReceivable,
  buildCashActionItems,
  buildClosingPreview,
  buildClosingPurchaseSummary,
  buildCashPressureQueue,
  buildExecutiveInsights,
  buildPaymentMethodCards,
  summarizeReceivables,
  buildSupplyChainInsights,
  createEmptyOperatingExpenseForm,
  formatDuration,
  getBalanceStatus,
  getLocalDateInputValue,
  getMovementVisual,
  getPreviousRangeConfig,
  getVariation,
  isInRange,
  normalizeDate,
  OPERATING_EXPENSE_CATEGORIES,
  PAYMENT_METHOD_STYLES,
  QUICK_FILTERS,
  RANGE_OPTIONS,
  movementMatchesPaymentFilter,
  summarizeMovements,
} from "../features/finance/dashboardHelpers";

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

function getMovementOperationalBadge(movement) {
  if (movement.type !== "income") {
    return null;
  }

  return movement.operationalType === "compuesto" ? "Venta compuesta" : "Venta directa";
}

export default function AdminDashboard({
  businessId,
  business,
  userProfile,
  currentUser,
  requestAuditPin,
}) {
  const { publishSectionInsights, clearSectionInsights, openDecisionCenter } = useDecisionCenter();
  const buildEmptyOperatingExpenseForm = () => createEmptyOperatingExpenseForm(getLocalDateKey);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [operatingExpenses, setOperatingExpenses] = useState([]);
  const [cashClosings, setCashClosings] = useState([]);
  const [openSession, setOpenSession] = useState(null);
  const [selectedRange, setSelectedRange] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateInputValue(getLocalDateKey));
  const [search, setSearch] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const [cashCounted, setCashCounted] = useState("");
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [saleToSettle, setSaleToSettle] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [movementToEdit, setMovementToEdit] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [operatingExpenseForm, setOperatingExpenseForm] = useState(buildEmptyOperatingExpenseForm);
  const [movementEditForm, setMovementEditForm] = useState({
    concept: "",
    total: "",
    paymentMethod: "cash",
  });
  const [settlementMethod, setSettlementMethod] = useState("cash");
  const [isBusy, setIsBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const unsubscribeSales = subscribeToSalesHistory(businessId, setSales);
    const unsubscribePurchases = subscribeToPurchases(businessId, setPurchases);
    const unsubscribeOperatingExpenses = subscribeToOperatingExpenses(businessId, setOperatingExpenses);
    const unsubscribeClosings = subscribeToCashClosings(businessId, setCashClosings);
    const unsubscribeOpenSession = subscribeToOpenCashSession(businessId, setOpenSession);

    return () => {
      unsubscribeSales();
      unsubscribePurchases();
      unsubscribeOperatingExpenses();
      unsubscribeClosings();
      unsubscribeOpenSession();
    };
  }, [businessId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const lockInfo = useMemo(() => getCashSessionLockInfo(openSession), [openSession]);

  const paymentMethodTotals = useMemo(() => {
    return sales.reduce(
      (accumulator, sale) => {
        accumulatePaymentBreakdown(
          accumulator,
          sale.payment_breakdown,
          sale.payment_method || "cash",
          Number(sale.total || 0)
        );
        return accumulator;
      },
      createEmptyPaymentTotals()
    );
  }, [sales]);

  const movements = useMemo(() => {
    const saleMovements = sales.map((sale) => ({
      id: `sale-${sale.id}`,
      type: "income",
      date: normalizeDate(sale.closed_at || sale.createdAt),
      concept:
        sale.concept ||
        (sale.customer_name
          ? `${sale.table_name || sale.table_id || "Mesa"} - ${sale.customer_name}`
          : sale.table_name || sale.table_id || "Venta POS"),
      category: (sale.items || []).map((item) => item.category).filter(Boolean).join(", "),
      details: (sale.items || []).map(buildOperationalSaleItemDetail).join(", "),
      amount: Number(sale.total || 0),
      paymentMethod: sale.payment_method || "cash",
      paymentBreakdown: normalizePaymentBreakdown(
        sale.payment_breakdown,
        sale.payment_method || "cash",
        Number(sale.total || 0)
      ),
      operationalType: (sale.items || []).some(
        (item) => String(item?.recipe_mode || item?.recipeMode || "direct") === "composed"
      )
        ? "compuesto"
        : "directo",
      raw: sale,
      source: "sale",
    }));

    const purchaseMovements = purchases.map((purchase) => ({
      id: `purchase-${purchase.id}`,
      type: "expense",
      date: normalizeDate(purchase.purchase_date),
      concept: purchase.concept || purchase.supplier_name || purchase.invoice_number || "Compra",
      category: [...new Set((purchase.items || []).map((item) => item.category).filter(Boolean))].join(", "),
      details: (purchase.items || []).map((item) => `${item.quantity}x ${item.ingredient_name}`).join(", "),
      amount: Number(purchase.total || 0),
      paymentMethod: purchase.payment_method || "cash",
      raw: purchase,
      source: "purchase",
    }));

    const operatingExpenseMovements = operatingExpenses.map((expense) => ({
      id: `expense-${expense.id}`,
      type: "expense",
      date: normalizeDate(expense.expense_date),
      concept: expense.concept || "Gasto operativo",
      category: expense.category || "Gasto general",
      details: expense.notes || expense.vendor_name || "Sin detalle adicional.",
      amount: Number(expense.total || expense.amount || 0),
      paymentMethod: expense.payment_method || "cash",
      raw: expense,
      source: "operating_expense",
    }));

    return [...saleMovements, ...purchaseMovements, ...operatingExpenseMovements].sort(
      (a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0)
    );
  }, [operatingExpenses, purchases, sales]);

  const filteredMovements = useMemo(() => {
    const term = search.trim().toLowerCase();

    return movements.filter((movement) => {
      const matchesRange = isInRange(movement.date, selectedRange, selectedDate);
      const matchesPayment = movementMatchesPaymentFilter(
        movement,
        selectedPaymentMethod,
        paymentBreakdownIncludesMethod
      );
      const searchable = `${movement.concept} ${movement.category} ${movement.details}`.toLowerCase();
      return matchesRange && matchesPayment && (!term || searchable.includes(term));
    });
  }, [movements, search, selectedDate, selectedPaymentMethod, selectedRange]);

  const previousRangeConfig = useMemo(
    () => getPreviousRangeConfig(getLocalDateKey, selectedRange, selectedDate),
    [selectedDate, selectedRange]
  );

  const previousFilteredMovements = useMemo(() => {
    return movements.filter((movement) =>
      isInRange(movement.date, previousRangeConfig.range, previousRangeConfig.selectedDate)
    );
  }, [movements, previousRangeConfig]);

  const todayKey = getLocalDateKey();
  const todayMovements = useMemo(
    () => movements.filter((movement) => movement.date && getLocalDateKey(movement.date) === todayKey),
    [movements, todayKey]
  );

  const todaySummary = useMemo(() => summarizeMovements(todayMovements), [todayMovements]);
  const accumulatedSummary = useMemo(() => summarizeMovements(movements), [movements]);
  const filteredSummary = useMemo(() => summarizeMovements(filteredMovements), [filteredMovements]);
  const previousFilteredSummary = useMemo(
    () => summarizeMovements(previousFilteredMovements),
    [previousFilteredMovements]
  );
  const balance = filteredSummary.income - filteredSummary.expense;
  const todayBalance = todaySummary.income - todaySummary.expense;
  const todayBalanceStatus = useMemo(() => getBalanceStatus(todayBalance), [todayBalance]);
  const balanceVariation = useMemo(
    () =>
      getVariation(
        filteredSummary.income - filteredSummary.expense,
        previousFilteredSummary.income - previousFilteredSummary.expense
      ),
    [filteredSummary, previousFilteredSummary]
  );

  const accountsReceivable = useMemo(
    () => buildAccountsReceivable(sales, normalizeDate),
    [sales]
  );

  const totalReceivable = useMemo(
    () => summarizeReceivables(accountsReceivable),
    [accountsReceivable]
  );

  const closingPreview = useMemo(
    () =>
      buildClosingPreview({
        openSession,
        todayMovements,
        cashCollected: paymentMethodTotals.cash,
        cashCounted,
      }),
    [cashCounted, openSession, paymentMethodTotals.cash, todayMovements]
  );
  const closingPurchaseSummary = useMemo(
    () => buildClosingPurchaseSummary(todayMovements, todaySummary.income),
    [todayMovements, todaySummary.income]
  );
  const closingDifference = Number(closingPreview?.difference || 0);
  const closingDifferenceTone =
    closingDifference === 0
      ? {
          label: "Cuadre exacto",
          classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
          text: "El conteo coincide con el efectivo esperado por el sistema.",
        }
      : closingDifference > 0
        ? {
            label: "Sobrante detectado",
            classes: "bg-amber-50 text-amber-700 ring-amber-200",
            text: "Hay mas efectivo contado que el esperado. Conviene revisar ajustes o cobros no registrados.",
          }
        : {
            label: "Faltante detectado",
            classes: "bg-rose-50 text-rose-700 ring-rose-200",
            text: "El efectivo contado es menor al esperado. Revisa egresos, devoluciones o diferencias de caja.",
          };
  const closingHistoryCards = useMemo(
    () =>
      cashClosings.slice(0, 6).map((closing) => {
        const isOpenCurrentSession = Boolean(openSession?.id) && closing.id === openSession.id;

        if (!isOpenCurrentSession || closing.status !== "open") {
          return {
            ...closing,
            displaySalesTotal: Number(closing.sales_total || 0),
            displayExpensesTotal: Number(closing.expenses_total || 0),
            displayNetBalance: Number(closing.net_balance || 0),
          };
        }

        return {
          ...closing,
          displaySalesTotal: Number(todaySummary.income || 0),
          displayExpensesTotal: Number(todaySummary.expense || 0),
          displayNetBalance: Number(todaySummary.income || 0) - Number(todaySummary.expense || 0),
        };
      }),
    [cashClosings, openSession?.id, todaySummary.expense, todaySummary.income]
  );

  const boxOpenDuration = useMemo(() => {
    const openedAt = normalizeDate(openSession?.opened_at || openSession?.createdAt);
    if (!openedAt) {
      return null;
    }

    const elapsed = now.getTime() - openedAt.getTime();
    return {
      label: formatDuration(elapsed),
      isAlert: elapsed >= 15 * 60 * 60 * 1000,
    };
  }, [now, openSession]);

  const paymentMethodCards = useMemo(
    () =>
      buildPaymentMethodCards({
        filteredIncome: filteredSummary.income,
        paymentMethodTotals,
        previousFilteredIncome: previousFilteredSummary.income,
        previousFilteredMovements,
        paymentMatcher: paymentBreakdownIncludesMethod,
      }),
    [
      filteredSummary.income,
      paymentMethodTotals,
      previousFilteredMovements,
      previousFilteredSummary.income,
    ]
  );
  const executiveInsights = useMemo(
    () =>
      buildExecutiveInsights({
        balance,
        filteredSummary,
        totalReceivable,
        accountsReceivableCount: accountsReceivable.length,
        paymentMethodTotals,
        incomeTotal: filteredSummary.income,
        openSession,
      }),
    [accountsReceivable.length, balance, filteredSummary, openSession, paymentMethodTotals, totalReceivable]
  );
  const cashActionItems = useMemo(
    () =>
      buildCashActionItems({
        lockInfo,
        openSession,
        boxOpenDuration,
        totalReceivable,
        accountsReceivableCount: accountsReceivable.length,
        closingPreview,
      }),
    [accountsReceivable.length, boxOpenDuration, closingPreview, lockInfo, openSession, totalReceivable]
  );
  const filteredPurchases = useMemo(
    () =>
      purchases.filter((purchase) =>
        isInRange(normalizeDate(purchase.purchase_date), selectedRange, selectedDate)
      ),
    [purchases, selectedDate, selectedRange]
  );
  const supplyChainInsights = useMemo(
    () => buildSupplyChainInsights(filteredPurchases, filteredSummary),
    [filteredPurchases, filteredSummary]
  );
  const cashPressureQueue = useMemo(
    () =>
      buildCashPressureQueue({
        purchases: filteredPurchases,
        receivableTotal: totalReceivable,
        receivableCount: accountsReceivable.length,
        lockInfo,
      }),
    [accountsReceivable.length, filteredPurchases, lockInfo, totalReceivable]
  );
  const financeDecisionItems = useMemo(
    () => [
      ...executiveInsights.map((item) => ({
        title: item.title,
        body: item.body,
        tone: item.accent,
        icon: "sparkles",
      })),
      ...cashActionItems.map((item) => ({
        title: item.title,
        body: item.body,
        tone: item.tone,
        icon: "lightbulb",
      })),
      ...supplyChainInsights.map((item) => ({
        title: item.title,
        body: item.body,
        tone: item.tone,
        icon: "sparkles",
      })),
      ...cashPressureQueue.map((item) => ({
        title: item.title,
        body: item.body,
        tone: item.tone,
        icon: "lightbulb",
      })),
    ],
    [cashActionItems, cashPressureQueue, executiveInsights, supplyChainInsights]
  );
  const financeDecisionSummary = useMemo(() => {
    if (lockInfo.blocked) {
      return "La caja necesita atencion inmediata y el centro de decisiones concentra la lectura del turno para no saturar la pantalla principal.";
    }

    if (totalReceivable > 0) {
      return `Hay ${accountsReceivable.length} cuenta(s) pendiente(s) y una lectura cruzada de caja, compras y rentabilidad lista para revisar en un solo panel.`;
    }

    return "La pantalla principal queda enfocada en operar y el analisis ejecutivo se concentra en el centro de decisiones.";
  }, [accountsReceivable.length, lockInfo.blocked, totalReceivable]);

  useEffect(() => {
    publishSectionInsights("finance", {
      eyebrow: "Caja y finanzas",
      title: "Lectura ejecutiva del turno",
      summary: financeDecisionSummary,
      items: financeDecisionItems,
    });

    return () => clearSectionInsights("finance");
  }, [
    clearSectionInsights,
    financeDecisionItems,
    financeDecisionSummary,
    publishSectionInsights,
  ]);

  const applyQuickFilter = (range, dateValue) => {
    setSelectedRange(range);
    setSelectedDate(dateValue);
  };

  const handleOpenCash = async () => {
    setIsBusy(true);
    try {
      await openCashSession(businessId, {
        cashierName:
          userProfile?.display_name || currentUser?.displayName || currentUser?.email || "Operador SmartProfit",
        cashierEmail: currentUser?.email || userProfile?.email || "",
      });
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
        context: {
          businessName: business?.name || "SmartProfit",
          operatorName:
            userProfile?.display_name || currentUser?.displayName || currentUser?.email || "Operador SmartProfit",
          cashierEmail: currentUser?.email || userProfile?.email || "",
        },
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

  const closeOperatingExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setOperatingExpenseForm(buildEmptyOperatingExpenseForm());
  };

  const handleSaveOperatingExpense = async () => {
    const concept = String(operatingExpenseForm.concept || "").trim();
    const amount = Number(operatingExpenseForm.amount);

    if (!concept) {
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    setIsBusy(true);
    try {
      await createOperatingExpense({
        business_id: businessId,
        concept,
        category: operatingExpenseForm.category,
        amount,
        expense_date: operatingExpenseForm.expenseDate,
        payment_method: operatingExpenseForm.paymentMethod,
        vendor_name: operatingExpenseForm.vendorName,
        notes: operatingExpenseForm.notes,
      });
      closeOperatingExpenseModal();
    } finally {
      setIsBusy(false);
    }
  };

  const openMovementEditor = async (movement) => {
    const isAuthorized = await requestAuditPin?.({
      title: "Validar PIN de auditoria",
      description: "Confirma el PIN para editar un movimiento financiero.",
    });

    if (!isAuthorized) {
      return;
    }

    setMovementToEdit(movement);
    setMovementEditForm({
      concept: movement.concept || "",
      total: String(movement.amount ?? ""),
      paymentMethod:
        movement.type === "income"
          ? movement.paymentMethod || "cash"
          : movement.source === "operating_expense"
            ? movement.paymentMethod || "cash"
            : "cash",
    });
  };

  const handleSaveMovementEdit = async () => {
    if (!movementToEdit) {
      return;
    }

    const concept = String(movementEditForm.concept || "").trim();
    const total = Number(movementEditForm.total);

    if (!concept) {
      return;
    }

    if (!Number.isFinite(total) || total <= 0) {
      return;
    }

    setIsBusy(true);
    try {
      if (movementToEdit.type === "income") {
        await updateSaleHistoryEntry(movementToEdit.raw.id, {
          concept,
          total,
          paymentMethod: movementEditForm.paymentMethod,
        });
      } else if (movementToEdit.source === "operating_expense") {
        await updateOperatingExpense(movementToEdit.raw.id, {
          concept,
          amount: total,
          paymentMethod: movementEditForm.paymentMethod,
        });
      } else {
        await updatePurchaseMovement(movementToEdit.raw.id, {
          concept,
          total,
        });
      }

      setMovementToEdit(null);
    } finally {
      setIsBusy(false);
    }
  };

  const canSaveOperatingExpense =
    String(operatingExpenseForm.concept || "").trim().length > 0 &&
    Number.isFinite(Number(operatingExpenseForm.amount)) &&
    Number(operatingExpenseForm.amount) > 0;

  const canSaveMovementEdit =
    String(movementEditForm.concept || "").trim().length > 0 &&
    Number.isFinite(Number(movementEditForm.total)) &&
    Number(movementEditForm.total) > 0;

  return (
    <>
      <section className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Resultado del dia
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">{formatCOP(todayBalance)}</p>
            <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${todayBalanceStatus.classes}`}>
              {todayBalanceStatus.label}
            </span>
          </article>
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Ventas del dia
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">{formatCOP(todaySummary.income)}</p>
            <p className="mt-2 text-sm text-slate-500">Ingreso registrado en la jornada actual.</p>
          </article>
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Gastos del dia
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">{formatCOP(todaySummary.expense)}</p>
            <p className="mt-2 text-sm text-slate-500">Compras y egresos cargados hoy.</p>
          </article>
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Cartera pendiente
            </p>
            <p className="mt-3 text-3xl font-black text-slate-950">{formatCOP(totalReceivable)}</p>
            <p className="mt-2 text-sm text-slate-500">Saldo por recuperar de clientes.</p>
          </article>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Centro de decisiones
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {financeDecisionSummary}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold ${
                  financeDecisionItems.length > 0
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {financeDecisionItems.length} lectura{financeDecisionItems.length === 1 ? "" : "s"} activa{financeDecisionItems.length === 1 ? "" : "s"}
              </div>
              <button
                type="button"
                onClick={openDecisionCenter}
                disabled={financeDecisionItems.length === 0}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  financeDecisionItems.length > 0
                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                Ver panel
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-white/85 p-6 shadow-lg ring-1 ring-white/70 backdrop-blur">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Dashboard de caja</h2>
              <p className="text-sm text-slate-500">
                Controla la caja del dia, el acumulado historico y las cuentas por cobrar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ReceiptText size={16} />
                Registrar gasto
              </button>
              {openSession && boxOpenDuration ? (
                <div
                  className={`inline-flex items-center gap-3 rounded-2xl px-4 py-2.5 ring-1 ${
                    boxOpenDuration.isAlert
                      ? "bg-rose-50 text-rose-800 ring-rose-200"
                      : "bg-slate-50 text-slate-700 ring-slate-200"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      boxOpenDuration.isAlert ? "bg-rose-100 text-rose-700" : "bg-white text-slate-600"
                    }`}
                  >
                    <Clock3 size={16} />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                      Caja abierta
                    </p>
                    <p className={`text-sm font-semibold ${boxOpenDuration.isAlert ? "animate-pulse" : ""}`}>
                      {boxOpenDuration.label}
                    </p>
                  </div>
                </div>
              ) : null}
              {openSession ? (
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#a56c00_0%,#d4a72c_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-900/20"
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
              <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Variacion del periodo
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {balanceVariation.label}
                </p>
              </div>
            </div>
          </div>

            {lockInfo.blocked ? (
              <div className="mb-6 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                {lockInfo.message}
              </div>
            ) : null}

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] p-6 text-white ring-1 ring-slate-950/10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Balance del periodo</p>
              <p className="mt-3 text-4xl font-black">{formatCOP(balance)}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-emerald-200">
                  Ingresos {formatCOP(filteredSummary.income)}
                </span>
                <span className="rounded-full bg-rose-400/10 px-3 py-1 text-rose-200">
                  Egresos {formatCOP(filteredSummary.expense)}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">
                  {balanceVariation.label}
                </span>
              </div>
            </article>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-[28px] bg-emerald-50 p-5 ring-1 ring-emerald-200">
                <p className="text-sm font-semibold text-emerald-700">Ventas hoy</p>
                <p className="mt-2 text-2xl font-black text-emerald-950">{formatCOP(todaySummary.income)}</p>
              </article>
              <article className="rounded-[28px] bg-rose-50 p-5 ring-1 ring-rose-200">
                <p className="text-sm font-semibold text-rose-700">Gastos hoy</p>
                <p className="mt-2 text-2xl font-black text-rose-950">{formatCOP(todaySummary.expense)}</p>
              </article>
              <article className="rounded-[28px] bg-white p-5 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-500">Ventas acumuladas</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{formatCOP(accumulatedSummary.income)}</p>
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

            <div className="grid gap-3 xl:min-w-[620px]">
              <div className="flex flex-wrap gap-2">
                {QUICK_FILTERS.map((filter) => {
                  const filterDate = filter.getDate(getLocalDateInputValue, getLocalDateKey);
                  const isActive =
                    selectedRange === filter.range && selectedDate === filterDate;
                  return (
                    <button
                      key={filter.label}
                      type="button"
                      onClick={() => applyQuickFilter(filter.range, filterDate)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/15"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
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

          <div className="mb-6 rounded-[28px] border border-amber-200 bg-[#fff7df] p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#946200]">Cartera pendiente</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{formatCOP(totalReceivable)}</p>
              </div>
              <p className="max-w-xl text-sm text-slate-600">
                Este valor no hace parte del efectivo real en caja. SmartProfit lo mantiene separado para no inflar el cierre del turno.
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {paymentMethodCards.map(({ method, total, variation }) => {
              const isActive = selectedPaymentMethod === method;
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
                  <p className={`mt-1 text-xs ${isActive ? "text-white/80" : "text-slate-500"}`}>
                    {variation.label}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 xl:hidden">
            {filteredMovements.map((movement) => {
              const visual = getMovementVisual(movement);
              const Icon = visual.icon;
              const operationalBadge = getMovementOperationalBadge(movement);

              return (
                <article
                  key={`movement-card-${movement.id}`}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${visual.iconWrap}`}>
                          <Icon size={16} />
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${visual.accent}`}>
                          {visual.badge}
                        </span>
                        {operationalBadge ? (
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                              movement.operationalType === "compuesto"
                                ? "bg-[#fff7df] text-[#946200]"
                                : "bg-white text-slate-500 ring-1 ring-slate-200"
                            }`}
                          >
                            {operationalBadge}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-900">{movement.concept}</p>
                      <p className="mt-1 text-sm text-slate-500">{movement.category || "General"}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{movement.details || "-"}</p>
                    </div>
                    <p
                      className={`shrink-0 text-right font-mono text-sm font-semibold ${
                        movement.type === "income" ? "text-emerald-800" : "text-rose-800"
                      }`}
                    >
                      {movement.type === "income" ? "+" : "-"}
                      {formatCOP(movement.amount)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                        {movement.type === "income"
                          ? PAYMENT_METHOD_LABELS[movement.paymentMethod] || movement.paymentMethod
                          : "Egreso"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {movement.date
                          ? new Intl.DateTimeFormat("es-CO", {
                              dateStyle: "short",
                              timeStyle: "short",
                            }).format(movement.date)
                          : "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMovement(movement)}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                      >
                        <Eye size={12} />
                        Ver detalle
                      </button>
                      <button
                        type="button"
                        onClick={() => openMovementEditor(movement)}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200"
                      >
                        <Pencil size={12} />
                        Editar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto xl:block">
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
                  <tr key={movement.id} className="group border-b border-slate-100 text-slate-700">
                    <td className="py-3 pr-4">
                      {(() => {
                        const visual = getMovementVisual(movement);
                        const Icon = visual.icon;
                        return (
                          <div className="flex items-center gap-3">
                            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${visual.iconWrap}`}>
                              <Icon size={16} />
                            </span>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${visual.accent}`}>
                              {visual.badge}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      <div className="space-y-1">
                        <p>{movement.concept}</p>
                        <div className="flex items-center gap-2 opacity-100 transition xl:opacity-0 xl:group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => setSelectedMovement(movement)}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                          >
                            <Eye size={12} />
                            Ver detalle
                          </button>
                          <button
                            type="button"
                            onClick={() => openMovementEditor(movement)}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                          >
                            <Pencil size={12} />
                            Editar con PIN
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {movement.type === "income" ? (
                        <div className="space-y-1">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              movement.paymentMethod === "ticket_wallet"
                                ? "bg-[#fff7df] text-[#946200]"
                                : movement.paymentMethod === "split"
                                  ? "bg-sky-50 text-sky-700"
                                  : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {PAYMENT_METHOD_LABELS[movement.paymentMethod] || movement.paymentMethod}
                          </span>
                          {movement.paymentBreakdown?.length > 1 ? (
                            <p className="text-xs text-slate-500">
                              {movement.paymentBreakdown
                                .map(
                                  (line) =>
                                    `${PAYMENT_METHOD_LABELS[line.method] || line.method}: ${formatCOP(
                                      line.amount
                                    )}`
                                )
                                .join(" · ")}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          Compra
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">{movement.category || "General"}</td>
                    <td className="py-3 pr-4">
                      <div className="space-y-1">
                        <p className="line-clamp-2 max-w-[320px]">{movement.details || "-"}</p>
                        {getMovementOperationalBadge(movement) ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                              movement.operationalType === "compuesto"
                                ? "bg-[#fff7df] text-[#946200]"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {getMovementOperationalBadge(movement)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      {movement.date
                        ? new Intl.DateTimeFormat("es-CO", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(movement.date)
                        : "-"}
                    </td>
                    <td
                      className={`py-3 pr-4 text-right font-mono font-semibold ${
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
            {closingHistoryCards.map((closing) => (
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
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatCOP(closing.displaySalesTotal || 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-200">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Gastos</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatCOP(closing.displayExpensesTotal || 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-200">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Balance</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{formatCOP(closing.displayNetBalance || 0)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <ModalWrapper
        open={isExpenseModalOpen}
        onClose={closeOperatingExpenseModal}
        maxWidthClass="max-w-3xl"
        icon={{ main: <ReceiptText size={20} />, close: "X" }}
        title="Registrar gasto operativo"
        description="Registra servicios, arriendo, nomina u otros egresos sin mezclarlo con compras de insumos."
      >
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Concepto</span>
              <input
                value={operatingExpenseForm.concept}
                onChange={(event) =>
                  setOperatingExpenseForm((current) => ({
                    ...current,
                    concept: event.target.value,
                  }))
                }
                placeholder="Ej. Factura de energia abril"
                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Categoria</span>
              <select
                value={operatingExpenseForm.category}
                onChange={(event) =>
                  setOperatingExpenseForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
              >
                {OPERATING_EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Valor</span>
              <input
                type="number"
                min="0"
                step="1"
                value={operatingExpenseForm.amount}
                onChange={(event) =>
                  setOperatingExpenseForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Fecha</span>
              <input
                type="date"
                value={operatingExpenseForm.expenseDate}
                onChange={(event) =>
                  setOperatingExpenseForm((current) => ({
                    ...current,
                    expenseDate: event.target.value,
                  }))
                }
                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Metodo de pago</span>
              <select
                value={operatingExpenseForm.paymentMethod}
                onChange={(event) =>
                  setOperatingExpenseForm((current) => ({
                    ...current,
                    paymentMethod: event.target.value,
                  }))
                }
                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
              >
                {["cash", "card", "transfer", "nequi", "daviplata"].map((method) => (
                  <option key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Pagado a</span>
              <input
                value={operatingExpenseForm.vendorName}
                onChange={(event) =>
                  setOperatingExpenseForm((current) => ({
                    ...current,
                    vendorName: event.target.value,
                  }))
                }
                placeholder="Empresa o responsable"
                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Notas</span>
              <input
                value={operatingExpenseForm.notes}
                onChange={(event) =>
                  setOperatingExpenseForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Detalle breve del gasto"
                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4 text-sm leading-6 text-slate-600">
            Este gasto se vera en finanzas como egreso operativo y, si fue pagado en efectivo, afectara el arqueo esperado del cierre de caja.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={closeOperatingExpenseModal}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveOperatingExpense}
              disabled={isBusy || !canSaveOperatingExpense}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy ? "Guardando..." : "Registrar gasto"}
            </button>
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper
        open={Boolean(selectedMovement)}
        onClose={() => setSelectedMovement(null)}
        maxWidthClass="max-w-3xl"
        icon={{ main: <Eye size={20} />, close: "X" }}
        title="Detalle de transaccion"
        description="Consulta origen, metodo y detalle operativo de este movimiento."
      >
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Concepto</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{selectedMovement?.concept || "-"}</p>
              <p className="mt-4 text-sm text-slate-500">{selectedMovement?.details || "Sin detalle adicional."}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Valor</p>
              <p
                className={`mt-2 text-2xl font-black ${
                  selectedMovement?.type === "income" ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {selectedMovement
                  ? `${selectedMovement.type === "income" ? "+" : "-"}${formatCOP(selectedMovement.amount)}`
                  : "-"}
              </p>
              <p className="mt-4 text-sm text-slate-500">
                {selectedMovement?.date
                  ? new Intl.DateTimeFormat("es-CO", {
                      dateStyle: "full",
                      timeStyle: "short",
                    }).format(selectedMovement.date)
                  : "Sin fecha"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Medio y categoria</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">Metodo</p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedMovement
                    ? PAYMENT_METHOD_LABELS[selectedMovement.paymentMethod] || selectedMovement.paymentMethod
                    : "-"}
                </p>
                {selectedMovement?.paymentBreakdown?.length > 1 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedMovement.paymentBreakdown
                      .map(
                        (line) =>
                          `${PAYMENT_METHOD_LABELS[line.method] || line.method}: ${formatCOP(line.amount)}`
                      )
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Categoria</p>
                <p className="mt-1 text-sm text-slate-500">{selectedMovement?.category || "General"}</p>
              </div>
            </div>
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper
        open={Boolean(movementToEdit)}
        onClose={() => setMovementToEdit(null)}
        maxWidthClass="max-w-2xl"
        icon={{ main: <Pencil size={20} />, close: "X" }}
        title="Editar movimiento"
        description="Aplica un ajuste administrativo sin salir del dashboard financiero."
      >
        <div className="grid gap-6">
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Concepto</span>
              <input
                value={movementEditForm.concept}
                onChange={(event) =>
                  setMovementEditForm((current) => ({ ...current, concept: event.target.value }))
                }
                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              <span>Valor</span>
              <input
                type="number"
                min="0"
                step="1"
                value={movementEditForm.total}
                onChange={(event) =>
                  setMovementEditForm((current) => ({ ...current, total: event.target.value }))
                }
                className="h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            {movementToEdit?.type === "income" || movementToEdit?.source === "operating_expense" ? (
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                <span>Metodo de pago</span>
                <select
                  value={movementEditForm.paymentMethod}
                  onChange={(event) =>
                    setMovementEditForm((current) => ({
                      ...current,
                      paymentMethod: event.target.value,
                    }))
                  }
                  className="h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10"
                >
                  {["cash", "card", "transfer", "nequi", "daviplata", "ticket_wallet"].map(
                    (method) => (
                      <option key={method} value={method}>
                        {PAYMENT_METHOD_LABELS[method]}
                      </option>
                    )
                  )}
                </select>
              </label>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMovementToEdit(null)}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveMovementEdit}
              disabled={isBusy || !canSaveMovementEdit}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy ? "Guardando..." : "Guardar ajuste"}
            </button>
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper
        open={isCloseModalOpen}
        onClose={() => {
          setIsCloseModalOpen(false);
          setCashCounted("");
        }}
        maxWidthClass="max-w-4xl"
        icon={{ main: <ReceiptText size={20} />, close: "X" }}
        title="Cierre de caja"
        description="Revisa el conteo, confirma el resumen y cierra la jornada con su reporte."
      >
        <div className="grid gap-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_320px]">
            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Resumen del turno
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Ventas</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCOP(todaySummary.income)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Gastos</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCOP(todaySummary.expense)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                  <p className="text-xs text-slate-500">Balance</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCOP(todaySummary.income - todaySummary.expense)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Estado del cuadre
              </p>
              <span
                className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${closingDifferenceTone.classes}`}
              >
                {closingDifferenceTone.label}
              </span>
              <p className="mt-3 text-sm leading-6 text-slate-600">{closingDifferenceTone.text}</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Contexto del turno
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {closingPurchaseSummary.count
                ? `Durante esta jornada se registraron ${closingPurchaseSummary.count} compra(s) por ${formatCOP(closingPurchaseSummary.total)}. ${
                    closingPurchaseSummary.sharePct !== null
                      ? `Eso representa el ${closingPurchaseSummary.sharePct.toFixed(0)}% del ingreso del dia. `
                      : ""
                  }${
                    closingPurchaseSummary.topSupplierName
                      ? `El proveedor de mayor peso fue ${closingPurchaseSummary.topSupplierName} con ${formatCOP(closingPurchaseSummary.topSupplierTotal)}.`
                      : ""
                  }`
                : "No hay compras registradas en la jornada. El cierre se concentrara en ventas, recaudo y arqueo de caja."}
            </p>
          </div>

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
              <p className="mt-2 text-sm text-slate-600">
                Compara el efectivo esperado contra el conteo real antes de emitir el reporte final.
              </p>
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
                  <span
                    className={`font-semibold ${
                      closingDifference === 0
                        ? "text-emerald-700"
                        : closingDifference > 0
                          ? "text-amber-700"
                          : "text-rose-700"
                    }`}
                  >
                    {formatCOP(closingPreview?.difference || 0)}
                  </span>
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
              onClick={() => {
                setIsCloseModalOpen(false);
                setCashCounted("");
              }}
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
              {isBusy ? "Cerrando..." : "Cerrar caja y emitir reporte"}
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
