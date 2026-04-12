import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const tablesCollection = collection(db, "tables");

export function subscribeToTables(businessId, callback) {
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
  await updateDoc(doc(db, "tables", tableId), updates);
}
