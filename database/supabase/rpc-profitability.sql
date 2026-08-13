-- Profitability engine RPCs. Apply after schema-profitability.sql and rpc-core.sql.

create or replace function public.profitability_normalize_percent(p_value numeric, p_fallback numeric default 0)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case
    when p_value is null or p_value < 0 then p_fallback
    when p_value > 1 then p_value / 100
    else p_value
  end;
$$;

create or replace function public.profitability_component_cost(
  p_quantity numeric,
  p_unit_cost numeric,
  p_waste_percent numeric default 0
)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case
    when coalesce(p_quantity, 0) <= 0 or coalesce(p_unit_cost, 0) < 0 then 0
    else
      coalesce(p_quantity, 0)
      * coalesce(p_unit_cost, 0)
      * case
          when public.profitability_normalize_percent(p_waste_percent, 0) > 0
            then 1 / greatest(1 - public.profitability_normalize_percent(p_waste_percent, 0), 0.01)
          else 1
        end
  end;
$$;

create or replace function public.profitability_build_costing(
  p_components jsonb,
  p_yield_data jsonb,
  p_sale_price numeric,
  p_target_food_cost numeric default 0.3
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_component jsonb;
  v_total_cost numeric(14, 4) := 0;
  v_portions numeric(14, 4) := coalesce(nullif(p_yield_data->>'portions', '')::numeric, 1);
  v_cost_per_portion numeric(14, 4);
  v_sale_price numeric(14, 4) := coalesce(p_sale_price, 0);
  v_target_food_cost numeric(10, 4) := public.profitability_normalize_percent(p_target_food_cost, 0.3);
  v_suggested_price numeric(14, 4) := 0;
  v_food_cost_percent numeric(10, 4) := 0;
  v_gross_margin numeric(14, 4) := 0;
  v_gross_margin_percent numeric(10, 4) := 0;
begin
  if v_portions <= 0 then
    v_portions := 1;
  end if;

  for v_component in select value from jsonb_array_elements(coalesce(p_components, '[]'::jsonb))
  loop
    v_total_cost := v_total_cost + public.profitability_component_cost(
      coalesce(nullif(v_component->>'quantity', '')::numeric, 0),
      coalesce(nullif(coalesce(v_component->>'unitCost', v_component->>'unit_cost'), '')::numeric, 0),
      coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0)
    );
  end loop;

  v_cost_per_portion := v_total_cost / v_portions;
  v_suggested_price := case when v_target_food_cost > 0 then v_cost_per_portion / v_target_food_cost else 0 end;
  v_food_cost_percent := case when v_sale_price > 0 then (v_cost_per_portion / v_sale_price) * 100 else 0 end;
  v_gross_margin := v_sale_price - v_cost_per_portion;
  v_gross_margin_percent := case when v_sale_price > 0 then (v_gross_margin / v_sale_price) * 100 else 0 end;

  return jsonb_build_object(
    'totalCost', v_total_cost,
    'costPerPortion', v_cost_per_portion,
    'currentSalePrice', v_sale_price,
    'targetFoodCost', v_target_food_cost,
    'suggestedPrice', v_suggested_price,
    'foodCostPercent', v_food_cost_percent,
    'grossMargin', v_gross_margin,
    'grossMarginPercent', v_gross_margin_percent,
    'utilityEstimate', v_gross_margin
  );
end;
$$;

