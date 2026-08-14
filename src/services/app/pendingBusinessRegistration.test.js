import { describe, expect, it } from "vitest";
import {
  buildPendingBusinessRegistration,
  clearPendingBusinessRegistration,
  findPendingBusinessRegistrationForEmail,
  normalizeAuthEmail,
  readPendingBusinessRegistration,
  savePendingBusinessRegistration,
} from "./pendingBusinessRegistration";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

describe("pendingBusinessRegistration", () => {
  it("normalizes auth email addresses", () => {
    expect(normalizeAuthEmail("  Usuario@Example.COM ")).toBe("usuario@example.com");
  });

  it("builds a pending registration without password data", () => {
    const pending = buildPendingBusinessRegistration({
      businessName: "  La Morena Brunch ",
      adminName: " Juan ",
      email: " JUAN@example.com ",
      password: "secret",
    });

    expect(pending).toMatchObject({
      businessName: "La Morena Brunch",
      adminName: "Juan",
      email: "juan@example.com",
    });
    expect(pending).not.toHaveProperty("password");
  });

  it("persists and matches pending registration by normalized email", () => {
    const storage = createMemoryStorage();
    savePendingBusinessRegistration(
      {
        businessName: "Cafe Norte",
        adminName: "Laura",
        email: " Laura@Cafe.test ",
      },
      storage
    );

    expect(readPendingBusinessRegistration(storage)).toMatchObject({
      businessName: "Cafe Norte",
      adminName: "Laura",
      email: "laura@cafe.test",
    });
    expect(findPendingBusinessRegistrationForEmail("LAURA@CAFE.TEST", storage)).toMatchObject({
      businessName: "Cafe Norte",
    });
    expect(findPendingBusinessRegistrationForEmail("otro@cafe.test", storage)).toBeNull();
  });

  it("clears invalid json and explicit pending registration", () => {
    const storage = createMemoryStorage();
    storage.setItem("smartprofit:pending-business-registration", "{bad json");

    expect(readPendingBusinessRegistration(storage)).toBeNull();

    savePendingBusinessRegistration(
      {
        businessName: "Cafe Sur",
        adminName: "Ana",
        email: "ana@cafe.test",
      },
      storage
    );
    clearPendingBusinessRegistration(storage);
    expect(readPendingBusinessRegistration(storage)).toBeNull();
  });
});
