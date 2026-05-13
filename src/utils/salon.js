export const TABLE_STATUS_LABELS = {
  free: "Libre",
  disponible: "Libre",
  occupied: "Ocupada",
  ocupada: "Ocupada",
  waiting_order: "Esperando pedido",
  order_sent: "Comandada",
  preparing: "Preparando",
  ready: "Listo",
  waiting_payment: "Esperando pago",
  cuenta_solicitada: "Esperando pago",
  requested_bill: "Esperando pago",
  cleaning: "Limpieza",
  paid: "Pagada",
  pagada: "Pagada",
  reserved: "Reservada",
  disabled: "Fuera de servicio",
};

export const KITCHEN_STATUS_LABELS = {
  draft: "Borrador",
  pending: "Pendiente",
  sent: "Enviado",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  canceled: "Cancelado",
};

export function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function calculateDuration(start, end = new Date()) {
  const startDate = toDate(start);
  const endDate = toDate(end) || new Date();

  if (!startDate) {
    return 0;
  }

  return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 60000));
}

export function formatDuration(minutes) {
  const safeMinutes = Math.max(0, Number(minutes) || 0);

  if (safeMinutes < 60) {
    return `${Math.max(1, safeMinutes)} min`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const restMinutes = safeMinutes % 60;
  return restMinutes ? `${hours} h ${restMinutes} min` : `${hours} h`;
}

export function calculateTableDuration(session) {
  return calculateDuration(session?.openedAt || session?.createdAt);
}

export function calculateKitchenDuration(ticket) {
  return calculateDuration(ticket?.sentAt || ticket?.createdAt, ticket?.readyAt || new Date());
}

export function calculateOrderTotal(items = []) {
  return items.reduce((sum, item) => {
    const quantity = Number(item?.quantity || 0);
    const unitPrice = Number(item?.unitPrice ?? item?.price ?? 0);
    const modifiersTotal = (item?.modifiers || []).reduce(
      (modifierSum, modifier) => modifierSum + Number(modifier?.price || 0),
      0
    );
    return sum + quantity * (unitPrice + modifiersTotal);
  }, 0);
}

export function calculateItemsCount(items = []) {
  return items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
}

export function buildItemsSummary(items = [], limit = 3) {
  const visible = items
    .filter((item) => String(item?.status || "") !== "canceled")
    .slice(0, limit)
    .map((item) => `${Number(item?.quantity || 0)}x ${item?.productName || item?.name}`);

  return {
    visible,
    extra: Math.max(items.length - visible.length, 0),
    text: visible.join(", "),
  };
}

export function normalizeTableStatus(status) {
  const normalized = String(status || "free").trim().toLowerCase();
  const aliases = {
    disponible: "free",
    ocupada: "occupied",
    cuenta_solicitada: "waiting_payment",
    requested_bill: "waiting_payment",
    pagada: "paid",
  };

  return aliases[normalized] || normalized;
}

export function getTableVisualStatus(table, session, order, kitchenTickets = []) {
  const baseStatus = normalizeTableStatus(table?.status);

  if (baseStatus === "disabled" || table?.isActive === false) {
    return "disabled";
  }

  if (baseStatus === "reserved" || baseStatus === "cleaning" || baseStatus === "waiting_payment") {
    return baseStatus;
  }

  if (!session && (baseStatus === "free" || baseStatus === "paid")) {
    return "free";
  }

  const kitchenStatus = String(order?.kitchenStatus || order?.kitchen_status || "").toLowerCase();
  const ticketStatuses = kitchenTickets.map((ticket) => String(ticket?.status || "").toLowerCase());

  if (ticketStatuses.includes("ready") || kitchenStatus === "ready") {
    return "ready";
  }

  if (ticketStatuses.includes("preparing") || kitchenStatus === "preparing") {
    return "preparing";
  }

  if (ticketStatuses.includes("pending") || kitchenStatus === "pending" || kitchenStatus === "sent") {
    return "order_sent";
  }

  if (order?.id && calculateItemsCount(order.items || []) > 0) {
    return "order_sent";
  }

  if (session) {
    return "waiting_order";
  }

  return baseStatus;
}

export function canOpenTable(table) {
  return ["free", "disponible", "paid", "pagada"].includes(String(table?.status || "free").toLowerCase());
}

export function canCloseTable(order) {
  if (!order?.id) {
    return false;
  }

  const items = order.items || [];
  return items.length > 0 && !items.some((item) => ["draft", "sent", "preparing", "ready"].includes(String(item?.status || "").toLowerCase()));
}

export function canCancelItem(item) {
  return item && String(item.status || "") !== "canceled" && String(item.status || "") !== "delivered";
}

export function canTransferTable(sourceTable, targetTable) {
  return Boolean(sourceTable?.id && targetTable?.id && sourceTable.id !== targetTable.id && canOpenTable(targetTable));
}

export function getSessionAlerts({ table, session, order, kitchenTickets = [] } = {}) {
  const alerts = [];
  const visualStatus = getTableVisualStatus(table, session, order, kitchenTickets);
  const activeMinutes = calculateTableDuration(session);
  const paymentMinutes = calculateDuration(session?.paymentRequestedAt);

  if (session && activeMinutes >= 90) {
    alerts.push({ tone: "rose", label: "Mesa con atencion prolongada" });
  }

  kitchenTickets.forEach((ticket) => {
    const kitchenMinutes = calculateKitchenDuration(ticket);
    if (["pending", "preparing"].includes(String(ticket.status || "").toLowerCase()) && kitchenMinutes >= 18) {
      alerts.push({ tone: "amber", label: "Pedido demorado en cocina" });
    }

    if (String(ticket.status || "").toLowerCase() === "ready" && calculateDuration(ticket.readyAt) >= 6) {
      alerts.push({ tone: "sky", label: "Listo sin entregar" });
    }
  });

  if (visualStatus === "waiting_payment" && paymentMinutes >= 10) {
    alerts.push({ tone: "amber", label: "Cuenta esperando pago" });
  }

  return alerts;
}
