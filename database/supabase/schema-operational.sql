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
  constraint tables_status_check check (status in ('free', 'disabled', 'waiting_order', 'occupied', 'order_sent', 'preparing', 'ready', 'waiting_payment', 'cleaning')),
  constraint tables_shape_check check (shape in ('square', 'round', 'bar', 'booth'))
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
