import { getSupabaseClient } from "../lib/supabaseClient";
import { toBusinessError } from "./supabase/supabaseErrorMessages";

function normalizeRecipeBook(row = {}) {
  const activeVersion = Array.isArray(row.technical_sheet_versions)
    ? row.technical_sheet_versions.find((version) => version.id === row.active_version_id) ||
      row.technical_sheet_versions[0]
    : null;
  const components = Array.isArray(row.technical_sheet_items)
    ? row.technical_sheet_items
        .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
        .map((item) => ({
          id: item.id,
          sourceType: item.source_type,
          source_type: item.source_type,
          sourceId: item.source_id,
          source_id: item.source_id,
          name: item.name,
          quantity: Number(item.quantity || 0),
          unit: item.unit,
          unitCost: Number(item.unit_cost || 0),
          unit_cost: Number(item.unit_cost || 0),
          totalCost: Number(item.total_cost || 0),
          total_cost: Number(item.total_cost || 0),
          wastePercent: Number(item.waste_percent || 0),
          waste_percent: Number(item.waste_percent || 0),
          notes: item.notes || "",
        }))
    : [];

  return {
    ...row,
    product_id: row.product_id || "",
    product_name: row.product_name || row.products?.name || row.name || "",
    yield: row.yield_data || activeVersion?.yield_data || {},
    yield_data: row.yield_data || activeVersion?.yield_data || {},
    components,
    costing: row.costing || activeVersion?.costing || {},
    procedure: row.procedure || {},
    plating: row.plating || {},
    bi: row.bi || {},
    active_version: activeVersion,
    active_version_id: row.active_version_id || activeVersion?.id || "",
  };
}

async function listRecipeBooks(businessId) {
  if (!businessId) return [];

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("technical_sheets")
    .select(
      `
        *,
        technical_sheet_items(*),
        technical_sheet_versions(*),
        products(id,name,price,cost,product_type)
      `
    )
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false });

  if (error) throw toBusinessError(error, "No fue posible cargar las fichas tecnicas.");
  return (data || []).map(normalizeRecipeBook);
}

export function subscribeToRecipeBooks(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  const publish = () => {
    listRecipeBooks(businessId)
      .then(callback)
      .catch((error) => {
        console.error("[supabase:recipeBooks]", error);
        callback([]);
      });
  };

  const channel = client
    .channel(`technical_sheets:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "technical_sheets", filter: `business_id=eq.${businessId}` },
      publish
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "technical_sheet_items", filter: `business_id=eq.${businessId}` },
      publish
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "technical_sheet_versions", filter: `business_id=eq.${businessId}` },
      publish
    )
    .subscribe();

  publish();

  return () => {
    client.removeChannel(channel);
  };
}

export async function createRecipeBook(payload) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("create_or_update_technical_sheet", {
    p_business_id: payload.business_id,
    p_technical_sheet_id: null,
    p_sheet: payload,
    p_components: payload.components || [],
    p_activate: payload.status !== "draft",
  });

  if (error) throw toBusinessError(error, "No fue posible crear la ficha tecnica.");
  return data;
}

export async function updateRecipeBook(id, payload) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("create_or_update_technical_sheet", {
    p_business_id: payload.business_id,
    p_technical_sheet_id: id,
    p_sheet: payload,
    p_components: payload.components || [],
    p_activate: payload.status !== "draft" && payload.status !== "inactive",
  });

  if (error) throw toBusinessError(error, "No fue posible actualizar la ficha tecnica.");
  return data;
}

export async function deactivateRecipeBook(id) {
  const client = getSupabaseClient();
  const { data: sheet, error: fetchError } = await client
    .from("technical_sheets")
    .select("business_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw toBusinessError(fetchError, "No fue posible buscar la ficha tecnica.");
  if (!sheet?.business_id) throw new Error("No se encontro la ficha tecnica para desactivar.");

  const { error } = await client
    .from("technical_sheets")
    .update({ status: "inactive", deactivated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", sheet.business_id);

  if (error) throw toBusinessError(error, "No fue posible desactivar la ficha tecnica.");
}

export async function refreshRecipeBooksForIngredients(businessId, productIds = []) {
  if (!businessId || !Array.isArray(productIds) || !productIds.length) {
    return;
  }

  const client = getSupabaseClient();
  await Promise.all(
    productIds.map(async (productId) => {
      const { error } = await client.rpc("recalculate_product_cost", {
        p_business_id: businessId,
        p_product_id: productId,
      });
      if (error && !String(error.message || "").includes("Active technical sheet not found")) {
        throw toBusinessError(error, "No fue posible recalcular el costo del producto.");
      }
    })
  );
}
