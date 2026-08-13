-- Security hardening for public RPCs/functions.
-- Apply after schema.sql, rls.sql and all rpc-*.sql files.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

grant usage on schema public to anon, authenticated;

grant select on table
  public.profiles,
  public.businesses,
  public.business_users,
  public.business_settings,
  public.product_categories,
  public.suppliers,
  public.customers,
  public.products,
  public.cash_sessions,
  public.sales,
  public.sale_items,
  public.payments,
  public.cash_movements,
  public.inventory_movements,
  public.audit_logs,
  public.supply_categories,
  public.supplies,
  public.tables,
  public.table_sessions,
  public.table_orders,
  public.kitchen_tickets,
  public.table_events,
  public.purchases,
  public.purchase_items,
  public.accounts_payable
to anon;

revoke all on table
  public.technical_sheets,
  public.technical_sheet_items,
  public.technical_sheet_versions,
  public.product_cost_snapshots
from anon;

grant select, insert, update, delete on table
  public.profiles,
  public.businesses,
  public.business_users,
  public.business_settings,
  public.product_categories,
  public.suppliers,
  public.customers,
  public.products,
  public.cash_sessions,
  public.sales,
  public.sale_items,
  public.payments,
  public.cash_movements,
  public.inventory_movements,
  public.audit_logs,
  public.supply_categories,
  public.supplies,
  public.tables,
  public.table_sessions,
  public.table_orders,
  public.kitchen_tickets,
  public.table_events,
  public.purchases,
  public.purchase_items,
  public.accounts_payable,
  public.technical_sheets,
  public.technical_sheet_items,
  public.technical_sheet_versions,
  public.product_cost_snapshots
to authenticated;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

revoke execute on function public.current_business_ids() from public, anon;
revoke execute on function public.has_business_role(uuid, text[]) from public, anon;
revoke execute on function public.is_business_member(uuid) from public, anon;
revoke execute on function public.assert_business_member(uuid) from public, anon;

grant execute on function public.current_business_ids() to authenticated;
grant execute on function public.has_business_role(uuid, text[]) to authenticated;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.assert_business_member(uuid) to authenticated;

revoke execute on function public.bootstrap_business_for_current_user(text, text, text, text) from public, anon;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
grant execute on function public.bootstrap_business_for_current_user(text, text, text, text) to authenticated;

revoke execute on function public.open_cash_session(uuid, numeric, text) from public, anon;
revoke execute on function public.close_cash_session(uuid, uuid, numeric, text) from public, anon;
revoke execute on function public.close_sale(uuid, jsonb, jsonb, jsonb) from public, anon;
revoke execute on function public.settle_sale_debt(uuid, uuid, numeric, text, text, text) from public, anon;

grant execute on function public.open_cash_session(uuid, numeric, text) to authenticated;
grant execute on function public.close_cash_session(uuid, uuid, numeric, text) to authenticated;
grant execute on function public.close_sale(uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.settle_sale_debt(uuid, uuid, numeric, text, text, text) to authenticated;

revoke execute on function public.save_table_layout(uuid, uuid, jsonb) from public, anon;
revoke execute on function public.salon_assert_table_available(uuid, uuid) from public, anon;
revoke execute on function public.open_table_session(uuid, uuid, text, integer, uuid, text, text) from public, anon;
revoke execute on function public.send_order_to_kitchen(uuid, uuid, uuid, uuid, jsonb, uuid, text) from public, anon;
revoke execute on function public.update_kitchen_ticket_status(uuid, uuid, text) from public, anon;
revoke execute on function public.request_table_bill(uuid, uuid, uuid, uuid) from public, anon;
revoke execute on function public.release_clean_table(uuid, uuid) from public, anon;
revoke execute on function public.transfer_table_session(uuid, uuid, uuid, uuid, uuid) from public, anon;
revoke execute on function public.cancel_table_order_item(uuid, uuid, uuid, uuid, text, text) from public, anon;
revoke execute on function public.reassign_table_waiter(uuid, uuid, uuid, text) from public, anon;

grant execute on function public.save_table_layout(uuid, uuid, jsonb) to authenticated;
grant execute on function public.salon_assert_table_available(uuid, uuid) to authenticated;
grant execute on function public.open_table_session(uuid, uuid, text, integer, uuid, text, text) to authenticated;
grant execute on function public.send_order_to_kitchen(uuid, uuid, uuid, uuid, jsonb, uuid, text) to authenticated;
grant execute on function public.update_kitchen_ticket_status(uuid, uuid, text) to authenticated;
grant execute on function public.request_table_bill(uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.release_clean_table(uuid, uuid) to authenticated;
grant execute on function public.transfer_table_session(uuid, uuid, uuid, uuid, uuid) to authenticated;
grant execute on function public.cancel_table_order_item(uuid, uuid, uuid, uuid, text, text) to authenticated;
grant execute on function public.reassign_table_waiter(uuid, uuid, uuid, text) to authenticated;

revoke execute on function public.save_purchase(uuid, uuid, jsonb, jsonb, boolean, text) from public, anon;
revoke execute on function public.cancel_purchase(uuid, text) from public, anon;
revoke execute on function public.confirm_purchase(uuid, uuid, text) from public, anon;
revoke execute on function public.settle_account_payable(uuid, uuid, numeric, text, text, text) from public, anon;

grant execute on function public.save_purchase(uuid, uuid, jsonb, jsonb, boolean, text) to authenticated;
grant execute on function public.cancel_purchase(uuid, text) to authenticated;
grant execute on function public.confirm_purchase(uuid, uuid, text) to authenticated;
grant execute on function public.settle_account_payable(uuid, uuid, numeric, text, text, text) to authenticated;

revoke execute on function public.profitability_normalize_percent(numeric, numeric) from public, anon, authenticated;
revoke execute on function public.profitability_component_cost(numeric, numeric, numeric) from public, anon, authenticated;
revoke execute on function public.profitability_build_costing(jsonb, jsonb, numeric, numeric) from public, anon;
revoke execute on function public.assert_profitability_role(uuid, text[], text) from public, anon, authenticated;

grant execute on function public.profitability_build_costing(jsonb, jsonb, numeric, numeric) to authenticated;

revoke execute on function public.create_or_update_technical_sheet(uuid, uuid, jsonb, jsonb, boolean) from public, anon;
revoke execute on function public.activate_technical_sheet_version(uuid, uuid, uuid) from public, anon;
revoke execute on function public.recalculate_product_cost(uuid, uuid) from public, anon;
revoke execute on function public.close_sale_with_inventory_explosion(uuid, jsonb, jsonb, jsonb) from public, anon;
revoke execute on function public.reverse_inventory_explosion(uuid, uuid, text) from public, anon;

grant execute on function public.create_or_update_technical_sheet(uuid, uuid, jsonb, jsonb, boolean) to authenticated;
grant execute on function public.activate_technical_sheet_version(uuid, uuid, uuid) to authenticated;
grant execute on function public.recalculate_product_cost(uuid, uuid) to authenticated;
grant execute on function public.close_sale_with_inventory_explosion(uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.reverse_inventory_explosion(uuid, uuid, text) to authenticated;
