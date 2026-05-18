import { getSupabaseClient } from "../../lib/supabaseClient";
import { adaptSupabaseSuppliers } from "./adapters/supplierAdapter";

function normalizeText(value) {
  return String(value || "").trim();
}

function sortSuppliers(items = []) {
  return [...items].sort((left, right) =>
    String(left?.name || "").localeCompare(String(right?.name || ""), "es", {
      sensitivity: "base",
    })
  );
}

function normalizeSupplierPayload(supplier, businessId) {
  const normalizedBusinessId = normalizeText(supplier?.business_id || supplier?.businessId || businessId);
  const name = normalizeText(supplier?.name);
  const contactName = normalizeText(supplier?.contact_name || supplier?.contactName || supplier?.contact);

  if (!normalizedBusinessId) throw new Error("El business_id del proveedor es obligatorio.");
  if (!name) throw new Error("El nombre del proveedor es obligatorio.");

  return {
    business_id: normalizedBusinessId,
    legacy_firebase_id: normalizeText(supplier?.legacy_firebase_id || supplier?.id) || null,
    name,
    category: normalizeText(supplier?.category) || null,
    phone: normalizeText(supplier?.phone) || null,
    email: normalizeText(supplier?.email) || null,
    status: normalizeText(supplier?.status || "active"),
    metadata: {
      firebase: {
        ...supplier,
        contact_name: contactName,
        contactName,
        payment_terms: normalizeText(supplier?.payment_terms || supplier?.paymentTerms || "Contado"),
      },
    },
  };
}

export async function listSuppliers(businessId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("suppliers")
    .select("*")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) throw error;
  return sortSuppliers(adaptSupabaseSuppliers(data || []));
}

export function subscribeToSuppliers(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  const channel = client
    .channel(`suppliers:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "suppliers",
        filter: `business_id=eq.${businessId}`,
      },
      () => {
        listSuppliers(businessId).then(callback).catch((error) => {
          console.error("[supabase:suppliers]", error);
          callback([]);
        });
      }
    )
    .subscribe();

  listSuppliers(businessId).then(callback).catch(() => callback([]));

  return () => {
    client.removeChannel(channel);
  };
}

export async function createSupplier(businessId, supplier) {
  const client = getSupabaseClient();
  const payload = normalizeSupplierPayload(supplier, businessId);
  const { data, error } = await client.from("suppliers").insert(payload).select("*").single();

  if (error) throw error;
  return data.id;
}

export async function updateSupplier(supplierId, businessId, supplier) {
  if (!supplierId) throw new Error("El id del proveedor es obligatorio para actualizar.");

  const client = getSupabaseClient();
  const payload = normalizeSupplierPayload(supplier, businessId);
  const { error } = await client.from("suppliers").update(payload).eq("id", supplierId);

  if (error) throw error;
}

export async function deleteSupplier(supplierId) {
  if (!supplierId) throw new Error("El id del proveedor es obligatorio para eliminar.");

  const client = getSupabaseClient();
  const { error } = await client
    .from("suppliers")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", supplierId);

  if (error) throw error;
}
