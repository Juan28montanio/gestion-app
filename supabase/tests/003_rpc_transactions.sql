begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(11);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values ('11000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'rpc-owner@example.test', crypt('password', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, email, display_name)
values ('11000000-0000-0000-0000-000000000001', 'rpc-owner@example.test', 'RPC Owner')
on conflict (id) do nothing;

insert into public.businesses (id, name, owner_user_id)
values ('21000000-0000-0000-0000-000000000001', 'RPC Business', '11000000-0000-0000-0000-000000000001');

insert into public.business_users (business_id, user_id, role, status, email)
values ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'owner', 'active', 'rpc-owner@example.test');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select lives_ok(
  $$ select public.assert_business_member('21000000-0000-0000-0000-000000000001') $$,
  'assert_business_member accepts active business member'
);

select throws_ok(
  $$ select public.open_cash_session('21000000-0000-0000-0000-000000000001', -1, 'pgTAP negative amount') $$,
  '22003',
  'Opening amount cannot be negative',
  'open_cash_session rejects negative opening amount'
);
select is((select count(*)::integer from public.cash_sessions), 0, 'failed open_cash_session does not insert cash session');
select is((select count(*)::integer from public.cash_movements), 0, 'failed open_cash_session does not insert cash movement');

select throws_ok(
  $$ select public.close_sale('21000000-0000-0000-0000-000000000001', '{"total": -1, "subtotal": -1}'::jsonb, '[]'::jsonb, '[]'::jsonb) $$,
  '22003',
  'Sale total cannot be negative',
  'close_sale rejects negative totals'
);
select is((select count(*)::integer from public.sales), 0, 'failed close_sale does not insert sale');
select is((select count(*)::integer from public.sale_items), 0, 'failed close_sale does not insert sale items');
select is((select count(*)::integer from public.payments), 0, 'failed close_sale does not insert payments');

select throws_ok(
  $$ select public.save_table_layout('21000000-0000-0000-0000-000000000001', null, '{"number": 0, "capacity": 2, "name": "Invalid"}'::jsonb) $$,
  '22003',
  'Table number must be positive',
  'save_table_layout rejects invalid table number'
);
select is((select count(*)::integer from public.tables), 0, 'failed save_table_layout does not insert table');
select is((select count(*)::integer from public.table_events), 0, 'failed save_table_layout does not insert table event');

select * from finish();

rollback;
