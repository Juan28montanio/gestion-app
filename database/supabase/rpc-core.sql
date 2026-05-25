-- Initial RPC layer for the Supabase migration.
-- Apply after schema.sql and rls.sql, once the authenticated bootstrap user can read its business.
-- These functions keep critical writes server-side instead of rebuilding Firestore transactions in the client.

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
