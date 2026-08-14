import fs from "node:fs";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const BUSINESS_ID = "c08a64ca-23dd-4599-b680-6192d14676aa";
const EXPECTED_MINIMUMS = {
  product_categories: 11,
  suppliers: 0,
  products: 25,
  customers: 9,
  sales: 73,
  sale_items: 22,
  payments: 20,
  cash_sessions: 4,
  cash_movements: 15,
};

function loadEnv() {
  const envText = fs.readFileSync(".env", "utf8");
  const fileEnv = Object.fromEntries(
    envText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );

  return {
    ...fileEnv,
    ...process.env,
  };
}

function formatIssue(issue) {
  return `- [${issue.scope}] ${issue.message}`;
}

async function countRows(client, table, businessId = BUSINESS_ID) {
  const { count, error } = await client
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (error) throw new Error(`${table}: ${error.message}`);
  return count || 0;
}

async function getCounts(client) {
  const counts = {};
  for (const table of Object.keys(EXPECTED_MINIMUMS)) {
    counts[table] = await countRows(client, table);
  }
  return counts;
}

function sumCounts(counts) {
  return Object.values(counts).reduce((total, count) => total + Number(count || 0), 0);
}

async function fetchRows(client, table, columns, businessId = BUSINESS_ID) {
  const { data, error } = await client
    .from(table)
    .select(columns)
    .eq("business_id", businessId);

  if (error) throw new Error(`${table}: ${error.message}`);
  return data || [];
}

