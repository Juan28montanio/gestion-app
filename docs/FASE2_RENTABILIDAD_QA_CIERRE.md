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

## Bloqueo detectado en Supabase remoto

El frontend y la migracion local contienen el motor de rentabilidad, pero el Supabase configurado en `.env` no tiene desplegada la RPC:

```text
public.create_or_update_technical_sheet
```

Playwright falla con:

```text
Could not find the function public.create_or_update_technical_sheet(...) in the schema cache
```

Esto significa que el contrato E2E de rentabilidad esta listo, pero el backend remoto debe sincronizarse antes de que la suite quede en verde.

## Paso de despliegue requerido

Autenticarse con Supabase CLI y aplicar la migracion backend:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Luego refrescar PostgREST si el schema cache tarda en reconocer funciones nuevas:

```sql
notify pgrst, 'reload schema';
```

Si se aplica manualmente desde SQL Editor, ejecutar en este orden:

1. `database/supabase/schema-profitability.sql`
2. `database/supabase/rpc-profitability.sql`
3. `database/supabase/security-grants.sql`

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
