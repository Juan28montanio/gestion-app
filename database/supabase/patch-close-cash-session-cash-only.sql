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
