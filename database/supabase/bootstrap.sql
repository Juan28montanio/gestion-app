-- Bootstrap helpers for the first Supabase users and businesses.
-- Run after schema.sql and rls.sql.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    display_name,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1),
      ''
    ),
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = case
      when public.profiles.display_name = '' then excluded.display_name
      else public.profiles.display_name
    end,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.bootstrap_business_for_current_user(
  p_business_name text,
  p_display_name text default null,
  p_legacy_firebase_uid text default null,
  p_legacy_firebase_business_id text default null
)
returns table (
  business_id uuid,
  profile_id uuid,
  business_user_id uuid,
  was_created boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_display_name text;
  v_business_name text := nullif(trim(coalesce(p_business_name, '')), '');
  v_existing_business_id uuid;
  v_business_id uuid;
  v_business_user_id uuid;
  v_was_created boolean := false;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion en Supabase para inicializar el negocio.'
      using errcode = '28000';
  end if;

  select
    coalesce(email, ''),
    coalesce(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'name', '')
  into v_email, v_display_name
  from auth.users
  where id = v_user_id;

  v_display_name := nullif(trim(coalesce(p_display_name, v_display_name, split_part(v_email, '@', 1), '')), '');

  if v_business_name is null then
    raise exception 'El nombre del negocio es obligatorio.'
      using errcode = '22023';
  end if;

  insert into public.profiles (
    id,
    legacy_firebase_uid,
    email,
    display_name,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    nullif(trim(coalesce(p_legacy_firebase_uid, '')), ''),
    v_email,
    coalesce(v_display_name, ''),
    now(),
    now()
  )
  on conflict (id) do update
  set
    legacy_firebase_uid = coalesce(public.profiles.legacy_firebase_uid, excluded.legacy_firebase_uid),
    email = excluded.email,
    display_name = case
      when excluded.display_name <> '' then excluded.display_name
      else public.profiles.display_name
    end,
    updated_at = now();

  select bu.business_id
  into v_existing_business_id
  from public.business_users bu
  where bu.user_id = v_user_id
    and bu.status = 'active'
  order by bu.created_at asc
  limit 1;

  if v_existing_business_id is not null then
    select bu.id
    into v_business_user_id
    from public.business_users bu
    where bu.business_id = v_existing_business_id
      and bu.user_id = v_user_id
    limit 1;

    return query select v_existing_business_id, v_user_id, v_business_user_id, false;
    return;
  end if;

  insert into public.businesses (
    legacy_firebase_id,
    name,
    owner_user_id,
    status,
    metadata,
    created_at,
    updated_at
  )
  values (
    nullif(trim(coalesce(p_legacy_firebase_business_id, '')), ''),
    v_business_name,
    v_user_id,
    'active',
    jsonb_build_object('bootstrap_source', 'supabase_rpc'),
    now(),
    now()
  )
  returning id into v_business_id;

  v_was_created := true;

  insert into public.business_users (
    business_id,
    user_id,
    role,
    status,
    display_name,
    email,
    created_at,
    updated_at
  )
  values (
    v_business_id,
    v_user_id,
    'owner',
    'active',
    coalesce(v_display_name, ''),
    v_email,
    now(),
    now()
  )
  returning id into v_business_user_id;

  insert into public.business_settings (
    business_id,
    settings,
    created_at,
    updated_at
  )
  values (
    v_business_id,
    jsonb_build_object(
      'cash', jsonb_build_object(
        'require_open_cash_session', true,
        'allow_sales_without_cash_session', false,
        'max_closing_difference', 0
      ),
      'pos', jsonb_build_object(
        'allow_discounts', true,
        'allow_credit_sales', true,
        'require_customer_for_debt', true
      ),
      'inventory', jsonb_build_object(
        'alert_low_stock', true,
        'allow_negative_stock', false
      )
    ),
    now(),
    now()
  )
  on conflict on constraint business_settings_pkey do nothing;

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    new_value,
    reason,
    created_at
  )
  values (
    v_business_id,
    v_user_id,
    'bootstrap',
    'business.bootstrap',
    'business',
    v_business_id::text,
    jsonb_build_object(
      'business_name', v_business_name,
      'legacy_firebase_uid', p_legacy_firebase_uid,
      'legacy_firebase_business_id', p_legacy_firebase_business_id
    ),
    'Inicializacion controlada de negocio en Supabase',
    now()
  );

  return query select v_business_id, v_user_id, v_business_user_id, v_was_created;
end;
$$;

grant execute on function public.bootstrap_business_for_current_user(text, text, text, text) to authenticated;

