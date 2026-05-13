import { describe, expect, it } from "vitest";
import { hasPermission, normalizeUserRole, requireAdmin } from "./accountPermissions";

describe("accountPermissions", () => {
  it("normaliza roles desconocidos como solo lectura", () => {
    expect(normalizeUserRole("owner")).toBe("owner");
    expect(normalizeUserRole("mystery")).toBe("viewer");
  });

  it("restringe acciones criticas fuera de owner/admin", () => {
    expect(hasPermission({ role: "cashier" }, "pos.createSale")).toBe(true);
    expect(hasPermission({ role: "cashier" }, "workspace.reset")).toBe(false);
    expect(() => requireAdmin({ role: "cashier" })).toThrow("administrador");
    expect(() => requireAdmin({ role: "admin" })).not.toThrow();
  });
});
