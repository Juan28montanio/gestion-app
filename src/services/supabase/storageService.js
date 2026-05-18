import { getSupabaseClient } from "../../lib/supabaseClient";

export const RECIPE_IMAGES_BUCKET = "recipe-images";

export function buildRecipeImagePath({ businessId, productId = "draft", fileName }) {
  const safeBusinessId = String(businessId || "").trim();
  const safeProductId = String(productId || "draft").trim();

  if (!safeBusinessId) {
    throw new Error("business_id es obligatorio para construir la ruta de imagen.");
  }

  return `${safeBusinessId}/recipe_books/${safeProductId}/${fileName}`;
}

export async function uploadRecipeImage({ businessId, productId, file }) {
  const client = getSupabaseClient();
  const extension = file?.name?.includes(".") ? file.name.split(".").pop() : "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const path = buildRecipeImagePath({ businessId, productId, fileName });

  const { error } = await client.storage.from(RECIPE_IMAGES_BUCKET).upload(path, file, {
    upsert: false,
  });
  if (error) throw error;

  const { data } = client.storage.from(RECIPE_IMAGES_BUCKET).getPublicUrl(path);
  return {
    path,
    publicUrl: data.publicUrl,
  };
}