create or replace function public.assert_profitability_role(
  p_business_id uuid,
  p_allowed_roles text[],
  p_action text default 'profitability operation'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_business_member(p_business_id);

  if not public.has_business_role(p_business_id, p_allowed_roles) then
    raise exception 'Insufficient role for %', p_action using errcode = '42501';
  end if;
end;
$$;

create or replace function public.create_or_update_technical_sheet(
  p_business_id uuid,
  p_technical_sheet_id uuid default null,
  p_sheet jsonb default '{}'::jsonb,
  p_components jsonb default '[]'::jsonb,
  p_activate boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sheet_id uuid;
  v_version_id uuid;
  v_component jsonb;
  v_components jsonb := coalesce(p_components, p_sheet->'components', '[]'::jsonb);
  v_yield_data jsonb := coalesce(p_sheet->'yield', p_sheet->'yield_data', '{}'::jsonb);
  v_costing_payload jsonb := coalesce(p_sheet->'costing', '{}'::jsonb);
  v_sale_price numeric(14, 4);
  v_target_food_cost numeric(10, 4);
  v_costing jsonb;
  v_version_number integer;
  v_product_id uuid := nullif(p_sheet->>'product_id', '')::uuid;
  v_name text := nullif(trim(coalesce(p_sheet->>'name', '')), '');
begin
  perform public.assert_profitability_role(
    p_business_id,
    array['owner', 'admin', 'manager'],
    'technical sheet write'
  );

  if v_name is null then
    raise exception 'Technical sheet name is required' using errcode = '22023';
  end if;

  if jsonb_typeof(v_components) <> 'array' or jsonb_array_length(v_components) = 0 then
    raise exception 'Technical sheet must include at least one component' using errcode = '22023';
  end if;

  v_sale_price := coalesce(
    nullif(v_costing_payload->>'currentSalePrice', '')::numeric,
    nullif(v_costing_payload->>'current_sale_price', '')::numeric,
    nullif(p_sheet->>'sale_price', '')::numeric,
    0
  );
  v_target_food_cost := coalesce(
    nullif(v_costing_payload->>'targetFoodCost', '')::numeric,
    nullif(v_costing_payload->>'target_food_cost', '')::numeric,
    30
  );
  v_costing := public.profitability_build_costing(v_components, v_yield_data, v_sale_price, v_target_food_cost);

  if p_technical_sheet_id is null then
    insert into public.technical_sheets (
      business_id, product_id, name, code, type, category, status, description, responsible,
      product_name, sale_price, yield_data, procedure, plating, costing, bi, metadata, created_by, updated_by
    )
    values (
      p_business_id,
      v_product_id,
      v_name,
      coalesce(p_sheet->>'code', ''),
      coalesce(nullif(p_sheet->>'type', ''), 'final_product'),
      coalesce(p_sheet->>'category', ''),
      case when p_activate then 'active' else coalesce(nullif(p_sheet->>'status', ''), 'draft') end,
      coalesce(p_sheet->>'description', ''),
      coalesce(p_sheet->>'responsible', ''),
      coalesce(p_sheet->>'product_name', v_name),
      v_sale_price,
      v_yield_data,
      coalesce(p_sheet->'procedure', '{}'::jsonb),
      coalesce(p_sheet->'plating', '{}'::jsonb),
      v_costing,
      coalesce(p_sheet->'bi', '{}'::jsonb),
      coalesce(p_sheet->'metadata', '{}'::jsonb),
      auth.uid(),
      auth.uid()
    )
    returning id into v_sheet_id;
  else
    update public.technical_sheets
    set
      product_id = v_product_id,
      name = v_name,
      code = coalesce(p_sheet->>'code', code),
      type = coalesce(nullif(p_sheet->>'type', ''), type),
      category = coalesce(p_sheet->>'category', category),
      status = case when p_activate then 'active' else coalesce(nullif(p_sheet->>'status', ''), status) end,
      description = coalesce(p_sheet->>'description', description),
      responsible = coalesce(p_sheet->>'responsible', responsible),
      product_name = coalesce(p_sheet->>'product_name', product_name, v_name),
      sale_price = v_sale_price,
      yield_data = v_yield_data,
      procedure = coalesce(p_sheet->'procedure', procedure),
      plating = coalesce(p_sheet->'plating', plating),
      costing = v_costing,
      bi = coalesce(p_sheet->'bi', bi),
      metadata = coalesce(metadata, '{}'::jsonb) || coalesce(p_sheet->'metadata', '{}'::jsonb),
      updated_by = auth.uid(),
      deactivated_at = case when coalesce(p_sheet->>'status', '') = 'inactive' then now() else deactivated_at end
    where id = p_technical_sheet_id
      and business_id = p_business_id
    returning id into v_sheet_id;

    if v_sheet_id is null then
      raise exception 'Technical sheet not found' using errcode = 'P0002';
    end if;

    delete from public.technical_sheet_items
    where technical_sheet_id = v_sheet_id
      and business_id = p_business_id;
  end if;

  for v_component in select value from jsonb_array_elements(v_components)
  loop
    if coalesce(nullif(v_component->>'quantity', '')::numeric, 0) <= 0 then
      raise exception 'Technical sheet component quantity must be positive' using errcode = '22003';
    end if;

    if coalesce(nullif(coalesce(v_component->>'sourceType', v_component->>'source_type'), ''), 'raw_item') = 'raw_item'
      and not exists (
        select 1
        from public.supplies
        where id = nullif(coalesce(v_component->>'sourceId', v_component->>'source_id'), '')::uuid
          and business_id = p_business_id
      ) then
      raise exception 'Supply not found for technical sheet component' using errcode = 'P0002';
    end if;

    if coalesce(nullif(coalesce(v_component->>'sourceType', v_component->>'source_type'), ''), 'raw_item') = 'technical_sheet'
      and (
        nullif(coalesce(v_component->>'sourceId', v_component->>'source_id'), '')::uuid = v_sheet_id
        or not exists (
          select 1
          from public.technical_sheets
          where id = nullif(coalesce(v_component->>'sourceId', v_component->>'source_id'), '')::uuid
            and business_id = p_business_id
            and status = 'active'
            and active_version_id is not null
        )
      ) then
      raise exception 'Active source technical sheet not found for component' using errcode = 'P0002';
    end if;

    insert into public.technical_sheet_items (
      business_id, technical_sheet_id, source_type, source_id, name, quantity, unit,
      unit_cost, total_cost, waste_percent, notes, sort_order, metadata
    )
    values (
      p_business_id,
      v_sheet_id,
      coalesce(nullif(coalesce(v_component->>'sourceType', v_component->>'source_type'), ''), 'raw_item'),
      nullif(coalesce(v_component->>'sourceId', v_component->>'source_id'), '')::uuid,
      coalesce(nullif(v_component->>'name', ''), 'Componente'),
      coalesce(nullif(v_component->>'quantity', '')::numeric, 0),
      coalesce(nullif(v_component->>'unit', ''), 'und'),
      coalesce(nullif(coalesce(v_component->>'unitCost', v_component->>'unit_cost'), '')::numeric, 0),
      public.profitability_component_cost(
        coalesce(nullif(v_component->>'quantity', '')::numeric, 0),
        coalesce(nullif(coalesce(v_component->>'unitCost', v_component->>'unit_cost'), '')::numeric, 0),
        coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0)
      ),
      public.profitability_normalize_percent(
        coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0),
        0
      ) * 100,
      coalesce(v_component->>'notes', ''),
      coalesce(nullif(v_component->>'sort_order', '')::integer, 0),
      jsonb_build_object('client_payload', v_component)
    );
  end loop;

  select coalesce(max(version_number), 0) + 1
  into v_version_number
  from public.technical_sheet_versions
  where technical_sheet_id = v_sheet_id;

  insert into public.technical_sheet_versions (
    business_id, technical_sheet_id, version_number, status, yield_data, components, costing, metadata, created_by
  )
  values (
    p_business_id, v_sheet_id, v_version_number, case when p_activate then 'active' else 'draft' end,
    v_yield_data, v_components, v_costing, jsonb_build_object('source', 'create_or_update_technical_sheet'), auth.uid()
  )
  returning id into v_version_id;

  if p_activate then
    perform public.activate_technical_sheet_version(p_business_id, v_sheet_id, v_version_id);
  end if;

  insert into public.audit_logs (business_id, user_id, module, action, entity_type, entity_id, new_value, reason)
  values (
    p_business_id, auth.uid(), 'profitability',
    case when p_technical_sheet_id is null then 'technical_sheet.create' else 'technical_sheet.update' end,
    'technical_sheets', v_sheet_id::text,
    jsonb_build_object('technical_sheet_id', v_sheet_id, 'version_id', v_version_id, 'costing', v_costing),
    nullif(p_sheet->>'reason', '')
  );

  return jsonb_build_object(
    'technical_sheet_id', v_sheet_id,
    'technical_sheet_version_id', v_version_id,
    'version_id', v_version_id,
    'status', case when p_activate then 'active' else 'draft' end,
    'costing', v_costing
  );
