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
