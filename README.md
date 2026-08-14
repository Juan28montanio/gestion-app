# SmartProfit

SmartProfit es una app operativa para restaurantes, cafes y negocios de comida. El foco actual es operar con Supabase como backend principal: autenticacion, base de datos PostgreSQL, storage y RPCs transaccionales.

## Stack Operativo

- React 19 + Vite 6
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Realtime para modulos operativos
- Vercel para hosting
- Tailwind CSS
- Vitest y ESLint

## Instalacion

```bash
npm install
```

Crea `.env` a partir de `.env.example`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_DATA_BACKEND=supabase
VITE_PRODUCTS_BACKEND=supabase
VITE_CUSTOMERS_BACKEND=supabase
VITE_SALES_BACKEND=supabase
```

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run test:smoke
npm run check:supabase
npm run check:supabase:rpc
npm run build
npm run preview
```

## Swagger / OpenAPI

La documentacion del backend Supabase esta en `docs/openapi.json` y cubre las RPCs publicas de caja, ventas, salon, finanzas y rentabilidad.

Para verla en Swagger UI, abre `docs/swagger.html` en el navegador o sirve el repo con cualquier servidor estatico. Las llamadas documentadas usan el formato PostgREST de Supabase:

```bash
POST https://<project-ref>.supabase.co/rest/v1/rpc/<rpc_name>
Authorization: Bearer <supabase-jwt>
apikey: <supabase-anon-or-publishable-key>
```

## Supabase

Los SQL base viven en `database/supabase/`:

- `schema.sql`: modelo principal.
- `rls.sql`: politicas RLS por negocio.
- `rpc-core.sql`: RPCs criticas de ventas y caja.
- `schema-operational.sql`: mesas, sesiones de mesa y cocina.
- `rpc-operational.sql`: operaciones de salon.

Para actualizar el cierre de caja con efectivo fisico por sesion, aplicar:

```bash
database/supabase/patch-close-cash-session-cash-only.sql
```

## Modelo Principal

- `profiles`: perfiles de usuarios autenticados.
- `businesses`: negocios.
- `business_users`: miembros, roles y estado.
- `business_settings`: configuracion operativa.
- `products`, `product_categories`: catalogo.
- `customers`: clientes.
- `sales`, `sale_items`, `payments`: ventas y pagos.
- `cash_sessions`, `cash_movements`: caja y arqueo.
- `tables`, `table_sessions`, `kitchen_tickets`, `table_events`: salon operativo.
- `audit_logs`: auditoria.

## Operacion

- El frontend no debe escribir datos criticos directamente si existe una RPC para esa accion.
- Caja y ventas deben pasar por RPCs para mantener atomicidad.
- Toda tabla multiempresa debe filtrar por `business_id` y estar protegida por RLS.
- Las acciones aun no migradas a RPC deben quedar bloqueadas con error explicito, no con fallback externo.
