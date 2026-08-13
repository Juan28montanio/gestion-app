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