end;
$$;

create or replace function public.activate_technical_sheet_version(
  p_business_id uuid,
  p_technical_sheet_id uuid,
  p_version_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version public.technical_sheet_versions%rowtype;
  v_product_id uuid;
  v_cost_per_portion numeric(14, 4);
begin
  perform public.assert_profitability_role(
    p_business_id,
    array['owner', 'admin', 'manager'],
    'technical sheet activation'
  );

  perform 1
  from public.technical_sheets
  where id = p_technical_sheet_id and business_id = p_business_id
  for update;

  if not found then
    raise exception 'Technical sheet not found' using errcode = 'P0002';
  end if;

  select * into v_version
  from public.technical_sheet_versions
  where id = p_version_id and business_id = p_business_id and technical_sheet_id = p_technical_sheet_id
  for update;

  if not found then
    raise exception 'Technical sheet version not found' using errcode = 'P0002';
  end if;

  update public.technical_sheet_versions
  set status = 'inactive'
  where business_id = p_business_id
    and technical_sheet_id = p_technical_sheet_id
    and id <> p_version_id
    and status = 'active';

  update public.technical_sheet_versions
  set status = 'active', activated_at = now()
  where id = p_version_id;

  update public.technical_sheets
  set active_version_id = p_version_id,
      status = 'active',
      costing = v_version.costing,
      yield_data = v_version.yield_data,
      deactivated_at = null
  where id = p_technical_sheet_id
  returning product_id into v_product_id;

  v_cost_per_portion := coalesce(nullif(v_version.costing->>'costPerPortion', '')::numeric, 0);

  if v_product_id is not null then
    update public.products
    set
      cost = v_cost_per_portion,
      product_type = case when product_type = 'standard' then 'prepared' else product_type end,
      inventory = coalesce(inventory, '{}'::jsonb) || jsonb_build_object(
        'technical_sheet_id', p_technical_sheet_id,
        'technical_sheet_version_id', p_version_id,
        'inventoryImpact', 'technical_sheet'
      ),
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'profitability', jsonb_build_object(
          'technical_sheet_id', p_technical_sheet_id,
          'technical_sheet_version_id', p_version_id,
          'costing', v_version.costing
        )
      )
    where id = v_product_id and business_id = p_business_id;

    insert into public.product_cost_snapshots (
      business_id, product_id, technical_sheet_id, technical_sheet_version_id, source_type,
      unit_cost, total_cost, sale_price, food_cost_percent, gross_margin, gross_margin_percent, ingredients_snapshot
    )
    values (
      p_business_id, v_product_id, p_technical_sheet_id, p_version_id, 'technical_sheet_activation',
      v_cost_per_portion,
      coalesce(nullif(v_version.costing->>'totalCost', '')::numeric, 0),
      coalesce(nullif(v_version.costing->>'currentSalePrice', '')::numeric, 0),
      coalesce(nullif(v_version.costing->>'foodCostPercent', '')::numeric, 0),
      coalesce(nullif(v_version.costing->>'grossMargin', '')::numeric, 0),
      coalesce(nullif(v_version.costing->>'grossMarginPercent', '')::numeric, 0),
      v_version.components
    );
  end if;

  return jsonb_build_object('technical_sheet_id', p_technical_sheet_id, 'version_id', p_version_id, 'status', 'active');
