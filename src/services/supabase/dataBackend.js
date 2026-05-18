export const DATA_BACKENDS = {
  supabase: "supabase",
};

export const DATA_MODULES = {
  products: "products",
  customers: "customers",
  sales: "sales",
};

const MODULE_ENV_KEYS = {
  [DATA_MODULES.products]: "VITE_PRODUCTS_BACKEND",
  [DATA_MODULES.customers]: "VITE_CUSTOMERS_BACKEND",
  [DATA_MODULES.sales]: "VITE_SALES_BACKEND",
};

function normalizeBackend(value) {
  void value;
  return DATA_BACKENDS.supabase;
}

export function getConfiguredDataBackend() {
  return normalizeBackend(import.meta.env.VITE_DATA_BACKEND);
}

export function getConfiguredModuleBackend(moduleName) {
  const envKey = MODULE_ENV_KEYS[moduleName];
  if (!envKey) return getConfiguredDataBackend();
  return normalizeBackend(import.meta.env[envKey] || getConfiguredDataBackend());
}

export function isSupabaseBackendEnabled() {
  return getConfiguredDataBackend() === DATA_BACKENDS.supabase;
}

export function isSupabaseModuleEnabled(moduleName) {
  return getConfiguredModuleBackend(moduleName) === DATA_BACKENDS.supabase;
}
