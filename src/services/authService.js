import {
  login,
  logout,
  registerOwner,
  verifySessionPassword,
} from "./app/authGateway";

export const LEGACY_BUSINESS_ID = "";

export function buildBusinessId(userId) {
  return String(userId || "").trim();
}

export async function registerBusinessOwner(input) {
  return registerOwner(input);
}

export async function loginWithEmailPassword(email, password) {
  return login(email, password);
}

export async function logoutUser() {
  return logout();
}

export async function reauthenticateCurrentUserPassword(password) {
  return verifySessionPassword(password);
}
