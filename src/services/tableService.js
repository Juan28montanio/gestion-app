import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { createSubscriptionErrorHandler } from "./subscriptionService";

const tablesCollection = collection(db, "tables");
const ACTIVE_TABLE_STATUSES = [
  "ocupada",
  "occupied",
  "waiting_order",
  "order_sent",
  "preparing",
  "ready",
  "waiting_payment",
  "cuenta_solicitada",
  "requested_bill",
];

function sortTables(items = []) {
  return [...items].sort((left, right) => Number(left?.number || 0) - Number(right?.number || 0));
}

async function assertUniqueTableNumber(businessId, number, currentTableId = "") {
  const snapshot = await getDocs(
    query(
      tablesCollection,
      where("business_id", "==", String(businessId || "").trim()),
      where("number", "==", Number(number))
    )
  );
  const duplicated = snapshot.docs.some((snapshotDoc) => snapshotDoc.id !== currentTableId);

  if (duplicated) {
    throw new Error("Ya existe una mesa con ese numero en este negocio.");
  }
}

function assertTableIsNotActive(tableData, actionLabel) {
  const status = String(tableData?.status || "").toLowerCase();

  if (
    ACTIVE_TABLE_STATUSES.includes(status) ||
    tableData?.current_order_id ||
    tableData?.current_session_id
  ) {
    throw new Error(`No se puede ${actionLabel} una mesa con atencion activa.`);
  }
}

async function collectionHasTableReference(collectionName, tableId, businessId) {
  const fieldNames = ["table_id", "tableId"];

  for (const fieldName of fieldNames) {
    const snapshot = await getDocs(
      query(
        collection(db, collectionName),
        where("business_id", "==", businessId),
        where(fieldName, "==", tableId),
        limit(1)
      )
    );

    if (!snapshot.empty) {
      return true;
    }
  }

  return false;
}

async function assertTableHasNoHistory(tableId, businessId) {
  const historyCollections = [
    "tableSessions",
    "orders",
    "orderItems",
    "kitchenTickets",
    "tableEvents",
    "sales_history",
  ];

  for (const collectionName of historyCollections) {
    const hasHistory = await collectionHasTableReference(collectionName, tableId, businessId);

    if (hasHistory) {
      throw new Error(
        "Esta mesa ya tiene historial operativo. Para conservar la trazabilidad, deshabilitala en lugar de eliminarla."
      );
    }
  }
}

function normalizeTablePayload(tableInput, capacity, businessId) {
  const source =
    typeof tableInput === "object" && tableInput !== null
      ? tableInput
      : {
          number: tableInput,
          capacity,
        };

  const number = Number(source.number);
  const normalizedCapacity = Number(source.capacity);
  const normalizedBusinessId = String(businessId || "").trim();
  const name = String(source.name || "").trim();
  const icon = String(source.icon || "").trim();
  const zone = String(source.zone || "Salon principal").trim();
  const status = String(source.status || "free").trim();
  const shape = String(source.shape || "square").trim();
  const position = {
    x: Number(source.position?.x ?? source.x ?? 0) || 0,
    y: Number(source.position?.y ?? source.y ?? 0) || 0,
  };

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
    name: name || `Mesa ${number}`,
    icon: icon || "UtensilsCrossed",
    code: String(source.code || "").trim(),
    zone,
    status,
    shape,
    position,
    size: String(source.size || "md").trim(),
    isActive: source.isActive ?? status !== "disabled",
    business_id: normalizedBusinessId,
    businessId: normalizedBusinessId,
    current_order_id: null,
    current_session_id: null,
    current_order_summary: "",
    current_total: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function createTable(businessId, tableInput, capacity) {
  const payload = normalizeTablePayload(tableInput, capacity, businessId);
  await assertUniqueTableNumber(payload.business_id, payload.number);
  const createdTable = await addDoc(tablesCollection, payload);
  return createdTable.id;
}

export async function updateTable(tableId, businessId, tableInput, capacity) {
  if (!tableId) {
    throw new Error("El id de la mesa es obligatorio para editar.");
  }

  const payload = normalizeTablePayload(tableInput, capacity, businessId);
  await assertUniqueTableNumber(payload.business_id, payload.number, tableId);

  await updateDoc(doc(db, "tables", tableId), {
    number: payload.number,
    capacity: payload.capacity,
    name: payload.name,
    icon: payload.icon,
    code: payload.code,
    zone: payload.zone,
    status: payload.status,
    shape: payload.shape,
    position: payload.position,
    size: payload.size,
    isActive: payload.isActive,
    business_id: payload.business_id,
    businessId: payload.businessId,
    updatedAt: serverTimestamp(),
  });
}

export async function disableTable(tableId) {
  if (!tableId) {
    throw new Error("El id de la mesa es obligatorio para deshabilitar.");
  }

  const tableRef = doc(db, "tables", tableId);
  const tableSnapshot = await getDoc(tableRef);

  if (!tableSnapshot.exists()) {
    throw new Error("La mesa indicada no existe.");
  }

  const tableData = tableSnapshot.data();

  assertTableIsNotActive(tableData, "deshabilitar");

  await updateDoc(tableRef, {
    status: "disabled",
    isActive: false,
    disabledAt: serverTimestamp(),
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

  assertTableIsNotActive(tableSnapshot.data(), "eliminar");
  await assertTableHasNoHistory(
    tableId,
    tableSnapshot.data().business_id || tableSnapshot.data().businessId
  );
  await deleteDoc(tableRef);
}

export function subscribeToTables(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const tablesQuery = query(
    tablesCollection,
    where("business_id", "==", businessId)
  );

  return onSnapshot(tablesQuery, (snapshot) => {
    const tables = sortTables(
      snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data(),
      }))
    );

    callback(tables);
  }, createSubscriptionErrorHandler({
    scope: "tables:subscribeToTables",
    callback,
    emptyValue: [],
  }));
}

export async function updateTableState(tableId, updates) {
  await updateDoc(doc(db, "tables", tableId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}
