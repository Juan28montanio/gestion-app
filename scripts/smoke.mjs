import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();

async function read(path) {
  return readFile(resolve(root, path), "utf8");
}

function assertIncludes(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`Smoke fallido: falta ${label}`);
  }
}

const [
  packageJson,
  supabaseClient,
  schema,
  rls,
  rpcCore,
  inventorySchema,
  financeSchema,
  financeRpc,
  profitabilitySchema,
  profitabilityRpc,
  operationalSchema,
  operationalRpc,
  securityGrants,
  performanceIndexes,
  openApiSpec,
] = await Promise.all([
  read("package.json"),
  read("src/lib/supabaseClient.js"),
  read("database/supabase/schema.sql"),
  read("database/supabase/rls.sql"),
  read("database/supabase/rpc-core.sql"),
  read("database/supabase/schema-inventory.sql"),
  read("database/supabase/schema-finance.sql"),
  read("database/supabase/rpc-finance.sql"),
  read("database/supabase/schema-profitability.sql"),
  read("database/supabase/rpc-profitability.sql"),
  read("database/supabase/schema-operational.sql"),
  read("database/supabase/rpc-operational.sql"),
  read("database/supabase/security-grants.sql"),
  read("database/supabase/performance-indexes.sql"),
  read("docs/openapi.json"),
]);

const pkg = JSON.parse(packageJson);

["lint", "test", "test:smoke", "check:supabase", "check:supabase:rpc", "build"].forEach((scriptName) => {
  if (!pkg.scripts?.[scriptName]) {
    throw new Error(`Smoke fallido: falta script ${scriptName}`);
  }
});

assertIncludes(supabaseClient, "createClient", "cliente Supabase");
assertIncludes(supabaseClient, "VITE_SUPABASE_URL", "variable Supabase URL");
assertIncludes(schema, "create table if not exists public.businesses", "tabla businesses");
assertIncludes(schema, "create table if not exists public.sales", "tabla sales");
assertIncludes(schema, "create table if not exists public.cash_sessions", "tabla cash_sessions");
assertIncludes(rls, "enable row level security", "RLS habilitado");
assertIncludes(rls, "business_users", "politicas por miembros de negocio");
assertIncludes(rpcCore, "create or replace function public.close_sale", "RPC close_sale");
assertIncludes(rpcCore, "create or replace function public.close_cash_session", "RPC close_cash_session");
assertIncludes(rpcCore, "create or replace function public.settle_sale_debt", "RPC settle_sale_debt");
assertIncludes(inventorySchema, "create table if not exists public.supplies", "tabla supplies");
assertIncludes(inventorySchema, "create table if not exists public.supply_categories", "tabla supply_categories");
assertIncludes(financeSchema, "create table if not exists public.purchases", "tabla purchases");
assertIncludes(financeSchema, "create table if not exists public.accounts_payable", "tabla accounts_payable");
assertIncludes(financeRpc, "create or replace function public.save_purchase", "RPC save_purchase");
assertIncludes(financeRpc, "create or replace function public.cancel_purchase", "RPC cancel_purchase");
assertIncludes(financeRpc, "create or replace function public.confirm_purchase", "RPC confirm_purchase");
assertIncludes(financeRpc, "create or replace function public.settle_account_payable", "RPC settle_account_payable");
assertIncludes(profitabilitySchema, "create table if not exists public.technical_sheets", "tabla technical_sheets");
assertIncludes(profitabilitySchema, "create table if not exists public.product_cost_snapshots", "tabla product_cost_snapshots");
assertIncludes(profitabilityRpc, "create or replace function public.create_or_update_technical_sheet", "RPC create_or_update_technical_sheet");
assertIncludes(profitabilityRpc, "create or replace function public.close_sale_with_inventory_explosion", "RPC close_sale_with_inventory_explosion");
assertIncludes(profitabilityRpc, "create or replace function public.reverse_inventory_explosion", "RPC reverse_inventory_explosion");
assertIncludes(operationalSchema, "create table if not exists public.tables", "tabla tables");
assertIncludes(operationalSchema, "create table if not exists public.kitchen_tickets", "tabla kitchen_tickets");
assertIncludes(operationalRpc, "create or replace function public.save_table_layout", "RPC save_table_layout");
assertIncludes(operationalRpc, "create or replace function public.open_table_session", "RPC open_table_session");
assertIncludes(securityGrants, "revoke execute on function public.save_purchase", "hardening RPC save_purchase");
assertIncludes(securityGrants, "grant execute on function public.close_sale", "grants RPC authenticated");
assertIncludes(performanceIndexes, "cash_movements_cash_session_id_idx", "indices FK caja");
assertIncludes(performanceIndexes, "accounts_payable_supplier_id_idx", "indices FK cartera proveedores");
assertIncludes(openApiSpec, "\"openapi\": \"3.0.3\"", "contrato OpenAPI");
assertIncludes(openApiSpec, "/rest/v1/rpc/close_sale", "Swagger RPC close_sale");
assertIncludes(openApiSpec, "/rest/v1/rpc/confirm_purchase", "Swagger RPC confirm_purchase");
assertIncludes(openApiSpec, "/rest/v1/rpc/create_or_update_technical_sheet", "Swagger RPC create_or_update_technical_sheet");
assertIncludes(openApiSpec, "/rest/v1/rpc/close_sale_with_inventory_explosion", "Swagger RPC close_sale_with_inventory_explosion");

console.log("Smoke tecnico OK: Supabase, RLS, RPCs y modelo operativo presentes.");
