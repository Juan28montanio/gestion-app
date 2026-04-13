import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase/firebaseConfig";

export async function uploadRecipeImage({ businessId, productId, file }) {
  const normalizedBusinessId = String(businessId || "").trim();
  const normalizedProductId = String(productId || "draft").trim();

  if (!normalizedBusinessId) {
    throw new Error("El business_id es obligatorio para subir la imagen.");
  }

  if (!(file instanceof File)) {
    throw new Error("Debes seleccionar una imagen valida.");
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const imageRef = ref(
    storage,
    `businesses/${normalizedBusinessId}/recipeBooks/${normalizedProductId}/${safeName}`
  );

  await uploadBytes(imageRef, file);
  return getDownloadURL(imageRef);
}
