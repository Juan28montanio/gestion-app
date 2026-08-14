import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const DEFAULT_BUSINESS_ID = "c08a64ca-23dd-4599-b680-6192d14676aa";

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

function getEnv(name) {
  return process.env[name] || readDotenv()[name];
}

function number(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function main() {
  const url = getEnv("VITE_SUPABASE_URL");
  const key = getEnv("VITE_SUPABASE_ANON_KEY") || getEnv("VITE_SUPABASE_PUBLISHABLE_KEY");
  const email = getEnv("SUPABASE_CHECK_EMAIL");
  const password = getEnv("SUPABASE_CHECK_PASSWORD");
  const businessId = getEnv("SUPABASE_CHECK_BUSINESS_ID") || DEFAULT_BUSINESS_ID;

  if (!url || !key || !email || !password) {
    throw new Error("Faltan variables Supabase/check para generar reporte de rentabilidad.");
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: authError } = await client.auth.signInWithPassword({ email, password });
  if (authError) throw authError;

  const { data: snapshots, error } = await client
    .from("product_cost_snapshots")
    .select("product_id,sale_id,sale_item_id,source_type,sale_price,unit_cost,gross_margin,gross_margin_percent,created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  const productIds = [...new Set((snapshots || []).map((snapshot) => snapshot.product_id).filter(Boolean))];
  const productNames = new Map();
  if (productIds.length) {
    const { data: products, error: productsError } = await client
      .from("products")
      .select("id,name")
      .in("id", productIds);
    if (productsError) throw productsError;
    for (const product of products || []) {
      productNames.set(product.id, product.name);
    }
  }

  const saleSnapshots = (snapshots || []).filter((snapshot) => snapshot.source_type === "sale_close");
  const totals = saleSnapshots.reduce(
    (acc, snapshot) => {
      acc.revenue += number(snapshot.sale_price);
      acc.cost += number(snapshot.unit_cost);
      acc.margin += number(snapshot.gross_margin);
      return acc;
    },
    { revenue: 0, cost: 0, margin: 0 }
  );
  const avgMarginPercent = totals.revenue > 0 ? (totals.margin / totals.revenue) * 100 : 0;

  const byProduct = new Map();
  for (const snapshot of saleSnapshots) {
    const key = snapshot.product_id || snapshot.product_name || "unknown";
    const current = byProduct.get(key) || {
      productId: snapshot.product_id,
      productName: productNames.get(snapshot.product_id) || "Sin nombre",
      sales: 0,
      revenue: 0,
      cost: 0,
      margin: 0,
    };
    current.sales += 1;
    current.revenue += number(snapshot.sale_price);
    current.cost += number(snapshot.unit_cost);
    current.margin += number(snapshot.gross_margin);
    byProduct.set(key, current);
  }

  const ranking = [...byProduct.values()]
    .map((row) => ({
      ...row,
      marginPercent: row.revenue > 0 ? (row.margin / row.revenue) * 100 : 0,
    }))
    .sort((left, right) => right.margin - left.margin)
    .slice(0, 10);

  console.log(
    JSON.stringify(
      {
        businessId,
        snapshotCount: snapshots?.length || 0,
        saleSnapshotCount: saleSnapshots.length,
        totals,
        avgMarginPercent: Number(avgMarginPercent.toFixed(2)),
        topProducts: ranking.map((row) => ({
          productName: row.productName,
          sales: row.sales,
          revenue: Number(row.revenue.toFixed(2)),
          cost: Number(row.cost.toFixed(2)),
          margin: Number(row.margin.toFixed(2)),
          marginPercent: Number(row.marginPercent.toFixed(2)),
        })),
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
