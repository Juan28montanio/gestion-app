# Fase 2 Rentabilidad - QA, despliegue y demo

## Estado implementado

- Servicios frontend conectados a Supabase:
  - `recipeBookService` usa `create_or_update_technical_sheet`, `recalculate_product_cost` y tablas `technical_sheets`.
  - `salesGateway` centraliza cobros POS en `close_sale_with_inventory_explosion`.
  - `salesService` ya no usa fallback legacy para cierre POS.
- UX de fichas tecnicas:
  - modulo `technical-sheets-module`;
  - tarjetas con estado, costo por porcion, precio sugerido, food cost y margen;
  - editor con tabs, componentes, rendimiento y preview financiero;
  - `data-testid` estables para E2E.
- POS/inventario:
  - venta preparada conserva `product_id`, `technical_sheet_id`, cantidad, precio y subtotal;
  - errores de stock/RPC/permisos se normalizan a mensajes de negocio.
- Seguridad/RLS:
  - SQL local de rentabilidad habilita RLS en tablas nuevas;
  - RPCs sensibles llaman `assert_profitability_role`;
  - test SQL agrega contrato: cajero no crea fichas ni recalcula costos.
- QA:
  - `e2e/smartprofit-profitability-flows.e2e.spec.ts` ya no tiene `test.skip`;
  - crea datos E2E marcados con `metadata.e2e = true`;
  - valida ficha, venta con explosion, snapshot, reversa y stock insuficiente.

## Estado de Supabase remoto

Validacion actualizada el 2026-08-14 contra:

```text
project-ref: dmicvtkgbyoleckykzez
business_id E2E: c08a64ca-23dd-4599-b680-6192d14676aa
```

Las RPCs de rentabilidad estan presentes y pasan contratos remotos:

- `create_or_update_technical_sheet`
- `recalculate_product_cost`
- `close_sale_with_inventory_explosion`

La suite `e2e/smartprofit-profitability-flows.e2e.spec.ts` queda en verde: 7/7.

## Historial de migraciones

El 2026-08-14 se verifico que la migracion local grande:

```text
20260813000100_smartprofit_backend.sql
```

ya existia funcionalmente en remoto aunque faltaba en el historial de `supabase_migrations`.

Accion aplicada:

- Se verificaron tablas, RPCs, RLS y politicas clave.
- Se ejecuto `npx supabase migration repair 20260813000100 --status applied --linked`.
- `npx supabase migration list --linked` quedo alineado.
- `npx supabase db push --linked --dry-run` responde `Remote database is up to date`.

## Comandos de cierre

```bash
npm run test
npm run test:sql
npm run test:smoke
npm run lint
npm run build
npx playwright test e2e/smartprofit-profitability-flows.e2e.spec.ts
npx playwright test e2e/smartprofit-critical-flows.e2e.spec.ts
```

Resultado 2026-08-14:

- `npm run test`: pasa.
- `npm run test:sql`: pasa, 116 pruebas SQL.
- `npm run test:smoke`: pasa.
- `npm run lint`: pasa sin warnings.
- `npm run build`: pasa.
- `npm run check:supabase`: pasa.
- `npm run check:supabase:rpc`: pasa, incluyendo RPCs de rentabilidad.
- `npx playwright test e2e/smartprofit-profitability-flows.e2e.spec.ts --reporter=list`: 7/7.
- `npx playwright test e2e/smartprofit-critical-flows.e2e.spec.ts --reporter=list`: 23/23.

Higiene de ventas historicas aplicada:

- Script agregado: `npm run backfill:legacy-payments`.
- Modo aplicacion: `npm run backfill:legacy-payments:apply`.
- Resultado aplicado: 31 ventas monetarias historicas reconstruidas, 38 pagos creados, $813.000 COP conciliados.
- Residual esperado: 25 ventas no monetarias en cero sin pagos asociados.

## Demo operativa en menos de 10 minutos

1. Abrir Recursos > Insumos y confirmar stock/costo de un insumo.
2. Abrir Recursos > Fichas tecnicas.
3. Crear ficha activa vinculada a un producto preparado.
4. Agregar insumo, cantidad, unidad, costo unitario, merma y porciones.
5. Revisar costo por porcion, food cost, margen y precio sugerido.
6. Vender el producto desde POS.
7. Confirmar en Supabase:
   - `inventory_movements.movement_type = 'sale_out'`;
   - `product_cost_snapshots.source_type = 'sale_close'`;
   - `sale_items.metadata.profitability_snapshot` conserva costo historico.
8. Cambiar costo del insumo y confirmar que el snapshot historico no cambia.

## Politica de stock negativo

Fase 2 debe operar por defecto con stock negativo deshabilitado:

- si falta insumo, la venta preparada se bloquea;
- la transaccion no debe crear venta parcial;
- el usuario debe ver el insumo afectado y la accion sugerida.

El stock negativo solo debe habilitarse por configuracion del negocio y quedar auditado.

## Margen historico vs margen actual

- Margen historico: se lee desde `product_cost_snapshots` o `sale_items.metadata.profitability_snapshot`.
- Margen actual: se recalcula desde ficha activa e insumos actuales.
- Cambiar el costo de un insumo no debe alterar ventas pasadas.
