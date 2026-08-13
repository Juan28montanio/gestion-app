# Prompt para implementar el motor de rentabilidad SmartProfit - Fase 2

## Prompt

Actua como senior full-stack engineer en el proyecto SmartProfit. Implementa el siguiente paso tecnico recomendado del roadmap: persistencia real de fichas tecnicas, snapshots historicos de costo/margen y explosion de insumos al cerrar ventas.

Contexto del proyecto:

- SmartProfit es una SPA React + Vite con Supabase/PostgreSQL como backend.
- El producto usa modelo multiempresa por `business_id`.
- Las operaciones criticas deben pasar por RPCs SQL transaccionales.
- Ya existen modulos de POS, caja, productos, insumos, compras, ventas y pruebas E2E.
- Ya existe costeo frontend en:
  - `src/features/resources/recipes/technicalSheetCalculations.js`
  - `src/features/resources/recipes/recipeBookHelpers.js`
  - `src/services/recipeBookService.js`
- Actualmente `recipeBookService` bloquea escrituras y devuelve fichas vacias.
- `close_sale` crea `sales`, `sale_items`, `payments`, `cash_movements` y `audit_logs`, pero no descuenta insumos ni guarda snapshot normalizado de costo/margen.
- La suite E2E de contrato de rentabilidad ya existe en:
  - `e2e/smartprofit-profitability-flows.e2e.spec.ts`

Objetivo:

Implementar el backend minimo viable para que SmartProfit pueda:

1. Crear y editar fichas tecnicas persistentes en Supabase.
2. Versionar fichas tecnicas activas.
3. Calcular y persistir costo actual de producto preparado.
4. Cerrar una venta de producto preparado descontando insumos asociados.
5. Guardar costo historico, food cost y margen en cada item vendido.
6. Manejar stock insuficiente con bloqueo transaccional o auditoria explicita.

Archivos a revisar primero:

- `docs/ROADMAP_SAAS_SMARTPROFIT_4_FASES.md`
- `docs/STACK_TECNICO_SMARTPROFIT.md`
- `docs/E2E_PHASE2_CRITICAL_FLOWS.md`
- `e2e/smartprofit-profitability-flows.e2e.spec.ts`
- `src/services/recipeBookService.js`
- `src/features/resources/recipes/technicalSheetCalculations.js`
- `src/features/resources/recipes/recipeBookHelpers.js`
- `src/services/supplyService.js`
- `src/services/productService.js`
- `src/domain/sales.js`
- `src/services/supabase/salesService.js`
- `database/supabase/schema.sql`
- `database/supabase/schema-inventory.sql`
- `database/supabase/rpc-core.sql`
- `database/supabase/rls.sql`
- `database/supabase/security-grants.sql`

Implementacion requerida:

1. Disenar y agregar SQL para tablas:
   - `technical_sheets`
   - `technical_sheet_items`
   - `technical_sheet_versions`
   - `product_cost_snapshots`

2. Agregar indices por:
   - `business_id`
   - `product_id`
   - `technical_sheet_id`
   - `technical_sheet_version_id`
   - `created_at`

3. Agregar RLS por `business_id` usando helpers existentes:
   - `is_business_member(target_business_id)`
   - `has_business_role(target_business_id, allowed_roles)` cuando aplique

4. Agregar grants seguros en `security-grants.sql`.

5. Implementar RPCs:
   - `create_or_update_technical_sheet`
   - `activate_technical_sheet_version`
   - `recalculate_product_cost`
   - `close_sale_with_inventory_explosion`
   - `reverse_inventory_explosion`

6. La RPC de cierre debe:
   - validar membresia del negocio;
   - crear la venta atomica;
   - insertar items y pagos;
   - para cada item con ficha tecnica activa, leer componentes;
   - descontar insumos desde `supplies.current_stock`;
   - crear `inventory_movements` con `movement_type = 'sale_out'` y `direction = 'out'`;
   - guardar snapshot historico por item vendido en `sale_items.metadata`, incluyendo:
     - `technical_sheet_id`
     - `technical_sheet_version_id`
     - `unit_cost_snapshot`
     - `total_cost_snapshot`
     - `sale_price_snapshot`
     - `food_cost_percent_snapshot`
     - `gross_margin_snapshot`
     - `gross_margin_percent_snapshot`
     - `ingredients_snapshot`
   - crear registro en `product_cost_snapshots`;
   - dejar auditoria clara en `audit_logs`.

