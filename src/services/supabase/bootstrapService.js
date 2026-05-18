import { getSupabaseClient } from "../../lib/supabaseClient";

export async function bootstrapBusinessForCurrentUser({
  businessName,
  displayName = "",
  legacyFirebaseUid = "",
  legacyFirebaseBusinessId = "",
}) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("bootstrap_business_for_current_user", {
    p_business_name: businessName,
    p_display_name: displayName,
    p_legacy_firebase_uid: legacyFirebaseUid,
    p_legacy_firebase_business_id: legacyFirebaseBusinessId,
  });

  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function getBootstrapStatus() {
  const client = getSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;

  const user = userData.user;
  if (!user) {
    return {
      isAuthenticated: false,
      hasBusiness: false,
      user: null,
      businessUser: null,
    };
  }

  const { data, error } = await client
    .from("business_users")
    .select("*, businesses(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return {
    isAuthenticated: true,
    hasBusiness: Boolean(data?.business_id),
    user,
    businessUser: data,
  };
}
