import {
  createTableRow,
  deleteTableRow,
  disableTableRow,
  subscribeTables,
  updateTableRow,
  updateTableRowState,
} from "./supabase/salonService";

function normalizeTablePayload(tableInput, capacity, businessId) {
  const source =
    typeof tableInput === "object" && tableInput !== null
      ? tableInput
      : { number: tableInput, capacity };
  const number = Number(source.number);
  const normalizedCapacity = Number(source.capacity);
  const normalizedBusinessId = String(businessId || source.business_id || source.businessId || "").trim();

  if (!normalizedBusinessId) throw new Error("El business_id de la mesa es obligatorio.");
  if (!Number.isInteger(number) || number <= 0) throw new Error("El numero de mesa debe ser un entero mayor a 0.");
  if (!Number.isInteger(normalizedCapacity) || normalizedCapacity <= 0) throw new Error("La capacidad debe ser un entero mayor a 0.");

  return {
    ...source,
    number,
    capacity: normalizedCapacity,
    business_id: normalizedBusinessId,
    businessId: normalizedBusinessId,
    name: String(source.name || `Mesa ${number}`).trim(),
    zone: String(source.zone || "Salon principal").trim(),
    status: String(source.status || "free").trim(),
  };
}

export async function createTable(businessId, tableInput, capacity) {
  const payload = normalizeTablePayload(tableInput, capacity, businessId);
  return createTableRow(payload.business_id, payload);
}

export async function updateTable(tableId, businessId, tableInput, capacity) {
  if (!tableId) throw new Error("El id de la mesa es obligatorio para editar.");
  const payload = normalizeTablePayload(tableInput, capacity, businessId);
  return updateTableRow(tableId, payload.business_id, payload);
}

export async function disableTable(tableId) {
  if (!tableId) throw new Error("El id de la mesa es obligatorio para deshabilitar.");
  return disableTableRow(tableId);
}

export async function deleteTable(tableId) {
  if (!tableId) throw new Error("El id de la mesa es obligatorio para eliminar.");
  return deleteTableRow(tableId);
}

export function subscribeToTables(businessId, callback) {
  return subscribeTables(businessId, callback);
}

export async function updateTableState(tableId, updates) {
  return updateTableRowState(tableId, updates);
}
