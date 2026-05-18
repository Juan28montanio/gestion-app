import {
  adjustCustomerTicketWallet,
  createCustomer,
  deleteCustomer,
  subscribeToAppCustomers,
  updateCustomer,
} from "./app/customerGateway";

const TICKET_WARNING_THRESHOLD = 2;

function normalizeDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getTicketWalletState(customer) {
  const balance = Number(
    customer?.ticket_balance_units ??
      customer?.ticketBalanceUnits ??
      customer?.lunch_ticket_balance ??
      0
  );
  const expiresAt = normalizeDate(customer?.ticket_expires_at ?? customer?.ticketExpiresAt ?? null);
  const lastUsedAt = normalizeDate(customer?.ticket_last_used_at ?? customer?.ticketLastUsedAt ?? null);
  const now = new Date();
  const isExpired = expiresAt ? expiresAt.getTime() < now.getTime() : false;
  const activeBalance = isExpired ? 0 : Math.max(balance, 0);
  const minutesSinceLastUse = lastUsedAt
    ? (now.getTime() - lastUsedAt.getTime()) / 60000
    : Number.POSITIVE_INFINITY;

  return {
    balance: activeBalance,
    expiresAt,
    lastUsedAt,
    isExpired,
    isActive: activeBalance > 0,
    lowBalance: activeBalance > 0 && activeBalance <= TICKET_WARNING_THRESHOLD,
    requiresReuseConfirmation: minutesSinceLastUse < 30,
  };
}

export function subscribeToCustomers(businessId, callback) {
  return subscribeToAppCustomers(businessId, callback);
}

export {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  adjustCustomerTicketWallet,
};
