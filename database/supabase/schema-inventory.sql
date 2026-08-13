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
