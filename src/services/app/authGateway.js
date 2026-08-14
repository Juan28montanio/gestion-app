import { getSupabaseClient } from "../../lib/supabaseClient";
import { buildAuthSession, normalizeAuthUser, normalizeBusiness, normalizeBusinessUser } from "../../domain/authSession";
import {
  getBusiness,
  getBusinessUser,
  updateBusinessProfile,
} from "../supabase/businessService";
import {
  onSupabaseAuthStateChange,
  signInWithEmailPassword,
  signOut,
  signUpBusinessOwner,
} from "../supabase/authService";
import { bootstrapBusinessForCurrentUser } from "../supabase/bootstrapService";

async function getBusinessForUser(userId) {
  const businessUser = await getBusinessUser(userId);
  const business = businessUser?.businesses || (businessUser?.business_id ? await getBusiness(businessUser.business_id) : null);
  return buildAuthSession({ user: { id: userId }, businessUser, business });
}

export async function getCurrentAuthSession() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) return buildAuthSession({});

  const session = await getBusinessForUser(data.user.id);
  return {
    ...session,
    currentUser: normalizeAuthUser(data.user),
  };
}

export function subscribeToAuthSession(callback) {
  let isCancelled = false;

  const publish = async (user) => {
    if (!user) {
      callback(buildAuthSession({}));
      return;
    }

    try {
      const session = await getBusinessForUser(user.id);
      if (!isCancelled) {
        callback({
          ...session,
          currentUser: normalizeAuthUser(user),
        });
      }
    } catch (error) {
      console.error("[app:authSession]", error);
      if (!isCancelled) {
        callback({
          ...buildAuthSession({ user }),
          authError: error,
        });
      }
    }
  };

  getSupabaseClient().auth.getUser().then(({ data }) => publish(data.user)).catch(() => publish(null));

  const unsubscribe = onSupabaseAuthStateChange(({ session }) => {
    publish(session?.user || null);
  });

  return () => {
    isCancelled = true;
    unsubscribe();
  };
}

export async function login(email, password) {
  return signInWithEmailPassword(email, password);
}

export async function logout() {
  return signOut();
}

export async function registerOwner({ businessName, adminName, email, password }) {
  const user = await signUpBusinessOwner({ email, password, displayName: adminName });
  // Business bootstrap remains an admin/manual step until public self-service rules are hardened.
  if (!user?.id) return user;
  await bootstrapBusinessForCurrentUser({
    businessName,
    displayName: adminName,
  });

  return user
}

export async function updateBusinessAccount(businessId, values) {
  const payload = {
    name: String(values?.name || "").trim(),
    logo_url: String(values?.logoUrl || values?.logo_url || "").trim(),
  };

  if (!payload.name) throw new Error("El nombre del negocio es obligatorio.");
  return updateBusinessProfile(businessId, payload);
}

export async function updateBusinessUserProfile(userId, values) {
  const client = getSupabaseClient();
  const displayName = String(values?.displayName || values?.display_name || "").trim();
  if (!displayName) throw new Error("El nombre del usuario es obligatorio.");

  const { data, error } = await client
    .from("profiles")
    .update({
      display_name: displayName,
      phone: String(values?.phone || "").trim(),
      avatar_url: String(values?.avatarUrl || values?.avatar_url || "").trim(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return normalizeBusinessUser(data);
}

export async function verifySessionPassword(password) {
  const client = getSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user?.email) throw new Error("No hay una sesion activa para validar la identidad.");

  const { error } = await client.auth.signInWithPassword({
    email: userData.user.email,
    password,
  });
  if (error) throw error;
  return true;
}

export async function verifyBusinessAuditPin(businessId, pin) {
  const normalizedPin = String(pin || "").trim();
  if (!businessId || !/^\d{4,6}$/.test(normalizedPin)) return false;

  const business = await getBusiness(businessId);
  if (!business?.audit_pin_hash) return false;

  const data = new TextEncoder().encode(normalizedPin);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return hash === business.audit_pin_hash;
}

export function normalizeBusinessForApp(row) {
  return normalizeBusiness(row);
}
