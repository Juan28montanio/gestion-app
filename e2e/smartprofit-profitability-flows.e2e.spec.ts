/**
 * SmartProfit E2E/SQL Phase 3: Profitability engine contract
 *
 * Run: npx playwright test e2e/smartprofit-profitability-flows.e2e.spec.ts
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, type Page, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const TEST_EMAIL = process.env.E2E_SMARTPROFIT_EMAIL || "katteryneramos@gmail.com";
const TEST_PASSWORD = process.env.E2E_SMARTPROFIT_PASSWORD || "tidebypacifica";
const BUSINESS_ID =
  process.env.E2E_SMARTPROFIT_BUSINESS_ID || "c08a64ca-23dd-4599-b680-6192d14676aa";
const BUSINESS_NAME = "TIDE BY PACIFICA";

const byTestId = (id: string) => `[data-testid="${id}"]`;

const SELECTORS = {
  loginEmail: byTestId("login-email-input"),
  loginPassword: byTestId("login-password-input"),
  loginButton: byTestId("login-submit-button"),
  appHeader: byTestId("app-header"),
  businessName: byTestId("business-name"),
  syncStatus: byTestId("sync-status-text"),
  navPos: byTestId("nav-module-pos"),
  navCatalog: byTestId("nav-module-inventory"),
  posModule: byTestId("pos-module"),
  productItem: byTestId("product-item"),
  productName: byTestId("product-name"),
  productHasRecipe: byTestId("product-has-recipe"),
  productStock: byTestId("product-stock-value"),
  catalogProductCard: byTestId("catalog-product-card"),
  catalogProductName: byTestId("catalog-product-name"),
  catalogProductCost: byTestId("catalog-product-estimated-cost"),
  catalogProductRecipeStatus: byTestId("catalog-product-recipe-status"),
  catalogProfitabilityTab: byTestId("catalog-tab-profitability"),
  catalogProfitabilityPanel: byTestId("catalog-profitability-panel"),
  profitabilityWithoutSheet: byTestId("profitability-without-sheet-count"),
  profitabilityWithoutCost: byTestId("profitability-without-cost-count"),
  profitabilityHighFoodCost: byTestId("profitability-high-food-cost-count"),
};

type ProductRow = {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  product_type: string;
  inventory: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
};

type SupplyRow = {
  id: string;
  name: string;
  current_stock: number;
  average_cost: number;
  metadata: Record<string, unknown> | null;
};

type ProfitabilityFixture = {
  runId: string;
  productId: string;
  supplyId: string;
  technicalSheetId: string;
  technicalSheetVersionId: string;
  saleId?: string;
};

function readDotenv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return {};

  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        return [key, valueParts.join("=").replace(/^["']|["']$/g, "")];
      })
  );
}

function getEnv(name: string) {
  const dotenv = readDotenv();
  return process.env[name] || dotenv[name];
}

async function createAuthenticatedClient(): Promise<SupabaseClient> {
  const url = getEnv("VITE_SUPABASE_URL");
  const key = getEnv("VITE_SUPABASE_ANON_KEY") || getEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

  expect(url, "VITE_SUPABASE_URL debe estar configurado para pruebas SQL/RPC.").toBeTruthy();
  expect(key, "VITE_SUPABASE_ANON_KEY o VITE_SUPABASE_PUBLISHABLE_KEY debe estar configurado.").toBeTruthy();

  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  expect(error?.message || "").toBe("");

  return client;
}

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

function getEstimatedCost(product: ProductRow) {
  const metadata = product.metadata?.firebase;
  const costing =
    metadata && typeof metadata === "object" && "costing" in metadata
      ? (metadata.costing as { estimatedCost?: number })
      : {};
  return Number(product.cost ?? costing.estimatedCost ?? 0);
}

function e2eMetadata(runId: string) {
  return { e2e: true, phase: "profitability", run_id: runId };
}

async function createProfitabilityFixture(client: SupabaseClient, options: { stock?: number } = {}) {
  const runId = `profit-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const productName = `E2E Plato rentable ${runId}`;
  const supplyName = `E2E Insumo rentable ${runId}`;
  const stock = options.stock ?? 1000;
  const partialFixture: Partial<ProfitabilityFixture> = { runId };

  const { data: supply, error: supplyError } = await client
    .from("supplies")
    .insert({
      business_id: BUSINESS_ID,
      name: supplyName,
      category: "E2E Rentabilidad",
      unit: "g",
      current_stock: stock,
      minimum_stock: 0,
      average_cost: 10,
      last_purchase_cost: 10,
      metadata: e2eMetadata(runId),
    })
    .select("id,current_stock")
    .single();
  expect(supplyError?.message || "").toBe("");
  partialFixture.supplyId = supply.id;

  const { data: product, error: productError } = await client
    .from("products")
    .insert({
      business_id: BUSINESS_ID,
      name: productName,
      product_type: "prepared",
      status: "active",
      price: 5000,
      cost: 0,
      stock: 0,
      visible_in_pos: true,
      inventory: { inventoryImpact: "technical_sheet" },
      metadata: {
        firebase: {
          ...e2eMetadata(runId),
          category: "E2E Rentabilidad",
          categoryName: "E2E Rentabilidad",
          type: "final_product",
          operation: { visibleInPOS: true, requiresKitchen: true, kitchenStationId: "kitchen" },
          pricing: { basePrice: 5000, targetFoodCost: 30 },
          costing: { estimatedCost: 0 },
        },
      },
    })
    .select("id")
    .single();
  expect(productError?.message || "").toBe("");
  partialFixture.productId = product.id;

  const { data: sheetResult, error: sheetError } = await client.rpc("create_or_update_technical_sheet", {
      p_business_id: BUSINESS_ID,
      p_technical_sheet_id: null,
      p_sheet: {
        business_id: BUSINESS_ID,
        name: `Ficha ${productName}`,
        type: "final_product",
        category: "E2E Rentabilidad",
        status: "active",
        product_id: product.id,
        product_name: productName,
        sale_price: 5000,
        yield: { portions: 2, quantity: 2, unit: "porcion", wastePercent: 0 },
        costing: { currentSalePrice: 5000, targetFoodCost: 30 },
        metadata: e2eMetadata(runId),
      },
      p_components: [
        {
          sourceType: "raw_item",
          sourceId: supply.id,
          name: supplyName,
          quantity: 100,
          unit: "g",
          unitCost: 10,
          wastePercent: 0,
        },
      ],
      p_activate: true,
    });
  if (sheetError) {
    await archiveFixture(client, partialFixture);
  }
  expect(sheetError?.message || "").toBe("");

  return {
    runId,
    productId: product.id,
    supplyId: supply.id,
    technicalSheetId: sheetResult.technical_sheet_id,
    technicalSheetVersionId: sheetResult.technical_sheet_version_id,
  } satisfies ProfitabilityFixture;
}

async function closeFixtureSale(client: SupabaseClient, fixture: ProfitabilityFixture, quantity = 2) {
  const total = 5000 * quantity;
  const { data: saleId, error } = await client.rpc("close_sale_with_inventory_explosion", {
    p_business_id: BUSINESS_ID,
    p_sale: {
      subtotal: total,
      total,
      source_type: "quick_sale",
      reason: `E2E profitability ${fixture.runId}`,
    },
    p_items: [
      {
        product_id: fixture.productId,
        product_name: `E2E Plato rentable ${fixture.runId}`,
        quantity,
        unit_price: 5000,
        subtotal: total,
      },
    ],
    p_payments: [{ method: "cash", amount: total }],
  });
  expect(error?.message || "").toBe("");
  return saleId as string;
}

async function archiveFixture(client: SupabaseClient, fixture?: Partial<ProfitabilityFixture>) {
  if (!fixture) return;

  await Promise.allSettled([
    fixture.productId
      ? client.from("products").update({ status: "archived" }).eq("id", fixture.productId).eq("business_id", BUSINESS_ID)
      : Promise.resolve(),
    fixture.supplyId
      ? client.from("supplies").update({ status: "archived" }).eq("id", fixture.supplyId).eq("business_id", BUSINESS_ID)
      : Promise.resolve(),
    fixture.technicalSheetId
      ? client
          .from("technical_sheets")
          .update({ status: "inactive", deactivated_at: new Date().toISOString() })
          .eq("id", fixture.technicalSheetId)
          .eq("business_id", BUSINESS_ID)
      : Promise.resolve(),
  ]);
}

test.use({ viewport: { width: 1920, height: 1080 } });

test.describe("Profitability engine: current UI coverage", () => {
  test("SQL/RPC preflight documents current profitability backend state", async () => {
    const client = await createAuthenticatedClient();

    const { data: products, error: productsError } = await client
      .from("products")
      .select("id,name,price,cost,stock,product_type,inventory,metadata")
      .eq("business_id", BUSINESS_ID)
      .eq("status", "active")
      .limit(20);
    expect(productsError?.message || "").toBe("");
    expect(products?.length || 0).toBeGreaterThan(0);

    const { data: supplies, error: suppliesError } = await client
      .from("supplies")
      .select("id,name,current_stock,average_cost,metadata")
      .eq("business_id", BUSINESS_ID)
      .limit(20);
    expect(suppliesError?.message || "").toBe("");
    expect(Array.isArray(supplies)).toBe(true);

    const productsWithEstimatedCost = ((products || []) as ProductRow[]).filter(
      (product) => getEstimatedCost(product) > 0
    );
    const productsWithTechnicalSheetReference = ((products || []) as ProductRow[]).filter((product) => {
      const firebase = product.metadata?.firebase as Record<string, unknown> | undefined;
      const profitability = product.metadata?.profitability as Record<string, unknown> | undefined;
      const inventory = product.inventory || {};
      return Boolean(
        profitability?.technical_sheet_id ||
          inventory.technical_sheet_id ||
          firebase?.technicalSheetId ||
          firebase?.technical_sheet_id
      );
    });

    expect({
      products: products?.length || 0,
      supplies: (supplies as SupplyRow[] | null)?.length || 0,
      productsWithEstimatedCost: productsWithEstimatedCost.length,
      productsWithTechnicalSheetReference: productsWithTechnicalSheetReference.length,
    }).toEqual(
      expect.objectContaining({
        products: expect.any(Number),
        supplies: expect.any(Number),
        productsWithEstimatedCost: expect.any(Number),
        productsWithTechnicalSheetReference: expect.any(Number),
      })
    );
  });

  test("POS exposes prepared-product profitability signals without relying on product text selectors", async ({
    page,
  }) => {
    await loginWithValidCredentials(page);
    await navigateToModule(page, SELECTORS.navPos, SELECTORS.posModule);

    const products = page.locator(SELECTORS.productItem);
    await expect(products.first()).toBeVisible({ timeout: 30_000 });

    const firstProduct = products.first();
    await expect(firstProduct.locator(SELECTORS.productName)).toBeVisible();
    await expect(firstProduct.locator(SELECTORS.productHasRecipe)).toBeVisible();
    await expect(firstProduct.locator(SELECTORS.productStock)).toBeVisible();

    const badge = (await firstProduct.locator(SELECTORS.productHasRecipe).innerText()).toLowerCase();
    expect(badge).toMatch(/directo|compuesto|combo|ficha/);
  });

  test("Catalog profitability view shows estimated cost and margin dashboard", async ({ page }) => {
    await loginWithValidCredentials(page);
    await navigateToModule(page, SELECTORS.navCatalog);

    const productCards = page.locator(SELECTORS.catalogProductCard);
    await expect(productCards.first()).toBeVisible({ timeout: 30_000 });
    await expect(productCards.first().locator(SELECTORS.catalogProductName)).toBeVisible();
    await expect(productCards.first().locator(SELECTORS.catalogProductCost)).toBeVisible();
    await expect(productCards.first().locator(SELECTORS.catalogProductRecipeStatus)).toBeVisible();

    const estimatedCost = Number(await productCards.first().getAttribute("data-estimated-cost"));
    const marginPercent = Number(await productCards.first().getAttribute("data-gross-margin-percent"));
    expect(Number.isFinite(estimatedCost)).toBe(true);
    expect(Number.isFinite(marginPercent)).toBe(true);

    await page.locator(SELECTORS.catalogProfitabilityTab).click();
    await expect(page.locator(SELECTORS.catalogProfitabilityPanel)).toBeVisible();
    await expect(page.locator(SELECTORS.profitabilityWithoutSheet)).toBeVisible();
    await expect(page.locator(SELECTORS.profitabilityWithoutCost)).toBeVisible();
    await expect(page.locator(SELECTORS.profitabilityHighFoodCost)).toBeVisible();
  });
});

test.describe("Profitability engine: Supabase contract", () => {
  test("creates and persists a technical sheet with ingredients, yield, cost and suggested price", async () => {
    const client = await createAuthenticatedClient();
    const fixture = await createProfitabilityFixture(client);

    try {
      const { data: sheet, error } = await client
        .from("technical_sheets")
        .select("id,status,product_id,active_version_id,costing")
        .eq("business_id", BUSINESS_ID)
        .eq("id", fixture.technicalSheetId)
        .single();

      expect(error?.message || "").toBe("");
      expect(sheet.status).toBe("active");
      expect(sheet.product_id).toBe(fixture.productId);
      expect(sheet.active_version_id).toBe(fixture.technicalSheetVersionId);
      expect(Number(sheet.costing.costPerPortion)).toBe(500);

      const { data: sheetItems, error: itemsError } = await client
        .from("technical_sheet_items")
        .select("id,source_type,source_id,quantity,total_cost")
        .eq("business_id", BUSINESS_ID)
        .eq("technical_sheet_id", fixture.technicalSheetId);

      expect(itemsError?.message || "").toBe("");
      expect(sheetItems).toHaveLength(1);

      const { data: sheetVersion, error: versionError } = await client
        .from("technical_sheet_versions")
        .select("id,status,costing")
        .eq("business_id", BUSINESS_ID)
        .eq("id", fixture.technicalSheetVersionId)
        .single();

      expect(versionError?.message || "").toBe("");
      expect(sheetVersion.status).toBe("active");

      const { data: product, error: productError } = await client
        .from("products")
        .select("cost,inventory,metadata")
        .eq("business_id", BUSINESS_ID)
        .eq("id", fixture.productId)
        .single();

      expect(productError?.message || "").toBe("");
      expect(Number(product.cost)).toBe(500);
      expect(product.inventory.technical_sheet_id).toBe(fixture.technicalSheetId);
    } finally {
      await archiveFixture(client, fixture);
    }
  });

  test("closes a prepared-product sale and discounts related supplies atomically", async () => {
    const client = await createAuthenticatedClient();
    const fixture = await createProfitabilityFixture(client);

    try {
      const saleId = await closeFixtureSale(client, fixture, 2);
      fixture.saleId = saleId;

      const { data: supply, error: supplyError } = await client
        .from("supplies")
        .select("current_stock")
        .eq("business_id", BUSINESS_ID)
        .eq("id", fixture.supplyId)
        .single();

      expect(supplyError?.message || "").toBe("");
      expect(Number(supply.current_stock)).toBe(900);

      const { data: movements, error: movementsError } = await client
        .from("inventory_movements")
        .select("id,movement_type,direction,quantity,metadata")
        .eq("business_id", BUSINESS_ID)
        .eq("source_type", "sale")
        .eq("source_id", saleId);

      expect(movementsError?.message || "").toBe("");
      expect(movements).toHaveLength(1);
      expect(movements?.[0].movement_type).toBe("sale_out");
      expect(movements?.[0].direction).toBe("out");
      expect(Number(movements?.[0].quantity)).toBe(100);
      expect(movements?.[0].metadata.supply_id).toBe(fixture.supplyId);
    } finally {
      if (fixture.saleId) {
        await client.rpc("reverse_inventory_explosion", {
          p_business_id: BUSINESS_ID,
          p_sale_id: fixture.saleId,
          p_reason: `E2E cleanup ${fixture.runId}`,
        });
      }
      await archiveFixture(client, fixture);
    }
  });

  test("persists historical sale cost and margin snapshot independently from later supply cost changes", async () => {
    const client = await createAuthenticatedClient();
    const fixture = await createProfitabilityFixture(client);

    try {
      const saleId = await closeFixtureSale(client, fixture, 1);
      fixture.saleId = saleId;

      await client
        .from("supplies")
        .update({ average_cost: 99, last_purchase_cost: 99 })
        .eq("business_id", BUSINESS_ID)
        .eq("id", fixture.supplyId);

      const { data: snapshots, error: snapshotError } = await client
        .from("product_cost_snapshots")
        .select("unit_cost,total_cost,sale_price,food_cost_percent,gross_margin,technical_sheet_version_id")
        .eq("business_id", BUSINESS_ID)
        .eq("sale_id", saleId)
        .eq("source_type", "sale_close");

      expect(snapshotError?.message || "").toBe("");
      expect(snapshots).toHaveLength(1);
      expect(Number(snapshots?.[0].unit_cost)).toBe(500);
      expect(Number(snapshots?.[0].total_cost)).toBe(500);
      expect(Number(snapshots?.[0].sale_price)).toBe(5000);
      expect(Number(snapshots?.[0].food_cost_percent)).toBe(10);
      expect(Number(snapshots?.[0].gross_margin)).toBe(4500);
      expect(snapshots?.[0].technical_sheet_version_id).toBe(fixture.technicalSheetVersionId);
    } finally {
      if (fixture.saleId) {
        await client.rpc("reverse_inventory_explosion", {
          p_business_id: BUSINESS_ID,
          p_sale_id: fixture.saleId,
          p_reason: `E2E cleanup ${fixture.runId}`,
        });
      }
      await archiveFixture(client, fixture);
    }
  });

  test("blocks prepared-product sale when recipe ingredients have insufficient stock", async () => {
    const client = await createAuthenticatedClient();
    const fixture = await createProfitabilityFixture(client, { stock: 10 });

    try {
      const { error } = await client.rpc("close_sale_with_inventory_explosion", {
        p_business_id: BUSINESS_ID,
        p_sale: {
          subtotal: 10000,
          total: 10000,
          source_type: "quick_sale",
          reason: `E2E insufficient stock ${fixture.runId}`,
        },
        p_items: [
          {
            product_id: fixture.productId,
            product_name: `E2E Plato rentable ${fixture.runId}`,
            quantity: 2,
            unit_price: 5000,
            subtotal: 10000,
          },
        ],
        p_payments: [{ method: "cash", amount: 10000 }],
      });

      expect(error?.message || "").toMatch(/insufficient stock|stock insuficiente/i);

      const { data: supply, error: supplyError } = await client
        .from("supplies")
        .select("current_stock")
        .eq("business_id", BUSINESS_ID)
        .eq("id", fixture.supplyId)
        .single();

      expect(supplyError?.message || "").toBe("");
      expect(Number(supply.current_stock)).toBe(10);

      const { data: saleItems, error: saleItemsError } = await client
        .from("sale_items")
        .select("id")
        .eq("business_id", BUSINESS_ID)
        .eq("product_id", fixture.productId);

      expect(saleItemsError?.message || "").toBe("");
      expect(saleItems || []).toHaveLength(0);
    } finally {
      await archiveFixture(client, fixture);
    }
  });
});

export {};
