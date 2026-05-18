export function subscribeToTicketPlans(businessId, callback) {
  void businessId;
  callback([]);
  return () => {};
}

export function subscribeToMealTickets(businessId, callback) {
  void businessId;
  callback([]);
  return () => {};
}

export function subscribeToTicketConsumptions(businessId, callback) {
  void businessId;
  callback([]);
  return () => {};
}

export async function saveTicketPlan() {
  throw new Error("Los planes de tiquetera requieren tablas/RPC Supabase antes de habilitar escrituras.");
}

export async function sellMealTicket() {
  throw new Error("La venta de tiqueteras requiere una RPC Supabase antes de habilitarse.");
}

export async function registerExistingMealTicket() {
  throw new Error("El registro de tiqueteras existentes requiere una RPC Supabase antes de habilitarse.");
}

export async function consumeMealTicket() {
  throw new Error("El consumo de tiqueteras requiere una RPC Supabase antes de habilitarse.");
}

export async function cancelTicketConsumption() {
  throw new Error("La anulacion de consumos requiere una RPC Supabase antes de habilitarse.");
}

export async function updateMealTicketStatus() {
  throw new Error("El cambio de estado de tiqueteras requiere una RPC Supabase antes de habilitarse.");
}

export async function adjustMealTicketBalance() {
  throw new Error("El ajuste de saldo de tiqueteras requiere una RPC Supabase antes de habilitarse.");
}

export async function getMealTicket() {
  return null;
}
