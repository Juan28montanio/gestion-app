# Stack tecnico SmartProfit

## Resumen ejecutivo

SmartProfit esta construido como una aplicacion web SaaS tipo SPA, con frontend en React y backend gestionado en Supabase. La arquitectura actual es un monolito frontend modular que consume servicios backend serverless: autenticacion, base de datos PostgreSQL, storage, realtime y funciones RPC expuestas por PostgREST.

Esta arquitectura es adecuada para la etapa actual del producto porque permite avanzar rapido en funcionalidad SaaS sin operar infraestructura propia. El punto clave de madurez tecnica es mantener la logica critica de negocio en PostgreSQL/RPCs y no dispersarla en multiples escrituras desde el cliente.

## Arquitectura general

### Tipo de arquitectura

- Monolito frontend modular.
- Backend as a Service con Supabase.
- Base de datos relacional centralizada en PostgreSQL.
- Separacion por dominios dentro del codigo:
  - `src/app`
  - `src/components`
  - `src/context`
  - `src/domain`
  - `src/features`
  - `src/services`
  - `src/utils`
  - `database/supabase`

### Patron principal

El frontend React consume servicios de aplicacion en `src/services`. Para operaciones simples se usan consultas Supabase directas con RLS. Para operaciones criticas, como caja, ventas, salon, compras y pagos, se usan RPCs SQL transaccionales.

## Frontend

### Lenguaje

- JavaScript moderno con ES Modules.
- JSX para componentes React.

### Framework principal

- React 19.
- React DOM 19.

### Build tool

- Vite 6.

### UI y estilos

- Tailwind CSS 4.
- PostCSS.
- Autoprefixer.
- lucide-react para iconografia.
- CSS global en `src/index.css`.

### Estructura de UI

- `src/App.jsx`: entrada principal de la aplicacion.
- `src/app/AppShell.jsx`: layout principal autenticado.
- `src/app/layout`: componentes de layout, sidebar, header, navigation mobile y boundaries.
- `src/components`: componentes operativos reutilizables.
- `src/features`: modulos funcionales de producto, como POS, finanzas y recursos.

## Backend

### Plataforma

- Supabase.

### Servicios Supabase usados

- Supabase Auth para autenticacion.
- Supabase PostgreSQL como base de datos principal.
- Supabase Storage para archivos, imagenes y recursos.
- Supabase Realtime para suscripciones a cambios operativos.
- Supabase RPC/PostgREST para operaciones transaccionales.

### Cliente backend en frontend

- `@supabase/supabase-js`.
- Cliente centralizado en `src/lib/supabaseClient.js`.

### Configuracion por entorno

