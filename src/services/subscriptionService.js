function isPermissionError(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  return (
    code.includes("permission-denied") ||
    message.includes("missing or insufficient permissions") ||
    message.includes("permission-denied")
  );
}

const reportedPermissionScopes = new Set();

export function createSubscriptionErrorHandler({ scope, callback, emptyValue }) {
  return (error) => {
    if (isPermissionError(error)) {
      if (!reportedPermissionScopes.has(scope)) {
        reportedPermissionScopes.add(scope);
        console.warn(`[${scope}] Permisos insuficientes para leer esta coleccion.`);
      }
    } else {
      console.error(`[${scope}]`, error);
    }

    if (typeof callback === "function") {
      callback(emptyValue);
    }

    if (isPermissionError(error)) {
      return;
    }

    throw error;
  };
}
