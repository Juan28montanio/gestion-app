import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export function subscribeToProducts(businessId, callback) {
  const productsQuery = query(
    collection(db, "products"),
    where("business_id", "==", businessId)
  );

  return onSnapshot(productsQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  });
}