Variables esperadas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_DATA_BACKEND`
- `VITE_PRODUCTS_BACKEND`
- `VITE_CUSTOMERS_BACKEND`
- `VITE_SALES_BACKEND`

## Base de datos

### Motor

- PostgreSQL sobre Supabase.

### Modelo multiempresa

La aplicacion usa un modelo multi-tenant por columna compartida:

- Tabla `businesses` para negocios.
- Tabla `business_users` para miembros y roles.
- Columna `business_id` en tablas de negocio.
- Indices compuestos por `business_id` para consultas frecuentes.
- Row Level Security para aislar datos entre negocios.

### Tablas principales

#### Identidad y negocio

- `profiles`
- `businesses`
- `business_users`
- `business_settings`

#### Catalogo

- `products`
- `product_categories`

#### Clientes

- `customers`

#### Ventas y pagos

- `sales`
- `sale_items`
- `payments`

#### Caja

- `cash_sessions`
- `cash_movements`

#### Salon y operacion

- `tables`
- `table_sessions`
- `table_orders`
- `kitchen_tickets`
- `table_events`

#### Inventario

- `supplies`
- `supply_categories`
- `inventory_movements`

#### Proveedores y compras

- `suppliers`
- `purchases`
- `purchase_items`
- `accounts_payable`

#### Auditoria

- `audit_logs`

## Seguridad

### Autenticacion

- Supabase Auth.
- Sesion persistente y auto-refresh desde el cliente Supabase.

### Autorizacion

- Row Level Security en tablas de negocio.
- Funciones auxiliares:
  - `current_business_ids()`
  - `is_business_member(target_business_id)`
  - `has_business_role(target_business_id, allowed_roles)`
  - `assert_business_member(target_business_id)`

### Modelo actual de permisos

El aislamiento multiempresa ya existe por `business_id`. La siguiente mejora recomendada es endurecer las escrituras por rol, especialmente en:

- compras
- caja
- inventario
- proveedores
- configuracion del negocio
- usuarios y roles

## RPCs y logica transaccional

### RPCs principales

#### Caja y ventas

- `open_cash_session`
- `close_cash_session`
- `close_sale`
- `settle_sale_debt`

#### Salon

- `save_table_layout`
- `open_table_session`
- `send_order_to_kitchen`
- `update_kitchen_ticket_status`
- `request_table_bill`
- `release_clean_table`
- `transfer_table_session`
- `cancel_table_order_item`
- `reassign_table_waiter`

#### Compras y finanzas

- `confirm_purchase`
- `settle_account_payable`

### Criterio tecnico

Las operaciones que afectan dinero, caja, pagos, inventario o auditoria deben ejecutarse como RPCs para mantener atomicidad, trazabilidad y consistencia.

## Modulos funcionales actuales

### Operacion

- POS.
- Mesas y salon.
- Cocina.
- Caja.
- Ventas.
- Pagos.
- Clientes.
- Tiqueteras o planes de consumo, segun flujo actual.

### Recursos y rentabilidad

- Catalogo.
- Inventario de insumos.
- Proveedores.
- Compras.
- Costeo frontend de fichas tecnicas.

### Estado de fichas tecnicas

El proyecto ya tiene calculos de ficha tecnica en frontend, incluyendo:

- costo por componente
- costo total
- costo por porcion
- precio sugerido
- food cost
- margen bruto

Sin embargo, el servicio de fichas tecnicas todavia no persiste datos en Supabase. Las escrituras estan bloqueadas hasta crear tablas/RPCs especificas.

## Testing y calidad

### Herramientas

- Vitest para pruebas unitarias.
- Playwright instalado para pruebas de navegador.
- ESLint 10 para analisis estatico.
- Scripts smoke personalizados.

### Scripts disponibles

- `npm run dev`
- `npm run lint`
- `npm run test`
- `npm run test:smoke`
- `npm run check:supabase`
- `npm run check:supabase:rpc`
- `npm run build`
- `npm run preview`

### Contratos y documentacion tecnica

- OpenAPI en `docs/openapi.json`.
- Swagger HTML en `docs/swagger.html`.
- SQL de Supabase en `database/supabase`.

## Infraestructura y despliegue

### Hosting recomendado/actual

- Vercel para hosting frontend.
- Supabase para backend gestionado.

### Ambientes recomendados

- Local.
- Staging.
- Produccion.

### Pendiente recomendado

- Migraciones versionadas con Supabase CLI.
- Backups programados.
- CI/CD con validacion automatica.
- Monitoreo de errores con Sentry o equivalente.

## Dependencias principales

### Runtime

- `@supabase/supabase-js`
- `react`
- `react-dom`
- `lucide-react`

### Desarrollo

- `vite`
- `@vitejs/plugin-react`
- `tailwindcss`
- `@tailwindcss/postcss`
- `postcss`
- `autoprefixer`
- `eslint`
- `vitest`
- `playwright`
- `globals`

## Evaluacion de madurez del stack

### Fortalezas

- Stack moderno y adecuado para SaaS temprano.
- PostgreSQL es una excelente eleccion para inventario, costos y finanzas.
- Supabase reduce complejidad operativa.
- Modelo multiempresa ya encaminado.
- RLS implementado.
- RPCs transaccionales para operaciones criticas.
- Separacion razonable por dominios y servicios.

### Debilidades actuales

- Fichas tecnicas aun no tienen persistencia backend.
- Explosion de materiales no esta integrada al cierre de ventas.
- Suscripciones y billing aun no aparecen como modulo implementado.
- Permisos por rol requieren endurecimiento.
- Falta formalizar migraciones y ambientes.
- Falta ampliar pruebas E2E de flujos completos.

### Evaluacion final

El stack actual es correcto para construir y lanzar un SaaS gastronomico. No se recomienda migrar a microservicios en esta etapa. La prioridad debe ser profundizar el modelo transaccional en Supabase/PostgreSQL, completar fichas tecnicas e inventario, endurecer RLS por rol y agregar billing cuando el flujo de valor principal este validado.

