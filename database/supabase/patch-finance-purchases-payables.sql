-- Apply after core Supabase migration. Adds purchases, purchase items, accounts payable and finance RPCs.

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
create index if not exists purchase_items_purchase_idx on public.purchase_items(purchase_id);
create index if not exists accounts_payable_business_status_idx on public.accounts_payable(business_id, status);

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