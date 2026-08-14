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
grant execute on function public.settle_account_payable(uuid, uuid, numeric, text, text, text) to authenticated;;
