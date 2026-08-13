-- Finance RPCs for purchases and supplier payables.
-- Apply after schema-finance.sql.

create or replace function public.save_purchase(
  p_business_id uuid,
  p_purchase_id uuid default null,
  p_purchase jsonb default '{}'::jsonb,
  p_items jsonb default '[]'::jsonb,
  p_confirm boolean default false,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase_id uuid;
  v_existing public.purchases%rowtype;
  v_item jsonb;
  v_item_count integer;
  v_supplier_id uuid;
  v_supplier_name text;
  v_purchase_date date;
  v_subtotal numeric(12, 2);
  v_tax_total numeric(12, 2);
  v_total numeric(12, 2);
  v_supply_id uuid;
  v_confirm_result jsonb;
begin
  perform public.assert_business_member(p_business_id);

  select count(*) into v_item_count from jsonb_array_elements(p_items);
  if v_item_count <= 0 then
    raise exception 'Purchase must include at least one item' using errcode = '22023';
  end if;

  v_supplier_id := nullif(p_purchase->>'supplier_id', '')::uuid;
  if v_supplier_id is null then
    raise exception 'Supplier is required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.suppliers where id = v_supplier_id and business_id = p_business_id
  ) then
    raise exception 'Supplier not found' using errcode = 'P0002';
  end if;

  v_supplier_name := coalesce(nullif(trim(p_purchase->>'supplier_name'), ''), '');
  v_purchase_date := coalesce(nullif(p_purchase->>'purchase_date', '')::date, current_date);
  v_subtotal := coalesce(nullif(p_purchase->>'subtotal', '')::numeric, 0);
  v_tax_total := coalesce(nullif(p_purchase->>'tax_total', '')::numeric, 0);
  v_total := coalesce(nullif(p_purchase->>'total', '')::numeric, v_subtotal + v_tax_total, 0);

  if v_subtotal < 0 or v_tax_total < 0 or v_total < 0 then
    raise exception 'Purchase totals cannot be negative' using errcode = '22003';
  end if;

  if p_purchase_id is not null then
    select *
    into v_existing
    from public.purchases
    where id = p_purchase_id
      and business_id = p_business_id
    for update;

    if not found then
      raise exception 'Purchase not found' using errcode = 'P0002';
    end if;

    if v_existing.status = 'confirmada' then
      raise exception 'Confirmed purchase cannot be edited' using errcode = 'P0001';
    end if;

    update public.purchases
    set
      supplier_id = v_supplier_id,
      supplier_name = v_supplier_name,
      purchase_number = nullif(p_purchase->>'purchase_number', ''),
      purchase_date = v_purchase_date,
      status = 'borrador',
      payment_status = 'pending',
      payment_method = coalesce(nullif(p_purchase->>'payment_method', ''), 'credit'),
      subtotal = v_subtotal,
      tax_total = v_tax_total,
      total = v_total,
      paid_amount = 0,
      pending_amount = v_total,
      notes = nullif(p_purchase->>'notes', ''),
      metadata = coalesce(p_purchase->'metadata', '{}'::jsonb)
    where id = p_purchase_id
    returning id into v_purchase_id;

    delete from public.purchase_items
    where purchase_id = p_purchase_id
      and business_id = p_business_id;
  else
    insert into public.purchases (
      business_id,
      supplier_id,
      supplier_name,
      purchase_number,
      purchase_date,
      status,
      payment_status,
      payment_method,
      subtotal,
      tax_total,
      total,
      paid_amount,
      pending_amount,
      notes,
      metadata,
      created_by
    )
    values (
      p_business_id,
      v_supplier_id,
      v_supplier_name,
      nullif(p_purchase->>'purchase_number', ''),
      v_purchase_date,
      'borrador',
      'pending',
      coalesce(nullif(p_purchase->>'payment_method', ''), 'credit'),
      v_subtotal,
      v_tax_total,
      v_total,
      0,
      v_total,
      nullif(p_purchase->>'notes', ''),
      coalesce(p_purchase->'metadata', '{}'::jsonb),
      auth.uid()
    )
    returning id into v_purchase_id;
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce(nullif(v_item->>'quantity', '')::numeric, 0) <= 0 then
      raise exception 'Purchase item quantity must be positive' using errcode = '22003';
    end if;

    if coalesce(nullif(v_item->>'unit_cost', '')::numeric, 0) < 0 then
      raise exception 'Purchase item unit cost cannot be negative' using errcode = '22003';
    end if;

    v_supply_id := nullif(v_item->>'inventory_item_id', '')::uuid;

    if v_supply_id is null then
      insert into public.supplies (
        business_id,
        name,
        category,
        unit,
        status,
        current_stock,
        minimum_stock,
        average_cost,
        last_purchase_cost,
        supplier_id,
        metadata
      )
      values (
        p_business_id,
        coalesce(nullif(trim(v_item->>'item_name'), ''), 'Insumo'),
        coalesce(nullif(v_item->>'category', ''), ''),
        coalesce(nullif(v_item->>'unit', ''), 'und'),
        'active',
        0,
        0,
        coalesce(nullif(v_item->>'unit_cost', '')::numeric, 0),
        coalesce(nullif(v_item->>'unit_cost', '')::numeric, 0),
        v_supplier_id,
        jsonb_build_object(
          'source', 'purchase_manual_item',
          'search_key', lower(coalesce(nullif(trim(v_item->>'item_name'), ''), 'insumo'))
        )
      )
      on conflict (business_id, name)
      do update set
        category = coalesce(nullif(excluded.category, ''), public.supplies.category),
        unit = coalesce(nullif(excluded.unit, ''), public.supplies.unit),
        last_purchase_cost = excluded.last_purchase_cost,
        supplier_id = coalesce(excluded.supplier_id, public.supplies.supplier_id)
      returning id into v_supply_id;
    elsif not exists (
      select 1 from public.supplies where id = v_supply_id and business_id = p_business_id
    ) then
      raise exception 'Supply not found' using errcode = 'P0002';
    end if;

    insert into public.purchase_items (
      business_id,
      purchase_id,
      product_id,
      inventory_item_id,
      item_name,
      category,
      quantity,
      unit,
      unit_cost,
      subtotal,
      tax_total,
      batch,
      expiration_date,
      notes,
      metadata
    )
    values (
      p_business_id,
      v_purchase_id,
      nullif(v_item->>'product_id', '')::uuid,
      v_supply_id::text,
      coalesce(nullif(trim(v_item->>'item_name'), ''), 'Insumo'),
      nullif(v_item->>'category', ''),
      coalesce(nullif(v_item->>'quantity', '')::numeric, 0),
      coalesce(nullif(v_item->>'unit', ''), 'und'),
      coalesce(nullif(v_item->>'unit_cost', '')::numeric, 0),
      coalesce(nullif(v_item->>'subtotal', '')::numeric, 0),
      coalesce(nullif(v_item->>'tax_total', '')::numeric, 0),
      nullif(v_item->>'batch', ''),
      nullif(v_item->>'expiration_date', '')::date,
      nullif(v_item->>'notes', ''),
      coalesce(v_item->'metadata', '{}'::jsonb)
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
    case when p_purchase_id is null then 'purchase.create' else 'purchase.update' end,
    'purchases',
    v_purchase_id::text,
    case when p_purchase_id is null then null else to_jsonb(v_existing) end,
    jsonb_build_object('purchase_id', v_purchase_id, 'item_count', v_item_count, 'total', v_total),
    p_notes
  );

  if p_confirm then
    v_confirm_result := public.confirm_purchase(p_business_id, v_purchase_id, p_notes);
  end if;

  return jsonb_build_object(
    'purchase_id', v_purchase_id,
    'status', case when p_confirm then 'confirmada' else 'borrador' end,
    'confirmed', p_confirm,
    'confirm_result', v_confirm_result
  );
end;
$$;

create or replace function public.cancel_purchase(
  p_purchase_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases%rowtype;
begin
  select *
  into v_purchase
  from public.purchases
  where id = p_purchase_id
  for update;

  if not found then
    raise exception 'Purchase not found' using errcode = 'P0002';
  end if;

  perform public.assert_business_member(v_purchase.business_id);

  if v_purchase.status = 'confirmada' then
    raise exception 'Confirmed purchase cannot be cancelled from this flow' using errcode = 'P0001';
  end if;

  update public.purchases
  set
    status = 'anulada',
    payment_status = 'cancelled',
    pending_amount = 0,
    cancelled_at = now(),
    cancelled_by = auth.uid(),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('cancel_reason', nullif(trim(p_reason), ''))
  where id = p_purchase_id;

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
    v_purchase.business_id,
    auth.uid(),
    'purchases',
    'purchase.cancel',
    'purchases',
    p_purchase_id::text,
    to_jsonb(v_purchase),
    jsonb_build_object('status', 'anulada'),
    p_reason
  );

  return jsonb_build_object('purchase_id', p_purchase_id, 'status', 'anulada');
end;
$$;

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
