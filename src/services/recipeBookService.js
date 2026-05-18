export function subscribeToRecipeBooks(businessId, callback) {
  void businessId;
  callback([]);
  return () => {};
}

export async function createRecipeBook() {
  throw new Error("Las fichas tecnicas requieren tablas/RPC Supabase antes de habilitar escrituras.");
}

export async function updateRecipeBook() {
  throw new Error("Las fichas tecnicas requieren tablas/RPC Supabase antes de habilitar escrituras.");
}

export async function deactivateRecipeBook() {
  throw new Error("Las fichas tecnicas requieren tablas/RPC Supabase antes de habilitar escrituras.");
}

export async function refreshRecipeBooksForIngredients() {
  return;
}
