import { getSupabaseClient } from "../../lib/supabaseClient";

function getAuthRedirectUrl() {
  const configuredUrl = import.meta.env.VITE_AUTH_REDIRECT_URL || import.meta.env.VITE_PUBLIC_SITE_URL;
  const baseUrl = configuredUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const normalizedUrl = String(baseUrl || "").trim().replace(/\/+$/, "");
  return normalizedUrl ? `${normalizedUrl}/` : undefined;
}

function getAuthErrorMessage(error, fallback) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || error?.error_code || "").toLowerCase();

  if (message.includes("email rate limit") || code.includes("over_email_send_rate_limit")) {
    return "Supabase alcanzo el limite temporal de envio de correos. Espera unos minutos o configura SMTP propio antes de intentar otro registro.";
  }

  if (message.includes("invalid login credentials")) {
    return "Correo o contrasena incorrectos. Si acabas de registrarte, confirma el correo antes de iniciar sesion.";
  }

  if (message.includes("email not confirmed")) {
    return "Debes confirmar el correo antes de iniciar sesion.";
  }

  if (message.includes("user already registered") || message.includes("already registered")) {
    return "Este correo ya tiene una cuenta. Confirma el correo o vuelve al ingreso.";
  }

  return error?.message || fallback;
}

function toAuthError(error, fallback) {
  const authError = new Error(getAuthErrorMessage(error, fallback));
  authError.cause = error;
  authError.code = error?.code || error?.error_code || "";
  return authError;
}

export function mapSupabaseUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email || "",
    displayName: user.user_metadata?.display_name || user.user_metadata?.name || "",
    metadata: user.user_metadata || {},
  };
}

export async function getCurrentSession() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return mapSupabaseUser(data.user);
}

export function onSupabaseAuthStateChange(callback) {
  const client = getSupabaseClient();
  const { data } = client.auth.onAuthStateChange((event, session) => {
    callback({
      event,
      session,
      user: mapSupabaseUser(session?.user),
    });
  });

  return () => data.subscription.unsubscribe();
}

export async function signInWithEmailPassword(email, password) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: String(email || "").trim().toLowerCase(),
    password,
  });
  if (error) throw toAuthError(error, "No fue posible iniciar sesion.");
  return mapSupabaseUser(data.user);
}

export async function signUpBusinessOwner({ email, password, displayName }) {
  const client = getSupabaseClient();
  const redirectUrl = getAuthRedirectUrl();

  const { data, error } = await client.auth.signUp({
    email: String(email || "").trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        display_name: String(displayName || "").trim(),
      },
    },
  });
  if (error) throw toAuthError(error, "No fue posible crear la cuenta.");

  return {
    ...mapSupabaseUser(data.user),
    needsEmailConfirmation: !data.session,
  };
}

export async function signOut() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
