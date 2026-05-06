import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const RESETTABLE_COLLECTIONS = [
  "tables",
  "orders",
  "products",
  "ingredients",
  "suppliers",
  "purchases",
  "recipeBooks",
  "customers",
  "sales_history",
  "cash_closings",
  "operating_expenses",
  "resource_taxonomies",
];

async function deleteCollectionChunk(collectionName, businessId, chunkSize = 200) {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(
    query(collectionRef, where("business_id", "==", businessId), limit(chunkSize))
  );

  if (snapshot.empty) {
    return 0;
  }

  const batch = writeBatch(db);
  snapshot.docs.forEach((snapshotDoc) => {
    batch.delete(snapshotDoc.ref);
  });
  await batch.commit();
  return snapshot.size;
}

async function purgeCollectionByBusinessId(collectionName, businessId) {
  let deletedCount = 0;

  while (true) {
    const currentCount = await deleteCollectionChunk(collectionName, businessId);
    deletedCount += currentCount;

    if (currentCount === 0) {
      break;
    }
  }

  return deletedCount;
}

export async function resetBusinessWorkspace(businessId) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) {
    throw new Error("No se encontro el negocio activo para reiniciar.");
  }

  for (const collectionName of RESETTABLE_COLLECTIONS) {
    await purgeCollectionByBusinessId(collectionName, normalizedBusinessId);
  }

  await updateDoc(doc(db, "businesses", normalizedBusinessId), {
    logo_url: "",
    audit_pin_hash: "",
    audit_pin_updated_at: null,
    updatedAt: serverTimestamp(),
  });

  return true;
}
