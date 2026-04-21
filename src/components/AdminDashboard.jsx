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
  Store,
  Truck,
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
import {
  accumulatePaymentBreakdown,
  createEmptyPaymentTotals,
  normalizePaymentBreakdown,
  PAYMENT_METHOD_LABELS,
  paymentBreakdownIncludesMethod,
} from "../utils/payments";
import { useDecisionCenter } from "../app/decision-center/DecisionCenterContext";

const RANGE_OPTIONS = [
  { value: "daily", label: "Diario" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "annual", label: "Anual" },
  { value: "custom", label: "Fecha puntual" },
];

const QUICK_FILTERS = [
  { label: "Hoy", range: "daily", getDate: () => getLocalDateInputValue(new Date()) },
  {
    label: "Ayer",
    range: "custom",
    getDate: () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return getLocalDateInputValue(date);
    },
  },
  { label: "Esta semana", range: "weekly", getDate: () => getLocalDateInputValue(new Date()) },
  { label: "Mes", range: "monthly", getDate: () => getLocalDateInputValue(new Date()) },
];

const OPERATING_EXPENSE_CATEGORIES = [
  "Energia",
  "Agua",
  "Arriendo",
  "Internet",
  "Nomina",
  "Mantenimiento",
  "Impuestos",
  "Aseo",
  "Transporte",
  "Otros",
];

