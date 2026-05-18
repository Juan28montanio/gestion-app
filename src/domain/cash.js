export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeCashSession(session) {
  if (!session) return null;

  return {
    ...session,
    id: session.id || "",
    business_id: session.business_id || session.businessId || "",
    businessId: session.businessId || session.business_id || "",
    status: session.status || "open",
    opening_amount: Number(session.opening_amount ?? session.openingAmount ?? 0),
    openingAmount: Number(session.openingAmount ?? session.opening_amount ?? 0),
    counted_amount: Number(session.counted_amount ?? session.countedAmount ?? 0),
    countedAmount: Number(session.countedAmount ?? session.counted_amount ?? 0),
    expected_amount: Number(session.expected_amount ?? session.expectedAmount ?? 0),
    expectedAmount: Number(session.expectedAmount ?? session.expected_amount ?? 0),
    difference_amount: Number(session.difference_amount ?? session.differenceAmount ?? 0),
    differenceAmount: Number(session.differenceAmount ?? session.difference_amount ?? 0),
    opened_at: session.opened_at || session.openedAt || session.created_at || null,
    openedAt: session.openedAt || session.opened_at || session.created_at || null,
    closed_at: session.closed_at || session.closedAt || null,
    closedAt: session.closedAt || session.closed_at || null,
    opened_date_key: session.opened_date_key || getLocalDateKey(normalizeDate(session.opened_at || session.openedAt) || new Date()),
  };
}

export function getCashSessionLockInfo(session) {
  if (!session) {
    return {
      blocked: true,
      reason: "no_open_session",
      message: "Debes abrir caja para comenzar a cobrar en esta jornada.",
    };
  }

  const normalized = normalizeCashSession(session);
  const openedAt = normalizeDate(normalized.opened_at || normalized.createdAt);
  const now = new Date();
  const todayKey = getLocalDateKey(now);
  const sessionDateKey = normalized.opened_date_key || getLocalDateKey(openedAt || now);
  const hoursOpen = openedAt ? (now.getTime() - openedAt.getTime()) / 36e5 : 0;

  if (normalized.status === "open" && sessionDateKey !== todayKey) {
    return {
      blocked: true,
      reason: "previous_day_open",
      message: "Debe realizar el cierre de caja anterior para iniciar una nueva jornada.",
      hoursOpen,
    };
  }

  if (normalized.status === "open" && hoursOpen >= 12) {
    return {
      blocked: true,
      reason: "too_long_open",
      message: "Debe realizar el cierre de caja anterior para iniciar una nueva jornada.",
      hoursOpen,
    };
  }

  return {
    blocked: false,
    reason: "ok",
    message: "",
    hoursOpen,
  };
}
