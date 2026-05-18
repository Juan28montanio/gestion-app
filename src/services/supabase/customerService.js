import { getSupabaseClient } from "../../lib/supabaseClient";
import { adaptSupabaseCustomers } from "./adapters/customerAdapter";

function normalizeText(value) {
  return String(value || "").trim();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function sortCustomers(items = []) {
  return [...items].sort((left, right) =>
    String(left?.name || "").localeCompare(String(right?.name || ""), "es", {
      sensitivity: "base",
    })
  );
}

function normalizeCustomerPayload(customer, businessId) {
  const normalizedBusinessId = normalizeText(customer?.business_id || customer?.businessId || businessId);
  const name = normalizeText(customer?.name);
  const documentNumber = normalizeText(customer?.document_number || customer?.document_id || customer?.document);

  if (!normalizedBusinessId) throw new Error("El business_id del cliente es obligatorio.");
  if (!name) throw new Error("El nombre del cliente es obligatorio.");

  return {
    business_id: normalizedBusinessId,
    legacy_firebase_id: normalizeText(customer?.legacy_firebase_id || customer?.id) || null,
    name,
    phone: normalizeText(customer?.phone) || null,
    email: normalizeText(customer?.email) || null,
    document_number: documentNumber || null,
    ticket_balance: toNumber(
      customer?.ticket_balance ??
        customer?.ticket_balance_units ??
        customer?.ticketBalanceUnits ??
        customer?.lunch_ticket_balance,
      0
    ),
    status: normalizeText(customer?.status || "active"),
    metadata: {
      firebase: customer,
    },
  };
}

export async function listCustomers(businessId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) throw error;
  return sortCustomers(adaptSupabaseCustomers(data || []));
}

export async function createCustomer(businessId, customer) {
  const client = getSupabaseClient();
  const payload = normalizeCustomerPayload(customer, businessId);
  const { data, error } = await client.from("customers").insert(payload).select("*").single();

  if (error) throw error;
  return data.id;
}

export async function updateCustomer(customerId, businessId, customer) {
  if (!customerId) throw new Error("El id del cliente es obligatorio para editar.");

  const client = getSupabaseClient();
  const payload = normalizeCustomerPayload(customer, businessId);
  const { error } = await client.from("customers").update(payload).eq("id", customerId);

  if (error) throw error;
}

export async function deleteCustomer(customerId) {
  if (!customerId) throw new Error("El id del cliente es obligatorio para eliminar.");

  const client = getSupabaseClient();
  const { error } = await client
    .from("customers")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", customerId);

  if (error) throw error;
}

export async function adjustCustomerTicketWallet(customerId, adjustment) {
  if (!customerId) throw new Error("El id del cliente es obligatorio para ajustar la tiquetera.");

  const units = Math.max(toNumber(adjustment?.units, 0), 0);
  const client = getSupabaseClient();
  const { error } = await client
    .from("customers")
    .update({
      ticket_balance: units,
      metadata: {
        firebase: {
          ticket_balance_units: units,
          ticketBalanceUnits: units,
          ticket_total_purchased: toNumber(adjustment?.totalPurchased, units),
          ticket_expires_at: adjustment?.expiresAt || null,
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId);

  if (error) throw error;
}

export function subscribeToCustomers(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  const channel = client
    .channel(`customers:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "customers",
        filter: `business_id=eq.${businessId}`,
      },
      () => {
        listCustomers(businessId).then(callback).catch((error) => {
          console.error("[supabase:customers]", error);
          callback([]);
        });
      }
    )
    .subscribe();

  listCustomers(businessId).then(callback).catch(() => callback([]));

  return () => {
    client.removeChannel(channel);
  };
}
