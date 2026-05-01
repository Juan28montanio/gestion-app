import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { createSubscriptionErrorHandler } from "./subscriptionService";

const productsCollection = collection(db, "products");

function sortProducts(items = []) {
  return [...items].sort((left, right) =>
    String(left?.name || "").localeCompare(String(right?.name || ""), "es", {
      sensitivity: "base",
    })
  );
}

function normalizePreparationItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const preparationId = String(item?.preparation_id || item?.preparationId || "").trim();
      const quantity = Number(item?.quantity);

      if (!preparationId || !Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      return {
        preparation_id: preparationId,
        preparation_name: String(item?.preparation_name || item?.preparationName || "").trim(),
        output_unit: String(item?.output_unit || item?.outputUnit || "").trim(),
        quantity,
      };
    })
    .filter(Boolean);
}

function normalizeProductPayload(product, businessId) {
  const name = String(product?.name || "").trim();
  const category = String(product?.category || "").trim();
  const price = Number(product?.price);
  const stock = Number(product?.stock);
  const normalizedBusinessId = String(product?.business_id || businessId || "").trim();
  const productType = String(product?.product_type || product?.productType || "standard").trim();
  const recipeMode = String(product?.recipe_mode || product?.recipeMode || "direct").trim();
  const ticketUnits = Number(product?.ticket_units ?? product?.ticketUnits ?? 0);
  const ticketValidityDays = Number(
    product?.ticket_validity_days ?? product?.ticketValidityDays ?? 30
  );
  const preparationItems = normalizePreparationItems(
    product?.preparation_items ?? product?.preparationItems
  );

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
    recipe: Array.isArray(product?.recipe) ? product.recipe : [],
    desired_margin_pct: Number(product?.desired_margin_pct ?? product?.desiredMarginPct) || 0,
    suggested_price: Number(product?.suggested_price ?? product?.suggestedPrice) || price,
    product_type: productType || "standard",
    recipe_mode: recipeMode === "composed" ? "composed" : "direct",
    preparation_items: recipeMode === "composed" ? preparationItems : [],
    ticket_eligible:
      product?.ticket_eligible === true ||
      product?.ticketEligible === true ||
      /almuerzo|ejecutivo|menu/i.test(`${category} ${name}`),
    ticket_units: Number.isFinite(ticketUnits) && ticketUnits >= 0 ? ticketUnits : 0,
    ticket_validity_days:
      Number.isFinite(ticketValidityDays) && ticketValidityDays > 0 ? ticketValidityDays : 30,
  };
}

export function subscribeToProducts(businessId, callback) {
  if (!businessId) {
    callback([]);
    return () => {};
  }

  const productsQuery = query(
    productsCollection,
    where("business_id", "==", businessId)
  );

  return onSnapshot(productsQuery, (snapshot) => {
    callback(
      sortProducts(snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })))
    );
  }, createSubscriptionErrorHandler({
    scope: "products:subscribeToProducts",
    callback,
    emptyValue: [],
  }));
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
