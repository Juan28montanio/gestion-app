# SmartProfit Supabase Local Backend

This folder contains the reproducible Supabase CLI setup for local backend work.

## Commands

```bash
npm run supabase:start
npm run supabase:reset
npm run test:sql
npm run supabase:stop
```

`npm run test:sql` runs pgTAP tests under `supabase/tests` against the local Supabase database.
`npm run supabase:start` intentionally starts only the local Postgres database because the SQL/RPC
test suite does not need Studio, Storage, Realtime or Analytics containers.

The migration in `supabase/migrations` is assembled from the reviewable SQL modules in `database/supabase`.
Keep editing the source modules first, then regenerate the local migration when the database contract changes.

## Requirements

- Docker Desktop or Podman available on `PATH`.
- Supabase CLI from the local npm dev dependency.

Remote smoke checks still use:

```bash
npm run check:supabase
npm run check:supabase:rpc
```