create or replace function public.admin_bootstrap_business_for_auth_user(
  p_user_email text,
  p_business_name text,
  p_display_name text default null,
  p_legacy_firebase_uid text default null,
  p_legacy_firebase_business_id text default null
)
returns table (
  business_id uuid,
  profile_id uuid,
  business_user_id uuid,
  was_created boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text := lower(nullif(trim(coalesce(p_user_email, '')), ''));
  v_display_name text;
  v_business_name text := nullif(trim(coalesce(p_business_name, '')), '');
  v_existing_business_id uuid;
  v_business_id uuid;
  v_business_user_id uuid;
  v_was_created boolean := false;
begin
  if v_email is null then
    raise exception 'El email del usuario Supabase es obligatorio.'
      using errcode = '22023';
  end if;

  if v_business_name is null then
    raise exception 'El nombre del negocio es obligatorio.'
      using errcode = '22023';
  end if;

  select id, coalesce(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'name', '')
  into v_user_id, v_display_name
  from auth.users
  where lower(email) = v_email
  limit 1;

  if v_user_id is null then
    raise exception 'No existe un usuario Supabase Auth con email %.', v_email
      using errcode = '22023';
  end if;

  v_display_name := nullif(trim(coalesce(p_display_name, v_display_name, split_part(v_email, '@', 1), '')), '');

  insert into public.profiles (
    id,
    legacy_firebase_uid,
    email,
    display_name,
    created_at,
    updated_at
  )
  values (
    v_user_id,
    nullif(trim(coalesce(p_legacy_firebase_uid, '')), ''),
    v_email,
    coalesce(v_display_name, ''),
    now(),
    now()
  )
  on conflict (id) do update
  set
    legacy_firebase_uid = coalesce(public.profiles.legacy_firebase_uid, excluded.legacy_firebase_uid),
    email = excluded.email,
    display_name = case
      when excluded.display_name <> '' then excluded.display_name
      else public.profiles.display_name
    end,
    updated_at = now();

  select bu.business_id
  into v_existing_business_id
  from public.business_users bu
  where bu.user_id = v_user_id
    and bu.status = 'active'
  order by bu.created_at asc
  limit 1;

  if v_existing_business_id is not null then
    select bu.id
    into v_business_user_id
    from public.business_users bu
    where bu.business_id = v_existing_business_id
      and bu.user_id = v_user_id
    limit 1;

    return query select v_existing_business_id, v_user_id, v_business_user_id, false;
    return;
  end if;

  insert into public.businesses (
    legacy_firebase_id,
    name,
    owner_user_id,
    status,
    metadata,
    created_at,
    updated_at
  )
  values (
    nullif(trim(coalesce(p_legacy_firebase_business_id, '')), ''),
    v_business_name,
    v_user_id,
    'active',
    jsonb_build_object('bootstrap_source', 'admin_sql'),
    now(),
    now()
  )
  returning id into v_business_id;

  v_was_created := true;

  insert into public.business_users (
    business_id,
    user_id,
    role,
    status,
    display_name,
    email,
    created_at,
    updated_at
  )
  values (
    v_business_id,
    v_user_id,
    'owner',
    'active',
    coalesce(v_display_name, ''),
    v_email,
    now(),
    now()
  )
  returning id into v_business_user_id;

  insert into public.business_settings (
    business_id,
    settings,
    created_at,
    updated_at
  )
  values (
    v_business_id,
    jsonb_build_object(
      'cash', jsonb_build_object(
        'require_open_cash_session', true,
        'allow_sales_without_cash_session', false,
        'max_closing_difference', 0
      ),
      'pos', jsonb_build_object(
        'allow_discounts', true,
        'allow_credit_sales', true,
        'require_customer_for_debt', true
      ),
      'inventory', jsonb_build_object(
        'alert_low_stock', true,
        'allow_negative_stock', false
      )
    ),
    now(),
    now()
  )
  on conflict on constraint business_settings_pkey do nothing;

  insert into public.audit_logs (
    business_id,
    user_id,
    module,
    action,
    entity_type,
    entity_id,
    new_value,
    reason,
    created_at
  )
  values (
    v_business_id,
    v_user_id,
    'bootstrap',
    'business.admin_bootstrap',
    'business',
    v_business_id::text,
    jsonb_build_object(
      'business_name', v_business_name,
      'legacy_firebase_uid', p_legacy_firebase_uid,
      'legacy_firebase_business_id', p_legacy_firebase_business_id
    ),
    'Inicializacion admin de negocio en Supabase',
    now()
  );

  return query select v_business_id, v_user_id, v_business_user_id, v_was_created;
end;
$$;

revoke all on function public.admin_bootstrap_business_for_auth_user(text, text, text, text, text) from public;
revoke all on function public.admin_bootstrap_business_for_auth_user(text, text, text, text, text) from anon;
revoke all on function public.admin_bootstrap_business_for_auth_user(text, text, text, text, text) from authenticated;

-- One-time SQL Editor example after creating the Supabase Auth user:
-- select * from public.admin_bootstrap_business_for_auth_user(
--   'katteryneramos@gmail.com',
--   'Nombre del negocio',
--   'Nombre del administrador',
--   'QFVrzOvmv0hSqlTYbYMEFS8UCPA3',
--   'business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3'
-- );
