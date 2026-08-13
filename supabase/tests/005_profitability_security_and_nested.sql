begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(16);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('13000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'nested-owner@example.test', crypt('password', gen_salt('bf')), now(), now(), now()),
  ('13000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'nested-cashier@example.test', crypt('password', gen_salt('bf')), now(), now(), now()),
  ('13000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'nested-waiter@example.test', crypt('password', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, email, display_name)
values
  ('13000000-0000-0000-0000-000000000001', 'nested-owner@example.test', 'Nested Owner'),
  ('13000000-0000-0000-0000-000000000002', 'nested-cashier@example.test', 'Nested Cashier'),
  ('13000000-0000-0000-0000-000000000003', 'nested-waiter@example.test', 'Nested Waiter')
on conflict (id) do nothing;

insert into public.businesses (id, name, owner_user_id)
values ('23000000-0000-0000-0000-000000000001', 'Nested Business', '13000000-0000-0000-0000-000000000001');

insert into public.business_users (business_id, user_id, role, status, email)
values
  ('23000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'owner', 'active', 'nested-owner@example.test'),
  ('23000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000002', 'cashier', 'active', 'nested-cashier@example.test'),
  ('23000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000003', 'waiter', 'active', 'nested-waiter@example.test');

insert into public.business_settings (business_id, settings)
values ('23000000-0000-0000-0000-000000000001', '{"inventory":{"allow_negative_stock":false}}'::jsonb);

insert into public.supplies (id, business_id, name, unit, current_stock, average_cost, last_purchase_cost)
values ('34000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', 'Masa nested', 'g', 1000, 1, 1);

insert into public.products (id, business_id, name, product_type, price, cost)
values
  ('35000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', 'Producto nested preparado', 'prepared', 1000, 0),
  ('35000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000001', 'Producto directo', 'standard', 500, 0);

set local role authenticated;
select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"13000000-0000-0000-0000-000000000002","role":"authenticated"}', true);

select throws_ok(
  $$
    select public.create_or_update_technical_sheet(
      '23000000-0000-0000-0000-000000000001',
      null,
      jsonb_build_object('name', 'No autorizado', 'yield', jsonb_build_object('portions', 1)),
      jsonb_build_array(jsonb_build_object('sourceType', 'raw_item', 'sourceId', '34000000-0000-0000-0000-000000000001', 'name', 'Masa nested', 'quantity', 1, 'unit', 'g', 'unitCost', 1)),
      true
    )
  $$,
  '42501',
  null,
  'cashier cannot create technical sheets'
);

select is((select count(*)::integer from public.technical_sheets), 0, 'unauthorized technical sheet write rolled back');

select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"13000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select lives_ok(
  $$
    select public.create_or_update_technical_sheet(
      '23000000-0000-0000-0000-000000000001',
      null,
      jsonb_build_object(
        'name', 'Base nested con merma',
        'type', 'base',
        'category', 'Base',
        'status', 'active',
        'yield', jsonb_build_object('portions', 1, 'quantity', 1, 'unit', 'porcion'),
        'costing', jsonb_build_object('currentSalePrice', 0, 'targetFoodCost', 30)
      ),
      jsonb_build_array(
        jsonb_build_object(
          'sourceType', 'raw_item',
          'sourceId', '34000000-0000-0000-0000-000000000001',
          'name', 'Masa nested',
          'quantity', 100,
          'unit', 'g',
          'unitCost', 1,
          'wastePercent', 10
        )
      ),
      true
    )
  $$,
  'owner creates base technical sheet with waste'
);

select lives_ok(
  $$
    select public.create_or_update_technical_sheet(
      '23000000-0000-0000-0000-000000000001',
      null,
      jsonb_build_object(
        'name', 'Producto nested preparado',
        'type', 'final_product',
        'category', 'Final',
        'status', 'active',
        'product_id', '35000000-0000-0000-0000-000000000001',
        'product_name', 'Producto nested preparado',
        'sale_price', 1000,
        'yield', jsonb_build_object('portions', 1, 'quantity', 1, 'unit', 'porcion'),
        'costing', jsonb_build_object('currentSalePrice', 1000, 'targetFoodCost', 30)
      ),
      jsonb_build_array(
        jsonb_build_object(
          'sourceType', 'technical_sheet',
          'sourceId', (select id from public.technical_sheets where type = 'base' limit 1),
          'name', 'Base nested con merma',
          'quantity', 1,
          'unit', 'porcion',
          'unitCost', 111.1111,
          'wastePercent', 0
        )
      ),
      true
    )
  $$,
  'owner creates final technical sheet from base sheet'
);

select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"13000000-0000-0000-0000-000000000003","role":"authenticated"}', true);

select is((select count(*)::integer from public.technical_sheets), 0, 'waiter cannot read cost-bearing technical sheets through RLS');

select lives_ok(
  $$
    select public.open_cash_session('23000000-0000-0000-0000-000000000001', 0, 'nested profitability test')
  $$,
  'waiter can open a cash session through existing operational RPC'
);

select lives_ok(
  $$
    select public.close_sale_with_inventory_explosion(
      '23000000-0000-0000-0000-000000000001',
      jsonb_build_object(
        'cash_session_id', (select id from public.cash_sessions where business_id = '23000000-0000-0000-0000-000000000001' and status = 'open' limit 1),
        'subtotal', 1500,
        'total', 1500,
        'source_type', 'quick_sale'
      ),
      jsonb_build_array(
        jsonb_build_object(
          'product_id', '35000000-0000-0000-0000-000000000001',
          'product_name', 'Producto nested preparado',
          'quantity', 1,
          'unit_price', 1000,
          'subtotal', 1000
        ),
        jsonb_build_object(
          'product_id', '35000000-0000-0000-0000-000000000002',
          'product_name', 'Producto directo',
          'quantity', 1,
          'unit_price', 500,
          'subtotal', 500
        )
      ),
      jsonb_build_array(jsonb_build_object('method', 'cash', 'amount', 1500))
    )
  $$,
  'waiter can close mixed sale with nested technical sheet explosion'
);

select is((select count(*)::integer from public.sale_items), 2, 'mixed sale creates prepared and direct sale items');
select is((select count(*)::integer from public.inventory_movements where movement_type = 'sale_out'), 1, 'only prepared nested product creates inventory movement');
select is((select count(*)::integer from public.product_cost_snapshots where source_type = 'sale_close'), 0, 'waiter cannot read cost snapshots through RLS');
select is((select round(current_stock, 4) from public.supplies where id = '34000000-0000-0000-0000-000000000001'), 888.8889, 'nested base sheet with 10 percent waste discounts raw supply');

select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"13000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is((select count(*)::integer from public.product_cost_snapshots where source_type = 'sale_close'), 1, 'owner can read prepared nested product cost snapshot');
select ok(
  (select metadata ? 'profitability_snapshot' from public.sale_items where product_id = '35000000-0000-0000-0000-000000000001'),
  'prepared item has profitability snapshot'
);
select ok(
  not (select metadata ? 'profitability_snapshot' from public.sale_items where product_id = '35000000-0000-0000-0000-000000000002'),
  'direct item has no profitability snapshot'
);

select set_config('request.jwt.claim.sub', '13000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"13000000-0000-0000-0000-000000000003","role":"authenticated"}', true);

select throws_ok(
  $$
    select public.recalculate_product_cost('23000000-0000-0000-0000-000000000001', '35000000-0000-0000-0000-000000000001')
  $$,
  '42501',
  null,
  'waiter cannot recalculate product cost'
);

select throws_ok(
  $$
    select public.reverse_inventory_explosion(
      '23000000-0000-0000-0000-000000000001',
      (select id from public.sales limit 1),
      'not allowed'
    )
  $$,
  '42501',
  null,
  'waiter cannot reverse inventory explosion'
);

select * from finish();

rollback;
