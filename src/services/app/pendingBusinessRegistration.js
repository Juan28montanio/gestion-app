const STORAGE_KEY = "smartprofit:pending-business-registration";

function getBrowserStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage || null;
}

export function normalizeAuthEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function buildPendingBusinessRegistration({ businessName, adminName, email }) {
  return {
    businessName: String(businessName || "").trim(),
    adminName: String(adminName || "").trim(),
    email: normalizeAuthEmail(email),
    createdAt: new Date().toISOString(),
  };
}

export function savePendingBusinessRegistration(input, storage = getBrowserStorage()) {
  if (!storage) return;
  const pending = buildPendingBusinessRegistration(input);
  if (!pending.businessName || !pending.email) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(pending));
}

export function readPendingBusinessRegistration(storage = getBrowserStorage()) {
  if (!storage) return null;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const pending = buildPendingBusinessRegistration(parsed);
    return pending.businessName && pending.email ? pending : null;
  } catch {
    storage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearPendingBusinessRegistration(storage = getBrowserStorage()) {
  storage?.removeItem(STORAGE_KEY);
}

export function findPendingBusinessRegistrationForEmail(email, storage = getBrowserStorage()) {
  const pending = readPendingBusinessRegistration(storage);
  return pending?.email === normalizeAuthEmail(email) ? pending : null;
}
