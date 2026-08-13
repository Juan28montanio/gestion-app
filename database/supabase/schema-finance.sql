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
