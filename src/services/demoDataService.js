import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/firebaseConfig";

export async function seedDemoData(businessId) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) throw new Error("No se encontro el negocio activo.");

  const seedDemo = httpsCallable(functions, "seedDemoData");
  const result = await seedDemo({ businessId: normalizedBusinessId });
  return result.data;
}

export async function cleanupDemoData(businessId) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) return 0;

  const cleanupDemo = httpsCallable(functions, "cleanupDemoData");
  const result = await cleanupDemo({ businessId: normalizedBusinessId });
  return Number(result.data?.deleted || 0);
}
