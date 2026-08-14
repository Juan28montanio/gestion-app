import fs from "node:fs";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_BUSINESS_ID = "c08a64ca-23dd-4599-b680-6192d14676aa";

function loadEnv() {
  const fileEnv = fs.existsSync(".env")
    ? Object.fromEntries(
        fs
          .readFileSync(".env", "utf8")
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#"))
          .map((line) => {
            const index = line.indexOf("=");
            return [line.slice(0, index), line.slice(index + 1)];
          })
      )
    : {};

  return {
    ...fileEnv,
    ...process.env,
  };
}

function hasExpectedError(error, expectedFragments = []) {
  if (!error) return false;
  const message = String(error.message || "");
  return expectedFragments.some((fragment) => message.includes(fragment));
}

function formatResult(result) {
  return `${result.ok ? "OK" : "FAIL"} ${result.name}${result.detail ? `: ${result.detail}` : ""}`;
}

async function expectRpcFailure(client, name, params, expectedFragments) {
  const { error } = await client.rpc(name, params);
  if (hasExpectedError(error, expectedFragments)) {
    return { name, ok: true, detail: error.message };
  }

  if (error) {
    return { name, ok: false, detail: error.message };
  }

  return { name, ok: false, detail: "La RPC no fallo como se esperaba para la prueba segura." };
}

async function main() {
  const env = loadEnv();
  const businessId = env.SUPABASE_CHECK_BUSINESS_ID || DEFAULT_BUSINESS_ID;

  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    throw new Error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.");
  }

  if (!env.SUPABASE_CHECK_EMAIL || !env.SUPABASE_CHECK_PASSWORD) {
    throw new Error("Faltan SUPABASE_CHECK_EMAIL o SUPABASE_CHECK_PASSWORD para probar RPC autenticadas.");
  }

  const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const authResult = await client.auth.signInWithPassword({
    email: env.SUPABASE_CHECK_EMAIL,
    password: env.SUPABASE_CHECK_PASSWORD,
  });

  if (authResult.error) {
    throw new Error(`No fue posible iniciar sesion: ${authResult.error.message}`);
  }

  const results = [];
  const membership = await client.rpc("assert_business_member", {
    target_business_id: businessId,
  });
  results.push({
    name: "assert_business_member",
    ok: !membership.error,
    detail: membership.error?.message || "membresia activa confirmada",
  });

  results.push(
    await expectRpcFailure(
      client,
      "open_cash_session",
      { p_business_id: businessId, p_opening_amount: -1, p_notes: "safe rpc smoke" },
      ["Opening amount cannot be negative"]
    )
  );

  results.push(
    await expectRpcFailure(
      client,
      "close_cash_session",
      {
        p_business_id: businessId,
        p_cash_session_id: "00000000-0000-0000-0000-000000000000",
        p_counted_amount: 0,
        p_notes: "safe rpc smoke",
      },
      ["Cash session not found"]
    )
  );

  results.push(
    await expectRpcFailure(
      client,
      "close_sale",
      {
        p_business_id: businessId,
        p_sale: { total: -1, subtotal: -1 },
        p_items: [],
        p_payments: [],
      },
      ["Sale total cannot be negative"]
    )
  );

  results.push(
    await expectRpcFailure(
      client,
      "settle_sale_debt",
      {
        p_business_id: businessId,
        p_sale_id: "00000000-0000-0000-0000-000000000000",
        p_amount: 1,
        p_method: "cash",
        p_reference: "safe rpc smoke",
        p_notes: "safe rpc smoke",
      },
      ["Sale not found"]
    )
  );

  results.push(
    await expectRpcFailure(
      client,
      "save_purchase",
      {
        p_business_id: businessId,
        p_purchase_id: null,
        p_purchase: {},
        p_items: [],
        p_confirm: false,
        p_notes: "safe rpc smoke",
      },
      ["Purchase must include at least one item"]
    )
  );

  results.push(
    await expectRpcFailure(
      client,
      "cancel_purchase",
      {
        p_purchase_id: "00000000-0000-0000-0000-000000000000",
        p_reason: "safe rpc smoke",
      },
      ["Purchase not found"]
    )
  );

  results.push(
    await expectRpcFailure(
      client,
      "confirm_purchase",
      {
        p_business_id: businessId,
        p_purchase_id: "00000000-0000-0000-0000-000000000000",
        p_notes: "safe rpc smoke",
      },
      ["Purchase not found"]
    )
  );

  results.push(
    await expectRpcFailure(
      client,
      "settle_account_payable",
      {
        p_business_id: businessId,
        p_account_payable_id: "00000000-0000-0000-0000-000000000000",
        p_amount: 1,
        p_method: "cash",
        p_reference: "safe rpc smoke",
        p_notes: "safe rpc smoke",
      },
      ["Account payable not found"]
    )
  );

  results.push(
    await expectRpcFailure(
      client,
      "save_table_layout",
      {
        p_business_id: businessId,
        p_table_id: null,
        p_table: { number: 0, capacity: 2, name: "safe rpc smoke" },
      },
      ["Table number must be positive"]
    )
  );

  results.push(
    await expectRpcFailure(
      client,
      "create_or_update_technical_sheet",
      {
        p_business_id: businessId,
        p_technical_sheet_id: null,
        p_sheet: {
          name: "safe rpc smoke technical sheet",
          type: "final_product",
          category: "safe rpc smoke",
          status: "active",
          sale_price: 0,
          yield: { portions: 1 },
          costing: { currentSalePrice: 0, targetFoodCost: 30 },
        },
        p_components: [],
        p_activate: true,
      },
      ["Technical sheet must include at least one component"]
    )
  );

  results.push(
    await expectRpcFailure(
      client,
      "recalculate_product_cost",
      {
        p_business_id: businessId,
        p_product_id: "00000000-0000-0000-0000-000000000000",
      },
      ["Active technical sheet not found for product"]
    )
  );

  results.push(
    await expectRpcFailure(
      client,
      "close_sale_with_inventory_explosion",
      {
        p_business_id: businessId,
        p_sale: { total: -1, subtotal: -1, source_type: "quick_sale" },
        p_items: [],
        p_payments: [],
      },
      ["Sale total cannot be negative"]
    )
  );

  console.log("Supabase RPC check");
  results.forEach((result) => console.log(formatResult(result)));

  const failed = results.filter((result) => !result.ok);
  if (failed.length) {
    console.error("\nIssues:");
    failed.forEach((result) => console.error(`- ${formatResult(result)}`));
    process.exitCode = 1;
    return;
  }

  console.log("\nOK: RPC core y rentabilidad aplicadas y validadas sin mutar datos.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