end;
$$;

create or replace function public.recalculate_product_cost(
  p_business_id uuid,
  p_product_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sheet public.technical_sheets%rowtype;
  v_version public.technical_sheet_versions%rowtype;
begin
  perform public.assert_profitability_role(
    p_business_id,
    array['owner', 'admin', 'manager'],
    'product cost recalculation'
  );

  select * into v_sheet
  from public.technical_sheets
  where business_id = p_business_id
    and product_id = p_product_id
    and status = 'active'
  order by updated_at desc
  limit 1;

  if not found or v_sheet.active_version_id is null then
    raise exception 'Active technical sheet not found for product' using errcode = 'P0002';
  end if;

  select * into v_version
  from public.technical_sheet_versions
  where id = v_sheet.active_version_id and business_id = p_business_id;

  if not found then
    raise exception 'Active technical sheet version not found' using errcode = 'P0002';
  end if;

  perform public.activate_technical_sheet_version(p_business_id, v_sheet.id, v_version.id);

  return jsonb_build_object(
    'product_id', p_product_id,
    'technical_sheet_id', v_sheet.id,
    'technical_sheet_version_id', v_version.id,
    'costing', v_version.costing
  );
end;
$$;

create or replace function public.close_sale_with_inventory_explosion(
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
  v_sale_item_id uuid;
  v_cash_session_id uuid;
  v_subtotal numeric(12, 2);
  v_total numeric(12, 2);
  v_paid_amount numeric(12, 2);
  v_pending_amount numeric(12, 2);
  v_item jsonb;
  v_payment jsonb;
  v_payment_id uuid;
  v_product_id uuid;
  v_sheet public.technical_sheets%rowtype;
  v_version public.technical_sheet_versions%rowtype;
  v_component jsonb;
  v_supply public.supplies%rowtype;
  v_quantity numeric(14, 4);
  v_sale_quantity numeric(14, 4);
  v_portions numeric(14, 4);
  v_required_quantity numeric(14, 4);
  v_stock_went_negative boolean;
  v_allow_negative_stock boolean;
  v_profitability_snapshot jsonb;
  v_sale_price numeric(14, 4);
  v_unit_cost numeric(14, 4);
  v_total_cost numeric(14, 4);
  v_source_sheet public.technical_sheets%rowtype;
  v_source_version public.technical_sheet_versions%rowtype;
  v_nested_component jsonb;
  v_parent_required_quantity numeric(14, 4);
  v_source_portions numeric(14, 4);
begin
  perform public.assert_profitability_role(
    p_business_id,
    array['owner', 'admin', 'manager', 'cashier', 'waiter'],
    'sale close with inventory explosion'
  );

  v_allow_negative_stock := coalesce(
    (select (settings->'inventory'->>'allow_negative_stock')::boolean
     from public.business_settings
     where business_id = p_business_id),
    false
  );

  v_cash_session_id := nullif(p_sale->>'cash_session_id', '')::uuid;
  v_subtotal := coalesce(nullif(p_sale->>'subtotal', '')::numeric, 0);
  v_total := coalesce(nullif(p_sale->>'total', '')::numeric, v_subtotal, 0);

  if v_total < 0 then
    raise exception 'Sale total cannot be negative' using errcode = '22003';
  end if;

  if v_cash_session_id is not null and not exists (
    select 1 from public.cash_sessions
    where id = v_cash_session_id and business_id = p_business_id and status = 'open'
  ) then
    raise exception 'Open cash session not found for sale' using errcode = 'P0002';
  end if;

  select coalesce(sum(coalesce(nullif(payment_item.value->>'amount', '')::numeric, 0)), 0)
  into v_paid_amount
  from jsonb_array_elements(p_payments) as payment_item(value);

  v_pending_amount := greatest(v_total - v_paid_amount, 0);

  insert into public.sales (
    business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type,
    status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount,
    closed_at, metadata
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
    jsonb_build_object('client_payload', p_sale, 'inventory_explosion', true)
  )
  returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    v_sale_quantity := coalesce(nullif(v_item->>'quantity', '')::numeric, 1);
    v_sale_price := coalesce(nullif(v_item->>'unit_price', '')::numeric, nullif(v_item->>'price', '')::numeric, 0);

    v_sheet := null;
    v_version := null;
    v_profitability_snapshot := null;

    if v_product_id is not null then
      select * into v_sheet
      from public.technical_sheets
      where business_id = p_business_id
        and product_id = v_product_id
        and status = 'active'
        and active_version_id is not null
      order by updated_at desc
      limit 1;

      if v_sheet.id is not null then
        select * into v_version
        from public.technical_sheet_versions
        where id = v_sheet.active_version_id and business_id = p_business_id;
      end if;
    end if;

    if v_version.id is not null then
      v_unit_cost := coalesce(nullif(v_version.costing->>'costPerPortion', '')::numeric, 0);
      v_total_cost := v_unit_cost * v_sale_quantity;
      v_profitability_snapshot := jsonb_build_object(
        'technical_sheet_id', v_sheet.id,
        'technical_sheet_version_id', v_version.id,
        'unit_cost_snapshot', v_unit_cost,
        'total_cost_snapshot', v_total_cost,
        'sale_price_snapshot', v_sale_price,
        'food_cost_percent_snapshot', case when v_sale_price > 0 then (v_unit_cost / v_sale_price) * 100 else 0 end,
        'gross_margin_snapshot', v_sale_price - v_unit_cost,
        'gross_margin_percent_snapshot', case when v_sale_price > 0 then ((v_sale_price - v_unit_cost) / v_sale_price) * 100 else 0 end,
        'ingredients_snapshot', v_version.components
      );
    end if;

    insert into public.sale_items (
      business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, metadata
    )
    values (
      p_business_id,
      v_sale_id,
      v_product_id,
      coalesce(nullif(v_item->>'product_name', ''), nullif(v_item->>'name', ''), 'Producto'),
      v_sale_quantity,
      v_sale_price,
      coalesce(nullif(v_item->>'subtotal', '')::numeric, v_sale_price * v_sale_quantity),
      jsonb_build_object('client_payload', v_item) ||
        case when v_profitability_snapshot is null then '{}'::jsonb else jsonb_build_object('profitability_snapshot', v_profitability_snapshot) end
    )
    returning id into v_sale_item_id;

    if v_version.id is not null then
      v_portions := coalesce(nullif(v_version.yield_data->>'portions', '')::numeric, 1);
      if v_portions <= 0 then v_portions := 1; end if;

      for v_component in select value from jsonb_array_elements(v_version.components)
      loop
        if coalesce(coalesce(v_component->>'sourceType', v_component->>'source_type'), 'raw_item') = 'raw_item' then
          select * into v_supply
          from public.supplies
          where id = nullif(coalesce(v_component->>'sourceId', v_component->>'source_id'), '')::uuid
            and business_id = p_business_id
          for update;

          if not found then
            raise exception 'Supply not found for technical sheet component' using errcode = 'P0002';
          end if;

          v_quantity := coalesce(nullif(v_component->>'quantity', '')::numeric, 0);
          v_required_quantity :=
            (v_quantity / v_portions)
            * v_sale_quantity
            * case
                when public.profitability_normalize_percent(
                  coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0),
                  0
                ) > 0
                  then 1 / greatest(1 - public.profitability_normalize_percent(
                    coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0),
                    0
                  ), 0.01)
                else 1
              end;

          v_stock_went_negative := (v_supply.current_stock - v_required_quantity) < 0;

          if v_stock_went_negative and not v_allow_negative_stock then
            raise exception 'Insufficient stock for supply %', v_supply.name using errcode = 'P0001';
          end if;

          update public.supplies
          set current_stock = current_stock - v_required_quantity,
              last_purchase_cost = coalesce(last_purchase_cost, v_supply.last_purchase_cost)
          where id = v_supply.id;

          insert into public.inventory_movements (
            business_id, product_id, source_type, source_id, movement_type, direction,
            quantity, unit_cost, status, metadata
          )
          values (
            p_business_id, v_product_id, 'sale', v_sale_id, 'sale_out', 'out',
            v_required_quantity, coalesce(v_supply.average_cost, 0), 'valid',
            jsonb_build_object(
              'sale_item_id', v_sale_item_id,
              'technical_sheet_id', v_sheet.id,
              'technical_sheet_version_id', v_version.id,
              'supply_id', v_supply.id,
              'supply_name', v_supply.name,
              'stock_before', v_supply.current_stock,
              'stock_after', v_supply.current_stock - v_required_quantity,
              'stock_went_negative', v_stock_went_negative
            )
          );
        elsif coalesce(coalesce(v_component->>'sourceType', v_component->>'source_type'), 'raw_item') = 'technical_sheet' then
          select * into v_source_sheet
          from public.technical_sheets
          where id = nullif(coalesce(v_component->>'sourceId', v_component->>'source_id'), '')::uuid
            and business_id = p_business_id
            and status = 'active'
            and active_version_id is not null;

          if not found then
            raise exception 'Active source technical sheet not found for component' using errcode = 'P0002';
          end if;

          select * into v_source_version
          from public.technical_sheet_versions
          where id = v_source_sheet.active_version_id
            and business_id = p_business_id;

          if not found then
            raise exception 'Active source technical sheet version not found for component' using errcode = 'P0002';
          end if;

          v_quantity := coalesce(nullif(v_component->>'quantity', '')::numeric, 0);
          v_parent_required_quantity :=
            (v_quantity / v_portions)
            * v_sale_quantity
            * case
                when public.profitability_normalize_percent(
                  coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0),
                  0
                ) > 0
                  then 1 / greatest(1 - public.profitability_normalize_percent(
                    coalesce(nullif(coalesce(v_component->>'wastePercent', v_component->>'waste_percent'), '')::numeric, 0),
                    0
                  ), 0.01)
                else 1
              end;

          v_source_portions := coalesce(nullif(v_source_version.yield_data->>'portions', '')::numeric, 1);
          if v_source_portions <= 0 then v_source_portions := 1; end if;

          for v_nested_component in select value from jsonb_array_elements(v_source_version.components)
          loop
            if coalesce(coalesce(v_nested_component->>'sourceType', v_nested_component->>'source_type'), 'raw_item') <> 'raw_item' then
              raise exception 'Nested technical sheets deeper than one level are not supported in Phase 2' using errcode = 'P0001';
            end if;

            select * into v_supply
            from public.supplies
            where id = nullif(coalesce(v_nested_component->>'sourceId', v_nested_component->>'source_id'), '')::uuid
              and business_id = p_business_id
            for update;

            if not found then
              raise exception 'Supply not found for nested technical sheet component' using errcode = 'P0002';
            end if;

            v_required_quantity :=
              (
                coalesce(nullif(v_nested_component->>'quantity', '')::numeric, 0)
                / v_source_portions
              )
              * v_parent_required_quantity
              * case
                  when public.profitability_normalize_percent(
                    coalesce(nullif(coalesce(v_nested_component->>'wastePercent', v_nested_component->>'waste_percent'), '')::numeric, 0),
                    0
                  ) > 0
                    then 1 / greatest(1 - public.profitability_normalize_percent(
                      coalesce(nullif(coalesce(v_nested_component->>'wastePercent', v_nested_component->>'waste_percent'), '')::numeric, 0),
                      0
                    ), 0.01)
                  else 1
                end;

            v_stock_went_negative := (v_supply.current_stock - v_required_quantity) < 0;

            if v_stock_went_negative and not v_allow_negative_stock then
              raise exception 'Insufficient stock for supply %', v_supply.name using errcode = 'P0001';
            end if;

            update public.supplies
            set current_stock = current_stock - v_required_quantity
            where id = v_supply.id;

            insert into public.inventory_movements (
              business_id, product_id, source_type, source_id, movement_type, direction,
              quantity, unit_cost, status, metadata
            )
            values (
              p_business_id, v_product_id, 'sale', v_sale_id, 'sale_out', 'out',
              v_required_quantity, coalesce(v_supply.average_cost, 0), 'valid',
              jsonb_build_object(
                'sale_item_id', v_sale_item_id,
                'technical_sheet_id', v_sheet.id,
                'technical_sheet_version_id', v_version.id,
                'source_technical_sheet_id', v_source_sheet.id,
                'source_technical_sheet_version_id', v_source_version.id,
                'supply_id', v_supply.id,
                'supply_name', v_supply.name,
                'stock_before', v_supply.current_stock,
                'stock_after', v_supply.current_stock - v_required_quantity,
                'stock_went_negative', v_stock_went_negative
              )
            );
          end loop;
        end if;
      end loop;

      insert into public.product_cost_snapshots (
        business_id, product_id, technical_sheet_id, technical_sheet_version_id, sale_id, sale_item_id,
        source_type, unit_cost, total_cost, sale_price, food_cost_percent, gross_margin,
        gross_margin_percent, ingredients_snapshot
      )
      values (
        p_business_id, v_product_id, v_sheet.id, v_version.id, v_sale_id, v_sale_item_id,
        'sale_close',
        v_unit_cost,
        v_total_cost,
        v_sale_price,
        coalesce(nullif(v_profitability_snapshot->>'food_cost_percent_snapshot', '')::numeric, 0),
        coalesce(nullif(v_profitability_snapshot->>'gross_margin_snapshot', '')::numeric, 0),
        coalesce(nullif(v_profitability_snapshot->>'gross_margin_percent_snapshot', '')::numeric, 0),
        v_version.components
      );
    end if;
  end loop;

  for v_payment in select value from jsonb_array_elements(p_payments)
  loop
    insert into public.payments (
      business_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata
    )
    values (
      p_business_id, v_sale_id, v_cash_session_id,
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
        business_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description
      )
      values (
        p_business_id, v_cash_session_id, v_sale_id, v_payment_id, 'sale_income',
        coalesce(nullif(v_payment->>'method', ''), 'cash'),
        coalesce(nullif(v_payment->>'amount', '')::numeric, 0),
        'valid',
        'Ingreso por venta'
      );
    end if;
  end loop;

  insert into public.audit_logs (business_id, user_id, module, action, entity_type, entity_id, new_value, reason)
  values (
    p_business_id, auth.uid(), 'sales', 'sale.close_with_inventory_explosion', 'sales', v_sale_id::text,
    jsonb_build_object('total', v_total, 'paid_amount', v_paid_amount, 'pending_amount', v_pending_amount),
    nullif(p_sale->>'reason', '')
  );

  return v_sale_id;
