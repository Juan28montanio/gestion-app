import {
  createProduct,
  createProductCategory,
  listAvailableProducts,
  listProductCategories,
  listProducts,
  subscribeToAvailableProducts as subscribeToSupabaseAvailableProducts,
  subscribeToProductCategories as subscribeToSupabaseProductCategories,
  subscribeToProducts as subscribeToSupabaseProducts,
  updateProduct,
  updateProductCategory,
  archiveProduct,
  updateProductStatus,
} from "../supabase/productService";
import {
  normalizeCatalogCategories,
  normalizeCatalogProducts,
  normalizePosProducts,
} from "../../domain/catalog";

export async function getCatalogProducts(businessId) {
  return normalizeCatalogProducts(await listProducts(businessId));
}

export async function getPosProducts(businessId) {
  return normalizePosProducts(await listAvailableProducts(businessId));
}

export function subscribeToCatalogProducts(businessId, callback) {
  return subscribeToSupabaseProducts(businessId, (products) => callback(normalizeCatalogProducts(products)));
}

export function subscribeToPosProducts(businessId, callback) {
  return subscribeToSupabaseAvailableProducts(businessId, (products) => callback(normalizePosProducts(products)));
}

export async function getCatalogCategories(businessId) {
  return normalizeCatalogCategories(await listProductCategories(businessId));
}

export function subscribeToCatalogCategories(businessId, callback) {
  return subscribeToSupabaseProductCategories(businessId, (categories) => callback(normalizeCatalogCategories(categories)));
}

export {
  createProduct,
  updateProduct,
  archiveProduct,
  updateProductStatus,
  createProductCategory,
  updateProductCategory,
};
