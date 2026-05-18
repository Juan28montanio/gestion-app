import {
  INGREDIENT_CATEGORY_DEFAULTS,
  SUPPLIER_CATEGORY_DEFAULTS,
  normalizeOptionLabel,
} from "../utils/resourceOptions";

function defaultsForScope(scope) {
  if (scope === "supplier_categories") return SUPPLIER_CATEGORY_DEFAULTS;
  if (scope === "ingredient_categories") return INGREDIENT_CATEGORY_DEFAULTS;
  return [];
}

export async function seedDefaultTaxonomies() {
  return;
}

export function subscribeToTaxonomies(_businessId, scope, callback) {
  callback(
    defaultsForScope(scope).map((label) => ({
      id: `${scope}-${normalizeOptionLabel(label).toLocaleLowerCase("es")}`,
      label: normalizeOptionLabel(label),
      scope,
      readonly: true,
    }))
  );
  return () => {};
}

export async function createTaxonomy() {
  throw new Error("Las categorias personalizadas requieren tabla/RPC Supabase antes de habilitar escrituras.");
}

export async function updateTaxonomy() {
  throw new Error("Las categorias personalizadas requieren tabla/RPC Supabase antes de habilitar escrituras.");
}

export async function deleteTaxonomy() {
  throw new Error("Las categorias personalizadas requieren tabla/RPC Supabase antes de habilitar escrituras.");
}
