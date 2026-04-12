import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const tablesCollection = collection(db, "tables");

function normalizeTablePayload(tableNumber, capacity, businessId) {
  const number = Number(tableNumber);
  const normalizedCapacity = Number(capacity);
  const normalizedBusinessId = String(businessId || "").trim();

  if (!normalizedBusinessId) {
    throw new Error("El business_id de la mesa es obligatorio.");
  }

  if (!Number.isInteger(number) || number <= 0) {
    throw new Error("El numero de mesa debe ser un entero mayor a 0.");
  }

  if (!Number.isInteger(normalizedCapacity) || normalizedCapacity <= 0) {
    throw new Error("La capacidad debe ser un entero mayor a 0.");
  }

  return {
    number,
    capacity: normalizedCapacity,
    status: "disponible",
    business_id: normalizedBusinessId,
    current_order_id: null,
    createdAt: serverTimestamp(),
  };
}

export async function createTable(businessId, tableNumber, capacity) {
  const payload = normalizeTablePayload(tableNumber, capacity, businessId);
  const createdTable = await addDoc(tablesCollection, payload);
  return createdTable.id;
}

export async function updateTable(tableId, businessId, tableNumber, capacity) {
  if (!tableId) {
    throw new Error("El id de la mesa es obligatorio para editar.");
  }

  const payload = normalizeTablePayload(tableNumber, capacity, businessId);

  await updateDoc(doc(db, "tables", tableId), {
    number: payload.number,
    capacity: payload.capacity,
    business_id: payload.business_id,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTable(tableId) {
  if (!tableId) {
    throw new Error("El id de la mesa es obligatorio para eliminar.");
  }

  const tableRef = doc(db, "tables", tableId);
  const tableSnapshot = await getDoc(tableRef);

  if (!tableSnapshot.exists()) {
    throw new Error("La mesa indicada no existe.");
  }

  const tableData = tableSnapshot.data();

  if (tableData.status === "ocupada" || tableData.status === "occupied") {
    throw new Error("No se puede eliminar una mesa ocupada.");
  }

  await deleteDoc(tableRef);
}

export function subscribeToTables(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const tablesQuery = query(
    tablesCollection,
    where("business_id", "==", businessId),
    orderBy("number", "asc")
  );

  return onSnapshot(tablesQuery, (snapshot) => {
    const tables = snapshot.docs.map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
    }));

    callback(tables);
  });
}

export async function updateTableState(tableId, updates) {
  await updateDoc(doc(db, "tables", tableId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}
