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

export function adaptSupabaseSupplier(row = {}) {
  const firebase = getFirebaseMetadata(row);
  const contactName = normalizeText(firebase.contact_name || firebase.contactName || firebase.contact);

  return {
    ...firebase,
    id: row.id,
    legacy_firebase_id: row.legacy_firebase_id || "",
    business_id: row.business_id,
    businessId: row.business_id,
    name: normalizeText(row.name || firebase.name),
    nit: normalizeText(firebase.nit),
    category: normalizeText(row.category || firebase.category),
    contact_name: contactName,
    contactName,
    contact: contactName,
    phone: normalizeText(row.phone || firebase.phone),
    mobile: normalizeText(firebase.mobile),
    email: normalizeText(row.email || firebase.email),
    address: normalizeText(firebase.address),
    payment_terms: normalizeText(firebase.payment_terms || firebase.paymentTerms || "Contado"),
    paymentTerms: normalizeText(firebase.paymentTerms || firebase.payment_terms || "Contado"),
    total_purchases_value: toNumber(firebase.total_purchases_value, 0),
    status: normalizeText(row.status || firebase.status || "active"),
    createdAt: row.created_at || firebase.createdAt || null,
    updatedAt: row.updated_at || firebase.updatedAt || null,
    created_at: row.created_at || firebase.created_at || null,
    updated_at: row.updated_at || firebase.updated_at || null,
    _source: "supabase",
  };
}

export function adaptSupabaseSuppliers(rows = []) {
  return rows.map(adaptSupabaseSupplier);
}
