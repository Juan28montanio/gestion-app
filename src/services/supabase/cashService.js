import { getSupabaseClient } from "../../lib/supabaseClient";

export async function getOpenCashSession(businessId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("cash_sessions")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listCashSessions(businessId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("cash_sessions")
    .select("*")
    .eq("business_id", businessId)
    .order("opened_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function listCashMovements(businessId, cashSessionId = "") {
  const client = getSupabaseClient();
  let query = client
    .from("cash_movements")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (cashSessionId) {
    query = query.eq("cash_session_id", cashSessionId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function openCashSessionWithRpc(payload) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("open_cash_session", payload);
  if (error) throw error;
  return data;
}

export async function closeCashSessionWithRpc(payload) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("close_cash_session", payload);
  if (error) throw error;
  return data;
}

export async function settleSaleDebtWithRpc(payload) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("settle_sale_debt", payload);
  if (error) throw error;
  return data;
}

export async function settleAccountPayableWithRpc(payload) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("settle_account_payable", payload);
  if (error) throw error;
  return data;
}
