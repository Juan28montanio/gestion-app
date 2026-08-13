begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(20);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values ('12000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'profit-owner@example.test', crypt('password', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, email, display_name)
values ('12000000-0000-0000-0000-000000000001', 'profit-owner@example.test', 'Profit Owner')
on conflict (id) do nothing;

insert into public.businesses (id, name, owner_user_id)
values ('22000000-0000-0000-0000-000000000001', 'Profit Business', '12000000-0000-0000-0000-000000000001');

insert into public.business_users (business_id, user_id, role, status, email)
values ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'owner', 'active', 'profit-owner@example.test');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values ('12000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'profit-cashier@example.test', crypt('password', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, email, display_name)
values ('12000000-0000-0000-0000-000000000002', 'profit-cashier@example.test', 'Profit Cashier')
on conflict (id) do nothing;

insert into public.business_users (business_id, user_id, role, status, email)
values ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000002', 'cashier', 'active', 'profit-cashier@example.test');

insert into public.business_settings (business_id, settings)
values (
  '22000000-0000-0000-0000-000000000001',
  '{"inventory":{"allow_negative_stock":false}}'::jsonb
);

insert into public.supplies (id, business_id, name, unit, current_stock, average_cost, last_purchase_cost)
values ('32000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'Harina e2e_profitability', 'g', 1000, 10, 10);

insert into public.products (id, business_id, name, product_type, price, cost)
values ('33000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'Arepa e2e_profitability', 'prepared', 5000, 0);

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select lives_ok(
  $$
    select public.create_or_update_technical_sheet(
      '22000000-0000-0000-0000-000000000001',
      null,
      jsonb_build_object(
        'name', 'Ficha arepa e2e_profitability',
        'type', 'final_product',
        'category', 'Pruebas',
        'status', 'active',
        'product_id', '33000000-0000-0000-0000-000000000001',
        'product_name', 'Arepa e2e_profitability',
        'sale_price', 5000,
        'yield', jsonb_build_object('portions', 2, 'quantity', 2, 'unit', 'porcion'),
        'costing', jsonb_build_object('currentSalePrice', 5000, 'targetFoodCost', 30)
      ),
      jsonb_build_array(
        jsonb_build_object(
          'sourceType', 'raw_item',
          'sourceId', '32000000-0000-0000-0000-000000000001',
          'name', 'Harina e2e_profitability',
          'quantity', 100,
          'unit', 'g',
          'unitCost', 10,
          'wastePercent', 0
        )
      ),
      true
    )
  $$,
  'create_or_update_technical_sheet creates and activates a technical sheet'
);

select is((select count(*)::integer from public.technical_sheets), 1, 'technical sheet persisted');
select is((select count(*)::integer from public.technical_sheet_items), 1, 'technical sheet item persisted');
select is((select count(*)::integer from public.technical_sheet_versions where status = 'active'), 1, 'active technical sheet version persisted');
select is((select cost::numeric(12, 2) from public.products where id = '33000000-0000-0000-0000-000000000001'), 500.00, 'product cost updated from cost per portion');

select lives_ok(
  $$
    select public.open_cash_session('22000000-0000-0000-0000-000000000001', 0, 'profitability test')
  $$,
  'open cash session for profitability sale'
);

select lives_ok(
  $$
    select public.close_sale_with_inventory_explosion(
      '22000000-0000-0000-0000-000000000001',
      jsonb_build_object(
        'cash_session_id', (select id from public.cash_sessions where business_id = '22000000-0000-0000-0000-000000000001' and status = 'open' limit 1),
        'subtotal', 5000,
        'total', 5000,
        'source_type', 'quick_sale'
      ),
      jsonb_build_array(
        jsonb_build_object(
          'product_id', '33000000-0000-0000-0000-000000000001',
          'product_name', 'Arepa e2e_profitability',
          'quantity', 2,
          'unit_price', 5000,
          'subtotal', 10000
        )
      ),
      jsonb_build_array(jsonb_build_object('method', 'cash', 'amount', 5000))
    )
  $$,
  'close_sale_with_inventory_explosion closes sale and discounts supplies'
);

select is((select current_stock::numeric(14, 4) from public.supplies where id = '32000000-0000-0000-0000-000000000001'), 900.0000, 'supply stock decreased by recipe explosion');
select is((select count(*)::integer from public.inventory_movements where movement_type = 'sale_out'), 1, 'sale_out inventory movement created');
select is((select count(*)::integer from public.product_cost_snapshots where source_type = 'sale_close'), 1, 'sale cost snapshot created');
select ok(
  (select metadata ? 'profitability_snapshot' from public.sale_items limit 1),
  'sale item stores profitability snapshot metadata'
);
select is(
  (select (metadata->'profitability_snapshot'->>'unit_cost_snapshot')::numeric(14, 4) from public.sale_items limit 1),
  500.0000,
  'sale item snapshot keeps unit cost'
);

select lives_ok(
  $$
    select public.reverse_inventory_explosion(
      '22000000-0000-0000-0000-000000000001',
      (select id from public.sales limit 1),
      'profitability test reversal'
    )
  $$,
  'reverse_inventory_explosion restores supply stock'
);

select is((select current_stock::numeric(14, 4) from public.supplies where id = '32000000-0000-0000-0000-000000000001'), 1000.0000, 'supply stock restored by reversal');
select is((select count(*)::integer from public.inventory_movements where movement_type = 'reversal'), 1, 'reversal inventory movement created');

update public.supplies
set current_stock = 10
where id = '32000000-0000-0000-0000-000000000001';

select throws_ok(
  $$
    select public.close_sale_with_inventory_explosion(
      '22000000-0000-0000-0000-000000000001',
      jsonb_build_object(
        'cash_session_id', (select id from public.cash_sessions where business_id = '22000000-0000-0000-0000-000000000001' and status = 'open' limit 1),
        'subtotal', 5000,
        'total', 5000,
        'source_type', 'quick_sale'
      ),
      jsonb_build_array(
        jsonb_build_object(
          'product_id', '33000000-0000-0000-0000-000000000001',
          'product_name', 'Arepa e2e_profitability',
          'quantity', 2,
          'unit_price', 5000,
          'subtotal', 10000
        )
      ),
      jsonb_build_array(jsonb_build_object('method', 'cash', 'amount', 5000))
    )
  $$,
  'P0001',
  null,
  'insufficient stock blocks transaction when negative stock is disabled'
);

select is((select current_stock::numeric(14, 4) from public.supplies where id = '32000000-0000-0000-0000-000000000001'), 10.0000, 'failed sale leaves supply stock unchanged');
select is((select count(*)::integer from public.sales), 1, 'failed sale rolls back sale insert');

select set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000002","role":"authenticated"}', true);

select throws_ok(
  $$
    select public.create_or_update_technical_sheet(
      '22000000-0000-0000-0000-000000000001',
      null,
      jsonb_build_object(
        'name', 'Ficha bloqueada cajero',
        'type', 'final_product',
        'category', 'Pruebas',
        'status', 'active',
        'product_id', '33000000-0000-0000-0000-000000000001',
        'sale_price', 5000,
        'yield', jsonb_build_object('portions', 1),
        'costing', jsonb_build_object('currentSalePrice', 5000, 'targetFoodCost', 30)
      ),
      jsonb_build_array(
        jsonb_build_object(
          'sourceType', 'raw_item',
          'sourceId', '32000000-0000-0000-0000-000000000001',
          'name', 'Harina e2e_profitability',
          'quantity', 10,
          'unit', 'g',
          'unitCost', 10
        )
      ),
      true
    )
  $$,
  '42501',
  null,
  'cashier cannot create or edit technical sheets'
);

select throws_ok(
  $$ select public.recalculate_product_cost('22000000-0000-0000-0000-000000000001', '33000000-0000-0000-0000-000000000001') $$,
  '42501',
  null,
  'cashier cannot recalculate product costs'
);

select * from finish();

rollback;