async function main() {
  const env = loadEnv();
  const issues = [];

  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    throw new Error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.");
  }

  const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const session = await client.auth.getSession();
  if (session.error) {
    issues.push({ scope: "auth", message: session.error.message });
  }

  const bucket = await client.storage.from("recipe-images").list("", { limit: 1 });
  if (bucket.error) {
    issues.push({ scope: "storage", message: bucket.error.message });
  }

  const anonymousCounts = await getCounts(client);
  if (sumCounts(anonymousCounts) !== 0) {
    issues.push({
      scope: "rls",
      message: "La anon key puede leer datos de negocio sin sesion. Revisa politicas RLS.",
    });
  }

  const hasCheckCredentials = Boolean(env.SUPABASE_CHECK_EMAIL && env.SUPABASE_CHECK_PASSWORD);
  if (!hasCheckCredentials) {
    console.log("Supabase data check");
    console.log(JSON.stringify({
      businessId: BUSINESS_ID,
      anonymousCounts,
      authenticatedCounts: null,
      authenticatedCheckSkipped: true,
    }, null, 2));

    if (issues.length) {
      console.error("\nIssues:");
      console.error(issues.map(formatIssue).join("\n"));
      process.exitCode = 1;
      return;
    }

    console.log("\nOK: conexion, storage y aislamiento anonimo verificados.");
    console.log("Nota: agrega SUPABASE_CHECK_EMAIL y SUPABASE_CHECK_PASSWORD en .env para validar datos autenticados.");
    return;
  }

  const authResult = await client.auth.signInWithPassword({
    email: env.SUPABASE_CHECK_EMAIL,
    password: env.SUPABASE_CHECK_PASSWORD,
  });
  if (authResult.error) {
    issues.push({ scope: "auth", message: `No fue posible iniciar sesion de check: ${authResult.error.message}` });
    console.log("Supabase data check");
    console.log(JSON.stringify({
      businessId: BUSINESS_ID,
      anonymousCounts,
      authenticatedCounts: null,
      authenticatedCheckSkipped: false,
    }, null, 2));
    console.error("\nIssues:");
    console.error(issues.map(formatIssue).join("\n"));
    process.exitCode = 1;
    return;
  }

  const authenticatedCounts = await getCounts(client);
  for (const [table, expected] of Object.entries(EXPECTED_MINIMUMS)) {
    const actual = authenticatedCounts[table] || 0;
    if (actual < expected) {
      issues.push({
        scope: "counts",
        message: `${table} tiene ${actual}, esperado al menos ${expected}.`,
      });
    }
  }

  const [sales, saleItems, payments, cashMovements] = await Promise.all([
    fetchRows(client, "sales", "id,cash_session_id,total,paid_amount,pending_amount,status,payment_status"),
    fetchRows(client, "sale_items", "id,sale_id,product_id"),
    fetchRows(client, "payments", "id,sale_id,cash_session_id"),
    fetchRows(client, "cash_movements", "id,sale_id,payment_id,cash_session_id"),
  ]);
  const cashSessions = await fetchRows(client, "cash_sessions", "id");

  const saleIds = new Set(sales.map((row) => row.id));
  const saleIdsWithPayments = new Set(payments.map((row) => row.sale_id).filter(Boolean));
  const paymentIds = new Set(payments.map((row) => row.id));
  const cashSessionIds = new Set(cashSessions.map((row) => row.id));

  const salesWithoutPayments = sales.filter((row) => !saleIdsWithPayments.has(row.id));
  const pendingSalesWithoutPayments = salesWithoutPayments.filter((row) => Number(row.pending_amount || 0) > 0);
  const paidMonetarySalesWithoutPayments = salesWithoutPayments.filter((row) => {
    const pendingAmount = Number(row.pending_amount || 0);
    const total = Number(row.total || 0);
    return pendingAmount <= 0 && total > 0 && row.payment_status === "paid";
  });
  const nonMonetarySalesWithoutPayments = salesWithoutPayments.filter((row) => {
    const pendingAmount = Number(row.pending_amount || 0);
    const total = Number(row.total || 0);
    return pendingAmount <= 0 && total <= 0;
  });
  const unusualSalesWithoutPayments = salesWithoutPayments.filter(
    (row) =>
      !pendingSalesWithoutPayments.includes(row) &&
      !paidMonetarySalesWithoutPayments.includes(row) &&
      !nonMonetarySalesWithoutPayments.includes(row)
  );
  const itemsWithoutSale = saleItems.filter((row) => row.sale_id && !saleIds.has(row.sale_id));
  const paymentsWithoutSale = payments.filter((row) => row.sale_id && !saleIds.has(row.sale_id));
  const movementsWithoutSession = cashMovements.filter(
    (row) => row.cash_session_id && !cashSessionIds.has(row.cash_session_id)
  );
  const movementsWithoutPayment = cashMovements.filter(
    (row) => row.payment_id && !paymentIds.has(row.payment_id)
  );

  if (itemsWithoutSale.length) {
    issues.push({ scope: "relations", message: `${itemsWithoutSale.length} sale_items no tienen sale asociada.` });
  }
  if (paymentsWithoutSale.length) {
    issues.push({ scope: "relations", message: `${paymentsWithoutSale.length} payments no tienen sale asociada.` });
  }
  if (movementsWithoutSession.length) {
    issues.push({ scope: "relations", message: `${movementsWithoutSession.length} cash_movements no tienen cash_session asociada.` });
  }
  if (movementsWithoutPayment.length) {
    issues.push({ scope: "relations", message: `${movementsWithoutPayment.length} cash_movements no tienen payment asociada.` });
  }

  console.log("Supabase data check");
  console.log(JSON.stringify({
    businessId: BUSINESS_ID,
    anonymousCounts,
    authenticatedCounts,
    diagnostics: {
      salesWithoutPayments: salesWithoutPayments.length,
      pendingSalesWithoutPayments: pendingSalesWithoutPayments.length,
      paidMonetarySalesWithoutPayments: paidMonetarySalesWithoutPayments.length,
      nonMonetarySalesWithoutPayments: nonMonetarySalesWithoutPayments.length,
      unusualSalesWithoutPayments: unusualSalesWithoutPayments.length,
      itemsWithoutSale: itemsWithoutSale.length,
      paymentsWithoutSale: paymentsWithoutSale.length,
      movementsWithoutSession: movementsWithoutSession.length,
      movementsWithoutPayment: movementsWithoutPayment.length,
    },
  }, null, 2));

  if (issues.length) {
    console.error("\nIssues:");
    console.error(issues.map(formatIssue).join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log("\nOK: conexion, storage, conteos y relaciones basicas verificados.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
