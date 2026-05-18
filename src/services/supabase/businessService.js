import { getSupabaseClient } from "../../lib/supabaseClient";

export async function getBusiness(businessId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getBusinessUser(userId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("business_users")
    .select("*, businesses(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listBusinessUsers(businessId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("business_users")
    .select("*, profiles(*)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateBusinessProfile(businessId, values) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("businesses")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
