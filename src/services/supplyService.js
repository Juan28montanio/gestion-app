export function buildSupplySearchKey(name) {
  return String(name || "").trim().toLocaleLowerCase("es");
}

export function subscribeToSupplies(businessId, callback) {
  void businessId;
  callback([]);
  return () => {};
}

export async function createSupply() {
  throw new Error("Los insumos requieren crear la tabla/RPC Supabase antes de habilitar escrituras.");
}

export async function updateSupply() {
  throw new Error("Los insumos requieren crear la tabla/RPC Supabase antes de habilitar escrituras.");
}

export async function listSupplies() {
  return [];
}
