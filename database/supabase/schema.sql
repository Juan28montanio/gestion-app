-- Initial Supabase/PostgreSQL schema for the Firebase parallel migration.
-- Apply this before rls.sql. Keep Firebase IDs in legacy_firebase_* columns until cutover.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
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
  constraint business_users_role_check check (role in ('owner', 'admin', 'manager', 'cashier', 'waiter', 'kitchen', 'staff')),
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
create index if not exists sale_items_sale_id_idx on public.sale_items(sale_id);
create index if not exists payments_sale_id_idx on public.payments(sale_id);
create index if not exists cash_sessions_business_status_idx on public.cash_sessions(business_id, status);
create index if not exists cash_movements_business_created_at_idx on public.cash_movements(business_id, created_at desc);
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
