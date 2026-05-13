export const TICKET_STATUS = {
  ACTIVE: "active",
  EXHAUSTED: "exhausted",
  EXPIRED: "expired",
  CANCELED: "canceled",
  SUSPENDED: "suspended",
};

export const CONSUMPTION_STATUS = {
  VALID: "valid",
  CANCELED: "canceled",
};

export function normalizeDate(value) {
  if (!value) {
    return null;
  }

  if (value?.toDate) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const [year, month, day] = value.split("-").map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function calculateMealsAvailable(ticket) {
  const purchased = Number(ticket?.mealsPurchased ?? ticket?.meals_purchased ?? 0);
  const consumed = Number(ticket?.mealsConsumed ?? ticket?.meals_consumed ?? 0);
  return Math.max(purchased - consumed, 0);
}

export function calculateTicketStatus(ticket, now = new Date()) {
  const currentStatus = String(ticket?.status || TICKET_STATUS.ACTIVE);

  if ([TICKET_STATUS.CANCELED, TICKET_STATUS.SUSPENDED].includes(currentStatus)) {
    return currentStatus;
  }

  const expirationDate = normalizeDate(ticket?.expirationDate ?? ticket?.expiration_date);
  if (expirationDate && expirationDate.getTime() < now.getTime()) {
    return TICKET_STATUS.EXPIRED;
  }

  if (calculateMealsAvailable(ticket) <= 0) {
    return TICKET_STATUS.EXHAUSTED;
  }

  return TICKET_STATUS.ACTIVE;
}

export function calculatePricePerMeal(amountPaid, mealsPurchased) {
  const amount = Number(amountPaid || 0);
  const meals = Number(mealsPurchased || 0);
  return meals > 0 ? Number((amount / meals).toFixed(2)) : 0;
}

export function calculateExpirationDate(purchaseDate, validityDays) {
  const days = Number(validityDays || 0);
  if (!Number.isFinite(days) || days <= 0) {
    return null;
  }

  const baseDate = normalizeDate(purchaseDate) || new Date();
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

export function calculateTotalActiveBalanceByCustomer(tickets = [], customerId) {
  return tickets
    .filter((ticket) => String(ticket.customerId || ticket.customer_id || "") === String(customerId || ""))
    .filter((ticket) => calculateTicketStatus(ticket) === TICKET_STATUS.ACTIVE)
    .reduce((sum, ticket) => sum + calculateMealsAvailable(ticket), 0);
}

export function canConsumeTicket(ticket) {
  const status = calculateTicketStatus(ticket);
  const available = calculateMealsAvailable(ticket);

  if (status !== TICKET_STATUS.ACTIVE) {
    return {
      allowed: false,
      reason:
        status === TICKET_STATUS.EXPIRED
          ? "La ticketera esta vencida."
          : status === TICKET_STATUS.CANCELED
            ? "La ticketera esta anulada."
            : status === TICKET_STATUS.SUSPENDED
              ? "La ticketera esta suspendida."
              : "La ticketera no tiene saldo disponible.",
    };
  }

  if (available <= 0) {
    return { allowed: false, reason: "La ticketera no tiene saldo disponible." };
  }

  return { allowed: true, reason: "" };
}

export function canCancelConsumption(consumption) {
  return String(consumption?.status || CONSUMPTION_STATUS.VALID) === CONSUMPTION_STATUS.VALID;
}

export function canCancelTicket(ticket) {
  const status = calculateTicketStatus(ticket);
  return ![TICKET_STATUS.CANCELED, TICKET_STATUS.EXHAUSTED].includes(status);
}
