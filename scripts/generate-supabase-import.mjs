import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const EXPORT_DIR = "C:/Proyectos/gestion-pos-backups/firebase-firestore-export-20260514";
const FIREBASE_BUSINESS_ID = "business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3";
const SUPABASE_BUSINESS_ID = "c08a64ca-23dd-4599-b680-6192d14676aa";
const SUPABASE_OWNER_EMAIL = "katteryneramos@gmail.com";
const SUPABASE_OWNER_ID_SQL = `(select id from public.profiles where email = '${SUPABASE_OWNER_EMAIL}' limit 1)`;
const OUT_FILE = "database/supabase/import-tide-by-pacifica.sql";

const uuidCache = new Map();

function stableUuid(scope, value) {
  const key = `${scope}:${value}`;
  if (uuidCache.has(key)) return uuidCache.get(key);

  const hash = crypto.createHash("sha256").update(key).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  uuidCache.set(key, uuid);
  return uuid;
}

function loadCollection(name) {
  const file = path.join(EXPORT_DIR, `${name}.json`);
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  return rows.filter((row) => (row.data?.business_id || row.data?.businessId) === FIREBASE_BUSINESS_ID);
}

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value ?? {}))}::jsonb`;
}

function sqlNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : String(fallback);
}

function sqlBool(value) {
  return value ? "true" : "false";
}

function sqlTimestamp(value, fallback = null) {
  const date = value || fallback;
  if (!date) return "now()";
  return `${sqlString(date)}::timestamptz`;
}

function pickDate(row, ...fields) {
  for (const field of fields) {
    if (row.data?.[field]) return row.data[field];
  }
  return row.createTime || null;
}

function normalizeSaleSourceType(value) {
  if (value === "table") return "table";
  if (value === "ticket_sale" || value === "ticket_consumption") return "ticket_wallet";
  if (value === "debt_payment") return "debt_payment";
  return "quick_sale";
}

function normalizeSaleStatus(value) {
  if (["draft", "open", "paid", "partially_paid", "cancelled", "refunded"].includes(value)) return value;
  return "paid";
}

function normalizePaymentStatus(value) {
  if (value === "completed") return "completed";
  if (["pending", "cancelled", "refunded"].includes(value)) return value;
  return "completed";
}

function normalizeCashMovementType(value) {
  if (value === "opening_balance") return "opening";
  if (value === "debt_payment_income") return "debt_payment";
  if (value === "income") return "sale_income";
  if (["opening", "sale_income", "purchase_expense", "operating_expense", "debt_payment", "adjustment", "closing", "reversal"].includes(value)) {
    return value;
  }
  return "adjustment";
}

function insert(table, columns, values, conflictTarget, updateColumns = []) {
  const insertSql = `insert into public.${table} (${columns.join(", ")})\nvalues (${values.join(", ")})`;
  if (!conflictTarget) return `${insertSql};`;
  if (!updateColumns.length) return `${insertSql}\non conflict ${conflictTarget} do nothing;`;

  return `${insertSql}\non conflict ${conflictTarget} do update set\n${updateColumns
    .map((column) => `  ${column} = excluded.${column}`)
    .join(",\n")};`;
}

const suppliers = loadCollection("suppliers");
const customers = loadCollection("customers");
const products = loadCollection("products");
const sales = [...loadCollection("sales_history"), ...loadCollection("sales")];
const saleItems = loadCollection("saleItems");
const payments = loadCollection("payments");
const cashClosings = loadCollection("cash_closings");
const cashMovements = loadCollection("cashMovements");
const inventoryMovements = loadCollection("inventoryMovements");

const categoryNames = [...new Set(products.map((row) => String(row.data.categoryName || row.data.category || "").trim()).filter(Boolean))].sort();
const categoryByName = new Map(categoryNames.map((name) => [name, stableUuid("product_categories", name.toLowerCase())]));
const supplierByLegacyId = new Map(suppliers.map((row) => [row.id, stableUuid("suppliers", row.id)]));
const customerByLegacyId = new Map(customers.map((row) => [row.id, stableUuid("customers", row.id)]));
const productByLegacyId = new Map(products.map((row) => [row.id, stableUuid("products", row.id)]));
const cashSessionByLegacyId = new Map(cashClosings.map((row) => [row.id, stableUuid("cash_sessions", row.id)]));
const saleByLegacyId = new Map(sales.map((row) => [row.id, stableUuid("sales", row.id)]));
const paymentByLegacyId = new Map(payments.map((row) => [row.id, stableUuid("payments", row.id)]));

const statements = [
  "-- Generated Firebase -> Supabase import for TIDE BY PACIFICA.",
  "-- Run this after schema.sql, rls.sql and bootstrap.sql.",
  "begin;",
  "",
  "-- Idempotency helpers for legacy Firebase IDs.",
  "alter table public.payments add column if not exists legacy_firebase_id text;",
  "alter table public.cash_sessions add column if not exists legacy_firebase_id text;",
  "alter table public.cash_movements add column if not exists legacy_firebase_id text;",
  "alter table public.inventory_movements add column if not exists legacy_firebase_id text;",
  "create unique index if not exists product_categories_business_name_unique_idx on public.product_categories (business_id, name);",
  "create unique index if not exists suppliers_business_legacy_unique_idx on public.suppliers (business_id, legacy_firebase_id) where legacy_firebase_id is not null;",
  "create unique index if not exists customers_business_legacy_unique_idx on public.customers (business_id, legacy_firebase_id) where legacy_firebase_id is not null;",
  "create unique index if not exists products_business_legacy_unique_idx on public.products (business_id, legacy_firebase_id) where legacy_firebase_id is not null;",
  "create unique index if not exists sales_business_legacy_unique_idx on public.sales (business_id, legacy_firebase_id) where legacy_firebase_id is not null;",
  "create unique index if not exists payments_business_legacy_unique_idx on public.payments (business_id, legacy_firebase_id) where legacy_firebase_id is not null;",
  "create unique index if not exists cash_sessions_business_legacy_unique_idx on public.cash_sessions (business_id, legacy_firebase_id) where legacy_firebase_id is not null;",
  "create unique index if not exists cash_movements_business_legacy_unique_idx on public.cash_movements (business_id, legacy_firebase_id) where legacy_firebase_id is not null;",
  "create unique index if not exists inventory_movements_business_legacy_unique_idx on public.inventory_movements (business_id, legacy_firebase_id) where legacy_firebase_id is not null;",
  "",
];

for (const name of categoryNames) {
  statements.push(insert(
    "product_categories",
    ["id", "business_id", "name", "sort_order", "status", "created_at", "updated_at"],
    [sqlString(categoryByName.get(name)), sqlString(SUPABASE_BUSINESS_ID), sqlString(name), "0", "'active'", "now()", "now()"],
    "(business_id, name)",
    ["updated_at"]
  ));
}

for (const row of suppliers) {
  const data = row.data;
  statements.push(insert(
    "suppliers",
    ["id", "business_id", "legacy_firebase_id", "name", "category", "phone", "email", "status", "metadata", "created_at", "updated_at"],
    [
      sqlString(supplierByLegacyId.get(row.id)),
      sqlString(SUPABASE_BUSINESS_ID),
      sqlString(row.id),
      sqlString(data.name || "Proveedor"),
      sqlString(data.category || ""),
      sqlString(data.phone || ""),
      sqlString(data.email || ""),
      sqlString(["active", "inactive", "archived"].includes(data.status) ? data.status : "active"),
      sqlJson({ firebase: data }),
      sqlTimestamp(pickDate(row, "createdAt")),
      sqlTimestamp(pickDate(row, "updatedAt"), pickDate(row, "createdAt")),
    ],
    "(id)",
    ["name", "category", "phone", "email", "status", "metadata", "updated_at"]
  ));
}

for (const row of customers) {
  const data = row.data;
  statements.push(insert(
    "customers",
    ["id", "business_id", "legacy_firebase_id", "name", "phone", "email", "document_number", "ticket_balance", "status", "metadata", "created_at", "updated_at"],
    [
      sqlString(customerByLegacyId.get(row.id)),
      sqlString(SUPABASE_BUSINESS_ID),
      sqlString(row.id),
      sqlString(data.name || data.display_name || "Cliente"),
      sqlString(data.phone || ""),
      sqlString(data.email || ""),
      sqlString(data.document_number || data.documentNumber || ""),
      sqlNumber(data.ticket_balance ?? data.ticketBalance ?? data.ticketWallet?.balance ?? 0),
      sqlString(["active", "inactive", "archived"].includes(data.status) ? data.status : "active"),
      sqlJson({ firebase: data }),
      sqlTimestamp(pickDate(row, "createdAt")),
      sqlTimestamp(pickDate(row, "updatedAt"), pickDate(row, "createdAt")),
    ],
    "(id)",
    ["name", "phone", "email", "document_number", "ticket_balance", "status", "metadata", "updated_at"]
  ));
}

for (const row of products) {
  const data = row.data;
  const categoryName = String(data.categoryName || data.category || "").trim();
  statements.push(insert(
    "products",
    ["id", "business_id", "category_id", "legacy_firebase_id", "name", "code", "description", "product_type", "status", "price", "cost", "tax_rate", "stock", "visible_in_pos", "inventory", "metadata", "created_at", "updated_at"],
    [
      sqlString(productByLegacyId.get(row.id)),
      sqlString(SUPABASE_BUSINESS_ID),
      categoryByName.has(categoryName) ? sqlString(categoryByName.get(categoryName)) : "null",
      sqlString(row.id),
      sqlString(data.name || "Producto"),
      sqlString(data.code || ""),
      sqlString(data.description || ""),
      sqlString(["standard", "prepared", "combo", "ticket_wallet", "service"].includes(data.product_type || data.type) ? data.product_type || data.type : "standard"),
      sqlString(["active", "inactive", "archived"].includes(data.status) ? data.status : "active"),
      sqlNumber(data.price ?? data.pricing?.basePrice ?? 0),
      sqlNumber(data.cost ?? data.costing?.estimatedCost ?? 0),
      sqlNumber(data.tax_rate ?? data.pricing?.taxRate ?? 0),
      sqlNumber(data.stock ?? 0),
      sqlBool(data.visible_in_pos ?? data.visibleInPOS ?? data.operation?.visibleInPOS ?? true),
      sqlJson(data.inventory || {}),
      sqlJson({ firebase: data }),
      sqlTimestamp(pickDate(row, "createdAt")),
      sqlTimestamp(pickDate(row, "updatedAt"), pickDate(row, "createdAt")),
    ],
    "(id)",
    ["category_id", "name", "code", "description", "product_type", "status", "price", "cost", "tax_rate", "stock", "visible_in_pos", "inventory", "metadata", "updated_at"]
  ));
}

for (const row of cashClosings) {
  const data = row.data;
  statements.push(insert(
    "cash_sessions",
    ["id", "business_id", "legacy_firebase_id", "opened_by", "closed_by", "status", "opening_amount", "counted_amount", "expected_amount", "difference_amount", "opened_at", "closed_at", "created_at", "updated_at"],
    [
      sqlString(cashSessionByLegacyId.get(row.id)),
      sqlString(SUPABASE_BUSINESS_ID),
      sqlString(row.id),
      SUPABASE_OWNER_ID_SQL,
      data.closed_at ? SUPABASE_OWNER_ID_SQL : "null",
      sqlString(["open", "closed", "cancelled"].includes(data.status) ? data.status : "closed"),
      sqlNumber(data.opening_amount ?? data.openingAmount ?? 0),
      data.cash_counted === undefined ? "null" : sqlNumber(data.cash_counted),
      data.cash_expected === undefined ? "null" : sqlNumber(data.cash_expected),
      data.cash_difference === undefined ? "null" : sqlNumber(data.cash_difference),
      sqlTimestamp(data.opened_at || data.openedAt || row.createTime),
      data.closed_at || data.closedAt ? sqlTimestamp(data.closed_at || data.closedAt) : "null",
      sqlTimestamp(pickDate(row, "createdAt", "opened_at")),
      sqlTimestamp(pickDate(row, "updatedAt", "closed_at"), pickDate(row, "createdAt")),
    ],
    "(id)",
    ["status", "opening_amount", "counted_amount", "expected_amount", "difference_amount", "closed_at", "updated_at"]
  ));
}

for (const row of sales) {
  const data = row.data;
  const customerLegacyId = data.customer_id || data.customerId || "";
  const cashSessionLegacyId = data.cash_session_id || data.cashSessionId || "";
  statements.push(insert(
    "sales",
    ["id", "business_id", "customer_id", "cash_session_id", "legacy_firebase_id", "sale_number", "source_type", "status", "payment_status", "subtotal", "tax_total", "discount_total", "total", "paid_amount", "pending_amount", "closed_at", "metadata", "created_at", "updated_at"],
    [
      sqlString(saleByLegacyId.get(row.id)),
      sqlString(SUPABASE_BUSINESS_ID),
      customerByLegacyId.has(customerLegacyId) ? sqlString(customerByLegacyId.get(customerLegacyId)) : "null",
      cashSessionByLegacyId.has(cashSessionLegacyId) ? sqlString(cashSessionByLegacyId.get(cashSessionLegacyId)) : "null",
      sqlString(row.id),
      sqlString(data.sale_number || data.saleNumber || ""),
      sqlString(normalizeSaleSourceType(data.source_type || data.sourceType)),
      sqlString(normalizeSaleStatus(data.status)),
      sqlString(data.payment_status === "partial" || data.paymentStatus === "partial" ? "partial" : normalizeSaleStatus(data.payment_status || data.paymentStatus)),
      sqlNumber(data.subtotal ?? data.total ?? 0),
      sqlNumber(data.tax_total ?? data.taxes ?? 0),
      sqlNumber(data.discount_total ?? data.discounts ?? 0),
      sqlNumber(data.total ?? 0),
      sqlNumber(data.paid_amount ?? data.paidAmount ?? 0),
      sqlNumber(data.pending_amount ?? data.pendingAmount ?? 0),
      data.closed_at || data.closedAt ? sqlTimestamp(data.closed_at || data.closedAt) : sqlTimestamp(pickDate(row, "createdAt")),
      sqlJson({ firebase: data }),
      sqlTimestamp(pickDate(row, "createdAt")),
      sqlTimestamp(pickDate(row, "updatedAt"), pickDate(row, "createdAt")),
    ],
    "(id)",
    ["customer_id", "cash_session_id", "status", "payment_status", "subtotal", "tax_total", "discount_total", "total", "paid_amount", "pending_amount", "closed_at", "metadata", "updated_at"]
  ));
}

for (const row of saleItems) {
  const data = row.data;
  const saleLegacyId = data.sale_id || data.saleId || "";
  if (!saleByLegacyId.has(saleLegacyId)) continue;
  const productLegacyId = data.product_id || data.productId || "";
  statements.push(insert(
    "sale_items",
    ["id", "business_id", "sale_id", "product_id", "product_name", "quantity", "unit_price", "subtotal", "status", "metadata", "created_at", "updated_at"],
    [
      sqlString(stableUuid("sale_items", row.id)),
      sqlString(SUPABASE_BUSINESS_ID),
      sqlString(saleByLegacyId.get(saleLegacyId)),
      productByLegacyId.has(productLegacyId) ? sqlString(productByLegacyId.get(productLegacyId)) : "null",
      sqlString(data.product_name || data.productName || "Producto"),
      sqlNumber(data.quantity ?? 1, 1),
      sqlNumber(data.unit_price ?? data.unitPrice ?? data.price ?? 0),
      sqlNumber(data.subtotal ?? data.total ?? 0),
      sqlString(["active", "cancelled", "refunded"].includes(data.status) ? data.status : "active"),
      sqlJson({ legacy_firebase_id: row.id, firebase: data }),
      sqlTimestamp(pickDate(row, "createdAt")),
      sqlTimestamp(pickDate(row, "updatedAt"), pickDate(row, "createdAt")),
    ],
    "(id)",
    ["product_id", "product_name", "quantity", "unit_price", "subtotal", "status", "metadata", "updated_at"]
  ));
}

for (const row of payments) {
  const data = row.data;
  const saleLegacyId = data.sale_id || data.saleId || "";
  const cashSessionLegacyId = data.cash_session_id || data.cashSessionId || "";
  statements.push(insert(
    "payments",
    ["id", "business_id", "legacy_firebase_id", "sale_id", "cash_session_id", "method", "amount", "status", "reference", "paid_at", "metadata", "created_at", "updated_at"],
    [
      sqlString(paymentByLegacyId.get(row.id)),
      sqlString(SUPABASE_BUSINESS_ID),
      sqlString(row.id),
      saleByLegacyId.has(saleLegacyId) ? sqlString(saleByLegacyId.get(saleLegacyId)) : "null",
      cashSessionByLegacyId.has(cashSessionLegacyId) ? sqlString(cashSessionByLegacyId.get(cashSessionLegacyId)) : "null",
      sqlString(data.method || "cash"),
      sqlNumber(data.amount ?? 0),
      sqlString(normalizePaymentStatus(data.status)),
      sqlString(data.reference || ""),
      sqlTimestamp(pickDate(row, "paid_at", "createdAt")),
      sqlJson({ firebase: data }),
      sqlTimestamp(pickDate(row, "createdAt")),
      sqlTimestamp(pickDate(row, "updatedAt"), pickDate(row, "createdAt")),
    ],
    "(id)",
    ["sale_id", "cash_session_id", "method", "amount", "status", "reference", "paid_at", "metadata", "updated_at"]
  ));
}

for (const row of cashMovements) {
  const data = row.data;
  const saleLegacyId = data.sale_id || data.saleId || data.source_id || data.sourceId || "";
  const paymentLegacyId = data.payment_id || data.paymentId || "";
  const cashSessionLegacyId = data.cash_session_id || data.cashSessionId || "";
  statements.push(insert(
    "cash_movements",
    ["id", "business_id", "legacy_firebase_id", "cash_session_id", "sale_id", "payment_id", "type", "method", "amount", "status", "description", "metadata", "created_at", "updated_at"],
    [
      sqlString(stableUuid("cash_movements", row.id)),
      sqlString(SUPABASE_BUSINESS_ID),
      sqlString(row.id),
      cashSessionByLegacyId.has(cashSessionLegacyId) ? sqlString(cashSessionByLegacyId.get(cashSessionLegacyId)) : "null",
      saleByLegacyId.has(saleLegacyId) ? sqlString(saleByLegacyId.get(saleLegacyId)) : "null",
      paymentByLegacyId.has(paymentLegacyId) ? sqlString(paymentByLegacyId.get(paymentLegacyId)) : "null",
      sqlString(normalizeCashMovementType(data.type)),
      sqlString(data.method || ""),
      sqlNumber(data.amount ?? 0),
      sqlString(["valid", "reversed", "cancelled"].includes(data.status) ? data.status : "valid"),
      sqlString(data.description || ""),
      sqlJson({ firebase: data }),
      sqlTimestamp(pickDate(row, "createdAt")),
      sqlTimestamp(pickDate(row, "updatedAt"), pickDate(row, "createdAt")),
    ],
    "(id)",
    ["cash_session_id", "sale_id", "payment_id", "type", "method", "amount", "status", "description", "metadata", "updated_at"]
  ));
}

for (const row of inventoryMovements) {
  const data = row.data;
  const productLegacyId = data.product_id || data.productId || data.inventory_item_id || data.inventoryItemId || "";
  statements.push(insert(
    "inventory_movements",
    ["id", "business_id", "legacy_firebase_id", "product_id", "source_type", "source_id", "movement_type", "direction", "quantity", "unit_cost", "status", "metadata", "created_at", "updated_at"],
    [
      sqlString(stableUuid("inventory_movements", row.id)),
      sqlString(SUPABASE_BUSINESS_ID),
      sqlString(row.id),
      productByLegacyId.has(productLegacyId) ? sqlString(productByLegacyId.get(productLegacyId)) : "null",
      sqlString(data.source_type || data.sourceType || "adjustment"),
      "null",
      sqlString(data.movement_type || data.movementType || "adjustment"),
      sqlString(data.direction === "in" ? "in" : "out"),
      sqlNumber(data.quantity ?? 0),
      sqlNumber(data.unit_cost ?? data.unitCost ?? 0),
      sqlString(["valid", "reversed", "cancelled"].includes(data.status) ? data.status : "valid"),
      sqlJson({ firebase: data }),
      sqlTimestamp(pickDate(row, "createdAt")),
      sqlTimestamp(pickDate(row, "updatedAt"), pickDate(row, "createdAt")),
    ],
    "(id)",
    ["product_id", "source_type", "movement_type", "direction", "quantity", "unit_cost", "status", "metadata", "updated_at"]
  ));
}

statements.push(
  "",
  insert(
    "audit_logs",
    ["business_id", "user_id", "module", "action", "entity_type", "entity_id", "new_value", "reason", "created_at"],
    [
      sqlString(SUPABASE_BUSINESS_ID),
      SUPABASE_OWNER_ID_SQL,
      "'migration'",
      "'firebase.import'",
      "'business'",
      sqlString(SUPABASE_BUSINESS_ID),
      sqlJson({
        firebase_business_id: FIREBASE_BUSINESS_ID,
        counts: {
          product_categories: categoryNames.length,
          suppliers: suppliers.length,
          customers: customers.length,
          products: products.length,
          sales: sales.length,
          sale_items: saleItems.length,
          payments: payments.length,
          cash_sessions: cashClosings.length,
          cash_movements: cashMovements.length,
          inventory_movements: inventoryMovements.length,
        },
      }),
      "'Importacion inicial desde Firebase export'",
      "now()",
    ]
  ),
  "",
  "commit;",
  "",
  "-- Quick verification:",
  "select 'products' as table_name, count(*) from public.products where business_id = 'c08a64ca-23dd-4599-b680-6192d14676aa'",
  "union all select 'customers', count(*) from public.customers where business_id = 'c08a64ca-23dd-4599-b680-6192d14676aa'",
  "union all select 'sales', count(*) from public.sales where business_id = 'c08a64ca-23dd-4599-b680-6192d14676aa'",
  "union all select 'payments', count(*) from public.payments where business_id = 'c08a64ca-23dd-4599-b680-6192d14676aa'",
  "union all select 'cash_sessions', count(*) from public.cash_sessions where business_id = 'c08a64ca-23dd-4599-b680-6192d14676aa'",
  "union all select 'cash_movements', count(*) from public.cash_movements where business_id = 'c08a64ca-23dd-4599-b680-6192d14676aa';"
);

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, `${statements.join("\n\n")}\n`);

console.log(JSON.stringify({
  outFile: OUT_FILE,
  counts: {
    product_categories: categoryNames.length,
    suppliers: suppliers.length,
    customers: customers.length,
    products: products.length,
    sales: sales.length,
    sale_items: saleItems.length,
    payments: payments.length,
    cash_sessions: cashClosings.length,
    cash_movements: cashMovements.length,
    inventory_movements: inventoryMovements.length,
  },
}, null, 2));
