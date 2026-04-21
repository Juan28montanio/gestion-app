import { ReceiptText, ArrowUpCircle, ArrowDownCircle, Landmark, CreditCard, Wallet, Clock3, Store, Truck } from "lucide-react";
import { formatCOP } from "../../utils/formatters";

export const RANGE_OPTIONS = [
  { value: "daily", label: "Diario" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "annual", label: "Anual" },
  { value: "custom", label: "Fecha puntual" },
];

export const QUICK_FILTERS = [
  {
    label: "Hoy",
    range: "daily",
    getDate: (getLocalDateInputValue, getLocalDateKey) =>
      getLocalDateInputValue(getLocalDateKey, new Date()),
  },
  {
    label: "Ayer",
    range: "custom",
    getDate: (getLocalDateInputValue, getLocalDateKey) => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return getLocalDateInputValue(getLocalDateKey, date);
    },
  },
  {
    label: "Esta semana",
    range: "weekly",
    getDate: (getLocalDateInputValue, getLocalDateKey) =>
      getLocalDateInputValue(getLocalDateKey, new Date()),
  },
  {
    label: "Mes",
    range: "monthly",
    getDate: (getLocalDateInputValue, getLocalDateKey) =>
      getLocalDateInputValue(getLocalDateKey, new Date()),
  },
];

export const OPERATING_EXPENSE_CATEGORIES = [
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

export const PAYMENT_METHOD_STYLES = {
  all: "from-slate-900 to-slate-700 text-white ring-slate-900/10",
  cash: "from-emerald-500 to-emerald-600 text-white ring-emerald-500/20",
  card: "from-sky-500 to-sky-600 text-white ring-sky-500/20",
  transfer: "from-indigo-500 to-indigo-600 text-white ring-indigo-500/20",
  nequi: "from-fuchsia-500 to-fuchsia-600 text-white ring-fuchsia-500/20",
  daviplata: "from-rose-500 to-pink-600 text-white ring-rose-500/20",
  ticket_wallet: "from-amber-500 to-[#d4a72c] text-white ring-[#d4a72c]/20",
};

export function getLocalDateInputValue(getLocalDateKey, date = new Date()) {
  return getLocalDateKey(date);
}

export function createEmptyOperatingExpenseForm(getLocalDateKey) {
  return {
    concept: "",
    category: "Energia",
    amount: "",
    expenseDate: getLocalDateInputValue(getLocalDateKey, new Date()),
    paymentMethod: "cash",
    vendorName: "",
    notes: "",
  };
}

export function parseLocalDateInput(value) {
  if (!value || typeof value !== "string") {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date(value);
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function normalizeDate(value) {
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

export function isInRange(date, range, selectedDate) {
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

export function summarizeMovements(movements) {
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

export function getPreviousRangeConfig(getLocalDateKey, range, selectedDate) {
  const base = selectedDate ? parseLocalDateInput(selectedDate) : new Date();

  if (range === "daily" || range === "custom") {
    const previous = new Date(base);
    previous.setDate(previous.getDate() - 1);
    return { range: "custom", selectedDate: getLocalDateInputValue(getLocalDateKey, previous) };
  }

  if (range === "weekly") {
    const previous = new Date(base);
    previous.setDate(previous.getDate() - 7);
    return { range: "weekly", selectedDate: getLocalDateInputValue(getLocalDateKey, previous) };
  }

  if (range === "monthly") {
    const previous = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    return { range: "monthly", selectedDate: getLocalDateInputValue(getLocalDateKey, previous) };
  }

  if (range === "annual") {
    const previous = new Date(base.getFullYear() - 1, 0, 1);
    return { range: "annual", selectedDate: getLocalDateInputValue(getLocalDateKey, previous) };
  }

  return { range, selectedDate };
}

export function getVariation(current, previous) {
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

export function formatDuration(durationMs) {
  const totalMinutes = Math.max(Math.floor(durationMs / 60000), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}min`;
}

export function getBalanceStatus(balance) {
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

export function getMovementVisual(movement) {
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

export function buildExecutiveInsights({
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

export function buildCashActionItems({
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
        : `La jornada sigue activa${boxOpenDuration?.label ? ` desde hace ${boxOpenDuration.label}` : ""}. Manten compras y cobros actualizados.`,
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
      icon: ReceiptText,
    });
  }

  return items.slice(0, 3);
}

export function buildSupplyChainInsights(purchases, filteredSummary) {
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

export function buildCashPressureQueue({ purchases, receivableTotal, receivableCount, lockInfo }) {
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
