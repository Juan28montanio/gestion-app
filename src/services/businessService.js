import {
  updateBusinessAccount as updateBusinessAccountInApp,
  updateBusinessUserProfile as updateBusinessUserProfileInApp,
  verifyBusinessAuditPin as verifyBusinessAuditPinInApp,
} from "./app/authGateway";
import { getBusiness, getBusinessUser } from "./supabase/businessService";

export function subscribeToBusiness(businessId, callback) {
  if (!businessId) {
    callback(null);
    return () => {};
  }

  let cancelled = false;
  getBusiness(businessId)
    .then((business) => {
      if (!cancelled) callback(business);
    })
    .catch((error) => {
      console.error("[business:subscribe]", error);
      if (!cancelled) callback(null);
    });

  return () => {
    cancelled = true;
  };
}

export function subscribeToBusinessUser(userId, callback) {
  if (!userId) {
    callback(null);
    return () => {};
  }

  let cancelled = false;
  getBusinessUser(userId)
    .then((businessUser) => {
      if (!cancelled) callback(businessUser);
    })
    .catch((error) => {
      console.error("[businessUser:subscribe]", error);
      if (!cancelled) callback(null);
    });

  return () => {
    cancelled = true;
  };
}

export async function migrateLegacyBusinessUser() {
  throw new Error("La migracion legacy ya no esta disponible en el frontend.");
}

export async function updateBusinessAccount(businessId, values) {
  return updateBusinessAccountInApp(businessId, values);
}

export async function updateBusinessUserProfile(userId, values) {
  return updateBusinessUserProfileInApp(userId, values);
}

export async function verifyBusinessAuditPin(businessId, pin) {
  return verifyBusinessAuditPinInApp(businessId, pin);
}
