function normalizeDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getTicketWalletState(customer) {
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
    lowBalance: activeBalance > 0 && activeBalance <= 2,
    requiresReuseConfirmation: minutesSinceLastUse < 30,
  };
}

export function normalizeCustomer(customer = {}) {
  const ticketBalanceUnits = Number(
    customer.ticket_balance_units ??
      customer.ticketBalanceUnits ??
      customer.lunch_ticket_balance ??
      customer.ticket_balance ??
      0
  );
  const pendingDebt = Number(customer.pendingDebt ?? customer.debt_balance ?? customer.debtBalance ?? 0);

  return {
    ...customer,
    id: customer.id || "",
    business_id: customer.business_id || customer.businessId || "",
    businessId: customer.businessId || customer.business_id || "",
    name: String(customer.name || "").trim(),
    phone: String(customer.phone || "").trim(),
    email: String(customer.email || "").trim(),
    document: String(customer.document || customer.document_id || customer.document_number || "").trim(),
    document_id: String(customer.document_id || customer.document || customer.document_number || "").trim(),
    customerType: customer.customerType || customer.customer_type || "general",
    customer_type: customer.customer_type || customer.customerType || "general",
    status: customer.status || "active",
    ticket_balance_units: ticketBalanceUnits,
    ticketBalanceUnits: ticketBalanceUnits,
    lunch_ticket_balance: ticketBalanceUnits,
    debt_balance: pendingDebt,
    debtBalance: pendingDebt,
    pendingDebt,
    ticketWalletState: getTicketWalletState({ ...customer, ticket_balance_units: ticketBalanceUnits }),
  };
}

export function normalizeCustomers(customers = []) {
  return customers.map(normalizeCustomer);
}
