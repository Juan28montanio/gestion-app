import { getSupabaseClient } from "../../lib/supabaseClient";
import { adaptSupabaseProducts } from "./adapters/productAdapter";

const DB_PRODUCT_TYPES = new Set(["standard", "prepared", "combo", "ticket_wallet", "service"]);
const DB_PRODUCT_STATUSES = new Set(["active", "inactive", "archived"]);

function normalizeText(value) {
  return String(value || "").trim();
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function mapProductType(type) {
  const value = normalizeText(type || "standard");
  if (DB_PRODUCT_TYPES.has(value)) return value;
  if (value === "final_product" || value === "base_preparation") return "prepared";
  if (value === "variable" || value === "weighted") return "standard";
  return "standard";
}

function mapProductStatus(status) {
  const value = normalizeText(status || "active");
  if (DB_PRODUCT_STATUSES.has(value)) return value;
  if (value === "hidden" || value === "sold_out" || value === "temporary") return "inactive";
  return "active";
}

function normalizeProductPayload(product, businessId) {
  const normalizedBusinessId = normalizeText(product?.business_id || product?.businessId || businessId);
  const name = normalizeText(product?.name);
  const price = toNumber(product?.price ?? product?.pricing?.basePrice, 0);
  const cost = toNumber(product?.cost ?? product?.costing?.estimatedCost, 0);

  if (!normalizedBusinessId) throw new Error("El business_id del producto es obligatorio.");
  if (!name) throw new Error("El nombre del producto es obligatorio.");
  if (price < 0) throw new Error("El precio debe ser mayor o igual a 0.");
  if (cost < 0) throw new Error("El costo debe ser mayor o igual a 0.");

  return {
    business_id: normalizedBusinessId,
    category_id: normalizeText(product?.category_id || product?.categoryId) || null,
    legacy_firebase_id: normalizeText(product?.legacy_firebase_id || product?.id) || null,
    name,
    code: normalizeText(product?.code) || null,
    description: normalizeText(product?.description) || null,
    product_type: mapProductType(product?.product_type || product?.type),
    status: mapProductStatus(product?.status),
    price,
    cost,
    tax_rate: toNumber(product?.tax_rate ?? product?.pricing?.taxRate, 0),
    stock: toNumber(product?.stock, 0),
    visible_in_pos: product?.visible_in_pos ?? product?.operation?.visibleInPOS ?? true,
    inventory: product?.inventory || {},
    metadata: {
      firebase: product,
    },
  };
}

function normalizeCategoryPayload(category, businessId) {
  const normalizedBusinessId = normalizeText(category?.business_id || category?.businessId || businessId);
  const name = normalizeText(category?.name);

  if (!normalizedBusinessId) throw new Error("El business_id de la categoria es obligatorio.");
  if (!name) throw new Error("El nombre de la categoria es obligatorio.");

  return {
    business_id: normalizedBusinessId,
    name,
    sort_order: toNumber(category?.sort_order ?? category?.sortOrder, 0),
    status: category?.active === false ? "inactive" : normalizeText(category?.status || "active"),
  };
}

export async function listProducts(businessId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("products")
    .select("*, product_categories(*)")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) throw error;
  return adaptSupabaseProducts(data || []);
}

export async function listAvailableProducts(businessId) {
  const products = await listProducts(businessId);
  return products.filter((product) => product.status === "active" && product.operation?.visibleInPOS !== false);
}

export async function listProductCategories(businessId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("product_categories")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []).map((category) => ({
    ...category,
    businessId: category.business_id,
    sortOrder: category.sort_order,
    active: category.status === "active",
    visibleInPOS: category.status === "active",
    visibleInReports: true,
    _source: "supabase",
  }));
}

export async function createProduct(businessId, product) {
  const client = getSupabaseClient();
  const payload = normalizeProductPayload(product, businessId);
  const { data, error } = await client
    .from("products")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateProduct(productId, businessId, product) {
  if (!productId) throw new Error("El id del producto es obligatorio para actualizar.");

  const client = getSupabaseClient();
  const payload = normalizeProductPayload(product, businessId);
  const { error } = await client
    .from("products")
    .update(payload)
    .eq("id", productId);

  if (error) throw error;
}

export async function archiveProduct(productId) {
  if (!productId) throw new Error("El id del producto es obligatorio para archivar.");

  const client = getSupabaseClient();
  const { error } = await client
    .from("products")
    .update({ status: "archived", visible_in_pos: false, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) throw error;
}

export async function updateProductStatus(productId, status) {
  if (!productId) throw new Error("El id del producto es obligatorio.");

  const mappedStatus = mapProductStatus(status);
  const client = getSupabaseClient();
  const { error } = await client
    .from("products")
    .update({
      status: mappedStatus,
      visible_in_pos: mappedStatus === "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) throw error;
}

export async function createProductCategory(businessId, category) {
  const client = getSupabaseClient();
  const payload = normalizeCategoryPayload(category, businessId);

  const { data: existing, error: lookupError } = await client
    .from("product_categories")
    .select("id")
    .eq("business_id", payload.business_id)
    .eq("name", payload.name)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing?.id) return existing.id;

  const { data, error } = await client
    .from("product_categories")
    .insert(payload)
    .select("*")
    .single();

  if (error?.code === "23505") {
    const { data: duplicated, error: duplicatedLookupError } = await client
      .from("product_categories")
      .select("id")
      .eq("business_id", payload.business_id)
      .eq("name", payload.name)
      .maybeSingle();

    if (duplicatedLookupError) throw duplicatedLookupError;
    if (duplicated?.id) return duplicated.id;
  }

  if (error) throw error;
  return data.id;
}

export async function updateProductCategory(categoryId, businessId, category) {
  if (!categoryId) throw new Error("El id de la categoria es obligatorio.");

  const client = getSupabaseClient();
  const payload = normalizeCategoryPayload(category, businessId);
  const { data: duplicated, error: lookupError } = await client
    .from("product_categories")
    .select("id")
    .eq("business_id", payload.business_id)
    .eq("name", payload.name)
    .neq("id", categoryId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (duplicated?.id) throw new Error("Ya existe una categoria con ese nombre en este negocio.");

  const { error } = await client
    .from("product_categories")
    .update(payload)
    .eq("id", categoryId);

  if (error) throw error;
}

export function subscribeToProducts(businessId, callback) {
  const client = getSupabaseClient();
  const channel = client
    .channel(`products:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "products",
        filter: `business_id=eq.${businessId}`,
      },
      () => {
        listProducts(businessId).then(callback).catch((error) => {
          console.error("[supabase:products]", error);
          callback([]);
        });
      }
    )
    .subscribe();

  listProducts(businessId).then(callback).catch(() => callback([]));

  return () => {
    client.removeChannel(channel);
  };
}

export function subscribeToAvailableProducts(businessId, callback) {
  return subscribeToProducts(businessId, (products) => {
    callback(products.filter((product) => product.status === "active" && product.operation?.visibleInPOS !== false));
  });
}

export function subscribeToProductCategories(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const client = getSupabaseClient();
  const channel = client
    .channel(`product_categories:${businessId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "product_categories",
        filter: `business_id=eq.${businessId}`,
      },
      () => {
        listProductCategories(businessId).then(callback).catch((error) => {
          console.error("[supabase:productCategories]", error);
          callback([]);
        });
      }
    )
    .subscribe();

  listProductCategories(businessId).then(callback).catch(() => callback([]));

  return () => {
    client.removeChannel(channel);
  };
}
