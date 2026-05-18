-- Initial RLS policies for the Supabase migration.
-- These policies preserve the Firebase rule idea: every business-scoped row is isolated by business_id.

create or replace function public.current_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id
  from public.business_users
  where user_id = auth.uid()
    and status = 'active';
$$;

create or replace function public.has_business_role(target_business_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_users
    where user_id = auth.uid()
      and business_id = target_business_id
      and status = 'active'
      and role = any(allowed_roles)
  );
$$;

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_business_id in (select public.current_business_ids());
$$;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_users enable row level security;
alter table public.business_settings enable row level security;
alter table public.product_categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.cash_movements enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "businesses read member businesses"
on public.businesses for select
to authenticated
using (public.is_business_member(id));

create policy "businesses update owner admin"
on public.businesses for update
to authenticated
using (public.has_business_role(id, array['owner', 'admin']))
with check (public.has_business_role(id, array['owner', 'admin']));

create policy "business users read same business"
on public.business_users for select
to authenticated
using (public.is_business_member(business_id));

create policy "business users manage owner admin"
on public.business_users for all
to authenticated
using (public.has_business_role(business_id, array['owner', 'admin']))
with check (public.has_business_role(business_id, array['owner', 'admin']));

create policy "business settings read members"
on public.business_settings for select
to authenticated
using (public.is_business_member(business_id));

create policy "business settings manage owner admin"
on public.business_settings for all
to authenticated
using (public.has_business_role(business_id, array['owner', 'admin']))
with check (public.has_business_role(business_id, array['owner', 'admin']));

create policy "product categories members read"
on public.product_categories for select
to authenticated
using (public.is_business_member(business_id));

create policy "product categories members write"
on public.product_categories for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "suppliers members read"
on public.suppliers for select
to authenticated
using (public.is_business_member(business_id));

create policy "suppliers members write"
on public.suppliers for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "customers members read"
on public.customers for select
to authenticated
using (public.is_business_member(business_id));

create policy "customers members write"
on public.customers for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "products members read"
on public.products for select
to authenticated
using (public.is_business_member(business_id));

create policy "products members write"
on public.products for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "cash sessions members read"
on public.cash_sessions for select
to authenticated
using (public.is_business_member(business_id));

create policy "cash sessions members write"
on public.cash_sessions for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "sales members read"
on public.sales for select
to authenticated
using (public.is_business_member(business_id));

create policy "sales members write"
on public.sales for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "sale items members read"
on public.sale_items for select
to authenticated
using (public.is_business_member(business_id));

create policy "sale items members write"
on public.sale_items for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "payments members read"
on public.payments for select
to authenticated
using (public.is_business_member(business_id));

create policy "payments members write"
on public.payments for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

create policy "cash movements members read"
on public.cash_movements for select
to authenticated
using (public.is_business_member(business_id));

create policy "cash movements append"
on public.cash_movements for insert
to authenticated
with check (public.is_business_member(business_id));

create policy "inventory movements members read"
on public.inventory_movements for select
to authenticated
using (public.is_business_member(business_id));

create policy "inventory movements append"
on public.inventory_movements for insert
to authenticated
with check (public.is_business_member(business_id));

create policy "audit logs members read"
on public.audit_logs for select
to authenticated
using (public.is_business_member(business_id));

create policy "audit logs append"
on public.audit_logs for insert
to authenticated
with check (public.is_business_member(business_id));

-- Pending decision: deletes are intentionally absent for sales, payments, cash movements,
-- inventory movements and audit logs. Use reversal rows or privileged RPC functions instead.
