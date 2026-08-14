import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const BUSINESS_ID =
  process.env.E2E_SMARTPROFIT_BUSINESS_ID || "c08a64ca-23dd-4599-b680-6192d14676aa";
const TEST_EMAIL = process.env.E2E_SMARTPROFIT_EMAIL || "katteryneramos@gmail.com";
const TEST_PASSWORD = process.env.E2E_SMARTPROFIT_PASSWORD || "tidebypacifica";
const APPLY = process.argv.includes("--apply");

function readDotenv() {
  const envPath = ".env";
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

function getEnv(name) {
  return process.env[name] || readDotenv()[name];
}

function asPositiveAmount(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function getPaymentBreakdown(sale) {
  const firebase = sale.metadata?.firebase || {};
  const breakdown = Array.isArray(firebase.payment_breakdown)
    ? firebase.payment_breakdown
    : [];

  return breakdown
    .map((payment, index) => ({
      index,
      method: String(payment?.method || firebase.payment_method || "unknown").trim() || "unknown",
      amount: asPositiveAmount(payment?.amount),
    }))
    .filter((payment) => payment.amount > 0);
}

async function main() {
  const url = getEnv("VITE_SUPABASE_URL");
  const key = getEnv("VITE_SUPABASE_ANON_KEY") || getEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) {
    throw new Error("VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY/PUBLISHABLE_KEY son obligatorios.");
  }

  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error: authError } = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (authError) throw authError;

  const { data: sales, error: salesError } = await client
    .from("sales")
    .select("id,business_id,cash_session_id,status,payment_status,total,paid_amount,closed_at,created_at,metadata")
    .eq("business_id", BUSINESS_ID)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: true });
  if (salesError) throw salesError;

  const report = {
    mode: APPLY ? "apply" : "dry-run",
    missingPayments: 0,
    backfillableSales: 0,
    backfillableAmount: 0,
    createdPayments: 0,
    updatedSales: 0,
    skippedZeroOrNoBreakdown: 0,
    skippedAlreadyBackfilled: 0,
  };

  for (const sale of sales || []) {
    const { count, error: countError } = await client
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("sale_id", sale.id);
    if (countError) throw countError;
    if (count) continue;

    report.missingPayments += 1;
    const paymentBreakdown = getPaymentBreakdown(sale);
    const breakdownAmount = paymentBreakdown.reduce((sum, payment) => sum + payment.amount, 0);
    const saleTotal = asPositiveAmount(sale.total);

    if (!saleTotal || !paymentBreakdown.length || Math.abs(breakdownAmount - saleTotal) > 0.01) {
      report.skippedZeroOrNoBreakdown += 1;
      continue;
    }

    const existingBackfillId = `${sale.id}:legacy-payment-backfill:0`;
    const { count: backfillCount, error: backfillCountError } = await client
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("business_id", BUSINESS_ID)
      .eq("legacy_firebase_id", existingBackfillId);
    if (backfillCountError) throw backfillCountError;
    if (backfillCount) {
      report.skippedAlreadyBackfilled += 1;
      continue;
    }

    report.backfillableSales += 1;
    report.backfillableAmount += saleTotal;

    if (!APPLY) continue;

    const paymentRows = paymentBreakdown.map((payment) => ({
      business_id: BUSINESS_ID,
      sale_id: sale.id,
      cash_session_id: sale.cash_session_id,
      method: payment.method,
      amount: payment.amount,
      status: "completed",
      paid_at: sale.closed_at || sale.created_at,
      legacy_firebase_id: `${sale.id}:legacy-payment-backfill:${payment.index}`,
      metadata: {
        legacy_payment_backfill: true,
        source: "scripts/backfill-legacy-sale-payments.mjs",
        original_sale_metadata_source: "metadata.firebase.payment_breakdown",
        created_at: new Date().toISOString(),
      },
    }));

    const { error: insertError } = await client.from("payments").insert(paymentRows);
    if (insertError) throw insertError;
    report.createdPayments += paymentRows.length;

    const nextMetadata = {
      ...(sale.metadata || {}),
      legacy_payment_backfill: {
        applied: true,
        amount: saleTotal,
        payments_created: paymentRows.length,
        applied_at: new Date().toISOString(),
      },
    };

    const { error: updateError } = await client
      .from("sales")
      .update({
        paid_amount: saleTotal,
        pending_amount: 0,
        metadata: nextMetadata,
      })
      .eq("id", sale.id)
      .eq("business_id", BUSINESS_ID);
    if (updateError) throw updateError;
    report.updatedSales += 1;
  }

  console.log(JSON.stringify(report, null, 2));
  if (!APPLY) {
    console.log("\nDry-run solamente. Ejecuta con --apply para insertar pagos historicos auditados.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
