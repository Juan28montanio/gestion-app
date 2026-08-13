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

