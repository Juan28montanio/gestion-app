# Supabase RPC Migration Plan

This app keeps critical writes in PostgreSQL RPC functions or Supabase Edge Functions so they remain atomic and protected by server-side checks.

## High Priority

1. `close_sale`
   - Replaces POS sale closing flows.
   - Initial draft exists in `rpc-core.sql`.
   - Creates `sales`, `sale_items`, `payments`, `cash_movements` and `audit_logs`.
   - Pending hardening: inventory impact, customer debt rules, ticket wallet rules and server-side recalculation of totals.

2. `open_cash_session`
   - Ensures only one open cash session per business unless a future setting allows otherwise.
   - Creates audit log and opening cash movement.
   - Initial draft exists in `rpc-core.sql`.

3. `close_cash_session`
   - Calculates expected cash from movements.
   - Locks the session, stores counted/difference values and writes audit log.
   - Initial draft exists in `rpc-core.sql`.

4. `confirm_purchase`
   - Applies supplier purchase impact.
   - Updates stock and average cost.
   - Creates inventory movements, payable/cash movement if needed and audit log.

5. `reverse_inventory_impact`
   - Reverses sale or purchase inventory impact without deleting historical rows.
   - Keeps append-only movement history.

## Medium Priority

6. `consume_meal_ticket`
   - Atomically decreases ticket/customer balance.
   - Creates consumption and audit records.

7. `sell_meal_ticket`
   - Creates ticket sale, payment, customer wallet updates and cash movement.

8. `transfer_table_session`
   - Moves an active table session/order between tables.
   - Prevents conflicting active sessions on target table.

9. `send_order_to_kitchen`
   - Creates order items, kitchen tickets and table events in one transaction.

10. `reset_business_workspace`
    - Supabase-side reset operation for controlled workspace cleanup.
    - Must require owner/admin role and delete or archive business-scoped operational data.

## Lower Priority

11. `bootstrap_business_for_current_user`
    - Implemented in `bootstrap.sql` as the initial safe bridge for first business creation.
    - Creates/updates `profiles`, creates `businesses`, owner `business_users`, default settings and audit log.

12. `seed_demo_data`
    - Seeds demo records with stable test IDs or generated UUIDs.

13. `cleanup_demo_data`
    - Removes demo rows only, never real operational rows.

14. `write_audit_log`
    - Optional helper RPC to centralize audit log shape and actor extraction.

## Design Notes

- Prefer `security definer` SQL functions with explicit role checks using `business_users`.
- Keep append-only tables for `audit_logs`, `cash_movements` and `inventory_movements`.
- Return normalized rows shaped for the existing service layer to reduce UI churn.
- Avoid trusting client-calculated totals for final sale, cash and inventory state.
- Preserve imported source IDs in `legacy_firebase_id` columns until reconciliation is complete.
