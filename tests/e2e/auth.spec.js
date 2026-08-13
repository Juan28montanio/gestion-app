import { expect, test } from "@playwright/test";
import { selectors } from "./helpers/selectors";

test("muestra el formulario de ingreso", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(selectors.loginEmail)).toBeVisible();
  await expect(page.locator(selectors.loginPassword)).toBeVisible();
  await expect(page.locator(selectors.loginSubmit)).toBeVisible();
});
