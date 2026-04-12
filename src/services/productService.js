import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const productsCollection = collection(db, "products");

function normalizeProductPayload(product, businessId) {
  const name = String(product?.name || "").trim();
  const category = String(product?.category || "").trim();
  const price = Number(product?.price);
  const stock = Number(product?.stock);
  const normalizedBusinessId = String(product?.business_id || businessId || "").trim();

  if (!name) {
    throw new Error("El nombre del producto es obligatorio.");
  }

  if (!category) {
    throw new Error("La categoria del producto es obligatoria.");
  }

  if (!normalizedBusinessId) {
    throw new Error("El business_id del producto es obligatorio.");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("El precio debe ser un numero valido mayor o igual a 0.");
  }

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("El stock debe ser un numero valido mayor o igual a 0.");
  }

  return {
    name,
    price,
    category,
    stock,
    business_id: normalizedBusinessId,
    is_available: product?.is_available ?? true,
  };
}

export function subscribeToProducts(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const productsQuery = query(
    productsCollection,
    where("business_id", "==", businessId),
    orderBy("name", "asc")
  );

  return onSnapshot(productsQuery, (snapshot) => {
    callback(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })));
  });
}

export function subscribeToAvailableProducts(businessId, callback) {
  return subscribeToProducts(businessId, (products) => {
    callback(products.filter((product) => product.is_available === true));
  });
}

export async function createProduct(businessId, product) {
  const payload = normalizeProductPayload(product, businessId);

  const createdProduct = await addDoc(productsCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return createdProduct.id;
}

export async function updateProduct(productId, businessId, product) {
  if (!productId) {
    throw new Error("El id del producto es obligatorio para actualizar.");
  }

  const payload = normalizeProductPayload(product, businessId);

  await updateDoc(doc(db, "products", productId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(productId) {
  if (!productId) {
    throw new Error("El id del producto es obligatorio para eliminar.");
  }

  await deleteDoc(doc(db, "products", productId));
}