end;
$$;

create or replace function public.reverse_inventory_explosion(
  p_business_id uuid,
  p_sale_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_movement public.inventory_movements%rowtype;
  v_supply_id uuid;
  v_reversed integer := 0;
begin
  perform public.assert_profitability_role(
    p_business_id,
    array['owner', 'admin', 'manager'],
    'inventory explosion reversal'
  );

  for v_movement in
    select *
    from public.inventory_movements
    where business_id = p_business_id
      and source_type = 'sale'
      and source_id = p_sale_id
      and movement_type = 'sale_out'
      and status = 'valid'
    for update
  loop
    v_supply_id := nullif(v_movement.metadata->>'supply_id', '')::uuid;

    if v_supply_id is not null then
      update public.supplies
      set current_stock = current_stock + v_movement.quantity
      where id = v_supply_id and business_id = p_business_id;
    end if;

    update public.inventory_movements
    set status = 'reversed',
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('reversed_at', now(), 'reverse_reason', p_reason)
    where id = v_movement.id;

    insert into public.inventory_movements (
      business_id, product_id, source_type, source_id, movement_type, direction,
      quantity, unit_cost, status, metadata
    )
    values (
      p_business_id, v_movement.product_id, 'sale_reversal', p_sale_id, 'reversal', 'in',
      v_movement.quantity, v_movement.unit_cost, 'valid',
      jsonb_build_object('reversed_movement_id', v_movement.id, 'supply_id', v_supply_id, 'reason', p_reason)
    );

    v_reversed := v_reversed + 1;
  end loop;

  insert into public.audit_logs (business_id, user_id, module, action, entity_type, entity_id, new_value, reason)
  values (
    p_business_id, auth.uid(), 'profitability', 'inventory_explosion.reverse', 'sales', p_sale_id::text,
    jsonb_build_object('reversed_movements', v_reversed),
    p_reason
  );

  return jsonb_build_object('sale_id', p_sale_id, 'reversed_movements', v_reversed);
end;
$$;
