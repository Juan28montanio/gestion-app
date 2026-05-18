import { getSupabaseClient } from "../../lib/supabaseClient";
import { adaptSupabaseSale, adaptSupabaseSalesLedger } from "./adapters/salesAdapter";

export async function listSales(businessId, options = {}) {
  const client = getSupabaseClient();
  let query = client
    .from("sales")
    .select("*, sale_items(*), payments(*)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return adaptSupabaseSalesLedger(data || []);
}

export async function getSale(saleId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("sales")
    .select("*, sale_items(*), payments(*)")
    .eq("id", saleId)
    .maybeSingle();

  if (error) throw error;
  return data ? adaptSupabaseSale(data) : null;
}

export async function createSaleDraft(businessId, sale) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("sales")
    .insert({
      ...sale,
      business_id: businessId,
      status: sale.status || "draft",
      payment_status: sale.payment_status || "pending",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getSalesLedger(businessId) {
  if (!businessId) return [];
  return listSales(businessId);
}

export function subscribeToSalesLedger(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  const publish = () => {
    getSalesLedger(businessId).then(callback).catch((error) => {
      console.error("[supabase:salesLedger]", error);
      callback([]);
    });
  };

  const channels = ["sales", "sale_items", "payments"].map((table) =>
    client
      .channel(`${table}:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `business_id=eq.${businessId}`,
        },
        publish
      )
      .subscribe()
  );

  publish();

  return () => {
    channels.forEach((channel) => client.removeChannel(channel));
  };
}

// TODO: migrate sale closing, payments, inventory impact and cash impact to RPC SQL.
export async function closeSaleWithRpc(payload) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("close_sale", payload);
  if (error) throw error;
  return data;
}
