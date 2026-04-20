import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { buildBusinessId, LEGACY_BUSINESS_ID } from "./authService";

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashValue(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(normalized);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return toHex(digest);
  }

  return normalized;
}

function deriveMigratedBusinessName({ userId, displayName, email, legacyBusiness }) {
  const normalizedDisplayName = String(displayName || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const emailPrefix = normalizedEmail.split("@")[0];

  if (legacyBusiness?.owner_user_id && legacyBusiness.owner_user_id === userId) {
    return String(legacyBusiness.name || "").trim() || `Negocio de ${normalizedDisplayName || emailPrefix || "Administrador"}`;
  }

  return `Negocio de ${normalizedDisplayName || emailPrefix || "Administrador"}`;
}

export function subscribeToBusiness(businessId, callback) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) {
    callback(null);
    return () => {};
  }

  return onSnapshot(doc(db, "businesses", normalizedBusinessId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export function subscribeToBusinessUser(userId, callback) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    callback(null);
    return () => {};
  }

  return onSnapshot(doc(db, "business_users", normalizedUserId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export async function migrateLegacyBusinessUser(user, profile) {
  const userId = String(user?.uid || "").trim();
  const currentBusinessId = String(profile?.business_id || "").trim();

  if (!userId || currentBusinessId !== LEGACY_BUSINESS_ID) {
    return currentBusinessId;
  }

  const newBusinessId = buildBusinessId(userId);
  const newBusinessRef = doc(db, "businesses", newBusinessId);
  const legacyBusinessRef = doc(db, "businesses", LEGACY_BUSINESS_ID);
  const userRef = doc(db, "business_users", userId);

  const [newBusinessSnapshot, legacyBusinessSnapshot] = await Promise.all([
    getDoc(newBusinessRef),
    getDoc(legacyBusinessRef),
  ]);

  const legacyBusiness = legacyBusinessSnapshot.exists() ? legacyBusinessSnapshot.data() : null;
  const displayName = String(profile?.display_name || user?.displayName || "").trim();
  const normalizedEmail = String(profile?.email || user?.email || "").trim().toLowerCase();

  if (!newBusinessSnapshot.exists()) {
    await setDoc(
      newBusinessRef,
      {
        name: deriveMigratedBusinessName({
          userId,
          displayName,
          email: normalizedEmail,
          legacyBusiness,
        }),
        logo_url: "",
        owner_user_id: userId,
        owner_name: displayName,
        migrated_from_business_id: LEGACY_BUSINESS_ID,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  await setDoc(
    userRef,
    {
      business_id: newBusinessId,
      display_name: displayName,
      email: normalizedEmail,
      role: String(profile?.role || "owner").trim() || "owner",
      status: String(profile?.status || "active").trim() || "active",
      migrated_from_business_id: LEGACY_BUSINESS_ID,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  if (auth.currentUser && displayName) {
    await updateProfile(auth.currentUser, { displayName });
  }

  return newBusinessId;
}

export async function updateBusinessAccount(businessId, values) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) {
    throw new Error("No se encontro el negocio activo.");
  }

  const payload = {
    name: String(values?.name || "").trim(),
    logo_url: String(values?.logoUrl || values?.logo_url || "").trim(),
    updatedAt: serverTimestamp(),
  };

  if (!payload.name) {
    throw new Error("El nombre del negocio es obligatorio.");
  }

  if (values?.auditPin) {
    payload.audit_pin_hash = await hashValue(values.auditPin);
    payload.audit_pin_updated_at = serverTimestamp();
  }

  await setDoc(doc(db, "businesses", normalizedBusinessId), payload, { merge: true });
}

export async function updateBusinessUserProfile(userId, values) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    throw new Error("No se encontro el usuario activo.");
  }

  const displayName = String(values?.displayName || values?.display_name || "").trim();
  if (!displayName) {
    throw new Error("El nombre del usuario es obligatorio.");
  }

  await setDoc(doc(db, "business_users", normalizedUserId), {
    display_name: displayName,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName });
  }
}

export async function verifyBusinessAuditPin(businessId, pin) {
  const normalizedBusinessId = String(businessId || "").trim();
  const normalizedPin = String(pin || "").trim();

  if (!normalizedBusinessId || !normalizedPin) {
    return false;
  }

  const snapshot = await getDoc(doc(db, "businesses", normalizedBusinessId));
  if (!snapshot.exists()) {
    return false;
  }

  const storedHash = String(snapshot.data().audit_pin_hash || "").trim();
  if (!storedHash) {
    return false;
  }

  const currentHash = await hashValue(normalizedPin);
  return currentHash === storedHash;
}
