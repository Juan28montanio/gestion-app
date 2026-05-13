import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/firebaseConfig";

export async function resetBusinessWorkspace(businessId, options = {}) {
  const normalizedBusinessId = String(businessId || "").trim();
  if (!normalizedBusinessId) {
    throw new Error("No se encontro el negocio activo para reiniciar.");
  }

  const resetWorkspace = httpsCallable(functions, "resetBusinessWorkspace");
  const result = await resetWorkspace({
    businessId: normalizedBusinessId,
    confirmation: options.confirmation,
  });

  return result.data;
}
