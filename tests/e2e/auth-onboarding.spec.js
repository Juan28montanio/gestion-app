import { expect, test } from "@playwright/test";
import { byTestId } from "./helpers/selectors";

test("explica cuando el enlace de confirmacion expiro", async ({ page }) => {
  await page.goto(
    "/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"
  );

  await expect(page.getByText("El enlace de confirmacion ya fue usado o expiro")).toBeVisible();
  await expect(page).toHaveURL("/");
});

test("valida registro antes de llamar a Supabase", async ({ page }) => {
  await page.goto("/");
  await page.locator(byTestId("auth-register-tab")).click();

  await page.locator(byTestId("register-business-name-input")).fill("Cafe QA");
  await page.locator(byTestId("register-admin-name-input")).fill("Admin QA");
  await page.locator(byTestId("register-email-input")).fill("qa@example.com");
  await page.locator(byTestId("register-password-input")).fill("123456");
  await page.locator(byTestId("register-confirm-password-input")).fill("123457");
  await page.locator(byTestId("register-submit-button")).click();

  await expect(page.locator(byTestId("register-error-message"))).toHaveText(
    "La confirmacion de la contrasena no coincide."
  );
});
