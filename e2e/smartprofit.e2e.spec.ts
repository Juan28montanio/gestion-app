import { expect, type Page, test } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_SMARTPROFIT_EMAIL || "katteryneramos@gmail.com";
const TEST_PASSWORD = process.env.E2E_SMARTPROFIT_PASSWORD || "tidebypacifica";
const BUSINESS_NAME = "TIDE BY PACIFICA";
const TEST_USER = "Johan Kattheryne";

const byTestId = (id: string) => `[data-testid="${id}"]`;

const SELECTORS = {
  loginEmail: byTestId("login-email-input"),
  loginPassword: byTestId("login-password-input"),
  loginButton: byTestId("login-submit-button"),
  loginError: byTestId("login-error-container"),

  appHeader: byTestId("app-header"),
  businessName: byTestId("business-name"),
  currentUser: byTestId("user-name"),
  syncStatus: byTestId("sync-status-text"),

  moduleSalon: byTestId("nav-module-salon"),
  modulePOS: byTestId("nav-module-pos"),
  moduleCaja: byTestId("nav-module-cash"),
  moduleFinances: byTestId("nav-module-finance"),

  cashModule: byTestId("cash-module"),
  cashStatus: byTestId("cash-status-label"),
  openCashButton: byTestId("open-cash-button"),
  cashOpenError: byTestId("cash-open-error"),
  cashierName: byTestId("cashier-name"),
  salesMetric: byTestId("sales-metric"),
  expectedCashMetric: byTestId("expected-cash-metric"),
  digitalPaymentsMetric: byTestId("digital-payments-metric"),
  pendingMetric: byTestId("pending-metric"),
  paymentMethods: byTestId("payment-methods-title"),

  posModule: byTestId("pos-module"),
  cartButton: byTestId("cart-button"),
  cartCount: byTestId("cart-count"),
  cartTotal: byTestId("cart-total"),
  productItem: byTestId("product-item"),
  categoryAlmuerzos: byTestId("category-almuerzos"),
  categoryEspeciales: byTestId("category-especiales"),
  categoryBebidas: byTestId("category-bebidas-calientes"),
  checkoutPanel: byTestId("checkout-panel"),
  checkoutTitle: byTestId("checkout-title"),
  chargeButton: byTestId("charge-now-button"),
  cancelButton: byTestId("cancel-order-button"),
  immediateSaleButton: byTestId("immediate-sale-button"),
  paymentCash: byTestId("payment-method-cash"),
  paymentDebit: byTestId("payment-method-debit_card"),
  paymentCredit: byTestId("payment-method-credit_card"),
  exactAmount: byTestId("exact-amount"),

  salonModule: byTestId("salon-module"),
  tableMap: byTestId("table-map"),
  tableCard: byTestId("table-card"),
  tableBarra: `${byTestId("open-table-button")}[data-table-name="Barra"]`,
};

async function loginWithValidCredentials(page: Page) {
  await page.goto("/");
  await page.locator(SELECTORS.loginEmail).fill(TEST_EMAIL);
  await page.locator(SELECTORS.loginPassword).fill(TEST_PASSWORD);
  await page.locator(SELECTORS.loginButton).click();

  await expect(page.locator(SELECTORS.appHeader)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(SELECTORS.businessName)).toContainText(BUSINESS_NAME);
  await expect(page.locator(SELECTORS.syncStatus)).toBeVisible();
}

async function navigateToModule(page: Page, selector: string, readySelector?: string) {
  await page.locator(selector).click();
  await expect(page.locator(SELECTORS.appHeader)).toBeVisible();
  if (readySelector) {
    await expect(page.locator(readySelector)).toBeVisible({ timeout: 30_000 });
  }
}

async function getCartState(page: Page) {
  const count = Number((await page.locator(SELECTORS.cartCount).innerText()).trim() || 0);
  const totalText = await page.locator(SELECTORS.cartTotal).innerText();
  const total = Number(totalText.replace(/[^\d]/g, "")) || 0;
  return { count, total, totalText };
}

async function addProductToCart(page: Page, productName: string) {
  const product = page.locator(SELECTORS.productItem).filter({ hasText: productName }).first();
  await expect(product, `Producto no encontrado: ${productName}`).toBeVisible();
  await product.click();
}

function checkoutPanel(page: Page) {
  return page
    .locator(`${SELECTORS.checkoutPanel}:visible, ${byTestId("checkout-panel-mobile")}:visible`)
    .first();
}

test.describe("Authentication Flow", () => {
  test("Login with valid credentials", async ({ page }) => {
    await loginWithValidCredentials(page);
    await expect(page.locator(SELECTORS.currentUser)).toContainText(TEST_USER);
    await expect(page.locator(SELECTORS.businessName)).toContainText(BUSINESS_NAME);
  });

  test("Login with invalid credentials", async ({ page }) => {
    await page.goto("/");
    await page.locator(SELECTORS.loginEmail).fill(TEST_EMAIL);
    await page.locator(SELECTORS.loginPassword).fill("wrongpassword123");
    await page.locator(SELECTORS.loginButton).click();

    await expect(page.locator(SELECTORS.loginEmail)).toBeVisible();
    await expect(page.locator(SELECTORS.loginPassword)).toBeVisible();
  });
});

