import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ALLOW_NON_STAGING = process.argv.includes("--allow-non-staging");
const DEMO_TAG = "phase3_demo_profitability";

function readDotenv() {
  if (!fs.existsSync(".env")) return {};
  return Object.fromEntries(
    fs
      .readFileSync(".env", "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...valueParts] = line.split("=");
        return [key, valueParts.join("=").replace(/^["']|["']$/g, "")];
      })
  );
}

function env(name) {
  return process.env[name] || readDotenv()[name];
}

async function main() {
  const smartprofitEnv = String(env("SMARTPROFIT_ENV") || "local").toLowerCase();
  if (APPLY && smartprofitEnv !== "staging" && !ALLOW_NON_STAGING) {
    throw new Error("El seed demo solo aplica en SMARTPROFIT_ENV=staging salvo que uses --allow-non-staging.");
  }

  const url = env("VITE_SUPABASE_URL");
  const key = env("VITE_SUPABASE_ANON_KEY") || env("VITE_SUPABASE_PUBLISHABLE_KEY");
  const email = env("SUPABASE_CHECK_EMAIL") || env("E2E_SMARTPROFIT_EMAIL");
  const password = env("SUPABASE_CHECK_PASSWORD") || env("E2E_SMARTPROFIT_PASSWORD");
  const businessId = env("SUPABASE_CHECK_BUSINESS_ID") || env("E2E_SMARTPROFIT_BUSINESS_ID");

  if (!url || !key || !email || !password || !businessId) {
    throw new Error("Faltan variables Supabase/check para preparar dataset demo.");
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: authError } = await client.auth.signInWithPassword({ email, password });
  if (authError) throw authError;

  const { data: existingProducts, error: existingError } = await client
    .from("products")
    .select("id,name,status,metadata")
    .eq("business_id", businessId)
    .contains("metadata", { phase3_demo: true })
    .limit(20);
  if (existingError) throw existingError;

  const report = {
    mode: APPLY ? "apply" : "dry-run",
    environment: smartprofitEnv,
    businessId,
    existingDemoProducts: existingProducts?.length || 0,
    planned: {
      supplies: ["Demo harina premium", "Demo proteina base"],
      product: "Demo plato rentable Fase 3",
      technicalSheet: "Ficha Demo plato rentable Fase 3",
      validationSale: "opcional: ejecutar E2E de rentabilidad para crear snapshot real",
    },
  };

  if (!APPLY) {
    console.log(JSON.stringify(report, null, 2));
    console.log("\nDry-run solamente. Ejecuta con --apply en staging para sembrar la demo estable.");
    return;
  }

  if ((existingProducts?.length || 0) > 0) {
    console.log(JSON.stringify({ ...report, skipped: "dataset demo ya existe" }, null, 2));
    return;
  }

  const metadata = {
    phase3_demo: true,
    demo_tag: DEMO_TAG,
    created_by: "scripts/seed-demo-profitability.mjs",
    created_at: new Date().toISOString(),
  };

  const { data: supplies, error: suppliesError } = await client
    .from("supplies")
    .insert([
      {
        business_id: businessId,
        name: "Demo harina premium",
        category: "Demo Fase 3",
        unit: "g",
        current_stock: 10_000,
        minimum_stock: 1_000,
        average_cost: 8,
        last_purchase_cost: 8,
        metadata,
      },
      {
        business_id: businessId,
        name: "Demo proteina base",
        category: "Demo Fase 3",
        unit: "g",
        current_stock: 5_000,
        minimum_stock: 500,
        average_cost: 35,
        last_purchase_cost: 35,
        metadata,
      },
    ])
    .select("id,name");
  if (suppliesError) throw suppliesError;

  const { data: product, error: productError } = await client
    .from("products")
    .insert({
      business_id: businessId,
      name: "Demo plato rentable Fase 3",
      product_type: "prepared",
      status: "active",
      price: 22000,
      cost: 0,
      stock: 0,
      visible_in_pos: true,
      inventory: { inventoryImpact: "technical_sheet" },
      metadata: {
        ...metadata,
        firebase: {
          category: "Demo Fase 3",
          categoryName: "Demo Fase 3",
          type: "final_product",
          operation: { visibleInPOS: true, requiresKitchen: true, kitchenStationId: "kitchen" },
          pricing: { basePrice: 22000, targetFoodCost: 32 },
          costing: { estimatedCost: 0 },
        },
      },
    })
    .select("id,name")
    .single();
  if (productError) throw productError;

  const components = [
    {
      sourceType: "raw_item",
      sourceId: supplies[0].id,
      name: supplies[0].name,
      quantity: 120,
      unit: "g",
      unitCost: 8,
      wastePercent: 3,
    },
    {
      sourceType: "raw_item",
      sourceId: supplies[1].id,
      name: supplies[1].name,
      quantity: 150,
      unit: "g",
      unitCost: 35,
      wastePercent: 5,
    },
  ];

  const { data: sheetResult, error: sheetError } = await client.rpc("create_or_update_technical_sheet", {
    p_business_id: businessId,
    p_technical_sheet_id: null,
    p_sheet: {
      business_id: businessId,
      name: "Ficha Demo plato rentable Fase 3",
      type: "final_product",
      category: "Demo Fase 3",
      status: "active",
      product_id: product.id,
      product_name: product.name,
      sale_price: 22000,
      yield: { portions: 1, quantity: 1, unit: "porcion", wastePercent: 0 },
      costing: { currentSalePrice: 22000, targetFoodCost: 32 },
      metadata,
    },
    p_components: components,
    p_activate: true,
  });
  if (sheetError) throw sheetError;

  console.log(
    JSON.stringify(
      {
        ...report,
        created: {
          supplies: supplies.length,
          productId: product.id,
          technicalSheetId: sheetResult.technical_sheet_id,
          technicalSheetVersionId: sheetResult.technical_sheet_version_id,
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