const EMPTY_OPERATING_EXPENSE_FORM = {
  concept: "",
  category: "Energia",
  amount: "",
  expenseDate: getLocalDateInputValue(new Date()),
  paymentMethod: "cash",
  vendorName: "",
  notes: "",
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

function getPreviousRangeConfig(range, selectedDate) {
  const base = selectedDate ? parseLocalDateInput(selectedDate) : new Date();

  if (range === "daily" || range === "custom") {
    const previous = new Date(base);
    previous.setDate(previous.getDate() - 1);
    return { range: "custom", selectedDate: getLocalDateInputValue(previous) };
  }

  if (range === "weekly") {
    const previous = new Date(base);
    previous.setDate(previous.getDate() - 7);
    return { range: "weekly", selectedDate: getLocalDateInputValue(previous) };
  }

  if (range === "monthly") {
    const previous = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    return { range: "monthly", selectedDate: getLocalDateInputValue(previous) };
  }

  if (range === "annual") {
    const previous = new Date(base.getFullYear() - 1, 0, 1);
    return { range: "annual", selectedDate: getLocalDateInputValue(previous) };
  }

  return { range, selectedDate };
}

function getVariation(current, previous) {
  if (!previous) {
    return { value: null, label: "Sin base comparativa" };
  }

  const delta = ((current - previous) / previous) * 100;
  const sign = delta > 0 ? "+" : "";
  return {
    value: delta,
    label: `${sign}${delta.toFixed(0)}% vs periodo anterior`,
  };
}

function formatDuration(durationMs) {
  const totalMinutes = Math.max(Math.floor(durationMs / 60000), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}min`;
}

function getBalanceStatus(balance) {
  if (balance > 0) {
    return {
      label: "Dia rentable",
      classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }

  if (balance < 0) {
    return {
      label: "Margen en riesgo",
      classes: "bg-rose-50 text-rose-700 ring-rose-200",
    };
  }

  return {
    label: "Punto de equilibrio",
    classes: "bg-slate-100 text-slate-700 ring-slate-200",
  };
}

function getMovementVisual(movement) {
  if (movement.type === "expense" && movement.source === "operating_expense") {
    return {
      icon: ReceiptText,
      badge: "Gasto operativo",
      accent: "bg-amber-50 text-amber-700 ring-amber-200",
      iconWrap: "bg-amber-50 text-amber-600",
    };
  }

  if (movement.type === "expense") {
    return {
      icon: Truck,
      badge: "Compra",
      accent: "bg-rose-50 text-rose-700 ring-rose-200",
      iconWrap: "bg-rose-50 text-rose-600",
    };
  }

  if (movement.raw?.table_id === "quick_sale" || movement.raw?.table_name === "Mostrador") {
    return {
      icon: Wallet,
      badge: "Venta rapida",
      accent: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      iconWrap: "bg-emerald-50 text-emerald-600",
    };
  }

  return {
    icon: Store,
    badge: "Salon",
    accent: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    iconWrap: "bg-emerald-50 text-emerald-600",
  };
}

function buildExecutiveInsights({
  balance,
  filteredSummary,
  totalReceivable,
  accountsReceivableCount,
  paymentMethodTotals,
  incomeTotal,
  openSession,
}) {
  const cashShare = incomeTotal > 0 ? (Number(paymentMethodTotals.cash || 0) / incomeTotal) * 100 : 0;
  const cardShare =
    incomeTotal > 0
      ? ((Number(paymentMethodTotals.card || 0) +
          Number(paymentMethodTotals.transfer || 0) +
          Number(paymentMethodTotals.nequi || 0) +
          Number(paymentMethodTotals.daviplata || 0)) /
          incomeTotal) *
        100
      : 0;

  const insights = [
    balance >= 0
      ? {
          title: "Rentabilidad del periodo",
          body:
            filteredSummary.expense === 0
              ? "No hay egresos filtrados en este rango. Revisa si falta registrar compras para leer la utilidad real."
              : "El periodo actual mantiene saldo positivo. Este es buen momento para revisar que los costos cargados sigan al dia.",
          accent: "bg-emerald-50 text-emerald-800 ring-emerald-200",
          icon: ArrowUpCircle,
        }
      : {
          title: "Margen en riesgo",
          body: "Los egresos filtrados ya superan el ingreso del periodo. Conviene revisar compras recientes, deuda y productos menos rentables.",
          accent: "bg-rose-50 text-rose-800 ring-rose-200",
          icon: ArrowDownCircle,
        },
    totalReceivable > 0
      ? {
          title: "Dinero por recuperar",
          body: `Hay ${accountsReceivableCount} venta${accountsReceivableCount === 1 ? "" : "s"} con saldo pendiente. Recuperar esta cartera mejora caja sin depender de nuevas ventas.`,
          accent: "bg-amber-50 text-amber-800 ring-amber-200",
          icon: Landmark,
        }
      : {
          title: "Cartera controlada",
          body: "No hay deuda pendiente en clientes para este momento. La caja depende de lo que ya se esta cobrando en la operacion.",
          accent: "bg-sky-50 text-sky-800 ring-sky-200",
          icon: CreditCard,
        },
    {
      title: cashShare >= cardShare ? "Dependencia de efectivo" : "Cobros digitales activos",
      body:
        cashShare >= cardShare
          ? `El ${cashShare.toFixed(0)}% del ingreso llega por efectivo. Mantener caja abierta demasiado tiempo aumenta riesgo operativo.`
          : `El ${cardShare.toFixed(0)}% del ingreso llega por pagos digitales. Esto reduce presion sobre el efectivo disponible en caja.`,
      accent: "bg-slate-100 text-slate-800 ring-slate-200",
      icon: Wallet,
    },
  ];

  if (!openSession) {
    insights.push({
      title: "Caja pendiente de apertura",
      body: "Antes de iniciar la jornada conviene abrir caja para que los movimientos del dia queden trazados desde el inicio.",
      accent: "bg-[#fff7df] text-[#7a5500] ring-[#d4a72c]/25",
      icon: ReceiptText,
    });
  }

  return insights.slice(0, 3);
}

function buildCashActionItems({
  lockInfo,
  openSession,
  boxOpenDuration,
  totalReceivable,
  accountsReceivableCount,
  closingPreview,
}) {
  const items = [];

  if (lockInfo.blocked) {
    items.push({
      title: "Resolver cierre pendiente",
      body: lockInfo.message,
      eyebrow: "Accion inmediata",
      tone: "bg-amber-50 text-amber-900 ring-amber-200",
      icon: ReceiptText,
    });
  } else if (!openSession) {
    items.push({
      title: "Abrir caja para iniciar jornada",
      body: "Abre caja al comenzar el turno para que ventas, egresos y diferencias queden trazados desde el inicio.",
      eyebrow: "Inicio del dia",
      tone: "bg-emerald-50 text-emerald-900 ring-emerald-200",
      icon: Wallet,
    });
  } else {
    items.push({
      title: "Caja operativa en curso",
      body: boxOpenDuration?.isAlert
        ? `La caja lleva ${boxOpenDuration.label} abierta. Conviene planear el cierre para reducir riesgo operativo.`
        : `La jornada sigue activa${boxOpenDuration?.label ? ` desde hace ${boxOpenDuration.label}` : ""}. Mantén compras y cobros actualizados.`,
      eyebrow: "Seguimiento del turno",
      tone: boxOpenDuration?.isAlert
        ? "bg-rose-50 text-rose-900 ring-rose-200"
        : "bg-slate-100 text-slate-800 ring-slate-200",
      icon: Clock3,
    });
  }

  if (totalReceivable > 0) {
    items.push({
      title: "Recuperar cartera mejora caja",
      body: `Hay ${accountsReceivableCount} cuenta${accountsReceivableCount === 1 ? "" : "s"} pendiente${accountsReceivableCount === 1 ? "" : "s"} por ${formatCOP(totalReceivable)}. Liquidarlas mejora el dia sin depender de nuevas ventas.`,
      eyebrow: "Flujo de caja",
      tone: "bg-[#fff7df] text-[#7a5500] ring-[#d4a72c]/25",
      icon: Landmark,
    });
  } else {
    items.push({
      title: "Sin deuda pendiente de clientes",
      body: "La caja actual depende de ventas nuevas y no de saldos atrasados por recuperar.",
      eyebrow: "Control de cartera",
      tone: "bg-sky-50 text-sky-900 ring-sky-200",
      icon: CreditCard,
    });
  }

  if (openSession && closingPreview) {
    items.push({
      title: "Ten listo el conteo fisico",
      body: `El cierre espera ${formatCOP(closingPreview.expectedCash || 0)} en efectivo. Tener este valor presente acelera la validacion final del turno.`,
      eyebrow: "Preparacion del cierre",
      tone: "bg-white text-slate-900 ring-slate-200",
      icon: Printer,
    });
  }

  return items.slice(0, 3);
}

function buildSupplyChainInsights(purchases, filteredSummary) {
  const purchaseCount = purchases.length;
  const totalPurchases = purchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);
  const topSupplierMap = purchases.reduce((accumulator, purchase) => {
    const key = purchase.supplier_name || "Sin proveedor";
    accumulator[key] = (accumulator[key] || 0) + Number(purchase.total || 0);
    return accumulator;
  }, {});
  const topSupplierEntry = Object.entries(topSupplierMap).sort((a, b) => b[1] - a[1])[0];
  const spendShare =
    filteredSummary.income > 0 ? (totalPurchases / filteredSummary.income) * 100 : null;

  return [
    {
      title: "Presion de compras en caja",
      body:
        purchaseCount > 0
          ? spendShare !== null
            ? `Las compras del rango suman ${formatCOP(totalPurchases)} y equivalen al ${spendShare.toFixed(0)}% del ingreso filtrado.`
            : `Hay ${purchaseCount} compra(s) registradas por ${formatCOP(totalPurchases)} en este rango, aun sin ingresos suficientes para compararlas.`
          : "No hay compras registradas en este rango. Si el negocio opero, revisa si falta cargar abastecimiento.",
      tone: "bg-white text-slate-900 ring-slate-200",
    },
    {
      title: "Proveedor dominante del periodo",
      body: topSupplierEntry
        ? `${topSupplierEntry[0]} concentra ${formatCOP(topSupplierEntry[1])} en compras dentro del rango. Conviene revisar dependencia y negociar mejor ese frente.`
        : "Todavia no hay un proveedor dominante en este rango porque no hay compras filtradas.",
      tone: "bg-slate-50 text-slate-900 ring-slate-200",
    },
    {
      title: "Lectura cruzada operacion-finanzas",
      body:
        purchaseCount > 0
          ? "Cruza estas compras con insumos criticos y fichas tecnicas para validar si el gasto ya se reflejo en costo real y margen."
          : "Cuando registres compras, esta capa te dira si el abastecimiento ya esta impactando caja y rentabilidad.",
      tone: "bg-[#fff7df] text-slate-900 ring-[#d4a72c]/20",
    },
  ];
}

function buildCashPressureQueue({ purchases, receivableTotal, receivableCount, lockInfo }) {
  const purchaseCount = purchases.length;
  const purchaseTotal = purchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);
  const creditPurchases = purchases.filter((purchase) => {
    const paymentTerms = String(
      purchase.supplier_payment_terms || purchase.raw?.supplier_payment_terms || "Contado"
    )
      .trim()
      .toLowerCase();
    return paymentTerms === "credito";
  }).length;

  return [
    {
      title: "Gasto que ya explica caja",
      body:
        purchaseCount > 0
          ? `${purchaseCount} compra(s) del rango ya representan ${formatCOP(purchaseTotal)} en salida o compromiso operativo.`
          : "Todavia no hay compras filtradas en este periodo para explicar presion sobre caja.",
      tone: "bg-white text-slate-900 ring-slate-200",
    },
    {
      title: "Compromisos por cobrar",
      body:
        receivableTotal > 0
          ? `${receivableCount} cuenta(s) pendiente(s) suman ${formatCOP(receivableTotal)}. Recuperarlas reduce necesidad de caja nueva.`
          : "No hay cartera pendiente en clientes dentro de la lectura actual.",
      tone: "bg-sky-50 text-sky-900 ring-sky-200",
    },
    {
      title: "Disciplina del cierre",
      body: lockInfo.blocked
        ? "Hay una accion de cierre pendiente. Resolverla evita que la lectura financiera del siguiente turno nazca desalineada."
        : creditPurchases > 0
          ? `${creditPurchases} compra(s) del rango operan a credito. Aunque no salgan en efectivo hoy, conviene dejarlas visibles en el analisis del cierre.`
          : "La trazabilidad de caja esta al dia para este rango y no hay compras a credito dominando la lectura.",
      tone: lockInfo.blocked
        ? "bg-[#fff7df] text-[#7a5500] ring-[#d4a72c]/25"
        : "bg-slate-50 text-slate-900 ring-slate-200",
    },
  ];
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

export default function AdminDashboard({
  businessId,
  business,
  userProfile,
  currentUser,
  requestAuditPin,
}) {
  const { publishSectionInsights, clearSectionInsights, openDecisionCenter } = useDecisionCenter();
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [operatingExpenses, setOperatingExpenses] = useState([]);
  const [cashClosings, setCashClosings] = useState([]);
  const [openSession, setOpenSession] = useState(null);
  const [selectedRange, setSelectedRange] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateInputValue());
  const [search, setSearch] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const [cashCounted, setCashCounted] = useState("");
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [saleToSettle, setSaleToSettle] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [movementToEdit, setMovementToEdit] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [operatingExpenseForm, setOperatingExpenseForm] = useState(EMPTY_OPERATING_EXPENSE_FORM);
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
      details: (sale.items || []).map((item) => `${item.quantity}x ${item.name}`).join(", "),
      amount: Number(sale.total || 0),
      paymentMethod: sale.payment_method || "cash",
      paymentBreakdown: normalizePaymentBreakdown(
        sale.payment_breakdown,
        sale.payment_method || "cash",
        Number(sale.total || 0)
      ),
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
      paymentMethod: "expense",
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
      const matchesPayment =
        selectedPaymentMethod === "all" ||
        movement.type === "expense" ||
        paymentBreakdownIncludesMethod(
          movement.paymentBreakdown,
          selectedPaymentMethod,
          movement.paymentMethod,
          movement.amount
        );
      const searchable = `${movement.concept} ${movement.category} ${movement.details}`.toLowerCase();
      return matchesRange && matchesPayment && (!term || searchable.includes(term));
    });
  }, [movements, search, selectedDate, selectedPaymentMethod, selectedRange]);

  const previousRangeConfig = useMemo(
    () => getPreviousRangeConfig(selectedRange, selectedDate),
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
  const closingPurchaseSummary = useMemo(() => {
    const todayPurchases = todayMovements.filter((movement) => movement.type === "expense");
    const total = todayPurchases.reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
    const supplierTotals = todayPurchases.reduce((accumulator, movement) => {
      const key = String(movement.raw?.supplier_name || movement.concept || "Sin proveedor").trim();
      accumulator[key] = (accumulator[key] || 0) + Number(movement.amount || 0);
      return accumulator;
    }, {});
    const topSupplier = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1])[0];

    return {
      count: todayPurchases.length,
      total,
      sharePct: todaySummary.income > 0 ? (total / todaySummary.income) * 100 : null,
      topSupplierName: topSupplier?.[0] || "",
      topSupplierTotal: Number(topSupplier?.[1] || 0),
    };
  }, [todayMovements, todaySummary.income]);

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

  const paymentMethodCards = useMemo(() => {
    return ["all", "cash", "card", "transfer", "nequi", "daviplata", "ticket_wallet"].map((method) => {
      const total = method === "all" ? filteredSummary.income : paymentMethodTotals[method] || 0;
      const previousTotal =
        method === "all"
          ? previousFilteredSummary.income
          : previousFilteredMovements.reduce((sum, movement) => {
              if (movement.type !== "income") {
                return sum;
              }
              return paymentBreakdownIncludesMethod(
                movement.paymentBreakdown,
                method,
                movement.paymentMethod,
                movement.amount
              )
                ? sum + movement.amount
                : sum;
            }, 0);
      return {
        method,
        total,
        variation: getVariation(total, previousTotal),
      };
    });
  }, [filteredSummary.income, paymentMethodTotals, previousFilteredMovements, previousFilteredSummary.income]);
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
    setOperatingExpenseForm(EMPTY_OPERATING_EXPENSE_FORM);
  };

  const handleSaveOperatingExpense = async () => {
    setIsBusy(true);
    try {
      await createOperatingExpense({
        business_id: businessId,
        concept: operatingExpenseForm.concept,
        category: operatingExpenseForm.category,
        amount: Number(operatingExpenseForm.amount),
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

    setIsBusy(true);
    try {
      if (movementToEdit.type === "income") {
        await updateSaleHistoryEntry(movementToEdit.raw.id, {
          concept: movementEditForm.concept,
          total: Number(movementEditForm.total),
          paymentMethod: movementEditForm.paymentMethod,
        });
      } else if (movementToEdit.source === "operating_expense") {
        await updateOperatingExpense(movementToEdit.raw.id, {
          concept: movementEditForm.concept,
          amount: Number(movementEditForm.total),
          paymentMethod: movementEditForm.paymentMethod,
        });
      } else {
        await updatePurchaseMovement(movementToEdit.raw.id, {
          concept: movementEditForm.concept,
          total: Number(movementEditForm.total),
        });
      }

      setMovementToEdit(null);
    } finally {
      setIsBusy(false);
    }
  };

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
                  const isActive =
                    selectedRange === filter.range && selectedDate === filter.getDate();
                  return (
                    <button
                      key={filter.label}
                      type="button"
                      onClick={() => applyQuickFilter(filter.range, filter.getDate())}
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
                        <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
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
              disabled={isBusy}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white"
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
              disabled={isBusy}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white"
            >
              {isBusy ? "Guardando..." : "Guardar ajuste"}
            </button>
          </div>
        </div>
      </ModalWrapper>

      <ModalWrapper
        open={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        maxWidthClass="max-w-4xl"
        icon={{ main: <ReceiptText size={20} />, close: "X" }}
        title="Cierre de caja"
        description="Revisa el conteo, confirma el resumen y cierra la jornada con su reporte."
      >
        <div className="grid gap-6">
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
