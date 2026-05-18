import { getSupabaseClient } from "../../lib/supabaseClient";

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
  if (error) throw error;
  return mapSupabaseUser(data.user);
}

export async function signUpBusinessOwner({ email, password, displayName }) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email: String(email || "").trim().toLowerCase(),
    password,
    options: {
      data: {
        display_name: String(displayName || "").trim(),
      },
    },
  });
  if (error) throw error;
  return mapSupabaseUser(data.user);
}

export async function signOut() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