7. Definir politica de stock:
   - si el negocio no permite stock negativo, bloquear con error claro;
   - si lo permite, registrar `inventory_movements.metadata.stock_went_negative = true`.

8. Conectar `recipeBookService` a Supabase:
   - listar fichas por negocio;
   - crear/actualizar ficha via RPC;
   - desactivar ficha;
   - refrescar costos cuando cambian insumos.

9. Ajustar `src/domain/sales.js` y `src/services/supabase/salesService.js` para usar la nueva RPC cuando la venta tenga productos con impacto `technical_sheet`.

10. Actualizar o activar tests:
   - convertir los `test.skip` relevantes de `e2e/smartprofit-profitability-flows.e2e.spec.ts` en tests activos cuando la funcionalidad exista;
   - agregar tests unitarios para mapeo de payload si se modifica;
   - agregar SQL/RPC checks no destructivos o con datos temporales aislados.

Restricciones:

- No usar escrituras directas desde frontend para operaciones criticas de ventas/inventario.
- No exponer `service_role` en frontend.
- No romper las suites existentes:
  - `e2e/smartprofit.e2e.spec.ts`
  - `e2e/smartprofit-critical-flows.e2e.spec.ts`
- No depender de datos inestables sin documentarlo.
- Si se requiere data de prueba, usar datos con prefijo `e2e_profitability_` y cleanup transaccional o reversible.
- Mantener trazabilidad: preferir movimientos compensatorios/reversas antes que ediciones destructivas.

Criterios de aceptacion:

- Se puede crear una ficha tecnica persistente asociada a un producto.
- El costo por porcion y precio sugerido se recalculan desde insumos reales.
- Al vender un producto preparado, baja el stock de los insumos relacionados.
- La venta guarda costo/margen historico aunque luego cambie el costo del insumo.
- El sistema maneja stock insuficiente segun la politica definida.
- Las pruebas E2E/SQL de rentabilidad pasan al menos para un flujo feliz.
- `npm run test`, `npm run lint`, `npm run build`, `npm run check:supabase`, `npm run check:supabase:rpc` pasan o documentan bloqueos externos con precision.

Verificacion obligatoria:

```bash
npm run test
npx playwright test e2e/smartprofit-profitability-flows.e2e.spec.ts
npx playwright test e2e/smartprofit.e2e.spec.ts
npx playwright test e2e/smartprofit-critical-flows.e2e.spec.ts
npm run lint
npm run build
npm run check:supabase
npm run check:supabase:rpc
```

Entrega esperada:

- SQL aplicado o archivos SQL actualizados.
- Servicios frontend conectados a Supabase/RPC.
- Tests activos o pendientes con razon clara.
- Resumen final con:
  - tablas/RPC creadas;
  - flujo validado;
  - bloqueos;
  - comandos ejecutados;
  - siguiente paso recomendado.

## Implementacion minima sugerida

### Tablas

- `technical_sheets`: cabecera funcional por producto/negocio.
- `technical_sheet_items`: componentes de una ficha, apuntando a `supplies` o a otra ficha base.
- `technical_sheet_versions`: snapshot versionado de yield, componentes, costos y estado activo.
- `product_cost_snapshots`: historial de costo/margen por producto y version de ficha.

### RPC principal

`close_sale_with_inventory_explosion` debe ser la frontera transaccional para venta + inventario + snapshots. Puede reutilizar la logica de `close_sale`, pero debe evitar duplicar inconsistencias: todo debe ocurrir dentro de la misma transaccion PL/pgSQL.

### Datos historicos

Cada `sale_items.metadata.client_payload` puede conservar el payload actual, pero el snapshot financiero debe quedar en claves normalizadas dentro de `sale_items.metadata.profitability_snapshot` para que reportes futuros no dependan del shape del cliente.

### Primer flujo E2E a activar

1. Crear insumo de prueba con stock suficiente.
2. Crear producto preparado de prueba.
3. Crear ficha tecnica que consume el insumo.
4. Vender el producto en POS.
5. Confirmar venta.
6. Leer Supabase:
   - `sale_items.metadata.profitability_snapshot`
   - `inventory_movements`
   - `supplies.current_stock`
7. Revertir o limpiar datos de prueba.

