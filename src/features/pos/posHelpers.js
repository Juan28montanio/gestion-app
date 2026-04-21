import { formatCOP } from "../../utils/formatters";

export const PAYMENT_OPTIONS = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
  { value: "nequi", label: "Nequi" },
  { value: "daviplata", label: "Daviplata" },
];

const CATEGORY_STYLES = {
  bebidas: "from-sky-100 to-cyan-50 text-sky-900",
  cafe: "from-amber-100 to-orange-50 text-amber-950",
  cafetera: "from-amber-100 to-orange-50 text-amber-950",
  panaderia: "from-yellow-100 to-amber-50 text-amber-950",
  postres: "from-pink-100 to-rose-50 text-rose-900",
  almuerzos: "from-emerald-100 to-lime-50 text-emerald-900",
  comida: "from-emerald-100 to-lime-50 text-emerald-900",
};

export function getCategoryStyle(category) {
  const key = String(category || "").trim().toLowerCase();
  return CATEGORY_STYLES[key] || "from-slate-100 to-slate-50 text-slate-900";
}

export function createSplitPaymentLine(method = "cash", amount = "") {
  return {
    id: `split-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    method,
    amount,
  };
}

export function getPosOperationStatus({ selectedTable, activeOrder, cartItems }) {
  if (!selectedTable) {
    return {
      label: "Pendiente por iniciar",
      detail: "Selecciona una mesa o usa venta rapida para empezar a cobrar.",
    };
  }

  if (selectedTable.isQuickSale) {
    return {
      label: "Modo caja rapida",
      detail: "Puedes cobrar de inmediato sin comandar la orden.",
    };
  }

  if (activeOrder?.id) {
    return {
      label: "Orden en curso",
      detail: "La comanda ya existe y esta lista para seguimiento o cobro.",
    };
  }

  if (cartItems.length > 0) {
    return {
      label: "Borrador listo",
      detail: "La mesa ya tiene productos cargados y puede pasar a comanda.",
    };
  }

  return {
    label: "Mesa lista",
    detail: "Agrega productos para comenzar la venta.",
  };
}

export function getOrderedItemsLabel(order) {
  const names = (order?.items || [])
    .map((item) => String(item.name || "").trim())
    .filter(Boolean);

  if (!names.length) {
    return "";
  }

  return names.slice(0, 3).join(", ");
}

export function getPaymentReadiness({
  selectedTable,
  cartItems,
  activeOrder,
  paymentMethod,
  chargedTotal,
  cashShortage,
  cashLockInfo,
}) {
  if (cashLockInfo?.blocked) {
    return {
      label: "Caja bloqueada",
      detail: "Debes resolver la caja antes de registrar nuevos cobros.",
      tone: "text-rose-200",
    };
  }

  if (!selectedTable) {
    return {
      label: "Falta asignar la venta",
      detail: "Selecciona una mesa o venta rapida para continuar.",
      tone: "text-slate-300",
    };
  }

  if (!activeOrder?.id && cartItems.length === 0) {
    return {
      label: "Sin productos en el pedido",
      detail: "Agrega productos antes de intentar cobrar.",
      tone: "text-slate-300",
    };
  }

  if (chargedTotal <= 0) {
    return {
      label: "Valor pendiente por definir",
      detail: "Indica el valor final cobrado para continuar.",
      tone: "text-amber-200",
    };
  }

  if (paymentMethod === "cash" && cashShortage > 0) {
    return {
      label: "Falta efectivo por recibir",
      detail: `Aun faltan ${formatCOP(cashShortage)} para cerrar este cobro en efectivo.`,
      tone: "text-amber-200",
    };
  }

  if (paymentMethod === "cash" && cashShortage === 0) {
    return {
      label: "Listo para cobrar en efectivo",
      detail: "El pago recibido cubre el total y el cambio ya esta calculado.",
      tone: "text-emerald-200",
    };
  }

  return {
    label: "Listo para registrar el cobro",
    detail: "Puedes confirmar el pago o dividirlo desde el modal.",
    tone: "text-emerald-200",
  };
}
