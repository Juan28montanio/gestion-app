begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(59);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'businesses', 'businesses exists');
select has_table('public', 'business_users', 'business_users exists');
select has_table('public', 'business_settings', 'business_settings exists');
select has_table('public', 'product_categories', 'product_categories exists');
select has_table('public', 'products', 'products exists');
select has_table('public', 'customers', 'customers exists');
select has_table('public', 'sales', 'sales exists');
select has_table('public', 'sale_items', 'sale_items exists');
select has_table('public', 'payments', 'payments exists');
select has_table('public', 'cash_sessions', 'cash_sessions exists');
select has_table('public', 'cash_movements', 'cash_movements exists');
select has_table('public', 'tables', 'tables exists');
select has_table('public', 'table_sessions', 'table_sessions exists');
select has_table('public', 'table_orders', 'table_orders exists');
select has_table('public', 'kitchen_tickets', 'kitchen_tickets exists');
select has_table('public', 'table_events', 'table_events exists');
select has_table('public', 'supply_categories', 'supply_categories exists');
select has_table('public', 'supplies', 'supplies exists');
select has_table('public', 'inventory_movements', 'inventory_movements exists');
select has_table('public', 'suppliers', 'suppliers exists');
select has_table('public', 'purchases', 'purchases exists');
select has_table('public', 'purchase_items', 'purchase_items exists');
select has_table('public', 'accounts_payable', 'accounts_payable exists');
select has_table('public', 'technical_sheets', 'technical_sheets exists');
select has_table('public', 'technical_sheet_items', 'technical_sheet_items exists');
select has_table('public', 'technical_sheet_versions', 'technical_sheet_versions exists');
select has_table('public', 'product_cost_snapshots', 'product_cost_snapshots exists');
select has_table('public', 'audit_logs', 'audit_logs exists');

select has_function('public', 'current_business_ids', array[]::text[], 'current_business_ids exists');
select has_function('public', 'is_business_member', array['uuid'], 'is_business_member exists');
select has_function('public', 'has_business_role', array['uuid', 'text[]'], 'has_business_role exists');
select has_function('public', 'assert_business_member', array['uuid'], 'assert_business_member exists');
select has_function('public', 'open_cash_session', array['uuid', 'numeric', 'text'], 'open_cash_session exists');
select has_function('public', 'close_cash_session', array['uuid', 'uuid', 'numeric', 'text'], 'close_cash_session exists');
select has_function('public', 'close_sale', array['uuid', 'jsonb', 'jsonb', 'jsonb'], 'close_sale exists');
select has_function('public', 'settle_sale_debt', array['uuid', 'uuid', 'numeric', 'text', 'text', 'text'], 'settle_sale_debt exists');
select has_function('public', 'save_table_layout', array['uuid', 'uuid', 'jsonb'], 'save_table_layout exists');
select has_function('public', 'open_table_session', array['uuid', 'uuid', 'text', 'integer', 'uuid', 'text', 'text'], 'open_table_session exists');
select has_function('public', 'send_order_to_kitchen', array['uuid', 'uuid', 'uuid', 'uuid', 'jsonb', 'uuid', 'text'], 'send_order_to_kitchen exists');
select has_function('public', 'confirm_purchase', array['uuid', 'uuid', 'text'], 'confirm_purchase exists');
select has_function('public', 'settle_account_payable', array['uuid', 'uuid', 'numeric', 'text', 'text', 'text'], 'settle_account_payable exists');
select has_function('public', 'create_or_update_technical_sheet', array['uuid', 'uuid', 'jsonb', 'jsonb', 'boolean'], 'create_or_update_technical_sheet exists');
select has_function('public', 'assert_profitability_role', array['uuid', 'text[]', 'text'], 'assert_profitability_role exists');
select has_function('public', 'activate_technical_sheet_version', array['uuid', 'uuid', 'uuid'], 'activate_technical_sheet_version exists');
select has_function('public', 'recalculate_product_cost', array['uuid', 'uuid'], 'recalculate_product_cost exists');
select has_function('public', 'close_sale_with_inventory_explosion', array['uuid', 'jsonb', 'jsonb', 'jsonb'], 'close_sale_with_inventory_explosion exists');
select has_function('public', 'reverse_inventory_explosion', array['uuid', 'uuid', 'text'], 'reverse_inventory_explosion exists');

select ok(relrowsecurity, 'sales has RLS enabled') from pg_class where oid = 'public.sales'::regclass;
select ok(relrowsecurity, 'payments has RLS enabled') from pg_class where oid = 'public.payments'::regclass;
select ok(relrowsecurity, 'cash_sessions has RLS enabled') from pg_class where oid = 'public.cash_sessions'::regclass;
select ok(relrowsecurity, 'cash_movements has RLS enabled') from pg_class where oid = 'public.cash_movements'::regclass;
select ok(relrowsecurity, 'inventory_movements has RLS enabled') from pg_class where oid = 'public.inventory_movements'::regclass;
select ok(relrowsecurity, 'purchases has RLS enabled') from pg_class where oid = 'public.purchases'::regclass;
select ok(relrowsecurity, 'audit_logs has RLS enabled') from pg_class where oid = 'public.audit_logs'::regclass;
select ok(relrowsecurity, 'technical_sheets has RLS enabled') from pg_class where oid = 'public.technical_sheets'::regclass;
select ok(relrowsecurity, 'technical_sheet_items has RLS enabled') from pg_class where oid = 'public.technical_sheet_items'::regclass;
select ok(relrowsecurity, 'technical_sheet_versions has RLS enabled') from pg_class where oid = 'public.technical_sheet_versions'::regclass;
select ok(relrowsecurity, 'product_cost_snapshots has RLS enabled') from pg_class where oid = 'public.product_cost_snapshots'::regclass;

select * from finish();

rollback;
