-- SmartProfit local Supabase schema assembled from database/supabase/*.sql.
-- Keep source files in database/supabase as the reviewable SQL modules.


-- >>> database/supabase/schema.sql
-- Initial Supabase/PostgreSQL schema for the Firebase parallel migration.
-- Apply this before rls.sql. Keep Firebase IDs in legacy_firebase_* columns until cutover.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  legacy_firebase_uid text unique,
  email text not null,
  display_name text not null default '',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  legacy_firebase_id text unique,
  name text not null,
  legal_name text,
  logo_url text not null default '',
  owner_user_id uuid references public.profiles(id),
  status text not null default 'active',
  audit_pin_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_status_check check (status in ('active', 'inactive', 'suspended'))
);

create table if not exists public.business_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'staff',
  status text not null default 'active',
  display_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_users_role_check check (role in ('owner', 'admin', 'manager', 'cashier', 'waiter', 'kitchen', 'accountant', 'staff')),
  constraint business_users_status_check check (status in ('active', 'inactive', 'invited', 'blocked')),
  constraint business_users_business_user_unique unique (business_id, user_id)
);

create table if not exists public.business_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_categories_status_check check (status in ('active', 'inactive')),
  constraint product_categories_name_unique unique (business_id, name)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  legacy_firebase_id text,
  name text not null,
  category text,
  phone text,
  email text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint suppliers_status_check check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  legacy_firebase_id text,
  name text not null,
  phone text,
  email text,
  document_number text,
  ticket_balance numeric(12, 2) not null default 0,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_status_check check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  legacy_firebase_id text,
  name text not null,
  code text,
  description text,
  product_type text not null default 'standard',
  status text not null default 'active',
  price numeric(12, 2) not null default 0,
  cost numeric(12, 2) not null default 0,
  tax_rate numeric(6, 3) not null default 0,
  stock numeric(14, 4) not null default 0,
  visible_in_pos boolean not null default true,
  inventory jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_product_type_check check (product_type in ('standard', 'prepared', 'combo', 'ticket_wallet', 'service')),
  constraint products_status_check check (status in ('active', 'inactive', 'archived')),
  constraint products_price_non_negative check (price >= 0),
  constraint products_cost_non_negative check (cost >= 0)
);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  legacy_firebase_id text,
  opened_by uuid references public.profiles(id),
  closed_by uuid references public.profiles(id),
  status text not null default 'open',
  opening_amount numeric(12, 2) not null default 0,
  counted_amount numeric(12, 2),
  expected_amount numeric(12, 2),
  difference_amount numeric(12, 2),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_sessions_status_check check (status in ('open', 'closed', 'cancelled')),
  constraint cash_sessions_amounts_non_negative check (opening_amount >= 0)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  cash_session_id uuid references public.cash_sessions(id) on delete set null,
  legacy_firebase_id text,
  sale_number text,
  source_type text not null default 'quick_sale',
  status text not null default 'draft',
  payment_status text not null default 'pending',
  subtotal numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  discount_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  paid_amount numeric(12, 2) not null default 0,
  pending_amount numeric(12, 2) not null default 0,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_source_type_check check (source_type in ('quick_sale', 'table', 'ticket_wallet', 'debt_payment')),
  constraint sales_status_check check (status in ('draft', 'open', 'paid', 'partially_paid', 'cancelled', 'refunded')),
  constraint sales_payment_status_check check (payment_status in ('pending', 'partial', 'paid', 'cancelled', 'refunded')),
  constraint sales_totals_non_negative check (subtotal >= 0 and tax_total >= 0 and discount_total >= 0 and total >= 0 and paid_amount >= 0 and pending_amount >= 0)
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(14, 4) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  subtotal numeric(12, 2) not null default 0,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sale_items_status_check check (status in ('active', 'cancelled', 'refunded')),
  constraint sale_items_amounts_non_negative check (quantity > 0 and unit_price >= 0 and subtotal >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  legacy_firebase_id text,
  sale_id uuid references public.sales(id) on delete set null,
  cash_session_id uuid references public.cash_sessions(id) on delete set null,
  method text not null,
  amount numeric(12, 2) not null,
  status text not null default 'completed',
  reference text,
  paid_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_status_check check (status in ('pending', 'completed', 'cancelled', 'refunded')),
  constraint payments_amount_positive check (amount > 0)
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  legacy_firebase_id text,
  cash_session_id uuid references public.cash_sessions(id) on delete set null,
  sale_id uuid references public.sales(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  type text not null,
  method text,
  amount numeric(12, 2) not null,
  status text not null default 'valid',
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_movements_type_check check (type in ('opening', 'sale_income', 'purchase_expense', 'operating_expense', 'debt_payment', 'adjustment', 'closing', 'reversal')),
  constraint cash_movements_status_check check (status in ('valid', 'reversed', 'cancelled'))
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  legacy_firebase_id text,
  product_id uuid references public.products(id) on delete set null,
  source_type text not null,
  source_id uuid,
  movement_type text not null,
  direction text not null,
  quantity numeric(14, 4) not null,
  unit_cost numeric(12, 2) not null default 0,
  status text not null default 'valid',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_movements_type_check check (movement_type in ('sale_out', 'purchase_in', 'adjustment', 'return_in', 'reversal')),
  constraint inventory_movements_direction_check check (direction in ('in', 'out')),
  constraint inventory_movements_status_check check (status in ('valid', 'reversed', 'cancelled')),
  constraint inventory_movements_quantity_positive check (quantity > 0)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  module text not null,
  action text not null,
  entity_type text,
  entity_id text,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists business_users_user_id_idx on public.business_users(user_id);
create index if not exists business_users_business_id_idx on public.business_users(business_id);
create index if not exists products_business_id_name_idx on public.products(business_id, name);
create index if not exists suppliers_business_id_name_idx on public.suppliers(business_id, name);
create index if not exists customers_business_id_name_idx on public.customers(business_id, name);
create index if not exists sales_business_id_created_at_idx on public.sales(business_id, created_at desc);
create index if not exists sales_cash_session_id_idx on public.sales(cash_session_id);
create index if not exists sales_customer_id_idx on public.sales(customer_id);
create index if not exists sale_items_sale_id_idx on public.sale_items(sale_id);
create index if not exists payments_sale_id_idx on public.payments(sale_id);
create index if not exists payments_cash_session_id_idx on public.payments(cash_session_id);
create index if not exists cash_sessions_business_status_idx on public.cash_sessions(business_id, status);
create index if not exists cash_movements_business_created_at_idx on public.cash_movements(business_id, created_at desc);
create index if not exists cash_movements_cash_session_id_idx on public.cash_movements(cash_session_id);
create index if not exists cash_movements_sale_id_idx on public.cash_movements(sale_id);
create index if not exists cash_movements_payment_id_idx on public.cash_movements(payment_id);
create index if not exists inventory_movements_business_created_at_idx on public.inventory_movements(business_id, created_at desc);
create index if not exists audit_logs_business_created_at_idx on public.audit_logs(business_id, created_at desc);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger businesses_set_updated_at before update on public.businesses for each row execute function public.set_updated_at();
create trigger business_users_set_updated_at before update on public.business_users for each row execute function public.set_updated_at();
create trigger business_settings_set_updated_at before update on public.business_settings for each row execute function public.set_updated_at();
create trigger product_categories_set_updated_at before update on public.product_categories for each row execute function public.set_updated_at();
create trigger suppliers_set_updated_at before update on public.suppliers for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger cash_sessions_set_updated_at before update on public.cash_sessions for each row execute function public.set_updated_at();
create trigger sales_set_updated_at before update on public.sales for each row execute function public.set_updated_at();
create trigger sale_items_set_updated_at before update on public.sale_items for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger cash_movements_set_updated_at before update on public.cash_movements for each row execute function public.set_updated_at();
create trigger inventory_movements_set_updated_at before update on public.inventory_movements for each row execute function public.set_updated_at();

-- <<< database/supabase/schema.sql

-- >>> database/supabase/rls.sql
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

-- <<< database/supabase/rls.sql

-- >>> database/supabase/schema-inventory.sql
-- Inventory master data for supplies/ingredients.
-- Apply after schema.sql and rls.sql.

create table if not exists public.supply_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supply_categories_status_check check (status in ('active', 'inactive')),
  constraint supply_categories_name_unique unique (business_id, name)
);

create table if not exists public.supplies (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid references public.supply_categories(id) on delete set null,
  name text not null,
  category text not null default '',
  unit text not null default 'und',
  status text not null default 'active',
  current_stock numeric(14, 4) not null default 0,
  minimum_stock numeric(14, 4) not null default 0,
  average_cost numeric(12, 2) not null default 0,
  last_purchase_cost numeric(12, 2) not null default 0,
  supplier_id uuid references public.suppliers(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplies_status_check check (status in ('active', 'inactive', 'archived')),
  constraint supplies_stock_non_negative check (current_stock >= 0 and minimum_stock >= 0 and average_cost >= 0 and last_purchase_cost >= 0),
  constraint supplies_name_unique unique (business_id, name)
);

create index if not exists supplies_business_name_idx on public.supplies(business_id, name);
create index if not exists supplies_business_status_idx on public.supplies(business_id, status);
create index if not exists supply_categories_business_sort_idx on public.supply_categories(business_id, sort_order, name);

drop trigger if exists supply_categories_set_updated_at on public.supply_categories;
create trigger supply_categories_set_updated_at before update on public.supply_categories for each row execute function public.set_updated_at();

drop trigger if exists supplies_set_updated_at on public.supplies;
create trigger supplies_set_updated_at before update on public.supplies for each row execute function public.set_updated_at();

alter table public.supply_categories enable row level security;
alter table public.supplies enable row level security;

drop policy if exists "supply categories members read" on public.supply_categories;
create policy "supply categories members read" on public.supply_categories for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "supply categories members write" on public.supply_categories;
create policy "supply categories members write" on public.supply_categories for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "supplies members read" on public.supplies;
create policy "supplies members read" on public.supplies for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "supplies members write" on public.supplies;
create policy "supplies members write" on public.supplies for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

-- <<< database/supabase/schema-inventory.sql

-- >>> database/supabase/rpc-core.sql
-- Initial RPC layer for the Supabase migration.
-- Apply after schema.sql and rls.sql, once the authenticated bootstrap user can read its business.
-- These functions keep critical writes server-side instead of trusting client-side multi-step writes.

create or replace function public.assert_business_member(target_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.business_users bu
    where bu.business_id = target_business_id
      and bu.user_id = auth.uid()
      and bu.status = 'active'
  ) then
    raise exception 'User is not an active member of this business' using errcode = '42501';
  end if;
end;
$$;

create unique index if not exists cash_sessions_one_open_per_business_idx
on public.cash_sessions (business_id)
where status = 'open';

create or replace function public.open_cash_session(
  p_business_id uuid,
  p_opening_amount numeric default 0,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_id uuid;
  v_cash_session_id uuid;
begin
  perform public.assert_business_member(p_business_id);

  if coalesce(p_opening_amount, 0) < 0 then
    raise exception 'Opening amount cannot be negative' using errcode = '22003';
  end if;

  select id
  into v_existing_id
  from public.cash_sessions
  where business_id = p_business_id
    and status = 'open'
  order by opened_at desc
  limit 1;

  if v_existing_id is not null then
    return v_existing_id;
  end if;

  insert into public.cash_sessions (
    business_id,
    opened_by,
    status,
    opening_amount,
    opened_at
  )
  values (
    p_business_id,
    auth.uid(),
    'open',
    coalesce(p_opening_amount, 0),
    now()
  )
  returning id into v_cash_session_id;

  insert into public.cash_movements (
    business_id,
    cash_session_id,
    type,
    method,
    amount,
    status,
    description,
    metadata
  )
  values (
    p_business_id,
    v_cash_session_id,
    'opening',
    'cash',
    coalesce(p_opening_amount, 0),
    'valid',
    'Base inicial de caja',
    jsonb_build_object('notes', p_notes)
  );

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    new_value,
    reason
  )
  values (
    p_business_id,
    auth.uid(),
    'cash',
    'cash.open',
    'cash_sessions',
    v_cash_session_id::text,
    jsonb_build_object('opening_amount', coalesce(p_opening_amount, 0), 'status', 'open'),
    p_notes
  );

  return v_cash_session_id;
end;
$$;

create or replace function public.close_cash_session(
  p_business_id uuid,
  p_cash_session_id uuid,
  p_counted_amount numeric,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.cash_sessions%rowtype;
  v_expected_amount numeric(12, 2);
  v_difference_amount numeric(12, 2);
  v_payment_method_totals jsonb;
begin
  perform public.assert_business_member(p_business_id);

  if p_counted_amount is null or p_counted_amount < 0 then
    raise exception 'Counted amount must be zero or positive' using errcode = '22003';
  end if;

  select *
  into v_session
  from public.cash_sessions
  where id = p_cash_session_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Cash session not found' using errcode = 'P0002';
  end if;

  if v_session.status <> 'open' then
    raise exception 'Cash session is not open' using errcode = 'P0001';
  end if;

  select coalesce(sum(
    case
      when type = 'opening' then amount
      when type in ('sale_income', 'debt_payment', 'debt_payment_income', 'manual_income')
        and coalesce(method, 'cash') = 'cash' then amount
      when type in ('purchase_expense', 'operating_expense', 'operational_expense', 'supplier_payment')
        and coalesce(method, 'cash') = 'cash' then -amount
      when type = 'adjustment'
        and coalesce(method, 'cash') = 'cash' then amount
      else 0
    end
  ), 0)
  into v_expected_amount
  from public.cash_movements
  where business_id = p_business_id
    and cash_session_id = p_cash_session_id
    and status = 'valid';

  select coalesce(jsonb_object_agg(method_key, total_amount), '{}'::jsonb)
  into v_payment_method_totals
  from (
    select
      coalesce(method, 'cash') as method_key,
      sum(amount)::numeric(12, 2) as total_amount
    from public.cash_movements
    where business_id = p_business_id
      and cash_session_id = p_cash_session_id
      and status = 'valid'
      and type in ('sale_income', 'debt_payment', 'debt_payment_income', 'manual_income')
    group by coalesce(method, 'cash')
  ) method_totals;

  v_difference_amount := p_counted_amount - v_expected_amount;

  update public.cash_sessions
  set
    status = 'closed',
    closed_by = auth.uid(),
    counted_amount = p_counted_amount,
    expected_amount = v_expected_amount,
    difference_amount = v_difference_amount,
    closed_at = now()
  where id = p_cash_session_id;

  insert into public.cash_movements (
    business_id,
    cash_session_id,
    type,
    method,
    amount,
    status,
    description,
    metadata
  )
  values (
    p_business_id,
    p_cash_session_id,
    'closing',
    'cash',
    p_counted_amount,
    'valid',
    'Cierre de caja',
    jsonb_build_object(
      'expected_amount', v_expected_amount,
      'difference_amount', v_difference_amount,
      'notes', p_notes
    )
  );

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    reason
  )
  values (
    p_business_id,
    auth.uid(),
    'cash',
    'cash.close',
    'cash_sessions',
    p_cash_session_id::text,
    to_jsonb(v_session),
    jsonb_build_object(
      'status', 'closed',
      'counted_amount', p_counted_amount,
      'expected_amount', v_expected_amount,
      'difference_amount', v_difference_amount,
      'payment_method_totals', v_payment_method_totals
    ),
    p_notes
  );

  return jsonb_build_object(
    'cash_session_id', p_cash_session_id,
    'counted_amount', p_counted_amount,
    'expected_amount', v_expected_amount,
    'difference_amount', v_difference_amount,
    'payment_method_totals', v_payment_method_totals
  );
end;
$$;

create or replace function public.close_sale(
  p_business_id uuid,
  p_sale jsonb,
  p_items jsonb default '[]'::jsonb,
  p_payments jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_cash_session_id uuid;
  v_subtotal numeric(12, 2);
  v_total numeric(12, 2);
  v_paid_amount numeric(12, 2);
  v_pending_amount numeric(12, 2);
  v_item jsonb;
  v_payment jsonb;
  v_payment_id uuid;
begin
  perform public.assert_business_member(p_business_id);

  v_cash_session_id := nullif(p_sale->>'cash_session_id', '')::uuid;
  v_subtotal := coalesce(nullif(p_sale->>'subtotal', '')::numeric, 0);
  v_total := coalesce(nullif(p_sale->>'total', '')::numeric, v_subtotal, 0);

  if v_total < 0 then
    raise exception 'Sale total cannot be negative' using errcode = '22003';
  end if;

  if v_cash_session_id is not null and not exists (
    select 1
    from public.cash_sessions
    where id = v_cash_session_id
      and business_id = p_business_id
      and status = 'open'
  ) then
    raise exception 'Open cash session not found for sale' using errcode = 'P0002';
  end if;

  select coalesce(sum(coalesce(nullif(payment_item.value->>'amount', '')::numeric, 0)), 0)
  into v_paid_amount
  from jsonb_array_elements(p_payments) as payment_item(value);

  v_pending_amount := greatest(v_total - v_paid_amount, 0);

  insert into public.sales (
    business_id,
    customer_id,
    cash_session_id,
    legacy_firebase_id,
    sale_number,
    source_type,
    status,
    payment_status,
    subtotal,
    tax_total,
    discount_total,
    total,
    paid_amount,
    pending_amount,
    closed_at,
    metadata
  )
  values (
    p_business_id,
    nullif(p_sale->>'customer_id', '')::uuid,
    v_cash_session_id,
    nullif(p_sale->>'legacy_firebase_id', ''),
    nullif(p_sale->>'sale_number', ''),
    coalesce(nullif(p_sale->>'source_type', ''), 'quick_sale'),
    case when v_pending_amount > 0 then 'partially_paid' else 'paid' end,
    case when v_pending_amount > 0 then 'partial' else 'paid' end,
    v_subtotal,
    coalesce(nullif(p_sale->>'tax_total', '')::numeric, 0),
    coalesce(nullif(p_sale->>'discount_total', '')::numeric, 0),
    v_total,
    v_paid_amount,
    v_pending_amount,
    now(),
    jsonb_build_object('client_payload', p_sale)
  )
  returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.sale_items (
      business_id,
      sale_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      subtotal,
      metadata
    )
    values (
      p_business_id,
      v_sale_id,
      nullif(v_item->>'product_id', '')::uuid,
      coalesce(nullif(v_item->>'product_name', ''), nullif(v_item->>'name', ''), 'Producto'),
      coalesce(nullif(v_item->>'quantity', '')::numeric, 1),
      coalesce(nullif(v_item->>'unit_price', '')::numeric, nullif(v_item->>'price', '')::numeric, 0),
      coalesce(nullif(v_item->>'subtotal', '')::numeric, 0),
      jsonb_build_object('client_payload', v_item)
    );
  end loop;

  for v_payment in select value from jsonb_array_elements(p_payments)
  loop
    insert into public.payments (
      business_id,
      sale_id,
      cash_session_id,
      method,
      amount,
      status,
      reference,
      paid_at,
      metadata
    )
    values (
      p_business_id,
      v_sale_id,
      v_cash_session_id,
      coalesce(nullif(v_payment->>'method', ''), 'cash'),
      coalesce(nullif(v_payment->>'amount', '')::numeric, 0),
      'completed',
      nullif(v_payment->>'reference', ''),
      now(),
      jsonb_build_object('client_payload', v_payment)
    )
    returning id into v_payment_id;

    if v_cash_session_id is not null then
      insert into public.cash_movements (
        business_id,
        cash_session_id,
        sale_id,
        payment_id,
        type,
        method,
        amount,
        status,
        description
      )
      values (
        p_business_id,
        v_cash_session_id,
        v_sale_id,
        v_payment_id,
        'sale_income',
        coalesce(nullif(v_payment->>'method', ''), 'cash'),
        coalesce(nullif(v_payment->>'amount', '')::numeric, 0),
        'valid',
        'Ingreso por venta'
      );
    end if;
  end loop;

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    new_value,
    reason
  )
  values (
    p_business_id,
    auth.uid(),
    'sales',
    'sale.close',
    'sales',
    v_sale_id::text,
    jsonb_build_object('total', v_total, 'paid_amount', v_paid_amount, 'pending_amount', v_pending_amount),
    nullif(p_sale->>'reason', '')
  );

  return v_sale_id;
end;
$$;

create or replace function public.settle_sale_debt(
  p_business_id uuid,
  p_sale_id uuid,
  p_amount numeric default null,
  p_method text default 'cash',
  p_reference text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales%rowtype;
  v_cash_session_id uuid;
  v_payment_id uuid;
  v_payment_amount numeric(12, 2);
  v_next_paid_amount numeric(12, 2);
  v_next_pending_amount numeric(12, 2);
  v_method text;
begin
  perform public.assert_business_member(p_business_id);

  select *
  into v_sale
  from public.sales
  where id = p_sale_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Sale not found' using errcode = 'P0002';
  end if;

  if v_sale.status in ('cancelled', 'refunded') or v_sale.payment_status in ('cancelled', 'refunded') then
    raise exception 'Sale cannot receive payments' using errcode = 'P0001';
  end if;

  if coalesce(v_sale.pending_amount, 0) <= 0 then
    raise exception 'Sale has no pending amount' using errcode = 'P0001';
  end if;

  v_payment_amount := coalesce(p_amount, v_sale.pending_amount);

  if v_payment_amount <= 0 then
    raise exception 'Payment amount must be positive' using errcode = '22003';
  end if;

  if v_payment_amount > v_sale.pending_amount then
    raise exception 'Payment amount exceeds pending amount' using errcode = '22003';
  end if;

  select id
  into v_cash_session_id
  from public.cash_sessions
  where business_id = p_business_id
    and status = 'open'
  order by opened_at desc
  limit 1;

  if v_cash_session_id is null then
    raise exception 'Open cash session required for debt payment' using errcode = 'P0001';
  end if;

  v_method := coalesce(nullif(trim(p_method), ''), 'cash');
  v_next_paid_amount := coalesce(v_sale.paid_amount, 0) + v_payment_amount;
  v_next_pending_amount := greatest(coalesce(v_sale.total, 0) - v_next_paid_amount, 0);

  insert into public.payments (
    business_id,
    sale_id,
    cash_session_id,
    method,
    amount,
    status,
    reference,
    paid_at,
    metadata
  )
  values (
    p_business_id,
    p_sale_id,
    v_cash_session_id,
    v_method,
    v_payment_amount,
    'completed',
    nullif(trim(coalesce(p_reference, '')), ''),
    now(),
    jsonb_build_object(
      'source', 'settle_sale_debt',
      'notes', p_notes
    )
  )
  returning id into v_payment_id;

  insert into public.cash_movements (
    business_id,
    cash_session_id,
    sale_id,
    payment_id,
    type,
    method,
    amount,
    status,
    description,
    metadata
  )
  values (
    p_business_id,
    v_cash_session_id,
    p_sale_id,
    v_payment_id,
    'debt_payment',
    v_method,
    v_payment_amount,
    'valid',
    'Abono de cartera',
    jsonb_build_object(
      'previous_pending_amount', v_sale.pending_amount,
      'next_pending_amount', v_next_pending_amount,
      'notes', p_notes
    )
  );

  update public.sales
  set
    paid_amount = v_next_paid_amount,
    pending_amount = v_next_pending_amount,
    status = case when v_next_pending_amount > 0 then 'partially_paid' else 'paid' end,
    payment_status = case when v_next_pending_amount > 0 then 'partial' else 'paid' end
  where id = p_sale_id;

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    reason
  )
  values (
    p_business_id,
    auth.uid(),
    'finance',
    'receivable.settle',
    'sales',
    p_sale_id::text,
    jsonb_build_object(
      'paid_amount', v_sale.paid_amount,
      'pending_amount', v_sale.pending_amount,
      'payment_status', v_sale.payment_status
    ),
    jsonb_build_object(
      'payment_id', v_payment_id,
      'cash_session_id', v_cash_session_id,
      'amount', v_payment_amount,
      'method', v_method,
      'paid_amount', v_next_paid_amount,
      'pending_amount', v_next_pending_amount
    ),
    p_notes
  );

  return jsonb_build_object(
    'sale_id', p_sale_id,
    'payment_id', v_payment_id,
    'cash_session_id', v_cash_session_id,
    'amount', v_payment_amount,
    'method', v_method,
    'paid_amount', v_next_paid_amount,
    'pending_amount', v_next_pending_amount,
    'payment_status', case when v_next_pending_amount > 0 then 'partial' else 'paid' end
  );
end;
$$;

-- <<< database/supabase/rpc-core.sql

-- >>> database/supabase/schema-operational.sql
-- Operational Salon schema for the Supabase cutover.
-- Apply after schema.sql and rls.sql. This keeps table service state out of Firebase.

create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  legacy_firebase_id text,
  number integer not null,
  name text not null,
  capacity integer not null default 2,
  zone text not null default 'Salon principal',
  status text not null default 'free',
  icon text not null default 'UtensilsCrossed',
  code text not null default '',
  shape text not null default 'square',
  size text not null default 'md',
  position jsonb not null default jsonb_build_object('x', 0, 'y', 0),
  is_active boolean not null default true,
  current_session_id uuid,
  current_order_id uuid,
  current_order_summary text not null default '',
  current_total numeric(12, 2) not null default 0,
  waiter_name text not null default '',
  guests_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tables_number_unique unique (business_id, number),
  constraint tables_capacity_positive check (capacity > 0),
  constraint tables_status_check check (status in ('free', 'reserved', 'disabled', 'waiting_order', 'occupied', 'order_sent', 'preparing', 'ready', 'waiting_payment', 'cleaning')),
  constraint tables_shape_check check (shape in ('square', 'round', 'rectangle', 'bar', 'booth'))
);

create table if not exists public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  table_id uuid not null references public.tables(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  waiter_id uuid references public.profiles(id) on delete set null,
  table_name text not null default '',
  waiter_name text not null default '',
  customer_name text not null default '',
  guests_count integer not null default 1,
  status text not null default 'waiting_order',
  subtotal numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  total_items integer not null default 0,
  notes text not null default '',
  payment_requested_at timestamptz,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  last_activity_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint table_sessions_status_check check (status in ('waiting_order', 'occupied', 'order_sent', 'preparing', 'ready', 'waiting_payment', 'closed', 'cancelled')),
  constraint table_sessions_guests_positive check (guests_count > 0),
  constraint table_sessions_totals_non_negative check (subtotal >= 0 and total >= 0 and total_items >= 0)
);

create table if not exists public.table_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  table_id uuid not null references public.tables(id) on delete restrict,
  session_id uuid not null references public.table_sessions(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  table_name text not null default '',
  customer_name text not null default '',
  waiter_id uuid references public.profiles(id) on delete set null,
  status text not null default 'sent',
  kitchen_status text not null default 'pending',
  items jsonb not null default '[]'::jsonb,
  items_count integer not null default 0,
  subtotal numeric(12, 2) not null default 0,
  taxes numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint table_orders_status_check check (status in ('sent', 'preparing', 'ready', 'cuenta_solicitada', 'waiting_payment', 'paid', 'cancelled')),
  constraint table_orders_kitchen_status_check check (kitchen_status in ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  constraint table_orders_totals_non_negative check (items_count >= 0 and subtotal >= 0 and taxes >= 0 and total >= 0)
);

create table if not exists public.kitchen_tickets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  table_id uuid not null references public.tables(id) on delete restrict,
  session_id uuid not null references public.table_sessions(id) on delete cascade,
  order_id uuid references public.table_orders(id) on delete cascade,
  table_name text not null default '',
  items jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  sent_at timestamptz not null default now(),
  started_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kitchen_tickets_status_check check (status in ('pending', 'preparing', 'ready', 'delivered', 'cancelled'))
);

create table if not exists public.table_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  table_id uuid references public.tables(id) on delete set null,
  session_id uuid references public.table_sessions(id) on delete set null,
  order_id uuid references public.table_orders(id) on delete set null,
  event_type text not null,
  description text not null default '',
  previous_value jsonb,
  new_value jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_by_name text not null default '',
  created_at timestamptz not null default now(),
  constraint table_events_event_type_check check (event_type in ('session_opened', 'order_sent', 'kitchen_status_updated', 'item_delivered', 'payment_requested', 'item_canceled', 'table_released', 'waiter_changed', 'table_transferred', 'table_updated'))
);

create unique index if not exists table_sessions_one_active_per_table_idx
on public.table_sessions (business_id, table_id)
where status in ('waiting_order', 'occupied', 'order_sent', 'preparing', 'ready', 'waiting_payment');

create index if not exists tables_business_status_idx on public.tables(business_id, status);
create index if not exists table_sessions_business_status_idx on public.table_sessions(business_id, status);
create index if not exists table_orders_business_status_idx on public.table_orders(business_id, status);
create index if not exists kitchen_tickets_business_status_idx on public.kitchen_tickets(business_id, status);
create index if not exists table_events_business_table_created_idx on public.table_events(business_id, table_id, created_at desc);

create trigger tables_set_updated_at before update on public.tables for each row execute function public.set_updated_at();
create trigger table_sessions_set_updated_at before update on public.table_sessions for each row execute function public.set_updated_at();
create trigger table_orders_set_updated_at before update on public.table_orders for each row execute function public.set_updated_at();
create trigger kitchen_tickets_set_updated_at before update on public.kitchen_tickets for each row execute function public.set_updated_at();

alter table public.tables enable row level security;
alter table public.table_sessions enable row level security;
alter table public.table_orders enable row level security;
alter table public.kitchen_tickets enable row level security;
alter table public.table_events enable row level security;

drop policy if exists "tables members read" on public.tables;
create policy "tables members read" on public.tables for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "tables members write" on public.tables;
create policy "tables members write" on public.tables for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "table sessions members read" on public.table_sessions;
create policy "table sessions members read" on public.table_sessions for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "table sessions members write" on public.table_sessions;
create policy "table sessions members write" on public.table_sessions for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "table orders members read" on public.table_orders;
create policy "table orders members read" on public.table_orders for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "table orders members write" on public.table_orders;
create policy "table orders members write" on public.table_orders for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "kitchen tickets members read" on public.kitchen_tickets;
create policy "kitchen tickets members read" on public.kitchen_tickets for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "kitchen tickets members write" on public.kitchen_tickets;
create policy "kitchen tickets members write" on public.kitchen_tickets for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "table events members read" on public.table_events;
create policy "table events members read" on public.table_events for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "table events append" on public.table_events;
create policy "table events append" on public.table_events for insert to authenticated
with check (public.is_business_member(business_id));

-- <<< database/supabase/schema-operational.sql

-- >>> database/supabase/rpc-operational.sql
-- Operational Salon RPCs. Apply after schema-operational.sql.

create or replace function public.save_table_layout(
  p_business_id uuid,
  p_table_id uuid default null,
  p_table jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table_id uuid;
  v_number integer;
  v_capacity integer;
  v_name text;
  v_zone text;
  v_status text;
  v_icon text;
  v_code text;
  v_shape text;
  v_size text;
  v_position jsonb;
  v_is_active boolean;
begin
  perform public.assert_business_member(p_business_id);

  v_number := nullif(p_table->>'number', '')::integer;
  v_capacity := coalesce(nullif(p_table->>'capacity', '')::integer, 2);
  v_name := coalesce(nullif(trim(p_table->>'name'), ''), concat('Mesa ', v_number));
  v_zone := coalesce(nullif(trim(p_table->>'zone'), ''), 'Salon principal');
  v_status := coalesce(nullif(trim(p_table->>'status'), ''), 'free');
  v_icon := coalesce(nullif(trim(p_table->>'icon'), ''), 'UtensilsCrossed');
  v_code := coalesce(p_table->>'code', '');
  v_shape := coalesce(nullif(trim(p_table->>'shape'), ''), 'square');
  v_size := coalesce(nullif(trim(p_table->>'size'), ''), 'md');
  v_position := coalesce(p_table->'position', jsonb_build_object('x', 0, 'y', 0));
  v_is_active := coalesce((p_table->>'is_active')::boolean, (p_table->>'isActive')::boolean, true);

  if v_number is null or v_number <= 0 then
    raise exception 'Table number must be positive' using errcode = '22003';
  end if;

  if v_capacity <= 0 then
    raise exception 'Table capacity must be positive' using errcode = '22003';
  end if;

  if p_table_id is null then
    insert into public.tables (
      business_id,
      number,
      name,
      capacity,
      zone,
      status,
      icon,
      code,
      shape,
      size,
      position,
      is_active,
      metadata
    )
    values (
      p_business_id,
      v_number,
      v_name,
      v_capacity,
      v_zone,
      v_status,
      v_icon,
      v_code,
      v_shape,
      v_size,
      v_position,
      v_is_active,
      jsonb_build_object('source', 'save_table_layout')
    )
    returning id into v_table_id;
  else
    update public.tables
    set
      number = v_number,
      name = v_name,
      capacity = v_capacity,
      zone = v_zone,
      status = case
        when status in ('occupied', 'order_sent', 'preparing', 'ready', 'waiting_payment') then status
        else v_status
      end,
      icon = v_icon,
      code = v_code,
      shape = v_shape,
      size = v_size,
      position = v_position,
      is_active = v_is_active
    where id = p_table_id
      and business_id = p_business_id
    returning id into v_table_id;

    if v_table_id is null then
      raise exception 'Table not found' using errcode = 'P0002';
    end if;
  end if;

  insert into public.table_events (
    business_id,
    table_id,
    event_type,
    description,
    created_by,
    new_value
  )
  values (
    p_business_id,
    v_table_id,
    'table_updated',
    case when p_table_id is null then 'Mesa creada.' else 'Mesa actualizada.' end,
    auth.uid(),
    p_table
  );

  return v_table_id;
end;
$$;

create or replace function public.salon_assert_table_available(
  p_business_id uuid,
  p_table_id uuid
)
returns public.tables
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table public.tables%rowtype;
begin
  select *
  into v_table
  from public.tables
  where id = p_table_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Table not found' using errcode = 'P0002';
  end if;

  if v_table.status not in ('free', 'cleaning') or not v_table.is_active then
    raise exception 'Table is not available' using errcode = 'P0001';
  end if;

  return v_table;
end;
$$;

create or replace function public.open_table_session(
  p_business_id uuid,
  p_table_id uuid,
  p_waiter_name text,
  p_guests_count integer default 1,
  p_customer_id uuid default null,
  p_customer_name text default '',
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table public.tables%rowtype;
  v_session_id uuid;
  v_waiter_name text;
begin
  perform public.assert_business_member(p_business_id);
  v_table := public.salon_assert_table_available(p_business_id, p_table_id);
  v_waiter_name := nullif(trim(coalesce(p_waiter_name, '')), '');

  if v_waiter_name is null then
    raise exception 'Waiter name is required' using errcode = '22023';
  end if;

  if coalesce(p_guests_count, 0) <= 0 then
    raise exception 'Guests count must be positive' using errcode = '22003';
  end if;

  insert into public.table_sessions (
    business_id,
    table_id,
    customer_id,
    waiter_id,
    table_name,
    waiter_name,
    customer_name,
    guests_count,
    status,
    notes
  )
  values (
    p_business_id,
    p_table_id,
    p_customer_id,
    auth.uid(),
    v_table.name,
    v_waiter_name,
    coalesce(p_customer_name, ''),
    p_guests_count,
    'waiting_order',
    coalesce(p_notes, '')
  )
  returning id into v_session_id;

  update public.tables
  set status = 'waiting_order',
      current_session_id = v_session_id,
      current_order_id = null,
      current_order_summary = '',
      current_total = 0,
      waiter_name = v_waiter_name,
      guests_count = p_guests_count
  where id = p_table_id;

  insert into public.table_events (
    business_id, table_id, session_id, event_type, description, created_by, created_by_name
  )
  values (
    p_business_id, p_table_id, v_session_id, 'session_opened',
    concat(v_waiter_name, ' abrio ', v_table.name, ' para ', p_guests_count, ' persona(s).'),
    auth.uid(), v_waiter_name
  );

  return v_session_id;
end;
$$;

create or replace function public.send_order_to_kitchen(
  p_business_id uuid,
  p_table_id uuid,
  p_session_id uuid,
  p_order_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_customer_id uuid default null,
  p_customer_name text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table public.tables%rowtype;
  v_session public.table_sessions%rowtype;
  v_order_id uuid;
  v_existing_items jsonb := '[]'::jsonb;
  v_all_items jsonb := '[]'::jsonb;
  v_items_count integer := 0;
  v_subtotal numeric(12, 2) := 0;
  v_summary text := '';
  v_item jsonb;
begin
  perform public.assert_business_member(p_business_id);

  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Order must include at least one item' using errcode = '22023';
  end if;

  select * into v_table from public.tables where id = p_table_id and business_id = p_business_id for update;
  if not found then raise exception 'Table not found' using errcode = 'P0002'; end if;

  select * into v_session from public.table_sessions where id = p_session_id and business_id = p_business_id for update;
  if not found then raise exception 'Table session not found' using errcode = 'P0002'; end if;

  if p_order_id is not null then
    select items into v_existing_items
    from public.table_orders
    where id = p_order_id and business_id = p_business_id
    for update;
  end if;

  v_all_items := coalesce(v_existing_items, '[]'::jsonb) || p_items;

  for v_item in select value from jsonb_array_elements(v_all_items)
  loop
    if coalesce(v_item->>'status', '') <> 'canceled' then
      v_items_count := v_items_count + coalesce(nullif(v_item->>'quantity', '')::integer, 0);
      v_subtotal := v_subtotal + (
        coalesce(nullif(v_item->>'quantity', '')::numeric, 0) *
        coalesce(nullif(coalesce(v_item->>'unitPrice', v_item->>'price'), '')::numeric, 0)
      );
    end if;
  end loop;

  select string_agg(concat(coalesce(nullif(item->>'quantity', ''), '0'), 'x ', coalesce(item->>'productName', item->>'name', 'Item')), ', ')
  into v_summary
  from (
    select value as item
    from jsonb_array_elements(v_all_items)
    limit 3
  ) items;

  if p_order_id is null then
    insert into public.table_orders (
      business_id, table_id, session_id, customer_id, table_name, customer_name, waiter_id,
      status, kitchen_status, items, items_count, subtotal, total, sent_at
    )
    values (
      p_business_id, p_table_id, p_session_id, p_customer_id, v_table.name, coalesce(p_customer_name, ''), auth.uid(),
      'sent', 'pending', v_all_items, v_items_count, v_subtotal, v_subtotal, now()
    )
    returning id into v_order_id;
  else
    update public.table_orders
    set items = v_all_items,
        items_count = v_items_count,
        subtotal = v_subtotal,
        total = v_subtotal,
        status = 'sent',
        kitchen_status = 'pending',
        sent_at = coalesce(sent_at, now())
    where id = p_order_id
      and business_id = p_business_id
    returning id into v_order_id;
  end if;

  insert into public.kitchen_tickets (
    business_id, table_id, session_id, order_id, table_name, items, status, sent_at
  )
  values (p_business_id, p_table_id, p_session_id, v_order_id, v_table.name, p_items, 'pending', now());

  update public.table_sessions
  set status = 'order_sent',
      subtotal = v_subtotal,
      total = v_subtotal,
      total_items = v_items_count,
      last_activity_at = now()
  where id = p_session_id;

  update public.tables
  set status = 'order_sent',
      current_session_id = p_session_id,
      current_order_id = v_order_id,
      current_order_summary = coalesce(v_summary, ''),
      current_total = v_subtotal
  where id = p_table_id;

  insert into public.table_events (business_id, table_id, session_id, order_id, event_type, description, created_by)
  values (p_business_id, p_table_id, p_session_id, v_order_id, 'order_sent', 'Pedido enviado a cocina/barra.', auth.uid());

  return v_order_id;
end;
$$;

create or replace function public.update_kitchen_ticket_status(
  p_business_id uuid,
  p_ticket_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.kitchen_tickets%rowtype;
begin
  perform public.assert_business_member(p_business_id);

  if p_status not in ('pending', 'preparing', 'ready', 'delivered', 'cancelled') then
    raise exception 'Invalid kitchen status' using errcode = '22023';
  end if;

  select * into v_ticket
  from public.kitchen_tickets
  where id = p_ticket_id and business_id = p_business_id
  for update;

  if not found then raise exception 'Kitchen ticket not found' using errcode = 'P0002'; end if;

  update public.kitchen_tickets
  set status = p_status,
      started_at = case when p_status = 'preparing' then now() else started_at end,
      ready_at = case when p_status = 'ready' then now() else ready_at end,
      delivered_at = case when p_status = 'delivered' then now() else delivered_at end
  where id = p_ticket_id;

  update public.table_orders
  set kitchen_status = p_status
  where id = v_ticket.order_id;

  if p_status <> 'delivered' then
    update public.tables set status = p_status where id = v_ticket.table_id;
    update public.table_sessions set status = p_status, last_activity_at = now() where id = v_ticket.session_id;
  end if;

  insert into public.table_events (business_id, table_id, session_id, order_id, event_type, description, created_by, previous_value, new_value)
  values (p_business_id, v_ticket.table_id, v_ticket.session_id, v_ticket.order_id, 'kitchen_status_updated', concat('Cocina/barra cambio a ', p_status, '.'), auth.uid(), to_jsonb(v_ticket.status), to_jsonb(p_status));
end;
$$;

create or replace function public.request_table_bill(
  p_business_id uuid,
  p_table_id uuid,
  p_session_id uuid,
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_business_member(p_business_id);

  update public.tables
  set status = 'waiting_payment',
      current_session_id = p_session_id,
      current_order_id = p_order_id
  where id = p_table_id and business_id = p_business_id;

  update public.table_sessions
  set status = 'waiting_payment',
      payment_requested_at = now(),
      last_activity_at = now()
  where id = p_session_id and business_id = p_business_id;

  update public.table_orders
  set status = 'cuenta_solicitada'
  where id = p_order_id and business_id = p_business_id;

  insert into public.table_events (business_id, table_id, session_id, order_id, event_type, description, created_by)
  values (p_business_id, p_table_id, p_session_id, p_order_id, 'payment_requested', 'Cuenta solicitada para cierre de mesa.', auth.uid());
end;
$$;

create or replace function public.release_clean_table(
  p_business_id uuid,
  p_table_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_business_member(p_business_id);

  update public.table_sessions
  set status = 'closed',
      closed_at = now(),
      last_activity_at = now()
  where business_id = p_business_id
    and table_id = p_table_id
    and status in ('waiting_order', 'occupied', 'order_sent', 'preparing', 'ready', 'waiting_payment');

  update public.tables
  set status = 'free',
      current_session_id = null,
      current_order_id = null,
      current_order_summary = '',
      current_total = 0,
      waiter_name = '',
      guests_count = 0
  where id = p_table_id and business_id = p_business_id;

  insert into public.table_events (business_id, table_id, event_type, description, created_by)
  values (p_business_id, p_table_id, 'table_released', 'Mesa marcada como limpia y libre.', auth.uid());
end;
$$;

create or replace function public.transfer_table_session(
  p_business_id uuid,
  p_source_table_id uuid,
  p_target_table_id uuid,
  p_session_id uuid,
  p_order_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.tables%rowtype;
  v_source public.tables%rowtype;
begin
  perform public.assert_business_member(p_business_id);
  select * into v_source from public.tables where id = p_source_table_id and business_id = p_business_id for update;
  v_target := public.salon_assert_table_available(p_business_id, p_target_table_id);

  update public.tables
  set status = 'free',
      current_session_id = null,
      current_order_id = null,
      current_order_summary = '',
      current_total = 0,
      waiter_name = '',
      guests_count = 0
  where id = p_source_table_id;

  update public.tables
  set status = coalesce(nullif(v_source.status, 'free'), 'occupied'),
      current_session_id = p_session_id,
      current_order_id = p_order_id,
      current_order_summary = v_source.current_order_summary,
      current_total = v_source.current_total,
      waiter_name = v_source.waiter_name,
      guests_count = v_source.guests_count
  where id = p_target_table_id;

  update public.table_sessions
  set table_id = p_target_table_id,
      table_name = v_target.name,
      last_activity_at = now()
  where id = p_session_id and business_id = p_business_id;

  update public.table_orders
  set table_id = p_target_table_id,
      table_name = v_target.name
  where id = p_order_id and business_id = p_business_id;

  update public.kitchen_tickets
  set table_id = p_target_table_id,
      table_name = v_target.name
  where session_id = p_session_id and business_id = p_business_id;

  insert into public.table_events (business_id, table_id, session_id, order_id, event_type, description, created_by, previous_value, new_value)
  values (p_business_id, p_source_table_id, p_session_id, p_order_id, 'table_transferred', concat('Sesion transferida a ', v_target.name, '.'), auth.uid(), to_jsonb(p_source_table_id), to_jsonb(p_target_table_id));
end;
$$;

create or replace function public.cancel_table_order_item(
  p_business_id uuid,
  p_table_id uuid,
  p_session_id uuid,
  p_order_id uuid,
  p_line_id text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.table_orders%rowtype;
  v_item jsonb;
  v_items jsonb := '[]'::jsonb;
  v_items_count integer := 0;
  v_subtotal numeric(12, 2) := 0;
begin
  perform public.assert_business_member(p_business_id);

  if nullif(trim(coalesce(p_line_id, '')), '') is null then
    raise exception 'Line id is required' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'Cancellation reason is required' using errcode = '22023';
  end if;

  select *
  into v_order
  from public.table_orders
  where id = p_order_id and business_id = p_business_id
  for update;

  if not found then raise exception 'Order not found' using errcode = 'P0002'; end if;

  for v_item in select value from jsonb_array_elements(v_order.items)
  loop
    if coalesce(v_item->>'lineId', v_item->>'line_id', '') = p_line_id then
      v_item := v_item || jsonb_build_object(
        'status', 'canceled',
        'cancelReason', p_reason,
        'cancel_reason', p_reason,
        'canceledAt', now()
      );
    end if;

    v_items := v_items || jsonb_build_array(v_item);

    if coalesce(v_item->>'status', '') <> 'canceled' then
      v_items_count := v_items_count + coalesce(nullif(v_item->>'quantity', '')::integer, 0);
      v_subtotal := v_subtotal + (
        coalesce(nullif(v_item->>'quantity', '')::numeric, 0) *
        coalesce(nullif(coalesce(v_item->>'unitPrice', v_item->>'price'), '')::numeric, 0)
      );
    end if;
  end loop;

  update public.table_orders
  set items = v_items,
      items_count = v_items_count,
      subtotal = v_subtotal,
      total = v_subtotal
  where id = p_order_id;

  update public.table_sessions
  set subtotal = v_subtotal,
      total = v_subtotal,
      total_items = v_items_count,
      last_activity_at = now()
  where id = p_session_id and business_id = p_business_id;

  update public.tables
  set current_total = v_subtotal
  where id = p_table_id and business_id = p_business_id;

  insert into public.table_events (business_id, table_id, session_id, order_id, event_type, description, created_by, new_value)
  values (p_business_id, p_table_id, p_session_id, p_order_id, 'item_canceled', concat('Item cancelado. Motivo: ', p_reason), auth.uid(), jsonb_build_object('line_id', p_line_id, 'reason', p_reason));
end;
$$;

create or replace function public.reassign_table_waiter(
  p_business_id uuid,
  p_table_id uuid,
  p_session_id uuid,
  p_waiter_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_waiter_name text;
  v_previous_name text;
begin
  perform public.assert_business_member(p_business_id);
  v_waiter_name := nullif(trim(coalesce(p_waiter_name, '')), '');

  if v_waiter_name is null then
    raise exception 'Waiter name is required' using errcode = '22023';
  end if;

  select waiter_name
  into v_previous_name
  from public.table_sessions
  where id = p_session_id and business_id = p_business_id
  for update;

  if not found then raise exception 'Table session not found' using errcode = 'P0002'; end if;

  update public.table_sessions
  set waiter_id = auth.uid(),
      waiter_name = v_waiter_name,
      last_activity_at = now()
  where id = p_session_id and business_id = p_business_id;

  update public.tables
  set waiter_name = v_waiter_name
  where id = p_table_id and business_id = p_business_id;

  insert into public.table_events (business_id, table_id, session_id, event_type, description, created_by, previous_value, new_value)
  values (p_business_id, p_table_id, p_session_id, 'waiter_changed', concat('Mesero reasignado a ', v_waiter_name, '.'), auth.uid(), to_jsonb(v_previous_name), to_jsonb(v_waiter_name));
end;
$$;

-- <<< database/supabase/rpc-operational.sql

-- >>> database/supabase/schema-finance.sql
-- Finance extension for purchases and supplier payables.
-- Apply after schema.sql, rls.sql and rpc-core.sql.

alter table public.cash_movements drop constraint if exists cash_movements_type_check;
alter table public.cash_movements add constraint cash_movements_type_check
check (type in (
  'opening',
  'sale_income',
  'purchase_expense',
  'operating_expense',
  'operational_expense',
  'supplier_payment',
  'debt_payment',
  'debt_payment_income',
  'manual_income',
  'adjustment',
  'closing',
  'reversal'
));

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_name text not null default '',
  purchase_number text,
  purchase_date date not null default current_date,
  status text not null default 'borrador',
  payment_status text not null default 'pending',
  payment_method text not null default 'credit',
  subtotal numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  paid_amount numeric(12, 2) not null default 0,
  pending_amount numeric(12, 2) not null default 0,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references public.profiles(id),
  confirmed_by uuid references public.profiles(id),
  cancelled_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchases_status_check check (status in ('borrador', 'confirmada', 'anulada', 'parcial', 'devuelta')),
  constraint purchases_payment_status_check check (payment_status in ('pending', 'partial', 'paid', 'cancelled', 'refunded')),
  constraint purchases_totals_non_negative check (subtotal >= 0 and tax_total >= 0 and total >= 0 and paid_amount >= 0 and pending_amount >= 0)
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  inventory_item_id text,
  item_name text not null,
  category text,
  quantity numeric(14, 4) not null,
  unit text not null default 'und',
  unit_cost numeric(12, 2) not null default 0,
  subtotal numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  batch text,
  expiration_date date,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_items_amounts_check check (quantity > 0 and unit_cost >= 0 and subtotal >= 0 and tax_total >= 0)
);

create table if not exists public.accounts_payable (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  purchase_id uuid references public.purchases(id) on delete cascade,
  supplier_name text not null default '',
  concept text not null default 'Compra a proveedor',
  original_amount numeric(12, 2) not null default 0,
  paid_amount numeric(12, 2) not null default 0,
  pending_amount numeric(12, 2) not null default 0,
  status text not null default 'pending',
  due_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_payable_status_check check (status in ('pending', 'partial', 'paid', 'cancelled')),
  constraint accounts_payable_amounts_check check (original_amount >= 0 and paid_amount >= 0 and pending_amount >= 0)
);

create unique index if not exists purchases_business_number_idx
on public.purchases (business_id, purchase_number)
where purchase_number is not null;

create unique index if not exists accounts_payable_purchase_unique_idx
on public.accounts_payable (purchase_id)
where purchase_id is not null;

create index if not exists purchases_business_date_idx on public.purchases(business_id, purchase_date desc, created_at desc);
create index if not exists purchases_supplier_id_idx on public.purchases(supplier_id);
create index if not exists purchases_created_by_idx on public.purchases(created_by);
create index if not exists purchases_confirmed_by_idx on public.purchases(confirmed_by);
create index if not exists purchases_cancelled_by_idx on public.purchases(cancelled_by);
create index if not exists purchase_items_purchase_idx on public.purchase_items(purchase_id);
create index if not exists purchase_items_business_id_idx on public.purchase_items(business_id);
create index if not exists purchase_items_product_id_idx on public.purchase_items(product_id);
create index if not exists accounts_payable_business_status_idx on public.accounts_payable(business_id, status);
create index if not exists accounts_payable_supplier_id_idx on public.accounts_payable(supplier_id);

drop trigger if exists purchases_set_updated_at on public.purchases;
create trigger purchases_set_updated_at before update on public.purchases for each row execute function public.set_updated_at();

drop trigger if exists purchase_items_set_updated_at on public.purchase_items;
create trigger purchase_items_set_updated_at before update on public.purchase_items for each row execute function public.set_updated_at();

drop trigger if exists accounts_payable_set_updated_at on public.accounts_payable;
create trigger accounts_payable_set_updated_at before update on public.accounts_payable for each row execute function public.set_updated_at();

alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.accounts_payable enable row level security;

drop policy if exists "purchases members read" on public.purchases;
create policy "purchases members read" on public.purchases for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "purchases members write" on public.purchases;
create policy "purchases members write" on public.purchases for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "purchase items members read" on public.purchase_items;
create policy "purchase items members read" on public.purchase_items for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "purchase items members write" on public.purchase_items;
create policy "purchase items members write" on public.purchase_items for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "accounts payable members read" on public.accounts_payable;
create policy "accounts payable members read" on public.accounts_payable for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "accounts payable members write" on public.accounts_payable;
create policy "accounts payable members write" on public.accounts_payable for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

-- <<< database/supabase/schema-finance.sql

-- >>> database/supabase/rpc-finance.sql
-- Finance RPCs for purchases and supplier payables.
-- Apply after schema-finance.sql.

create or replace function public.save_purchase(
  p_business_id uuid,
  p_purchase_id uuid default null,
  p_purchase jsonb default '{}'::jsonb,
  p_items jsonb default '[]'::jsonb,
  p_confirm boolean default false,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase_id uuid;
  v_existing public.purchases%rowtype;
  v_item jsonb;
  v_item_count integer;
  v_supplier_id uuid;
  v_supplier_name text;
  v_purchase_date date;
  v_subtotal numeric(12, 2);
  v_tax_total numeric(12, 2);
  v_total numeric(12, 2);
  v_supply_id uuid;
  v_confirm_result jsonb;
begin
  perform public.assert_business_member(p_business_id);

  select count(*) into v_item_count from jsonb_array_elements(p_items);
  if v_item_count <= 0 then
    raise exception 'Purchase must include at least one item' using errcode = '22023';
  end if;

  v_supplier_id := nullif(p_purchase->>'supplier_id', '')::uuid;
  if v_supplier_id is null then
    raise exception 'Supplier is required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.suppliers where id = v_supplier_id and business_id = p_business_id
  ) then
    raise exception 'Supplier not found' using errcode = 'P0002';
  end if;

  v_supplier_name := coalesce(nullif(trim(p_purchase->>'supplier_name'), ''), '');
  v_purchase_date := coalesce(nullif(p_purchase->>'purchase_date', '')::date, current_date);
  v_subtotal := coalesce(nullif(p_purchase->>'subtotal', '')::numeric, 0);
  v_tax_total := coalesce(nullif(p_purchase->>'tax_total', '')::numeric, 0);
  v_total := coalesce(nullif(p_purchase->>'total', '')::numeric, v_subtotal + v_tax_total, 0);

  if v_subtotal < 0 or v_tax_total < 0 or v_total < 0 then
    raise exception 'Purchase totals cannot be negative' using errcode = '22003';
  end if;

  if p_purchase_id is not null then
    select *
    into v_existing
    from public.purchases
    where id = p_purchase_id
      and business_id = p_business_id
    for update;

    if not found then
      raise exception 'Purchase not found' using errcode = 'P0002';
    end if;

    if v_existing.status = 'confirmada' then
      raise exception 'Confirmed purchase cannot be edited' using errcode = 'P0001';
    end if;

    update public.purchases
    set
      supplier_id = v_supplier_id,
      supplier_name = v_supplier_name,
      purchase_number = nullif(p_purchase->>'purchase_number', ''),
      purchase_date = v_purchase_date,
      status = 'borrador',
      payment_status = 'pending',
      payment_method = coalesce(nullif(p_purchase->>'payment_method', ''), 'credit'),
      subtotal = v_subtotal,
      tax_total = v_tax_total,
      total = v_total,
      paid_amount = 0,
      pending_amount = v_total,
      notes = nullif(p_purchase->>'notes', ''),
      metadata = coalesce(p_purchase->'metadata', '{}'::jsonb)
    where id = p_purchase_id
    returning id into v_purchase_id;

    delete from public.purchase_items
    where purchase_id = p_purchase_id
      and business_id = p_business_id;
  else
    insert into public.purchases (
      business_id,
      supplier_id,
      supplier_name,
      purchase_number,
      purchase_date,
      status,
      payment_status,
      payment_method,
      subtotal,
      tax_total,
      total,
      paid_amount,
      pending_amount,
      notes,
      metadata,
      created_by
    )
    values (
      p_business_id,
      v_supplier_id,
      v_supplier_name,
      nullif(p_purchase->>'purchase_number', ''),
      v_purchase_date,
      'borrador',
      'pending',
      coalesce(nullif(p_purchase->>'payment_method', ''), 'credit'),
      v_subtotal,
      v_tax_total,
      v_total,
      0,
      v_total,
      nullif(p_purchase->>'notes', ''),
      coalesce(p_purchase->'metadata', '{}'::jsonb),
      auth.uid()
    )
    returning id into v_purchase_id;
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce(nullif(v_item->>'quantity', '')::numeric, 0) <= 0 then
      raise exception 'Purchase item quantity must be positive' using errcode = '22003';
    end if;

    if coalesce(nullif(v_item->>'unit_cost', '')::numeric, 0) < 0 then
      raise exception 'Purchase item unit cost cannot be negative' using errcode = '22003';
    end if;

    v_supply_id := nullif(v_item->>'inventory_item_id', '')::uuid;

    if v_supply_id is null then
      insert into public.supplies (
        business_id,
        name,
        category,
        unit,
        status,
        current_stock,
        minimum_stock,
        average_cost,
        last_purchase_cost,
        supplier_id,
        metadata
      )
      values (
        p_business_id,
        coalesce(nullif(trim(v_item->>'item_name'), ''), 'Insumo'),
        coalesce(nullif(v_item->>'category', ''), ''),
        coalesce(nullif(v_item->>'unit', ''), 'und'),
        'active',
        0,
        0,
        coalesce(nullif(v_item->>'unit_cost', '')::numeric, 0),
        coalesce(nullif(v_item->>'unit_cost', '')::numeric, 0),
        v_supplier_id,
        jsonb_build_object(
          'source', 'purchase_manual_item',
          'search_key', lower(coalesce(nullif(trim(v_item->>'item_name'), ''), 'insumo'))
        )
      )
      on conflict (business_id, name)
      do update set
        category = coalesce(nullif(excluded.category, ''), public.supplies.category),
        unit = coalesce(nullif(excluded.unit, ''), public.supplies.unit),
        last_purchase_cost = excluded.last_purchase_cost,
        supplier_id = coalesce(excluded.supplier_id, public.supplies.supplier_id)
      returning id into v_supply_id;
    elsif not exists (
      select 1 from public.supplies where id = v_supply_id and business_id = p_business_id
    ) then
      raise exception 'Supply not found' using errcode = 'P0002';
    end if;

    insert into public.purchase_items (
      business_id,
      purchase_id,
      product_id,
      inventory_item_id,
      item_name,
      category,
      quantity,
      unit,
      unit_cost,
      subtotal,
      tax_total,
      batch,
      expiration_date,
      notes,
      metadata
    )
    values (
      p_business_id,
      v_purchase_id,
      nullif(v_item->>'product_id', '')::uuid,
      v_supply_id::text,
      coalesce(nullif(trim(v_item->>'item_name'), ''), 'Insumo'),
      nullif(v_item->>'category', ''),
      coalesce(nullif(v_item->>'quantity', '')::numeric, 0),
      coalesce(nullif(v_item->>'unit', ''), 'und'),
      coalesce(nullif(v_item->>'unit_cost', '')::numeric, 0),
      coalesce(nullif(v_item->>'subtotal', '')::numeric, 0),
      coalesce(nullif(v_item->>'tax_total', '')::numeric, 0),
      nullif(v_item->>'batch', ''),
      nullif(v_item->>'expiration_date', '')::date,
      nullif(v_item->>'notes', ''),
      coalesce(v_item->'metadata', '{}'::jsonb)
    );
  end loop;

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    reason
  )
  values (
    p_business_id,
    auth.uid(),
    'purchases',
    case when p_purchase_id is null then 'purchase.create' else 'purchase.update' end,
    'purchases',
    v_purchase_id::text,
    case when p_purchase_id is null then null else to_jsonb(v_existing) end,
    jsonb_build_object('purchase_id', v_purchase_id, 'item_count', v_item_count, 'total', v_total),
    p_notes
  );

  if p_confirm then
    v_confirm_result := public.confirm_purchase(p_business_id, v_purchase_id, p_notes);
  end if;

  return jsonb_build_object(
    'purchase_id', v_purchase_id,
    'status', case when p_confirm then 'confirmada' else 'borrador' end,
    'confirmed', p_confirm,
    'confirm_result', v_confirm_result
  );
end;
$$;

create or replace function public.cancel_purchase(
  p_purchase_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases%rowtype;
begin
  select *
  into v_purchase
  from public.purchases
  where id = p_purchase_id
  for update;

  if not found then
    raise exception 'Purchase not found' using errcode = 'P0002';
  end if;

  perform public.assert_business_member(v_purchase.business_id);

  if v_purchase.status = 'confirmada' then
    raise exception 'Confirmed purchase cannot be cancelled from this flow' using errcode = 'P0001';
  end if;

  update public.purchases
  set
    status = 'anulada',
    payment_status = 'cancelled',
    pending_amount = 0,
    cancelled_at = now(),
    cancelled_by = auth.uid(),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('cancel_reason', nullif(trim(p_reason), ''))
  where id = p_purchase_id;

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    reason
  )
  values (
    v_purchase.business_id,
    auth.uid(),
    'purchases',
    'purchase.cancel',
    'purchases',
    p_purchase_id::text,
    to_jsonb(v_purchase),
    jsonb_build_object('status', 'anulada'),
    p_reason
  );

  return jsonb_build_object('purchase_id', p_purchase_id, 'status', 'anulada');
end;
$$;

create or replace function public.confirm_purchase(
  p_business_id uuid,
  p_purchase_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases%rowtype;
  v_payable_id uuid;
  v_item public.purchase_items%rowtype;
  v_supply public.supplies%rowtype;
  v_next_stock numeric(14, 4);
  v_next_average_cost numeric(12, 2);
begin
  perform public.assert_business_member(p_business_id);

  select *
  into v_purchase
  from public.purchases
  where id = p_purchase_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Purchase not found' using errcode = 'P0002';
  end if;

  if v_purchase.status = 'anulada' then
    raise exception 'Cancelled purchase cannot be confirmed' using errcode = 'P0001';
  end if;

  if v_purchase.status = 'confirmada' then
    return jsonb_build_object(
      'purchase_id', p_purchase_id,
      'status', v_purchase.status,
      'payment_status', v_purchase.payment_status,
      'pending_amount', v_purchase.pending_amount
    );
  end if;

  update public.purchases
  set
    status = 'confirmada',
    payment_status = case when total > 0 then 'pending' else 'paid' end,
    paid_amount = 0,
    pending_amount = total,
    confirmed_at = now(),
    confirmed_by = auth.uid()
  where id = p_purchase_id
  returning * into v_purchase;

  insert into public.accounts_payable (
    business_id,
    supplier_id,
    purchase_id,
    supplier_name,
    concept,
    original_amount,
    paid_amount,
    pending_amount,
    status,
    metadata
  )
  values (
    p_business_id,
    v_purchase.supplier_id,
    p_purchase_id,
    v_purchase.supplier_name,
    coalesce(nullif(v_purchase.purchase_number, ''), 'Compra a proveedor'),
    v_purchase.total,
    0,
    v_purchase.total,
    case when v_purchase.total > 0 then 'pending' else 'paid' end,
    jsonb_build_object('source', 'confirm_purchase')
  )
  on conflict (purchase_id) where purchase_id is not null
  do update set
    original_amount = excluded.original_amount,
    pending_amount = greatest(excluded.original_amount - public.accounts_payable.paid_amount, 0),
    status = case
      when greatest(excluded.original_amount - public.accounts_payable.paid_amount, 0) <= 0 then 'paid'
      when public.accounts_payable.paid_amount > 0 then 'partial'
      else 'pending'
    end
  returning id into v_payable_id;

  for v_item in
    select *
    from public.purchase_items
    where purchase_id = p_purchase_id
      and business_id = p_business_id
  loop
    v_supply := null;

    if nullif(v_item.inventory_item_id, '') is not null then
      select *
      into v_supply
      from public.supplies
      where id::text = v_item.inventory_item_id
        and business_id = p_business_id
      for update;
    end if;

    if v_supply.id is not null then
      v_next_stock := coalesce(v_supply.current_stock, 0) + v_item.quantity;
      v_next_average_cost := case
        when v_next_stock > 0 then
          greatest(
            ((coalesce(v_supply.current_stock, 0) * coalesce(v_supply.average_cost, 0)) + (v_item.quantity * v_item.unit_cost)) / v_next_stock,
            0
          )
        else coalesce(v_supply.average_cost, 0)
      end;

      update public.supplies
      set
        current_stock = v_next_stock,
        average_cost = v_next_average_cost,
        last_purchase_cost = v_item.unit_cost,
        category = coalesce(nullif(v_item.category, ''), category),
        unit = coalesce(nullif(v_item.unit, ''), unit)
      where id = v_supply.id;
    end if;

    insert into public.inventory_movements (
      business_id,
      product_id,
      source_type,
      source_id,
      movement_type,
      direction,
      quantity,
      unit_cost,
      status,
      metadata
    )
    values (
      p_business_id,
      v_item.product_id,
      'purchase',
      p_purchase_id,
      'purchase_in',
      'in',
      v_item.quantity,
      v_item.unit_cost,
      'valid',
      jsonb_build_object(
        'purchase_item_id', v_item.id,
        'inventory_item_id', v_item.inventory_item_id,
        'supply_id', v_supply.id,
        'item_name', v_item.item_name,
        'unit', v_item.unit,
        'category', v_item.category
      )
    );
  end loop;

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    reason
  )
  values (
    p_business_id,
    auth.uid(),
    'purchases',
    'purchase.confirm',
    'purchases',
    p_purchase_id::text,
    to_jsonb(v_purchase),
    jsonb_build_object('status', 'confirmada', 'payable_id', v_payable_id),
    p_notes
  );

  return jsonb_build_object(
    'purchase_id', p_purchase_id,
    'payable_id', v_payable_id,
    'status', 'confirmada',
    'payment_status', v_purchase.payment_status,
    'pending_amount', v_purchase.pending_amount
  );
end;
$$;

create or replace function public.settle_account_payable(
  p_business_id uuid,
  p_account_payable_id uuid,
  p_amount numeric,
  p_method text default 'cash',
  p_reference text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payable public.accounts_payable%rowtype;
  v_cash_session_id uuid;
  v_payment_amount numeric(12, 2);
  v_next_paid_amount numeric(12, 2);
  v_next_pending_amount numeric(12, 2);
  v_method text;
begin
  perform public.assert_business_member(p_business_id);

  select *
  into v_payable
  from public.accounts_payable
  where id = p_account_payable_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Account payable not found' using errcode = 'P0002';
  end if;

  if v_payable.status = 'cancelled' then
    raise exception 'Account payable is cancelled' using errcode = 'P0001';
  end if;

  if coalesce(v_payable.pending_amount, 0) <= 0 then
    raise exception 'Account payable has no pending amount' using errcode = 'P0001';
  end if;

  v_payment_amount := coalesce(p_amount, 0);

  if v_payment_amount <= 0 then
    raise exception 'Payment amount must be positive' using errcode = '22003';
  end if;

  if v_payment_amount > v_payable.pending_amount then
    raise exception 'Payment amount exceeds pending amount' using errcode = '22003';
  end if;

  select id
  into v_cash_session_id
  from public.cash_sessions
  where business_id = p_business_id
    and status = 'open'
  order by opened_at desc
  limit 1;

  if v_cash_session_id is null then
    raise exception 'Open cash session required for supplier payment' using errcode = 'P0001';
  end if;

  v_method := coalesce(nullif(trim(p_method), ''), 'cash');
  v_next_paid_amount := coalesce(v_payable.paid_amount, 0) + v_payment_amount;
  v_next_pending_amount := greatest(coalesce(v_payable.original_amount, 0) - v_next_paid_amount, 0);

  update public.accounts_payable
  set
    paid_amount = v_next_paid_amount,
    pending_amount = v_next_pending_amount,
    status = case when v_next_pending_amount > 0 then 'partial' else 'paid' end
  where id = p_account_payable_id;

  if v_payable.purchase_id is not null then
    update public.purchases
    set
      paid_amount = v_next_paid_amount,
      pending_amount = v_next_pending_amount,
      payment_status = case when v_next_pending_amount > 0 then 'partial' else 'paid' end
    where id = v_payable.purchase_id
      and business_id = p_business_id;
  end if;

  insert into public.cash_movements (
    business_id,
    cash_session_id,
    type,
    method,
    amount,
    status,
    description,
    metadata
  )
  values (
    p_business_id,
    v_cash_session_id,
    'supplier_payment',
    v_method,
    v_payment_amount,
    'valid',
    'Pago a proveedor',
    jsonb_build_object(
      'account_payable_id', p_account_payable_id,
      'purchase_id', v_payable.purchase_id,
      'supplier_id', v_payable.supplier_id,
      'supplier_name', v_payable.supplier_name,
      'reference', p_reference,
      'previous_pending_amount', v_payable.pending_amount,
      'next_pending_amount', v_next_pending_amount,
      'notes', p_notes
    )
  );

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    reason
  )
  values (
    p_business_id,
    auth.uid(),
    'finance',
    'payable.settle',
    'accounts_payable',
    p_account_payable_id::text,
    to_jsonb(v_payable),
    jsonb_build_object(
      'cash_session_id', v_cash_session_id,
      'amount', v_payment_amount,
      'method', v_method,
      'paid_amount', v_next_paid_amount,
      'pending_amount', v_next_pending_amount
    ),
    p_notes
  );

  return jsonb_build_object(
    'account_payable_id', p_account_payable_id,
    'cash_session_id', v_cash_session_id,
    'amount', v_payment_amount,
    'method', v_method,
    'paid_amount', v_next_paid_amount,
    'pending_amount', v_next_pending_amount,
    'status', case when v_next_pending_amount > 0 then 'partial' else 'paid' end
  );
end;
$$;

-- <<< database/supabase/rpc-finance.sql

-- >>> database/supabase/schema-profitability.sql
-- Profitability engine schema: technical sheets, versions and historical cost snapshots.
-- Apply after schema.sql, schema-inventory.sql and rls.sql.

create table if not exists public.technical_sheets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  active_version_id uuid,
  name text not null,
  code text not null default '',
  type text not null default 'final_product',
  category text not null default '',
  status text not null default 'draft',
  description text not null default '',
  responsible text not null default '',
  product_name text not null default '',
  sale_price numeric(12, 2) not null default 0,
  yield_data jsonb not null default '{}'::jsonb,
  procedure jsonb not null default '{}'::jsonb,
  plating jsonb not null default '{}'::jsonb,
  costing jsonb not null default '{}'::jsonb,
  bi jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint technical_sheets_type_check check (type in ('base', 'final_product', 'production', 'plating', 'costing')),
  constraint technical_sheets_status_check check (status in ('draft', 'active', 'inactive')),
  constraint technical_sheets_sale_price_non_negative check (sale_price >= 0)
);

create table if not exists public.technical_sheet_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  technical_sheet_id uuid not null references public.technical_sheets(id) on delete cascade,
  source_type text not null default 'raw_item',
  source_id uuid not null,
  name text not null,
  quantity numeric(14, 4) not null,
  unit text not null default 'und',
  unit_cost numeric(12, 4) not null default 0,
  total_cost numeric(14, 4) not null default 0,
  waste_percent numeric(8, 4) not null default 0,
  notes text not null default '',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint technical_sheet_items_source_type_check check (source_type in ('raw_item', 'technical_sheet')),
  constraint technical_sheet_items_quantity_positive check (quantity > 0),
  constraint technical_sheet_items_costs_non_negative check (unit_cost >= 0 and total_cost >= 0 and waste_percent >= 0)
);

create table if not exists public.technical_sheet_versions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  technical_sheet_id uuid not null references public.technical_sheets(id) on delete cascade,
  version_number integer not null default 1,
  status text not null default 'draft',
  yield_data jsonb not null default '{}'::jsonb,
  components jsonb not null default '[]'::jsonb,
  costing jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  activated_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint technical_sheet_versions_status_check check (status in ('draft', 'active', 'inactive', 'archived')),
  constraint technical_sheet_versions_number_positive check (version_number > 0),
  constraint technical_sheet_versions_number_unique unique (technical_sheet_id, version_number)
);

alter table public.technical_sheets
drop constraint if exists technical_sheets_active_version_fk;

alter table public.technical_sheets
add constraint technical_sheets_active_version_fk
foreign key (active_version_id) references public.technical_sheet_versions(id) on delete set null;

create table if not exists public.product_cost_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  technical_sheet_id uuid references public.technical_sheets(id) on delete set null,
  technical_sheet_version_id uuid references public.technical_sheet_versions(id) on delete set null,
  sale_id uuid references public.sales(id) on delete set null,
  sale_item_id uuid references public.sale_items(id) on delete set null,
  source_type text not null default 'recalculation',
  unit_cost numeric(14, 4) not null default 0,
  total_cost numeric(14, 4) not null default 0,
  sale_price numeric(14, 4) not null default 0,
  food_cost_percent numeric(10, 4) not null default 0,
  gross_margin numeric(14, 4) not null default 0,
  gross_margin_percent numeric(10, 4) not null default 0,
  ingredients_snapshot jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint product_cost_snapshots_source_type_check check (source_type in ('technical_sheet_activation', 'recalculation', 'sale_close', 'reversal')),
  constraint product_cost_snapshots_costs_non_negative check (unit_cost >= 0 and total_cost >= 0 and sale_price >= 0)
);

create index if not exists technical_sheets_business_id_idx on public.technical_sheets(business_id);
create index if not exists technical_sheets_product_id_idx on public.technical_sheets(product_id);
create index if not exists technical_sheets_business_status_idx on public.technical_sheets(business_id, status);
create index if not exists technical_sheets_created_at_idx on public.technical_sheets(created_at desc);
create index if not exists technical_sheets_created_by_idx on public.technical_sheets(created_by);
create index if not exists technical_sheets_updated_by_idx on public.technical_sheets(updated_by);

create index if not exists technical_sheet_items_business_id_idx on public.technical_sheet_items(business_id);
create index if not exists technical_sheet_items_sheet_id_idx on public.technical_sheet_items(technical_sheet_id);
create index if not exists technical_sheet_items_source_id_idx on public.technical_sheet_items(source_id);
create index if not exists technical_sheet_items_created_at_idx on public.technical_sheet_items(created_at desc);

create index if not exists technical_sheet_versions_business_id_idx on public.technical_sheet_versions(business_id);
create index if not exists technical_sheet_versions_sheet_id_idx on public.technical_sheet_versions(technical_sheet_id);
create index if not exists technical_sheet_versions_status_idx on public.technical_sheet_versions(technical_sheet_id, status);
create index if not exists technical_sheet_versions_created_at_idx on public.technical_sheet_versions(created_at desc);
create index if not exists technical_sheet_versions_created_by_idx on public.technical_sheet_versions(created_by);

create index if not exists product_cost_snapshots_business_id_idx on public.product_cost_snapshots(business_id);
create index if not exists product_cost_snapshots_product_id_idx on public.product_cost_snapshots(product_id);
create index if not exists product_cost_snapshots_sheet_id_idx on public.product_cost_snapshots(technical_sheet_id);
create index if not exists product_cost_snapshots_version_id_idx on public.product_cost_snapshots(technical_sheet_version_id);
create index if not exists product_cost_snapshots_sale_id_idx on public.product_cost_snapshots(sale_id);
create index if not exists product_cost_snapshots_sale_item_id_idx on public.product_cost_snapshots(sale_item_id);
create index if not exists product_cost_snapshots_source_type_idx on public.product_cost_snapshots(source_type);
create index if not exists product_cost_snapshots_created_at_idx on public.product_cost_snapshots(created_at desc);
create index if not exists technical_sheet_items_source_type_source_id_idx on public.technical_sheet_items(source_type, source_id);
create index if not exists technical_sheets_active_version_id_idx on public.technical_sheets(active_version_id);

drop trigger if exists technical_sheets_set_updated_at on public.technical_sheets;
create trigger technical_sheets_set_updated_at before update on public.technical_sheets for each row execute function public.set_updated_at();

drop trigger if exists technical_sheet_items_set_updated_at on public.technical_sheet_items;
create trigger technical_sheet_items_set_updated_at before update on public.technical_sheet_items for each row execute function public.set_updated_at();

alter table public.technical_sheets enable row level security;
alter table public.technical_sheet_items enable row level security;
alter table public.technical_sheet_versions enable row level security;
alter table public.product_cost_snapshots enable row level security;

drop policy if exists "technical sheets members read" on public.technical_sheets;
create policy "technical sheets members read" on public.technical_sheets for select to authenticated
using (public.has_business_role(business_id, array['owner', 'admin', 'manager', 'accountant']));

drop policy if exists "technical sheets members write" on public.technical_sheets;
drop policy if exists "technical sheets members insert" on public.technical_sheets;
create policy "technical sheets members insert" on public.technical_sheets for insert to authenticated
with check (public.has_business_role(business_id, array['owner', 'admin', 'manager']));

drop policy if exists "technical sheets members update" on public.technical_sheets;
create policy "technical sheets members update" on public.technical_sheets for update to authenticated
using (public.has_business_role(business_id, array['owner', 'admin', 'manager']))
with check (public.has_business_role(business_id, array['owner', 'admin', 'manager']));

drop policy if exists "technical sheets members delete" on public.technical_sheets;
create policy "technical sheets members delete" on public.technical_sheets for delete to authenticated
using (public.has_business_role(business_id, array['owner', 'admin', 'manager']));

drop policy if exists "technical sheet items members read" on public.technical_sheet_items;
create policy "technical sheet items members read" on public.technical_sheet_items for select to authenticated
using (public.has_business_role(business_id, array['owner', 'admin', 'manager', 'accountant']));

drop policy if exists "technical sheet items members write" on public.technical_sheet_items;
drop policy if exists "technical sheet items members insert" on public.technical_sheet_items;
create policy "technical sheet items members insert" on public.technical_sheet_items for insert to authenticated
with check (public.has_business_role(business_id, array['owner', 'admin', 'manager']));

drop policy if exists "technical sheet items members update" on public.technical_sheet_items;
create policy "technical sheet items members update" on public.technical_sheet_items for update to authenticated
using (public.has_business_role(business_id, array['owner', 'admin', 'manager']))
with check (public.has_business_role(business_id, array['owner', 'admin', 'manager']));

drop policy if exists "technical sheet items members delete" on public.technical_sheet_items;
create policy "technical sheet items members delete" on public.technical_sheet_items for delete to authenticated
using (public.has_business_role(business_id, array['owner', 'admin', 'manager']));

drop policy if exists "technical sheet versions members read" on public.technical_sheet_versions;
create policy "technical sheet versions members read" on public.technical_sheet_versions for select to authenticated
using (public.has_business_role(business_id, array['owner', 'admin', 'manager', 'accountant']));

drop policy if exists "technical sheet versions members write" on public.technical_sheet_versions;
drop policy if exists "technical sheet versions members insert" on public.technical_sheet_versions;
create policy "technical sheet versions members insert" on public.technical_sheet_versions for insert to authenticated
with check (public.has_business_role(business_id, array['owner', 'admin', 'manager']));

drop policy if exists "technical sheet versions members update" on public.technical_sheet_versions;
create policy "technical sheet versions members update" on public.technical_sheet_versions for update to authenticated
using (public.has_business_role(business_id, array['owner', 'admin', 'manager']))
with check (public.has_business_role(business_id, array['owner', 'admin', 'manager']));

drop policy if exists "technical sheet versions members delete" on public.technical_sheet_versions;
create policy "technical sheet versions members delete" on public.technical_sheet_versions for delete to authenticated
using (public.has_business_role(business_id, array['owner', 'admin', 'manager']));

drop policy if exists "product cost snapshots members read" on public.product_cost_snapshots;
create policy "product cost snapshots members read" on public.product_cost_snapshots for select to authenticated
using (public.has_business_role(business_id, array['owner', 'admin', 'manager', 'accountant']));

drop policy if exists "product cost snapshots append" on public.product_cost_snapshots;
create policy "product cost snapshots append" on public.product_cost_snapshots for insert to authenticated
with check (public.has_business_role(business_id, array['owner', 'admin', 'manager']));

-- <<< database/supabase/schema-profitability.sql

-- >>> database/supabase/rpc-profitability.sql
-- Profitability engine RPCs. Apply after schema-profitability.sql and rpc-core.sql.

create or replace function public.profitability_normalize_percent(p_value numeric, p_fallback numeric default 0)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case
    when p_value is null or p_value < 0 then p_fallback
    when p_value > 1 then p_value / 100
    else p_value
  end;
$$;

create or replace function public.profitability_component_cost(
  p_quantity numeric,
  p_unit_cost numeric,
  p_waste_percent numeric default 0
)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case
    when coalesce(p_quantity, 0) <= 0 or coalesce(p_unit_cost, 0) < 0 then 0
    else
      coalesce(p_quantity, 0)
      * coalesce(p_unit_cost, 0)
      * case
          when public.profitability_normalize_percent(p_waste_percent, 0) > 0
            then 1 / greatest(1 - public.profitability_normalize_percent(p_waste_percent, 0), 0.01)
          else 1
        end
  end;
$$;

create or replace function public.profitability_build_costing(
  p_components jsonb,
  p_yield_data jsonb,
  p_sale_price numeric,
  p_target_food_cost numeric default 0.3
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_component jsonb;
  v_total_cost numeric(14, 4) := 0;
  v_portions numeric(14, 4) := coalesce(nullif(p_yield_data->>'portions', '')::numeric, 1);
  v_cost_per_portion numeric(14, 4);
  v_sale_price numeric(14, 4) := coalesce(p_sale_price, 0);
  v_target_food_cost numeric(10, 4) := public.profitability_normalize_percent(p_target_food_cost, 0.3);
  v_suggested_price numeric(14, 4) := 0;
  v_food_cost_percent numeric(10, 4) := 0;
  v_gross_margin numeric(14, 4) := 0;
  v_gross_margin_percent numeric(10, 4) := 0;
begin
  if v_portions <= 0 then
    v_portions := 1;
  end if;

  for v_component in select value from jsonb_array_elements(coalesce(p_components, '[]'::jsonb))
  loop
    v_total_cost := v_total_cost + public.profitability_component_cost(
      coalesce(nullif(v_component->>'quantity', '')::numeric, 0),
      coalesce(nullif(coalesce(v_component->>'unitCost', v_component->>'unit_cost'), '')::numeric, 0),
      coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0)
    );
  end loop;

  v_cost_per_portion := v_total_cost / v_portions;
  v_suggested_price := case when v_target_food_cost > 0 then v_cost_per_portion / v_target_food_cost else 0 end;
  v_food_cost_percent := case when v_sale_price > 0 then (v_cost_per_portion / v_sale_price) * 100 else 0 end;
  v_gross_margin := v_sale_price - v_cost_per_portion;
  v_gross_margin_percent := case when v_sale_price > 0 then (v_gross_margin / v_sale_price) * 100 else 0 end;

  return jsonb_build_object(
    'totalCost', v_total_cost,
    'costPerPortion', v_cost_per_portion,
    'currentSalePrice', v_sale_price,
    'targetFoodCost', v_target_food_cost,
    'suggestedPrice', v_suggested_price,
    'foodCostPercent', v_food_cost_percent,
    'grossMargin', v_gross_margin,
    'grossMarginPercent', v_gross_margin_percent,
    'utilityEstimate', v_gross_margin
  );
end;
$$;

create or replace function public.assert_profitability_role(
  p_business_id uuid,
  p_allowed_roles text[],
  p_action text default 'profitability operation'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_business_member(p_business_id);

  if not public.has_business_role(p_business_id, p_allowed_roles) then
    raise exception 'Insufficient role for %', p_action using errcode = '42501';
  end if;
end;
$$;

create or replace function public.create_or_update_technical_sheet(
  p_business_id uuid,
  p_technical_sheet_id uuid default null,
  p_sheet jsonb default '{}'::jsonb,
  p_components jsonb default '[]'::jsonb,
  p_activate boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sheet_id uuid;
  v_version_id uuid;
  v_component jsonb;
  v_components jsonb := coalesce(p_components, p_sheet->'components', '[]'::jsonb);
  v_yield_data jsonb := coalesce(p_sheet->'yield', p_sheet->'yield_data', '{}'::jsonb);
  v_costing_payload jsonb := coalesce(p_sheet->'costing', '{}'::jsonb);
  v_sale_price numeric(14, 4);
  v_target_food_cost numeric(10, 4);
  v_costing jsonb;
  v_version_number integer;
  v_product_id uuid := nullif(p_sheet->>'product_id', '')::uuid;
  v_name text := nullif(trim(coalesce(p_sheet->>'name', '')), '');
begin
  perform public.assert_profitability_role(
    p_business_id,
    array['owner', 'admin', 'manager'],
    'technical sheet write'
  );

  if v_name is null then
    raise exception 'Technical sheet name is required' using errcode = '22023';
  end if;

  if jsonb_typeof(v_components) <> 'array' or jsonb_array_length(v_components) = 0 then
    raise exception 'Technical sheet must include at least one component' using errcode = '22023';
  end if;

  v_sale_price := coalesce(
    nullif(v_costing_payload->>'currentSalePrice', '')::numeric,
    nullif(v_costing_payload->>'current_sale_price', '')::numeric,
    nullif(p_sheet->>'sale_price', '')::numeric,
    0
  );
  v_target_food_cost := coalesce(
    nullif(v_costing_payload->>'targetFoodCost', '')::numeric,
    nullif(v_costing_payload->>'target_food_cost', '')::numeric,
    30
  );
  v_costing := public.profitability_build_costing(v_components, v_yield_data, v_sale_price, v_target_food_cost);

  if p_technical_sheet_id is null then
    insert into public.technical_sheets (
      business_id, product_id, name, code, type, category, status, description, responsible,
      product_name, sale_price, yield_data, procedure, plating, costing, bi, metadata, created_by, updated_by
    )
    values (
      p_business_id,
      v_product_id,
      v_name,
      coalesce(p_sheet->>'code', ''),
      coalesce(nullif(p_sheet->>'type', ''), 'final_product'),
      coalesce(p_sheet->>'category', ''),
      case when p_activate then 'active' else coalesce(nullif(p_sheet->>'status', ''), 'draft') end,
      coalesce(p_sheet->>'description', ''),
      coalesce(p_sheet->>'responsible', ''),
      coalesce(p_sheet->>'product_name', v_name),
      v_sale_price,
      v_yield_data,
      coalesce(p_sheet->'procedure', '{}'::jsonb),
      coalesce(p_sheet->'plating', '{}'::jsonb),
      v_costing,
      coalesce(p_sheet->'bi', '{}'::jsonb),
      coalesce(p_sheet->'metadata', '{}'::jsonb),
      auth.uid(),
      auth.uid()
    )
    returning id into v_sheet_id;
  else
    update public.technical_sheets
    set
      product_id = v_product_id,
      name = v_name,
      code = coalesce(p_sheet->>'code', code),
      type = coalesce(nullif(p_sheet->>'type', ''), type),
      category = coalesce(p_sheet->>'category', category),
      status = case when p_activate then 'active' else coalesce(nullif(p_sheet->>'status', ''), status) end,
      description = coalesce(p_sheet->>'description', description),
      responsible = coalesce(p_sheet->>'responsible', responsible),
      product_name = coalesce(p_sheet->>'product_name', product_name, v_name),
      sale_price = v_sale_price,
      yield_data = v_yield_data,
      procedure = coalesce(p_sheet->'procedure', procedure),
      plating = coalesce(p_sheet->'plating', plating),
      costing = v_costing,
      bi = coalesce(p_sheet->'bi', bi),
      metadata = coalesce(metadata, '{}'::jsonb) || coalesce(p_sheet->'metadata', '{}'::jsonb),
      updated_by = auth.uid(),
      deactivated_at = case when coalesce(p_sheet->>'status', '') = 'inactive' then now() else deactivated_at end
    where id = p_technical_sheet_id
      and business_id = p_business_id
    returning id into v_sheet_id;

    if v_sheet_id is null then
      raise exception 'Technical sheet not found' using errcode = 'P0002';
    end if;

    delete from public.technical_sheet_items
    where technical_sheet_id = v_sheet_id
      and business_id = p_business_id;
  end if;

  for v_component in select value from jsonb_array_elements(v_components)
  loop
    if coalesce(nullif(v_component->>'quantity', '')::numeric, 0) <= 0 then
      raise exception 'Technical sheet component quantity must be positive' using errcode = '22003';
    end if;

    if coalesce(nullif(coalesce(v_component->>'sourceType', v_component->>'source_type'), ''), 'raw_item') = 'raw_item'
      and not exists (
        select 1
        from public.supplies
        where id = nullif(coalesce(v_component->>'sourceId', v_component->>'source_id'), '')::uuid
          and business_id = p_business_id
      ) then
      raise exception 'Supply not found for technical sheet component' using errcode = 'P0002';
    end if;

    if coalesce(nullif(coalesce(v_component->>'sourceType', v_component->>'source_type'), ''), 'raw_item') = 'technical_sheet'
      and (
        nullif(coalesce(v_component->>'sourceId', v_component->>'source_id'), '')::uuid = v_sheet_id
        or not exists (
          select 1
          from public.technical_sheets
          where id = nullif(coalesce(v_component->>'sourceId', v_component->>'source_id'), '')::uuid
            and business_id = p_business_id
            and status = 'active'
            and active_version_id is not null
        )
      ) then
      raise exception 'Active source technical sheet not found for component' using errcode = 'P0002';
    end if;

    insert into public.technical_sheet_items (
      business_id, technical_sheet_id, source_type, source_id, name, quantity, unit,
      unit_cost, total_cost, waste_percent, notes, sort_order, metadata
    )
    values (
      p_business_id,
      v_sheet_id,
      coalesce(nullif(coalesce(v_component->>'sourceType', v_component->>'source_type'), ''), 'raw_item'),
      nullif(coalesce(v_component->>'sourceId', v_component->>'source_id'), '')::uuid,
      coalesce(nullif(v_component->>'name', ''), 'Componente'),
      coalesce(nullif(v_component->>'quantity', '')::numeric, 0),
      coalesce(nullif(v_component->>'unit', ''), 'und'),
      coalesce(nullif(coalesce(v_component->>'unitCost', v_component->>'unit_cost'), '')::numeric, 0),
      public.profitability_component_cost(
        coalesce(nullif(v_component->>'quantity', '')::numeric, 0),
        coalesce(nullif(coalesce(v_component->>'unitCost', v_component->>'unit_cost'), '')::numeric, 0),
        coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0)
      ),
      public.profitability_normalize_percent(
        coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0),
        0
      ) * 100,
      coalesce(v_component->>'notes', ''),
      coalesce(nullif(v_component->>'sort_order', '')::integer, 0),
      jsonb_build_object('client_payload', v_component)
    );
  end loop;

  select coalesce(max(version_number), 0) + 1
  into v_version_number
  from public.technical_sheet_versions
  where technical_sheet_id = v_sheet_id;

  insert into public.technical_sheet_versions (
    business_id, technical_sheet_id, version_number, status, yield_data, components, costing, metadata, created_by
  )
  values (
    p_business_id, v_sheet_id, v_version_number, case when p_activate then 'active' else 'draft' end,
    v_yield_data, v_components, v_costing, jsonb_build_object('source', 'create_or_update_technical_sheet'), auth.uid()
  )
  returning id into v_version_id;

  if p_activate then
    perform public.activate_technical_sheet_version(p_business_id, v_sheet_id, v_version_id);
  end if;

  insert into public.audit_logs (business_id, user_id, module, action, entity_type, entity_id, new_value, reason)
  values (
    p_business_id, auth.uid(), 'profitability',
    case when p_technical_sheet_id is null then 'technical_sheet.create' else 'technical_sheet.update' end,
    'technical_sheets', v_sheet_id::text,
    jsonb_build_object('technical_sheet_id', v_sheet_id, 'version_id', v_version_id, 'costing', v_costing),
    nullif(p_sheet->>'reason', '')
  );

  return jsonb_build_object(
    'technical_sheet_id', v_sheet_id,
    'technical_sheet_version_id', v_version_id,
    'version_id', v_version_id,
    'status', case when p_activate then 'active' else 'draft' end,
    'costing', v_costing
  );
end;
$$;

create or replace function public.activate_technical_sheet_version(
  p_business_id uuid,
  p_technical_sheet_id uuid,
  p_version_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version public.technical_sheet_versions%rowtype;
  v_product_id uuid;
  v_cost_per_portion numeric(14, 4);
begin
  perform public.assert_profitability_role(
    p_business_id,
    array['owner', 'admin', 'manager'],
    'technical sheet activation'
  );

  perform 1
  from public.technical_sheets
  where id = p_technical_sheet_id and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Technical sheet not found' using errcode = 'P0002';
  end if;

  select * into v_version
  from public.technical_sheet_versions
  where id = p_version_id and business_id = p_business_id and technical_sheet_id = p_technical_sheet_id
  for update;

  if not found then
    raise exception 'Technical sheet version not found' using errcode = 'P0002';
  end if;

  update public.technical_sheet_versions
  set status = 'inactive'
  where business_id = p_business_id
    and technical_sheet_id = p_technical_sheet_id
    and id <> p_version_id
    and status = 'active';

  update public.technical_sheet_versions
  set status = 'active', activated_at = now()
  where id = p_version_id;

  update public.technical_sheets
  set active_version_id = p_version_id,
      status = 'active',
      costing = v_version.costing,
      yield_data = v_version.yield_data,
      deactivated_at = null
  where id = p_technical_sheet_id
  returning product_id into v_product_id;

  v_cost_per_portion := coalesce(nullif(v_version.costing->>'costPerPortion', '')::numeric, 0);

  if v_product_id is not null then
    update public.products
    set
      cost = v_cost_per_portion,
      product_type = case when product_type = 'standard' then 'prepared' else product_type end,
      inventory = coalesce(inventory, '{}'::jsonb) || jsonb_build_object(
        'technical_sheet_id', p_technical_sheet_id,
        'technical_sheet_version_id', p_version_id,
        'inventoryImpact', 'technical_sheet'
      ),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'profitability', jsonb_build_object(
          'technical_sheet_id', p_technical_sheet_id,
          'technical_sheet_version_id', p_version_id,
          'costing', v_version.costing
        )
      )
    where id = v_product_id and business_id = p_business_id;

    insert into public.product_cost_snapshots (
      business_id, product_id, technical_sheet_id, technical_sheet_version_id, source_type,
      unit_cost, total_cost, sale_price, food_cost_percent, gross_margin, gross_margin_percent, ingredients_snapshot
    )
    values (
      p_business_id, v_product_id, p_technical_sheet_id, p_version_id, 'technical_sheet_activation',
      v_cost_per_portion,
      coalesce(nullif(v_version.costing->>'totalCost', '')::numeric, 0),
      coalesce(nullif(v_version.costing->>'currentSalePrice', '')::numeric, 0),
      coalesce(nullif(v_version.costing->>'foodCostPercent', '')::numeric, 0),
      coalesce(nullif(v_version.costing->>'grossMargin', '')::numeric, 0),
      coalesce(nullif(v_version.costing->>'grossMarginPercent', '')::numeric, 0),
      v_version.components
    );
  end if;

  return jsonb_build_object('technical_sheet_id', p_technical_sheet_id, 'version_id', p_version_id, 'status', 'active');
end;
$$;

create or replace function public.recalculate_product_cost(
  p_business_id uuid,
  p_product_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sheet public.technical_sheets%rowtype;
  v_version public.technical_sheet_versions%rowtype;
begin
  perform public.assert_profitability_role(
    p_business_id,
    array['owner', 'admin', 'manager'],
    'product cost recalculation'
  );

  select * into v_sheet
  from public.technical_sheets
  where business_id = p_business_id
    and product_id = p_product_id
    and status = 'active'
  order by updated_at desc
  limit 1;

  if not found or v_sheet.active_version_id is null then
    raise exception 'Active technical sheet not found for product' using errcode = 'P0002';
  end if;

  select * into v_version
  from public.technical_sheet_versions
  where id = v_sheet.active_version_id and business_id = p_business_id;

  if not found then
    raise exception 'Active technical sheet version not found' using errcode = 'P0002';
  end if;

  perform public.activate_technical_sheet_version(p_business_id, v_sheet.id, v_version.id);

  return jsonb_build_object(
    'product_id', p_product_id,
    'technical_sheet_id', v_sheet.id,
    'technical_sheet_version_id', v_version.id,
    'costing', v_version.costing
  );
end;
$$;

create or replace function public.close_sale_with_inventory_explosion(
  p_business_id uuid,
  p_sale jsonb,
  p_items jsonb default '[]'::jsonb,
  p_payments jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_sale_item_id uuid;
  v_cash_session_id uuid;
  v_subtotal numeric(12, 2);
  v_total numeric(12, 2);
  v_paid_amount numeric(12, 2);
  v_pending_amount numeric(12, 2);
  v_item jsonb;
  v_payment jsonb;
  v_payment_id uuid;
  v_product_id uuid;
  v_sheet public.technical_sheets%rowtype;
  v_version public.technical_sheet_versions%rowtype;
  v_component jsonb;
  v_supply public.supplies%rowtype;
  v_quantity numeric(14, 4);
  v_sale_quantity numeric(14, 4);
  v_portions numeric(14, 4);
  v_required_quantity numeric(14, 4);
  v_stock_went_negative boolean;
  v_allow_negative_stock boolean;
  v_profitability_snapshot jsonb;
  v_sale_price numeric(14, 4);
  v_unit_cost numeric(14, 4);
  v_total_cost numeric(14, 4);
  v_source_sheet public.technical_sheets%rowtype;
  v_source_version public.technical_sheet_versions%rowtype;
  v_nested_component jsonb;
  v_parent_required_quantity numeric(14, 4);
  v_source_portions numeric(14, 4);
begin
  perform public.assert_profitability_role(
    p_business_id,
    array['owner', 'admin', 'manager', 'cashier', 'waiter'],
    'sale close with inventory explosion'
  );

  v_allow_negative_stock := coalesce(
    (select (settings->'inventory'->>'allow_negative_stock')::boolean
     from public.business_settings
     where business_id = p_business_id),
    false
  );

  v_cash_session_id := nullif(p_sale->>'cash_session_id', '')::uuid;
  v_subtotal := coalesce(nullif(p_sale->>'subtotal', '')::numeric, 0);
  v_total := coalesce(nullif(p_sale->>'total', '')::numeric, v_subtotal, 0);

  if v_total < 0 then
    raise exception 'Sale total cannot be negative' using errcode = '22003';
  end if;

  if v_cash_session_id is not null and not exists (
    select 1 from public.cash_sessions
    where id = v_cash_session_id and business_id = p_business_id and status = 'open'
  ) then
    raise exception 'Open cash session not found for sale' using errcode = 'P0002';
  end if;

  select coalesce(sum(coalesce(nullif(payment_item.value->>'amount', '')::numeric, 0)), 0)
  into v_paid_amount
  from jsonb_array_elements(p_payments) as payment_item(value);

  v_pending_amount := greatest(v_total - v_paid_amount, 0);

  insert into public.sales (
    business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type,
    status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount,
    closed_at, metadata
  )
  values (
    p_business_id,
    nullif(p_sale->>'customer_id', '')::uuid,
    v_cash_session_id,
    nullif(p_sale->>'legacy_firebase_id', ''),
    nullif(p_sale->>'sale_number', ''),
    coalesce(nullif(p_sale->>'source_type', ''), 'quick_sale'),
    case when v_pending_amount > 0 then 'partially_paid' else 'paid' end,
    case when v_pending_amount > 0 then 'partial' else 'paid' end,
    v_subtotal,
    coalesce(nullif(p_sale->>'tax_total', '')::numeric, 0),
    coalesce(nullif(p_sale->>'discount_total', '')::numeric, 0),
    v_total,
    v_paid_amount,
    v_pending_amount,
    now(),
    jsonb_build_object('client_payload', p_sale, 'inventory_explosion', true)
  )
  returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_sale_quantity := coalesce(nullif(v_item->>'quantity', '')::numeric, 1);
    v_sale_price := coalesce(nullif(v_item->>'unit_price', '')::numeric, nullif(v_item->>'price', '')::numeric, 0);

    v_sheet := null;
    v_version := null;
    v_profitability_snapshot := null;

    if v_product_id is not null then
      select * into v_sheet
      from public.technical_sheets
      where business_id = p_business_id
        and product_id = v_product_id
        and status = 'active'
        and active_version_id is not null
      order by updated_at desc
      limit 1;

      if v_sheet.id is not null then
        select * into v_version
        from public.technical_sheet_versions
        where id = v_sheet.active_version_id and business_id = p_business_id;
      end if;
    end if;

    if v_version.id is not null then
      v_unit_cost := coalesce(nullif(v_version.costing->>'costPerPortion', '')::numeric, 0);
      v_total_cost := v_unit_cost * v_sale_quantity;
      v_profitability_snapshot := jsonb_build_object(
        'technical_sheet_id', v_sheet.id,
        'technical_sheet_version_id', v_version.id,
        'unit_cost_snapshot', v_unit_cost,
        'total_cost_snapshot', v_total_cost,
        'sale_price_snapshot', v_sale_price,
        'food_cost_percent_snapshot', case when v_sale_price > 0 then (v_unit_cost / v_sale_price) * 100 else 0 end,
        'gross_margin_snapshot', v_sale_price - v_unit_cost,
        'gross_margin_percent_snapshot', case when v_sale_price > 0 then ((v_sale_price - v_unit_cost) / v_sale_price) * 100 else 0 end,
        'ingredients_snapshot', v_version.components
      );
    end if;

    insert into public.sale_items (
      business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, metadata
    )
    values (
      p_business_id,
      v_sale_id,
      v_product_id,
      coalesce(nullif(v_item->>'product_name', ''), nullif(v_item->>'name', ''), 'Producto'),
      v_sale_quantity,
      v_sale_price,
      coalesce(nullif(v_item->>'subtotal', '')::numeric, v_sale_price * v_sale_quantity),
      jsonb_build_object('client_payload', v_item) ||
        case when v_profitability_snapshot is null then '{}'::jsonb else jsonb_build_object('profitability_snapshot', v_profitability_snapshot) end
    )
    returning id into v_sale_item_id;

    if v_version.id is not null then
      v_portions := coalesce(nullif(v_version.yield_data->>'portions', '')::numeric, 1);
      if v_portions <= 0 then v_portions := 1; end if;

      for v_component in select value from jsonb_array_elements(v_version.components)
      loop
        if coalesce(coalesce(v_component->>'sourceType', v_component->>'source_type'), 'raw_item') = 'raw_item' then
          select * into v_supply
          from public.supplies
          where id = nullif(coalesce(v_component->>'sourceId', v_component->>'source_id'), '')::uuid
            and business_id = p_business_id
          for update;

          if not found then
            raise exception 'Supply not found for technical sheet component' using errcode = 'P0002';
          end if;

          v_quantity := coalesce(nullif(v_component->>'quantity', '')::numeric, 0);
          v_required_quantity :=
            (v_quantity / v_portions)
            * v_sale_quantity
            * case
                when public.profitability_normalize_percent(
                  coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0),
                  0
                ) > 0
                  then 1 / greatest(1 - public.profitability_normalize_percent(
                    coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0),
                    0
                  ), 0.01)
                else 1
              end;

          v_stock_went_negative := (v_supply.current_stock - v_required_quantity) < 0;

          if v_stock_went_negative and not v_allow_negative_stock then
            raise exception 'Insufficient stock for supply %', v_supply.name using errcode = 'P0001';
          end if;

          update public.supplies
          set current_stock = current_stock - v_required_quantity,
              last_purchase_cost = coalesce(last_purchase_cost, v_supply.last_purchase_cost)
          where id = v_supply.id;

          insert into public.inventory_movements (
            business_id, product_id, source_type, source_id, movement_type, direction,
            quantity, unit_cost, status, metadata
          )
          values (
            p_business_id, v_product_id, 'sale', v_sale_id, 'sale_out', 'out',
            v_required_quantity, coalesce(v_supply.average_cost, 0), 'valid',
            jsonb_build_object(
              'sale_item_id', v_sale_item_id,
              'technical_sheet_id', v_sheet.id,
              'technical_sheet_version_id', v_version.id,
              'supply_id', v_supply.id,
              'supply_name', v_supply.name,
              'stock_before', v_supply.current_stock,
              'stock_after', v_supply.current_stock - v_required_quantity,
              'stock_went_negative', v_stock_went_negative
            )
          );
        elsif coalesce(coalesce(v_component->>'sourceType', v_component->>'source_type'), 'raw_item') = 'technical_sheet' then
          select * into v_source_sheet
          from public.technical_sheets
          where id = nullif(coalesce(v_component->>'sourceId', v_component->>'source_id'), '')::uuid
            and business_id = p_business_id
            and status = 'active'
            and active_version_id is not null;

          if not found then
            raise exception 'Active source technical sheet not found for component' using errcode = 'P0002';
          end if;

          select * into v_source_version
          from public.technical_sheet_versions
          where id = v_source_sheet.active_version_id
            and business_id = p_business_id;

          if not found then
            raise exception 'Active source technical sheet version not found for component' using errcode = 'P0002';
          end if;

          v_quantity := coalesce(nullif(v_component->>'quantity', '')::numeric, 0);
          v_parent_required_quantity :=
            (v_quantity / v_portions)
            * v_sale_quantity
            * case
                when public.profitability_normalize_percent(
                  coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0),
                  0
                ) > 0
                  then 1 / greatest(1 - public.profitability_normalize_percent(
                    coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0),
                    0
                  ), 0.01)
                else 1
              end;

          v_source_portions := coalesce(nullif(v_source_version.yield_data->>'portions', '')::numeric, 1);
          if v_source_portions <= 0 then v_source_portions := 1; end if;

          for v_nested_component in select value from jsonb_array_elements(v_source_version.components)
          loop
            if coalesce(coalesce(v_nested_component->>'sourceType', v_nested_component->>'source_type'), 'raw_item') <> 'raw_item' then
              raise exception 'Nested technical sheets deeper than one level are not supported in Phase 2' using errcode = 'P0001';
            end if;

            select * into v_supply
            from public.supplies
            where id = nullif(coalesce(v_nested_component->>'sourceId', v_nested_component->>'source_id'), '')::uuid
              and business_id = p_business_id
            for update;

            if not found then
              raise exception 'Supply not found for nested technical sheet component' using errcode = 'P0002';
            end if;

            v_required_quantity :=
              (
                coalesce(nullif(v_nested_component->>'quantity', '')::numeric, 0)
                / v_source_portions
              )
              * v_parent_required_quantity
              * case
                  when public.profitability_normalize_percent(
                    coalesce(nullif(coalesce(v_nested_component->>'wastePercent', v_nested_component->>'waste_percent'), '')::numeric, 0),
                    0
                  ) > 0
                    then 1 / greatest(1 - public.profitability_normalize_percent(
                      coalesce(nullif(coalesce(v_nested_component->>'wastePercent', v_nested_component->>'waste_percent'), '')::numeric, 0),
                      0
                    ), 0.01)
                  else 1
                end;

            v_stock_went_negative := (v_supply.current_stock - v_required_quantity) < 0;

            if v_stock_went_negative and not v_allow_negative_stock then
              raise exception 'Insufficient stock for supply %', v_supply.name using errcode = 'P0001';
            end if;

            update public.supplies
            set current_stock = current_stock - v_required_quantity
            where id = v_supply.id;

            insert into public.inventory_movements (
              business_id, product_id, source_type, source_id, movement_type, direction,
              quantity, unit_cost, status, metadata
            )
            values (
              p_business_id, v_product_id, 'sale', v_sale_id, 'sale_out', 'out',
              v_required_quantity, coalesce(v_supply.average_cost, 0), 'valid',
              jsonb_build_object(
                'sale_item_id', v_sale_item_id,
                'technical_sheet_id', v_sheet.id,
                'technical_sheet_version_id', v_version.id,
                'source_technical_sheet_id', v_source_sheet.id,
                'source_technical_sheet_version_id', v_source_version.id,
                'supply_id', v_supply.id,
                'supply_name', v_supply.name,
                'stock_before', v_supply.current_stock,
                'stock_after', v_supply.current_stock - v_required_quantity,
                'stock_went_negative', v_stock_went_negative
              )
            );
          end loop;
        end if;
      end loop;

      insert into public.product_cost_snapshots (
        business_id, product_id, technical_sheet_id, technical_sheet_version_id, sale_id, sale_item_id,
        source_type, unit_cost, total_cost, sale_price, food_cost_percent, gross_margin,
        gross_margin_percent, ingredients_snapshot
      )
      values (
        p_business_id, v_product_id, v_sheet.id, v_version.id, v_sale_id, v_sale_item_id,
        'sale_close',
        v_unit_cost,
        v_total_cost,
        v_sale_price,
        coalesce(nullif(v_profitability_snapshot->>'food_cost_percent_snapshot', '')::numeric, 0),
        coalesce(nullif(v_profitability_snapshot->>'gross_margin_snapshot', '')::numeric, 0),
        coalesce(nullif(v_profitability_snapshot->>'gross_margin_percent_snapshot', '')::numeric, 0),
        v_version.components
      );
    end if;
  end loop;

  for v_payment in select value from jsonb_array_elements(p_payments)
  loop
    insert into public.payments (
      business_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata
    )
    values (
      p_business_id, v_sale_id, v_cash_session_id,
      coalesce(nullif(v_payment->>'method', ''), 'cash'),
      coalesce(nullif(v_payment->>'amount', '')::numeric, 0),
      'completed',
      nullif(v_payment->>'reference', ''),
      now(),
      jsonb_build_object('client_payload', v_payment)
    )
    returning id into v_payment_id;

    if v_cash_session_id is not null then
      insert into public.cash_movements (
        business_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description
      )
      values (
        p_business_id, v_cash_session_id, v_sale_id, v_payment_id, 'sale_income',
        coalesce(nullif(v_payment->>'method', ''), 'cash'),
        coalesce(nullif(v_payment->>'amount', '')::numeric, 0),
        'valid',
        'Ingreso por venta'
      );
    end if;
  end loop;

  insert into public.audit_logs (business_id, user_id, module, action, entity_type, entity_id, new_value, reason)
  values (
    p_business_id, auth.uid(), 'sales', 'sale.close_with_inventory_explosion', 'sales', v_sale_id::text,
    jsonb_build_object('total', v_total, 'paid_amount', v_paid_amount, 'pending_amount', v_pending_amount),
    nullif(p_sale->>'reason', '')
  );

  return v_sale_id;
end;
$$;

create or replace function public.reverse_inventory_explosion(
  p_business_id uuid,
  p_sale_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_movement public.inventory_movements%rowtype;
  v_supply_id uuid;
  v_reversed integer := 0;
begin
  perform public.assert_profitability_role(
    p_business_id,
    array['owner', 'admin', 'manager'],
    'inventory explosion reversal'
  );

  for v_movement in
    select *
    from public.inventory_movements
    where business_id = p_business_id
      and source_type = 'sale'
      and source_id = p_sale_id
      and movement_type = 'sale_out'
      and status = 'valid'
    for update
  loop
    v_supply_id := nullif(v_movement.metadata->>'supply_id', '')::uuid;

    if v_supply_id is not null then
      update public.supplies
      set current_stock = current_stock + v_movement.quantity
      where id = v_supply_id and business_id = p_business_id;
    end if;

    update public.inventory_movements
    set status = 'reversed',
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('reversed_at', now(), 'reverse_reason', p_reason)
    where id = v_movement.id;

    insert into public.inventory_movements (
      business_id, product_id, source_type, source_id, movement_type, direction,
      quantity, unit_cost, status, metadata
    )
    values (
      p_business_id, v_movement.product_id, 'sale_reversal', p_sale_id, 'reversal', 'in',
      v_movement.quantity, v_movement.unit_cost, 'valid',
      jsonb_build_object('reversed_movement_id', v_movement.id, 'supply_id', v_supply_id, 'reason', p_reason)
    );

    v_reversed := v_reversed + 1;
  end loop;

  insert into public.audit_logs (business_id, user_id, module, action, entity_type, entity_id, new_value, reason)
  values (
    p_business_id, auth.uid(), 'profitability', 'inventory_explosion.reverse', 'sales', p_sale_id::text,
    jsonb_build_object('reversed_movements', v_reversed),
    p_reason
  );

  return jsonb_build_object('sale_id', p_sale_id, 'reversed_movements', v_reversed);
end;
$$;

-- <<< database/supabase/rpc-profitability.sql

-- >>> database/supabase/patch-close-cash-session-cash-only.sql
-- Patch: cierre de caja con efectivo fisico por sesion.
-- Ejecutar en Supabase SQL Editor despues de rpc-core.sql.

create or replace function public.close_cash_session(
  p_business_id uuid,
  p_cash_session_id uuid,
  p_counted_amount numeric,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.cash_sessions%rowtype;
  v_expected_amount numeric(12, 2);
  v_difference_amount numeric(12, 2);
  v_payment_method_totals jsonb;
begin
  perform public.assert_business_member(p_business_id);

  if p_counted_amount is null or p_counted_amount < 0 then
    raise exception 'Counted amount must be zero or positive' using errcode = '22003';
  end if;

  select *
  into v_session
  from public.cash_sessions
  where id = p_cash_session_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Cash session not found' using errcode = 'P0002';
  end if;

  if v_session.status <> 'open' then
    raise exception 'Cash session is not open' using errcode = 'P0001';
  end if;

  select coalesce(sum(
    case
      when type = 'opening' then amount
      when type in ('sale_income', 'debt_payment', 'debt_payment_income', 'manual_income')
        and coalesce(method, 'cash') = 'cash' then amount
      when type in ('purchase_expense', 'operating_expense', 'operational_expense', 'supplier_payment')
        and coalesce(method, 'cash') = 'cash' then -amount
      when type = 'adjustment'
        and coalesce(method, 'cash') = 'cash' then amount
      else 0
    end
  ), 0)
  into v_expected_amount
  from public.cash_movements
  where business_id = p_business_id
    and cash_session_id = p_cash_session_id
    and status = 'valid';

  select coalesce(jsonb_object_agg(method_key, total_amount), '{}'::jsonb)
  into v_payment_method_totals
  from (
    select
      coalesce(method, 'cash') as method_key,
      sum(amount)::numeric(12, 2) as total_amount
    from public.cash_movements
    where business_id = p_business_id
      and cash_session_id = p_cash_session_id
      and status = 'valid'
      and type in ('sale_income', 'debt_payment', 'debt_payment_income', 'manual_income')
    group by coalesce(method, 'cash')
  ) method_totals;

  v_difference_amount := p_counted_amount - v_expected_amount;

  update public.cash_sessions
  set
    status = 'closed',
    closed_by = auth.uid(),
    counted_amount = p_counted_amount,
    expected_amount = v_expected_amount,
    difference_amount = v_difference_amount,
    closed_at = now()
  where id = p_cash_session_id;

  insert into public.cash_movements (
    business_id,
    cash_session_id,
    type,
    method,
    amount,
    status,
    description,
    metadata
  )
  values (
    p_business_id,
    p_cash_session_id,
    'closing',
    'cash',
    p_counted_amount,
    'valid',
    'Cierre de caja',
    jsonb_build_object(
      'expected_amount', v_expected_amount,
      'difference_amount', v_difference_amount,
      'notes', p_notes,
      'payment_method_totals', v_payment_method_totals
    )
  );

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    reason
  )
  values (
    p_business_id,
    auth.uid(),
    'cash',
    'cash.close',
    'cash_sessions',
    p_cash_session_id::text,
    to_jsonb(v_session),
    jsonb_build_object(
      'status', 'closed',
      'counted_amount', p_counted_amount,
      'expected_amount', v_expected_amount,
      'difference_amount', v_difference_amount,
      'payment_method_totals', v_payment_method_totals
    ),
    p_notes
  );

  return jsonb_build_object(
    'cash_session_id', p_cash_session_id,
    'counted_amount', p_counted_amount,
    'expected_amount', v_expected_amount,
    'difference_amount', v_difference_amount,
    'payment_method_totals', v_payment_method_totals
  );
end;
$$;

-- <<< database/supabase/patch-close-cash-session-cash-only.sql

-- >>> database/supabase/patch-settle-sale-debt.sql
-- Apply after database/supabase/rpc-core.sql. Adds secure receivable settlement for migrated Supabase operation.

create or replace function public.settle_sale_debt(
  p_business_id uuid,
  p_sale_id uuid,
  p_amount numeric default null,
  p_method text default 'cash',
  p_reference text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales%rowtype;
  v_cash_session_id uuid;
  v_payment_id uuid;
  v_payment_amount numeric(12, 2);
  v_next_paid_amount numeric(12, 2);
  v_next_pending_amount numeric(12, 2);
  v_method text;
begin
  perform public.assert_business_member(p_business_id);

  select *
  into v_sale
  from public.sales
  where id = p_sale_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Sale not found' using errcode = 'P0002';
  end if;

  if v_sale.status in ('cancelled', 'refunded') or v_sale.payment_status in ('cancelled', 'refunded') then
    raise exception 'Sale cannot receive payments' using errcode = 'P0001';
  end if;

  if coalesce(v_sale.pending_amount, 0) <= 0 then
    raise exception 'Sale has no pending amount' using errcode = 'P0001';
  end if;

  v_payment_amount := coalesce(p_amount, v_sale.pending_amount);

  if v_payment_amount <= 0 then
    raise exception 'Payment amount must be positive' using errcode = '22003';
  end if;

  if v_payment_amount > v_sale.pending_amount then
    raise exception 'Payment amount exceeds pending amount' using errcode = '22003';
  end if;

  select id
  into v_cash_session_id
  from public.cash_sessions
  where business_id = p_business_id
    and status = 'open'
  order by opened_at desc
  limit 1;

  if v_cash_session_id is null then
    raise exception 'Open cash session required for debt payment' using errcode = 'P0001';
  end if;

  v_method := coalesce(nullif(trim(p_method), ''), 'cash');
  v_next_paid_amount := coalesce(v_sale.paid_amount, 0) + v_payment_amount;
  v_next_pending_amount := greatest(coalesce(v_sale.total, 0) - v_next_paid_amount, 0);

  insert into public.payments (
    business_id,
    sale_id,
    cash_session_id,
    method,
    amount,
    status,
    reference,
    paid_at,
    metadata
  )
  values (
    p_business_id,
    p_sale_id,
    v_cash_session_id,
    v_method,
    v_payment_amount,
    'completed',
    nullif(trim(coalesce(p_reference, '')), ''),
    now(),
    jsonb_build_object(
      'source', 'settle_sale_debt',
      'notes', p_notes
    )
  )
  returning id into v_payment_id;

  insert into public.cash_movements (
    business_id,
    cash_session_id,
    sale_id,
    payment_id,
    type,
    method,
    amount,
    status,
    description,
    metadata
  )
  values (
    p_business_id,
    v_cash_session_id,
    p_sale_id,
    v_payment_id,
    'debt_payment',
    v_method,
    v_payment_amount,
    'valid',
    'Abono de cartera',
    jsonb_build_object(
      'previous_pending_amount', v_sale.pending_amount,
      'next_pending_amount', v_next_pending_amount,
      'notes', p_notes
    )
  );

  update public.sales
  set
    paid_amount = v_next_paid_amount,
    pending_amount = v_next_pending_amount,
    status = case when v_next_pending_amount > 0 then 'partially_paid' else 'paid' end,
    payment_status = case when v_next_pending_amount > 0 then 'partial' else 'paid' end
  where id = p_sale_id;

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    reason
  )
  values (
    p_business_id,
    auth.uid(),
    'finance',
    'receivable.settle',
    'sales',
    p_sale_id::text,
    jsonb_build_object(
      'paid_amount', v_sale.paid_amount,
      'pending_amount', v_sale.pending_amount,
      'payment_status', v_sale.payment_status
    ),
    jsonb_build_object(
      'payment_id', v_payment_id,
      'cash_session_id', v_cash_session_id,
      'amount', v_payment_amount,
      'method', v_method,
      'paid_amount', v_next_paid_amount,
      'pending_amount', v_next_pending_amount
    ),
    p_notes
  );

  return jsonb_build_object(
    'sale_id', p_sale_id,
    'payment_id', v_payment_id,
    'cash_session_id', v_cash_session_id,
    'amount', v_payment_amount,
    'method', v_method,
    'paid_amount', v_next_paid_amount,
    'pending_amount', v_next_pending_amount,
    'payment_status', case when v_next_pending_amount > 0 then 'partial' else 'paid' end
  );
end;
$$;


-- <<< database/supabase/patch-settle-sale-debt.sql

-- >>> database/supabase/patch-inventory-supplies-and-table-rpc.sql
-- Apply after core, finance and operational Supabase migration. Adds supplies and fixes Salon table creation.

-- Inventory master data for supplies/ingredients.
-- Apply after schema.sql and rls.sql.

create table if not exists public.supply_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supply_categories_status_check check (status in ('active', 'inactive')),
  constraint supply_categories_name_unique unique (business_id, name)
);

create table if not exists public.supplies (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid references public.supply_categories(id) on delete set null,
  name text not null,
  category text not null default '',
  unit text not null default 'und',
  status text not null default 'active',
  current_stock numeric(14, 4) not null default 0,
  minimum_stock numeric(14, 4) not null default 0,
  average_cost numeric(12, 2) not null default 0,
  last_purchase_cost numeric(12, 2) not null default 0,
  supplier_id uuid references public.suppliers(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supplies_status_check check (status in ('active', 'inactive', 'archived')),
  constraint supplies_stock_non_negative check (current_stock >= 0 and minimum_stock >= 0 and average_cost >= 0 and last_purchase_cost >= 0),
  constraint supplies_name_unique unique (business_id, name)
);

create index if not exists supplies_business_name_idx on public.supplies(business_id, name);
create index if not exists supplies_business_status_idx on public.supplies(business_id, status);
create index if not exists supply_categories_business_sort_idx on public.supply_categories(business_id, sort_order, name);

drop trigger if exists supply_categories_set_updated_at on public.supply_categories;
create trigger supply_categories_set_updated_at before update on public.supply_categories for each row execute function public.set_updated_at();

drop trigger if exists supplies_set_updated_at on public.supplies;
create trigger supplies_set_updated_at before update on public.supplies for each row execute function public.set_updated_at();

alter table public.supply_categories enable row level security;
alter table public.supplies enable row level security;

drop policy if exists "supply categories members read" on public.supply_categories;
create policy "supply categories members read" on public.supply_categories for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "supply categories members write" on public.supply_categories;
create policy "supply categories members write" on public.supply_categories for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "supplies members read" on public.supplies;
create policy "supplies members read" on public.supplies for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "supplies members write" on public.supplies;
create policy "supplies members write" on public.supplies for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));


-- Align existing table constraints with the current Salon UI contract.
alter table public.tables drop constraint if exists tables_status_check;
alter table public.tables add constraint tables_status_check check (status in ('free', 'reserved', 'disabled', 'waiting_order', 'occupied', 'order_sent', 'preparing', 'ready', 'waiting_payment', 'cleaning'));

alter table public.tables drop constraint if exists tables_shape_check;
alter table public.tables add constraint tables_shape_check check (shape in ('square', 'round', 'rectangle', 'bar', 'booth'));

-- Operational Salon RPCs. Apply after schema-operational.sql.

create or replace function public.save_table_layout(
  p_business_id uuid,
  p_table_id uuid default null,
  p_table jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table_id uuid;
  v_number integer;
  v_capacity integer;
  v_name text;
  v_zone text;
  v_status text;
  v_icon text;
  v_code text;
  v_shape text;
  v_size text;
  v_position jsonb;
  v_is_active boolean;
begin
  perform public.assert_business_member(p_business_id);

  v_number := nullif(p_table->>'number', '')::integer;
  v_capacity := coalesce(nullif(p_table->>'capacity', '')::integer, 2);
  v_name := coalesce(nullif(trim(p_table->>'name'), ''), concat('Mesa ', v_number));
  v_zone := coalesce(nullif(trim(p_table->>'zone'), ''), 'Salon principal');
  v_status := coalesce(nullif(trim(p_table->>'status'), ''), 'free');
  v_icon := coalesce(nullif(trim(p_table->>'icon'), ''), 'UtensilsCrossed');
  v_code := coalesce(p_table->>'code', '');
  v_shape := coalesce(nullif(trim(p_table->>'shape'), ''), 'square');
  v_size := coalesce(nullif(trim(p_table->>'size'), ''), 'md');
  v_position := coalesce(p_table->'position', jsonb_build_object('x', 0, 'y', 0));
  v_is_active := coalesce((p_table->>'is_active')::boolean, (p_table->>'isActive')::boolean, true);

  if v_number is null or v_number <= 0 then
    raise exception 'Table number must be positive' using errcode = '22003';
  end if;

  if v_capacity <= 0 then
    raise exception 'Table capacity must be positive' using errcode = '22003';
  end if;

  if p_table_id is null then
    insert into public.tables (
      business_id,
      number,
      name,
      capacity,
      zone,
      status,
      icon,
      code,
      shape,
      size,
      position,
      is_active,
      metadata
    )
    values (
      p_business_id,
      v_number,
      v_name,
      v_capacity,
      v_zone,
      v_status,
      v_icon,
      v_code,
      v_shape,
      v_size,
      v_position,
      v_is_active,
      jsonb_build_object('source', 'save_table_layout')
    )
    returning id into v_table_id;
  else
    update public.tables
    set
      number = v_number,
      name = v_name,
      capacity = v_capacity,
      zone = v_zone,
      status = case
        when status in ('occupied', 'order_sent', 'preparing', 'ready', 'waiting_payment') then status
        else v_status
      end,
      icon = v_icon,
      code = v_code,
      shape = v_shape,
      size = v_size,
      position = v_position,
      is_active = v_is_active
    where id = p_table_id
      and business_id = p_business_id
    returning id into v_table_id;

    if v_table_id is null then
      raise exception 'Table not found' using errcode = 'P0002';
    end if;
  end if;

  insert into public.table_events (
    business_id,
    table_id,
    event_type,
    description,
    created_by,
    new_value
  )
  values (
    p_business_id,
    v_table_id,
    'table_updated',
    case when p_table_id is null then 'Mesa creada.' else 'Mesa actualizada.' end,
    auth.uid(),
    p_table
  );

  return v_table_id;
end;
$$;

create or replace function public.salon_assert_table_available(
  p_business_id uuid,
  p_table_id uuid
)
returns public.tables
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table public.tables%rowtype;
begin
  select *
  into v_table
  from public.tables
  where id = p_table_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Table not found' using errcode = 'P0002';
  end if;

  if v_table.status not in ('free', 'cleaning') or not v_table.is_active then
    raise exception 'Table is not available' using errcode = 'P0001';
  end if;

  return v_table;
end;
$$;

create or replace function public.open_table_session(
  p_business_id uuid,
  p_table_id uuid,
  p_waiter_name text,
  p_guests_count integer default 1,
  p_customer_id uuid default null,
  p_customer_name text default '',
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table public.tables%rowtype;
  v_session_id uuid;
  v_waiter_name text;
begin
  perform public.assert_business_member(p_business_id);
  v_table := public.salon_assert_table_available(p_business_id, p_table_id);
  v_waiter_name := nullif(trim(coalesce(p_waiter_name, '')), '');

  if v_waiter_name is null then
    raise exception 'Waiter name is required' using errcode = '22023';
  end if;

  if coalesce(p_guests_count, 0) <= 0 then
    raise exception 'Guests count must be positive' using errcode = '22003';
  end if;

  insert into public.table_sessions (
    business_id,
    table_id,
    customer_id,
    waiter_id,
    table_name,
    waiter_name,
    customer_name,
    guests_count,
    status,
    notes
  )
  values (
    p_business_id,
    p_table_id,
    p_customer_id,
    auth.uid(),
    v_table.name,
    v_waiter_name,
    coalesce(p_customer_name, ''),
    p_guests_count,
    'waiting_order',
    coalesce(p_notes, '')
  )
  returning id into v_session_id;

  update public.tables
  set status = 'waiting_order',
      current_session_id = v_session_id,
      current_order_id = null,
      current_order_summary = '',
      current_total = 0,
      waiter_name = v_waiter_name,
      guests_count = p_guests_count
  where id = p_table_id;

  insert into public.table_events (
    business_id, table_id, session_id, event_type, description, created_by, created_by_name
  )
  values (
    p_business_id, p_table_id, v_session_id, 'session_opened',
    concat(v_waiter_name, ' abrio ', v_table.name, ' para ', p_guests_count, ' persona(s).'),
    auth.uid(), v_waiter_name
  );

  return v_session_id;
end;
$$;

create or replace function public.send_order_to_kitchen(
  p_business_id uuid,
  p_table_id uuid,
  p_session_id uuid,
  p_order_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_customer_id uuid default null,
  p_customer_name text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table public.tables%rowtype;
  v_session public.table_sessions%rowtype;
  v_order_id uuid;
  v_existing_items jsonb := '[]'::jsonb;
  v_all_items jsonb := '[]'::jsonb;
  v_items_count integer := 0;
  v_subtotal numeric(12, 2) := 0;
  v_summary text := '';
  v_item jsonb;
begin
  perform public.assert_business_member(p_business_id);

  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Order must include at least one item' using errcode = '22023';
  end if;

  select * into v_table from public.tables where id = p_table_id and business_id = p_business_id for update;
  if not found then raise exception 'Table not found' using errcode = 'P0002'; end if;

  select * into v_session from public.table_sessions where id = p_session_id and business_id = p_business_id for update;
  if not found then raise exception 'Table session not found' using errcode = 'P0002'; end if;

  if p_order_id is not null then
    select items into v_existing_items
    from public.table_orders
    where id = p_order_id and business_id = p_business_id
    for update;
  end if;

  v_all_items := coalesce(v_existing_items, '[]'::jsonb) || p_items;

  for v_item in select value from jsonb_array_elements(v_all_items)
  loop
    if coalesce(v_item->>'status', '') <> 'canceled' then
      v_items_count := v_items_count + coalesce(nullif(v_item->>'quantity', '')::integer, 0);
      v_subtotal := v_subtotal + (
        coalesce(nullif(v_item->>'quantity', '')::numeric, 0) *
        coalesce(nullif(coalesce(v_item->>'unitPrice', v_item->>'price'), '')::numeric, 0)
      );
    end if;
  end loop;

  select string_agg(concat(coalesce(nullif(item->>'quantity', ''), '0'), 'x ', coalesce(item->>'productName', item->>'name', 'Item')), ', ')
  into v_summary
  from (
    select value as item
    from jsonb_array_elements(v_all_items)
    limit 3
  ) items;

  if p_order_id is null then
    insert into public.table_orders (
      business_id, table_id, session_id, customer_id, table_name, customer_name, waiter_id,
      status, kitchen_status, items, items_count, subtotal, total, sent_at
    )
    values (
      p_business_id, p_table_id, p_session_id, p_customer_id, v_table.name, coalesce(p_customer_name, ''), auth.uid(),
      'sent', 'pending', v_all_items, v_items_count, v_subtotal, v_subtotal, now()
    )
    returning id into v_order_id;
  else
    update public.table_orders
    set items = v_all_items,
        items_count = v_items_count,
        subtotal = v_subtotal,
        total = v_subtotal,
        status = 'sent',
        kitchen_status = 'pending',
        sent_at = coalesce(sent_at, now())
    where id = p_order_id
      and business_id = p_business_id
    returning id into v_order_id;
  end if;

  insert into public.kitchen_tickets (
    business_id, table_id, session_id, order_id, table_name, items, status, sent_at
  )
  values (p_business_id, p_table_id, p_session_id, v_order_id, v_table.name, p_items, 'pending', now());

  update public.table_sessions
  set status = 'order_sent',
      subtotal = v_subtotal,
      total = v_subtotal,
      total_items = v_items_count,
      last_activity_at = now()
  where id = p_session_id;

  update public.tables
  set status = 'order_sent',
      current_session_id = p_session_id,
      current_order_id = v_order_id,
      current_order_summary = coalesce(v_summary, ''),
      current_total = v_subtotal
  where id = p_table_id;

  insert into public.table_events (business_id, table_id, session_id, order_id, event_type, description, created_by)
  values (p_business_id, p_table_id, p_session_id, v_order_id, 'order_sent', 'Pedido enviado a cocina/barra.', auth.uid());

  return v_order_id;
end;
$$;

create or replace function public.update_kitchen_ticket_status(
  p_business_id uuid,
  p_ticket_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.kitchen_tickets%rowtype;
begin
  perform public.assert_business_member(p_business_id);

  if p_status not in ('pending', 'preparing', 'ready', 'delivered', 'cancelled') then
    raise exception 'Invalid kitchen status' using errcode = '22023';
  end if;

  select * into v_ticket
  from public.kitchen_tickets
  where id = p_ticket_id and business_id = p_business_id
  for update;

  if not found then raise exception 'Kitchen ticket not found' using errcode = 'P0002'; end if;

  update public.kitchen_tickets
  set status = p_status,
      started_at = case when p_status = 'preparing' then now() else started_at end,
      ready_at = case when p_status = 'ready' then now() else ready_at end,
      delivered_at = case when p_status = 'delivered' then now() else delivered_at end
  where id = p_ticket_id;

  update public.table_orders
  set kitchen_status = p_status
  where id = v_ticket.order_id;

  if p_status <> 'delivered' then
    update public.tables set status = p_status where id = v_ticket.table_id;
    update public.table_sessions set status = p_status, last_activity_at = now() where id = v_ticket.session_id;
  end if;

  insert into public.table_events (business_id, table_id, session_id, order_id, event_type, description, created_by, previous_value, new_value)
  values (p_business_id, v_ticket.table_id, v_ticket.session_id, v_ticket.order_id, 'kitchen_status_updated', concat('Cocina/barra cambio a ', p_status, '.'), auth.uid(), to_jsonb(v_ticket.status), to_jsonb(p_status));
end;
$$;

create or replace function public.request_table_bill(
  p_business_id uuid,
  p_table_id uuid,
  p_session_id uuid,
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_business_member(p_business_id);

  update public.tables
  set status = 'waiting_payment',
      current_session_id = p_session_id,
      current_order_id = p_order_id
  where id = p_table_id and business_id = p_business_id;

  update public.table_sessions
  set status = 'waiting_payment',
      payment_requested_at = now(),
      last_activity_at = now()
  where id = p_session_id and business_id = p_business_id;

  update public.table_orders
  set status = 'cuenta_solicitada'
  where id = p_order_id and business_id = p_business_id;

  insert into public.table_events (business_id, table_id, session_id, order_id, event_type, description, created_by)
  values (p_business_id, p_table_id, p_session_id, p_order_id, 'payment_requested', 'Cuenta solicitada para cierre de mesa.', auth.uid());
end;
$$;

create or replace function public.release_clean_table(
  p_business_id uuid,
  p_table_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_business_member(p_business_id);

  update public.table_sessions
  set status = 'closed',
      closed_at = now(),
      last_activity_at = now()
  where business_id = p_business_id
    and table_id = p_table_id
    and status in ('waiting_order', 'occupied', 'order_sent', 'preparing', 'ready', 'waiting_payment');

  update public.tables
  set status = 'free',
      current_session_id = null,
      current_order_id = null,
      current_order_summary = '',
      current_total = 0,
      waiter_name = '',
      guests_count = 0
  where id = p_table_id and business_id = p_business_id;

  insert into public.table_events (business_id, table_id, event_type, description, created_by)
  values (p_business_id, p_table_id, 'table_released', 'Mesa marcada como limpia y libre.', auth.uid());
end;
$$;

create or replace function public.transfer_table_session(
  p_business_id uuid,
  p_source_table_id uuid,
  p_target_table_id uuid,
  p_session_id uuid,
  p_order_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.tables%rowtype;
  v_source public.tables%rowtype;
begin
  perform public.assert_business_member(p_business_id);
  select * into v_source from public.tables where id = p_source_table_id and business_id = p_business_id for update;
  v_target := public.salon_assert_table_available(p_business_id, p_target_table_id);

  update public.tables
  set status = 'free',
      current_session_id = null,
      current_order_id = null,
      current_order_summary = '',
      current_total = 0,
      waiter_name = '',
      guests_count = 0
  where id = p_source_table_id;

  update public.tables
  set status = coalesce(nullif(v_source.status, 'free'), 'occupied'),
      current_session_id = p_session_id,
      current_order_id = p_order_id,
      current_order_summary = v_source.current_order_summary,
      current_total = v_source.current_total,
      waiter_name = v_source.waiter_name,
      guests_count = v_source.guests_count
  where id = p_target_table_id;

  update public.table_sessions
  set table_id = p_target_table_id,
      table_name = v_target.name,
      last_activity_at = now()
  where id = p_session_id and business_id = p_business_id;

  update public.table_orders
  set table_id = p_target_table_id,
      table_name = v_target.name
  where id = p_order_id and business_id = p_business_id;

  update public.kitchen_tickets
  set table_id = p_target_table_id,
      table_name = v_target.name
  where session_id = p_session_id and business_id = p_business_id;

  insert into public.table_events (business_id, table_id, session_id, order_id, event_type, description, created_by, previous_value, new_value)
  values (p_business_id, p_source_table_id, p_session_id, p_order_id, 'table_transferred', concat('Sesion transferida a ', v_target.name, '.'), auth.uid(), to_jsonb(p_source_table_id), to_jsonb(p_target_table_id));
end;
$$;

create or replace function public.cancel_table_order_item(
  p_business_id uuid,
  p_table_id uuid,
  p_session_id uuid,
  p_order_id uuid,
  p_line_id text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.table_orders%rowtype;
  v_item jsonb;
  v_items jsonb := '[]'::jsonb;
  v_items_count integer := 0;
  v_subtotal numeric(12, 2) := 0;
begin
  perform public.assert_business_member(p_business_id);

  if nullif(trim(coalesce(p_line_id, '')), '') is null then
    raise exception 'Line id is required' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'Cancellation reason is required' using errcode = '22023';
  end if;

  select *
  into v_order
  from public.table_orders
  where id = p_order_id and business_id = p_business_id
  for update;

  if not found then raise exception 'Order not found' using errcode = 'P0002'; end if;

  for v_item in select value from jsonb_array_elements(v_order.items)
  loop
    if coalesce(v_item->>'lineId', v_item->>'line_id', '') = p_line_id then
      v_item := v_item || jsonb_build_object(
        'status', 'canceled',
        'cancelReason', p_reason,
        'cancel_reason', p_reason,
        'canceledAt', now()
      );
    end if;

    v_items := v_items || jsonb_build_array(v_item);

    if coalesce(v_item->>'status', '') <> 'canceled' then
      v_items_count := v_items_count + coalesce(nullif(v_item->>'quantity', '')::integer, 0);
      v_subtotal := v_subtotal + (
        coalesce(nullif(v_item->>'quantity', '')::numeric, 0) *
        coalesce(nullif(coalesce(v_item->>'unitPrice', v_item->>'price'), '')::numeric, 0)
      );
    end if;
  end loop;

  update public.table_orders
  set items = v_items,
      items_count = v_items_count,
      subtotal = v_subtotal,
      total = v_subtotal
  where id = p_order_id;

  update public.table_sessions
  set subtotal = v_subtotal,
      total = v_subtotal,
      total_items = v_items_count,
      last_activity_at = now()
  where id = p_session_id and business_id = p_business_id;

  update public.tables
  set current_total = v_subtotal
  where id = p_table_id and business_id = p_business_id;

  insert into public.table_events (business_id, table_id, session_id, order_id, event_type, description, created_by, new_value)
  values (p_business_id, p_table_id, p_session_id, p_order_id, 'item_canceled', concat('Item cancelado. Motivo: ', p_reason), auth.uid(), jsonb_build_object('line_id', p_line_id, 'reason', p_reason));
end;
$$;

create or replace function public.reassign_table_waiter(
  p_business_id uuid,
  p_table_id uuid,
  p_session_id uuid,
  p_waiter_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_waiter_name text;
  v_previous_name text;
begin
  perform public.assert_business_member(p_business_id);
  v_waiter_name := nullif(trim(coalesce(p_waiter_name, '')), '');

  if v_waiter_name is null then
    raise exception 'Waiter name is required' using errcode = '22023';
  end if;

  select waiter_name
  into v_previous_name
  from public.table_sessions
  where id = p_session_id and business_id = p_business_id
  for update;

  if not found then raise exception 'Table session not found' using errcode = 'P0002'; end if;

  update public.table_sessions
  set waiter_id = auth.uid(),
      waiter_name = v_waiter_name,
      last_activity_at = now()
  where id = p_session_id and business_id = p_business_id;

  update public.tables
  set waiter_name = v_waiter_name
  where id = p_table_id and business_id = p_business_id;

  insert into public.table_events (business_id, table_id, session_id, event_type, description, created_by, previous_value, new_value)
  values (p_business_id, p_table_id, p_session_id, 'waiter_changed', concat('Mesero reasignado a ', v_waiter_name, '.'), auth.uid(), to_jsonb(v_previous_name), to_jsonb(v_waiter_name));
end;
$$;


-- Finance RPCs for purchases and supplier payables.
-- Apply after schema-finance.sql.

create or replace function public.confirm_purchase(
  p_business_id uuid,
  p_purchase_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases%rowtype;
  v_payable_id uuid;
  v_item public.purchase_items%rowtype;
  v_supply public.supplies%rowtype;
  v_next_stock numeric(14, 4);
  v_next_average_cost numeric(12, 2);
begin
  perform public.assert_business_member(p_business_id);

  select *
  into v_purchase
  from public.purchases
  where id = p_purchase_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Purchase not found' using errcode = 'P0002';
  end if;

  if v_purchase.status = 'anulada' then
    raise exception 'Cancelled purchase cannot be confirmed' using errcode = 'P0001';
  end if;

  if v_purchase.status = 'confirmada' then
    return jsonb_build_object(
      'purchase_id', p_purchase_id,
      'status', v_purchase.status,
      'payment_status', v_purchase.payment_status,
      'pending_amount', v_purchase.pending_amount
    );
  end if;

  update public.purchases
  set
    status = 'confirmada',
    payment_status = case when total > 0 then 'pending' else 'paid' end,
    paid_amount = 0,
    pending_amount = total,
    confirmed_at = now(),
    confirmed_by = auth.uid()
  where id = p_purchase_id
  returning * into v_purchase;

  insert into public.accounts_payable (
    business_id,
    supplier_id,
    purchase_id,
    supplier_name,
    concept,
    original_amount,
    paid_amount,
    pending_amount,
    status,
    metadata
  )
  values (
    p_business_id,
    v_purchase.supplier_id,
    p_purchase_id,
    v_purchase.supplier_name,
    coalesce(nullif(v_purchase.purchase_number, ''), 'Compra a proveedor'),
    v_purchase.total,
    0,
    v_purchase.total,
    case when v_purchase.total > 0 then 'pending' else 'paid' end,
    jsonb_build_object('source', 'confirm_purchase')
  )
  on conflict (purchase_id) where purchase_id is not null
  do update set
    original_amount = excluded.original_amount,
    pending_amount = greatest(excluded.original_amount - public.accounts_payable.paid_amount, 0),
    status = case
      when greatest(excluded.original_amount - public.accounts_payable.paid_amount, 0) <= 0 then 'paid'
      when public.accounts_payable.paid_amount > 0 then 'partial'
      else 'pending'
    end
  returning id into v_payable_id;

  for v_item in
    select *
    from public.purchase_items
    where purchase_id = p_purchase_id
      and business_id = p_business_id
  loop
    v_supply := null;

    if nullif(v_item.inventory_item_id, '') is not null then
      select *
      into v_supply
      from public.supplies
      where id::text = v_item.inventory_item_id
        and business_id = p_business_id
      for update;
    end if;

    if v_supply.id is not null then
      v_next_stock := coalesce(v_supply.current_stock, 0) + v_item.quantity;
      v_next_average_cost := case
        when v_next_stock > 0 then
          greatest(
            ((coalesce(v_supply.current_stock, 0) * coalesce(v_supply.average_cost, 0)) + (v_item.quantity * v_item.unit_cost)) / v_next_stock,
            0
          )
        else coalesce(v_supply.average_cost, 0)
      end;

      update public.supplies
      set
        current_stock = v_next_stock,
        average_cost = v_next_average_cost,
        last_purchase_cost = v_item.unit_cost,
        category = coalesce(nullif(v_item.category, ''), category),
        unit = coalesce(nullif(v_item.unit, ''), unit)
      where id = v_supply.id;
    end if;

    insert into public.inventory_movements (
      business_id,
      product_id,
      source_type,
      source_id,
      movement_type,
      direction,
      quantity,
      unit_cost,
      status,
      metadata
    )
    values (
      p_business_id,
      v_item.product_id,
      'purchase',
      p_purchase_id,
      'purchase_in',
      'in',
      v_item.quantity,
      v_item.unit_cost,
      'valid',
      jsonb_build_object(
        'purchase_item_id', v_item.id,
        'inventory_item_id', v_item.inventory_item_id,
        'supply_id', v_supply.id,
        'item_name', v_item.item_name,
        'unit', v_item.unit,
        'category', v_item.category
      )
    );
  end loop;

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    reason
  )
  values (
    p_business_id,
    auth.uid(),
    'purchases',
    'purchase.confirm',
    'purchases',
    p_purchase_id::text,
    to_jsonb(v_purchase),
    jsonb_build_object('status', 'confirmada', 'payable_id', v_payable_id),
    p_notes
  );

  return jsonb_build_object(
    'purchase_id', p_purchase_id,
    'payable_id', v_payable_id,
    'status', 'confirmada',
    'payment_status', v_purchase.payment_status,
    'pending_amount', v_purchase.pending_amount
  );
end;
$$;

create or replace function public.settle_account_payable(
  p_business_id uuid,
  p_account_payable_id uuid,
  p_amount numeric,
  p_method text default 'cash',
  p_reference text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payable public.accounts_payable%rowtype;
  v_cash_session_id uuid;
  v_payment_amount numeric(12, 2);
  v_next_paid_amount numeric(12, 2);
  v_next_pending_amount numeric(12, 2);
  v_method text;
begin
  perform public.assert_business_member(p_business_id);

  select *
  into v_payable
  from public.accounts_payable
  where id = p_account_payable_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Account payable not found' using errcode = 'P0002';
  end if;

  if v_payable.status = 'cancelled' then
    raise exception 'Account payable is cancelled' using errcode = 'P0001';
  end if;

  if coalesce(v_payable.pending_amount, 0) <= 0 then
    raise exception 'Account payable has no pending amount' using errcode = 'P0001';
  end if;

  v_payment_amount := coalesce(p_amount, 0);

  if v_payment_amount <= 0 then
    raise exception 'Payment amount must be positive' using errcode = '22003';
  end if;

  if v_payment_amount > v_payable.pending_amount then
    raise exception 'Payment amount exceeds pending amount' using errcode = '22003';
  end if;

  select id
  into v_cash_session_id
  from public.cash_sessions
  where business_id = p_business_id
    and status = 'open'
  order by opened_at desc
  limit 1;

  if v_cash_session_id is null then
    raise exception 'Open cash session required for supplier payment' using errcode = 'P0001';
  end if;

  v_method := coalesce(nullif(trim(p_method), ''), 'cash');
  v_next_paid_amount := coalesce(v_payable.paid_amount, 0) + v_payment_amount;
  v_next_pending_amount := greatest(coalesce(v_payable.original_amount, 0) - v_next_paid_amount, 0);

  update public.accounts_payable
  set
    paid_amount = v_next_paid_amount,
    pending_amount = v_next_pending_amount,
    status = case when v_next_pending_amount > 0 then 'partial' else 'paid' end
  where id = p_account_payable_id;

  if v_payable.purchase_id is not null then
    update public.purchases
    set
      paid_amount = v_next_paid_amount,
      pending_amount = v_next_pending_amount,
      payment_status = case when v_next_pending_amount > 0 then 'partial' else 'paid' end
    where id = v_payable.purchase_id
      and business_id = p_business_id;
  end if;

  insert into public.cash_movements (
    business_id,
    cash_session_id,
    type,
    method,
    amount,
    status,
    description,
    metadata
  )
  values (
    p_business_id,
    v_cash_session_id,
    'supplier_payment',
    v_method,
    v_payment_amount,
    'valid',
    'Pago a proveedor',
    jsonb_build_object(
      'account_payable_id', p_account_payable_id,
      'purchase_id', v_payable.purchase_id,
      'supplier_id', v_payable.supplier_id,
      'supplier_name', v_payable.supplier_name,
      'reference', p_reference,
      'previous_pending_amount', v_payable.pending_amount,
      'next_pending_amount', v_next_pending_amount,
      'notes', p_notes
    )
  );

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    reason
  )
  values (
    p_business_id,
    auth.uid(),
    'finance',
    'payable.settle',
    'accounts_payable',
    p_account_payable_id::text,
    to_jsonb(v_payable),
    jsonb_build_object(
      'cash_session_id', v_cash_session_id,
      'amount', v_payment_amount,
      'method', v_method,
      'paid_amount', v_next_paid_amount,
      'pending_amount', v_next_pending_amount
    ),
    p_notes
  );

  return jsonb_build_object(
    'account_payable_id', p_account_payable_id,
    'cash_session_id', v_cash_session_id,
    'amount', v_payment_amount,
    'method', v_method,
    'paid_amount', v_next_paid_amount,
    'pending_amount', v_next_pending_amount,
    'status', case when v_next_pending_amount > 0 then 'partial' else 'paid' end
  );
end;
$$;


-- <<< database/supabase/patch-inventory-supplies-and-table-rpc.sql

-- >>> database/supabase/patch-finance-purchases-payables.sql
-- Apply after core Supabase migration. Adds purchases, purchase items, accounts payable and finance RPCs.

-- Finance extension for purchases and supplier payables.
-- Apply after schema.sql, rls.sql and rpc-core.sql.

alter table public.cash_movements drop constraint if exists cash_movements_type_check;
alter table public.cash_movements add constraint cash_movements_type_check
check (type in (
  'opening',
  'sale_income',
  'purchase_expense',
  'operating_expense',
  'operational_expense',
  'supplier_payment',
  'debt_payment',
  'debt_payment_income',
  'manual_income',
  'adjustment',
  'closing',
  'reversal'
));

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_name text not null default '',
  purchase_number text,
  purchase_date date not null default current_date,
  status text not null default 'borrador',
  payment_status text not null default 'pending',
  payment_method text not null default 'credit',
  subtotal numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  paid_amount numeric(12, 2) not null default 0,
  pending_amount numeric(12, 2) not null default 0,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references public.profiles(id),
  confirmed_by uuid references public.profiles(id),
  cancelled_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchases_status_check check (status in ('borrador', 'confirmada', 'anulada', 'parcial', 'devuelta')),
  constraint purchases_payment_status_check check (payment_status in ('pending', 'partial', 'paid', 'cancelled', 'refunded')),
  constraint purchases_totals_non_negative check (subtotal >= 0 and tax_total >= 0 and total >= 0 and paid_amount >= 0 and pending_amount >= 0)
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  inventory_item_id text,
  item_name text not null,
  category text,
  quantity numeric(14, 4) not null,
  unit text not null default 'und',
  unit_cost numeric(12, 2) not null default 0,
  subtotal numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  batch text,
  expiration_date date,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_items_amounts_check check (quantity > 0 and unit_cost >= 0 and subtotal >= 0 and tax_total >= 0)
);

create table if not exists public.accounts_payable (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  purchase_id uuid references public.purchases(id) on delete cascade,
  supplier_name text not null default '',
  concept text not null default 'Compra a proveedor',
  original_amount numeric(12, 2) not null default 0,
  paid_amount numeric(12, 2) not null default 0,
  pending_amount numeric(12, 2) not null default 0,
  status text not null default 'pending',
  due_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_payable_status_check check (status in ('pending', 'partial', 'paid', 'cancelled')),
  constraint accounts_payable_amounts_check check (original_amount >= 0 and paid_amount >= 0 and pending_amount >= 0)
);

create unique index if not exists purchases_business_number_idx
on public.purchases (business_id, purchase_number)
where purchase_number is not null;

create unique index if not exists accounts_payable_purchase_unique_idx
on public.accounts_payable (purchase_id)
where purchase_id is not null;

create index if not exists purchases_business_date_idx on public.purchases(business_id, purchase_date desc, created_at desc);
create index if not exists purchase_items_purchase_idx on public.purchase_items(purchase_id);
create index if not exists accounts_payable_business_status_idx on public.accounts_payable(business_id, status);

drop trigger if exists purchases_set_updated_at on public.purchases;
create trigger purchases_set_updated_at before update on public.purchases for each row execute function public.set_updated_at();

drop trigger if exists purchase_items_set_updated_at on public.purchase_items;
create trigger purchase_items_set_updated_at before update on public.purchase_items for each row execute function public.set_updated_at();

drop trigger if exists accounts_payable_set_updated_at on public.accounts_payable;
create trigger accounts_payable_set_updated_at before update on public.accounts_payable for each row execute function public.set_updated_at();

alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.accounts_payable enable row level security;

drop policy if exists "purchases members read" on public.purchases;
create policy "purchases members read" on public.purchases for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "purchases members write" on public.purchases;
create policy "purchases members write" on public.purchases for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "purchase items members read" on public.purchase_items;
create policy "purchase items members read" on public.purchase_items for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "purchase items members write" on public.purchase_items;
create policy "purchase items members write" on public.purchase_items for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists "accounts payable members read" on public.accounts_payable;
create policy "accounts payable members read" on public.accounts_payable for select to authenticated
using (public.is_business_member(business_id));

drop policy if exists "accounts payable members write" on public.accounts_payable;
create policy "accounts payable members write" on public.accounts_payable for all to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));


-- Finance RPCs for purchases and supplier payables.
-- Apply after schema-finance.sql.

create or replace function public.confirm_purchase(
  p_business_id uuid,
  p_purchase_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases%rowtype;
  v_payable_id uuid;
  v_item public.purchase_items%rowtype;
begin
  perform public.assert_business_member(p_business_id);

  select *
  into v_purchase
  from public.purchases
  where id = p_purchase_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Purchase not found' using errcode = 'P0002';
  end if;

  if v_purchase.status = 'anulada' then
    raise exception 'Cancelled purchase cannot be confirmed' using errcode = 'P0001';
  end if;

  if v_purchase.status = 'confirmada' then
    return jsonb_build_object(
      'purchase_id', p_purchase_id,
      'status', v_purchase.status,
      'payment_status', v_purchase.payment_status,
      'pending_amount', v_purchase.pending_amount
    );
  end if;

  update public.purchases
  set
    status = 'confirmada',
    payment_status = case when total > 0 then 'pending' else 'paid' end,
    paid_amount = 0,
    pending_amount = total,
    confirmed_at = now(),
    confirmed_by = auth.uid()
  where id = p_purchase_id
  returning * into v_purchase;

  insert into public.accounts_payable (
    business_id,
    supplier_id,
    purchase_id,
    supplier_name,
    concept,
    original_amount,
    paid_amount,
    pending_amount,
    status,
    metadata
  )
  values (
    p_business_id,
    v_purchase.supplier_id,
    p_purchase_id,
    v_purchase.supplier_name,
    coalesce(nullif(v_purchase.purchase_number, ''), 'Compra a proveedor'),
    v_purchase.total,
    0,
    v_purchase.total,
    case when v_purchase.total > 0 then 'pending' else 'paid' end,
    jsonb_build_object('source', 'confirm_purchase')
  )
  on conflict (purchase_id) where purchase_id is not null
  do update set
    original_amount = excluded.original_amount,
    pending_amount = greatest(excluded.original_amount - public.accounts_payable.paid_amount, 0),
    status = case
      when greatest(excluded.original_amount - public.accounts_payable.paid_amount, 0) <= 0 then 'paid'
      when public.accounts_payable.paid_amount > 0 then 'partial'
      else 'pending'
    end
  returning id into v_payable_id;

  for v_item in
    select *
    from public.purchase_items
    where purchase_id = p_purchase_id
      and business_id = p_business_id
  loop
    insert into public.inventory_movements (
      business_id,
      product_id,
      source_type,
      source_id,
      movement_type,
      direction,
      quantity,
      unit_cost,
      status,
      metadata
    )
    values (
      p_business_id,
      v_item.product_id,
      'purchase',
      p_purchase_id,
      'purchase_in',
      'in',
      v_item.quantity,
      v_item.unit_cost,
      'valid',
      jsonb_build_object(
        'purchase_item_id', v_item.id,
        'inventory_item_id', v_item.inventory_item_id,
        'item_name', v_item.item_name,
        'unit', v_item.unit,
        'category', v_item.category
      )
    );
  end loop;

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    reason
  )
  values (
    p_business_id,
    auth.uid(),
    'purchases',
    'purchase.confirm',
    'purchases',
    p_purchase_id::text,
    to_jsonb(v_purchase),
    jsonb_build_object('status', 'confirmada', 'payable_id', v_payable_id),
    p_notes
  );

  return jsonb_build_object(
    'purchase_id', p_purchase_id,
    'payable_id', v_payable_id,
    'status', 'confirmada',
    'payment_status', v_purchase.payment_status,
    'pending_amount', v_purchase.pending_amount
  );
end;
$$;

create or replace function public.settle_account_payable(
  p_business_id uuid,
  p_account_payable_id uuid,
  p_amount numeric,
  p_method text default 'cash',
  p_reference text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payable public.accounts_payable%rowtype;
  v_cash_session_id uuid;
  v_payment_amount numeric(12, 2);
  v_next_paid_amount numeric(12, 2);
  v_next_pending_amount numeric(12, 2);
  v_method text;
begin
  perform public.assert_business_member(p_business_id);

  select *
  into v_payable
  from public.accounts_payable
  where id = p_account_payable_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Account payable not found' using errcode = 'P0002';
  end if;

  if v_payable.status = 'cancelled' then
    raise exception 'Account payable is cancelled' using errcode = 'P0001';
  end if;

  if coalesce(v_payable.pending_amount, 0) <= 0 then
    raise exception 'Account payable has no pending amount' using errcode = 'P0001';
  end if;

  v_payment_amount := coalesce(p_amount, 0);

  if v_payment_amount <= 0 then
    raise exception 'Payment amount must be positive' using errcode = '22003';
  end if;

  if v_payment_amount > v_payable.pending_amount then
    raise exception 'Payment amount exceeds pending amount' using errcode = '22003';
  end if;

  select id
  into v_cash_session_id
  from public.cash_sessions
  where business_id = p_business_id
    and status = 'open'
  order by opened_at desc
  limit 1;

  if v_cash_session_id is null then
    raise exception 'Open cash session required for supplier payment' using errcode = 'P0001';
  end if;

  v_method := coalesce(nullif(trim(p_method), ''), 'cash');
  v_next_paid_amount := coalesce(v_payable.paid_amount, 0) + v_payment_amount;
  v_next_pending_amount := greatest(coalesce(v_payable.original_amount, 0) - v_next_paid_amount, 0);

  update public.accounts_payable
  set
    paid_amount = v_next_paid_amount,
    pending_amount = v_next_pending_amount,
    status = case when v_next_pending_amount > 0 then 'partial' else 'paid' end
  where id = p_account_payable_id;

  if v_payable.purchase_id is not null then
    update public.purchases
    set
      paid_amount = v_next_paid_amount,
      pending_amount = v_next_pending_amount,
      payment_status = case when v_next_pending_amount > 0 then 'partial' else 'paid' end
    where id = v_payable.purchase_id
      and business_id = p_business_id;
  end if;

  insert into public.cash_movements (
    business_id,
    cash_session_id,
    type,
    method,
    amount,
    status,
    description,
    metadata
  )
  values (
    p_business_id,
    v_cash_session_id,
    'supplier_payment',
    v_method,
    v_payment_amount,
    'valid',
    'Pago a proveedor',
    jsonb_build_object(
      'account_payable_id', p_account_payable_id,
      'purchase_id', v_payable.purchase_id,
      'supplier_id', v_payable.supplier_id,
      'supplier_name', v_payable.supplier_name,
      'reference', p_reference,
      'previous_pending_amount', v_payable.pending_amount,
      'next_pending_amount', v_next_pending_amount,
      'notes', p_notes
    )
  );

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    reason
  )
  values (
    p_business_id,
    auth.uid(),
    'finance',
    'payable.settle',
    'accounts_payable',
    p_account_payable_id::text,
    to_jsonb(v_payable),
    jsonb_build_object(
      'cash_session_id', v_cash_session_id,
      'amount', v_payment_amount,
      'method', v_method,
      'paid_amount', v_next_paid_amount,
      'pending_amount', v_next_pending_amount
    ),
    p_notes
  );

  return jsonb_build_object(
    'account_payable_id', p_account_payable_id,
    'cash_session_id', v_cash_session_id,
    'amount', v_payment_amount,
    'method', v_method,
    'paid_amount', v_next_paid_amount,
    'pending_amount', v_next_pending_amount,
    'status', case when v_next_pending_amount > 0 then 'partial' else 'paid' end
  );
end;
$$;
-- <<< database/supabase/patch-finance-purchases-payables.sql

-- >>> database/supabase/performance-indexes.sql
-- Focused FK indexes for cash, purchases, payables and receivables.
-- Apply after schema.sql and schema-finance.sql.

create index if not exists payments_cash_session_id_idx on public.payments(cash_session_id);

create index if not exists cash_movements_cash_session_id_idx on public.cash_movements(cash_session_id);
create index if not exists cash_movements_sale_id_idx on public.cash_movements(sale_id);
create index if not exists cash_movements_payment_id_idx on public.cash_movements(payment_id);

create index if not exists sales_cash_session_id_idx on public.sales(cash_session_id);
create index if not exists sales_customer_id_idx on public.sales(customer_id);

create index if not exists purchases_supplier_id_idx on public.purchases(supplier_id);
create index if not exists purchases_created_by_idx on public.purchases(created_by);
create index if not exists purchases_confirmed_by_idx on public.purchases(confirmed_by);
create index if not exists purchases_cancelled_by_idx on public.purchases(cancelled_by);

create index if not exists purchase_items_business_id_idx on public.purchase_items(business_id);
create index if not exists purchase_items_product_id_idx on public.purchase_items(product_id);

create index if not exists accounts_payable_supplier_id_idx on public.accounts_payable(supplier_id);

-- <<< database/supabase/performance-indexes.sql

-- >>> database/supabase/bootstrap.sql
-- Bootstrap helpers for the first Supabase users and businesses.
-- Run after schema.sql and rls.sql.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    display_name,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1),
      ''
    ),
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = case
      when public.profiles.display_name = '' then excluded.display_name
      else public.profiles.display_name
    end,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.bootstrap_business_for_current_user(
  p_business_name text,
  p_display_name text default null,
  p_legacy_firebase_uid text default null,
  p_legacy_firebase_business_id text default null
)
returns table (
  business_id uuid,
  profile_id uuid,
  business_user_id uuid,
  was_created boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_display_name text;
  v_business_name text := nullif(trim(coalesce(p_business_name, '')), '');
  v_existing_business_id uuid;
  v_business_id uuid;
  v_business_user_id uuid;
  v_was_created boolean := false;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion en Supabase para inicializar el negocio.'
      using errcode = '28000';
  end if;

  select
    coalesce(email, ''),
    coalesce(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'name', '')
  into v_email, v_display_name
  from auth.users
  where id = v_user_id;

  v_display_name := nullif(trim(coalesce(p_display_name, v_display_name, split_part(v_email, '@', 1), '')), '');

  if v_business_name is null then
    raise exception 'El nombre del negocio es obligatorio.'
      using errcode = '22023';
  end if;

  insert into public.profiles (
    id,
    legacy_firebase_uid,
    email,
    display_name,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    nullif(trim(coalesce(p_legacy_firebase_uid, '')), ''),
    v_email,
    coalesce(v_display_name, ''),
    now(),
    now()
  )
  on conflict (id) do update
  set
    legacy_firebase_uid = coalesce(public.profiles.legacy_firebase_uid, excluded.legacy_firebase_uid),
    email = excluded.email,
    display_name = case
      when excluded.display_name <> '' then excluded.display_name
      else public.profiles.display_name
    end,
    updated_at = now();

  select bu.business_id
  into v_existing_business_id
  from public.business_users bu
  where bu.user_id = v_user_id
    and bu.status = 'active'
  order by bu.created_at asc
  limit 1;

  if v_existing_business_id is not null then
    select bu.id
    into v_business_user_id
    from public.business_users bu
    where bu.business_id = v_existing_business_id
      and bu.user_id = v_user_id
    limit 1;

    return query select v_existing_business_id, v_user_id, v_business_user_id, false;
    return;
  end if;

  insert into public.businesses (
    legacy_firebase_id,
    name,
    owner_user_id,
    status,
    metadata,
    created_at,
    updated_at
  )
  values (
    nullif(trim(coalesce(p_legacy_firebase_business_id, '')), ''),
    v_business_name,
    v_user_id,
    'active',
    jsonb_build_object('bootstrap_source', 'supabase_rpc'),
    now(),
    now()
  )
  returning id into v_business_id;

  v_was_created := true;

  insert into public.business_users (
    business_id,
    user_id,
    role,
    status,
    display_name,
    email,
    created_at,
    updated_at
  )
  values (
    v_business_id,
    v_user_id,
    'owner',
    'active',
    coalesce(v_display_name, ''),
    v_email,
    now(),
    now()
  )
  returning id into v_business_user_id;

  insert into public.business_settings (
    business_id,
    settings,
    created_at,
    updated_at
  )
  values (
    v_business_id,
    jsonb_build_object(
      'cash', jsonb_build_object(
        'require_open_cash_session', true,
        'allow_sales_without_cash_session', false,
        'max_closing_difference', 0
      ),
      'pos', jsonb_build_object(
        'allow_discounts', true,
        'allow_credit_sales', true,
        'require_customer_for_debt', true
      ),
      'inventory', jsonb_build_object(
        'alert_low_stock', true,
        'allow_negative_stock', false
      )
    ),
    now(),
    now()
  )
  on conflict on constraint business_settings_pkey do nothing;

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    new_value,
    reason,
    created_at
  )
  values (
    v_business_id,
    v_user_id,
    'bootstrap',
    'business.bootstrap',
    'business',
    v_business_id::text,
    jsonb_build_object(
      'business_name', v_business_name,
      'legacy_firebase_uid', p_legacy_firebase_uid,
      'legacy_firebase_business_id', p_legacy_firebase_business_id
    ),
    'Inicializacion controlada de negocio en Supabase',
    now()
  );

  return query select v_business_id, v_user_id, v_business_user_id, v_was_created;
end;
$$;

grant execute on function public.bootstrap_business_for_current_user(text, text, text, text) to authenticated;

create or replace function public.admin_bootstrap_business_for_auth_user(
  p_user_email text,
  p_business_name text,
  p_display_name text default null,
  p_legacy_firebase_uid text default null,
  p_legacy_firebase_business_id text default null
)
returns table (
  business_id uuid,
  profile_id uuid,
  business_user_id uuid,
  was_created boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text := lower(nullif(trim(coalesce(p_user_email, '')), ''));
  v_display_name text;
  v_business_name text := nullif(trim(coalesce(p_business_name, '')), '');
  v_existing_business_id uuid;
  v_business_id uuid;
  v_business_user_id uuid;
  v_was_created boolean := false;
begin
  if v_email is null then
    raise exception 'El email del usuario Supabase es obligatorio.'
      using errcode = '22023';
  end if;

  if v_business_name is null then
    raise exception 'El nombre del negocio es obligatorio.'
      using errcode = '22023';
  end if;

  select id, coalesce(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'name', '')
  into v_user_id, v_display_name
  from auth.users
  where lower(email) = v_email
  limit 1;

  if v_user_id is null then
    raise exception 'No existe un usuario Supabase Auth con email %.', v_email
      using errcode = '22023';
  end if;

  v_display_name := nullif(trim(coalesce(p_display_name, v_display_name, split_part(v_email, '@', 1), '')), '');

  insert into public.profiles (
    id,
    legacy_firebase_uid,
    email,
    display_name,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    nullif(trim(coalesce(p_legacy_firebase_uid, '')), ''),
    v_email,
    coalesce(v_display_name, ''),
    now(),
    now()
  )
  on conflict (id) do update
  set
    legacy_firebase_uid = coalesce(public.profiles.legacy_firebase_uid, excluded.legacy_firebase_uid),
    email = excluded.email,
    display_name = case
      when excluded.display_name <> '' then excluded.display_name
      else public.profiles.display_name
    end,
    updated_at = now();

  select bu.business_id
  into v_existing_business_id
  from public.business_users bu
  where bu.user_id = v_user_id
    and bu.status = 'active'
  order by bu.created_at asc
  limit 1;

  if v_existing_business_id is not null then
    select bu.id
    into v_business_user_id
    from public.business_users bu
    where bu.business_id = v_existing_business_id
      and bu.user_id = v_user_id
    limit 1;

    return query select v_existing_business_id, v_user_id, v_business_user_id, false;
    return;
  end if;

  insert into public.businesses (
    legacy_firebase_id,
    name,
    owner_user_id,
    status,
    metadata,
    created_at,
    updated_at
  )
  values (
    nullif(trim(coalesce(p_legacy_firebase_business_id, '')), ''),
    v_business_name,
    v_user_id,
    'active',
    jsonb_build_object('bootstrap_source', 'admin_sql'),
    now(),
    now()
  )
  returning id into v_business_id;

  v_was_created := true;

  insert into public.business_users (
    business_id,
    user_id,
    role,
    status,
    display_name,
    email,
    created_at,
    updated_at
  )
  values (
    v_business_id,
    v_user_id,
    'owner',
    'active',
    coalesce(v_display_name, ''),
    v_email,
    now(),
    now()
  )
  returning id into v_business_user_id;

  insert into public.business_settings (
    business_id,
    settings,
    created_at,
    updated_at
  )
  values (
    v_business_id,
    jsonb_build_object(
      'cash', jsonb_build_object(
        'require_open_cash_session', true,
        'allow_sales_without_cash_session', false,
        'max_closing_difference', 0
      ),
      'pos', jsonb_build_object(
        'allow_discounts', true,
        'allow_credit_sales', true,
        'require_customer_for_debt', true
      ),
      'inventory', jsonb_build_object(
        'alert_low_stock', true,
        'allow_negative_stock', false
      )
    ),
    now(),
    now()
  )
  on conflict on constraint business_settings_pkey do nothing;

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    new_value,
    reason,
    created_at
  )
  values (
    v_business_id,
    v_user_id,
    'bootstrap',
    'business.admin_bootstrap',
    'business',
    v_business_id::text,
    jsonb_build_object(
      'business_name', v_business_name,
      'legacy_firebase_uid', p_legacy_firebase_uid,
      'legacy_firebase_business_id', p_legacy_firebase_business_id
    ),
    'Inicializacion admin de negocio en Supabase',
    now()
  );

  return query select v_business_id, v_user_id, v_business_user_id, v_was_created;
end;
$$;

revoke all on function public.admin_bootstrap_business_for_auth_user(text, text, text, text, text) from public;
revoke all on function public.admin_bootstrap_business_for_auth_user(text, text, text, text, text) from anon;
revoke all on function public.admin_bootstrap_business_for_auth_user(text, text, text, text, text) from authenticated;

-- One-time SQL Editor example after creating the Supabase Auth user:
-- select * from public.admin_bootstrap_business_for_auth_user(
--   'katteryneramos@gmail.com',
--   'Nombre del negocio',
--   'Nombre del administrador',
--   'QFVrzOvmv0hSqlTYbYMEFS8UCPA3',
--   'business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3'
-- );

-- <<< database/supabase/bootstrap.sql

-- >>> database/supabase/security-grants.sql
-- Security hardening for public RPCs/functions.
-- Apply after schema.sql, rls.sql and all rpc-*.sql files.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

grant usage on schema public to anon, authenticated;

grant select on table
  public.profiles,
  public.businesses,
  public.business_users,
  public.business_settings,
  public.product_categories,
  public.suppliers,
  public.customers,
  public.products,
  public.cash_sessions,
  public.sales,
  public.sale_items,
  public.payments,
  public.cash_movements,
  public.inventory_movements,
  public.audit_logs,
  public.supply_categories,
  public.supplies,
  public.tables,
  public.table_sessions,
  public.table_orders,
  public.kitchen_tickets,
  public.table_events,
  public.purchases,
  public.purchase_items,
  public.accounts_payable
to anon;

revoke all on table
  public.technical_sheets,
  public.technical_sheet_items,
  public.technical_sheet_versions,
  public.product_cost_snapshots
from anon;

grant select, insert, update, delete on table
  public.profiles,
  public.businesses,
  public.business_users,
  public.business_settings,
  public.product_categories,
  public.suppliers,
  public.customers,
  public.products,
  public.cash_sessions,
  public.sales,
  public.sale_items,
  public.payments,
  public.cash_movements,
  public.inventory_movements,
  public.audit_logs,
  public.supply_categories,
  public.supplies,
  public.tables,
  public.table_sessions,
  public.table_orders,
  public.kitchen_tickets,
  public.table_events,
  public.purchases,
  public.purchase_items,
  public.accounts_payable,
  public.technical_sheets,
  public.technical_sheet_items,
  public.technical_sheet_versions,
  public.product_cost_snapshots
to authenticated;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

revoke execute on function public.current_business_ids() from public, anon;
revoke execute on function public.has_business_role(uuid, text[]) from public, anon;
revoke execute on function public.is_business_member(uuid) from public, anon;
revoke execute on function public.assert_business_member(uuid) from public, anon;

grant execute on function public.current_business_ids() to authenticated;
grant execute on function public.has_business_role(uuid, text[]) to authenticated;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.assert_business_member(uuid) to authenticated;

revoke execute on function public.bootstrap_business_for_current_user(text, text, text, text) from public, anon;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
grant execute on function public.bootstrap_business_for_current_user(text, text, text, text) to authenticated;

revoke execute on function public.open_cash_session(uuid, numeric, text) from public, anon;
revoke execute on function public.close_cash_session(uuid, uuid, numeric, text) from public, anon;
revoke execute on function public.close_sale(uuid, jsonb, jsonb, jsonb) from public, anon;
revoke execute on function public.settle_sale_debt(uuid, uuid, numeric, text, text, text) from public, anon;

grant execute on function public.open_cash_session(uuid, numeric, text) to authenticated;
grant execute on function public.close_cash_session(uuid, uuid, numeric, text) to authenticated;
grant execute on function public.close_sale(uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.settle_sale_debt(uuid, uuid, numeric, text, text, text) to authenticated;

revoke execute on function public.save_table_layout(uuid, uuid, jsonb) from public, anon;
revoke execute on function public.salon_assert_table_available(uuid, uuid) from public, anon;
revoke execute on function public.open_table_session(uuid, uuid, text, integer, uuid, text, text) from public, anon;
revoke execute on function public.send_order_to_kitchen(uuid, uuid, uuid, uuid, jsonb, uuid, text) from public, anon;
revoke execute on function public.update_kitchen_ticket_status(uuid, uuid, text) from public, anon;
revoke execute on function public.request_table_bill(uuid, uuid, uuid, uuid) from public, anon;
revoke execute on function public.release_clean_table(uuid, uuid) from public, anon;
revoke execute on function public.transfer_table_session(uuid, uuid, uuid, uuid, uuid) from public, anon;
revoke execute on function public.cancel_table_order_item(uuid, uuid, uuid, uuid, text, text) from public, anon;
revoke execute on function public.reassign_table_waiter(uuid, uuid, uuid, text) from public, anon;

grant execute on function public.save_table_layout(uuid, uuid, jsonb) to authenticated;
grant execute on function public.salon_assert_table_available(uuid, uuid) to authenticated;
grant execute on function public.open_table_session(uuid, uuid, text, integer, uuid, text, text) to authenticated;
grant execute on function public.send_order_to_kitchen(uuid, uuid, uuid, uuid, jsonb, uuid, text) to authenticated;
grant execute on function public.update_kitchen_ticket_status(uuid, uuid, text) to authenticated;
grant execute on function public.request_table_bill(uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.release_clean_table(uuid, uuid) to authenticated;
grant execute on function public.transfer_table_session(uuid, uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.cancel_table_order_item(uuid, uuid, uuid, uuid, text, text) to authenticated;
grant execute on function public.reassign_table_waiter(uuid, uuid, uuid, text) to authenticated;

revoke execute on function public.save_purchase(uuid, uuid, jsonb, jsonb, boolean, text) from public, anon;
revoke execute on function public.cancel_purchase(uuid, text) from public, anon;
revoke execute on function public.confirm_purchase(uuid, uuid, text) from public, anon;
revoke execute on function public.settle_account_payable(uuid, uuid, numeric, text, text, text) from public, anon;

grant execute on function public.save_purchase(uuid, uuid, jsonb, jsonb, boolean, text) to authenticated;
grant execute on function public.cancel_purchase(uuid, text) to authenticated;
grant execute on function public.confirm_purchase(uuid, uuid, text) to authenticated;
grant execute on function public.settle_account_payable(uuid, uuid, numeric, text, text, text) to authenticated;

revoke execute on function public.profitability_normalize_percent(numeric, numeric) from public, anon, authenticated;
revoke execute on function public.profitability_component_cost(numeric, numeric, numeric) from public, anon, authenticated;
revoke execute on function public.profitability_build_costing(jsonb, jsonb, numeric, numeric) from public, anon;
revoke execute on function public.assert_profitability_role(uuid, text[], text) from public, anon, authenticated;

grant execute on function public.profitability_build_costing(jsonb, jsonb, numeric, numeric) to authenticated;

revoke execute on function public.create_or_update_technical_sheet(uuid, uuid, jsonb, jsonb, boolean) from public, anon;
revoke execute on function public.activate_technical_sheet_version(uuid, uuid, uuid) from public, anon;
revoke execute on function public.recalculate_product_cost(uuid, uuid) from public, anon;
revoke execute on function public.close_sale_with_inventory_explosion(uuid, jsonb, jsonb, jsonb) from public, anon;
revoke execute on function public.reverse_inventory_explosion(uuid, uuid, text) from public, anon;

grant execute on function public.create_or_update_technical_sheet(uuid, uuid, jsonb, jsonb, boolean) to authenticated;
grant execute on function public.activate_technical_sheet_version(uuid, uuid, uuid) to authenticated;
grant execute on function public.recalculate_product_cost(uuid, uuid) to authenticated;
grant execute on function public.close_sale_with_inventory_explosion(uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.reverse_inventory_explosion(uuid, uuid, text) to authenticated;

-- <<< database/supabase/security-grants.sql