test.describe("Cash Drawer Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithValidCredentials(page);
    await navigateToModule(page, SELECTORS.moduleCaja, SELECTORS.cashModule);
  });

  test("Cash module shows status and operator context", async ({ page }) => {
    await expect(page.locator(SELECTORS.cashStatus)).toBeVisible();
    await expect(page.locator(SELECTORS.cashierName)).toContainText(TEST_USER);
  });

  test("Cash status display shows core metrics", async ({ page }) => {
    await expect(page.locator(SELECTORS.salesMetric)).toBeVisible();
    await expect(page.locator(SELECTORS.expectedCashMetric)).toBeVisible();
    await expect(page.locator(SELECTORS.digitalPaymentsMetric)).toBeVisible();
    await expect(page.locator(SELECTORS.pendingMetric)).toBeVisible();
    await expect(page.locator(SELECTORS.paymentMethods)).toBeVisible();
    await expect(page.locator(byTestId("payment-method-cash"))).toBeVisible();
    await expect(page.locator(byTestId("payment-method-nequi"))).toBeVisible();
    await expect(page.locator(byTestId("payment-method-daviplata"))).toBeVisible();
  });

  test("Cash drawer button is responsive", async ({ page }) => {
    const openButton = page.locator(SELECTORS.openCashButton);

    if (await openButton.count() > 0) {
      await expect(openButton).toBeEnabled();
      await openButton.click();
      await expect(
        page.locator(`${SELECTORS.cashOpenError}, ${SELECTORS.cashStatus}`).first()
      ).toBeVisible({ timeout: 15_000 });
    } else {
      await expect(page.locator(SELECTORS.cashStatus)).toContainText(/abierta/i);
    }
  });
});

test.describe("Point of Sale Sales Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithValidCredentials(page);
    await navigateToModule(page, SELECTORS.modulePOS, SELECTORS.posModule);
  });

  test("POS module loads with product catalog", async ({ page }) => {
    await expect(page.locator(SELECTORS.cartButton)).toBeVisible();
    const cart = await getCartState(page);
    expect(cart.count).toBeGreaterThanOrEqual(0);
    await expect(page.locator(SELECTORS.productItem).first()).toBeVisible();
  });

  test("Product categories are available", async ({ page }) => {
    await expect(page.locator(SELECTORS.categoryAlmuerzos)).toBeVisible();
    await expect(page.locator(SELECTORS.categoryEspeciales)).toBeVisible();
    await expect(page.locator(SELECTORS.categoryBebidas)).toBeVisible();
  });

  test("Add single product to cart", async ({ page }) => {
    await addProductToCart(page, "Almuerzo base");

    const cart = await getCartState(page);
    expect(cart.count).toBe(1);
    expect(cart.total).toBeGreaterThan(0);
    const checkout = checkoutPanel(page);
    await expect(checkout).toBeVisible();
    await expect(checkout.locator(SELECTORS.checkoutTitle)).toBeVisible();
    await expect(checkout.getByRole("heading", { name: "Almuerzo base" })).toBeVisible();
  });

  test("Checkout panel displays payment information", async ({ page }) => {
    await addProductToCart(page, "Almuerzo base");

    const checkout = checkoutPanel(page);
    await expect(checkout).toBeVisible();
    await expect(checkout.locator(SELECTORS.checkoutTitle)).toBeVisible();
    await expect(checkout.locator(SELECTORS.paymentCash)).toBeVisible();
    await expect(checkout.locator(SELECTORS.paymentDebit)).toBeVisible();
    await expect(checkout.locator(SELECTORS.paymentCredit)).toBeVisible();
    await expect(checkout.locator(SELECTORS.chargeButton)).toBeVisible();
  });

  test("Quick amount buttons are available for cash payments", async ({ page }) => {
    await addProductToCart(page, "Almuerzo base");
    await expect(checkoutPanel(page).locator(SELECTORS.exactAmount)).toBeVisible();
  });
});

test.describe("Salon Table Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithValidCredentials(page);
    await navigateToModule(page, SELECTORS.moduleSalon, SELECTORS.salonModule);
  });

  test("Salon module displays table map", async ({ page }) => {
    await expect(page.locator(SELECTORS.salonModule)).toBeVisible();
    await expect(page.locator(SELECTORS.tableMap)).toBeVisible();
    await expect(page.locator(SELECTORS.tableCard)).toHaveCount(6);
  });

  test("Configured table cards show status information", async ({ page }) => {
    await expect(page.locator(SELECTORS.tableBarra)).toBeVisible();
    await expect(page.locator(SELECTORS.tableCard).first()).toContainText("personas");
    await expect(page.locator(SELECTORS.tableCard).first()).toContainText("items");
    await expect(page.locator(SELECTORS.tableCard).first()).toContainText("tiempo");
  });
});

test.describe("Navigation and Business Context", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithValidCredentials(page);
  });

  test("Business context persists across module navigation", async ({ page }) => {
    await navigateToModule(page, SELECTORS.moduleCaja, SELECTORS.cashModule);
    await expect(page.locator(SELECTORS.businessName)).toContainText(BUSINESS_NAME);

    await navigateToModule(page, SELECTORS.modulePOS, SELECTORS.posModule);
    await expect(page.locator(SELECTORS.businessName)).toContainText(BUSINESS_NAME);
  });

  test("Current user and sync status persist across navigation", async ({ page }) => {
    await expect(page.locator(SELECTORS.currentUser)).toContainText(TEST_USER);
    await navigateToModule(page, SELECTORS.moduleCaja, SELECTORS.cashModule);
    await expect(page.locator(SELECTORS.currentUser)).toContainText(TEST_USER);
    await expect(page.locator(SELECTORS.syncStatus)).toBeVisible();
  });
});
