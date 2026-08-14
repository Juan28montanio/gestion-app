create index if not exists payments_cash_session_id_idx on public.payments(cash_session_id);

create index if not exists cash_movements_cash_session_id_idx on public.cash_movements(cash_session_id);
create index if not exists cash_movements_sale_id_idx on public.cash_movements(sale_id);
create index if not exists cash_movements_payment_id_idx on public.cash_movements(payment_id);

create index if not exists sales_cash_session_id_idx on public.sales(cash_session_id);
create index if not exists sales_customer_id_idx on public.sales(customer_id);

create index if not exists purchases_supplier_id_idx on public.purchases(supplier_id);
create index if not exists purchases_created_by_idx on public.purchases(created_by);
create index if not exists purchases_confirmed_by_idx on public.purchases(confirmed_by);
create index if not exists purchases_cancelled_by_idx on public.purchases(cancelled_by);

create index if not exists purchase_items_business_id_idx on public.purchase_items(business_id);
create index if not exists purchase_items_product_id_idx on public.purchase_items(product_id);

create index if not exists accounts_payable_supplier_id_idx on public.accounts_payable(supplier_id);;
