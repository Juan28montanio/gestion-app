-- Generated Firebase -> Supabase import for TIDE BY PACIFICA.

-- Run this after schema.sql, rls.sql and bootstrap.sql.

begin;



-- Idempotency helpers for legacy Firebase IDs.

alter table public.payments add column if not exists legacy_firebase_id text;

alter table public.cash_sessions add column if not exists legacy_firebase_id text;

alter table public.cash_movements add column if not exists legacy_firebase_id text;

alter table public.inventory_movements add column if not exists legacy_firebase_id text;

create unique index if not exists product_categories_business_name_unique_idx on public.product_categories (business_id, name);

create unique index if not exists suppliers_business_legacy_unique_idx on public.suppliers (business_id, legacy_firebase_id) where legacy_firebase_id is not null;

create unique index if not exists customers_business_legacy_unique_idx on public.customers (business_id, legacy_firebase_id) where legacy_firebase_id is not null;

create unique index if not exists products_business_legacy_unique_idx on public.products (business_id, legacy_firebase_id) where legacy_firebase_id is not null;

create unique index if not exists sales_business_legacy_unique_idx on public.sales (business_id, legacy_firebase_id) where legacy_firebase_id is not null;

create unique index if not exists payments_business_legacy_unique_idx on public.payments (business_id, legacy_firebase_id) where legacy_firebase_id is not null;

create unique index if not exists cash_sessions_business_legacy_unique_idx on public.cash_sessions (business_id, legacy_firebase_id) where legacy_firebase_id is not null;

create unique index if not exists cash_movements_business_legacy_unique_idx on public.cash_movements (business_id, legacy_firebase_id) where legacy_firebase_id is not null;

create unique index if not exists inventory_movements_business_legacy_unique_idx on public.inventory_movements (business_id, legacy_firebase_id) where legacy_firebase_id is not null;



