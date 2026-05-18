function normalizeText(value) {
  return String(value || "").trim();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getFirebaseMetadata(row = {}) {
  return row.metadata?.firebase && typeof row.metadata.firebase === "object"
    ? row.metadata.firebase
    : {};
}

export function adaptSupabaseCustomer(row = {}) {
  const firebase = getFirebaseMetadata(row);
  const ticketBalanceUnits = toNumber(
    firebase.ticket_balance_units ??
      firebase.ticketBalanceUnits ??
      firebase.lunch_ticket_balance ??
      row.ticket_balance,
    0
  );
  const pendingDebt = toNumber(firebase.pendingDebt ?? firebase.debt_balance ?? firebase.debtBalance, 0);

  return {
    ...firebase,
    id: row.id,
    legacy_firebase_id: row.legacy_firebase_id || "",
    business_id: row.business_id,
    businessId: row.business_id,
    name: normalizeText(row.name || firebase.name),
    phone: normalizeText(row.phone || firebase.phone),
    email: normalizeText(row.email || firebase.email),
    document: normalizeText(row.document_number || firebase.document || firebase.document_id),
    document_id: normalizeText(row.document_number || firebase.document_id || firebase.document),
    document_number: normalizeText(row.document_number || firebase.document_number),
    institution: normalizeText(firebase.institution),
    program: normalizeText(firebase.program),
    customerType: normalizeText(firebase.customerType || firebase.customer_type || "general"),
    customer_type: normalizeText(firebase.customer_type || firebase.customerType || "general"),
    status: normalizeText(row.status || firebase.status || "active"),
    notes: normalizeText(firebase.notes),
    ticket_balance_units: ticketBalanceUnits,
    ticketBalanceUnits: ticketBalanceUnits,
    lunch_ticket_balance: ticketBalanceUnits,
    ticket_total_purchased: toNumber(firebase.ticket_total_purchased ?? firebase.ticketTotalPurchased, ticketBalanceUnits),
    ticketTotalPurchased: toNumber(firebase.ticketTotalPurchased ?? firebase.ticket_total_purchased, ticketBalanceUnits),
    ticket_last_used_at: firebase.ticket_last_used_at ?? firebase.ticketLastUsedAt ?? null,
    ticketLastUsedAt: firebase.ticketLastUsedAt ?? firebase.ticket_last_used_at ?? null,
    ticket_expires_at: firebase.ticket_expires_at ?? firebase.ticketExpiresAt ?? null,
    ticketExpiresAt: firebase.ticketExpiresAt ?? firebase.ticket_expires_at ?? null,
    debt_balance: pendingDebt,
    debtBalance: pendingDebt,
    pendingDebt,
    createdAt: row.created_at || firebase.createdAt || null,
    updatedAt: row.updated_at || firebase.updatedAt || null,
    created_at: row.created_at || firebase.created_at || null,
    updated_at: row.updated_at || firebase.updated_at || null,
    _source: "supabase",
  };
}

export function adaptSupabaseCustomers(rows = []) {
  return rows.map(adaptSupabaseCustomer);
}
