export const byTestId = (id) => `[data-testid="${id}"]`;

export const selectors = {
  loginEmail: byTestId("login-email-input"),
  loginPassword: byTestId("login-password-input"),
  loginSubmit: byTestId("login-submit-button"),
  loginError: byTestId("login-error-message"),

  appHeader: byTestId("app-header"),
  businessName: byTestId("business-name"),
  moduleName: byTestId("module-name"),
  userMenu: byTestId("user-menu-button"),
  syncStatus: byTestId("sync-status-text"),

  openCashButton: byTestId("open-cash-button"),
  cashStatus: byTestId("cash-status-label"),
  cashError: byTestId("cash-open-error"),
  cashCounted: byTestId("cash-counted-input"),

  cartButton: byTestId("cart-button"),
  cartCount: byTestId("cart-count"),
  cartTotal: byTestId("cart-total"),

  productItem: (productId) => `${byTestId("product-item")}[data-product-id="${productId}"]`,
  paymentMethod: (method) => byTestId(`payment-method-${method}`),
  chargeButton: byTestId("charge-now-button"),
  confirmPaymentButton: byTestId("confirm-payment-button"),
  changeAmount: byTestId("change-amount"),

  tableCard: (tableId) => `${byTestId("table-card")}[data-table-id="${tableId}"]`,
  openTableButton: byTestId("open-table-button"),
  requestBillButton: byTestId("request-bill-button"),
  releaseTableButton: byTestId("release-table-button"),
};

export async function getCartState(page) {
  return {
    count: await page.locator(selectors.cartCount).innerText(),
    total: await page.locator(selectors.cartTotal).innerText(),
  };
}

export async function selectPaymentMethod(page, method) {
  await page.locator(selectors.paymentMethod(method)).click();
}