insert into public.product_categories (id, business_id, name, sort_order, status, created_at, updated_at)
values ('afddd7e4-f21f-5ba7-b771-2630f419b95f', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Almuerzos', 0, 'active', now(), now())
on conflict (business_id, name) do update set
  updated_at = excluded.updated_at;

insert into public.product_categories (id, business_id, name, sort_order, status, created_at, updated_at)
values ('9dff7d9a-9fad-5ebc-95fa-452e695fc62a', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Bebidas ancestrales', 0, 'active', now(), now())
on conflict (business_id, name) do update set
  updated_at = excluded.updated_at;

insert into public.product_categories (id, business_id, name, sort_order, status, created_at, updated_at)
values ('6d7f646b-be0f-5a2a-9beb-36b29ced83f4', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Bebidas calientes', 0, 'active', now(), now())
on conflict (business_id, name) do update set
  updated_at = excluded.updated_at;

insert into public.product_categories (id, business_id, name, sort_order, status, created_at, updated_at)
values ('ee99cb5b-140e-58ce-96d7-040f3e1d15d0', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Desayuno', 0, 'active', now(), now())
on conflict (business_id, name) do update set
  updated_at = excluded.updated_at;

insert into public.product_categories (id, business_id, name, sort_order, status, created_at, updated_at)
values ('d702c334-7a6d-5417-8535-e517f3df3fd9', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Desechabes', 0, 'active', now(), now())
on conflict (business_id, name) do update set
  updated_at = excluded.updated_at;

insert into public.product_categories (id, business_id, name, sort_order, status, created_at, updated_at)
values ('f5070f53-57f3-50af-9e2f-279b7693ad74', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Dulces del pacifico', 0, 'active', now(), now())
on conflict (business_id, name) do update set
  updated_at = excluded.updated_at;

insert into public.product_categories (id, business_id, name, sort_order, status, created_at, updated_at)
values ('b64c1084-5d67-5262-9cd2-f43c73f39776', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Especiales', 0, 'active', now(), now())
on conflict (business_id, name) do update set
  updated_at = excluded.updated_at;

insert into public.product_categories (id, business_id, name, sort_order, status, created_at, updated_at)
values ('8abd6993-0894-5222-bc33-56e15dab2cca', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Pasabocas', 0, 'active', now(), now())
on conflict (business_id, name) do update set
  updated_at = excluded.updated_at;

insert into public.product_categories (id, business_id, name, sort_order, status, created_at, updated_at)
values ('771562c6-7d0b-5612-b8aa-ffac478efe91', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Postres', 0, 'active', now(), now())
on conflict (business_id, name) do update set
  updated_at = excluded.updated_at;

insert into public.product_categories (id, business_id, name, sort_order, status, created_at, updated_at)
values ('98a440e7-79dd-5a75-afd6-b093d933454d', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Sandwitch', 0, 'active', now(), now())
on conflict (business_id, name) do update set
  updated_at = excluded.updated_at;

insert into public.product_categories (id, business_id, name, sort_order, status, created_at, updated_at)
values ('16d04383-8b6a-54e2-a147-43ec7d34649d', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Ticket', 0, 'active', now(), now())
on conflict (business_id, name) do update set
  updated_at = excluded.updated_at;

insert into public.customers (id, business_id, legacy_firebase_id, name, phone, email, document_number, ticket_balance, status, metadata, created_at, updated_at)
values ('8baaa4d7-231a-535d-a859-77ab8c46bd0d', 'c08a64ca-23dd-4599-b680-6192d14676aa', '5y5Hefq4dhQ3G130kmaX', 'Sara', '', '', '', 0, 'active', '{"firebase":{"name":"Sara","ticket_expires_at":"2026-05-19T05:00:00Z","debt_balance":0,"notes":"","ticket_total_purchased":26,"updatedAt":"2026-05-14T16:13:24.713Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","last_order_at":"2026-05-14T16:13:24.713Z","email":"","ticket_last_used_at":"2026-05-14T16:13:24.713Z","ticket_balance_units":11,"createdAt":"2026-05-07T21:11:41.255Z","pendingDebt":0,"phone":""}}'::jsonb, '2026-05-07T21:11:41.255Z'::timestamptz, '2026-05-14T16:13:24.713Z'::timestamptz)
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  document_number = excluded.document_number,
  ticket_balance = excluded.ticket_balance,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.customers (id, business_id, legacy_firebase_id, name, phone, email, document_number, ticket_balance, status, metadata, created_at, updated_at)
values ('9e65fa31-ca36-5a0f-ad6c-573be11b8b6a', 'c08a64ca-23dd-4599-b680-6192d14676aa', '9BoVNCEhtYgdjQQL413W', 'Salome', '', '', '', 0, 'active', '{"firebase":{"createdAt":"2026-05-07T17:03:21.009Z","pendingDebt":0,"phone":"","ticket_last_used_at":"2026-05-13T17:53:48.413Z","ticket_balance_units":8,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","updatedAt":"2026-05-13T19:39:18.960Z","last_order_at":"2026-05-13T17:53:48.413Z","email":"","name":"Salome","ticket_expires_at":"2026-05-15T05:00:00Z","debt_balance":0,"notes":"","ticket_total_purchased":22}}'::jsonb, '2026-05-07T17:03:21.009Z'::timestamptz, '2026-05-13T19:39:18.960Z'::timestamptz)
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  document_number = excluded.document_number,
  ticket_balance = excluded.ticket_balance,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.customers (id, business_id, legacy_firebase_id, name, phone, email, document_number, ticket_balance, status, metadata, created_at, updated_at)
values ('eb295e27-8049-5901-8704-23df7dcddcbc', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'CEj6ahhroDiVbXDGRT5K', 'Samuel', '', '', '', 0, 'active', '{"firebase":{"ticket_balance_units":7,"ticket_last_used_at":"2026-05-13T18:01:17.533Z","pendingDebt":0,"phone":"","createdAt":"2026-05-07T12:31:53.766Z","ticket_total_purchased":20,"debt_balance":0,"notes":"","name":"Samuel","ticket_expires_at":"2026-06-13T05:00:00Z","email":"","last_order_at":"2026-05-13T18:01:17.533Z","updatedAt":"2026-05-13T19:35:34.528Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-07T12:31:53.766Z'::timestamptz, '2026-05-13T19:35:34.528Z'::timestamptz)
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  document_number = excluded.document_number,
  ticket_balance = excluded.ticket_balance,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.customers (id, business_id, legacy_firebase_id, name, phone, email, document_number, ticket_balance, status, metadata, created_at, updated_at)
values ('dd03276b-4f44-5772-a0d2-9bf6a0cf0221', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'I3OAdrJ5WY5AiNPQWmmx', 'Vanessa', '', '', '', 0, 'active', '{"firebase":{"notes":"","debt_balance":0,"name":"Vanessa","ticket_expires_at":"2026-06-13T05:00:00Z","ticket_total_purchased":22,"last_order_at":"2026-05-13T18:05:40.236Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","updatedAt":"2026-05-13T19:39:59.805Z","email":"","ticket_last_used_at":"2026-05-13T18:05:40.236Z","ticket_balance_units":10,"createdAt":"2026-05-07T17:57:03.286Z","phone":"","pendingDebt":0}}'::jsonb, '2026-05-07T17:57:03.286Z'::timestamptz, '2026-05-13T19:39:59.805Z'::timestamptz)
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  document_number = excluded.document_number,
  ticket_balance = excluded.ticket_balance,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.customers (id, business_id, legacy_firebase_id, name, phone, email, document_number, ticket_balance, status, metadata, created_at, updated_at)
values ('aa903833-405f-5e86-a911-5872024028bd', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'NbOPtf5PG39cs18y5mtF', 'El mono', '', '', '', 0, 'active', '{"firebase":{"pendingDebt":0,"phone":"","createdAt":"2026-05-12T18:42:12.070Z","ticket_balance_units":0,"ticket_last_used_at":null,"email":"","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","updatedAt":"2026-05-13T16:55:32.357Z","last_order_at":"2026-05-12T18:43:36.171Z","ticket_total_purchased":0,"ticket_expires_at":null,"name":"El mono","notes":"","debt_balance":0}}'::jsonb, '2026-05-12T18:42:12.070Z'::timestamptz, '2026-05-13T16:55:32.357Z'::timestamptz)
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  document_number = excluded.document_number,
  ticket_balance = excluded.ticket_balance,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.customers (id, business_id, legacy_firebase_id, name, phone, email, document_number, ticket_balance, status, metadata, created_at, updated_at)
values ('2171ae6e-badd-55fa-b15f-9cf5086724e9', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'OpObwErenP46Rt5emKSr', 'Leidy', '', '', '', 0, 'active', '{"firebase":{"email":"","last_order_at":"2026-05-13T19:33:29.667Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","updatedAt":"2026-05-13T19:38:23.545Z","ticket_total_purchased":30,"notes":"","debt_balance":0,"name":"Leidy","ticket_expires_at":"2026-06-13T05:00:00Z","pendingDebt":0,"phone":"","createdAt":"2026-05-07T17:47:00.682Z","ticket_balance_units":17,"ticket_last_used_at":"2026-05-13T19:33:29.667Z"}}'::jsonb, '2026-05-07T17:47:00.682Z'::timestamptz, '2026-05-13T19:38:23.545Z'::timestamptz)
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  document_number = excluded.document_number,
  ticket_balance = excluded.ticket_balance,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.customers (id, business_id, legacy_firebase_id, name, phone, email, document_number, ticket_balance, status, metadata, created_at, updated_at)
values ('71c3c919-a880-5c4b-b7a8-4426ecc7a95d', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'e4UKULw5W44reTzLhUtB', 'Luisa', '', '', '', 0, 'active', '{"firebase":{"ticket_balance_units":0,"ticket_last_used_at":null,"pendingDebt":44000,"phone":"","createdAt":"2026-05-07T18:11:16.260Z","ticket_total_purchased":0,"name":"Luisa","ticket_expires_at":null,"debt_balance":44000,"notes":"","email":"","updatedAt":"2026-05-07T18:12:11.840Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","last_order_at":"2026-05-07T18:12:11.840Z"}}'::jsonb, '2026-05-07T18:11:16.260Z'::timestamptz, '2026-05-07T18:12:11.840Z'::timestamptz)
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  document_number = excluded.document_number,
  ticket_balance = excluded.ticket_balance,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.customers (id, business_id, legacy_firebase_id, name, phone, email, document_number, ticket_balance, status, metadata, created_at, updated_at)
values ('f4b789c7-54b0-59dd-812b-35ca00637c00', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'yUsYDR6oqgo5XfnLA3NA', 'Danna', '', '', '', 0, 'active', '{"firebase":{"updatedAt":"2026-05-13T19:16:51.222Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","institution":"","status":"active","document":"","email":"","name":"Danna","ticket_expires_at":"2026-06-13T05:00:00Z","program":"","notes":"","debt_balance":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_type":"student","ticket_total_purchased":2,"createdAt":"2026-05-13T19:15:59.812Z","pendingDebt":0,"document_id":"","phone":"","ticket_last_used_at":null,"customerType":"student","ticket_balance_units":2}}'::jsonb, '2026-05-13T19:15:59.812Z'::timestamptz, '2026-05-13T19:16:51.222Z'::timestamptz)
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  document_number = excluded.document_number,
  ticket_balance = excluded.ticket_balance,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.customers (id, business_id, legacy_firebase_id, name, phone, email, document_number, ticket_balance, status, metadata, created_at, updated_at)
values ('ae0fe857-fa90-5ea1-a23a-f3c63e3ddce2', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'z16gIYUt5AHnyWZcDf96', 'María José', '', '', '', 0, 'active', '{"firebase":{"ticket_balance_units":21,"ticket_last_used_at":"2026-05-13T18:47:10.528Z","pendingDebt":0,"phone":"","createdAt":"2026-05-07T18:34:49.299Z","ticket_total_purchased":37,"notes":"","debt_balance":0,"ticket_expires_at":"2026-06-13T05:00:00Z","name":"María José","email":"","last_order_at":"2026-05-13T18:47:10.528Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","updatedAt":"2026-05-13T19:37:13.796Z"}}'::jsonb, '2026-05-07T18:34:49.299Z'::timestamptz, '2026-05-13T19:37:13.796Z'::timestamptz)
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  document_number = excluded.document_number,
  ticket_balance = excluded.ticket_balance,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('c87d7a83-7446-574f-b491-45fe6cb3fe1c', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'afddd7e4-f21f-5ba7-b771-2630f419b95f', '0IHf7f0tLTKBCcFagc22', 'Camarones con arroz con coco', '', '', 'standard', 'active', 19000, 0, 0, 0, true, '{"linkedInventoryItemId":"","linkedTechnicalSheetId":"","allowSaleWhenStockLow":true,"stockStatus":"","consumesInventory":false,"inventoryImpactMode":"none"}'::jsonb, '{"firebase":{"is_available":true,"imageUrl":"","type":"standard","stock":0,"category":"Almuerzos","tags":[],"categoryName":"Almuerzos","price":19000,"product_type":"standard","updatedAt":"2026-05-13T17:08:19.449Z","code":"","recipe_mode":"direct","status":"active","tickets":{"ticketEligibilityType":"meal","eligibleForTicket":false,"restrictions":{},"allowedTicketPlans":[],"ticketValueReference":"unit"},"name":"Camarones con arroz con coco","ticket_validity_days":30,"operation":{"availableForQuickSale":true,"visibleInPOS":true,"color":"","kitchenStationId":"none","availableForTables":true,"sortOrder":0,"availableForDelivery":false,"requiresKitchen":false,"kitchenStationName":"No requiere preparacion","isFavorite":false,"preparationTime":0,"visibleInMenu":true,"icon":""},"ticket_eligible":false,"pricing":{"basePrice":19000,"targetFoodCost":30,"taxRate":0,"suggestedPrice":0},"description":"","recipe":[],"suggested_price":19000,"desired_margin_pct":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","categoryId":"","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-07T12:21:14.017Z","ticket_units":10,"costing":{"lastCostUpdateAt":null,"estimatedCost":0,"linkedTechnicalSheetId":"","targetFoodCost":30,"foodCostPercent":0,"grossMarginPercent":100,"grossMargin":19000,"suggestedPrice":0},"inventory":{"linkedInventoryItemId":"","linkedTechnicalSheetId":"","allowSaleWhenStockLow":true,"stockStatus":"","consumesInventory":false,"inventoryImpactMode":"none"}}}'::jsonb, '2026-05-07T12:21:14.017Z'::timestamptz, '2026-05-13T17:08:19.449Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('f3d12d24-de13-5efe-8f39-8ced4d32aaab', 'c08a64ca-23dd-4599-b680-6192d14676aa', '8abd6993-0894-5222-bc33-56e15dab2cca', '4b042YuI8xGzlA0dNo6Y', 'Hojaldra', '', '', 'standard', 'active', 2000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"ticket_units":10,"price":2000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-07T16:44:29.878Z","updatedAt":"2026-05-07T16:45:19.288Z","product_type":"standard","recipe_mode":"direct","stock":0,"ticket_validity_days":30,"name":"Hojaldra","is_available":true,"recipe":[],"ticket_eligible":false,"category":"Pasabocas","desired_margin_pct":0,"suggested_price":2000}}'::jsonb, '2026-05-07T16:44:29.878Z'::timestamptz, '2026-05-07T16:45:19.288Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('246090d5-0d20-59b1-899c-ba9c31fb573c', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'ee99cb5b-140e-58ce-96d7-040f3e1d15d0', '5OFUIipkfj8djkMkGXGJ', 'French toast', '', '', 'standard', 'active', 15000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"recipe":[],"ticket_eligible":false,"category":"Desayuno","desired_margin_pct":0,"suggested_price":15000,"stock":0,"ticket_validity_days":30,"name":"French toast","is_available":true,"updatedAt":"2026-05-08T18:16:14.955Z","product_type":"standard","recipe_mode":"direct","ticket_units":10,"price":15000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-08T18:11:52.360Z"}}'::jsonb, '2026-05-08T18:11:52.360Z'::timestamptz, '2026-05-08T18:16:14.955Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('b6f14dc6-e613-516a-994f-a64271eaaf60', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'afddd7e4-f21f-5ba7-b771-2630f419b95f', '6F6L7Y5fPtEi6ciZyH5y', 'Almuerzo brunch', '', '', 'standard', 'active', 22000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"is_available":true,"stock":0,"ticket_validity_days":30,"name":"Almuerzo brunch","category":"Almuerzos","suggested_price":22000,"desired_margin_pct":0,"recipe":[],"ticket_eligible":true,"createdAt":"2026-05-07T12:20:46.351Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","price":22000,"ticket_units":10,"recipe_mode":"direct","updatedAt":"2026-05-07T18:12:12.793Z","product_type":"standard"}}'::jsonb, '2026-05-07T12:20:46.351Z'::timestamptz, '2026-05-07T18:12:12.793Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('69c41a7e-163e-5489-8195-dc5dc56e729d', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'd702c334-7a6d-5417-8535-e517f3df3fd9', '8RjzaXeAOgtUCGRNR5if', 'Desechables', '', '', 'standard', 'active', 3000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"category":"Desechabes","desired_margin_pct":0,"suggested_price":3000,"recipe":[],"ticket_eligible":false,"ticket_validity_days":30,"stock":0,"name":"Desechables","is_available":true,"recipe_mode":"direct","updatedAt":"2026-05-07T17:56:40.447Z","product_type":"standard","price":3000,"ticket_units":10,"createdAt":"2026-05-07T17:56:40.447Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-07T17:56:40.447Z'::timestamptz, '2026-05-07T17:56:40.447Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('746a8552-15d0-5b24-9545-4b19e8731aca', 'c08a64ca-23dd-4599-b680-6192d14676aa', '6d7f646b-be0f-5a2a-9beb-36b29ced83f4', '9ldlEm3hjaqBXaA4CgzE', 'Café espresso especial', '', '', 'standard', 'active', 7000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"createdAt":"2026-05-07T19:47:41.585Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","price":7000,"ticket_units":10,"recipe_mode":"direct","product_type":"standard","updatedAt":"2026-05-07T19:48:07.386Z","is_available":true,"name":"Café espresso especial","stock":0,"ticket_validity_days":30,"suggested_price":7000,"desired_margin_pct":0,"category":"Bebidas calientes","ticket_eligible":false,"recipe":[]}}'::jsonb, '2026-05-07T19:47:41.585Z'::timestamptz, '2026-05-07T19:48:07.386Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('7ba936d1-3f88-5dbb-8615-94e2d1b9ff72', 'c08a64ca-23dd-4599-b680-6192d14676aa', '771562c6-7d0b-5612-b8aa-ffac478efe91', 'G4oHhCqrNhaDjcgoLd4J', 'Galletas', '', '', 'standard', 'active', 4500, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"recipe_mode":"direct","product_type":"standard","updatedAt":"2026-05-07T12:24:28.939Z","price":4500,"ticket_units":10,"createdAt":"2026-05-07T12:22:27.730Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","desired_margin_pct":0,"suggested_price":4500,"category":"Postres","ticket_eligible":false,"recipe":[],"name":"Galletas","ticket_validity_days":30,"stock":0,"is_available":true}}'::jsonb, '2026-05-07T12:22:27.730Z'::timestamptz, '2026-05-07T12:24:28.939Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('4e85d626-3098-551d-ac29-63d562ea884c', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'b64c1084-5d67-5262-9cd2-f43c73f39776', 'G76F8Yg9g6mn24gxICep', 'Bebida del mes', '', '', 'standard', 'active', 12000, 0, 0, 0, true, '{"linkedInventoryItemId":"","linkedTechnicalSheetId":"","allowSaleWhenStockLow":true,"stockStatus":"","consumesInventory":false,"inventoryImpactMode":"none"}'::jsonb, '{"firebase":{"costing":{"linkedTechnicalSheetId":"","targetFoodCost":30,"foodCostPercent":0,"grossMarginPercent":100,"grossMargin":12000,"suggestedPrice":0,"lastCostUpdateAt":null,"estimatedCost":0},"inventory":{"linkedInventoryItemId":"","linkedTechnicalSheetId":"","allowSaleWhenStockLow":true,"stockStatus":"","consumesInventory":false,"inventoryImpactMode":"none"},"ticket_units":10,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","categoryId":"","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-08T18:13:23.743Z","recipe":[],"description":"","pricing":{"basePrice":12000,"targetFoodCost":30,"taxRate":0,"suggestedPrice":0},"ticket_eligible":false,"suggested_price":8000,"desired_margin_pct":0,"operation":{"color":"","availableForQuickSale":true,"visibleInPOS":true,"visibleInMenu":true,"icon":"","isFavorite":false,"preparationTime":0,"requiresKitchen":false,"kitchenStationName":"No requiere preparacion","kitchenStationId":"none","availableForTables":true,"availableForDelivery":false,"sortOrder":0},"tickets":{"allowedTicketPlans":[],"restrictions":{},"eligibleForTicket":false,"ticketValueReference":"unit","ticketEligibilityType":""},"ticket_validity_days":30,"name":"Bebida del mes","status":"active","updatedAt":"2026-05-13T18:38:24.301Z","product_type":"standard","recipe_mode":"direct","code":"","categoryName":"Especiales","price":12000,"tags":[],"category":"Especiales","stock":0,"imageUrl":"","is_available":true,"type":"standard"}}'::jsonb, '2026-05-08T18:13:23.743Z'::timestamptz, '2026-05-13T18:38:24.301Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('33d2575d-4e2c-5d0d-81f0-af4537d96ef9', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'afddd7e4-f21f-5ba7-b771-2630f419b95f', 'KwvK2FgAoGuy93uYSUPP', 'Pasta con mariscos', '', '', 'standard', 'active', 18000, 0, 0, 0, true, '{"consumesInventory":false,"inventoryImpactMode":"none","stockStatus":"","allowSaleWhenStockLow":true,"linkedTechnicalSheetId":"","linkedInventoryItemId":""}'::jsonb, '{"firebase":{"tickets":{"ticketEligibilityType":"meal","allowedTicketPlans":[],"restrictions":{},"eligibleForTicket":false,"ticketValueReference":"unit"},"ticket_validity_days":30,"name":"Pasta con mariscos","status":"active","recipe":[],"description":"","ticket_eligible":false,"pricing":{"suggestedPrice":0,"basePrice":18000,"taxRate":0,"targetFoodCost":30},"suggested_price":18000,"desired_margin_pct":0,"operation":{"icon":"","visibleInMenu":true,"preparationTime":0,"isFavorite":false,"kitchenStationName":"No requiere preparacion","requiresKitchen":false,"availableForTables":true,"availableForDelivery":false,"sortOrder":0,"kitchenStationId":"none","color":"","visibleInPOS":true,"availableForQuickSale":true},"ticket_units":10,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","categoryId":"","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-13T16:49:52.110Z","costing":{"grossMargin":18000,"suggestedPrice":0,"foodCostPercent":0,"targetFoodCost":30,"linkedTechnicalSheetId":"","grossMarginPercent":100,"estimatedCost":0,"lastCostUpdateAt":null},"inventory":{"consumesInventory":false,"inventoryImpactMode":"none","stockStatus":"","allowSaleWhenStockLow":true,"linkedTechnicalSheetId":"","linkedInventoryItemId":""},"stock":0,"is_available":true,"imageUrl":"","type":"standard","category":"Almuerzos","categoryName":"Almuerzos","price":18000,"tags":[],"updatedAt":"2026-05-13T17:08:44.262Z","product_type":"standard","code":"","recipe_mode":"direct"}}'::jsonb, '2026-05-13T16:49:52.110Z'::timestamptz, '2026-05-13T17:08:44.262Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('62a85031-d5f6-51a2-9056-117c0e7a5b00', 'c08a64ca-23dd-4599-b680-6192d14676aa', '771562c6-7d0b-5612-b8aa-ffac478efe91', 'MHAFSOy9SBrkdxIcUYcu', 'Mantecada', '', '', 'standard', 'active', 4000, 0, 0, 0, true, '{"allowSaleWhenStockLow":true,"linkedTechnicalSheetId":"","linkedInventoryItemId":"","consumesInventory":false,"inventoryImpactMode":"none","stockStatus":""}'::jsonb, '{"firebase":{"is_available":true,"imageUrl":"","type":"final_product","stock":0,"category":"Postres","tags":[],"categoryName":"Postres","price":4000,"product_type":"standard","updatedAt":"2026-05-13T18:13:08.073Z","recipe_mode":"direct","code":"","status":"active","tickets":{"ticketValueReference":"unit","eligibleForTicket":false,"restrictions":{},"allowedTicketPlans":[],"ticketEligibilityType":""},"name":"Mantecada","ticket_validity_days":30,"operation":{"visibleInPOS":true,"availableForQuickSale":true,"color":"","isFavorite":false,"preparationTime":0,"icon":"","visibleInMenu":true,"kitchenStationId":"desserts","availableForDelivery":false,"sortOrder":0,"availableForTables":true,"requiresKitchen":true,"kitchenStationName":"Postres"},"pricing":{"suggestedPrice":0,"basePrice":4000,"taxRate":0,"targetFoodCost":30},"ticket_eligible":false,"description":"","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","categoryId":"","createdAt":"2026-05-13T18:12:23.577Z","ticket_units":10,"costing":{"grossMarginPercent":100,"linkedTechnicalSheetId":"","targetFoodCost":30,"foodCostPercent":0,"suggestedPrice":0,"grossMargin":4000,"lastCostUpdateAt":null,"estimatedCost":0},"inventory":{"allowSaleWhenStockLow":true,"linkedTechnicalSheetId":"","linkedInventoryItemId":"","consumesInventory":false,"inventoryImpactMode":"none","stockStatus":""}}}'::jsonb, '2026-05-13T18:12:23.577Z'::timestamptz, '2026-05-13T18:13:08.073Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('6dc6a027-4d17-543f-9087-4c5325bef2a5', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'ee99cb5b-140e-58ce-96d7-040f3e1d15d0', 'NSrw133cL36EsIrV8E1V', 'Huevos revueltos', '', '', 'standard', 'active', 6000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"recipe_mode":"direct","product_type":"standard","updatedAt":"2026-05-08T18:12:54.885Z","price":6000,"ticket_units":10,"createdAt":"2026-05-08T18:12:54.885Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","suggested_price":6000,"desired_margin_pct":0,"category":"Desayuno","ticket_eligible":false,"recipe":[],"name":"Huevos revueltos","stock":0,"ticket_validity_days":30,"is_available":true}}'::jsonb, '2026-05-08T18:12:54.885Z'::timestamptz, '2026-05-08T18:12:54.885Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('79e9b095-db73-5f79-881d-7a862b1e495f', 'c08a64ca-23dd-4599-b680-6192d14676aa', '6d7f646b-be0f-5a2a-9beb-36b29ced83f4', 'NtKIBqeTd4ckJu7NJyWF', 'Café Tinto', '', '', 'standard', 'active', 2500, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-07T12:21:59.827Z","ticket_units":10,"price":2500,"product_type":"standard","updatedAt":"2026-05-07T12:21:59.827Z","recipe_mode":"direct","is_available":true,"name":"Café Tinto","stock":0,"ticket_validity_days":30,"ticket_eligible":false,"recipe":[],"suggested_price":2500,"desired_margin_pct":0,"category":"Bebidas calientes"}}'::jsonb, '2026-05-07T12:21:59.827Z'::timestamptz, '2026-05-07T12:21:59.827Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('69afef46-12aa-5757-9b2f-9e4dad96ce38', 'c08a64ca-23dd-4599-b680-6192d14676aa', '9dff7d9a-9fad-5ebc-95fa-452e695fc62a', 'SwyqYh3qhbz9p3rCXin6', 'Vinete', '', '', 'standard', 'active', 27000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"name":"Vinete","stock":0,"ticket_validity_days":30,"is_available":true,"suggested_price":27000,"desired_margin_pct":0,"category":"Bebidas ancestrales","ticket_eligible":false,"recipe":[],"price":27000,"ticket_units":10,"createdAt":"2026-05-08T18:45:19.627Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","recipe_mode":"direct","product_type":"standard","updatedAt":"2026-05-08T18:47:04.851Z"}}'::jsonb, '2026-05-08T18:45:19.627Z'::timestamptz, '2026-05-08T18:47:04.851Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('6e12b9e1-7695-5d20-802f-db267220f680', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'b64c1084-5d67-5262-9cd2-f43c73f39776', 'YQeGc8xVQ2T9a0bJ1ISx', 'Porción de arroz con coco', '', '', 'standard', 'active', 3000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"is_available":true,"stock":0,"ticket_validity_days":30,"name":"Porción de arroz con coco","recipe":[],"ticket_eligible":false,"category":"Especiales","suggested_price":3000,"desired_margin_pct":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-08T18:24:05.005Z","ticket_units":10,"price":3000,"updatedAt":"2026-05-12T18:08:15.383Z","product_type":"standard","recipe_mode":"direct"}}'::jsonb, '2026-05-08T18:24:05.005Z'::timestamptz, '2026-05-12T18:08:15.383Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('c58aea53-4ac9-55ff-a44e-df6467a61470', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'f5070f53-57f3-50af-9e2f-279b7693ad74', 'Yj08PsyalJYc6vI3mExi', 'Coco frito', '', '', 'standard', 'active', 13000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"price":13000,"ticket_units":10,"createdAt":"2026-05-07T12:24:10.417Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","recipe_mode":"direct","product_type":"standard","updatedAt":"2026-05-07T12:24:44.489Z","name":"Coco frito","ticket_validity_days":30,"stock":0,"is_available":true,"desired_margin_pct":0,"suggested_price":13000,"category":"Dulces del pacifico","ticket_eligible":false,"recipe":[]}}'::jsonb, '2026-05-07T12:24:10.417Z'::timestamptz, '2026-05-07T12:24:44.489Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('8b4a407f-92f9-54c0-9a30-2bc71465c252', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'b64c1084-5d67-5262-9cd2-f43c73f39776', 'aye5SgAWlvUqgaQF65xl', 'Corbina', '', '', 'standard', 'active', 30000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"ticket_eligible":false,"recipe":[],"desired_margin_pct":0,"suggested_price":30000,"category":"Especiales","is_available":true,"name":"Corbina","stock":0,"ticket_validity_days":30,"product_type":"standard","updatedAt":"2026-05-07T17:52:59.512Z","recipe_mode":"direct","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-07T17:10:53.139Z","ticket_units":10,"price":30000}}'::jsonb, '2026-05-07T17:10:53.139Z'::timestamptz, '2026-05-07T17:52:59.512Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('0bf8a321-facb-5453-8dac-a90dc0be1462', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'b64c1084-5d67-5262-9cd2-f43c73f39776', 'fR5eQsJYtPryiJH7l1dv', 'Camarones sudados', '', '', 'standard', 'active', 15000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"category":"Especiales","suggested_price":15000,"desired_margin_pct":0,"recipe":[],"ticket_eligible":false,"stock":0,"ticket_validity_days":30,"name":"Camarones sudados","is_available":true,"recipe_mode":"direct","updatedAt":"2026-05-07T18:48:50.113Z","product_type":"standard","price":15000,"ticket_units":10,"createdAt":"2026-05-07T18:48:50.113Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-07T18:48:50.113Z'::timestamptz, '2026-05-07T18:48:50.113Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('037d1867-bb6e-5395-ab7a-6aaf1b01b589', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'afddd7e4-f21f-5ba7-b771-2630f419b95f', 'hSJLYx7QAHYmsXLfUfro', 'Almuerzo medium', '', '', 'standard', 'active', 16000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"suggested_price":16000,"desired_margin_pct":0,"category":"Almuerzos","ticket_eligible":true,"recipe":[],"name":"Almuerzo medium","ticket_validity_days":30,"stock":0,"is_available":true,"recipe_mode":"direct","product_type":"standard","updatedAt":"2026-05-12T19:14:46.623Z","price":16000,"ticket_units":10,"createdAt":"2026-05-07T12:20:15.825Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-07T12:20:15.825Z'::timestamptz, '2026-05-12T19:14:46.623Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('c0f926e3-1e2f-5572-ac00-ab5edde5a713', 'c08a64ca-23dd-4599-b680-6192d14676aa', '98a440e7-79dd-5a75-afd6-b093d933454d', 'iALg0vvGm2d7NDoViOox', 'Sandwitch', '', '', 'standard', 'active', 10000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"recipe_mode":"direct","updatedAt":"2026-05-07T18:08:45.409Z","product_type":"standard","createdAt":"2026-05-07T18:08:45.409Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","price":10000,"ticket_units":10,"category":"Sandwitch","desired_margin_pct":0,"suggested_price":10000,"recipe":[],"ticket_eligible":false,"is_available":true,"ticket_validity_days":30,"stock":0,"name":"Sandwitch"}}'::jsonb, '2026-05-07T18:08:45.409Z'::timestamptz, '2026-05-07T18:08:45.409Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('b34b29f2-45f5-509c-b053-1473a4f9e9c7', 'c08a64ca-23dd-4599-b680-6192d14676aa', '16d04383-8b6a-54e2-a147-43ec7d34649d', 'kY2mwCJG89YOAcJTiY0r', 'Plan basico', '', '', 'ticket_wallet', 'active', 120000, 0, 0, 9999, true, '{}'::jsonb, '{"firebase":{"recipe":[],"ticket_eligible":false,"category":"Ticket","desired_margin_pct":0,"suggested_price":120000,"is_available":true,"ticket_validity_days":30,"stock":9999,"name":"Plan basico","updatedAt":"2026-05-07T12:30:43.850Z","product_type":"ticket_wallet","recipe_mode":"direct","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-07T12:30:43.850Z","ticket_units":10,"price":120000}}'::jsonb, '2026-05-07T12:30:43.850Z'::timestamptz, '2026-05-07T12:30:43.850Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('ee95f5ee-1c1d-5e66-9bde-378e154f493e', 'c08a64ca-23dd-4599-b680-6192d14676aa', '771562c6-7d0b-5612-b8aa-ffac478efe91', 'lS3ERhjxWLTkVC4lLetY', 'Cocada', '', '', 'standard', 'active', 2000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"suggested_price":2000,"desired_margin_pct":0,"category":"Postres","ticket_eligible":false,"recipe":[],"name":"Cocada","stock":0,"ticket_validity_days":30,"is_available":true,"recipe_mode":"direct","product_type":"standard","updatedAt":"2026-05-07T12:23:35.242Z","price":2000,"ticket_units":10,"createdAt":"2026-05-07T12:23:09.846Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-07T12:23:09.846Z'::timestamptz, '2026-05-07T12:23:35.242Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('bb1f5ae7-338c-5607-8961-a48d400f9886', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'afddd7e4-f21f-5ba7-b771-2630f419b95f', 'nRlFt9zSV5xfbBPy9pDe', 'Almuerzo base', '', '', 'standard', 'active', 13500, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"ticket_eligible":true,"recipe":[],"suggested_price":13500,"desired_margin_pct":0,"category":"Almuerzos","name":"Almuerzo base","stock":0,"ticket_validity_days":30,"is_available":true,"product_type":"standard","updatedAt":"2026-05-12T20:33:40.018Z","recipe_mode":"direct","ticket_units":10,"price":13500,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-07T12:19:45.404Z"}}'::jsonb, '2026-05-07T12:19:45.404Z'::timestamptz, '2026-05-12T20:33:40.018Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('5b29a094-c508-5f2c-b777-033b1f833e3f', 'c08a64ca-23dd-4599-b680-6192d14676aa', '771562c6-7d0b-5612-b8aa-ffac478efe91', 'suhzXPfAKnHxUba81X29', 'Sambumbe', '', '', 'standard', 'active', 4500, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"ticket_units":10,"price":4500,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-07T12:22:43.603Z","updatedAt":"2026-05-07T12:22:43.603Z","product_type":"standard","recipe_mode":"direct","stock":0,"ticket_validity_days":30,"name":"Sambumbe","is_available":true,"recipe":[],"ticket_eligible":false,"category":"Postres","suggested_price":4500,"desired_margin_pct":0}}'::jsonb, '2026-05-07T12:22:43.603Z'::timestamptz, '2026-05-07T12:22:43.603Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('d2486b54-34a2-5225-9c72-e179e430b5cb', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'b64c1084-5d67-5262-9cd2-f43c73f39776', 't16ljgXbDhbgGTLi7TOh', 'Arroz con coco', '', '', 'standard', 'active', 4000, 0, 0, 0, true, '{}'::jsonb, '{"firebase":{"recipe":[],"ticket_eligible":false,"category":"Especiales","suggested_price":4000,"desired_margin_pct":0,"stock":0,"ticket_validity_days":30,"name":"Arroz con coco","is_available":true,"updatedAt":"2026-05-07T18:56:28.298Z","product_type":"standard","recipe_mode":"direct","ticket_units":10,"price":4000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-07T18:56:28.298Z"}}'::jsonb, '2026-05-07T18:56:28.298Z'::timestamptz, '2026-05-07T18:56:28.298Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.products (id, business_id, category_id, legacy_firebase_id, name, code, description, product_type, status, price, cost, tax_rate, stock, visible_in_pos, inventory, metadata, created_at, updated_at)
values ('35db3388-2fd4-517c-8e6c-a678f2e364b0', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'd702c334-7a6d-5417-8535-e517f3df3fd9', 't1GQktdssxFaqnOTsw3S', 'Empaque sin sopa', '', '', 'standard', 'active', 2000, 0, 0, 0, true, '{"stockStatus":"","consumesInventory":false,"inventoryImpactMode":"none","linkedInventoryItemId":"","allowSaleWhenStockLow":true,"linkedTechnicalSheetId":""}'::jsonb, '{"firebase":{"description":"","pricing":{"basePrice":2000,"targetFoodCost":30,"taxRate":0,"suggestedPrice":0},"ticket_eligible":false,"operation":{"color":"","availableForQuickSale":true,"visibleInPOS":true,"visibleInMenu":true,"icon":"","isFavorite":false,"preparationTime":0,"requiresKitchen":true,"kitchenStationName":"Caja","kitchenStationId":"cashier","availableForTables":true,"availableForDelivery":false,"sortOrder":0},"tickets":{"eligibleForTicket":false,"restrictions":{},"allowedTicketPlans":[],"ticketValueReference":"unit","ticketEligibilityType":""},"ticket_validity_days":30,"name":"Empaque sin sopa","status":"active","costing":{"lastCostUpdateAt":null,"estimatedCost":0,"linkedTechnicalSheetId":"","foodCostPercent":0,"targetFoodCost":30,"grossMarginPercent":100,"grossMargin":2000,"suggestedPrice":0},"inventory":{"stockStatus":"","consumesInventory":false,"inventoryImpactMode":"none","linkedInventoryItemId":"","allowSaleWhenStockLow":true,"linkedTechnicalSheetId":""},"ticket_units":10,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-13T17:10:42.889Z","categoryId":"","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","category":"Desechabes","stock":0,"imageUrl":"","is_available":true,"type":"variable","updatedAt":"2026-05-13T17:10:42.889Z","product_type":"variable","code":"","recipe_mode":"direct","price":2000,"categoryName":"Desechabes","tags":[]}}'::jsonb, '2026-05-13T17:10:42.889Z'::timestamptz, '2026-05-13T17:10:42.889Z'::timestamptz)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  code = excluded.code,
  description = excluded.description,
  product_type = excluded.product_type,
  status = excluded.status,
  price = excluded.price,
  cost = excluded.cost,
  tax_rate = excluded.tax_rate,
  stock = excluded.stock,
  visible_in_pos = excluded.visible_in_pos,
  inventory = excluded.inventory,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_sessions (id, business_id, legacy_firebase_id, opened_by, closed_by, status, opening_amount, counted_amount, expected_amount, difference_amount, opened_at, closed_at, created_at, updated_at)
values ('638bfbe5-397b-51f9-89e1-575e52e37209', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Ls5tvsgxKAuERuCgeg2K', (select id from public.profiles where email = 'katteryneramos@gmail.com' limit 1), (select id from public.profiles where email = 'katteryneramos@gmail.com' limit 1), 'closed', 0, 263000, 263000, 0, '2026-05-07T16:44:39.160Z'::timestamptz, '2026-05-08T00:05:52.607Z'::timestamptz, '2026-05-07T16:44:39.160Z'::timestamptz, '2026-05-08T00:05:52.607Z'::timestamptz)
on conflict (id) do update set
  status = excluded.status,
  opening_amount = excluded.opening_amount,
  counted_amount = excluded.counted_amount,
  expected_amount = excluded.expected_amount,
  difference_amount = excluded.difference_amount,
  closed_at = excluded.closed_at,
  updated_at = excluded.updated_at;

insert into public.cash_sessions (id, business_id, legacy_firebase_id, opened_by, closed_by, status, opening_amount, counted_amount, expected_amount, difference_amount, opened_at, closed_at, created_at, updated_at)
values ('6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'YUv8HDxGq3rBKRJ4dlm9', (select id from public.profiles where email = 'katteryneramos@gmail.com' limit 1), null, 'open', 0, null, null, null, '2026-05-13T16:55:21.533Z'::timestamptz, null, '2026-05-13T16:55:21.533Z'::timestamptz, '2026-05-13T16:55:21.533Z'::timestamptz)
on conflict (id) do update set
  status = excluded.status,
  opening_amount = excluded.opening_amount,
  counted_amount = excluded.counted_amount,
  expected_amount = excluded.expected_amount,
  difference_amount = excluded.difference_amount,
  closed_at = excluded.closed_at,
  updated_at = excluded.updated_at;

insert into public.cash_sessions (id, business_id, legacy_firebase_id, opened_by, closed_by, status, opening_amount, counted_amount, expected_amount, difference_amount, opened_at, closed_at, created_at, updated_at)
values ('5ec70dd3-04a3-59f1-8217-b89c6432d407', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'tQ1y0MqKNI2JtdRgNzJ9', (select id from public.profiles where email = 'katteryneramos@gmail.com' limit 1), (select id from public.profiles where email = 'katteryneramos@gmail.com' limit 1), 'closed', 0, 371000, 108000, 263000, '2026-05-08T18:07:52.966Z'::timestamptz, '2026-05-09T01:37:39.330Z'::timestamptz, '2026-05-08T18:07:52.966Z'::timestamptz, '2026-05-09T01:37:39.330Z'::timestamptz)
on conflict (id) do update set
  status = excluded.status,
  opening_amount = excluded.opening_amount,
  counted_amount = excluded.counted_amount,
  expected_amount = excluded.expected_amount,
  difference_amount = excluded.difference_amount,
  closed_at = excluded.closed_at,
  updated_at = excluded.updated_at;

insert into public.cash_sessions (id, business_id, legacy_firebase_id, opened_by, closed_by, status, opening_amount, counted_amount, expected_amount, difference_amount, opened_at, closed_at, created_at, updated_at)
values ('00b165b9-29e4-59b2-8b8c-e1affd7bbe6c', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'vsYhaNK2Jo4kA5QPIkBY', (select id from public.profiles where email = 'katteryneramos@gmail.com' limit 1), (select id from public.profiles where email = 'katteryneramos@gmail.com' limit 1), 'closed', 0, 460500, 89500, 371000, '2026-05-12T17:30:49.613Z'::timestamptz, '2026-05-13T16:48:45.606Z'::timestamptz, '2026-05-12T17:30:49.613Z'::timestamptz, '2026-05-13T16:48:45.606Z'::timestamptz)
on conflict (id) do update set
  status = excluded.status,
  opening_amount = excluded.opening_amount,
  counted_amount = excluded.counted_amount,
  expected_amount = excluded.expected_amount,
  difference_amount = excluded.difference_amount,
  closed_at = excluded.closed_at,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('53c8f306-383a-56e6-99d0-36e2bac29d4c', 'c08a64ca-23dd-4599-b680-6192d14676aa', '2171ae6e-badd-55fa-b15f-9cf5086724e9', null, '0nkqLSE8E5DjD1uRcTlR', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-13T19:33:29.667Z'::timestamptz, '{"firebase":{"cash_change":0,"customer_id":"OpObwErenP46Rt5emKSr","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","order_id":"ZoaPDGoFyDfTM7gg3FZ4","tableSessionId":"AM6JhKrCbp15kKMt5tNT","createdAt":"2026-05-13T19:33:29.667Z","items":[{"lineId":"0152f7de-0c6c-4b20-8d30-d5df65d09bab","recipe_mode":"direct","productId":"nRlFt9zSV5xfbBPy9pDe","id":"nRlFt9zSV5xfbBPy9pDe","productName":"Almuerzo base","quantity":1,"notes":"","price":13500,"product_type":"standard","unitPrice":13500,"modifiers":[],"category":"Almuerzos","status":"delivered","ticket_units":10,"subtotal":13500,"useTicket":true,"name":"Almuerzo base","ticket_eligible":true,"note":"","sentAt":"2026-05-13T19:11:23.994Z","ticket_validity_days":30}],"customer_name":"Leidy","pending_debt_remaining":0,"paid_amount":0,"table_name":"Mesa blanca","closed_at":"2026-05-13T19:33:29.667Z","debt_amount":0,"settled_amount":0,"payment_label":"Tiquetera","table_id":"x0OEOINMrf3LYW5eADGc","table_session_id":"AM6JhKrCbp15kKMt5tNT","total":0,"ticket_units_consumed":1,"payment_breakdown":[{"method":"ticket_wallet","amount":0}],"sale_id":"gtsmyVRjucL8K04oaH1B","payment_method":"ticket_wallet","payment_status":"paid","cash_received":0,"subtotal":0,"adjustment_pct":0,"income_kind":"ticket_wallet","ticket_covered_amount":13500,"ticket_units_granted":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","type":"income","adjustment_amount":0,"concept":"Venta Mesa blanca"}}'::jsonb, '2026-05-13T19:33:29.667Z'::timestamptz, '2026-05-13T19:33:29.766704Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('06c5fa6e-6bed-57ad-93b9-2547cc087f07', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'ae0fe857-fa90-5ea1-a23a-f3c63e3ddce2', null, '0w72oi7HFcW3rkPTWpKW', '', 'quick_sale', 'paid', 'paid', 4000, 0, 0, 4000, 4000, 0, '2026-05-13T18:47:10.528Z'::timestamptz, '{"firebase":{"order_id":"iTu3yNLAjuxZdFU4NO7S","tableSessionId":"03qntsj9ZckhOVcpRu72","createdAt":"2026-05-13T18:47:10.528Z","items":[{"unitPrice":13500,"modifiers":[],"ticket_units":10,"status":"delivered","category":"Almuerzos","useTicket":true,"subtotal":13500,"ticket_eligible":true,"name":"Almuerzo base","note":"Pechuga","ticket_validity_days":30,"sentAt":"2026-05-13T18:20:47.618Z","lineId":"51f456cf-b8cb-4fbb-8f72-05d1255262f0","recipe_mode":"direct","productId":"nRlFt9zSV5xfbBPy9pDe","id":"nRlFt9zSV5xfbBPy9pDe","productName":"Almuerzo base","quantity":1,"notes":"Pechuga","price":13500,"product_type":"standard"},{"productId":"MHAFSOy9SBrkdxIcUYcu","lineId":"856a3aec-6309-478f-8475-c7596304e1c5","recipe_mode":"direct","productName":"Mantecada","quantity":1,"id":"MHAFSOy9SBrkdxIcUYcu","product_type":"standard","price":4000,"notes":"","unitPrice":4000,"ticket_units":10,"status":"delivered","category":"Postres","modifiers":[],"name":"Mantecada","ticket_eligible":false,"subtotal":4000,"useTicket":false,"ticket_validity_days":30,"sentAt":"2026-05-13T18:45:15.856Z","note":""}],"customer_name":"María José","paid_amount":4000,"pending_debt_remaining":0,"table_name":"Panca","closed_at":"2026-05-13T18:47:10.528Z","cash_change":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":"z16gIYUt5AHnyWZcDf96","ticket_units_consumed":1,"settled_amount":4000,"debt_amount":0,"payment_label":"nequi","table_id":"IaKZHUBjqeglJP02wDj6","table_session_id":"03qntsj9ZckhOVcpRu72","total":4000,"payment_method":"nequi","payment_status":"paid","cash_received":0,"subtotal":4000,"adjustment_pct":0,"income_kind":"mixed_ticket","payment_breakdown":[{"amount":4000,"method":"nequi"}],"sale_id":"3dn57sfKxZNxQtupoog1","type":"income","adjustment_amount":0,"concept":"Venta Panca","ticket_covered_amount":13500,"ticket_units_granted":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9"}}'::jsonb, '2026-05-13T18:47:10.528Z'::timestamptz, '2026-05-13T18:47:10.658940Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('40714f26-f519-5b5f-a445-64195deb9f13', 'c08a64ca-23dd-4599-b680-6192d14676aa', '9e65fa31-ca36-5a0f-ad6c-573be11b8b6a', null, '2BusifwBZvtoIPtxuxOs', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-13T17:53:48.413Z'::timestamptz, '{"firebase":{"pending_debt_remaining":0,"paid_amount":0,"table_name":"Panca","closed_at":"2026-05-13T17:53:48.413Z","order_id":"4GohQGKZfL6fK34HEDmw","tableSessionId":"EvGKArNptCDoNARDW9fw","createdAt":"2026-05-13T17:53:48.413Z","items":[{"note":"","ticket_validity_days":30,"sentAt":"2026-05-13T17:52:51.372Z","name":"Almuerzo base","ticket_eligible":true,"subtotal":13500,"useTicket":false,"modifiers":[],"ticket_units":10,"status":"delivered","category":"Almuerzos","unitPrice":13500,"notes":"","product_type":"standard","price":13500,"id":"nRlFt9zSV5xfbBPy9pDe","productName":"Almuerzo base","quantity":1,"lineId":"34e34e41-e651-4ea9-99c8-48b0bb807c00","recipe_mode":"direct","productId":"nRlFt9zSV5xfbBPy9pDe"}],"customer_name":"Salome","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":"9BoVNCEhtYgdjQQL413W","cash_change":0,"ticket_units_consumed":1,"table_id":"IaKZHUBjqeglJP02wDj6","table_session_id":"EvGKArNptCDoNARDW9fw","total":0,"debt_amount":0,"settled_amount":0,"payment_label":"Tiquetera","subtotal":0,"adjustment_pct":0,"income_kind":"ticket_wallet","payment_method":"ticket_wallet","cash_received":0,"payment_status":"paid","sale_id":"7ihscrAkb49723enEmKY","payment_breakdown":[{"amount":0,"method":"ticket_wallet"}],"concept":"Venta Panca","type":"income","adjustment_amount":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","ticket_units_granted":0,"ticket_covered_amount":13500}}'::jsonb, '2026-05-13T17:53:48.413Z'::timestamptz, '2026-05-13T17:53:48.479496Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('d2ee630a-50ad-57dc-a6ae-67150b2fc74a', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'dd03276b-4f44-5772-a0d2-9bf6a0cf0221', null, '3DUlTFyrdcNDRUJ3IeF3', '', 'quick_sale', 'paid', 'paid', 3000, 0, 0, 3000, 0, 0, '2026-05-07T18:10:39.897Z'::timestamptz, '{"firebase":{"payment_breakdown":[{"method":"nequi","amount":3000}],"cash_received":0,"payment_status":"paid","payment_method":"nequi","income_kind":"mixed_ticket","subtotal":3000,"adjustment_pct":0,"ticket_covered_amount":16000,"closing_id":"Ls5tvsgxKAuERuCgeg2K","ticket_units_granted":0,"type":"income","adjustment_amount":0,"concept":"Venta Venta Rapida / Para llevar","cash_change":0,"customer_id":"I3OAdrJ5WY5AiNPQWmmx","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_name":"Vanessa","items":[{"category":"Almuerzos","ticket_units":10,"recipe_mode":"direct","product_type":"standard","ticket_validity_days":30,"price":16000,"note":"","ticket_eligible":true,"name":"Almuerzo medium","useTicket":true,"quantity":1,"id":"hSJLYx7QAHYmsXLfUfro"},{"note":"","price":3000,"product_type":"standard","ticket_validity_days":30,"id":"8RjzaXeAOgtUCGRNR5if","useTicket":false,"quantity":1,"ticket_eligible":false,"name":"Desechables","category":"Desechabes","ticket_units":10,"recipe_mode":"direct"}],"createdAt":"2026-05-07T18:10:39.897Z","order_id":"SoT7JwBWPyC7Kgru8Fns","table_name":"Venta Rapida / Para llevar","closed_at":"2026-05-07T18:10:39.897Z","pending_debt_remaining":0,"debt_amount":0,"settled_amount":0,"payment_label":"nequi","total":3000,"table_id":"quick-sale","ticket_units_consumed":1}}'::jsonb, '2026-05-07T18:10:39.897Z'::timestamptz, '2026-05-07T18:10:39.975092Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('18ca7c9d-7239-5eb0-84b7-47d8664e29a0', 'c08a64ca-23dd-4599-b680-6192d14676aa', '9e65fa31-ca36-5a0f-ad6c-573be11b8b6a', null, '49Umg1NDWIZl1bmdISWD', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-12T18:44:12.803Z'::timestamptz, '{"firebase":{"table_name":"Panca","closed_at":"2026-05-12T18:44:12.803Z","pending_debt_remaining":0,"createdAt":"2026-05-12T18:44:12.803Z","items":[{"ticket_eligible":true,"name":"Almuerzo base","useTicket":true,"quantity":1,"id":"nRlFt9zSV5xfbBPy9pDe","ticket_validity_days":30,"product_type":"standard","price":13500,"note":"","recipe_mode":"direct","category":"Almuerzos","ticket_units":10}],"customer_name":"Salome","order_id":"FbR6KytGVpWwueHA9Trd","customer_id":"9BoVNCEhtYgdjQQL413W","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cash_change":0,"ticket_units_consumed":1,"total":0,"table_id":"IaKZHUBjqeglJP02wDj6","debt_amount":0,"settled_amount":0,"payment_label":"Tiquetera","income_kind":"ticket_wallet","subtotal":0,"adjustment_pct":0,"payment_status":"paid","cash_received":0,"payment_method":"ticket_wallet","payment_breakdown":[{"method":"ticket_wallet","amount":0}],"concept":"Venta Panca","type":"income","adjustment_amount":0,"ticket_units_granted":0,"closing_id":"vsYhaNK2Jo4kA5QPIkBY","ticket_covered_amount":13500}}'::jsonb, '2026-05-12T18:44:12.803Z'::timestamptz, '2026-05-12T18:44:12.899062Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('dd44be49-ee8b-5c9b-95ec-946f430b43b5', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, '4pDB62XXboqFjn7bLuKU', '', 'quick_sale', 'paid', 'paid', 20000, 0, 0, 20000, 20000, 0, '2026-05-13T17:11:34.832Z'::timestamptz, '{"firebase":{"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null,"cash_change":0,"table_name":"Venta Rapida / Para llevar","closed_at":"2026-05-13T17:11:34.832Z","pending_debt_remaining":0,"paid_amount":20000,"tableSessionId":null,"items":[{"unitPrice":18000,"modifiers":[],"ticket_units":10,"category":"Almuerzos","name":"Pasta con mariscos","ticket_eligible":true,"useTicket":false,"note":"","ticket_validity_days":30,"inventoryImpactMode":"none","recipe_mode":"direct","productId":"KwvK2FgAoGuy93uYSUPP","kitchenStationId":"none","kitchenStationName":"No requiere preparacion","id":"KwvK2FgAoGuy93uYSUPP","productName":"Pasta con mariscos","quantity":1,"technicalSheetId":"","requiresKitchen":false,"notes":"","categoryId":"","product_type":"standard","price":18000},{"kitchenStationId":"cashier","productId":"t1GQktdssxFaqnOTsw3S","recipe_mode":"direct","kitchenStationName":"Caja","quantity":1,"productName":"Empaque sin sopa","id":"t1GQktdssxFaqnOTsw3S","price":2000,"categoryId":"","product_type":"variable","notes":"","requiresKitchen":true,"technicalSheetId":"","unitPrice":2000,"category":"Desechabes","ticket_units":10,"modifiers":[],"useTicket":false,"name":"Empaque sin sopa","ticket_eligible":false,"inventoryImpactMode":"none","ticket_validity_days":30,"note":""}],"createdAt":"2026-05-13T17:11:34.832Z","customer_name":"","order_id":"RSmkPKrYK01IcP0yMwwZ","total":20000,"table_id":"quick-sale","table_session_id":null,"settled_amount":20000,"debt_amount":0,"payment_label":"Pago dividido","ticket_units_consumed":0,"sale_id":"1HSXO5sjRySzI91b1DYH","payment_breakdown":[{"method":"cash","amount":2000},{"amount":18000,"method":"nequi"}],"income_kind":"cash","subtotal":20000,"adjustment_pct":0,"payment_status":"paid","cash_received":0,"payment_method":"split","ticket_units_granted":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","ticket_covered_amount":0,"concept":"Venta Venta Rapida / Para llevar","type":"income","adjustment_amount":0}}'::jsonb, '2026-05-13T17:11:34.832Z'::timestamptz, '2026-05-13T17:11:34.930523Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('60e18e24-eaf2-5052-bed4-f05c0f03aba2', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, '54lc6PlwmV9PnOT6QMaL', '', 'quick_sale', 'paid', 'paid', 19000, 0, 0, 19000, 0, 0, '2026-05-08T18:09:13.474Z'::timestamptz, '{"firebase":{"concept":"Venta Venta Rapida / Para llevar","type":"income","adjustment_amount":0,"ticket_units_granted":0,"closing_id":"tQ1y0MqKNI2JtdRgNzJ9","ticket_covered_amount":0,"subtotal":19000,"adjustment_pct":0,"income_kind":"cash","payment_method":"cash","payment_status":"paid","cash_received":19000,"payment_breakdown":[{"method":"cash","amount":19000}],"ticket_units_consumed":0,"table_id":"quick-sale","total":19000,"settled_amount":0,"debt_amount":0,"payment_label":"cash","pending_debt_remaining":0,"table_name":"Venta Rapida / Para llevar","closed_at":"2026-05-08T18:09:13.474Z","order_id":"SvQszeYpbO4cXZXCWL4K","createdAt":"2026-05-08T18:09:13.474Z","items":[{"note":"","ticket_validity_days":30,"product_type":"standard","price":19000,"id":"0IHf7f0tLTKBCcFagc22","name":"Arroz con camarones","ticket_eligible":true,"quantity":1,"useTicket":false,"ticket_units":10,"category":"Almuerzos","recipe_mode":"direct"}],"customer_name":"","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null,"cash_change":0}}'::jsonb, '2026-05-08T18:09:13.474Z'::timestamptz, '2026-05-08T18:09:13.520150Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('7b1509bf-3fa0-5dbe-a20f-8bfb15e57cb9', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, '5kf1vBimF10ZrruM5oI3', '', 'quick_sale', 'paid', 'paid', 35500, 0, 0, 35500, 0, 0, '2026-05-07T18:27:25.299Z'::timestamptz, '{"firebase":{"order_id":"L293A7e4W4zbRqjDFinU","customer_name":"","items":[{"id":"nRlFt9zSV5xfbBPy9pDe","useTicket":false,"quantity":1,"ticket_eligible":true,"name":"Almuerzo base","note":"","price":13500,"product_type":"standard","ticket_validity_days":30,"recipe_mode":"direct","category":"Almuerzos","ticket_units":10},{"note":"","ticket_validity_days":30,"product_type":"standard","price":22000,"id":"6F6L7Y5fPtEi6ciZyH5y","name":"Almuerzo brunch","ticket_eligible":true,"quantity":1,"useTicket":false,"ticket_units":10,"category":"Almuerzos","recipe_mode":"direct"}],"createdAt":"2026-05-07T18:27:25.299Z","pending_debt_remaining":0,"table_name":"Mesa larga","closed_at":"2026-05-07T18:27:25.299Z","cash_change":0,"customer_id":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","ticket_units_consumed":0,"debt_amount":0,"settled_amount":0,"payment_label":"Pago dividido","table_id":"rVv4OIwPnrp2wwNjrCpB","total":35500,"payment_method":"split","cash_received":0,"payment_status":"paid","subtotal":35500,"adjustment_pct":0,"income_kind":"cash","payment_breakdown":[{"method":"nequi","amount":22000},{"method":"daviplata","amount":13500}],"type":"income","adjustment_amount":0,"concept":"Venta Mesa larga","ticket_covered_amount":0,"closing_id":"Ls5tvsgxKAuERuCgeg2K","ticket_units_granted":0}}'::jsonb, '2026-05-07T18:27:25.299Z'::timestamptz, '2026-05-07T18:27:25.375010Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('051a835b-95f3-5bb3-9a33-53156884a4b0', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, '5tRRyHQtgyUaJpDX82Qr', '', 'quick_sale', 'paid', 'paid', 160000, 0, 0, 160000, 0, 0, '2026-05-07T19:56:39.874Z'::timestamptz, '{"firebase":{"payment_method":"cash","cash_received":161000,"payment_status":"paid","adjustment_pct":0,"subtotal":160000,"income_kind":"cash","payment_breakdown":[{"amount":160000,"method":"cash"}],"adjustment_amount":0,"type":"income","concept":"Venta Mesa de madera","ticket_covered_amount":0,"closing_id":"Ls5tvsgxKAuERuCgeg2K","ticket_units_granted":0,"order_id":"ScOqzcO5Nfk7IoGZwnKj","createdAt":"2026-05-07T19:56:39.874Z","items":[{"price":30000,"ticket_validity_days":30,"product_type":"standard","note":"","quantity":4,"useTicket":false,"name":"Corbina","ticket_eligible":false,"id":"aye5SgAWlvUqgaQF65xl","ticket_units":10,"category":"Especiales","recipe_mode":"direct"},{"note":"","price":15000,"ticket_validity_days":30,"product_type":"standard","id":"fR5eQsJYtPryiJH7l1dv","quantity":2,"useTicket":false,"ticket_eligible":false,"name":"Camarones sudados","category":"Especiales","ticket_units":10,"recipe_mode":"direct"},{"recipe_mode":"direct","category":"Bebidas calientes","ticket_units":10,"useTicket":false,"quantity":4,"ticket_eligible":false,"name":"Café Tinto","id":"NtKIBqeTd4ckJu7NJyWF","price":2500,"product_type":"standard","ticket_validity_days":30,"note":""}],"customer_name":"","pending_debt_remaining":0,"closed_at":"2026-05-07T19:56:39.874Z","table_name":"Mesa de madera","cash_change":1000,"customer_id":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","ticket_units_consumed":0,"payment_label":"cash","debt_amount":0,"settled_amount":0,"table_id":"OR088fiPLjrUL6Ea2P3M","total":160000}}'::jsonb, '2026-05-07T19:56:39.874Z'::timestamptz, '2026-05-07T19:56:39.943566Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('c3b9a00f-bcb4-5aea-9c01-d332f3d6f2e0', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, '8O2InXzXDNbHNSiIJLRL', '', 'quick_sale', 'paid', 'paid', 16500, 0, 0, 16500, 0, 0, '2026-05-08T18:27:42.042Z'::timestamptz, '{"firebase":{"income_kind":"cash","subtotal":16500,"adjustment_pct":0,"payment_status":"paid","cash_received":20000,"payment_method":"cash","payment_breakdown":[{"amount":16500,"method":"cash"}],"concept":"Venta Venta Rapida / Para llevar","type":"income","adjustment_amount":0,"closing_id":"tQ1y0MqKNI2JtdRgNzJ9","ticket_units_granted":0,"ticket_covered_amount":0,"table_name":"Venta Rapida / Para llevar","closed_at":"2026-05-08T18:27:42.042Z","pending_debt_remaining":0,"customer_name":"","createdAt":"2026-05-08T18:27:42.042Z","items":[{"note":"","product_type":"standard","ticket_validity_days":30,"price":13500,"id":"nRlFt9zSV5xfbBPy9pDe","name":"Almuerzo base","ticket_eligible":true,"useTicket":false,"quantity":1,"category":"Almuerzos","ticket_units":10,"recipe_mode":"direct"},{"quantity":1,"useTicket":false,"name":"Desechables","ticket_eligible":false,"id":"8RjzaXeAOgtUCGRNR5if","price":3000,"ticket_validity_days":30,"product_type":"standard","note":"","recipe_mode":"direct","ticket_units":10,"category":"Desechabes"}],"order_id":"kLnlM7WW55OYIKA7sNt2","customer_id":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cash_change":3500,"ticket_units_consumed":0,"total":16500,"table_id":"quick-sale","debt_amount":0,"settled_amount":0,"payment_label":"cash"}}'::jsonb, '2026-05-08T18:27:42.042Z'::timestamptz, '2026-05-08T18:27:42.104383Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('977d6401-4e40-5259-a083-9b7643b1d21a', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, '9ZT6Zaqzd5rQRCzTVL6P', '', 'quick_sale', 'paid', 'paid', 26000, 0, 0, 26000, 0, 0, '2026-05-07T19:29:17.635Z'::timestamptz, '{"firebase":{"customer_id":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cash_change":0,"pending_debt_remaining":0,"table_name":"Mesa blanca","closed_at":"2026-05-07T19:29:17.635Z","order_id":"t2mV0bNPGIPxbfFMRid3","createdAt":"2026-05-07T19:29:17.635Z","items":[{"recipe_mode":"direct","category":"Almuerzos","ticket_units":10,"useTicket":false,"quantity":1,"name":"Almuerzo medium","ticket_eligible":true,"id":"hSJLYx7QAHYmsXLfUfro","price":16000,"product_type":"standard","ticket_validity_days":30,"note":""},{"category":"Sandwitch","ticket_units":10,"recipe_mode":"direct","note":"","price":10000,"product_type":"standard","ticket_validity_days":30,"id":"iALg0vvGm2d7NDoViOox","useTicket":false,"quantity":1,"ticket_eligible":false,"name":"Sandwitch"}],"customer_name":"","table_id":"x0OEOINMrf3LYW5eADGc","total":26000,"settled_amount":0,"debt_amount":0,"payment_label":"Pago dividido","ticket_units_consumed":0,"payment_breakdown":[{"amount":16000,"method":"cash"},{"method":"cash","amount":10000}],"subtotal":26000,"adjustment_pct":0,"income_kind":"cash","payment_method":"split","cash_received":0,"payment_status":"paid","closing_id":"Ls5tvsgxKAuERuCgeg2K","ticket_units_granted":0,"ticket_covered_amount":0,"concept":"Venta Mesa blanca","type":"income","adjustment_amount":0}}'::jsonb, '2026-05-07T19:29:17.635Z'::timestamptz, '2026-05-07T19:29:17.700776Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('09f55426-9a55-5ffd-be27-c583343d3680', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'aa903833-405f-5e86-a911-5872024028bd', null, '9i2gD0W1CqjQIA5nko0f', '', 'quick_sale', 'paid', 'paid', 29500, 0, 0, 0, 0, 0, '2026-05-12T18:43:36.171Z'::timestamptz, '{"firebase":{"payment_breakdown":[],"payment_method":"account_credit","cash_received":0,"payment_status":"paid","adjustment_pct":-100,"subtotal":29500,"settled_at":"2026-05-13T16:55:32.357Z","income_kind":"cash","ticket_covered_amount":0,"closing_id":"vsYhaNK2Jo4kA5QPIkBY","ticket_units_granted":0,"updatedAt":"2026-05-13T16:55:32.357Z","adjustment_amount":-29500,"type":"income","concept":"Venta Mesa de madera","cash_change":0,"customer_id":"NbOPtf5PG39cs18y5mtF","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","order_id":"pRYznmllvulCbCrBHOqW","items":[{"note":"","ticket_validity_days":30,"product_type":"standard","price":19000,"id":"0IHf7f0tLTKBCcFagc22","name":"Arroz con camarones","ticket_eligible":true,"useTicket":false,"quantity":1,"category":"Almuerzos","ticket_units":10,"recipe_mode":"direct"},{"recipe_mode":"direct","category":"Almuerzos","ticket_units":10,"id":"nRlFt9zSV5xfbBPy9pDe","useTicket":false,"quantity":1,"ticket_eligible":true,"name":"Almuerzo base","note":"","price":13500,"product_type":"standard","ticket_validity_days":30}],"createdAt":"2026-05-12T18:43:36.171Z","customer_name":"El mono","pending_debt_remaining":0,"closed_at":"2026-05-12T18:43:36.171Z","table_name":"Mesa de madera","payment_label":"Cuenta por cobrar","settled_amount":29500,"debt_amount":29500,"settlement_payment_method":"cash","table_id":"OR088fiPLjrUL6Ea2P3M","total":0,"ticket_units_consumed":0}}'::jsonb, '2026-05-12T18:43:36.171Z'::timestamptz, '2026-05-13T16:55:32.357Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('b18cb582-c08c-52b7-893c-c1a32e1a307f', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'AdD2wtEf5qyl4OsQU4Lj', '', 'quick_sale', 'paid', 'paid', 2000, 0, 0, 2000, 0, 0, '2026-05-07T16:45:18.416Z'::timestamptz, '{"firebase":{"closed_at":"2026-05-07T16:45:18.416Z","table_name":"Venta Rapida / Para llevar","pending_debt_remaining":0,"customer_name":"","createdAt":"2026-05-07T16:45:18.416Z","items":[{"category":"Pasabocas","ticket_units":10,"recipe_mode":"direct","note":"","ticket_validity_days":30,"product_type":"standard","price":2000,"id":"4b042YuI8xGzlA0dNo6Y","ticket_eligible":false,"name":"Hojaldra","useTicket":false,"quantity":1}],"order_id":"xsJpN7DnwKjOR5cOCwwe","customer_id":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cash_change":0,"ticket_units_consumed":0,"total":2000,"table_id":"quick-sale","payment_label":"cash","settled_amount":0,"debt_amount":0,"income_kind":"cash","adjustment_pct":0,"subtotal":2000,"cash_received":2000,"payment_status":"paid","payment_method":"cash","payment_breakdown":[{"method":"cash","amount":2000}],"concept":"Venta Venta Rapida / Para llevar","adjustment_amount":0,"type":"income","ticket_units_granted":0,"closing_id":"Ls5tvsgxKAuERuCgeg2K","ticket_covered_amount":0}}'::jsonb, '2026-05-07T16:45:18.416Z'::timestamptz, '2026-05-07T16:45:18.465266Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('17ebbf25-f105-5251-abae-ec1930681d92', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'CsjxCa7OkYqjQPvzFjL2', '', 'quick_sale', 'paid', 'paid', 13500, 0, 0, 13500, 0, 0, '2026-05-07T18:47:44.356Z'::timestamptz, '{"firebase":{"ticket_covered_amount":0,"ticket_units_granted":0,"closing_id":"Ls5tvsgxKAuERuCgeg2K","type":"income","adjustment_amount":0,"concept":"Venta Mesa larga","payment_breakdown":[{"amount":13500,"method":"nequi"}],"payment_method":"nequi","payment_status":"paid","cash_received":0,"subtotal":13500,"adjustment_pct":0,"income_kind":"cash","settled_amount":0,"debt_amount":0,"payment_label":"nequi","table_id":"rVv4OIwPnrp2wwNjrCpB","total":13500,"ticket_units_consumed":0,"cash_change":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null,"order_id":"K5MA1ucJMS6ppymEpx57","createdAt":"2026-05-07T18:47:44.356Z","items":[{"category":"Almuerzos","ticket_units":10,"recipe_mode":"direct","price":13500,"ticket_validity_days":30,"product_type":"standard","note":"","useTicket":false,"quantity":1,"name":"Almuerzo base","ticket_eligible":true,"id":"nRlFt9zSV5xfbBPy9pDe"}],"customer_name":"","pending_debt_remaining":0,"table_name":"Mesa larga","closed_at":"2026-05-07T18:47:44.356Z"}}'::jsonb, '2026-05-07T18:47:44.356Z'::timestamptz, '2026-05-07T18:47:44.407348Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('b45b952d-34e8-5ec4-9be0-9f43599c6f0d', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'EQt8kSY1PE5cL2nKJ6Js', '', 'quick_sale', 'paid', 'paid', 29000, 0, 0, 29000, 0, 0, '2026-05-08T18:16:52.946Z'::timestamptz, '{"firebase":{"subtotal":29000,"adjustment_pct":0,"income_kind":"cash","payment_method":"daviplata","payment_status":"paid","cash_received":0,"payment_breakdown":[{"method":"daviplata","amount":29000}],"concept":"Venta Venta Rapida / Para llevar","type":"income","adjustment_amount":0,"ticket_units_granted":0,"closing_id":"tQ1y0MqKNI2JtdRgNzJ9","ticket_covered_amount":0,"pending_debt_remaining":0,"table_name":"Venta Rapida / Para llevar","closed_at":"2026-05-08T18:16:52.946Z","order_id":"kl7FUdseHIiHz1YNAsUT","customer_name":"","items":[{"recipe_mode":"direct","category":"Desayuno","ticket_units":10,"id":"NSrw133cL36EsIrV8E1V","quantity":1,"useTicket":false,"ticket_eligible":false,"name":"Huevos revueltos","note":"","price":6000,"ticket_validity_days":30,"product_type":"standard"},{"recipe_mode":"direct","category":"Especiales","ticket_units":10,"id":"G76F8Yg9g6mn24gxICep","ticket_eligible":false,"name":"Bebida del mes","useTicket":false,"quantity":1,"note":"","product_type":"standard","ticket_validity_days":30,"price":8000},{"id":"5OFUIipkfj8djkMkGXGJ","useTicket":false,"quantity":1,"ticket_eligible":false,"name":"French toast","note":"","price":15000,"product_type":"standard","ticket_validity_days":30,"recipe_mode":"direct","category":"Desayuno","ticket_units":10}],"createdAt":"2026-05-08T18:16:52.946Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null,"cash_change":0,"ticket_units_consumed":0,"table_id":"quick-sale","total":29000,"settled_amount":0,"debt_amount":0,"payment_label":"daviplata"}}'::jsonb, '2026-05-08T18:16:52.946Z'::timestamptz, '2026-05-08T18:16:53.013656Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('48a184ca-8f28-574b-8155-afcccd13ce36', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'eb295e27-8049-5901-8704-23df7dcddcbc', null, 'EqzddhC27BpEvsU6AmhT', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-13T18:01:17.533Z'::timestamptz, '{"firebase":{"type":"income","adjustment_amount":0,"concept":"Venta Panca","ticket_covered_amount":13500,"ticket_units_granted":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","payment_method":"ticket_wallet","payment_status":"paid","cash_received":0,"subtotal":0,"adjustment_pct":0,"income_kind":"ticket_wallet","payment_breakdown":[{"amount":0,"method":"ticket_wallet"}],"sale_id":"3C8YUh0NVz0UE2Ok7V4P","ticket_units_consumed":1,"debt_amount":0,"settled_amount":0,"payment_label":"Tiquetera","table_id":"IaKZHUBjqeglJP02wDj6","table_session_id":"tJ0E4pb5xeoLWxWc6SwM","total":0,"order_id":"amFWgvuWXdWmiZFBqlGC","tableSessionId":"tJ0E4pb5xeoLWxWc6SwM","customer_name":"Samuel","createdAt":"2026-05-13T18:01:17.533Z","items":[{"category":"Almuerzos","status":"delivered","ticket_units":10,"modifiers":[],"unitPrice":13500,"sentAt":"2026-05-13T17:57:02.216Z","ticket_validity_days":30,"note":"","name":"Almuerzo base","ticket_eligible":true,"subtotal":13500,"useTicket":true,"productId":"nRlFt9zSV5xfbBPy9pDe","recipe_mode":"direct","lineId":"6e7aea6c-0ac5-4ddf-918b-ed51ff7b6d7f","product_type":"standard","price":13500,"notes":"","productName":"Almuerzo base","quantity":1,"id":"nRlFt9zSV5xfbBPy9pDe"}],"pending_debt_remaining":0,"paid_amount":0,"table_name":"Panca","closed_at":"2026-05-13T18:01:17.533Z","cash_change":0,"customer_id":"CEj6ahhroDiVbXDGRT5K","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-13T18:01:17.533Z'::timestamptz, '2026-05-13T18:01:17.623003Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('2fb429ce-09ba-5d9c-82f6-39bfc20730a2', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'dd03276b-4f44-5772-a0d2-9bf6a0cf0221', null, 'IICa0S26bV044sD415Qg', '', 'quick_sale', 'paid', 'paid', 6000, 0, 0, 0, 0, 0, '2026-05-12T17:33:52.052Z'::timestamptz, '{"firebase":{"payment_breakdown":[],"payment_status":"paid","cash_received":0,"payment_method":"account_credit","income_kind":"mixed_ticket","subtotal":6000,"settled_at":"2026-05-13T18:07:37.553Z","adjustment_pct":-100,"ticket_covered_amount":13500,"updatedAt":"2026-05-13T18:07:37.553Z","closing_id":"vsYhaNK2Jo4kA5QPIkBY","ticket_units_granted":0,"type":"income","adjustment_amount":-6000,"concept":"Venta Venta Rapida / Para llevar","cash_change":0,"customer_id":"I3OAdrJ5WY5AiNPQWmmx","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-12T17:33:52.052Z","items":[{"category":"Almuerzos","ticket_units":10,"recipe_mode":"direct","product_type":"standard","ticket_validity_days":30,"price":13500,"note":"","ticket_eligible":true,"name":"Almuerzo base","useTicket":true,"quantity":1,"id":"nRlFt9zSV5xfbBPy9pDe"},{"product_type":"standard","ticket_validity_days":30,"price":3000,"note":"","ticket_eligible":false,"name":"Desechables","useTicket":false,"quantity":2,"id":"8RjzaXeAOgtUCGRNR5if","category":"Desechabes","ticket_units":10,"recipe_mode":"direct"}],"customer_name":"Vanessa","order_id":"JYU1CfDma4wt0bZDTnig","table_name":"Venta Rapida / Para llevar","closed_at":"2026-05-12T17:33:52.052Z","pending_debt_remaining":0,"settlement_payment_method":"cash","debt_amount":6000,"settled_amount":6000,"payment_label":"Cuenta por cobrar","total":0,"table_id":"quick-sale","ticket_units_consumed":1}}'::jsonb, '2026-05-12T17:33:52.052Z'::timestamptz, '2026-05-13T18:07:37.553Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('6a652a8b-8f85-5cd6-85a2-fc04ccd5afb1', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'ISr3SKq8mJyS6PI7ysEG', '', 'quick_sale', 'paid', 'paid', 13500, 0, 0, 13500, 13500, 0, '2026-05-13T19:05:21.646Z'::timestamptz, '{"firebase":{"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null,"cash_change":0,"closed_at":"2026-05-13T19:05:21.646Z","table_name":"Mesa blanca","pending_debt_remaining":0,"paid_amount":13500,"customer_name":"","items":[{"ticket_validity_days":30,"sentAt":"2026-05-13T18:49:18.327Z","note":"Pechuga","name":"Almuerzo base","ticket_eligible":true,"subtotal":13500,"useTicket":false,"ticket_units":10,"status":"ready","category":"Almuerzos","modifiers":[],"unitPrice":13500,"product_type":"standard","price":13500,"notes":"Pechuga","productName":"Almuerzo base","quantity":1,"id":"nRlFt9zSV5xfbBPy9pDe","productId":"nRlFt9zSV5xfbBPy9pDe","lineId":"7c71fa0e-b06c-4228-a93b-c73cd3bd6c66","recipe_mode":"direct"}],"createdAt":"2026-05-13T19:05:21.646Z","tableSessionId":"2t2lU4nGlHu05qxhhW5L","order_id":"GGJc6DESLd0O8Ce64zts","total":13500,"table_session_id":"2t2lU4nGlHu05qxhhW5L","table_id":"x0OEOINMrf3LYW5eADGc","payment_label":"nequi","settled_amount":13500,"debt_amount":0,"ticket_units_consumed":0,"sale_id":"HFms3meDUAUOAt9nZo2R","payment_breakdown":[{"method":"nequi","amount":13500}],"income_kind":"cash","adjustment_pct":0,"subtotal":13500,"payment_status":"paid","cash_received":0,"payment_method":"nequi","ticket_units_granted":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","ticket_covered_amount":0,"concept":"Venta Mesa blanca","adjustment_amount":0,"type":"income"}}'::jsonb, '2026-05-13T19:05:21.646Z'::timestamptz, '2026-05-13T19:05:21.740504Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('ac9b1097-5534-51ad-b91a-49e2e52b4088', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'IwVGrETnjoxS6XiSYCWk', '', 'quick_sale', 'paid', 'paid', 19000, 0, 0, 22000, 0, 0, '2026-05-12T17:32:33.405Z'::timestamptz, '{"firebase":{"ticket_covered_amount":0,"closing_id":"vsYhaNK2Jo4kA5QPIkBY","ticket_units_granted":0,"type":"income","adjustment_amount":3000,"concept":"Venta Mesa de madera","payment_breakdown":[{"method":"cash","amount":22000}],"payment_method":"cash","payment_status":"paid","cash_received":50000,"subtotal":19000,"adjustment_pct":15.789473684210526,"income_kind":"cash","settled_amount":0,"debt_amount":0,"payment_label":"cash","table_id":"OR088fiPLjrUL6Ea2P3M","total":22000,"ticket_units_consumed":0,"cash_change":28000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null,"order_id":"QpgcnYsmd2HNPyjtXTRP","createdAt":"2026-05-12T17:32:33.405Z","items":[{"recipe_mode":"direct","category":"Almuerzos","ticket_units":10,"name":"Arroz con camarones","ticket_eligible":true,"useTicket":false,"quantity":1,"id":"0IHf7f0tLTKBCcFagc22","ticket_validity_days":30,"product_type":"standard","price":19000,"note":""}],"customer_name":"","pending_debt_remaining":0,"table_name":"Mesa de madera","closed_at":"2026-05-12T17:32:33.405Z"}}'::jsonb, '2026-05-12T17:32:33.405Z'::timestamptz, '2026-05-12T17:32:33.481857Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('3ec853ad-27a2-5f72-af8b-613e05c25776', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'dd03276b-4f44-5772-a0d2-9bf6a0cf0221', null, 'K9gigyv6RRIf9QWtveA4', '', 'quick_sale', 'paid', 'paid', 6000, 0, 0, 6000, 0, 0, '2026-05-13T18:07:37.553Z'::timestamptz, '{"firebase":{"debt_amount":0,"linked_sale_id":"IICa0S26bV044sD415Qg","closing_id":"YUv8HDxGq3rBKRJ4dlm9","total":6000,"table_id":"quick-sale","type":"income","concept":"Abono cartera Vanessa","payment_breakdown":[{"amount":6000,"method":"cash"}],"customer_id":"I3OAdrJ5WY5AiNPQWmmx","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_name":"Vanessa","items":[],"createdAt":"2026-05-13T18:07:37.553Z","settlement":true,"payment_method":"cash","table_name":"Venta Rapida / Para llevar","closed_at":"2026-05-13T18:07:37.553Z","subtotal":6000,"pending_debt_remaining":0}}'::jsonb, '2026-05-13T18:07:37.553Z'::timestamptz, '2026-05-13T18:07:37.611769Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('4da85b03-f8bd-5f92-bd42-c7f7eae6fd89', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'ae0fe857-fa90-5ea1-a23a-f3c63e3ddce2', null, 'LAsHiv7llnUhDDauxWet', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-13T19:14:23.834Z'::timestamptz, '{"firebase":{"payment_method":"cash","customer_name":"María José","createdAt":"2026-05-13T19:14:23.834Z","items":[{"price":0,"ticket_units":15,"product_type":"meal_ticket","id":"n8sAwbUkda9pFot5xO52","quantity":1,"name":"Personalizada"}],"linked_ticket_id":"n8sAwbUkda9pFot5xO52","subtotal":0,"income_kind":"meal_ticket_sale","closed_at":"2026-05-13T19:14:23.834Z","payment_breakdown":[],"customer_id":"z16gIYUt5AHnyWZcDf96","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sale_id":"h5qA1MK3jnwlls7YbGLF","payment_kind":"prepaid_ticket_sale","type":"income","ticket_units_consumed":0,"concept":"Venta ticketera María José","payment_label":"cash","ticket_covered_amount":0,"total":0,"ticket_units_granted":15,"closing_id":"YUv8HDxGq3rBKRJ4dlm9"}}'::jsonb, '2026-05-13T19:14:23.834Z'::timestamptz, '2026-05-13T19:14:24.012821Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('962a8e39-6cf8-5753-933a-fee85d50e300', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'OnHE7tKnLD8zIbdM5DKZ', '', 'quick_sale', 'paid', 'paid', 18000, 0, 0, 18000, 18000, 0, '2026-05-13T18:07:22.733Z'::timestamptz, '{"firebase":{"payment_label":"cash","settled_amount":18000,"debt_amount":0,"total":18000,"table_session_id":"ixvrEdnZwG1RPacOrvrx","table_id":"x0OEOINMrf3LYW5eADGc","ticket_units_consumed":0,"cash_change":2000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null,"customer_name":"","createdAt":"2026-05-13T18:07:22.733Z","items":[{"note":"","ticket_validity_days":30,"sentAt":"2026-05-13T17:28:37.737Z","subtotal":18000,"useTicket":false,"name":"Pasta con mariscos","ticket_eligible":false,"modifiers":[],"category":"Almuerzos","status":"delivered","ticket_units":10,"unitPrice":18000,"notes":"","price":18000,"product_type":"standard","id":"KwvK2FgAoGuy93uYSUPP","productName":"Pasta con mariscos","quantity":1,"lineId":"cd5f97a3-886f-437e-8a73-4ecb5c948cd8","recipe_mode":"direct","productId":"KwvK2FgAoGuy93uYSUPP"}],"tableSessionId":"ixvrEdnZwG1RPacOrvrx","order_id":"sxhrXVOdWA9cTOz0Japd","closed_at":"2026-05-13T18:07:22.733Z","table_name":"Mesa blanca","paid_amount":18000,"pending_debt_remaining":0,"ticket_covered_amount":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","ticket_units_granted":0,"adjustment_amount":0,"type":"income","concept":"Venta Mesa blanca","payment_breakdown":[{"method":"cash","amount":18000}],"sale_id":"Uzlqce9dB3Sim2plxOdU","payment_status":"paid","cash_received":20000,"payment_method":"cash","income_kind":"cash","adjustment_pct":0,"subtotal":18000}}'::jsonb, '2026-05-13T18:07:22.733Z'::timestamptz, '2026-05-13T18:07:22.823959Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('e9a061c3-6c90-5220-b12b-48d52ee44550', 'c08a64ca-23dd-4599-b680-6192d14676aa', '8baaa4d7-231a-535d-a859-77ab8c46bd0d', null, 'OupeyKcZhyDehFEiJgLD', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-07T21:34:53.854Z'::timestamptz, '{"firebase":{"payment_label":"Tiquetera","debt_amount":0,"settled_amount":0,"total":0,"table_id":"x0OEOINMrf3LYW5eADGc","ticket_units_consumed":1,"cash_change":0,"customer_id":"5y5Hefq4dhQ3G130kmaX","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_name":"Sara","createdAt":"2026-05-07T21:34:53.854Z","items":[{"category":"Almuerzos","ticket_units":10,"recipe_mode":"direct","note":"","price":13500,"product_type":"standard","ticket_validity_days":30,"id":"nRlFt9zSV5xfbBPy9pDe","useTicket":false,"quantity":1,"ticket_eligible":true,"name":"Almuerzo base"}],"order_id":"rBEHOxrj9kgmvX0YMTOW","closed_at":"2026-05-07T21:34:53.854Z","table_name":"Mesa blanca","pending_debt_remaining":0,"ticket_covered_amount":13500,"closing_id":"Ls5tvsgxKAuERuCgeg2K","ticket_units_granted":0,"adjustment_amount":0,"type":"income","concept":"Venta Mesa blanca","payment_breakdown":[{"method":"ticket_wallet","amount":0}],"payment_status":"paid","cash_received":0,"payment_method":"ticket_wallet","income_kind":"ticket_wallet","adjustment_pct":0,"subtotal":0}}'::jsonb, '2026-05-07T21:34:53.854Z'::timestamptz, '2026-05-07T21:34:53.917184Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('ead68bdd-66c4-52c3-a7f8-46c5f265a93f', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'P3W8203tfCWWsHYfH5YL', '', 'quick_sale', 'paid', 'paid', 6500, 0, 0, 6500, 6500, 0, '2026-05-13T18:58:52.944Z'::timestamptz, '{"firebase":{"total":6500,"table_session_id":null,"table_id":"quick-sale","payment_label":"Pago dividido","debt_amount":0,"settled_amount":6500,"ticket_units_consumed":0,"customer_id":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cash_change":0,"closed_at":"2026-05-13T18:58:52.944Z","table_name":"Venta Rapida / Para llevar","pending_debt_remaining":0,"paid_amount":6500,"createdAt":"2026-05-13T18:58:52.944Z","items":[{"id":"NtKIBqeTd4ckJu7NJyWF","productName":"Café Tinto","quantity":1,"technicalSheetId":"","notes":"","requiresKitchen":false,"categoryId":"","product_type":"standard","price":2500,"recipe_mode":"direct","productId":"NtKIBqeTd4ckJu7NJyWF","kitchenStationId":"none","kitchenStationName":"No requiere preparacion","name":"Café Tinto","ticket_eligible":false,"useTicket":false,"note":"","inventoryImpactMode":"none","ticket_validity_days":30,"unitPrice":2500,"modifiers":[],"ticket_units":10,"category":"Bebidas calientes"},{"notes":"","requiresKitchen":true,"technicalSheetId":"","price":4000,"categoryId":"","product_type":"standard","id":"MHAFSOy9SBrkdxIcUYcu","productName":"Mantecada","quantity":1,"kitchenStationName":"Postres","recipe_mode":"direct","kitchenStationId":"desserts","productId":"MHAFSOy9SBrkdxIcUYcu","note":"","ticket_validity_days":30,"inventoryImpactMode":"none","useTicket":false,"name":"Mantecada","ticket_eligible":false,"modifiers":[],"ticket_units":10,"category":"Postres","unitPrice":4000}],"customer_name":"","tableSessionId":null,"order_id":"3HrcUdAbDLEt1FAzHFV9","ticket_units_granted":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","ticket_covered_amount":0,"concept":"Venta Venta Rapida / Para llevar","adjustment_amount":0,"type":"income","sale_id":"8BanRG5OTLSnWls8Dscd","payment_breakdown":[{"amount":500,"method":"cash"},{"method":"nequi","amount":6000}],"income_kind":"cash","adjustment_pct":0,"subtotal":6500,"payment_status":"paid","cash_received":0,"payment_method":"split"}}'::jsonb, '2026-05-13T18:58:52.944Z'::timestamptz, '2026-05-13T18:58:53.039941Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('97e99fbc-2568-5563-b5ec-5debe3852172', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'aa903833-405f-5e86-a911-5872024028bd', null, 'Pg4zb2viWzBI2cIv9707', '', 'quick_sale', 'paid', 'paid', 29500, 0, 0, 29500, 0, 0, '2026-05-13T16:55:32.357Z'::timestamptz, '{"firebase":{"payment_breakdown":[{"method":"cash","amount":29500}],"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":"NbOPtf5PG39cs18y5mtF","createdAt":"2026-05-13T16:55:32.357Z","items":[],"customer_name":"El mono","settlement":true,"payment_method":"cash","table_name":"Mesa de madera","closed_at":"2026-05-13T16:55:32.357Z","subtotal":29500,"pending_debt_remaining":0,"debt_amount":0,"linked_sale_id":"9i2gD0W1CqjQIA5nko0f","total":29500,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","table_id":"OR088fiPLjrUL6Ea2P3M","type":"income","concept":"Abono cartera El mono"}}'::jsonb, '2026-05-13T16:55:32.357Z'::timestamptz, '2026-05-13T16:55:32.497061Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('0280ce94-0fac-5c0b-a077-48ff700a7733', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'QCDE6LcrbRN2lpjCND6w', '', 'quick_sale', 'paid', 'paid', 13500, 0, 0, 13500, 0, 0, '2026-05-08T18:10:58.496Z'::timestamptz, '{"firebase":{"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null,"cash_change":6500,"table_name":"Mesa blanca","closed_at":"2026-05-08T18:10:58.496Z","pending_debt_remaining":0,"createdAt":"2026-05-08T18:10:58.496Z","items":[{"quantity":1,"useTicket":false,"name":"Almuerzo base","ticket_eligible":true,"id":"nRlFt9zSV5xfbBPy9pDe","price":13500,"ticket_validity_days":30,"product_type":"standard","note":"","recipe_mode":"direct","ticket_units":10,"category":"Almuerzos"}],"customer_name":"","order_id":"2X7o6nlX7Sv7WzCBpD1a","total":13500,"table_id":"x0OEOINMrf3LYW5eADGc","settled_amount":0,"debt_amount":0,"payment_label":"cash","ticket_units_consumed":0,"payment_breakdown":[{"method":"cash","amount":13500}],"income_kind":"cash","subtotal":13500,"adjustment_pct":0,"payment_status":"paid","cash_received":20000,"payment_method":"cash","ticket_units_granted":0,"closing_id":"tQ1y0MqKNI2JtdRgNzJ9","ticket_covered_amount":0,"concept":"Venta Mesa blanca","type":"income","adjustment_amount":0}}'::jsonb, '2026-05-08T18:10:58.496Z'::timestamptz, '2026-05-08T18:10:58.559219Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('686dfa8d-a4af-57c0-ac34-a62c6ea64d4d', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'QT4Kifi61YcgcKV1mriR', '', 'quick_sale', 'paid', 'paid', 60000, 0, 0, 48000, 0, 0, '2026-05-07T17:52:58.393Z'::timestamptz, '{"firebase":{"createdAt":"2026-05-07T17:52:58.393Z","items":[{"id":"aye5SgAWlvUqgaQF65xl","ticket_eligible":false,"name":"Corbina","quantity":2,"useTicket":false,"note":"","ticket_validity_days":30,"product_type":"standard","price":30000,"recipe_mode":"direct","category":"Especiales","ticket_units":10}],"customer_name":"","order_id":"IdSRjfOBchbKJdlAdr9V","table_name":"Mesa de madera","closed_at":"2026-05-07T17:52:58.393Z","pending_debt_remaining":0,"cash_change":52000,"customer_id":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","ticket_units_consumed":0,"debt_amount":0,"settled_amount":0,"payment_label":"cash","total":48000,"table_id":"OR088fiPLjrUL6Ea2P3M","payment_status":"paid","cash_received":100000,"payment_method":"cash","income_kind":"cash","subtotal":60000,"adjustment_pct":-20,"payment_breakdown":[{"amount":48000,"method":"cash"}],"type":"income","adjustment_amount":-12000,"concept":"Venta Mesa de madera","ticket_covered_amount":0,"ticket_units_granted":0,"closing_id":"Ls5tvsgxKAuERuCgeg2K"}}'::jsonb, '2026-05-07T17:52:58.393Z'::timestamptz, '2026-05-07T17:52:58.454536Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('cdd43316-814f-51dd-87f4-8dc28672b8ba', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'eb295e27-8049-5901-8704-23df7dcddcbc', null, 'RGRbxtN9XgAIdeq4zKXU', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-07T17:04:45.299Z'::timestamptz, '{"firebase":{"payment_status":"paid","cash_received":0,"payment_method":"ticket_wallet","income_kind":"ticket_wallet","adjustment_pct":0,"subtotal":0,"payment_breakdown":[{"method":"ticket_wallet","amount":0}],"adjustment_amount":0,"type":"income","concept":"Venta Venta Rapida / Para llevar","ticket_covered_amount":13500,"ticket_units_granted":0,"closing_id":"Ls5tvsgxKAuERuCgeg2K","createdAt":"2026-05-07T17:04:45.299Z","items":[{"ticket_eligible":true,"name":"Almuerzo base","useTicket":true,"quantity":1,"id":"nRlFt9zSV5xfbBPy9pDe","product_type":"standard","ticket_validity_days":30,"price":13500,"note":"","recipe_mode":"direct","category":"Almuerzos","ticket_units":10}],"customer_name":"Samuel","order_id":"TtwWNojrAUCI5jfpdjtw","closed_at":"2026-05-07T17:04:45.299Z","table_name":"Venta Rapida / Para llevar","pending_debt_remaining":0,"cash_change":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":"CEj6ahhroDiVbXDGRT5K","ticket_units_consumed":1,"payment_label":"Tiquetera","settled_amount":0,"debt_amount":0,"total":0,"table_id":"quick-sale"}}'::jsonb, '2026-05-07T17:04:45.299Z'::timestamptz, '2026-05-07T17:04:45.362970Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('a4f5d2a9-4566-50ff-bbd4-d06ea5f7cf64', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'ScujejpxThLr94qYfERZ', '', 'quick_sale', 'paid', 'paid', 48500, 0, 0, 48500, 0, 0, '2026-05-12T18:40:52.330Z'::timestamptz, '{"firebase":{"order_id":"MKVAIUBMaWJXCDMbFJEj","items":[{"category":"Almuerzos","ticket_units":10,"recipe_mode":"direct","note":"","price":13500,"product_type":"standard","ticket_validity_days":30,"id":"nRlFt9zSV5xfbBPy9pDe","useTicket":false,"quantity":1,"ticket_eligible":true,"name":"Almuerzo base"},{"recipe_mode":"direct","category":"Almuerzos","ticket_units":10,"ticket_eligible":true,"name":"Almuerzo medium","useTicket":false,"quantity":1,"id":"hSJLYx7QAHYmsXLfUfro","product_type":"standard","ticket_validity_days":30,"price":16000,"note":""},{"ticket_units":10,"category":"Almuerzos","recipe_mode":"direct","price":19000,"ticket_validity_days":30,"product_type":"standard","note":"","quantity":1,"useTicket":false,"name":"Arroz con camarones","ticket_eligible":true,"id":"0IHf7f0tLTKBCcFagc22"}],"createdAt":"2026-05-12T18:40:52.330Z","customer_name":"","pending_debt_remaining":0,"table_name":"Mesa blanca","closed_at":"2026-05-12T18:40:52.330Z","cash_change":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null,"ticket_units_consumed":0,"debt_amount":0,"settled_amount":0,"payment_label":"Pago dividido","table_id":"x0OEOINMrf3LYW5eADGc","total":48500,"payment_method":"split","cash_received":0,"payment_status":"paid","subtotal":48500,"adjustment_pct":0,"income_kind":"cash","payment_breakdown":[{"amount":19000,"method":"daviplata"},{"method":"daviplata","amount":16000},{"amount":13500,"method":"cash"}],"type":"income","adjustment_amount":0,"concept":"Venta Mesa blanca","ticket_covered_amount":0,"closing_id":"vsYhaNK2Jo4kA5QPIkBY","ticket_units_granted":0}}'::jsonb, '2026-05-12T18:40:52.330Z'::timestamptz, '2026-05-12T18:40:52.423131Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('13abefd3-0af3-56cf-b9d5-6a9227a7e99c', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'SeHeCQPPSyaIQ1LhY77x', '', 'quick_sale', 'paid', 'paid', 19000, 0, 0, 19000, 0, 0, '2026-05-12T17:37:15.041Z'::timestamptz, '{"firebase":{"payment_breakdown":[{"method":"cash","amount":19000}],"subtotal":19000,"adjustment_pct":0,"income_kind":"cash","payment_method":"cash","cash_received":19000,"payment_status":"paid","closing_id":"vsYhaNK2Jo4kA5QPIkBY","ticket_units_granted":0,"ticket_covered_amount":0,"concept":"Venta Venta Rapida / Para llevar","type":"income","adjustment_amount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null,"cash_change":0,"pending_debt_remaining":0,"table_name":"Venta Rapida / Para llevar","closed_at":"2026-05-12T17:37:15.041Z","order_id":"9Pe3F0pI6esiNUR6zT6q","createdAt":"2026-05-12T17:37:15.041Z","items":[{"id":"0IHf7f0tLTKBCcFagc22","quantity":1,"useTicket":false,"name":"Arroz con camarones","ticket_eligible":true,"note":"","price":19000,"ticket_validity_days":30,"product_type":"standard","recipe_mode":"direct","ticket_units":10,"category":"Almuerzos"}],"customer_name":"","table_id":"quick-sale","total":19000,"settled_amount":0,"debt_amount":0,"payment_label":"cash","ticket_units_consumed":0}}'::jsonb, '2026-05-12T17:37:15.041Z'::timestamptz, '2026-05-12T17:37:15.104881Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('9ea0c6f9-8f57-56ec-b113-4bfe990a669d', 'c08a64ca-23dd-4599-b680-6192d14676aa', '2171ae6e-badd-55fa-b15f-9cf5086724e9', null, 'U14gUNHFnNULZ0mCRgZN', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-12T20:33:39.279Z'::timestamptz, '{"firebase":{"payment_label":"Tiquetera","settled_amount":0,"debt_amount":0,"table_id":"OR088fiPLjrUL6Ea2P3M","total":0,"ticket_units_consumed":1,"cash_change":0,"customer_id":"OpObwErenP46Rt5emKSr","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","order_id":"ja145CKmVjRokejDAXUL","customer_name":"Leidy","items":[{"note":"","price":13500,"product_type":"standard","ticket_validity_days":30,"id":"nRlFt9zSV5xfbBPy9pDe","useTicket":false,"quantity":1,"ticket_eligible":true,"name":"Almuerzo base","category":"Almuerzos","ticket_units":10,"recipe_mode":"direct"}],"createdAt":"2026-05-12T20:33:39.279Z","pending_debt_remaining":0,"closed_at":"2026-05-12T20:33:39.279Z","table_name":"Mesa de madera","ticket_covered_amount":13500,"closing_id":"vsYhaNK2Jo4kA5QPIkBY","ticket_units_granted":0,"adjustment_amount":0,"type":"income","concept":"Venta Mesa de madera","payment_breakdown":[{"method":"ticket_wallet","amount":0}],"payment_method":"ticket_wallet","cash_received":0,"payment_status":"paid","adjustment_pct":0,"subtotal":0,"income_kind":"ticket_wallet"}}'::jsonb, '2026-05-12T20:33:39.279Z'::timestamptz, '2026-05-12T20:33:39.349794Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('3ffc2141-c4f1-507f-9778-b1cfb594f49e', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'ULAfArAtdGcr0mgSmfqQ', '', 'quick_sale', 'paid', 'paid', 32000, 0, 0, 32000, 32000, 0, '2026-05-13T18:41:19.930Z'::timestamptz, '{"firebase":{"sale_id":"m6U0cwGB2B1XbJyzRZ98","payment_breakdown":[{"method":"cash","amount":32000}],"adjustment_pct":0,"subtotal":32000,"income_kind":"cash","payment_method":"cash","cash_received":50000,"payment_status":"paid","ticket_units_granted":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","ticket_covered_amount":0,"concept":"Venta Mesa blanca","adjustment_amount":0,"type":"income","customer_id":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cash_change":18000,"pending_debt_remaining":0,"paid_amount":32000,"closed_at":"2026-05-13T18:41:19.930Z","table_name":"Mesa blanca","order_id":"wQG7DsloA8LsOjd6UhIB","customer_name":"","items":[{"unitPrice":16000,"modifiers":[],"category":"Almuerzos","status":"ready","ticket_units":10,"subtotal":32000,"useTicket":false,"name":"Almuerzo medium","ticket_eligible":true,"note":"","sentAt":"2026-05-13T18:16:40.164Z","ticket_validity_days":30,"lineId":"0897a30b-9e73-45af-a80b-452cfeb01423","recipe_mode":"direct","productId":"hSJLYx7QAHYmsXLfUfro","id":"hSJLYx7QAHYmsXLfUfro","productName":"Almuerzo medium","quantity":2,"notes":"","price":16000,"product_type":"standard"}],"createdAt":"2026-05-13T18:41:19.930Z","tableSessionId":"2e09quWoo3UCySGKZv48","table_session_id":"2e09quWoo3UCySGKZv48","table_id":"x0OEOINMrf3LYW5eADGc","total":32000,"payment_label":"cash","settled_amount":32000,"debt_amount":0,"ticket_units_consumed":0}}'::jsonb, '2026-05-13T18:41:19.930Z'::timestamptz, '2026-05-13T18:41:20.012286Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('32334419-39a9-5712-8e79-d4ca72f458cc', 'c08a64ca-23dd-4599-b680-6192d14676aa', '2171ae6e-badd-55fa-b15f-9cf5086724e9', null, 'Um5d0Jxj7PlBG6YBCAe5', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-07T18:22:44.786Z'::timestamptz, '{"firebase":{"payment_label":"Tiquetera","debt_amount":0,"settled_amount":0,"total":0,"table_id":"odeLtmduCX2hXlUrhHHZ","ticket_units_consumed":1,"cash_change":0,"customer_id":"OpObwErenP46Rt5emKSr","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-07T18:22:44.786Z","items":[{"recipe_mode":"direct","category":"Almuerzos","ticket_units":10,"ticket_eligible":true,"name":"Almuerzo base","quantity":1,"useTicket":false,"id":"nRlFt9zSV5xfbBPy9pDe","ticket_validity_days":30,"product_type":"standard","price":13500,"note":""}],"customer_name":"Leidy","order_id":"87mHhlv4CtniicegkZhm","closed_at":"2026-05-07T18:22:44.786Z","table_name":"Mesa rosada terraza","pending_debt_remaining":0,"ticket_covered_amount":13500,"closing_id":"Ls5tvsgxKAuERuCgeg2K","ticket_units_granted":0,"adjustment_amount":0,"type":"income","concept":"Venta Mesa rosada terraza","payment_breakdown":[{"method":"ticket_wallet","amount":0}],"cash_received":0,"payment_status":"paid","payment_method":"ticket_wallet","income_kind":"ticket_wallet","adjustment_pct":0,"subtotal":0}}'::jsonb, '2026-05-07T18:22:44.786Z'::timestamptz, '2026-05-07T18:22:44.845050Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('2e9fcafb-80b1-5c33-a1f2-512c37da7ad7', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'VCyqps8SZqj14UKU9Rug', '', 'quick_sale', 'paid', 'paid', 32000, 0, 0, 32000, 0, 0, '2026-05-12T19:14:45.664Z'::timestamptz, '{"firebase":{"ticket_covered_amount":0,"ticket_units_granted":0,"closing_id":"vsYhaNK2Jo4kA5QPIkBY","type":"income","adjustment_amount":0,"concept":"Venta Mesa blanca","payment_breakdown":[{"method":"nequi","amount":16000},{"method":"cash","amount":16000}],"payment_status":"paid","cash_received":0,"payment_method":"split","income_kind":"cash","subtotal":32000,"adjustment_pct":0,"settled_amount":0,"debt_amount":0,"payment_label":"Pago dividido","total":32000,"table_id":"x0OEOINMrf3LYW5eADGc","ticket_units_consumed":0,"cash_change":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null,"customer_name":"","createdAt":"2026-05-12T19:14:45.664Z","items":[{"price":16000,"ticket_validity_days":30,"product_type":"standard","note":"","useTicket":false,"quantity":2,"name":"Almuerzo medium","ticket_eligible":true,"id":"hSJLYx7QAHYmsXLfUfro","category":"Almuerzos","ticket_units":10,"recipe_mode":"direct"}],"order_id":"eD0lC68gYvbaXhKe1DSa","table_name":"Mesa blanca","closed_at":"2026-05-12T19:14:45.664Z","pending_debt_remaining":0}}'::jsonb, '2026-05-12T19:14:45.664Z'::timestamptz, '2026-05-12T19:14:45.744843Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('e98c0ce3-f05d-50a3-ad91-9bf48bd3363c', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'dd03276b-4f44-5772-a0d2-9bf6a0cf0221', null, 'VGNXOabFf5BeRU9oQBFO', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-13T18:05:40.236Z'::timestamptz, '{"firebase":{"closed_at":"2026-05-13T18:05:40.236Z","table_name":"Venta Rapida / Para llevar","pending_debt_remaining":0,"paid_amount":0,"customer_name":"Vanessa","items":[{"kitchenStationName":"No requiere preparacion","recipe_mode":"direct","productId":"nRlFt9zSV5xfbBPy9pDe","kitchenStationId":"none","technicalSheetId":"","requiresKitchen":false,"notes":"","categoryId":"","product_type":"standard","price":13500,"id":"nRlFt9zSV5xfbBPy9pDe","quantity":1,"productName":"Almuerzo base","modifiers":[],"category":"Almuerzos","ticket_units":10,"unitPrice":13500,"note":"","inventoryImpactMode":"none","ticket_validity_days":30,"name":"Almuerzo base","ticket_eligible":true,"useTicket":true}],"createdAt":"2026-05-13T18:05:40.236Z","tableSessionId":null,"order_id":"4OX3gUeeMvx7EHPS2fMq","customer_id":"I3OAdrJ5WY5AiNPQWmmx","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cash_change":0,"ticket_units_consumed":1,"total":0,"table_session_id":null,"table_id":"quick-sale","payment_label":"Tiquetera","settled_amount":0,"debt_amount":0,"income_kind":"ticket_wallet","adjustment_pct":0,"subtotal":0,"cash_received":0,"payment_status":"paid","payment_method":"ticket_wallet","sale_id":"tgkRo7vwurXeG4Xqkd0e","payment_breakdown":[{"amount":0,"method":"ticket_wallet"}],"concept":"Venta Venta Rapida / Para llevar","adjustment_amount":0,"type":"income","ticket_units_granted":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","ticket_covered_amount":13500}}'::jsonb, '2026-05-13T18:05:40.236Z'::timestamptz, '2026-05-13T18:05:40.324356Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('7fb15a6b-8f5d-574f-a0d5-0586a851d7b6', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'XK4LkcJpr9GNsIplyFUC', '', 'quick_sale', 'paid', 'paid', 13500, 0, 0, 13500, 0, 0, '2026-05-08T18:30:40.309Z'::timestamptz, '{"firebase":{"order_id":"9nid4bZIOQ0WOH6prMCT","createdAt":"2026-05-08T18:30:40.309Z","items":[{"category":"Almuerzos","ticket_units":10,"recipe_mode":"direct","ticket_validity_days":30,"product_type":"standard","price":13500,"note":"","ticket_eligible":true,"name":"Almuerzo base","quantity":1,"useTicket":false,"id":"nRlFt9zSV5xfbBPy9pDe"}],"customer_name":"","pending_debt_remaining":0,"table_name":"Barra","closed_at":"2026-05-08T18:30:40.309Z","cash_change":0,"customer_id":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","ticket_units_consumed":0,"debt_amount":0,"settled_amount":0,"payment_label":"nequi","table_id":"CGi1vRxujjrFAC6qJbQ8","total":13500,"payment_method":"nequi","payment_status":"paid","cash_received":0,"subtotal":13500,"adjustment_pct":0,"income_kind":"cash","payment_breakdown":[{"amount":13500,"method":"nequi"}],"type":"income","adjustment_amount":0,"concept":"Venta Barra","ticket_covered_amount":0,"ticket_units_granted":0,"closing_id":"tQ1y0MqKNI2JtdRgNzJ9"}}'::jsonb, '2026-05-08T18:30:40.309Z'::timestamptz, '2026-05-08T18:30:40.389009Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('bfbc39bf-80c3-5990-813a-dddc2a11ed4a', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'XsLyzYHb5ElGs2otyzQl', '', 'quick_sale', 'paid', 'paid', 19000, 0, 0, 19000, 19000, 0, '2026-05-13T18:11:45.237Z'::timestamptz, '{"firebase":{"cash_change":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null,"order_id":"U1LydqAUu0anuyYMbY2r","createdAt":"2026-05-13T18:11:45.237Z","items":[{"unitPrice":19000,"modifiers":[],"category":"Almuerzos","status":"delivered","ticket_units":10,"subtotal":19000,"useTicket":false,"name":"Camarones con arroz con coco","ticket_eligible":false,"note":"Con sopa","sentAt":"2026-05-13T17:47:27.219Z","ticket_validity_days":30,"recipe_mode":"direct","lineId":"afe2e5a6-67ac-46db-9547-b508e5aad8ff","productId":"0IHf7f0tLTKBCcFagc22","id":"0IHf7f0tLTKBCcFagc22","productName":"Camarones con arroz con coco","quantity":1,"notes":"Con sopa","price":19000,"product_type":"standard"}],"customer_name":"","tableSessionId":"QU4sU8wO02pWlMVbrLYh","paid_amount":19000,"pending_debt_remaining":0,"closed_at":"2026-05-13T18:11:45.237Z","table_name":"Mesa de madera","payment_label":"cash","settled_amount":19000,"debt_amount":0,"table_session_id":"QU4sU8wO02pWlMVbrLYh","table_id":"OR088fiPLjrUL6Ea2P3M","total":19000,"ticket_units_consumed":0,"payment_breakdown":[{"amount":19000,"method":"cash"}],"sale_id":"HizqMalQ5EOgHSUsTdmh","payment_method":"cash","payment_status":"paid","cash_received":19000,"adjustment_pct":0,"subtotal":19000,"income_kind":"cash","ticket_covered_amount":0,"ticket_units_granted":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","adjustment_amount":0,"type":"income","concept":"Venta Mesa de madera"}}'::jsonb, '2026-05-13T18:11:45.237Z'::timestamptz, '2026-05-13T18:11:45.385845Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('ad305983-6c2f-5512-8edc-31dd79a8914f', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'ae0fe857-fa90-5ea1-a23a-f3c63e3ddce2', null, 'Z5ZO4eHIb5Iz8Qin4JWY', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-12T19:04:57.240Z'::timestamptz, '{"firebase":{"payment_breakdown":[{"amount":0,"method":"ticket_wallet"}],"cash_received":0,"payment_status":"paid","payment_method":"ticket_wallet","income_kind":"ticket_wallet","subtotal":0,"adjustment_pct":0,"ticket_covered_amount":13500,"closing_id":"vsYhaNK2Jo4kA5QPIkBY","ticket_units_granted":0,"type":"income","adjustment_amount":0,"concept":"Venta Barra","cash_change":0,"customer_id":"z16gIYUt5AHnyWZcDf96","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-12T19:04:57.240Z","items":[{"recipe_mode":"direct","category":"Almuerzos","ticket_units":10,"ticket_eligible":true,"name":"Almuerzo base","useTicket":false,"quantity":1,"id":"nRlFt9zSV5xfbBPy9pDe","product_type":"standard","ticket_validity_days":30,"price":13500,"note":""}],"customer_name":"María José","order_id":"QEtvjoPC50uwZDqWWFAC","table_name":"Barra","closed_at":"2026-05-12T19:04:57.240Z","pending_debt_remaining":0,"debt_amount":0,"settled_amount":0,"payment_label":"Tiquetera","total":0,"table_id":"CGi1vRxujjrFAC6qJbQ8","ticket_units_consumed":1}}'::jsonb, '2026-05-12T19:04:57.240Z'::timestamptz, '2026-05-12T19:04:57.304078Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('55c2afd0-3b8f-56ac-84cb-4e8c71dbbf8b', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'dd03276b-4f44-5772-a0d2-9bf6a0cf0221', null, 'bYThx3E1PVqkg45rs8Pk', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-13T19:13:47.044Z'::timestamptz, '{"firebase":{"total":0,"ticket_units_granted":3,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","ticket_covered_amount":0,"payment_label":"cash","ticket_units_consumed":0,"concept":"Venta ticketera Vanessa","type":"income","payment_kind":"prepaid_ticket_sale","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":"I3OAdrJ5WY5AiNPQWmmx","sale_id":"VnObj9qTGwOSpuaXPaaf","payment_breakdown":[],"income_kind":"meal_ticket_sale","closed_at":"2026-05-13T19:13:47.044Z","subtotal":0,"createdAt":"2026-05-13T19:13:47.044Z","items":[{"quantity":1,"name":"Personalizada","id":"aluDwFsozT9N1J6bQaLh","price":0,"ticket_units":3,"product_type":"meal_ticket"}],"linked_ticket_id":"aluDwFsozT9N1J6bQaLh","customer_name":"Vanessa","payment_method":"cash"}}'::jsonb, '2026-05-13T19:13:47.044Z'::timestamptz, '2026-05-13T19:13:47.122636Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('1a0f3a0f-6f63-5941-8420-fa49c31e7a24', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'c1UqpgJ41pRA9mPg5ivh', '', 'quick_sale', 'paid', 'paid', 13500, 0, 0, 13500, 13500, 0, '2026-05-13T18:37:37.868Z'::timestamptz, '{"firebase":{"sale_id":"f8bw0BCQHqNLqGyThaeY","payment_breakdown":[{"amount":13500,"method":"nequi"}],"income_kind":"cash","subtotal":13500,"adjustment_pct":0,"payment_status":"paid","cash_received":0,"payment_method":"nequi","ticket_units_granted":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","ticket_covered_amount":0,"concept":"Venta Mesa larga","type":"income","adjustment_amount":0,"customer_id":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cash_change":0,"table_name":"Mesa larga","closed_at":"2026-05-13T18:37:37.868Z","pending_debt_remaining":0,"paid_amount":13500,"tableSessionId":"K9o0LzFCBopUcZiFcY4K","createdAt":"2026-05-13T18:37:37.868Z","items":[{"price":13500,"product_type":"standard","notes":"","productName":"Almuerzo base","quantity":1,"id":"nRlFt9zSV5xfbBPy9pDe","productId":"nRlFt9zSV5xfbBPy9pDe","lineId":"98a0fb25-4f25-40e8-b370-d69dbd8b6648","recipe_mode":"direct","sentAt":"2026-05-13T18:17:26.250Z","ticket_validity_days":30,"note":"","subtotal":13500,"useTicket":false,"ticket_eligible":true,"name":"Almuerzo base","category":"Almuerzos","ticket_units":10,"status":"ready","modifiers":[],"unitPrice":13500}],"customer_name":"","order_id":"ryBcFmchzaPGXaoDvt0V","total":13500,"table_id":"rVv4OIwPnrp2wwNjrCpB","table_session_id":"K9o0LzFCBopUcZiFcY4K","debt_amount":0,"settled_amount":13500,"payment_label":"nequi","ticket_units_consumed":0}}'::jsonb, '2026-05-13T18:37:37.868Z'::timestamptz, '2026-05-13T18:37:38.064981Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('30afce9c-d097-538f-99e1-ae0da376af0d', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'cM51nUGgJKBctcrgqw9M', '', 'quick_sale', 'paid', 'paid', 27000, 0, 0, 27000, 0, 0, '2026-05-07T18:01:33.908Z'::timestamptz, '{"firebase":{"cash_change":23000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null,"createdAt":"2026-05-07T18:01:33.908Z","items":[{"note":"Pechuga de pollo","price":13500,"product_type":"standard","ticket_validity_days":30,"id":"nRlFt9zSV5xfbBPy9pDe","useTicket":false,"quantity":2,"ticket_eligible":true,"name":"Almuerzo base","category":"Almuerzos","ticket_units":10,"recipe_mode":"direct"}],"customer_name":"","order_id":"Pv9DyeKR7JZlamblpejP","closed_at":"2026-05-07T18:01:33.908Z","table_name":"Mesa blanca","pending_debt_remaining":0,"payment_label":"cash","debt_amount":0,"settled_amount":0,"total":27000,"table_id":"x0OEOINMrf3LYW5eADGc","ticket_units_consumed":0,"payment_breakdown":[{"amount":27000,"method":"cash"}],"payment_status":"paid","cash_received":50000,"payment_method":"cash","income_kind":"cash","adjustment_pct":0,"subtotal":27000,"ticket_covered_amount":0,"ticket_units_granted":0,"closing_id":"Ls5tvsgxKAuERuCgeg2K","adjustment_amount":0,"type":"income","concept":"Venta Mesa blanca"}}'::jsonb, '2026-05-07T18:01:33.908Z'::timestamptz, '2026-05-07T18:01:33.971430Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('c2d7ee89-0ce0-5629-856a-e59a8647d293', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'dGKou39yyDgJXp9aSAxt', '', 'quick_sale', 'paid', 'paid', 27000, 0, 0, 27000, 27000, 0, '2026-05-13T19:19:40.515Z'::timestamptz, '{"firebase":{"customer_id":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cash_change":0,"paid_amount":27000,"pending_debt_remaining":0,"table_name":"Barra","closed_at":"2026-05-13T19:19:40.515Z","order_id":"6w51FrV9jfGvtrfCapJ4","tableSessionId":"aZ4hWe3FfhyZUI9m38vo","customer_name":"","items":[{"notes":"","price":13500,"product_type":"standard","id":"nRlFt9zSV5xfbBPy9pDe","productName":"Almuerzo base","quantity":2,"lineId":"71eb67d0-bf14-4bfb-9541-64143190b92d","recipe_mode":"direct","productId":"nRlFt9zSV5xfbBPy9pDe","note":"","ticket_validity_days":30,"sentAt":"2026-05-13T18:49:47.517Z","subtotal":27000,"useTicket":false,"name":"Almuerzo base","ticket_eligible":true,"modifiers":[],"ticket_units":10,"status":"delivered","category":"Almuerzos","unitPrice":13500}],"createdAt":"2026-05-13T19:19:40.515Z","table_id":"CGi1vRxujjrFAC6qJbQ8","table_session_id":"aZ4hWe3FfhyZUI9m38vo","total":27000,"settled_amount":27000,"debt_amount":0,"payment_label":"nequi","ticket_units_consumed":0,"sale_id":"9C8xXyC8zEXEPvwuNnAM","payment_breakdown":[{"amount":27000,"method":"nequi"}],"subtotal":27000,"adjustment_pct":0,"income_kind":"cash","payment_method":"nequi","payment_status":"paid","cash_received":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","ticket_units_granted":0,"ticket_covered_amount":0,"concept":"Venta Barra","type":"income","adjustment_amount":0}}'::jsonb, '2026-05-13T19:19:40.515Z'::timestamptz, '2026-05-13T19:19:40.605678Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('c83b5bc1-5063-5007-85d1-33afefc566a7', 'c08a64ca-23dd-4599-b680-6192d14676aa', '8baaa4d7-231a-535d-a859-77ab8c46bd0d', null, 'dinloky21l5njU2GntfG', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-14T16:13:24.713Z'::timestamptz, '{"firebase":{"total":0,"table_id":"x0OEOINMrf3LYW5eADGc","table_session_id":null,"debt_amount":0,"settled_amount":0,"payment_label":"Tiquetera","ticket_units_consumed":2,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":"5y5Hefq4dhQ3G130kmaX","cash_change":0,"table_name":"Mesa blanca","closed_at":"2026-05-14T16:13:24.713Z","pending_debt_remaining":0,"paid_amount":0,"tableSessionId":null,"createdAt":"2026-05-14T16:13:24.713Z","items":[{"unitPrice":13500,"ticket_units":10,"category":"Almuerzos","modifiers":[],"useTicket":true,"name":"Almuerzo base","ticket_eligible":true,"inventoryImpactMode":"none","ticket_validity_days":30,"note":"","kitchenStationId":"none","productId":"nRlFt9zSV5xfbBPy9pDe","recipe_mode":"direct","kitchenStationName":"No requiere preparacion","productName":"Almuerzo base","quantity":2,"id":"nRlFt9zSV5xfbBPy9pDe","price":13500,"categoryId":"","product_type":"standard","notes":"","requiresKitchen":false,"technicalSheetId":""}],"customer_name":"Sara","order_id":"E1GfyNIK98YzgR767FLu","closing_id":"YUv8HDxGq3rBKRJ4dlm9","ticket_units_granted":0,"ticket_covered_amount":27000,"concept":"Venta Mesa blanca","type":"income","adjustment_amount":0,"sale_id":"9huDsUNzlrnuD2qDkweD","payment_breakdown":[{"method":"ticket_wallet","amount":0}],"income_kind":"ticket_wallet","subtotal":0,"adjustment_pct":0,"payment_status":"paid","cash_received":0,"payment_method":"ticket_wallet"}}'::jsonb, '2026-05-14T16:13:24.713Z'::timestamptz, '2026-05-14T16:13:24.800054Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('dd6f33d0-8962-59d6-b177-7bcf041726bc', 'c08a64ca-23dd-4599-b680-6192d14676aa', '9e65fa31-ca36-5a0f-ad6c-573be11b8b6a', null, 'eGsTZKg3Hs0nMAKiMA90', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-07T17:34:57.415Z'::timestamptz, '{"firebase":{"debt_amount":0,"settled_amount":0,"payment_label":"Tiquetera","total":0,"table_id":"x0OEOINMrf3LYW5eADGc","ticket_units_consumed":1,"cash_change":0,"customer_id":"9BoVNCEhtYgdjQQL413W","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-07T17:34:57.415Z","items":[{"note":"","product_type":"standard","ticket_validity_days":30,"price":13500,"id":"nRlFt9zSV5xfbBPy9pDe","ticket_eligible":true,"name":"Almuerzo base","quantity":1,"useTicket":true,"category":"Almuerzos","ticket_units":10,"recipe_mode":"direct"}],"customer_name":"Salome","order_id":"0gUQONUamDY0u8WZ93fw","table_name":"Mesa blanca","closed_at":"2026-05-07T17:34:57.415Z","pending_debt_remaining":0,"ticket_covered_amount":13500,"closing_id":"Ls5tvsgxKAuERuCgeg2K","ticket_units_granted":0,"type":"income","adjustment_amount":0,"concept":"Venta Mesa blanca","payment_breakdown":[{"amount":0,"method":"ticket_wallet"}],"cash_received":0,"payment_status":"paid","payment_method":"ticket_wallet","income_kind":"ticket_wallet","subtotal":0,"adjustment_pct":0}}'::jsonb, '2026-05-07T17:34:57.415Z'::timestamptz, '2026-05-07T17:34:57.499249Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('7bac6c1a-87ab-57c6-93e3-3079f92e50cf', 'c08a64ca-23dd-4599-b680-6192d14676aa', '71c3c919-a880-5c4b-b7a8-4426ecc7a95d', null, 'fPvh9JxyV4yFJkgFJKY2', '', 'quick_sale', 'paid', 'paid', 44000, 0, 0, 0, 0, 0, '2026-05-07T18:12:11.840Z'::timestamptz, '{"firebase":{"ticket_covered_amount":0,"closing_id":"Ls5tvsgxKAuERuCgeg2K","ticket_units_granted":0,"type":"income","adjustment_amount":-44000,"concept":"Venta Venta Rapida / Para llevar","payment_breakdown":[],"payment_method":"account_credit","cash_received":0,"payment_status":"pending","subtotal":44000,"adjustment_pct":-100,"income_kind":"cash","settled_amount":0,"debt_amount":44000,"payment_label":"Cuenta por cobrar","table_id":"quick-sale","total":0,"ticket_units_consumed":0,"cash_change":0,"customer_id":"e4UKULw5W44reTzLhUtB","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","order_id":"L1LqzHy3KUe1Qm9Sn7ZF","customer_name":"Luisa","items":[{"ticket_eligible":true,"name":"Almuerzo brunch","useTicket":false,"quantity":2,"id":"6F6L7Y5fPtEi6ciZyH5y","product_type":"standard","ticket_validity_days":30,"price":22000,"note":"","recipe_mode":"direct","category":"Almuerzos","ticket_units":10}],"createdAt":"2026-05-07T18:12:11.840Z","pending_debt_remaining":44000,"table_name":"Venta Rapida / Para llevar","closed_at":"2026-05-07T18:12:11.840Z"}}'::jsonb, '2026-05-07T18:12:11.840Z'::timestamptz, '2026-05-07T18:12:11.921258Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('b0c5b539-0f0f-5898-a349-6eeceb1c2af4', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'fneCZud0S02wANux5hLz', '', 'quick_sale', 'paid', 'paid', 59000, 0, 0, 59000, 0, 0, '2026-05-08T18:45:54.472Z'::timestamptz, '{"firebase":{"type":"income","adjustment_amount":0,"concept":"Venta Mesa de madera","ticket_covered_amount":0,"ticket_units_granted":0,"closing_id":"tQ1y0MqKNI2JtdRgNzJ9","payment_method":"cash","cash_received":60000,"payment_status":"paid","subtotal":59000,"adjustment_pct":0,"income_kind":"cash","payment_breakdown":[{"method":"cash","amount":59000}],"ticket_units_consumed":0,"settled_amount":0,"debt_amount":0,"payment_label":"cash","table_id":"OR088fiPLjrUL6Ea2P3M","total":59000,"order_id":"ACUcfzbG8bQX6KF6OMbp","customer_name":"","items":[{"price":16000,"product_type":"standard","ticket_validity_days":30,"note":"","useTicket":false,"quantity":2,"ticket_eligible":true,"name":"Almuerzo medium","id":"hSJLYx7QAHYmsXLfUfro","category":"Almuerzos","ticket_units":10,"recipe_mode":"direct"}],"createdAt":"2026-05-08T18:45:54.472Z","pending_debt_remaining":0,"table_name":"Mesa de madera","closed_at":"2026-05-08T18:45:54.472Z","cash_change":1000,"customer_id":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-08T18:45:54.472Z'::timestamptz, '2026-05-08T18:45:54.537711Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('12568fac-93b1-53f0-820b-e14ade3d97ac', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'ae0fe857-fa90-5ea1-a23a-f3c63e3ddce2', null, 'hwnjOpCIPNMOhO4chf9y', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-08T18:35:40.969Z'::timestamptz, '{"firebase":{"payment_breakdown":[{"method":"ticket_wallet","amount":0}],"income_kind":"ticket_wallet","subtotal":0,"adjustment_pct":0,"payment_status":"paid","cash_received":0,"payment_method":"ticket_wallet","ticket_units_granted":0,"closing_id":"tQ1y0MqKNI2JtdRgNzJ9","ticket_covered_amount":13500,"concept":"Venta Panca","type":"income","adjustment_amount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":"z16gIYUt5AHnyWZcDf96","cash_change":0,"table_name":"Panca","closed_at":"2026-05-08T18:35:40.969Z","pending_debt_remaining":0,"customer_name":"María José","createdAt":"2026-05-08T18:35:40.969Z","items":[{"note":"","price":13500,"product_type":"standard","ticket_validity_days":30,"id":"nRlFt9zSV5xfbBPy9pDe","useTicket":false,"quantity":1,"ticket_eligible":true,"name":"Almuerzo base","category":"Almuerzos","ticket_units":10,"recipe_mode":"direct"}],"order_id":"ntI7fMYZw3F34n5DQ0xO","total":0,"table_id":"IaKZHUBjqeglJP02wDj6","settled_amount":0,"debt_amount":0,"payment_label":"Tiquetera","ticket_units_consumed":1}}'::jsonb, '2026-05-08T18:35:40.969Z'::timestamptz, '2026-05-08T18:35:41.021394Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('5e27d4dd-2469-5922-b81b-f9b2cb88b785', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'ipc8hZwKOWF8gChxLDVq', '', 'quick_sale', 'paid', 'paid', 19000, 0, 0, 19000, 0, 0, '2026-05-12T19:04:17.281Z'::timestamptz, '{"firebase":{"ticket_units_consumed":0,"payment_label":"cash","debt_amount":0,"settled_amount":0,"table_id":"OR088fiPLjrUL6Ea2P3M","total":19000,"order_id":"7WXbjszUA6ljqfkQxhzu","createdAt":"2026-05-12T19:04:17.281Z","items":[{"recipe_mode":"direct","category":"Almuerzos","ticket_units":10,"id":"0IHf7f0tLTKBCcFagc22","ticket_eligible":true,"name":"Arroz con camarones","useTicket":false,"quantity":1,"note":"","product_type":"standard","ticket_validity_days":30,"price":19000}],"customer_name":"","pending_debt_remaining":0,"closed_at":"2026-05-12T19:04:17.281Z","table_name":"Mesa de madera","cash_change":13000,"customer_id":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","adjustment_amount":0,"type":"income","concept":"Venta Mesa de madera","ticket_covered_amount":0,"ticket_units_granted":0,"closing_id":"vsYhaNK2Jo4kA5QPIkBY","payment_method":"cash","payment_status":"paid","cash_received":32000,"adjustment_pct":0,"subtotal":19000,"income_kind":"cash","payment_breakdown":[{"amount":19000,"method":"cash"}]}}'::jsonb, '2026-05-12T19:04:17.281Z'::timestamptz, '2026-05-12T19:04:17.347834Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('86fa6a73-18b3-5384-885a-800d28583f60', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, null, 'jiXUQE1cJpSLfroctB21', '', 'quick_sale', 'paid', 'paid', 18000, 0, 0, 18000, 18000, 0, '2026-05-13T17:21:30.566Z'::timestamptz, '{"firebase":{"adjustment_amount":0,"type":"income","concept":"Venta Mesa blanca","ticket_covered_amount":0,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","ticket_units_granted":0,"cash_received":0,"payment_status":"paid","payment_method":"nequi","income_kind":"cash","adjustment_pct":0,"subtotal":18000,"payment_breakdown":[{"method":"nequi","amount":18000}],"sale_id":"Jo8XYewwrwqCp7FHJ4El","ticket_units_consumed":0,"payment_label":"nequi","settled_amount":18000,"debt_amount":0,"total":18000,"table_session_id":null,"table_id":"x0OEOINMrf3LYW5eADGc","createdAt":"2026-05-13T17:21:30.566Z","items":[{"product_type":"standard","ticket_validity_days":30,"price":18000,"note":"","ticket_eligible":true,"name":"Pasta con camarones","useTicket":false,"quantity":1,"id":"KwvK2FgAoGuy93uYSUPP","category":"Almuerzos","ticket_units":10,"recipe_mode":"direct"}],"customer_name":"","tableSessionId":null,"order_id":"cUoVAILuCHlTxIBcQDfm","closed_at":"2026-05-13T17:21:30.566Z","table_name":"Mesa blanca","pending_debt_remaining":0,"paid_amount":18000,"cash_change":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":null}}'::jsonb, '2026-05-13T17:21:30.566Z'::timestamptz, '2026-05-13T17:21:30.649029Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('e71da568-7de4-5829-8032-368268e76f77', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'ae0fe857-fa90-5ea1-a23a-f3c63e3ddce2', null, 'k98J4HapIr2V6KlQWl4C', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-07T19:32:16.218Z'::timestamptz, '{"firebase":{"payment_method":"ticket_wallet","cash_received":0,"payment_status":"paid","subtotal":0,"adjustment_pct":0,"income_kind":"ticket_wallet","payment_breakdown":[{"method":"ticket_wallet","amount":0}],"type":"income","adjustment_amount":0,"concept":"Venta Barra","ticket_covered_amount":13500,"closing_id":"Ls5tvsgxKAuERuCgeg2K","ticket_units_granted":0,"order_id":"3Ua11hESqcRWmYaXiG2l","customer_name":"María José","items":[{"price":13500,"product_type":"standard","ticket_validity_days":30,"note":"","useTicket":false,"quantity":1,"name":"Almuerzo base","ticket_eligible":true,"id":"nRlFt9zSV5xfbBPy9pDe","category":"Almuerzos","ticket_units":10,"recipe_mode":"direct"}],"createdAt":"2026-05-07T19:32:16.218Z","pending_debt_remaining":0,"table_name":"Barra","closed_at":"2026-05-07T19:32:16.218Z","cash_change":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":"z16gIYUt5AHnyWZcDf96","ticket_units_consumed":1,"settled_amount":0,"debt_amount":0,"payment_label":"Tiquetera","table_id":"CGi1vRxujjrFAC6qJbQ8","total":0}}'::jsonb, '2026-05-07T19:32:16.218Z'::timestamptz, '2026-05-07T19:32:16.288579Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('a56a9731-d81f-5020-8719-e980dd17be81', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'eb295e27-8049-5901-8704-23df7dcddcbc', null, 'lhs7C8cB6fDH6KaCRlcR', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-12T18:44:33.293Z'::timestamptz, '{"firebase":{"concept":"Venta Venta Rapida / Para llevar","type":"income","adjustment_amount":0,"closing_id":"vsYhaNK2Jo4kA5QPIkBY","ticket_units_granted":0,"ticket_covered_amount":13500,"income_kind":"ticket_wallet","subtotal":0,"adjustment_pct":0,"cash_received":0,"payment_status":"paid","payment_method":"ticket_wallet","payment_breakdown":[{"method":"ticket_wallet","amount":0}],"ticket_units_consumed":1,"total":0,"table_id":"quick-sale","settled_amount":0,"debt_amount":0,"payment_label":"Tiquetera","table_name":"Venta Rapida / Para llevar","closed_at":"2026-05-12T18:44:33.293Z","pending_debt_remaining":0,"customer_name":"Samuel","items":[{"ticket_units":10,"category":"Almuerzos","recipe_mode":"direct","note":"","price":13500,"ticket_validity_days":30,"product_type":"standard","id":"nRlFt9zSV5xfbBPy9pDe","quantity":1,"useTicket":true,"name":"Almuerzo base","ticket_eligible":true}],"createdAt":"2026-05-12T18:44:33.293Z","order_id":"QRvdA8ZE04hC89Tvp3MU","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":"CEj6ahhroDiVbXDGRT5K","cash_change":0}}'::jsonb, '2026-05-12T18:44:33.293Z'::timestamptz, '2026-05-12T18:44:33.370743Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('83f01466-4eb7-55bf-b0dc-13dd3eb2a859', 'c08a64ca-23dd-4599-b680-6192d14676aa', '8baaa4d7-231a-535d-a859-77ab8c46bd0d', null, 'm7hAnRCIVf8h6IX3uSzG', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-13T19:12:51.473Z'::timestamptz, '{"firebase":{"payment_breakdown":[],"customer_id":"5y5Hefq4dhQ3G130kmaX","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sale_id":"mEoceI2MqcIfiBZ2ob4P","payment_kind":"prepaid_ticket_sale","payment_method":"cash","customer_name":"Sara","linked_ticket_id":"mMPqBdzuYPWBBZL4VuFB","items":[{"name":"Personalizada","quantity":1,"id":"mMPqBdzuYPWBBZL4VuFB","product_type":"meal_ticket","price":0,"ticket_units":2}],"createdAt":"2026-05-13T19:12:51.473Z","subtotal":0,"income_kind":"meal_ticket_sale","closed_at":"2026-05-13T19:12:51.473Z","payment_label":"cash","ticket_covered_amount":0,"ticket_units_granted":2,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","total":0,"type":"income","ticket_units_consumed":0,"concept":"Venta ticketera Sara"}}'::jsonb, '2026-05-13T19:12:51.473Z'::timestamptz, '2026-05-13T19:12:51.544505Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('b99907a7-0150-5d2d-823f-67edb6bfb101', 'c08a64ca-23dd-4599-b680-6192d14676aa', '8baaa4d7-231a-535d-a859-77ab8c46bd0d', null, 'nTODmVSbJ29sL0I5OC8P', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-13T19:15:45.204Z'::timestamptz, '{"firebase":{"total":0,"ticket_units_granted":4,"closing_id":"YUv8HDxGq3rBKRJ4dlm9","payment_label":"cash","ticket_covered_amount":0,"concept":"Venta ticketera Sara","ticket_units_consumed":0,"type":"income","sale_id":"UeYssrV7yMnO3ZJVUy3b","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_id":"5y5Hefq4dhQ3G130kmaX","payment_kind":"prepaid_ticket_sale","payment_breakdown":[],"subtotal":0,"income_kind":"meal_ticket_sale","closed_at":"2026-05-13T19:15:45.204Z","payment_method":"cash","customer_name":"Sara","createdAt":"2026-05-13T19:15:45.204Z","items":[{"quantity":1,"name":"Personalizada","id":"uFm2ojzMhew2lJQYpnXP","price":0,"ticket_units":4,"product_type":"meal_ticket"}],"linked_ticket_id":"uFm2ojzMhew2lJQYpnXP"}}'::jsonb, '2026-05-13T19:15:45.204Z'::timestamptz, '2026-05-13T19:15:45.267896Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('9505e04e-02cc-5be1-822f-60c1fbaf7115', 'c08a64ca-23dd-4599-b680-6192d14676aa', '9e65fa31-ca36-5a0f-ad6c-573be11b8b6a', null, 'wgPHzXU6l0FNyIqmidgP', '', 'quick_sale', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-08T18:35:20.798Z'::timestamptz, '{"firebase":{"payment_breakdown":[{"method":"ticket_wallet","amount":0}],"cash_received":0,"payment_status":"paid","payment_method":"ticket_wallet","income_kind":"ticket_wallet","adjustment_pct":0,"subtotal":0,"ticket_covered_amount":13500,"closing_id":"tQ1y0MqKNI2JtdRgNzJ9","ticket_units_granted":0,"adjustment_amount":0,"type":"income","concept":"Venta Mesa blanca","cash_change":0,"customer_id":"9BoVNCEhtYgdjQQL413W","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_name":"Salome","items":[{"id":"nRlFt9zSV5xfbBPy9pDe","ticket_eligible":true,"name":"Almuerzo base","useTicket":false,"quantity":1,"note":"","product_type":"standard","ticket_validity_days":30,"price":13500,"recipe_mode":"direct","category":"Almuerzos","ticket_units":10}],"createdAt":"2026-05-08T18:35:20.798Z","order_id":"acUcXX2WPgtnyUCwfKEu","closed_at":"2026-05-08T18:35:20.798Z","table_name":"Mesa blanca","pending_debt_remaining":0,"payment_label":"Tiquetera","settled_amount":0,"debt_amount":0,"total":0,"table_id":"x0OEOINMrf3LYW5eADGc","ticket_units_consumed":1}}'::jsonb, '2026-05-08T18:35:20.798Z'::timestamptz, '2026-05-08T18:35:20.866097Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('6e22ee68-453f-5520-9a1a-57d5154045b3', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '1HSXO5sjRySzI91b1DYH', '', 'quick_sale', 'paid', 'paid', 20000, 0, 0, 20000, 20000, 0, '2026-05-13T17:11:34.832Z'::timestamptz, '{"firebase":{"cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","status":"paid","change_amount":0,"orderId":"RSmkPKrYK01IcP0yMwwZ","createdBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","pendingAmount":0,"customerId":null,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_name":"","pending_amount":0,"customer_id":null,"tableId":"quick-sale","sourceId":"RSmkPKrYK01IcP0yMwwZ","order_id":"RSmkPKrYK01IcP0yMwwZ","discounts":0,"taxes":0,"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","updated_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"paymentStatus":"paid","updatedAt":"2026-05-13T17:11:35.954Z","inventoryAppliedAt":"2026-05-13T17:11:35.954Z","paid_amount":20000,"table_id":"quick-sale","inventoryImpactStatus":"not_applicable","createdAt":"2026-05-13T17:11:34.832Z","total":20000,"paidAmount":20000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","created_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"notes":"","changeAmount":0,"source_type":"quick_sale","updatedBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","inventory_impact_status":"not_applicable","customerName":"","waiterId":null,"payment_status":"paid","table_session_id":null,"source_id":"RSmkPKrYK01IcP0yMwwZ","inventory_applied_at":"2026-05-13T17:11:35.954Z","tableSessionId":null,"waiter_id":null,"subtotal":20000,"sourceType":"quick_sale"}}'::jsonb, '2026-05-13T17:11:34.832Z'::timestamptz, '2026-05-13T17:11:35.954Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('67c81e28-c108-5653-af63-e645c00bbc38', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'eb295e27-8049-5901-8704-23df7dcddcbc', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '3C8YUh0NVz0UE2Ok7V4P', '', 'ticket_wallet', 'paid', 'paid', 0, 0, 0, 13500, 13500, 0, '2026-05-13T18:01:17.533Z'::timestamptz, '{"firebase":{"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","customerId":"CEj6ahhroDiVbXDGRT5K","pendingAmount":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","status":"paid","change_amount":0,"createdBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"orderId":"amFWgvuWXdWmiZFBqlGC","paymentStatus":"paid","updated_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"inventoryAppliedAt":"2026-05-13T18:01:18.411Z","updatedAt":"2026-05-13T18:01:18.411Z","pending_amount":0,"customer_name":"Samuel","tableId":"IaKZHUBjqeglJP02wDj6","customer_id":"CEj6ahhroDiVbXDGRT5K","taxes":0,"sourceId":"amFWgvuWXdWmiZFBqlGC","order_id":"amFWgvuWXdWmiZFBqlGC","discounts":0,"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","created_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"source_type":"ticket_consumption","changeAmount":0,"notes":"","updatedBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"inventory_impact_status":"not_applicable","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","createdAt":"2026-05-13T18:01:17.533Z","inventoryImpactStatus":"not_applicable","table_id":"IaKZHUBjqeglJP02wDj6","paid_amount":13500,"total":13500,"paidAmount":13500,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","subtotal":0,"waiter_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","tableSessionId":"tJ0E4pb5xeoLWxWc6SwM","sourceType":"ticket_consumption","waiterId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customerName":"Samuel","payment_status":"paid","table_session_id":"tJ0E4pb5xeoLWxWc6SwM","source_id":"amFWgvuWXdWmiZFBqlGC","inventory_applied_at":"2026-05-13T18:01:18.411Z"}}'::jsonb, '2026-05-13T18:01:17.533Z'::timestamptz, '2026-05-13T18:01:18.411Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('a06b2656-f512-503c-9a39-bf0bb8c6742e', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'ae0fe857-fa90-5ea1-a23a-f3c63e3ddce2', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '3dn57sfKxZNxQtupoog1', '', 'table', 'paid', 'paid', 4000, 0, 0, 17500, 17500, 0, '2026-05-13T18:47:10.528Z'::timestamptz, '{"firebase":{"subtotal":4000,"tableSessionId":"03qntsj9ZckhOVcpRu72","waiter_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sourceType":"table","customerName":"María José","waiterId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","source_id":"iTu3yNLAjuxZdFU4NO7S","table_session_id":"03qntsj9ZckhOVcpRu72","payment_status":"paid","inventory_applied_at":"2026-05-13T18:47:11.831Z","created_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"source_type":"table","changeAmount":0,"notes":"","updatedBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"inventory_impact_status":"not_applicable","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","createdAt":"2026-05-13T18:47:10.528Z","inventoryImpactStatus":"not_applicable","table_id":"IaKZHUBjqeglJP02wDj6","paid_amount":17500,"total":17500,"paidAmount":17500,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paymentStatus":"paid","updated_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"inventoryAppliedAt":"2026-05-13T18:47:11.831Z","updatedAt":"2026-05-13T18:47:11.831Z","pending_amount":0,"customer_name":"María José","tableId":"IaKZHUBjqeglJP02wDj6","customer_id":"z16gIYUt5AHnyWZcDf96","taxes":0,"sourceId":"iTu3yNLAjuxZdFU4NO7S","order_id":"iTu3yNLAjuxZdFU4NO7S","discounts":0,"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","customerId":"z16gIYUt5AHnyWZcDf96","pendingAmount":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","status":"paid","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"createdBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"orderId":"iTu3yNLAjuxZdFU4NO7S"}}'::jsonb, '2026-05-13T18:47:10.528Z'::timestamptz, '2026-05-13T18:47:11.831Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('732b9dd5-8e44-5550-bbbc-8f928cbef402', 'c08a64ca-23dd-4599-b680-6192d14676aa', '9e65fa31-ca36-5a0f-ad6c-573be11b8b6a', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '7ihscrAkb49723enEmKY', '', 'ticket_wallet', 'paid', 'paid', 0, 0, 0, 13500, 13500, 0, '2026-05-13T17:53:48.413Z'::timestamptz, '{"firebase":{"paidAmount":13500,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-13T17:53:48.413Z","inventoryImpactStatus":"not_applicable","paid_amount":13500,"table_id":"IaKZHUBjqeglJP02wDj6","total":13500,"updatedBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"inventory_impact_status":"not_applicable","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","created_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"notes":"","changeAmount":0,"source_type":"ticket_consumption","payment_status":"paid","table_session_id":"EvGKArNptCDoNARDW9fw","source_id":"4GohQGKZfL6fK34HEDmw","inventory_applied_at":"2026-05-13T17:53:49.245Z","waiterId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customerName":"Salome","sourceType":"ticket_consumption","subtotal":0,"waiter_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","tableSessionId":"EvGKArNptCDoNARDW9fw","createdBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"orderId":"4GohQGKZfL6fK34HEDmw","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","status":"paid","change_amount":0,"customerId":"9BoVNCEhtYgdjQQL413W","pendingAmount":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","taxes":0,"sourceId":"4GohQGKZfL6fK34HEDmw","order_id":"4GohQGKZfL6fK34HEDmw","discounts":0,"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","pending_amount":0,"customer_name":"Salome","tableId":"IaKZHUBjqeglJP02wDj6","customer_id":"9BoVNCEhtYgdjQQL413W","paymentStatus":"paid","updated_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"inventoryAppliedAt":"2026-05-13T17:53:49.245Z","updatedAt":"2026-05-13T17:53:49.245Z"}}'::jsonb, '2026-05-13T17:53:48.413Z'::timestamptz, '2026-05-13T17:53:49.245Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('c818c5b8-a8a5-5ace-9954-6fc04f31a06b', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '8BanRG5OTLSnWls8Dscd', '', 'quick_sale', 'paid', 'paid', 6500, 0, 0, 6500, 6500, 0, '2026-05-13T18:58:52.944Z'::timestamptz, '{"firebase":{"sourceType":"quick_sale","tableSessionId":null,"waiter_id":null,"subtotal":6500,"inventory_applied_at":"2026-05-13T18:58:53.677Z","source_id":"3HrcUdAbDLEt1FAzHFV9","table_session_id":null,"payment_status":"paid","waiterId":null,"customerName":"","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","inventory_impact_status":"not_applicable","updatedBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"source_type":"quick_sale","changeAmount":0,"notes":"","created_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paidAmount":6500,"total":6500,"table_id":"quick-sale","paid_amount":6500,"createdAt":"2026-05-13T18:58:52.944Z","inventoryImpactStatus":"not_applicable","updatedAt":"2026-05-13T18:58:53.677Z","inventoryAppliedAt":"2026-05-13T18:58:53.677Z","updated_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"paymentStatus":"paid","cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","discounts":0,"order_id":"3HrcUdAbDLEt1FAzHFV9","sourceId":"3HrcUdAbDLEt1FAzHFV9","taxes":0,"customer_id":null,"tableId":"quick-sale","customer_name":"","pending_amount":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","pendingAmount":0,"customerId":null,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","orderId":"3HrcUdAbDLEt1FAzHFV9","createdBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"change_amount":0,"status":"paid","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-13T18:58:52.944Z'::timestamptz, '2026-05-13T18:58:53.677Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('4f2ceec0-fd8d-5a08-a647-9065967ffa64', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '9C8xXyC8zEXEPvwuNnAM', '', 'table', 'paid', 'paid', 27000, 0, 0, 27000, 27000, 0, '2026-05-13T19:19:40.515Z'::timestamptz, '{"firebase":{"inventory_applied_at":"2026-05-13T19:19:41.189Z","payment_status":"paid","table_session_id":"aZ4hWe3FfhyZUI9m38vo","source_id":"6w51FrV9jfGvtrfCapJ4","waiterId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customerName":"","sourceType":"table","waiter_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","tableSessionId":"aZ4hWe3FfhyZUI9m38vo","subtotal":27000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paidAmount":27000,"total":27000,"table_id":"CGi1vRxujjrFAC6qJbQ8","paid_amount":27000,"inventoryImpactStatus":"not_applicable","createdAt":"2026-05-13T19:19:40.515Z","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","inventory_impact_status":"not_applicable","updatedBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"source_type":"table","changeAmount":0,"notes":"","created_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sourceId":"6w51FrV9jfGvtrfCapJ4","order_id":"6w51FrV9jfGvtrfCapJ4","discounts":0,"taxes":0,"customer_id":null,"tableId":"CGi1vRxujjrFAC6qJbQ8","customer_name":"","pending_amount":0,"updatedAt":"2026-05-13T19:19:41.189Z","inventoryAppliedAt":"2026-05-13T19:19:41.189Z","updated_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"paymentStatus":"paid","orderId":"6w51FrV9jfGvtrfCapJ4","createdBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"change_amount":0,"cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","status":"paid","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","pendingAmount":0,"customerId":null,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9"}}'::jsonb, '2026-05-13T19:19:40.515Z'::timestamptz, '2026-05-13T19:19:41.189Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('cda5fd91-c0ee-5098-ad70-469dcd7b3fd8', 'c08a64ca-23dd-4599-b680-6192d14676aa', '8baaa4d7-231a-535d-a859-77ab8c46bd0d', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '9huDsUNzlrnuD2qDkweD', '', 'ticket_wallet', 'paid', 'paid', 0, 0, 0, 27000, 27000, 0, '2026-05-14T16:13:24.713Z'::timestamptz, '{"firebase":{"customerName":"Sara","waiterId":null,"inventory_applied_at":null,"source_id":"E1GfyNIK98YzgR767FLu","table_session_id":null,"payment_status":"paid","subtotal":0,"tableSessionId":null,"waiter_id":null,"sourceType":"ticket_consumption","total":27000,"createdAt":"2026-05-14T16:13:24.713Z","inventoryImpactStatus":"not_applicable","table_id":"x0OEOINMrf3LYW5eADGc","paid_amount":27000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paidAmount":27000,"source_type":"ticket_consumption","changeAmount":0,"notes":"","created_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"inventory_impact_status":"not_applicable","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","updatedBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"tableId":"x0OEOINMrf3LYW5eADGc","customer_id":"5y5Hefq4dhQ3G130kmaX","pending_amount":0,"customer_name":"Sara","cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","taxes":0,"order_id":"E1GfyNIK98YzgR767FLu","discounts":0,"sourceId":"E1GfyNIK98YzgR767FLu","inventoryAppliedAt":null,"updatedAt":"2026-05-14T16:13:26.178Z","paymentStatus":"paid","updated_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"change_amount":0,"status":"paid","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"orderId":"E1GfyNIK98YzgR767FLu","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customerId":"5y5Hefq4dhQ3G130kmaX","pendingAmount":0}}'::jsonb, '2026-05-14T16:13:24.713Z'::timestamptz, '2026-05-14T16:13:26.178Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('62622a50-e53b-579e-8d44-4334cc97021d', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'HFms3meDUAUOAt9nZo2R', '', 'table', 'paid', 'paid', 13500, 0, 0, 13500, 13500, 0, '2026-05-13T19:05:21.646Z'::timestamptz, '{"firebase":{"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","taxes":0,"discounts":0,"order_id":"GGJc6DESLd0O8Ce64zts","sourceId":"GGJc6DESLd0O8Ce64zts","tableId":"x0OEOINMrf3LYW5eADGc","customer_id":null,"pending_amount":0,"customer_name":"","inventoryAppliedAt":"2026-05-13T19:05:22.210Z","updatedAt":"2026-05-13T19:05:22.210Z","paymentStatus":"paid","updated_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"createdBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"orderId":"GGJc6DESLd0O8Ce64zts","change_amount":0,"status":"paid","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customerId":null,"pendingAmount":0,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","inventory_applied_at":"2026-05-13T19:05:22.210Z","source_id":"GGJc6DESLd0O8Ce64zts","table_session_id":"2t2lU4nGlHu05qxhhW5L","payment_status":"paid","customerName":"","waiterId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sourceType":"table","subtotal":13500,"tableSessionId":"2t2lU4nGlHu05qxhhW5L","waiter_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paidAmount":13500,"total":13500,"createdAt":"2026-05-13T19:05:21.646Z","inventoryImpactStatus":"not_applicable","table_id":"x0OEOINMrf3LYW5eADGc","paid_amount":13500,"inventory_impact_status":"not_applicable","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","updatedBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"source_type":"table","changeAmount":0,"notes":"","created_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"}}}'::jsonb, '2026-05-13T19:05:21.646Z'::timestamptz, '2026-05-13T19:05:22.210Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('a278eb09-8ff9-5ddd-ae5a-0a75ad6a766a', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'HizqMalQ5EOgHSUsTdmh', '', 'table', 'paid', 'paid', 19000, 0, 0, 19000, 19000, 0, '2026-05-13T18:11:45.237Z'::timestamptz, '{"firebase":{"updatedBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"inventory_impact_status":"not_applicable","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","created_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"changeAmount":0,"notes":"","source_type":"table","paidAmount":19000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","inventoryImpactStatus":"not_applicable","createdAt":"2026-05-13T18:11:45.237Z","paid_amount":19000,"table_id":"OR088fiPLjrUL6Ea2P3M","total":19000,"sourceType":"table","subtotal":19000,"tableSessionId":"QU4sU8wO02pWlMVbrLYh","waiter_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","source_id":"U1LydqAUu0anuyYMbY2r","table_session_id":"QU4sU8wO02pWlMVbrLYh","payment_status":"paid","inventory_applied_at":"2026-05-13T18:11:46.158Z","waiterId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customerName":"","customerId":null,"pendingAmount":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","createdBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"orderId":"U1LydqAUu0anuyYMbY2r","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","status":"paid","change_amount":0,"paymentStatus":"paid","updated_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"inventoryAppliedAt":"2026-05-13T18:11:46.158Z","updatedAt":"2026-05-13T18:11:46.158Z","taxes":0,"sourceId":"U1LydqAUu0anuyYMbY2r","order_id":"U1LydqAUu0anuyYMbY2r","discounts":0,"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","pending_amount":0,"customer_name":"","tableId":"OR088fiPLjrUL6Ea2P3M","customer_id":null}}'::jsonb, '2026-05-13T18:11:45.237Z'::timestamptz, '2026-05-13T18:11:46.158Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('8ace678c-085e-59ab-b5d3-605fa7624889', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'Jo8XYewwrwqCp7FHJ4El', '', 'table', 'paid', 'paid', 18000, 0, 0, 18000, 18000, 0, '2026-05-13T17:21:30.566Z'::timestamptz, '{"firebase":{"sourceType":"table","tableSessionId":null,"waiter_id":null,"subtotal":18000,"inventory_applied_at":"2026-05-13T17:21:31.464Z","source_id":"cUoVAILuCHlTxIBcQDfm","table_session_id":null,"payment_status":"paid","customerName":"","waiterId":null,"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","inventory_impact_status":"not_applicable","updatedBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"source_type":"table","changeAmount":0,"notes":"","created_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paidAmount":18000,"total":18000,"table_id":"x0OEOINMrf3LYW5eADGc","paid_amount":18000,"createdAt":"2026-05-13T17:21:30.566Z","inventoryImpactStatus":"not_applicable","updatedAt":"2026-05-13T17:21:31.464Z","inventoryAppliedAt":"2026-05-13T17:21:31.464Z","updated_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"paymentStatus":"paid","cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","discounts":0,"order_id":"cUoVAILuCHlTxIBcQDfm","sourceId":"cUoVAILuCHlTxIBcQDfm","taxes":0,"customer_id":null,"tableId":"x0OEOINMrf3LYW5eADGc","customer_name":"","pending_amount":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","pendingAmount":0,"customerId":null,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","orderId":"cUoVAILuCHlTxIBcQDfm","createdBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"change_amount":0,"status":"paid","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-13T17:21:30.566Z'::timestamptz, '2026-05-13T17:21:31.464Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('32c8f924-5d21-5a07-abdd-6873b87aa0f1', 'c08a64ca-23dd-4599-b680-6192d14676aa', '8baaa4d7-231a-535d-a859-77ab8c46bd0d', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'UeYssrV7yMnO3ZJVUy3b', '', 'ticket_wallet', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-13T19:15:45.204Z'::timestamptz, '{"firebase":{"paymentStatus":"paid","updated_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"updatedAt":"2026-05-13T19:15:45.204Z","taxes":0,"sourceId":"uFm2ojzMhew2lJQYpnXP","order_id":"uFm2ojzMhew2lJQYpnXP","discounts":0,"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","pending_amount":0,"customer_name":"Sara","tableId":null,"customer_id":"5y5Hefq4dhQ3G130kmaX","customerId":"5y5Hefq4dhQ3G130kmaX","pendingAmount":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","createdBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"orderId":"uFm2ojzMhew2lJQYpnXP","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","status":"paid","change_amount":0,"sourceType":"ticket_sale","subtotal":0,"waiter_id":null,"tableSessionId":null,"payment_status":"paid","table_session_id":null,"source_id":"uFm2ojzMhew2lJQYpnXP","waiterId":null,"customerName":"Sara","updatedBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"inventory_impact_status":"not_applicable","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","created_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"source_type":"ticket_sale","changeAmount":0,"notes":"","paidAmount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","inventoryImpactStatus":"not_applicable","createdAt":"2026-05-13T19:15:45.204Z","paid_amount":0,"table_id":null,"total":0}}'::jsonb, '2026-05-13T19:15:45.204Z'::timestamptz, '2026-05-13T19:15:45.204Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('0e55c9c1-6351-558a-9015-1954087ae237', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'Uzlqce9dB3Sim2plxOdU', '', 'table', 'paid', 'paid', 18000, 0, 0, 18000, 18000, 0, '2026-05-13T18:07:22.733Z'::timestamptz, '{"firebase":{"waiterId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customerName":"","inventory_applied_at":"2026-05-13T18:07:23.660Z","payment_status":"paid","table_session_id":"ixvrEdnZwG1RPacOrvrx","source_id":"sxhrXVOdWA9cTOz0Japd","waiter_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","tableSessionId":"ixvrEdnZwG1RPacOrvrx","subtotal":18000,"sourceType":"table","total":18000,"paid_amount":18000,"table_id":"x0OEOINMrf3LYW5eADGc","createdAt":"2026-05-13T18:07:22.733Z","inventoryImpactStatus":"not_applicable","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paidAmount":18000,"notes":"","changeAmount":2000,"source_type":"table","created_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","inventory_impact_status":"not_applicable","updatedBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"customer_id":null,"tableId":"x0OEOINMrf3LYW5eADGc","customer_name":"","pending_amount":0,"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sourceId":"sxhrXVOdWA9cTOz0Japd","order_id":"sxhrXVOdWA9cTOz0Japd","discounts":0,"taxes":0,"updatedAt":"2026-05-13T18:07:23.660Z","inventoryAppliedAt":"2026-05-13T18:07:23.660Z","updated_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"paymentStatus":"paid","change_amount":2000,"cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","status":"paid","orderId":"sxhrXVOdWA9cTOz0Japd","createdBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","pendingAmount":0,"customerId":null}}'::jsonb, '2026-05-13T18:07:22.733Z'::timestamptz, '2026-05-13T18:07:23.660Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('1b418783-685e-5a59-bc9a-1ea89f19a8b5', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'dd03276b-4f44-5772-a0d2-9bf6a0cf0221', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'VnObj9qTGwOSpuaXPaaf', '', 'ticket_wallet', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-13T19:13:47.044Z'::timestamptz, '{"firebase":{"paidAmount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","table_id":null,"paid_amount":0,"inventoryImpactStatus":"not_applicable","createdAt":"2026-05-13T19:13:47.044Z","total":0,"updatedBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","inventory_impact_status":"not_applicable","created_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"source_type":"ticket_sale","changeAmount":0,"notes":"","source_id":"aluDwFsozT9N1J6bQaLh","table_session_id":null,"payment_status":"paid","waiterId":null,"customerName":"Vanessa","sourceType":"ticket_sale","tableSessionId":null,"waiter_id":null,"subtotal":0,"orderId":"aluDwFsozT9N1J6bQaLh","createdBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"status":"paid","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"pendingAmount":0,"customerId":"I3OAdrJ5WY5AiNPQWmmx","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","discounts":0,"order_id":"aluDwFsozT9N1J6bQaLh","sourceId":"aluDwFsozT9N1J6bQaLh","taxes":0,"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_name":"Vanessa","pending_amount":0,"customer_id":"I3OAdrJ5WY5AiNPQWmmx","tableId":null,"updated_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"paymentStatus":"paid","updatedAt":"2026-05-13T19:13:47.044Z"}}'::jsonb, '2026-05-13T19:13:47.044Z'::timestamptz, '2026-05-13T19:13:47.044Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('174cde19-f384-5795-8d8a-49ed6fbe758c', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'f8bw0BCQHqNLqGyThaeY', '', 'table', 'paid', 'paid', 13500, 0, 0, 13500, 13500, 0, '2026-05-13T18:37:37.868Z'::timestamptz, '{"firebase":{"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customerId":null,"pendingAmount":0,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","createdBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"orderId":"ryBcFmchzaPGXaoDvt0V","change_amount":0,"cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","status":"paid","inventoryAppliedAt":"2026-05-13T18:37:38.888Z","updatedAt":"2026-05-13T18:37:38.888Z","paymentStatus":"paid","updated_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","taxes":0,"sourceId":"ryBcFmchzaPGXaoDvt0V","order_id":"ryBcFmchzaPGXaoDvt0V","discounts":0,"tableId":"rVv4OIwPnrp2wwNjrCpB","customer_id":null,"pending_amount":0,"customer_name":"","inventory_impact_status":"not_applicable","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","updatedBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"notes":"","changeAmount":0,"source_type":"table","created_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paidAmount":13500,"total":13500,"createdAt":"2026-05-13T18:37:37.868Z","inventoryImpactStatus":"not_applicable","paid_amount":13500,"table_id":"rVv4OIwPnrp2wwNjrCpB","sourceType":"table","subtotal":13500,"waiter_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","tableSessionId":"K9o0LzFCBopUcZiFcY4K","inventory_applied_at":"2026-05-13T18:37:38.888Z","payment_status":"paid","table_session_id":"K9o0LzFCBopUcZiFcY4K","source_id":"ryBcFmchzaPGXaoDvt0V","waiterId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customerName":""}}'::jsonb, '2026-05-13T18:37:37.868Z'::timestamptz, '2026-05-13T18:37:38.888Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('d23efbe0-7f0f-5048-9741-a024d28b1de9', 'c08a64ca-23dd-4599-b680-6192d14676aa', '2171ae6e-badd-55fa-b15f-9cf5086724e9', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'gtsmyVRjucL8K04oaH1B', '', 'ticket_wallet', 'paid', 'paid', 0, 0, 0, 13500, 13500, 0, '2026-05-13T19:33:29.667Z'::timestamptz, '{"firebase":{"orderId":"ZoaPDGoFyDfTM7gg3FZ4","createdBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"status":"paid","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"pendingAmount":0,"customerId":"OpObwErenP46Rt5emKSr","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","discounts":0,"order_id":"ZoaPDGoFyDfTM7gg3FZ4","sourceId":"ZoaPDGoFyDfTM7gg3FZ4","taxes":0,"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customer_name":"Leidy","pending_amount":0,"customer_id":"OpObwErenP46Rt5emKSr","tableId":"x0OEOINMrf3LYW5eADGc","updated_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"paymentStatus":"paid","updatedAt":"2026-05-13T19:33:30.252Z","inventoryAppliedAt":"2026-05-13T19:33:30.252Z","paidAmount":13500,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","table_id":"x0OEOINMrf3LYW5eADGc","paid_amount":13500,"createdAt":"2026-05-13T19:33:29.667Z","inventoryImpactStatus":"not_applicable","total":13500,"updatedBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","inventory_impact_status":"not_applicable","created_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"source_type":"ticket_consumption","changeAmount":0,"notes":"","source_id":"ZoaPDGoFyDfTM7gg3FZ4","table_session_id":"AM6JhKrCbp15kKMt5tNT","payment_status":"paid","inventory_applied_at":"2026-05-13T19:33:30.252Z","waiterId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customerName":"Leidy","sourceType":"ticket_consumption","tableSessionId":"AM6JhKrCbp15kKMt5tNT","waiter_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","subtotal":0}}'::jsonb, '2026-05-13T19:33:29.667Z'::timestamptz, '2026-05-13T19:33:30.252Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('9f5a7fe1-0aad-50b1-a94f-26c37d685970', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'ae0fe857-fa90-5ea1-a23a-f3c63e3ddce2', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'h5qA1MK3jnwlls7YbGLF', '', 'ticket_wallet', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-13T19:14:23.834Z'::timestamptz, '{"firebase":{"total":0,"table_id":null,"paid_amount":0,"inventoryImpactStatus":"not_applicable","createdAt":"2026-05-13T19:14:23.834Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paidAmount":0,"notes":"","changeAmount":0,"source_type":"ticket_sale","created_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","inventory_impact_status":"not_applicable","updatedBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"customerName":"María José","waiterId":null,"source_id":"n8sAwbUkda9pFot5xO52","table_session_id":null,"payment_status":"paid","tableSessionId":null,"waiter_id":null,"subtotal":0,"sourceType":"ticket_sale","change_amount":0,"status":"paid","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","orderId":"n8sAwbUkda9pFot5xO52","createdBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","pendingAmount":0,"customerId":"z16gIYUt5AHnyWZcDf96","customer_id":"z16gIYUt5AHnyWZcDf96","tableId":null,"customer_name":"María José","pending_amount":0,"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","discounts":0,"order_id":"n8sAwbUkda9pFot5xO52","sourceId":"n8sAwbUkda9pFot5xO52","taxes":0,"updatedAt":"2026-05-13T19:14:23.834Z","updated_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"paymentStatus":"paid"}}'::jsonb, '2026-05-13T19:14:23.834Z'::timestamptz, '2026-05-13T19:14:23.834Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('aa57239f-9d27-5b0d-b0e2-2ca89ab1dd8c', 'c08a64ca-23dd-4599-b680-6192d14676aa', null, '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'm6U0cwGB2B1XbJyzRZ98', '', 'table', 'paid', 'paid', 32000, 0, 0, 32000, 32000, 0, '2026-05-13T18:41:19.930Z'::timestamptz, '{"firebase":{"customerName":"","waiterId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","source_id":"wQG7DsloA8LsOjd6UhIB","payment_status":"paid","table_session_id":"2e09quWoo3UCySGKZv48","inventory_applied_at":"2026-05-13T18:41:22.252Z","subtotal":32000,"tableSessionId":"2e09quWoo3UCySGKZv48","waiter_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sourceType":"table","createdAt":"2026-05-13T18:41:19.930Z","inventoryImpactStatus":"not_applicable","table_id":"x0OEOINMrf3LYW5eADGc","paid_amount":32000,"total":32000,"paidAmount":32000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","created_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"source_type":"table","changeAmount":18000,"notes":"","updatedBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"inventory_impact_status":"not_applicable","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","pending_amount":0,"customer_name":"","tableId":"x0OEOINMrf3LYW5eADGc","customer_id":null,"taxes":0,"sourceId":"wQG7DsloA8LsOjd6UhIB","order_id":"wQG7DsloA8LsOjd6UhIB","discounts":0,"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paymentStatus":"paid","updated_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"inventoryAppliedAt":"2026-05-13T18:41:22.252Z","updatedAt":"2026-05-13T18:41:22.252Z","status":"paid","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":18000,"createdBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"orderId":"wQG7DsloA8LsOjd6UhIB","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","customerId":null,"pendingAmount":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-13T18:41:19.930Z'::timestamptz, '2026-05-13T18:41:22.252Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('863f26ef-b2d4-551d-ad82-f6f2b352dc43', 'c08a64ca-23dd-4599-b680-6192d14676aa', '8baaa4d7-231a-535d-a859-77ab8c46bd0d', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'mEoceI2MqcIfiBZ2ob4P', '', 'ticket_wallet', 'paid', 'paid', 0, 0, 0, 0, 0, 0, '2026-05-13T19:12:51.473Z'::timestamptz, '{"firebase":{"updated_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"paymentStatus":"paid","updatedAt":"2026-05-13T19:12:51.473Z","customer_name":"Sara","pending_amount":0,"customer_id":"5y5Hefq4dhQ3G130kmaX","tableId":null,"discounts":0,"order_id":"mMPqBdzuYPWBBZL4VuFB","sourceId":"mMPqBdzuYPWBBZL4VuFB","taxes":0,"cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","pendingAmount":0,"customerId":"5y5Hefq4dhQ3G130kmaX","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","status":"paid","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"orderId":"mMPqBdzuYPWBBZL4VuFB","createdBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"waiter_id":null,"tableSessionId":null,"subtotal":0,"sourceType":"ticket_sale","customerName":"Sara","waiterId":null,"source_id":"mMPqBdzuYPWBBZL4VuFB","table_session_id":null,"payment_status":"paid","created_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"source_type":"ticket_sale","changeAmount":0,"notes":"","updatedBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","inventory_impact_status":"not_applicable","table_id":null,"paid_amount":0,"inventoryImpactStatus":"not_applicable","createdAt":"2026-05-13T19:12:51.473Z","total":0,"paidAmount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-13T19:12:51.473Z'::timestamptz, '2026-05-13T19:12:51.473Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sales (id, business_id, customer_id, cash_session_id, legacy_firebase_id, sale_number, source_type, status, payment_status, subtotal, tax_total, discount_total, total, paid_amount, pending_amount, closed_at, metadata, created_at, updated_at)
values ('6fafc1f8-6a28-5f87-a3cc-ea074460b146', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'dd03276b-4f44-5772-a0d2-9bf6a0cf0221', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'tgkRo7vwurXeG4Xqkd0e', '', 'ticket_wallet', 'paid', 'paid', 0, 0, 0, 13500, 13500, 0, '2026-05-13T18:05:40.236Z'::timestamptz, '{"firebase":{"change_amount":0,"status":"paid","cashierId":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"orderId":"4OX3gUeeMvx7EHPS2fMq","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customerId":"I3OAdrJ5WY5AiNPQWmmx","pendingAmount":0,"tableId":"quick-sale","customer_id":"I3OAdrJ5WY5AiNPQWmmx","pending_amount":0,"customer_name":"Vanessa","cashier_id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","taxes":0,"sourceId":"4OX3gUeeMvx7EHPS2fMq","discounts":0,"order_id":"4OX3gUeeMvx7EHPS2fMq","inventoryAppliedAt":"2026-05-13T18:05:43.281Z","updatedAt":"2026-05-13T18:05:43.281Z","paymentStatus":"paid","updated_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"total":13500,"createdAt":"2026-05-13T18:05:40.236Z","inventoryImpactStatus":"not_applicable","table_id":"quick-sale","paid_amount":13500,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paidAmount":13500,"source_type":"ticket_consumption","changeAmount":0,"notes":"","created_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"inventory_impact_status":"not_applicable","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","updatedBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"waiterId":null,"customerName":"Vanessa","inventory_applied_at":"2026-05-13T18:05:43.281Z","source_id":"4OX3gUeeMvx7EHPS2fMq","table_session_id":null,"payment_status":"paid","subtotal":0,"tableSessionId":null,"waiter_id":null,"sourceType":"ticket_consumption"}}'::jsonb, '2026-05-13T18:05:40.236Z'::timestamptz, '2026-05-13T18:05:43.281Z'::timestamptz)
on conflict (id) do update set
  customer_id = excluded.customer_id,
  cash_session_id = excluded.cash_session_id,
  status = excluded.status,
  payment_status = excluded.payment_status,
  subtotal = excluded.subtotal,
  tax_total = excluded.tax_total,
  discount_total = excluded.discount_total,
  total = excluded.total,
  paid_amount = excluded.paid_amount,
  pending_amount = excluded.pending_amount,
  closed_at = excluded.closed_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('f02a2d69-d08c-5503-b9aa-00879f645f40', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'a06b2656-f512-503c-9a39-bf0bb8c6742e', '62a85031-d5f6-51a2-9056-117c0e7a5b00', 'Mantecada', 1, 4000, 4000, 'active', '{"legacy_firebase_id":"1UUqTWgGmiI8xz2VP7TN","firebase":{"source_item_id":"856a3aec-6309-478f-8475-c7596304e1c5","subtotal":4000,"inventory_impact_status":"pending","quantity":1,"product_name":"Mantecada","productId":"MHAFSOy9SBrkdxIcUYcu","createdAt":"2026-05-13T18:47:10.528Z","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","saleId":"3dn57sfKxZNxQtupoog1","sale_id":"3dn57sfKxZNxQtupoog1","technicalSheetId":null,"technical_sheet_id":null,"inventoryImpactStatus":"pending","product_id":"MHAFSOy9SBrkdxIcUYcu","productName":"Mantecada","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","unit_price":4000,"unitPrice":4000,"sourceItemId":"856a3aec-6309-478f-8475-c7596304e1c5"}}'::jsonb, '2026-05-13T18:47:10.528Z'::timestamptz, '2026-05-13T18:47:10.658940Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('1eeb8614-2f99-57d7-942f-a9b3098b7567', 'c08a64ca-23dd-4599-b680-6192d14676aa', '6e22ee68-453f-5520-9a1a-57d5154045b3', '33d2575d-4e2c-5d0d-81f0-af4537d96ef9', 'Pasta con mariscos', 1, 18000, 18000, 'active', '{"legacy_firebase_id":"4DLag9V8pWbjdjD4UMnA","firebase":{"productName":"Pasta con mariscos","product_id":"KwvK2FgAoGuy93uYSUPP","sourceItemId":"KwvK2FgAoGuy93uYSUPP","unitPrice":18000,"unit_price":18000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","technicalSheetId":null,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","saleId":"1HSXO5sjRySzI91b1DYH","sale_id":"1HSXO5sjRySzI91b1DYH","inventoryImpactStatus":"pending","technical_sheet_id":null,"createdAt":"2026-05-13T17:11:34.832Z","quantity":1,"inventory_impact_status":"pending","subtotal":18000,"source_item_id":"KwvK2FgAoGuy93uYSUPP","productId":"KwvK2FgAoGuy93uYSUPP","product_name":"Pasta con mariscos"}}'::jsonb, '2026-05-13T17:11:34.832Z'::timestamptz, '2026-05-13T17:11:34.930523Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('59808b7a-39d8-52d9-a0c5-5e0615397041', 'c08a64ca-23dd-4599-b680-6192d14676aa', '1b418783-685e-5a59-bc9a-1ea89f19a8b5', null, 'Personalizada', 1, 0, 0, 'active', '{"legacy_firebase_id":"59DLDEm8yJUPebUMXJ07","firebase":{"saleId":"VnObj9qTGwOSpuaXPaaf","sale_id":"VnObj9qTGwOSpuaXPaaf","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","technicalSheetId":null,"technical_sheet_id":null,"inventoryImpactStatus":"not_applicable","product_id":"aluDwFsozT9N1J6bQaLh","productName":"Personalizada","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","unit_price":0,"unitPrice":0,"sourceItemId":"aluDwFsozT9N1J6bQaLh","source_item_id":"aluDwFsozT9N1J6bQaLh","subtotal":0,"inventory_impact_status":"not_applicable","quantity":1,"product_name":"Personalizada","productId":"aluDwFsozT9N1J6bQaLh","createdAt":"2026-05-13T19:13:47.044Z"}}'::jsonb, '2026-05-13T19:13:47.044Z'::timestamptz, '2026-05-13T19:13:47.122636Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('c5fc2ad1-47f5-5a44-a6eb-f110fd0975a3', 'c08a64ca-23dd-4599-b680-6192d14676aa', '67c81e28-c108-5653-af63-e645c00bbc38', 'bb1f5ae7-338c-5607-8961-a48d400f9886', 'Almuerzo base', 1, 13500, 13500, 'active', '{"legacy_firebase_id":"7YqoNCnnilbnOPtf5pqU","firebase":{"inventory_impact_status":"pending","quantity":1,"source_item_id":"6e7aea6c-0ac5-4ddf-918b-ed51ff7b6d7f","subtotal":13500,"productId":"nRlFt9zSV5xfbBPy9pDe","product_name":"Almuerzo base","createdAt":"2026-05-13T18:01:17.533Z","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","saleId":"3C8YUh0NVz0UE2Ok7V4P","sale_id":"3C8YUh0NVz0UE2Ok7V4P","technicalSheetId":null,"inventoryImpactStatus":"pending","technical_sheet_id":null,"product_id":"nRlFt9zSV5xfbBPy9pDe","productName":"Almuerzo base","unitPrice":13500,"sourceItemId":"6e7aea6c-0ac5-4ddf-918b-ed51ff7b6d7f","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","unit_price":13500}}'::jsonb, '2026-05-13T18:01:17.533Z'::timestamptz, '2026-05-13T18:01:17.623003Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('216145b9-dbec-5b66-abb3-ad03e6524006', 'c08a64ca-23dd-4599-b680-6192d14676aa', '9f5a7fe1-0aad-50b1-a94f-26c37d685970', null, 'Personalizada', 1, 0, 0, 'active', '{"legacy_firebase_id":"8FUG6EPV51qdjHdfTj8M","firebase":{"createdAt":"2026-05-13T19:14:23.834Z","productId":"n8sAwbUkda9pFot5xO52","product_name":"Personalizada","quantity":1,"inventory_impact_status":"not_applicable","subtotal":0,"source_item_id":"n8sAwbUkda9pFot5xO52","sourceItemId":"n8sAwbUkda9pFot5xO52","unitPrice":0,"unit_price":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","productName":"Personalizada","product_id":"n8sAwbUkda9pFot5xO52","inventoryImpactStatus":"not_applicable","technical_sheet_id":null,"technicalSheetId":null,"sale_id":"h5qA1MK3jnwlls7YbGLF","saleId":"h5qA1MK3jnwlls7YbGLF","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-13T19:14:23.834Z'::timestamptz, '2026-05-13T19:14:24.012821Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('6c4cdc76-4ef5-5f20-96f8-b70d95c11623', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'c818c5b8-a8a5-5ace-9954-6fc04f31a06b', '79e9b095-db73-5f79-881d-7a862b1e495f', 'Café Tinto', 1, 2500, 2500, 'active', '{"legacy_firebase_id":"AsBKjiXG5PYNkx55r3qp","firebase":{"productName":"Café Tinto","product_id":"NtKIBqeTd4ckJu7NJyWF","sourceItemId":"NtKIBqeTd4ckJu7NJyWF","unitPrice":2500,"unit_price":2500,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","technicalSheetId":null,"saleId":"8BanRG5OTLSnWls8Dscd","sale_id":"8BanRG5OTLSnWls8Dscd","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","inventoryImpactStatus":"pending","technical_sheet_id":null,"createdAt":"2026-05-13T18:58:52.944Z","quantity":1,"inventory_impact_status":"pending","subtotal":2500,"source_item_id":"NtKIBqeTd4ckJu7NJyWF","productId":"NtKIBqeTd4ckJu7NJyWF","product_name":"Café Tinto"}}'::jsonb, '2026-05-13T18:58:52.944Z'::timestamptz, '2026-05-13T18:58:53.039941Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('f1eec29d-10c9-54e3-90b3-2b1d693c9db6', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'aa57239f-9d27-5b0d-b0e2-2ca89ab1dd8c', '037d1867-bb6e-5395-ab7a-6aaf1b01b589', 'Almuerzo medium', 2, 16000, 32000, 'active', '{"legacy_firebase_id":"EWVwA24dDSPzvFuSjXEa","firebase":{"sale_id":"m6U0cwGB2B1XbJyzRZ98","saleId":"m6U0cwGB2B1XbJyzRZ98","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","technicalSheetId":null,"technical_sheet_id":null,"inventoryImpactStatus":"pending","product_id":"hSJLYx7QAHYmsXLfUfro","productName":"Almuerzo medium","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","unit_price":16000,"unitPrice":16000,"sourceItemId":"0897a30b-9e73-45af-a80b-452cfeb01423","source_item_id":"0897a30b-9e73-45af-a80b-452cfeb01423","subtotal":32000,"inventory_impact_status":"pending","quantity":2,"product_name":"Almuerzo medium","productId":"hSJLYx7QAHYmsXLfUfro","createdAt":"2026-05-13T18:41:19.930Z"}}'::jsonb, '2026-05-13T18:41:19.930Z'::timestamptz, '2026-05-13T18:41:20.012286Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('550424eb-02e9-5232-bcef-7e2475bd4e3c', 'c08a64ca-23dd-4599-b680-6192d14676aa', '62622a50-e53b-579e-8d44-4334cc97021d', 'bb1f5ae7-338c-5607-8961-a48d400f9886', 'Almuerzo base', 1, 13500, 13500, 'active', '{"legacy_firebase_id":"GoZEe1Q319SynT4IoXTi","firebase":{"technical_sheet_id":null,"inventoryImpactStatus":"pending","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","saleId":"HFms3meDUAUOAt9nZo2R","sale_id":"HFms3meDUAUOAt9nZo2R","technicalSheetId":null,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","unit_price":13500,"unitPrice":13500,"sourceItemId":"7c71fa0e-b06c-4228-a93b-c73cd3bd6c66","product_id":"nRlFt9zSV5xfbBPy9pDe","productName":"Almuerzo base","product_name":"Almuerzo base","productId":"nRlFt9zSV5xfbBPy9pDe","source_item_id":"7c71fa0e-b06c-4228-a93b-c73cd3bd6c66","subtotal":13500,"inventory_impact_status":"pending","quantity":1,"createdAt":"2026-05-13T19:05:21.646Z"}}'::jsonb, '2026-05-13T19:05:21.646Z'::timestamptz, '2026-05-13T19:05:21.740504Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('67590fc9-133d-5cee-b9cf-f2d396199006', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'c818c5b8-a8a5-5ace-9954-6fc04f31a06b', '62a85031-d5f6-51a2-9056-117c0e7a5b00', 'Mantecada', 1, 4000, 4000, 'active', '{"legacy_firebase_id":"I3BwnD0vG2AqCRJWJoCD","firebase":{"technical_sheet_id":null,"inventoryImpactStatus":"pending","technicalSheetId":null,"sale_id":"8BanRG5OTLSnWls8Dscd","saleId":"8BanRG5OTLSnWls8Dscd","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","unit_price":4000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sourceItemId":"MHAFSOy9SBrkdxIcUYcu","unitPrice":4000,"productName":"Mantecada","product_id":"MHAFSOy9SBrkdxIcUYcu","product_name":"Mantecada","productId":"MHAFSOy9SBrkdxIcUYcu","subtotal":4000,"source_item_id":"MHAFSOy9SBrkdxIcUYcu","quantity":1,"inventory_impact_status":"pending","createdAt":"2026-05-13T18:58:52.944Z"}}'::jsonb, '2026-05-13T18:58:52.944Z'::timestamptz, '2026-05-13T18:58:53.039941Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('1d9011d2-c8e4-549f-b811-cb6eb4234427', 'c08a64ca-23dd-4599-b680-6192d14676aa', '6fafc1f8-6a28-5f87-a3cc-ea074460b146', 'bb1f5ae7-338c-5607-8961-a48d400f9886', 'Almuerzo base', 1, 13500, 13500, 'active', '{"legacy_firebase_id":"IEh5rvLAC61QdRLOM1Vz","firebase":{"inventory_impact_status":"pending","quantity":1,"source_item_id":"nRlFt9zSV5xfbBPy9pDe","subtotal":13500,"productId":"nRlFt9zSV5xfbBPy9pDe","product_name":"Almuerzo base","createdAt":"2026-05-13T18:05:40.236Z","sale_id":"tgkRo7vwurXeG4Xqkd0e","saleId":"tgkRo7vwurXeG4Xqkd0e","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","technicalSheetId":null,"inventoryImpactStatus":"pending","technical_sheet_id":null,"product_id":"nRlFt9zSV5xfbBPy9pDe","productName":"Almuerzo base","unitPrice":13500,"sourceItemId":"nRlFt9zSV5xfbBPy9pDe","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","unit_price":13500}}'::jsonb, '2026-05-13T18:05:40.236Z'::timestamptz, '2026-05-13T18:05:40.324356Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('68edeb0d-db76-5134-8881-c8ad0476a359', 'c08a64ca-23dd-4599-b680-6192d14676aa', '732b9dd5-8e44-5550-bbbc-8f928cbef402', 'bb1f5ae7-338c-5607-8961-a48d400f9886', 'Almuerzo base', 1, 13500, 13500, 'active', '{"legacy_firebase_id":"LfwbNrJdQ4Qjcpdslko0","firebase":{"technicalSheetId":null,"sale_id":"7ihscrAkb49723enEmKY","saleId":"7ihscrAkb49723enEmKY","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","inventoryImpactStatus":"pending","technical_sheet_id":null,"productName":"Almuerzo base","product_id":"nRlFt9zSV5xfbBPy9pDe","sourceItemId":"34e34e41-e651-4ea9-99c8-48b0bb807c00","unitPrice":13500,"unit_price":13500,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","quantity":1,"inventory_impact_status":"pending","subtotal":13500,"source_item_id":"34e34e41-e651-4ea9-99c8-48b0bb807c00","productId":"nRlFt9zSV5xfbBPy9pDe","product_name":"Almuerzo base","createdAt":"2026-05-13T17:53:48.413Z"}}'::jsonb, '2026-05-13T17:53:48.413Z'::timestamptz, '2026-05-13T17:53:48.479496Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('6898a0f6-32d4-5dcc-bf8d-27d432c63427', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'a278eb09-8ff9-5ddd-ae5a-0a75ad6a766a', 'c87d7a83-7446-574f-b491-45fe6cb3fe1c', 'Camarones con arroz con coco', 1, 19000, 19000, 'active', '{"legacy_firebase_id":"MHRnOcWyiMDwUupSILU4","firebase":{"product_id":"0IHf7f0tLTKBCcFagc22","productName":"Camarones con arroz con coco","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","unit_price":19000,"unitPrice":19000,"sourceItemId":"afe2e5a6-67ac-46db-9547-b508e5aad8ff","sale_id":"HizqMalQ5EOgHSUsTdmh","saleId":"HizqMalQ5EOgHSUsTdmh","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","technicalSheetId":null,"technical_sheet_id":null,"inventoryImpactStatus":"pending","createdAt":"2026-05-13T18:11:45.237Z","source_item_id":"afe2e5a6-67ac-46db-9547-b508e5aad8ff","subtotal":19000,"inventory_impact_status":"pending","quantity":1,"product_name":"Camarones con arroz con coco","productId":"0IHf7f0tLTKBCcFagc22"}}'::jsonb, '2026-05-13T18:11:45.237Z'::timestamptz, '2026-05-13T18:11:45.385845Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('9ddfc606-7e3b-57fc-943c-1fc8a5b93eda', 'c08a64ca-23dd-4599-b680-6192d14676aa', '32c8f924-5d21-5a07-abdd-6873b87aa0f1', null, 'Personalizada', 1, 0, 0, 'active', '{"legacy_firebase_id":"StfYkzarEZi8QlTunArv","firebase":{"technicalSheetId":null,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","saleId":"UeYssrV7yMnO3ZJVUy3b","sale_id":"UeYssrV7yMnO3ZJVUy3b","inventoryImpactStatus":"not_applicable","technical_sheet_id":null,"productName":"Personalizada","product_id":"uFm2ojzMhew2lJQYpnXP","sourceItemId":"uFm2ojzMhew2lJQYpnXP","unitPrice":0,"unit_price":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","quantity":1,"inventory_impact_status":"not_applicable","subtotal":0,"source_item_id":"uFm2ojzMhew2lJQYpnXP","productId":"uFm2ojzMhew2lJQYpnXP","product_name":"Personalizada","createdAt":"2026-05-13T19:15:45.204Z"}}'::jsonb, '2026-05-13T19:15:45.204Z'::timestamptz, '2026-05-13T19:15:45.267896Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('08b7f51c-a603-5dcb-8958-488bc34c6d45', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'cda5fd91-c0ee-5098-ad70-469dcd7b3fd8', 'bb1f5ae7-338c-5607-8961-a48d400f9886', 'Almuerzo base', 2, 13500, 27000, 'active', '{"legacy_firebase_id":"THXgV9UTnKafW7EfH5Ry","firebase":{"technical_sheet_id":null,"inventoryImpactStatus":"pending","technicalSheetId":null,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","saleId":"9huDsUNzlrnuD2qDkweD","sale_id":"9huDsUNzlrnuD2qDkweD","unit_price":13500,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sourceItemId":"nRlFt9zSV5xfbBPy9pDe","unitPrice":13500,"productName":"Almuerzo base","product_id":"nRlFt9zSV5xfbBPy9pDe","product_name":"Almuerzo base","productId":"nRlFt9zSV5xfbBPy9pDe","subtotal":27000,"source_item_id":"nRlFt9zSV5xfbBPy9pDe","quantity":2,"inventory_impact_status":"pending","createdAt":"2026-05-14T16:13:24.713Z"}}'::jsonb, '2026-05-14T16:13:24.713Z'::timestamptz, '2026-05-14T16:13:24.800054Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('72e7bd86-340d-548f-b4c1-0251b5431f25', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'd23efbe0-7f0f-5048-9741-a024d28b1de9', 'bb1f5ae7-338c-5607-8961-a48d400f9886', 'Almuerzo base', 1, 13500, 13500, 'active', '{"legacy_firebase_id":"XxxhtqLq1565ooDOgWzT","firebase":{"source_item_id":"0152f7de-0c6c-4b20-8d30-d5df65d09bab","subtotal":13500,"inventory_impact_status":"pending","quantity":1,"product_name":"Almuerzo base","productId":"nRlFt9zSV5xfbBPy9pDe","createdAt":"2026-05-13T19:33:29.667Z","saleId":"gtsmyVRjucL8K04oaH1B","sale_id":"gtsmyVRjucL8K04oaH1B","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","technicalSheetId":null,"technical_sheet_id":null,"inventoryImpactStatus":"pending","product_id":"nRlFt9zSV5xfbBPy9pDe","productName":"Almuerzo base","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","unit_price":13500,"unitPrice":13500,"sourceItemId":"0152f7de-0c6c-4b20-8d30-d5df65d09bab"}}'::jsonb, '2026-05-13T19:33:29.667Z'::timestamptz, '2026-05-13T19:33:29.766704Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('b788bce9-953d-5357-85d8-85edf7e4b444', 'c08a64ca-23dd-4599-b680-6192d14676aa', '8ace678c-085e-59ab-b5d3-605fa7624889', '33d2575d-4e2c-5d0d-81f0-af4537d96ef9', 'Pasta con camarones', 1, 18000, 18000, 'active', '{"legacy_firebase_id":"a9T0W9ishAyyIdVXZFX7","firebase":{"technicalSheetId":null,"sale_id":"Jo8XYewwrwqCp7FHJ4El","saleId":"Jo8XYewwrwqCp7FHJ4El","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","technical_sheet_id":null,"inventoryImpactStatus":"pending","productName":"Pasta con camarones","product_id":"KwvK2FgAoGuy93uYSUPP","unit_price":18000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sourceItemId":"KwvK2FgAoGuy93uYSUPP","unitPrice":18000,"subtotal":18000,"source_item_id":"KwvK2FgAoGuy93uYSUPP","quantity":1,"inventory_impact_status":"pending","product_name":"Pasta con camarones","productId":"KwvK2FgAoGuy93uYSUPP","createdAt":"2026-05-13T17:21:30.566Z"}}'::jsonb, '2026-05-13T17:21:30.566Z'::timestamptz, '2026-05-13T17:21:30.649029Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('c2cd6836-144f-573d-8a8a-2fb88b8d3364', 'c08a64ca-23dd-4599-b680-6192d14676aa', '6e22ee68-453f-5520-9a1a-57d5154045b3', '35db3388-2fd4-517c-8e6c-a678f2e364b0', 'Empaque sin sopa', 1, 2000, 2000, 'active', '{"legacy_firebase_id":"dZk2856LYhZn5WHhbNPy","firebase":{"product_name":"Empaque sin sopa","productId":"t1GQktdssxFaqnOTsw3S","subtotal":2000,"source_item_id":"t1GQktdssxFaqnOTsw3S","quantity":1,"inventory_impact_status":"pending","createdAt":"2026-05-13T17:11:34.832Z","technical_sheet_id":null,"inventoryImpactStatus":"pending","technicalSheetId":null,"saleId":"1HSXO5sjRySzI91b1DYH","sale_id":"1HSXO5sjRySzI91b1DYH","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","unit_price":2000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sourceItemId":"t1GQktdssxFaqnOTsw3S","unitPrice":2000,"productName":"Empaque sin sopa","product_id":"t1GQktdssxFaqnOTsw3S"}}'::jsonb, '2026-05-13T17:11:34.832Z'::timestamptz, '2026-05-13T17:11:34.930523Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('0ce7aa97-7da8-53ec-8ba5-38a170be6b26', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'a06b2656-f512-503c-9a39-bf0bb8c6742e', 'bb1f5ae7-338c-5607-8961-a48d400f9886', 'Almuerzo base', 1, 13500, 13500, 'active', '{"legacy_firebase_id":"lSsA0oPX0JO5R5gqY650","firebase":{"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sale_id":"3dn57sfKxZNxQtupoog1","saleId":"3dn57sfKxZNxQtupoog1","technicalSheetId":null,"inventoryImpactStatus":"pending","technical_sheet_id":null,"product_id":"nRlFt9zSV5xfbBPy9pDe","productName":"Almuerzo base","unitPrice":13500,"sourceItemId":"51f456cf-b8cb-4fbb-8f72-05d1255262f0","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","unit_price":13500,"inventory_impact_status":"pending","quantity":1,"source_item_id":"51f456cf-b8cb-4fbb-8f72-05d1255262f0","subtotal":13500,"productId":"nRlFt9zSV5xfbBPy9pDe","product_name":"Almuerzo base","createdAt":"2026-05-13T18:47:10.528Z"}}'::jsonb, '2026-05-13T18:47:10.528Z'::timestamptz, '2026-05-13T18:47:10.658940Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('354ffaef-bb1f-51d1-88ec-cc9dba841cd8', 'c08a64ca-23dd-4599-b680-6192d14676aa', '0e55c9c1-6351-558a-9015-1954087ae237', '33d2575d-4e2c-5d0d-81f0-af4537d96ef9', 'Pasta con mariscos', 1, 18000, 18000, 'active', '{"legacy_firebase_id":"n3rau3LDrTygHmpItmw4","firebase":{"createdAt":"2026-05-13T18:07:22.733Z","productId":"KwvK2FgAoGuy93uYSUPP","product_name":"Pasta con mariscos","inventory_impact_status":"pending","quantity":1,"source_item_id":"cd5f97a3-886f-437e-8a73-4ecb5c948cd8","subtotal":18000,"unitPrice":18000,"sourceItemId":"cd5f97a3-886f-437e-8a73-4ecb5c948cd8","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","unit_price":18000,"product_id":"KwvK2FgAoGuy93uYSUPP","productName":"Pasta con mariscos","inventoryImpactStatus":"pending","technical_sheet_id":null,"sale_id":"Uzlqce9dB3Sim2plxOdU","saleId":"Uzlqce9dB3Sim2plxOdU","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","technicalSheetId":null}}'::jsonb, '2026-05-13T18:07:22.733Z'::timestamptz, '2026-05-13T18:07:22.823959Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('d4cf79a0-ed74-5083-8485-010198b8c9c7', 'c08a64ca-23dd-4599-b680-6192d14676aa', '4f2ceec0-fd8d-5a08-a647-9065967ffa64', 'bb1f5ae7-338c-5607-8961-a48d400f9886', 'Almuerzo base', 2, 13500, 27000, 'active', '{"legacy_firebase_id":"rOaTXpQjLC9iOPuDHrsx","firebase":{"unitPrice":13500,"sourceItemId":"71eb67d0-bf14-4bfb-9541-64143190b92d","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","unit_price":13500,"product_id":"nRlFt9zSV5xfbBPy9pDe","productName":"Almuerzo base","inventoryImpactStatus":"pending","technical_sheet_id":null,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sale_id":"9C8xXyC8zEXEPvwuNnAM","saleId":"9C8xXyC8zEXEPvwuNnAM","technicalSheetId":null,"createdAt":"2026-05-13T19:19:40.515Z","productId":"nRlFt9zSV5xfbBPy9pDe","product_name":"Almuerzo base","inventory_impact_status":"pending","quantity":2,"source_item_id":"71eb67d0-bf14-4bfb-9541-64143190b92d","subtotal":27000}}'::jsonb, '2026-05-13T19:19:40.515Z'::timestamptz, '2026-05-13T19:19:40.605678Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('91217f42-3d5a-5bea-ba59-d788d859cbd4', 'c08a64ca-23dd-4599-b680-6192d14676aa', '863f26ef-b2d4-551d-ad82-f6f2b352dc43', null, 'Personalizada', 1, 0, 0, 'active', '{"legacy_firebase_id":"u5bIAINlHjGRLdn6zGfD","firebase":{"technicalSheetId":null,"saleId":"mEoceI2MqcIfiBZ2ob4P","sale_id":"mEoceI2MqcIfiBZ2ob4P","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","technical_sheet_id":null,"inventoryImpactStatus":"not_applicable","productName":"Personalizada","product_id":"mMPqBdzuYPWBBZL4VuFB","unit_price":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","sourceItemId":"mMPqBdzuYPWBBZL4VuFB","unitPrice":0,"subtotal":0,"source_item_id":"mMPqBdzuYPWBBZL4VuFB","quantity":1,"inventory_impact_status":"not_applicable","product_name":"Personalizada","productId":"mMPqBdzuYPWBBZL4VuFB","createdAt":"2026-05-13T19:12:51.473Z"}}'::jsonb, '2026-05-13T19:12:51.473Z'::timestamptz, '2026-05-13T19:12:51.544505Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.sale_items (id, business_id, sale_id, product_id, product_name, quantity, unit_price, subtotal, status, metadata, created_at, updated_at)
values ('c70eac08-b0e8-5dbd-a8ff-6501026e2983', 'c08a64ca-23dd-4599-b680-6192d14676aa', '174cde19-f384-5795-8d8a-49ed6fbe758c', 'bb1f5ae7-338c-5607-8961-a48d400f9886', 'Almuerzo base', 1, 13500, 13500, 'active', '{"legacy_firebase_id":"xw19ZWropooIkivNyZGr","firebase":{"createdAt":"2026-05-13T18:37:37.868Z","quantity":1,"inventory_impact_status":"pending","subtotal":13500,"source_item_id":"98a0fb25-4f25-40e8-b370-d69dbd8b6648","productId":"nRlFt9zSV5xfbBPy9pDe","product_name":"Almuerzo base","productName":"Almuerzo base","product_id":"nRlFt9zSV5xfbBPy9pDe","sourceItemId":"98a0fb25-4f25-40e8-b370-d69dbd8b6648","unitPrice":13500,"unit_price":13500,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","technicalSheetId":null,"sale_id":"f8bw0BCQHqNLqGyThaeY","saleId":"f8bw0BCQHqNLqGyThaeY","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","inventoryImpactStatus":"pending","technical_sheet_id":null}}'::jsonb, '2026-05-13T18:37:37.868Z'::timestamptz, '2026-05-13T18:37:38.064981Z'::timestamptz)
on conflict (id) do update set
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price,
  subtotal = excluded.subtotal,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('6fdfb037-12cd-5909-a352-0ab05fbb5b40', 'c08a64ca-23dd-4599-b680-6192d14676aa', '1Nsv4jIo4GWXPuI4L4oE', '67c81e28-c108-5653-af63-e645c00bbc38', null, 'ticket_wallet', 13500, 'completed', '', '2026-05-13T18:01:17.533Z'::timestamptz, '{"firebase":{"ticketUnits":1,"method":"ticket_wallet","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","reference":"","amount":13500,"status":"completed","createdAt":"2026-05-13T18:01:17.533Z","cashSessionId":null,"affects_cash_register":false,"sale_id":"3C8YUh0NVz0UE2Ok7V4P","cashReceived":0,"affectsCashRegister":false,"customer_id":"CEj6ahhroDiVbXDGRT5K","received_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"changeAmount":0,"customerId":"CEj6ahhroDiVbXDGRT5K","ticket_units":1,"cash_received":0,"receivedBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"saleId":"3C8YUh0NVz0UE2Ok7V4P","cash_session_id":null}}'::jsonb, '2026-05-13T18:01:17.533Z'::timestamptz, '2026-05-13T18:01:17.623003Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('95d67db6-58d5-5470-aa55-25dcf9e9fa4c', 'c08a64ca-23dd-4599-b680-6192d14676aa', '35uSPuC4o5mhcWRzmX0h', '2fb429ce-09ba-5d9c-82f6-39bfc20730a2', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'cash', 6000, 'completed', '', '2026-05-13T18:07:37.553Z'::timestamptz, '{"firebase":{"received_by":null,"customer_id":"I3OAdrJ5WY5AiNPQWmmx","affectsCashRegister":true,"sale_id":"IICa0S26bV044sD415Qg","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","affects_cash_register":true,"saleId":"IICa0S26bV044sD415Qg","receivedBy":null,"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","customerId":"I3OAdrJ5WY5AiNPQWmmx","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"cash","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdAt":"2026-05-13T18:07:37.553Z","status":"completed","amount":6000,"reference":""}}'::jsonb, '2026-05-13T18:07:37.553Z'::timestamptz, '2026-05-13T18:07:37.611769Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('61c73b8f-b66f-54e6-8b2a-dc87ea553698', 'c08a64ca-23dd-4599-b680-6192d14676aa', '3SOGrbz0gjrhN95D38Vq', '62622a50-e53b-579e-8d44-4334cc97021d', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'nequi', 13500, 'completed', '', '2026-05-13T19:05:21.646Z'::timestamptz, '{"firebase":{"customerId":null,"cash_received":0,"ticket_units":0,"changeAmount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","saleId":"HFms3meDUAUOAt9nZo2R","receivedBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"cashReceived":0,"sale_id":"HFms3meDUAUOAt9nZo2R","affects_cash_register":true,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","customer_id":null,"received_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"affectsCashRegister":true,"reference":"","createdAt":"2026-05-13T19:05:21.646Z","amount":13500,"status":"completed","ticketUnits":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"nequi"}}'::jsonb, '2026-05-13T19:05:21.646Z'::timestamptz, '2026-05-13T19:05:21.740504Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('2fb5b355-7258-5717-b129-7d46c1ab44f1', 'c08a64ca-23dd-4599-b680-6192d14676aa', '5Wbt5ogbhzqZI0I1s6ZA', '6e22ee68-453f-5520-9a1a-57d5154045b3', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'cash', 2000, 'completed', '', '2026-05-13T17:11:34.832Z'::timestamptz, '{"firebase":{"reference":"","createdAt":"2026-05-13T17:11:34.832Z","amount":2000,"status":"completed","ticketUnits":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"cash","customerId":null,"cash_received":2000,"ticket_units":0,"changeAmount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","receivedBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"saleId":"1HSXO5sjRySzI91b1DYH","sale_id":"1HSXO5sjRySzI91b1DYH","cashReceived":2000,"affects_cash_register":true,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","received_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"customer_id":null,"affectsCashRegister":true}}'::jsonb, '2026-05-13T17:11:34.832Z'::timestamptz, '2026-05-13T17:11:34.930523Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('5f83eb31-b9f7-535e-8699-455dfdd00004', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'FIEPl8Wo8OPcVRq1IuUE', 'a06b2656-f512-503c-9a39-bf0bb8c6742e', null, 'ticket_wallet', 13500, 'completed', '', '2026-05-13T18:47:10.528Z'::timestamptz, '{"firebase":{"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"ticket_wallet","ticketUnits":1,"createdAt":"2026-05-13T18:47:10.528Z","status":"completed","amount":13500,"reference":"","customer_id":"z16gIYUt5AHnyWZcDf96","received_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"affectsCashRegister":false,"sale_id":"3dn57sfKxZNxQtupoog1","cashReceived":0,"affects_cash_register":false,"cashSessionId":null,"cash_session_id":null,"saleId":"3dn57sfKxZNxQtupoog1","receivedBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"ticket_units":1,"cash_received":0,"customerId":"z16gIYUt5AHnyWZcDf96","changeAmount":0,"change_amount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-13T18:47:10.528Z'::timestamptz, '2026-05-13T18:47:10.658940Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('f567c4fb-5426-530a-ab59-1814df402379', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'HNDbiwbmLyuF0ke9SNgL', 'aa57239f-9d27-5b0d-b0e2-2ca89ab1dd8c', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'cash', 32000, 'completed', '', '2026-05-13T18:41:19.930Z'::timestamptz, '{"firebase":{"ticketUnits":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"cash","reference":"","createdAt":"2026-05-13T18:41:19.930Z","amount":32000,"status":"completed","sale_id":"m6U0cwGB2B1XbJyzRZ98","cashReceived":50000,"affects_cash_register":true,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","customer_id":null,"received_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"affectsCashRegister":true,"ticket_units":0,"cash_received":50000,"customerId":null,"changeAmount":18000,"change_amount":18000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","saleId":"m6U0cwGB2B1XbJyzRZ98","receivedBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}}'::jsonb, '2026-05-13T18:41:19.930Z'::timestamptz, '2026-05-13T18:41:20.012286Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('7ff80436-284b-590e-a9f7-6b34016aae2f', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'JDDQ9DB642xGUn5bJcc3', 'c818c5b8-a8a5-5ace-9954-6fc04f31a06b', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'cash', 500, 'completed', '', '2026-05-13T18:58:52.944Z'::timestamptz, '{"firebase":{"reference":"","status":"completed","amount":500,"createdAt":"2026-05-13T18:58:52.944Z","ticketUnits":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"cash","changeAmount":0,"change_amount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","ticket_units":0,"cash_received":500,"customerId":null,"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","saleId":"8BanRG5OTLSnWls8Dscd","receivedBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"affects_cash_register":true,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","sale_id":"8BanRG5OTLSnWls8Dscd","cashReceived":500,"affectsCashRegister":true,"customer_id":null,"received_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"}}}'::jsonb, '2026-05-13T18:58:52.944Z'::timestamptz, '2026-05-13T18:58:53.039941Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('31edb2e4-7ba3-56ab-9986-d158c2ebecba', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'MKCeoFWa3PY8TCul30vD', 'a278eb09-8ff9-5ddd-ae5a-0a75ad6a766a', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'cash', 19000, 'completed', '', '2026-05-13T18:11:45.237Z'::timestamptz, '{"firebase":{"sale_id":"HizqMalQ5EOgHSUsTdmh","cashReceived":19000,"affects_cash_register":true,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","customer_id":null,"received_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"affectsCashRegister":true,"customerId":null,"cash_received":19000,"ticket_units":0,"changeAmount":0,"change_amount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","receivedBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"saleId":"HizqMalQ5EOgHSUsTdmh","ticketUnits":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"cash","reference":"","createdAt":"2026-05-13T18:11:45.237Z","amount":19000,"status":"completed"}}'::jsonb, '2026-05-13T18:11:45.237Z'::timestamptz, '2026-05-13T18:11:45.385845Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('4dd1cf30-aea1-5162-89cb-793150b553b7', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'MlIdkwfQpgh5xjI4oecv', '0e55c9c1-6351-558a-9015-1954087ae237', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'cash', 18000, 'completed', '', '2026-05-13T18:07:22.733Z'::timestamptz, '{"firebase":{"customer_id":null,"received_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"affectsCashRegister":true,"sale_id":"Uzlqce9dB3Sim2plxOdU","cashReceived":20000,"affects_cash_register":true,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","saleId":"Uzlqce9dB3Sim2plxOdU","receivedBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"ticket_units":0,"cash_received":20000,"customerId":null,"changeAmount":2000,"change_amount":2000,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"cash","ticketUnits":0,"createdAt":"2026-05-13T18:07:22.733Z","status":"completed","amount":18000,"reference":""}}'::jsonb, '2026-05-13T18:07:22.733Z'::timestamptz, '2026-05-13T18:07:22.823959Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('79a350c3-2451-5a70-b81a-232cf3ef3a80', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'PxmgaCMWmWaq68ldfUhI', 'c818c5b8-a8a5-5ace-9954-6fc04f31a06b', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'nequi', 6000, 'completed', '', '2026-05-13T18:58:52.944Z'::timestamptz, '{"firebase":{"amount":6000,"status":"completed","createdAt":"2026-05-13T18:58:52.944Z","reference":"","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"nequi","ticketUnits":0,"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","receivedBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"saleId":"8BanRG5OTLSnWls8Dscd","changeAmount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"customerId":null,"ticket_units":0,"cash_received":0,"affectsCashRegister":true,"customer_id":null,"received_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"affects_cash_register":true,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","sale_id":"8BanRG5OTLSnWls8Dscd","cashReceived":0}}'::jsonb, '2026-05-13T18:58:52.944Z'::timestamptz, '2026-05-13T18:58:53.039941Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('241a5d5f-d46c-523c-b9af-bd39bef87e74', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Xem8XGd32Geo3BYusWbm', '732b9dd5-8e44-5550-bbbc-8f928cbef402', null, 'ticket_wallet', 13500, 'completed', '', '2026-05-13T17:53:48.413Z'::timestamptz, '{"firebase":{"ticketUnits":1,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"ticket_wallet","reference":"","createdAt":"2026-05-13T17:53:48.413Z","status":"completed","amount":13500,"sale_id":"7ihscrAkb49723enEmKY","cashReceived":0,"affects_cash_register":false,"cashSessionId":null,"customer_id":"9BoVNCEhtYgdjQQL413W","received_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"affectsCashRegister":false,"customerId":"9BoVNCEhtYgdjQQL413W","ticket_units":1,"cash_received":0,"changeAmount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"cash_session_id":null,"receivedBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"saleId":"7ihscrAkb49723enEmKY"}}'::jsonb, '2026-05-13T17:53:48.413Z'::timestamptz, '2026-05-13T17:53:48.479496Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('6210b973-bf5c-5149-8b1e-fbdbb4efeb7f', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'cAeyGg91cTS33znwfRIU', 'd23efbe0-7f0f-5048-9741-a024d28b1de9', null, 'ticket_wallet', 13500, 'completed', '', '2026-05-13T19:33:29.667Z'::timestamptz, '{"firebase":{"customerId":"OpObwErenP46Rt5emKSr","cash_received":0,"ticket_units":1,"changeAmount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"cash_session_id":null,"saleId":"gtsmyVRjucL8K04oaH1B","receivedBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"sale_id":"gtsmyVRjucL8K04oaH1B","cashReceived":0,"affects_cash_register":false,"cashSessionId":null,"customer_id":"OpObwErenP46Rt5emKSr","received_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"affectsCashRegister":false,"reference":"","createdAt":"2026-05-13T19:33:29.667Z","amount":13500,"status":"completed","ticketUnits":1,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"ticket_wallet"}}'::jsonb, '2026-05-13T19:33:29.667Z'::timestamptz, '2026-05-13T19:33:29.766704Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('531e26f6-0c8f-5f0e-bade-b1113608dc56', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'chbhjVpV4id76A8i8lix', 'a06b2656-f512-503c-9a39-bf0bb8c6742e', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'nequi', 4000, 'completed', '', '2026-05-13T18:47:10.528Z'::timestamptz, '{"firebase":{"changeAmount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"customerId":"z16gIYUt5AHnyWZcDf96","cash_received":0,"ticket_units":0,"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","saleId":"3dn57sfKxZNxQtupoog1","receivedBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"affects_cash_register":true,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","cashReceived":0,"sale_id":"3dn57sfKxZNxQtupoog1","affectsCashRegister":true,"customer_id":"z16gIYUt5AHnyWZcDf96","received_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"reference":"","amount":4000,"status":"completed","createdAt":"2026-05-13T18:47:10.528Z","ticketUnits":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"nequi"}}'::jsonb, '2026-05-13T18:47:10.528Z'::timestamptz, '2026-05-13T18:47:10.658940Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('950bf858-e19f-5fa0-89c4-2f0c69e2106b', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'd2KbW8kirLIfCJ0IqdFD', '8ace678c-085e-59ab-b5d3-605fa7624889', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'nequi', 18000, 'completed', '', '2026-05-13T17:21:30.566Z'::timestamptz, '{"firebase":{"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","affects_cash_register":true,"sale_id":"Jo8XYewwrwqCp7FHJ4El","cashReceived":0,"affectsCashRegister":true,"customer_id":null,"received_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"change_amount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","changeAmount":0,"ticket_units":0,"cash_received":0,"customerId":null,"saleId":"Jo8XYewwrwqCp7FHJ4El","receivedBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","ticketUnits":0,"method":"nequi","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","reference":"","amount":18000,"status":"completed","createdAt":"2026-05-13T17:21:30.566Z"}}'::jsonb, '2026-05-13T17:21:30.566Z'::timestamptz, '2026-05-13T17:21:30.649029Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('d6d0cb80-1e51-527e-8691-b86f72d9cc80', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'fFymIWQE28gz8pLIFrNJ', '6e22ee68-453f-5520-9a1a-57d5154045b3', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'nequi', 18000, 'completed', '', '2026-05-13T17:11:34.832Z'::timestamptz, '{"firebase":{"affectsCashRegister":true,"customer_id":null,"received_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"affects_cash_register":true,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","sale_id":"1HSXO5sjRySzI91b1DYH","cashReceived":0,"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","saleId":"1HSXO5sjRySzI91b1DYH","receivedBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"changeAmount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"customerId":null,"cash_received":0,"ticket_units":0,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"nequi","ticketUnits":0,"amount":18000,"status":"completed","createdAt":"2026-05-13T17:11:34.832Z","reference":""}}'::jsonb, '2026-05-13T17:11:34.832Z'::timestamptz, '2026-05-13T17:11:34.930523Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('336aaafd-9d8b-5940-af9c-342360ad407c', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'gWemRLulLiGyFZe1YPly', '09f55426-9a55-5ffd-be27-c583343d3680', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'cash', 29500, 'completed', '', '2026-05-13T16:55:32.357Z'::timestamptz, '{"firebase":{"affectsCashRegister":true,"customer_id":"NbOPtf5PG39cs18y5mtF","received_by":null,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","affects_cash_register":true,"sale_id":"9i2gD0W1CqjQIA5nko0f","receivedBy":null,"saleId":"9i2gD0W1CqjQIA5nko0f","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customerId":"NbOPtf5PG39cs18y5mtF","method":"cash","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","status":"completed","amount":29500,"createdAt":"2026-05-13T16:55:32.357Z","reference":""}}'::jsonb, '2026-05-13T16:55:32.357Z'::timestamptz, '2026-05-13T16:55:32.497061Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('cafa3d9b-d6d6-5646-b877-1c11c6239187', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'jkeu4DmWfrQNeokwkm9a', '174cde19-f384-5795-8d8a-49ed6fbe758c', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'nequi', 13500, 'completed', '', '2026-05-13T18:37:37.868Z'::timestamptz, '{"firebase":{"ticketUnits":0,"method":"nequi","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","reference":"","createdAt":"2026-05-13T18:37:37.868Z","amount":13500,"status":"completed","sale_id":"f8bw0BCQHqNLqGyThaeY","cashReceived":0,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","affects_cash_register":true,"customer_id":null,"received_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"affectsCashRegister":true,"customerId":null,"cash_received":0,"ticket_units":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"changeAmount":0,"receivedBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"saleId":"f8bw0BCQHqNLqGyThaeY","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9"}}'::jsonb, '2026-05-13T18:37:37.868Z'::timestamptz, '2026-05-13T18:37:38.064981Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('79336bef-3cac-5b5c-beba-8a674af2958b', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'kV2dvoaU9yU2wqYcknSe', '6fafc1f8-6a28-5f87-a3cc-ea074460b146', null, 'ticket_wallet', 13500, 'completed', '', '2026-05-13T18:05:40.236Z'::timestamptz, '{"firebase":{"saleId":"tgkRo7vwurXeG4Xqkd0e","receivedBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"cash_session_id":null,"customerId":"I3OAdrJ5WY5AiNPQWmmx","cash_received":0,"ticket_units":1,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","change_amount":0,"changeAmount":0,"received_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"customer_id":"I3OAdrJ5WY5AiNPQWmmx","affectsCashRegister":false,"sale_id":"tgkRo7vwurXeG4Xqkd0e","cashReceived":0,"cashSessionId":null,"affects_cash_register":false,"createdAt":"2026-05-13T18:05:40.236Z","amount":13500,"status":"completed","reference":"","method":"ticket_wallet","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","ticketUnits":1}}'::jsonb, '2026-05-13T18:05:40.236Z'::timestamptz, '2026-05-13T18:05:40.324356Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('2c127416-8de2-54b5-9165-4f9887f755b7', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'r0vHFPR7bRjlojojPXNs', '4f2ceec0-fd8d-5a08-a647-9065967ffa64', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'nequi', 27000, 'completed', '', '2026-05-13T19:19:40.515Z'::timestamptz, '{"firebase":{"sale_id":"9C8xXyC8zEXEPvwuNnAM","cashReceived":0,"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","affects_cash_register":true,"customer_id":null,"received_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"affectsCashRegister":true,"customerId":null,"ticket_units":0,"cash_received":0,"change_amount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","changeAmount":0,"saleId":"9C8xXyC8zEXEPvwuNnAM","receivedBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","ticketUnits":0,"method":"nequi","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","reference":"","createdAt":"2026-05-13T19:19:40.515Z","status":"completed","amount":27000}}'::jsonb, '2026-05-13T19:19:40.515Z'::timestamptz, '2026-05-13T19:19:40.605678Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.payments (id, business_id, legacy_firebase_id, sale_id, cash_session_id, method, amount, status, reference, paid_at, metadata, created_at, updated_at)
values ('3b2eaab6-d5aa-523c-bb61-2e6815e4a07e', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'uorxuBjcBEZfCGzvDlCM', 'cda5fd91-c0ee-5098-ad70-469dcd7b3fd8', null, 'ticket_wallet', 27000, 'completed', '', '2026-05-14T16:13:24.713Z'::timestamptz, '{"firebase":{"changeAmount":0,"change_amount":0,"business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","customerId":"5y5Hefq4dhQ3G130kmaX","ticket_units":2,"cash_received":0,"cash_session_id":null,"saleId":"9huDsUNzlrnuD2qDkweD","receivedBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"affects_cash_register":false,"cashSessionId":null,"sale_id":"9huDsUNzlrnuD2qDkweD","cashReceived":0,"affectsCashRegister":false,"customer_id":"5y5Hefq4dhQ3G130kmaX","received_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"reference":"","status":"completed","amount":27000,"createdAt":"2026-05-14T16:13:24.713Z","ticketUnits":2,"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","method":"ticket_wallet"}}'::jsonb, '2026-05-14T16:13:24.713Z'::timestamptz, '2026-05-14T16:13:24.800054Z'::timestamptz)
on conflict (id) do update set
  sale_id = excluded.sale_id,
  cash_session_id = excluded.cash_session_id,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  reference = excluded.reference,
  paid_at = excluded.paid_at,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('0290c9fc-13e5-553e-95d9-8d6fc9d6a114', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'HW3fOcdkuCrzG742AJwo', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '4f2ceec0-fd8d-5a08-a647-9065967ffa64', '2c127416-8de2-54b5-9165-4f9887f755b7', 'sale_income', 'nequi', 27000, 'valid', 'Venta POS Barra', '{"firebase":{"paymentId":"r0vHFPR7bRjlojojPXNs","source_type":"sale","sourceId":"9C8xXyC8zEXEPvwuNnAM","description":"Venta POS Barra","created_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"method":"nequi","type":"sale_income","source_id":"9C8xXyC8zEXEPvwuNnAM","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","amount":27000,"sale_id":"9C8xXyC8zEXEPvwuNnAM","sourceType":"sale","status":"valid","payment_id":"r0vHFPR7bRjlojojPXNs","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"saleId":"9C8xXyC8zEXEPvwuNnAM","createdAt":"2026-05-13T19:19:40.515Z","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3"}}'::jsonb, '2026-05-13T19:19:40.515Z'::timestamptz, '2026-05-13T19:19:40.605678Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('c2e73e06-596c-551c-938b-89eefe69bfb6', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'NZKxguQpzdx4RefEy0Tq', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '6e22ee68-453f-5520-9a1a-57d5154045b3', '2fb5b355-7258-5717-b129-7d46c1ab44f1', 'sale_income', 'cash', 2000, 'valid', 'Venta POS Venta Rapida / Para llevar', '{"firebase":{"source_type":"sale","sourceId":"1HSXO5sjRySzI91b1DYH","created_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"description":"Venta POS Venta Rapida / Para llevar","method":"cash","paymentId":"5Wbt5ogbhzqZI0I1s6ZA","type":"sale_income","source_id":"1HSXO5sjRySzI91b1DYH","payment_id":"5Wbt5ogbhzqZI0I1s6ZA","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","amount":2000,"status":"valid","sourceType":"sale","sale_id":"1HSXO5sjRySzI91b1DYH","createdAt":"2026-05-13T17:11:34.832Z","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","saleId":"1HSXO5sjRySzI91b1DYH"}}'::jsonb, '2026-05-13T17:11:34.832Z'::timestamptz, '2026-05-13T17:11:34.930523Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('59f080af-45fe-5e4c-ba66-4e58374c00a7', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'T4XecFHC8IvgPNN1RCiX', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', null, null, 'opening', 'cash', 0, 'valid', 'Base inicial de caja', '{"firebase":{"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","createdAt":"2026-05-13T16:55:21.533Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","amount":0,"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","sourceType":"cash_session","status":"valid","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdBy":{"id":"","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"source_id":"YUv8HDxGq3rBKRJ4dlm9","type":"opening_balance","description":"Base inicial de caja","created_by":{"name":"Johan Kattheryne","id":"","email":"katteryneramos@gmail.com"},"sourceId":"YUv8HDxGq3rBKRJ4dlm9","source_type":"cash_session","method":"cash"}}'::jsonb, '2026-05-13T16:55:21.533Z'::timestamptz, '2026-05-13T16:55:21.589122Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('a7c720d4-fb09-5dfc-9a86-6b447a366450', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'UsIaARNkmRkpja8Cphg1', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '6e22ee68-453f-5520-9a1a-57d5154045b3', 'd6d0cb80-1e51-527e-8691-b86f72d9cc80', 'sale_income', 'nequi', 18000, 'valid', 'Venta POS Venta Rapida / Para llevar', '{"firebase":{"createdAt":"2026-05-13T17:11:34.832Z","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","saleId":"1HSXO5sjRySzI91b1DYH","payment_id":"fFymIWQE28gz8pLIFrNJ","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"amount":18000,"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","status":"valid","sourceType":"sale","sale_id":"1HSXO5sjRySzI91b1DYH","type":"sale_income","source_id":"1HSXO5sjRySzI91b1DYH","source_type":"sale","sourceId":"1HSXO5sjRySzI91b1DYH","description":"Venta POS Venta Rapida / Para llevar","created_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"method":"nequi","paymentId":"fFymIWQE28gz8pLIFrNJ"}}'::jsonb, '2026-05-13T17:11:34.832Z'::timestamptz, '2026-05-13T17:11:34.930523Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('a5bb856f-3cdb-5b65-bb86-72f925568254', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'X4d3Y4AyAZcuTlnjVzuV', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'c818c5b8-a8a5-5ace-9954-6fc04f31a06b', '7ff80436-284b-590e-a9f7-6b34016aae2f', 'sale_income', 'cash', 500, 'valid', 'Venta POS Venta Rapida / Para llevar', '{"firebase":{"createdAt":"2026-05-13T18:58:52.944Z","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","saleId":"8BanRG5OTLSnWls8Dscd","payment_id":"JDDQ9DB642xGUn5bJcc3","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"amount":500,"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","sale_id":"8BanRG5OTLSnWls8Dscd","status":"valid","sourceType":"sale","type":"sale_income","source_id":"8BanRG5OTLSnWls8Dscd","sourceId":"8BanRG5OTLSnWls8Dscd","source_type":"sale","description":"Venta POS Venta Rapida / Para llevar","created_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"method":"cash","paymentId":"JDDQ9DB642xGUn5bJcc3"}}'::jsonb, '2026-05-13T18:58:52.944Z'::timestamptz, '2026-05-13T18:58:53.039941Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('f0894d6b-5b4a-512f-8b69-a0212d17c9eb', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'Z59zw1tB6f46l4wa4C4U', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '2fb429ce-09ba-5d9c-82f6-39bfc20730a2', '95d67db6-58d5-5470-aa55-25dcf9e9fa4c', 'debt_payment', 'cash', 6000, 'valid', 'Abono a cartera Vanessa', '{"firebase":{"saleId":"IICa0S26bV044sD415Qg","createdAt":"2026-05-13T18:07:37.553Z","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","amount":6000,"sale_id":"IICa0S26bV044sD415Qg","sourceType":"account_receivable","status":"valid","payment_id":"35uSPuC4o5mhcWRzmX0h","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdBy":null,"receivableId":null,"type":"debt_payment_income","source_id":"IICa0S26bV044sD415Qg","paymentId":"35uSPuC4o5mhcWRzmX0h","sourceId":"IICa0S26bV044sD415Qg","source_type":"account_receivable","receivable_id":null,"description":"Abono a cartera Vanessa","created_by":null,"method":"cash"}}'::jsonb, '2026-05-13T18:07:37.553Z'::timestamptz, '2026-05-13T18:07:37.611769Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('1c889782-41b4-5a43-9356-66c59e1c03ee', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'ZNRL7Bg4YdRMT15Lq7YI', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '62622a50-e53b-579e-8d44-4334cc97021d', '61c73b8f-b66f-54e6-8b2a-dc87ea553698', 'sale_income', 'nequi', 13500, 'valid', 'Venta POS Mesa blanca', '{"firebase":{"type":"sale_income","source_id":"HFms3meDUAUOAt9nZo2R","source_type":"sale","sourceId":"HFms3meDUAUOAt9nZo2R","description":"Venta POS Mesa blanca","created_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"method":"nequi","paymentId":"3SOGrbz0gjrhN95D38Vq","createdAt":"2026-05-13T19:05:21.646Z","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","saleId":"HFms3meDUAUOAt9nZo2R","payment_id":"3SOGrbz0gjrhN95D38Vq","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","amount":13500,"sale_id":"HFms3meDUAUOAt9nZo2R","sourceType":"sale","status":"valid"}}'::jsonb, '2026-05-13T19:05:21.646Z'::timestamptz, '2026-05-13T19:05:21.740504Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('de766339-cf7c-5052-821d-6cb72d8d1a19', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'gxHqwCSlWxzrDa0BD3vb', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '09f55426-9a55-5ffd-be27-c583343d3680', '336aaafd-9d8b-5940-af9c-342360ad407c', 'debt_payment', 'cash', 29500, 'valid', 'Abono a cartera El mono', '{"firebase":{"source_type":"account_receivable","sourceId":"9i2gD0W1CqjQIA5nko0f","description":"Abono a cartera El mono","created_by":null,"receivable_id":null,"method":"cash","paymentId":"gWemRLulLiGyFZe1YPly","type":"debt_payment_income","source_id":"9i2gD0W1CqjQIA5nko0f","payment_id":"gWemRLulLiGyFZe1YPly","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdBy":null,"receivableId":null,"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","amount":29500,"sale_id":"9i2gD0W1CqjQIA5nko0f","sourceType":"account_receivable","status":"valid","createdAt":"2026-05-13T16:55:32.357Z","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","saleId":"9i2gD0W1CqjQIA5nko0f"}}'::jsonb, '2026-05-13T16:55:32.357Z'::timestamptz, '2026-05-13T16:55:32.497061Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('7466d997-680d-5029-ad9a-e172194a22e0', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'j9JIZRwwSNuJYXgkVK83', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'a06b2656-f512-503c-9a39-bf0bb8c6742e', '531e26f6-0c8f-5f0e-bade-b1113608dc56', 'sale_income', 'nequi', 4000, 'valid', 'Venta POS Panca', '{"firebase":{"createdAt":"2026-05-13T18:47:10.528Z","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","saleId":"3dn57sfKxZNxQtupoog1","payment_id":"chbhjVpV4id76A8i8lix","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","createdBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","amount":4000,"sale_id":"3dn57sfKxZNxQtupoog1","sourceType":"sale","status":"valid","type":"sale_income","source_id":"3dn57sfKxZNxQtupoog1","source_type":"sale","sourceId":"3dn57sfKxZNxQtupoog1","description":"Venta POS Panca","created_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"method":"nequi","paymentId":"chbhjVpV4id76A8i8lix"}}'::jsonb, '2026-05-13T18:47:10.528Z'::timestamptz, '2026-05-13T18:47:10.658940Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('85089bda-6e21-525f-b5ad-890f4a90421f', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'nP8GRHiKLz4Zyv6EeenT', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '8ace678c-085e-59ab-b5d3-605fa7624889', '950bf858-e19f-5fa0-89c4-2f0c69e2106b', 'sale_income', 'nequi', 18000, 'valid', 'Venta POS Mesa blanca', '{"firebase":{"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","amount":18000,"sourceType":"sale","status":"valid","sale_id":"Jo8XYewwrwqCp7FHJ4El","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","payment_id":"d2KbW8kirLIfCJ0IqdFD","createdBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"saleId":"Jo8XYewwrwqCp7FHJ4El","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","createdAt":"2026-05-13T17:21:30.566Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paymentId":"d2KbW8kirLIfCJ0IqdFD","description":"Venta POS Mesa blanca","created_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"source_type":"sale","sourceId":"Jo8XYewwrwqCp7FHJ4El","method":"nequi","source_id":"Jo8XYewwrwqCp7FHJ4El","type":"sale_income"}}'::jsonb, '2026-05-13T17:21:30.566Z'::timestamptz, '2026-05-13T17:21:30.649029Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('a97530bb-014f-5853-9f28-8ace8e95c800', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'qqPnG3fhfaTpxJpulhWX', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'aa57239f-9d27-5b0d-b0e2-2ca89ab1dd8c', 'f567c4fb-5426-530a-ab59-1814df402379', 'sale_income', 'cash', 32000, 'valid', 'Venta POS Mesa blanca', '{"firebase":{"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","amount":32000,"sale_id":"m6U0cwGB2B1XbJyzRZ98","sourceType":"sale","status":"valid","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","payment_id":"HNDbiwbmLyuF0ke9SNgL","createdBy":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"saleId":"m6U0cwGB2B1XbJyzRZ98","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","createdAt":"2026-05-13T18:41:19.930Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paymentId":"HNDbiwbmLyuF0ke9SNgL","description":"Venta POS Mesa blanca","created_by":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"source_type":"sale","sourceId":"m6U0cwGB2B1XbJyzRZ98","method":"cash","source_id":"m6U0cwGB2B1XbJyzRZ98","type":"sale_income"}}'::jsonb, '2026-05-13T18:41:19.930Z'::timestamptz, '2026-05-13T18:41:20.012286Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('4cd38c4d-f09f-55b8-ad75-592bfe94d3fb', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'tW6WKO9oBsf8QVROuIwR', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '0e55c9c1-6351-558a-9015-1954087ae237', '4dd1cf30-aea1-5162-89cb-793150b553b7', 'sale_income', 'cash', 18000, 'valid', 'Venta POS Mesa blanca', '{"firebase":{"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","amount":18000,"sourceType":"sale","status":"valid","sale_id":"Uzlqce9dB3Sim2plxOdU","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","payment_id":"MlIdkwfQpgh5xjI4oecv","createdBy":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"saleId":"Uzlqce9dB3Sim2plxOdU","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","createdAt":"2026-05-13T18:07:22.733Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","paymentId":"MlIdkwfQpgh5xjI4oecv","description":"Venta POS Mesa blanca","created_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"source_type":"sale","sourceId":"Uzlqce9dB3Sim2plxOdU","method":"cash","source_id":"Uzlqce9dB3Sim2plxOdU","type":"sale_income"}}'::jsonb, '2026-05-13T18:07:22.733Z'::timestamptz, '2026-05-13T18:07:22.823959Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('f9de2b46-62f7-5da8-a370-155eb3ae4428', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'v7v72DhRuv9dQbm5REns', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'a278eb09-8ff9-5ddd-ae5a-0a75ad6a766a', '31edb2e4-7ba3-56ab-9986-d158c2ebecba', 'sale_income', 'cash', 19000, 'valid', 'Venta POS Mesa de madera', '{"firebase":{"paymentId":"MKCeoFWa3PY8TCul30vD","method":"cash","description":"Venta POS Mesa de madera","created_by":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"source_type":"sale","sourceId":"HizqMalQ5EOgHSUsTdmh","source_id":"HizqMalQ5EOgHSUsTdmh","type":"sale_income","sale_id":"HizqMalQ5EOgHSUsTdmh","sourceType":"sale","status":"valid","amount":19000,"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","createdBy":{"name":"Johan Kattheryne","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com"},"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","payment_id":"MKCeoFWa3PY8TCul30vD","saleId":"HizqMalQ5EOgHSUsTdmh","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","createdAt":"2026-05-13T18:11:45.237Z"}}'::jsonb, '2026-05-13T18:11:45.237Z'::timestamptz, '2026-05-13T18:11:45.385845Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('c4ad58d9-53a7-5705-a7ed-f49dfd436509', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'xdI17uloTLdIznEFvvzw', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', 'c818c5b8-a8a5-5ace-9954-6fc04f31a06b', '79a350c3-2451-5a70-b81a-232cf3ef3a80', 'sale_income', 'nequi', 6000, 'valid', 'Venta POS Venta Rapida / Para llevar', '{"firebase":{"cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","createdAt":"2026-05-13T18:58:52.944Z","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","saleId":"8BanRG5OTLSnWls8Dscd","businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","payment_id":"PxmgaCMWmWaq68ldfUhI","createdBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","amount":6000,"sale_id":"8BanRG5OTLSnWls8Dscd","sourceType":"sale","status":"valid","source_id":"8BanRG5OTLSnWls8Dscd","type":"sale_income","description":"Venta POS Venta Rapida / Para llevar","created_by":{"email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","name":"Johan Kattheryne"},"source_type":"sale","sourceId":"8BanRG5OTLSnWls8Dscd","method":"nequi","paymentId":"PxmgaCMWmWaq68ldfUhI"}}'::jsonb, '2026-05-13T18:58:52.944Z'::timestamptz, '2026-05-13T18:58:53.039941Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

insert into public.cash_movements (id, business_id, legacy_firebase_id, cash_session_id, sale_id, payment_id, type, method, amount, status, description, metadata, created_at, updated_at)
values ('28b54e71-f01c-56c4-a73d-3b5a9d2b6458', 'c08a64ca-23dd-4599-b680-6192d14676aa', 'ymqF2gX70I8YbrGIpUDj', '6b1fa39b-fc80-546a-858b-ccf0b1e59bc7', '174cde19-f384-5795-8d8a-49ed6fbe758c', 'cafa3d9b-d6d6-5646-b877-1c11c6239187', 'sale_income', 'nequi', 13500, 'valid', 'Venta POS Mesa larga', '{"firebase":{"source_id":"f8bw0BCQHqNLqGyThaeY","type":"sale_income","method":"nequi","description":"Venta POS Mesa larga","created_by":{"name":"Johan Kattheryne","email":"katteryneramos@gmail.com","id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3"},"sourceId":"f8bw0BCQHqNLqGyThaeY","source_type":"sale","paymentId":"jkeu4DmWfrQNeokwkm9a","business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","cashSessionId":"YUv8HDxGq3rBKRJ4dlm9","createdAt":"2026-05-13T18:37:37.868Z","saleId":"f8bw0BCQHqNLqGyThaeY","createdBy":{"id":"QFVrzOvmv0hSqlTYbYMEFS8UCPA3","email":"katteryneramos@gmail.com","name":"Johan Kattheryne"},"businessId":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","payment_id":"jkeu4DmWfrQNeokwkm9a","sale_id":"f8bw0BCQHqNLqGyThaeY","sourceType":"sale","status":"valid","cash_session_id":"YUv8HDxGq3rBKRJ4dlm9","amount":13500}}'::jsonb, '2026-05-13T18:37:37.868Z'::timestamptz, '2026-05-13T18:37:38.064981Z'::timestamptz)
on conflict (id) do update set
  cash_session_id = excluded.cash_session_id,
  sale_id = excluded.sale_id,
  payment_id = excluded.payment_id,
  type = excluded.type,
  method = excluded.method,
  amount = excluded.amount,
  status = excluded.status,
  description = excluded.description,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;



insert into public.audit_logs (business_id, user_id, module, action, entity_type, entity_id, new_value, reason, created_at)
values ('c08a64ca-23dd-4599-b680-6192d14676aa', (select id from public.profiles where email = 'katteryneramos@gmail.com' limit 1), 'migration', 'firebase.import', 'business', 'c08a64ca-23dd-4599-b680-6192d14676aa', '{"firebase_business_id":"business_QFVrzOvmv0hSqlTYbYMEFS8UCPA3","counts":{"product_categories":11,"suppliers":0,"customers":9,"products":25,"sales":73,"sale_items":22,"payments":20,"cash_sessions":4,"cash_movements":15,"inventory_movements":0}}'::jsonb, 'Importacion inicial desde Firebase export', now());



commit;



-- Quick verification:

select 'products' as table_name, count(*) from public.products where business_id = 'c08a64ca-23dd-4599-b680-6192d14676aa'

union all select 'customers', count(*) from public.customers where business_id = 'c08a64ca-23dd-4599-b680-6192d14676aa'

union all select 'sales', count(*) from public.sales where business_id = 'c08a64ca-23dd-4599-b680-6192d14676aa'

union all select 'payments', count(*) from public.payments where business_id = 'c08a64ca-23dd-4599-b680-6192d14676aa'

union all select 'cash_sessions', count(*) from public.cash_sessions where business_id = 'c08a64ca-23dd-4599-b680-6192d14676aa'

union all select 'cash_movements', count(*) from public.cash_movements where business_id = 'c08a64ca-23dd-4599-b680-6192d14676aa';
