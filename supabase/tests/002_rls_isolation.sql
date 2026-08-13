begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(10);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner-a@example.test', crypt('password', gen_salt('bf')), now(), now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'owner-b@example.test', crypt('password', gen_salt('bf')), now(), now(), now());

insert into public.profiles (id, email, display_name)
values
  ('10000000-0000-0000-0000-000000000001', 'owner-a@example.test', 'Owner A'),
  ('10000000-0000-0000-0000-000000000002', 'owner-b@example.test', 'Owner B')
on conflict (id) do nothing;

insert into public.businesses (id, name, owner_user_id)
values
  ('20000000-0000-0000-0000-000000000001', 'Business A', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Business B', '10000000-0000-0000-0000-000000000002');

insert into public.business_users (business_id, user_id, role, status, email)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner', 'active', 'owner-a@example.test'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'owner', 'active', 'owner-b@example.test');

insert into public.products (id, business_id, name, price)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Product A', 1000),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Product B', 2000);

set local role anon;
select is((select count(*)::integer from public.products), 0, 'anon cannot read business products');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select count(*)::integer from public.products), 1, 'user A reads one product');
select is((select name from public.products), 'Product A', 'user A only reads own business product');
select ok(public.is_business_member('20000000-0000-0000-0000-000000000001'), 'user A is member of business A');
select ok(not public.is_business_member('20000000-0000-0000-0000-000000000002'), 'user A is not member of business B');
select throws_ok(
  $$ insert into public.products (business_id, name, price) values ('20000000-0000-0000-0000-000000000002', 'Cross tenant write', 1) $$,
  '42501',
  null,
  'user A cannot insert into business B'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select count(*)::integer from public.products), 1, 'user B reads one product');
select is((select name from public.products), 'Product B', 'user B only reads own business product');
select ok(not public.is_business_member('20000000-0000-0000-0000-000000000001'), 'user B is not member of business A');
select ok(public.has_business_role('20000000-0000-0000-0000-000000000002', array['owner']), 'user B owner role is recognized');

select * from finish();

rollback;
