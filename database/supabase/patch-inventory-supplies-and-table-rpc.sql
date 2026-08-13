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

