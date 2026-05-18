export async function applySaleInventoryImpact() {
  return { status: "not_applicable", movementCount: 0 };
}

export async function reverseSaleInventoryImpact() {
  throw new Error("La reversa de inventario requiere una RPC Supabase antes de habilitarse.");
}
